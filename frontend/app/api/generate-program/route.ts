import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { db } from '@/db'
import { programs, clients } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { liftSessionsSchema, liftWeeksSchema, type GenerateInput, type LiftSessionsOutput, type LiftWeeksOutput, type SessionsOutput } from '@/lib/ai/schema'
import { getPromptVersion, buildLiftPrompt, buildZonesOnlyPrompt } from '@/lib/ai/prompt'
import { calculateAllTargets } from '@/lib/ai/calculate'
import { TARGET_ARI } from '@/lib/ai/constants'

type AIProvider = 'anthropic' | 'openai'

const MODELS: Record<AIProvider, string> = {
  anthropic: 'claude-opus-4-6',
  openai: 'gpt-4o',
}

export const maxDuration = 300 // Allow up to 5 minutes (retry attempts per lift)

type ZoneKey = '55' | '65' | '75' | '85' | '90' | '95'
const ZONES: ZoneKey[] = ['55', '65', '75', '85', '90', '95']
const ZONE_INTENSITY: Record<ZoneKey, number> = {
  '55': 55,
  '65': 65,
  '75': 75,
  '85': 85,
  '90': 92.5,
  '95': 95,
}

function canonicalSessionLetter(raw: unknown, fallbackIndex: number): string {
  const fallback = String.fromCharCode(65 + (fallbackIndex % 26))
  if (typeof raw !== 'string') return fallback

  const normalized = raw.trim().toUpperCase()
  if (/^[A-Z]$/.test(normalized)) return normalized

  const standalone = normalized.match(/\b([A-Z])\b/)
  if (standalone?.[1]) return standalone[1]

  const lastLetter = normalized.match(/([A-Z])[^A-Z]*$/)
  if (lastLetter?.[1]) return lastLetter[1]

  return fallback
}

function zoneFromPercentage(percentage: number): ZoneKey | null {
  const p = Number(percentage)
  if (Math.abs(p - 55) < 0.2) return '55'
  if (Math.abs(p - 65) < 0.2) return '65'
  if (Math.abs(p - 75) < 0.2) return '75'
  if (Math.abs(p - 85) < 0.2) return '85'
  if (Math.abs(p - 92.5) < 0.2) return '90'
  if (Math.abs(p - 95) < 0.2) return '95'
  return null
}

function hasUsableWeekTargets(liftCalc: Record<string, unknown>, weeks: number): boolean {
  for (let weekNum = 1; weekNum <= weeks; weekNum++) {
    const weekKey = `week_${weekNum}`
    const week = liftCalc[weekKey] as {
      total_reps?: number
      zones?: Record<ZoneKey, number>
    } | undefined
    if (!week) return false
    if (!Number.isFinite(Number(week.total_reps))) return false
    if (!week.zones || typeof week.zones !== 'object') return false
    for (const zone of ZONES) {
      if (!Number.isFinite(Number(week.zones[zone] ?? 0))) return false
    }
  }
  return true
}

function deriveBlockMetricsFromWeeks(
  liftCalc: Record<string, unknown>,
  weeks: number,
): { actualNl: number; blockAri: number } | null {
  if (!hasUsableWeekTargets(liftCalc, weeks)) return null

  let totalReps = 0
  let weightedIntensity = 0

  for (let weekNum = 1; weekNum <= weeks; weekNum++) {
    const weekKey = `week_${weekNum}`
    const week = liftCalc[weekKey] as { zones: Record<ZoneKey, number> }
    for (const zone of ZONES) {
      const reps = Number(week.zones[zone] ?? 0)
      totalReps += reps
      weightedIntensity += reps * ZONE_INTENSITY[zone]
    }
  }

  const blockAri = totalReps > 0
    ? Math.round((weightedIntensity / totalReps) * 10) / 10
    : 0

  return { actualNl: totalReps, blockAri }
}

