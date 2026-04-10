import { NextResponse } from 'next/server'
import { db } from '@/db'
import { programTemplates } from '@/db/schema'
import { eq } from 'drizzle-orm'
import {
  createTemplateSlug,
  extractZoneTemplateSessions,
  type LiftKey,
} from '@/lib/program/templates'

type RouteContext = { params: Promise<{ slug: string }> }
const ALL_LIFTS: LiftKey[] = ['squat', 'bench_press', 'deadlift']

function allowedLiftsForTemplate(template: { scope: 'full' | 'single_lift'; lift: string | null }): Set<LiftKey> {
  if (template.scope === 'single_lift') {
    if (template.lift !== 'squat' && template.lift !== 'bench_press' && template.lift !== 'deadlift') {
      throw new Error('Invalid template lift configuration')
    }
    return new Set([template.lift])
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

function readProgramShape(programRaw: unknown): {
  schemaVersion: string
  block: 'prep' | 'comp'
  weeks: number
  input: Record<string, unknown>
  calculated: Record<string, unknown>
  sessions: unknown
} {
  if (!programRaw || typeof programRaw !== 'object') {
    throw new Error('program payload must be an object')
  }

  const program = programRaw as Record<string, unknown>
  const info = (program.program_info && typeof program.program_info === 'object')
    ? program.program_info as Record<string, unknown>
    : {}

  const block = info.block
  if (block !== 'prep' && block !== 'comp') {
    throw new Error('program.program_info.block must be prep or comp')
  }

  const weeks = Number(info.weeks)
  if (!Number.isFinite(weeks) || weeks < 1) {
    throw new Error('program.program_info.weeks must be a positive number')
  }

  return {
    schemaVersion: typeof program.schema_version === 'string' && program.schema_version
      ? program.schema_version
      : '1.2',
    block,
    weeks: Math.round(weeks),
    input: (program.input && typeof program.input === 'object')
      ? program.input as Record<string, unknown>
      : {},
    calculated: (program.calculated && typeof program.calculated === 'object')
      ? program.calculated as Record<string, unknown>
      : {},
    sessions: program.sessions,
  }
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { slug } = await params

    const [template] = await db
      .select()
      .from(programTemplates)
      .where(eq(programTemplates.slug, slug))
      .limit(1)

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({
      template: {
        slug: template.slug,
        name: template.name,
        description: template.description,
        scope: template.scope,
        lift: template.lift,
        block: template.block,
        weeks: template.weeks,
        schemaVersion: template.schemaVersion,
        input: template.input,
        calculated: template.calculated,
        sessionsTemplate: template.sessionsTemplate,
        sourceProgramFilename: template.sourceProgramFilename,
        createdAt: template.createdAt,
        createdBy: template.createdBy,
      },
    })
  } catch (error) {
    console.error('Error loading template:', error)
    return NextResponse.json(
      { error: 'Failed to load template' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { slug } = await params

    const [template] = await db
      .select({
        id: programTemplates.id,
        scope: programTemplates.scope,
        lift: programTemplates.lift,
      })
      .from(programTemplates)
      .where(eq(programTemplates.slug, slug))
      .limit(1)

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const body = await request.json() as Record<string, unknown>
    const updates: Record<string, unknown> = {}

    if (typeof body.name === 'string' && body.name.trim()) {
      updates.name = body.name.trim()
      updates.slug = createTemplateSlug(body.name.trim())

      // Ensure new slug doesn't collide with a different template
      const [collision] = await db
        .select({ id: programTemplates.id })
        .from(programTemplates)
        .where(eq(programTemplates.slug, updates.slug as string))
        .limit(1)

      if (collision && collision.id !== template.id) {
        let candidate = updates.slug as string
        let suffix = 2
        while (true) {
          candidate = `${updates.slug}-${suffix}`
          const [dup] = await db
            .select({ id: programTemplates.id })
            .from(programTemplates)
            .where(eq(programTemplates.slug, candidate))
            .limit(1)
          if (!dup) break
          suffix += 1
        }
        updates.slug = candidate
      }
    }

    if (typeof body.description === 'string') {
      updates.description = body.description.trim() || null
    }

    if (body.program) {
      const parsed = readProgramShape(body.program)
      const allowed = allowedLiftsForTemplate(template)
      const inputSubset = pickLiftSubset(parsed.input, allowed)
      const calculatedSubset = pickLiftSubset(parsed.calculated, allowed)

      if (Object.keys(inputSubset).length === 0) {
        return NextResponse.json(
          { error: 'Program payload has no matching lift input for this template scope' },
          { status: 400 },
        )
      }

      if (Object.keys(calculatedSubset).length === 0) {
        return NextResponse.json(
          { error: 'Program payload has no matching calculated data for this template scope' },
          { status: 400 },
        )
      }

      const sessionsTemplate = extractZoneTemplateSessions(
        parsed.sessions,
        parsed.calculated,
        allowed,
      )

      updates.schemaVersion = parsed.schemaVersion
      updates.block = parsed.block
      updates.weeks = parsed.weeks
      updates.input = inputSubset
      updates.calculated = calculatedSubset
      updates.sessionsTemplate = sessionsTemplate
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    await db
      .update(programTemplates)
      .set(updates)
      .where(eq(programTemplates.id, template.id))

    return NextResponse.json({ success: true, slug: updates.slug ?? slug })
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { slug } = await params

    const [template] = await db
      .select({ id: programTemplates.id, name: programTemplates.name })
      .from(programTemplates)
      .where(eq(programTemplates.slug, slug))
      .limit(1)

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    await db
      .delete(programTemplates)
      .where(eq(programTemplates.id, template.id))

    return NextResponse.json({ success: true, deleted: slug })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 },
    )
  }
}
