import { NextResponse } from 'next/server'
import { db } from '@/db'
import { programTemplates } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { createTemplateSlug } from '@/lib/program/templates'

type RouteContext = { params: Promise<{ slug: string }> }

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

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const { slug } = await params

    const [source] = await db
      .select()
      .from(programTemplates)
      .where(eq(programTemplates.slug, slug))
      .limit(1)

    if (!source) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const copiedName = `${source.name} (copy)`
    const copiedSlug = await getUniqueSlug(copiedName)

    await db.insert(programTemplates).values({
      slug: copiedSlug,
      name: copiedName,
      description: source.description,
      scope: source.scope,
      lift: source.lift,
      block: source.block,
      weeks: source.weeks,
      schemaVersion: source.schemaVersion,
      input: source.input,
      calculated: source.calculated,
      sessionsTemplate: source.sessionsTemplate,
      sourceProgramFilename: source.sourceProgramFilename,
      createdBy: source.createdBy || 'Template duplicate',
    })

    const [inserted] = await db
      .select()
      .from(programTemplates)
      .where(and(eq(programTemplates.slug, copiedSlug), eq(programTemplates.name, copiedName)))
      .limit(1)

    if (!inserted) {
      return NextResponse.json({ error: 'Failed to load duplicated template' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      template: {
        id: inserted.id,
        slug: inserted.slug,
        name: inserted.name,
        description: inserted.description,
        scope: inserted.scope,
        lift: inserted.lift,
        block: inserted.block,
        weeks: inserted.weeks,
        sourceProgramFilename: inserted.sourceProgramFilename,
        createdAt: inserted.createdAt,
        createdBy: inserted.createdBy,
      },
    })
  } catch (error) {
    console.error('Error duplicating template:', error)
    return NextResponse.json(
      { error: 'Failed to duplicate template' },
      { status: 500 },
    )
  }
}