function validateLiftAiOutput(
  lift: string,
  liftCalc: Record<string, unknown>,
  liftResult: LiftSessionsOutput,
  weeks: number,
): string[] {
  const errors: string[] = []
  const zones: ZoneKey[] = ['55', '65', '75', '85', '90', '95']

  for (let w = 1; w <= weeks; w++) {
    const weekKey = `week_${w}`
    const targetWeek = liftCalc[weekKey] as {
      total_reps: number
      zones: Record<ZoneKey, number>
      sessions: Record<string, { total: number }>
    } | undefined
    if (!targetWeek) continue

    const actualSessionTotals: Record<string, number> = {}
    const actualZones: Record<ZoneKey, number> = { '55': 0, '65': 0, '75': 0, '85': 0, '90': 0, '95': 0 }

    for (const sessionObj of liftResult.sessions) {
      const weekData = (sessionObj as Record<string, unknown>)[weekKey] as { sets?: Array<{ reps: number; percentage: number }> } | undefined
      if (!weekData?.sets?.length) continue

      const sessionTotal = weekData.sets.reduce((sum, set) => sum + Number(set.reps || 0), 0)
      actualSessionTotals[sessionObj.session] = (actualSessionTotals[sessionObj.session] ?? 0) + sessionTotal

      for (const set of weekData.sets) {
        const reps = Number(set.reps || 0)
        if (!Number.isFinite(reps) || reps < 0) {
          errors.push(`${lift} ${weekKey}: invalid reps value "${set.reps}"`)
          continue
        }
        const zone = zoneFromPercentage(Number(set.percentage))
        if (!zone) {
          errors.push(`${lift} ${weekKey}: invalid percentage "${set.percentage}" (expected 55/65/75/85/92.5/95)`)
          continue
        }
        actualZones[zone] += reps
      }
    }

    // Session totals must match deterministic targets exactly.
    for (const [session, target] of Object.entries(targetWeek.sessions)) {
      const actual = actualSessionTotals[session] ?? 0
      if (actual !== target.total) {
        errors.push(`${lift} ${weekKey} session ${session}: expected ${target.total} reps, got ${actual}`)
      }
    }
    for (const [session, actual] of Object.entries(actualSessionTotals)) {
      if (!(session in targetWeek.sessions) && actual > 0) {
        errors.push(`${lift} ${weekKey}: unexpected session ${session} with ${actual} reps`)
      }
    }

    // Zone totals must match deterministic targets exactly.
    for (const zone of zones) {
      const target = Number(targetWeek.zones[zone] ?? 0)
      const actual = Number(actualZones[zone] ?? 0)
      if (target !== actual) {
        errors.push(`${lift} ${weekKey} zone ${zone}: expected ${target} reps, got ${actual}`)
      }
    }

    const weekActualTotal = zones.reduce((sum, zone) => sum + actualZones[zone], 0)
    if (weekActualTotal !== targetWeek.total_reps) {
      errors.push(`${lift} ${weekKey}: expected total ${targetWeek.total_reps}, got ${weekActualTotal}`)
    }
  }

  return errors
}

/**
 * Validation for v2.7: only checks zone totals per week.
 * Session totals are not pre-computed — AI decides session count freely.
 */
function validateLiftAiOutputV27(
  lift: string,
  liftCalc: Record<string, unknown>,
  liftResult: LiftWeeksOutput,
  weeks: number,
): string[] {
  const errors: string[] = []
  const zones: ZoneKey[] = ['55', '65', '75', '85', '90', '95']

  for (let w = 1; w <= weeks; w++) {
    const weekKey = `week_${w}` as 'week_1' | 'week_2' | 'week_3' | 'week_4'
    const targetWeek = liftCalc[weekKey] as {
      total_reps: number
      zones: Record<ZoneKey, number>
    } | undefined
    if (!targetWeek) continue

    const weekOutput = liftResult.weeks[weekKey]
    if (!weekOutput) {
      errors.push(`${lift} ${weekKey}: missing from AI output`)
      continue
    }

    const actualZones: Record<ZoneKey, number> = { '55': 0, '65': 0, '75': 0, '85': 0, '90': 0, '95': 0 }

    for (const sessionObj of weekOutput.sessions) {
      for (const set of sessionObj.sets) {
        const reps = Number(set.reps || 0)
        if (!Number.isFinite(reps) || reps < 0) {
          errors.push(`${lift} ${weekKey} session ${sessionObj.session}: invalid reps "${set.reps}"`)
          continue
        }
        const zone = zoneFromPercentage(Number(set.percentage))
        if (!zone) {
          errors.push(`${lift} ${weekKey} session ${sessionObj.session}: invalid percentage "${set.percentage}"`)
          continue
        }
        actualZones[zone] += reps
      }
    }

    // Only zone totals checked — session count/distribution is AI's decision.
    for (const zone of zones) {
      const target = Number(targetWeek.zones[zone] ?? 0)
      const actual = Number(actualZones[zone] ?? 0)
      if (target !== actual) {
        errors.push(`${lift} ${weekKey} zone ${zone}%: expected ${target} reps, got ${actual}`)
      }
    }

    const weekActualTotal = zones.reduce((sum, z) => sum + actualZones[z], 0)
    if (weekActualTotal !== targetWeek.total_reps) {
      errors.push(`${lift} ${weekKey}: expected total ${targetWeek.total_reps}, got ${weekActualTotal}`)
    }
  }

  return errors
}

