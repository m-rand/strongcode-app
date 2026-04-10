import { NextResponse } from 'next/server'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { clients, oneRmRecords, programTemplates, programs } from '@/db/schema'
import { calculateAllTargets } from '@/lib/ai/calculate'
import {
  buildClientInputFromTemplateInput,
  materializeSessionsForClient,
  type BlockType,
  type LiftKey,
  type ZoneTemplateSessions,
} from '@/lib/program/templates'

interface ApplyTemplateBody {
  clientSlug?: string
  startDate?: string
  createdBy?: string
  fullTemplateSlug?: string
  liftTemplates?: Partial<Record<LiftKey, string>>
}

const ALL_LIFTS: LiftKey[] = ['squat', 'bench_press', 'deadlift']

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function addDays(dateIso: string, days: number): string {
  const date = new Date(`${dateIso}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().split('T')[0]
}

function mergeSessions(target: ZoneTemplateSessions, source: ZoneTemplateSessions): ZoneTemplateSessions {
  const merged: ZoneTemplateSessions = { ...target }

  for (const [sessionKey, weekMap] of Object.entries(source)) {
    if (!merged[sessionKey]) merged[sessionKey] = {}

    for (const [weekKey, weekData] of Object.entries(weekMap || {})) {
      if (!merged[sessionKey][weekKey]) {
        merged[sessionKey][weekKey] = { lifts: [] }
      }

      const existingLifts = new Set(
        (merged[sessionKey][weekKey].lifts || []).map((l) => l.lift),
      )

      for (const liftData of weekData.lifts || []) {
        if (!existingLifts.has(liftData.lift)) {
          merged[sessionKey][weekKey].lifts.push(liftData)
          existingLifts.add(liftData.lift)
        }
      }
    }
  }

  return merged
}

function mergeRecordObjects(
  base: Record<string, unknown>,
  incoming: Record<string, unknown>,
): Record<string, unknown> {
  return { ...base, ...incoming }
}

function normalizeClientDelta(value: unknown): 'beginner' | 'intermediate' | 'advanced' | 'elite' {
  if (value === 'beginner' || value === 'intermediate' || value === 'advanced' || value === 'elite') {
    return value
  }
  return 'intermediate'
}

async function makeUniqueProgramFilename(clientId: number, baseFilename: string): Promise<string> {
  const dot = baseFilename.lastIndexOf('.json')
  const stem = dot >= 0 ? baseFilename.slice(0, dot) : baseFilename

  let candidate = baseFilename
  let idx = 2

  while (true) {
    const [existing] = await db
      .select({ id: programs.id })
      .from(programs)
      .where(and(eq(programs.clientId, clientId), eq(programs.filename, candidate)))
      .limit(1)

    if (!existing) return candidate

    candidate = `${stem}_${idx}.json`
    idx += 1
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as ApplyTemplateBody

    const clientSlug = body?.clientSlug?.trim()
    if (!clientSlug) {
      return NextResponse.json({ error: 'clientSlug is required' }, { status: 400 })
    }

    const startDate = body?.startDate?.trim() || new Date().toISOString().split('T')[0]
    if (!isIsoDate(startDate)) {
      return NextResponse.json({ error: 'startDate must be YYYY-MM-DD' }, { status: 400 })
    }

    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.slug, clientSlug))
      .limit(1)

    if (!client) {
      return NextResponse.json({ error: `Client "${clientSlug}" not found` }, { status: 404 })
    }

    const [latestRm] = await db
      .select()
      .from(oneRmRecords)
      .where(eq(oneRmRecords.clientId, client.id))
      .orderBy(desc(oneRmRecords.date), desc(oneRmRecords.id))
      .limit(1)

    if (!latestRm) {
      return NextResponse.json(
        { error: `Client "${clientSlug}" has no 1RM record` },
        { status: 400 },
      )
    }

    const clientOneRm: Record<LiftKey, number> = {
      squat: Number(latestRm.squat ?? 0),
      bench_press: Number(latestRm.benchPress ?? 0),
      deadlift: Number(latestRm.deadlift ?? 0),
    }

    for (const lift of ALL_LIFTS) {
      if (!Number.isFinite(clientOneRm[lift]) || clientOneRm[lift] <= 0) {
        return NextResponse.json(
          { error: `Client "${clientSlug}" is missing valid 1RM for ${lift}` },
          { status: 400 },
        )
      }
    }

    const fullTemplateSlug = body?.fullTemplateSlug?.trim()
    const liftTemplates = body?.liftTemplates || {}
    const hasLiftSelection = ALL_LIFTS.some((lift) => {
      const slug = liftTemplates[lift]
      return typeof slug === 'string' && slug.trim().length > 0
    })

    if (!fullTemplateSlug && !hasLiftSelection) {
      return NextResponse.json(
        { error: 'Provide fullTemplateSlug or liftTemplates' },
        { status: 400 },
      )
    }
    if (fullTemplateSlug && hasLiftSelection) {
      return NextResponse.json(
        { error: 'Provide either fullTemplateSlug or liftTemplates, not both' },
        { status: 400 },
      )
    }

    let combinedInput: Record<string, unknown> = {}
    let combinedSessions: ZoneTemplateSessions = {}
    let block: BlockType | null = null
    let weeks: number | null = null
    const sourceTemplates: Record<string, string> = {}

    if (fullTemplateSlug) {
      const [template] = await db
        .select()
        .from(programTemplates)
        .where(eq(programTemplates.slug, fullTemplateSlug))
        .limit(1)

      if (!template) {
        return NextResponse.json(
          { error: `Template "${fullTemplateSlug}" not found` },
          { status: 404 },
        )
      }

      if (template.scope !== 'full') {
        return NextResponse.json(
          { error: `Template "${fullTemplateSlug}" is not scope=full` },
          { status: 400 },
        )
      }

      combinedInput = (template.input as Record<string, unknown>) || {}
      combinedSessions = (template.sessionsTemplate as ZoneTemplateSessions) || {}
      block = template.block
      weeks = template.weeks
      sourceTemplates.full = template.slug
    } else {
      const expected = ALL_LIFTS.filter((lift) => !liftTemplates[lift])
      if (expected.length > 0) {
        return NextResponse.json(
          { error: `Missing lift template slugs for: ${expected.join(', ')}` },
          { status: 400 },
        )
      }

      for (const lift of ALL_LIFTS) {
        const slug = liftTemplates[lift]?.trim()
        if (!slug) continue

        const [template] = await db
          .select()
          .from(programTemplates)
          .where(eq(programTemplates.slug, slug))
          .limit(1)

        if (!template) {
          return NextResponse.json({ error: `Template "${slug}" not found` }, { status: 404 })
        }

        if (template.scope !== 'single_lift') {
          return NextResponse.json(
            { error: `Template "${slug}" must have scope=single_lift` },
            { status: 400 },
          )
        }

        if (template.lift !== lift) {
          return NextResponse.json(
            { error: `Template "${slug}" is for ${template.lift}, expected ${lift}` },
            { status: 400 },
          )
        }

        if (block && template.block !== block) {
          return NextResponse.json(
            { error: 'Selected lift templates must share the same block (prep/comp)' },
            { status: 400 },
          )
        }

        if (weeks && template.weeks !== weeks) {
          return NextResponse.json(
            { error: 'Selected lift templates must share the same weeks count' },
            { status: 400 },
          )
        }

        block = template.block
        weeks = template.weeks

        combinedInput = mergeRecordObjects(
          combinedInput,
          ((template.input as Record<string, unknown>) || {}),
        )
        combinedSessions = mergeSessions(
          combinedSessions,
          ((template.sessionsTemplate as ZoneTemplateSessions) || {}),
        )

        sourceTemplates[lift] = template.slug
      }
    }

    if (!block || !weeks) {
      return NextResponse.json(
        { error: 'Template selection could not determine block/weeks' },
        { status: 400 },
      )
    }

    const clientInput = buildClientInputFromTemplateInput(combinedInput, clientOneRm)
    if (ALL_LIFTS.some((lift) => !clientInput[lift])) {
      return NextResponse.json(
        { error: 'Applied template must include all three lifts: squat, bench_press, deadlift' },
        { status: 400 },
      )
    }
    const sessionsData = materializeSessionsForClient(combinedSessions, clientInput)

    const recalculated = calculateAllTargets(
      clientInput as Record<string, import('@/lib/ai/schema').LiftInput>,
      normalizeClientDelta(client.skillLevel),
      weeks,
    ) as Record<string, unknown>

    const filenameBase = `${startDate}_${clientSlug}_${block}_all_lifts.json`
    const filename = await makeUniqueProgramFilename(client.id, filenameBase)

    const endDate = addDays(startDate, weeks * 7)

    await db.insert(programs).values({
      clientId: client.id,
      filename,
      schemaVersion: '1.2',
      status: 'draft',
      block,
      startDate,
      endDate,
      weeks,
      clientSnapshot: {
        name: client.name,
        delta: normalizeClientDelta(client.skillLevel),
        one_rm: clientOneRm,
        template_source: sourceTemplates,
      },
      input: clientInput,
      calculated: recalculated,
      sessionsData,
      createdAt: new Date().toISOString(),
      createdBy: body?.createdBy?.trim() || 'Template Apply API',
    })

    return NextResponse.json({
      success: true,
      filename,
      client: clientSlug,
      block,
      weeks,
      sourceTemplates,
    })
  } catch (error) {
    console.error('Error applying template to client:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to apply template' },
      { status: 500 },
    )
  }
}
