import { NextResponse } from 'next/server'
import { db } from '@/db'
import { clients, programs, programTemplates } from '@/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import {
  createTemplateSlug,
  extractZoneTemplateSessions,
  type LiftKey,
  type TemplateScope,
} from '@/lib/program/templates'

interface CreateTemplateBody {
  name?: string
  description?: string
  scope?: TemplateScope
  lift?: LiftKey
  program?: unknown
  source?: {
    clientSlug?: string
    filename?: string
  }
  createdBy?: string
}

const ALL_LIFTS: LiftKey[] = ['squat', 'bench_press', 'deadlift']

function uniqueLiftSet(scope: TemplateScope, lift?: LiftKey): Set<LiftKey> {
  if (scope === 'single_lift') {
    if (lift !== 'squat' && lift !== 'bench_press' && lift !== 'deadlift') {
      throw new Error('single_lift template requires lift = squat | bench_press | deadlift')
    }
    return new Set([lift])
  }

  return new Set(ALL_LIFTS)
}

function pickLiftSubset(
  source: unknown,
  allowed: Set<LiftKey>,
): Record<string, unknown> {
  const record = (source && typeof source === 'object')
    ? source as Record<string, unknown>
    : {}

  const out: Record<string, unknown> = {}
  for (const lift of ALL_LIFTS) {
    if (!allowed.has(lift)) continue
    const value = record[lift]
    if (value && typeof value === 'object') {
      out[lift] = value
    }
  }

  return out
}

async function getUniqueSlug(baseName: string): Promise<string> {
  const base = createTemplateSlug(baseName)

  let candidate = base
  let suffix = 2

  while (true) {
    const [existing] = await db
      .select({ id: programTemplates.id })
      .from(programTemplates)
      .where(eq(programTemplates.slug, candidate))
      .limit(1)

    if (!existing) return candidate

    candidate = `${base}-${suffix}`
    suffix += 1
  }
}