export async function POST(request: Request) {
  try {
    const body: GenerateInput & {
      clientSlug: string
      save?: boolean
      provider?: AIProvider
      promptVersion?: string
      model?: string
      calculated?: Record<string, unknown>
    } = await request.json()
    const provider: AIProvider = body.provider === 'openai' ? 'openai' : 'anthropic'
    const promptVersion = getPromptVersion(body.promptVersion)
    const systemPrompt = promptVersion.systemPrompt
    const modelId = body.model?.trim() ? body.model.trim() : MODELS[provider]
    const weeks = body.weeks || 4
    const isV27 = promptVersion.id === 'v2_7'

    // Validate required fields
    if (!body.client || !body.block || !body.lifts) {
      return NextResponse.json(
        { error: 'Missing required fields: client, block, lifts' },
        { status: 400 }
      )
    }

    // Filter out null lifts
    const activeLifts: Record<string, NonNullable<typeof body.lifts.squat>> = {}
    for (const [lift, cfg] of Object.entries(body.lifts)) {
      if (cfg) activeLifts[lift] = cfg
    }

    if (Object.keys(activeLifts).length === 0) {
      return NextResponse.json({ error: 'No lifts configured' }, { status: 400 })
    }

    // ── Step 1: Target source (edited calculated override or deterministic fallback) ──
    console.log('[generate-program] Step 1: Preparing targets (edited override or deterministic fallback)...')
    const calculated = calculateAllTargets(activeLifts, body.client.delta, weeks) as Record<string, Record<string, unknown>>

    const providedCalculated = (body.calculated && typeof body.calculated === 'object')
      ? body.calculated
      : null
    const overriddenLifts: string[] = []

    if (providedCalculated) {
      for (const lift of Object.keys(activeLifts)) {
        const providedLift = providedCalculated[lift]
        if (!providedLift || typeof providedLift !== 'object') continue

        const providedLiftCalc = providedLift as Record<string, unknown>
        if (!hasUsableWeekTargets(providedLiftCalc, weeks)) continue

        calculated[lift] = providedLiftCalc
        overriddenLifts.push(lift)
      }
    }

    console.log('[generate-program] Target source:', overriddenLifts.length > 0 ? `edited override for ${overriddenLifts.join(', ')}` : 'deterministic only')
    console.log('[generate-program] Prepared targets for:', Object.keys(calculated))

    // Validate calculated results
    const validationErrors: string[] = []
    const validationWarnings: string[] = []

    for (const [lift, cfg] of Object.entries(activeLifts)) {
      const liftCalc = calculated[lift]
      if (!liftCalc) continue

      const summary = liftCalc._summary as { actual_nl?: number; block_ari?: number } | undefined
      const derived = deriveBlockMetricsFromWeeks(liftCalc, weeks)
      const actualNl = derived?.actualNl ?? Number(summary?.actual_nl ?? 0)
      const blockAri = derived?.blockAri ?? Number(summary?.block_ari ?? 0)

      const diff = Math.abs(actualNl - cfg.volume)
      if (diff > 2) {
        validationErrors.push(`${lift}: NL mismatch — target ${cfg.volume}, actual ${actualNl} (diff: ${diff})`)
      } else if (diff > 0) {
        validationWarnings.push(`${lift}: NL slightly off — target ${cfg.volume}, actual ${actualNl} (diff: ${diff})`)
      }

      const ariTarget = TARGET_ARI[body.block]
      if (Number.isFinite(blockAri) && (blockAri < ariTarget.min || blockAri > ariTarget.max)) {
        validationWarnings.push(`${lift}: ARI ${blockAri}% outside target ${ariTarget.min}-${ariTarget.max}%`)
      }
    }

    // ── Step 2: AI generates concrete sessions (per lift, with retry) ───
    const MAX_RETRIES = 2
    console.log(`[generate-program] Step 2: Generating sessions per lift (AI: ${provider}/${modelId})...`)

    let totalInputTokens = 0
    let totalOutputTokens = 0
    const perLiftResults: Record<string, LiftSessionsOutput | LiftWeeksOutput> = {}
    const prompts: Record<string, string> = {}

    for (const [lift, cfg] of Object.entries(activeLifts)) {
      const liftCalc = calculated[lift]
      if (!liftCalc) continue

      const baseUserPrompt = isV27
        ? buildZonesOnlyPrompt(lift, liftCalc, cfg.weights, weeks)
        : buildLiftPrompt(lift, liftCalc, cfg.weights, weeks)
      prompts[lift] = baseUserPrompt

      let liftResult: LiftSessionsOutput | LiftWeeksOutput | null = null
      let liftErrors: string[] = []
      let lastAttemptResult: LiftSessionsOutput | LiftWeeksOutput | null = null

      for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
        const isRetry = attempt > 1
        const userPrompt = isRetry
          ? `${baseUserPrompt}\n\n## CORRECTION REQUIRED (attempt ${attempt})\nYour previous response had the following arithmetic errors — fix ALL of them:\n${liftErrors.map(e => `- ${e}`).join('\n')}\n\nRepeat the full JSON output with these errors corrected. Hard constraints are NON-NEGOTIABLE.`
          : baseUserPrompt

        if (isRetry) {
          console.log(`[generate-program]   → ${lift} retry ${attempt - 1} (${liftErrors.length} errors)...`)
        } else {
          console.log(`[generate-program]   → ${lift}...`)
        }

        if (isV27) {
          const result = await generateObject({
            model: provider === 'openai' ? openai(modelId) : anthropic(modelId),
            system: systemPrompt,
            prompt: userPrompt,
            schema: liftWeeksSchema,
            temperature: 0,
          })
          totalInputTokens += result.usage?.inputTokens ?? 0
          totalOutputTokens += result.usage?.outputTokens ?? 0
          lastAttemptResult = result.object
          liftErrors = validateLiftAiOutputV27(lift, liftCalc, result.object, weeks)
          if (liftErrors.length === 0) { liftResult = result.object; break }
        } else {
          const result = await generateObject({
            model: provider === 'openai' ? openai(modelId) : anthropic(modelId),
            system: systemPrompt,
            prompt: userPrompt,
            schema: liftSessionsSchema,
            temperature: 0,
          })
          totalInputTokens += result.usage?.inputTokens ?? 0
          totalOutputTokens += result.usage?.outputTokens ?? 0
          lastAttemptResult = result.object
          liftErrors = validateLiftAiOutput(lift, liftCalc, result.object as LiftSessionsOutput, weeks)
          if (liftErrors.length === 0) { liftResult = result.object; break }
        }

        console.log(`[generate-program]   → ${lift} attempt ${attempt} failed: ${liftErrors.length} errors`)
      }

      perLiftResults[lift] = liftResult ?? lastAttemptResult!
    }

    // ── Step 2a: Strict AI-output math validation ─
    const aiOutputErrors: string[] = []
    for (const [lift, liftResult] of Object.entries(perLiftResults)) {
      if (isV27) {
        aiOutputErrors.push(...validateLiftAiOutputV27(lift, calculated[lift], liftResult as LiftWeeksOutput, weeks))
      } else {
        aiOutputErrors.push(...validateLiftAiOutput(lift, calculated[lift], liftResult as LiftSessionsOutput, weeks))
      }
    }

    // ── Step 2b: Merge per-lift results into unified sessions ─
    const sessions: SessionsOutput = {}
    const liftOrder = ['squat', 'bench_press', 'deadlift']
    const orderedLifts = liftOrder.filter(l => l in perLiftResults)

    for (const lift of orderedLifts) {
      const liftResult = perLiftResults[lift]

      if (isV27) {
        // v2.7: week-first format — each week has its own sessions array
        const weeksResult = liftResult as LiftWeeksOutput
        for (const weekKey of ['week_1', 'week_2', 'week_3', 'week_4'] as const) {
          const weekData = weeksResult.weeks[weekKey]
          if (!weekData) continue
          for (const [sessionIdx, sessionObj] of weekData.sessions.entries()) {
            const sessionKey = canonicalSessionLetter(sessionObj.session, sessionIdx)
            if (!sessions[sessionKey]) {
              sessions[sessionKey] = {
                week_1: { lifts: [] },
                week_2: { lifts: [] },
                week_3: { lifts: [] },
                week_4: { lifts: [] },
              }
            }
            if (sessionObj.sets.length > 0) {
              sessions[sessionKey][weekKey].lifts.push({
                lift: lift as 'squat' | 'bench_press' | 'deadlift',
                sets: sessionObj.sets,
              })
            }
          }
        }
      } else {
        // v2.5/v2.6: session-first format
        const sessionsResult = liftResult as LiftSessionsOutput
        for (const [sessionIdx, sessionObj] of sessionsResult.sessions.entries()) {
          const sessionKey = canonicalSessionLetter(sessionObj.session, sessionIdx)
          if (!sessions[sessionKey]) {
            sessions[sessionKey] = {
              week_1: { lifts: [] },
              week_2: { lifts: [] },
              week_3: { lifts: [] },
              week_4: { lifts: [] },
            }
          }
          for (const weekKey of ['week_1', 'week_2', 'week_3', 'week_4'] as const) {
            const weekData = sessionObj[weekKey]
            if (weekData?.sets) {
              sessions[sessionKey][weekKey].lifts.push({
                lift: lift as 'squat' | 'bench_press' | 'deadlift',
                sets: weekData.sets,
              })
            }
          }
        }
      }
    }

    console.log('[generate-program] AI generation complete — sessions:', Object.keys(sessions))

    // ── Extract distribution info from v2.7 results ─
    type DistWeekInfo = {
      sessions_used: number
      distribution_code: string
      session_totals: number[]
      tried_distributions: string[]
      selection_reason: string
    }
    const distributionInfo: Record<string, Record<string, DistWeekInfo>> = {}
    if (isV27) {
      for (const [lift, liftResult] of Object.entries(perLiftResults)) {
        const weeksResult = liftResult as LiftWeeksOutput
        distributionInfo[lift] = {}
        for (const weekKey of ['week_1', 'week_2', 'week_3', 'week_4'] as const) {
          const weekData = weeksResult.weeks[weekKey]
          if (!weekData) continue
          const sessionTotals = weekData.sessions.map(s =>
            s.sets.reduce((sum, set) => sum + Number(set.reps || 0), 0)
          )
          distributionInfo[lift][weekKey] = {
            sessions_used: weekData.sessions_used,
            distribution_code: weekData.distribution_code,
            session_totals: sessionTotals,
            tried_distributions: weekData.tried_distributions,
            selection_reason: weekData.selection_reason,
          }
        }
      }
    }

    // ── Return 422 with partial program if validation failed ─
    if (aiOutputErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `AI output does not match deterministic targets (after ${MAX_RETRIES} retries)`,
          program: { calculated, sessions },
          ...(isV27 && { distributionInfo }),
          validation: {
            errors: [...validationErrors, ...aiOutputErrors],
            warnings: validationWarnings,
          },
          prompts: {
            promptVersion: promptVersion.id,
            system: systemPrompt,
            user: prompts,
          },
          usage: {
            provider,
            model: modelId,
            liftsGenerated: Object.keys(perLiftResults).length,
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            totalTokens: totalInputTokens + totalOutputTokens,
          },
        },
        { status: 422 },
      )
    }

    // ── Step 3: Optionally save to database ────────────────
    let savedFilename: string | null = null
    if (body.save && body.clientSlug) {
      const [client] = await db
        .select({ id: clients.id })
        .from(clients)
        .where(eq(clients.slug, body.clientSlug))
        .limit(1)

      if (!client) {
        return NextResponse.json({ error: `Client "${body.clientSlug}" not found` }, { status: 404 })
      }

      const today = new Date().toISOString().split('T')[0]
      savedFilename = `${today}_${body.clientSlug}_${body.block}_all_lifts.json`

      // Build input section (matches existing program format)
      const inputSection: Record<string, unknown> = {}
      for (const [lift, cfg] of Object.entries(activeLifts)) {
        inputSection[lift] = {
          volume: cfg.volume,
          rounding: cfg.rounding,
          weights: cfg.weights,
          intensity_distribution: cfg.intensity_distribution,
          volume_pattern_main: cfg.volume_pattern_main,
          volume_pattern_8190: cfg.volume_pattern_8190,
          sessions_per_week: cfg.sessions_per_week,
          session_distribution: cfg.session_distribution,
        }
      }

      await db.insert(programs).values({
        clientId: client.id,
        filename: savedFilename,
        schemaVersion: '1.2',
        status: 'draft',
        block: body.block,
        startDate: today,
        endDate: new Date(Date.now() + weeks * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        weeks,
        clientSnapshot: body.client,
        input: inputSection,
        calculated,
        sessionsData: sessions,
        createdAt: new Date().toISOString(),
        createdBy: 'AI Generator',
      })
    }

    return NextResponse.json({
      success: true,
      program: { calculated, sessions },
      ...(isV27 && { distributionInfo }),
      validation: {
        errors: validationErrors,
        warnings: validationWarnings,
      },
      ...(savedFilename && { filename: savedFilename }),
      prompts: {
        promptVersion: promptVersion.id,
        system: systemPrompt,
        user: prompts,
      },
      usage: {
        provider,
        model: modelId,
        liftsGenerated: Object.keys(perLiftResults).length,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        totalTokens: totalInputTokens + totalOutputTokens,
      },
    })
  } catch (error: unknown) {
    console.error('[generate-program] Error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
