import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { db } from '@/db'
import { programs, clients } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { liftSessionsSchema, type GenerateInput, type LiftSessionsOutput, type SessionsOutput } from '@/lib/ai/schema'
import { getPromptVersion, buildLiftPrompt } from '@/lib/ai/prompt'
import { calculateAllTargets, computeWeekAllocation } from '@/lib/ai/calculate'
import type { ZoneReps, SessionTarget } from '@/lib/ai/calculate'
import { TARGET_ARI } from '@/lib/ai/constants'

type AIProvider = 'anthropic' | 'openai'

const MODELS: Record<AIProvider, string> = {
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
}

export const maxDuration = 300 // Allow up to 5 minutes (retry attempts per lift)

type ZoneKey = '65' | '75' | '85' | '90' | '95'

function zoneFromPercentage(percentage: number): ZoneKey | null {
  const p = Number(percentage)
  if (Math.abs(p - 65) < 0.2) return '65'
  if (Math.abs(p - 75) < 0.2) return '75'
  if (Math.abs(p - 85) < 0.2) return '85'
  if (Math.abs(p - 92.5) < 0.2) return '90'
  if (Math.abs(p - 95) < 0.2) return '95'
  return null
}

function validateLiftAiOutput(
  lift: string,
  liftCalc: Record<string, unknown>,
  liftResult: LiftSessionsOutput,
  weeks: number,
): string[] {
  const errors: string[] = []
  const zones: ZoneKey[] = ['65', '75', '85', '90', '95']

  for (let w = 1; w <= weeks; w++) {
    const weekKey = `week_${w}`
    const targetWeek = liftCalc[weekKey] as {
      total_reps: number
      zones: Record<ZoneKey, number>
      sessions: Record<string, { total: number }>
    } | undefined
    if (!targetWeek) continue

    const actualSessionTotals: Record<string, number> = {}
    const actualZones: Record<ZoneKey, number> = { '65': 0, '75': 0, '85': 0, '90': 0, '95': 0 }

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
          errors.push(`${lift} ${weekKey}: invalid percentage "${set.percentage}" (expected 65/75/85/92.5/95)`)
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

export async function POST(request: Request) {
  try {
    const body: GenerateInput & { clientSlug: string; save?: boolean; provider?: AIProvider; promptVersion?: string; model?: string } = await request.json()
    const provider: AIProvider = body.provider === 'openai' ? 'openai' : 'anthropic'
    const promptVersion = getPromptVersion(body.promptVersion)
    const systemPrompt = promptVersion.systemPrompt
    const modelId = body.model?.trim() ? body.model.trim() : MODELS[provider]
    const weeks = body.weeks || 4

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

    // ── Step 1: Deterministic calculation ──────────────────
    console.log('[generate-program] Step 1: Calculating targets (deterministic)...')
    const calculated = calculateAllTargets(activeLifts, body.client.delta, weeks)
    console.log('[generate-program] Calculated targets for:', Object.keys(calculated))

    // Validate calculated results
    const validationErrors: string[] = []
    const validationWarnings: string[] = []

    for (const [lift, cfg] of Object.entries(activeLifts)) {
      const liftCalc = calculated[lift]
      if (!liftCalc?._summary) continue

      const summary = liftCalc._summary
      const diff = Math.abs(summary.actual_nl - cfg.volume)
      if (diff > 2) {
        validationErrors.push(`${lift}: NL mismatch — target ${cfg.volume}, actual ${summary.actual_nl} (diff: ${diff})`)
      } else if (diff > 0) {
        validationWarnings.push(`${lift}: NL slightly off — target ${cfg.volume}, actual ${summary.actual_nl} (diff: ${diff})`)
      }

      const ariTarget = TARGET_ARI[body.block]
      if (summary.block_ari < ariTarget.min || summary.block_ari > ariTarget.max) {
        validationWarnings.push(`${lift}: ARI ${summary.block_ari}% outside target ${ariTarget.min}-${ariTarget.max}%`)
      }
    }

    // ── Step 1b: Pre-compute allocations (for debug visibility) ─────────
    const allocations: Record<string, Record<string, Record<string, Record<string, number>>>> = {}
    for (const [lift, liftCalc] of Object.entries(calculated)) {
      allocations[lift] = {}
      for (let w = 1; w <= weeks; w++) {
        const weekKey = `week_${w}`
        const week = liftCalc[weekKey] as { zones: ZoneReps; sessions: Record<string, SessionTarget> } | undefined
        if (!week) continue
        allocations[lift][weekKey] = computeWeekAllocation(week.zones, week.sessions)
      }
    }

    // ── Step 2: AI generates concrete sessions (per lift, with retry) ───
    const MAX_RETRIES = 2
    console.log(`[generate-program] Step 2: Generating sessions per lift (AI: ${provider}/${modelId})...`)

    let totalInputTokens = 0
    let totalOutputTokens = 0
    const perLiftResults: Record<string, LiftSessionsOutput> = {}
    const prompts: Record<string, string> = {}

    for (const [lift, cfg] of Object.entries(activeLifts)) {
      const liftCalc = calculated[lift]
      if (!liftCalc) continue

      const baseUserPrompt = buildLiftPrompt(lift, liftCalc, cfg.weights, weeks)
      prompts[lift] = baseUserPrompt

      let liftResult: LiftSessionsOutput | null = null
      let liftErrors: string[] = []
      let lastAttemptResult: LiftSessionsOutput | null = null

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

        liftErrors = validateLiftAiOutput(lift, liftCalc, result.object, weeks)
        if (liftErrors.length === 0) {
          liftResult = result.object
          break
        }

        console.log(`[generate-program]   → ${lift} attempt ${attempt} failed: ${liftErrors.length} errors`)
      }

      // Use last attempt result even if it has errors (errors will be reported in validation)
      perLiftResults[lift] = liftResult ?? lastAttemptResult!
    }

    // ── Step 2a: Strict AI-output math validation (must match deterministic targets exactly) ─
    const aiOutputErrors: string[] = []
    for (const [lift, liftResult] of Object.entries(perLiftResults)) {
      aiOutputErrors.push(...validateLiftAiOutput(lift, calculated[lift], liftResult, weeks))
    }

    // ── Step 2b: Merge per-lift results into unified sessions (always, so we can return on error too) ─
    const sessions: SessionsOutput = {}
    const liftOrder = ['squat', 'bench_press', 'deadlift']
    const orderedLifts = liftOrder.filter(l => l in perLiftResults)

    for (const lift of orderedLifts) {
      const liftResult = perLiftResults[lift]
      for (const sessionObj of liftResult.sessions) {
        const sessionKey = sessionObj.session
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

    console.log('[generate-program] AI generation complete — sessions:', Object.keys(sessions))

    // ── Return 422 with partial program if validation failed ─
    if (aiOutputErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `AI output does not match deterministic targets (after ${MAX_RETRIES} retries)`,
          program: { calculated, sessions },
          allocations,
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
      allocations,
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