function readProgramShape(programRaw: unknown): {
  schemaVersion: string
  block: 'prep' | 'comp'
  weeks: number
  input: Record<string, unknown>
  calculated: Record<string, unknown>
  sessions: unknown
  sourceFilename: string | null
} {
  if (!programRaw || typeof programRaw !== 'object') {
    throw new Error('program payload must be an object')
  }

  const program = programRaw as Record<string, unknown>
  const info = (program.program_info && typeof program.program_info === 'object')
    ? program.program_info as Record<string, unknown>
    : {}
  const meta = (program.meta && typeof program.meta === 'object')
    ? program.meta as Record<string, unknown>
    : {}

  const block = info.block
  if (block !== 'prep' && block !== 'comp') {
    throw new Error('program.program_info.block must be prep or comp')
  }

  const weeks = Number(info.weeks)
  if (!Number.isFinite(weeks) || weeks < 1) {
    throw new Error('program.program_info.weeks must be a positive number')
  }

  const input = (program.input && typeof program.input === 'object')
    ? program.input as Record<string, unknown>
    : {}
  const calculated = (program.calculated && typeof program.calculated === 'object')
    ? program.calculated as Record<string, unknown>
    : {}
  const sessions = program.sessions

  const schemaVersion = typeof program.schema_version === 'string' && program.schema_version
    ? program.schema_version
    : '1.2'
  const sourceFilename = typeof meta.filename === 'string' && meta.filename
    ? meta.filename
    : null

  return {
    schemaVersion,
    block,
    weeks: Math.round(weeks),
    input,
    calculated,
    sessions,
    sourceFilename,
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const blockFilter = searchParams.get('block')
    const scopeFilter = searchParams.get('scope')
    const liftFilter = searchParams.get('lift')

    const conditions = []
    if (blockFilter === 'prep' || blockFilter === 'comp') {
      conditions.push(eq(programTemplates.block, blockFilter))
    }
    if (scopeFilter === 'full' || scopeFilter === 'single_lift') {
      conditions.push(eq(programTemplates.scope, scopeFilter))
    }
    if (liftFilter === 'squat' || liftFilter === 'bench_press' || liftFilter === 'deadlift') {
      conditions.push(eq(programTemplates.lift, liftFilter))
    }

    const templates = await db
      .select({
        id: programTemplates.id,
        slug: programTemplates.slug,
        name: programTemplates.name,
        description: programTemplates.description,
        scope: programTemplates.scope,
        lift: programTemplates.lift,
        block: programTemplates.block,
        weeks: programTemplates.weeks,
        sourceProgramFilename: programTemplates.sourceProgramFilename,
        createdAt: programTemplates.createdAt,
        createdBy: programTemplates.createdBy,
      })
      .from(programTemplates)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(programTemplates.createdAt), desc(programTemplates.id))

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error listing program templates:', error)
    return NextResponse.json(
      { error: 'Failed to list templates' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as CreateTemplateBody

    const name = body?.name?.trim()
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const scope = body?.scope
    if (scope !== 'full' && scope !== 'single_lift') {
      return NextResponse.json({ error: 'scope must be full or single_lift' }, { status: 400 })
    }

    let schemaVersion = '1.2'
    let block: 'prep' | 'comp' = 'prep'
    let weeks = 4
    let sourceInput: Record<string, unknown> = {}
    let sourceCalculated: Record<string, unknown> = {}
    let sourceSessions: unknown = {}
    let sourceFilename: string | null = null

    if (body.program) {
      const parsed = readProgramShape(body.program)
      schemaVersion = parsed.schemaVersion
      block = parsed.block
      weeks = parsed.weeks
      sourceInput = parsed.input
      sourceCalculated = parsed.calculated
      sourceSessions = parsed.sessions
      sourceFilename = parsed.sourceFilename
    } else {
      const clientSlug = body?.source?.clientSlug?.trim()
      const filename = body?.source?.filename?.trim()
      if (!clientSlug || !filename) {
        return NextResponse.json(
          { error: 'Provide either `program` payload, or source.clientSlug + source.filename' },
          { status: 400 },
        )
      }

      const [client] = await db
        .select({ id: clients.id })
        .from(clients)
        .where(eq(clients.slug, clientSlug))
        .limit(1)

      if (!client) {
        return NextResponse.json({ error: `Client "${clientSlug}" not found` }, { status: 404 })
      }

      const [sourceProgram] = await db
        .select()
        .from(programs)
        .where(and(
          eq(programs.clientId, client.id),
          eq(programs.filename, filename),
        ))
        .limit(1)

      if (!sourceProgram) {
        return NextResponse.json(
          { error: `Program "${filename}" not found for client "${clientSlug}"` },
          { status: 404 },
        )
      }

      schemaVersion = sourceProgram.schemaVersion || '1.2'
      block = sourceProgram.block
      weeks = sourceProgram.weeks
      sourceInput = (sourceProgram.input && typeof sourceProgram.input === 'object')
        ? sourceProgram.input as Record<string, unknown>
        : {}
      sourceCalculated = (sourceProgram.calculated && typeof sourceProgram.calculated === 'object')
        ? sourceProgram.calculated as Record<string, unknown>
        : {}
      sourceSessions = sourceProgram.sessionsData
      sourceFilename = sourceProgram.filename
    }

    let allowedLifts: Set<LiftKey>
    try {
      allowedLifts = uniqueLiftSet(scope, body?.lift)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid lift selection' },
        { status: 400 },
      )
    }

    const inputSubset = pickLiftSubset(sourceInput, allowedLifts)
    const calculatedSubset = pickLiftSubset(sourceCalculated, allowedLifts)

    if (Object.keys(inputSubset).length === 0) {
      return NextResponse.json(
        { error: 'Source program has no matching lift input for selected template scope' },
        { status: 400 },
      )
    }

    if (Object.keys(calculatedSubset).length === 0) {
      return NextResponse.json(
        { error: 'Source program has no matching lift calculated data for selected template scope' },
        { status: 400 },
      )
    }

    const sessionsTemplate = extractZoneTemplateSessions(
      sourceSessions,
      sourceCalculated,
      allowedLifts,
    )

    const slug = await getUniqueSlug(name)

    await db.insert(programTemplates).values({
      slug,
      name,
      description: body?.description?.trim() || null,
      scope,
      lift: scope === 'single_lift' ? (body.lift as LiftKey) : null,
      block,
      weeks,
      schemaVersion,
      input: inputSubset,
      calculated: calculatedSubset,
      sessionsTemplate,
      sourceProgramFilename: sourceFilename,
      createdAt: new Date().toISOString(),
      createdBy: body?.createdBy?.trim() || 'Template API',
    })

    return NextResponse.json({
      success: true,
      template: {
        slug,
        name,
        scope,
        lift: scope === 'single_lift' ? body.lift : null,
        block,
        weeks,
      },
    })
  } catch (error) {
    console.error('Error creating program template:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create template' },
      { status: 500 },
    )
  }
}
