import { NextResponse } from 'next/server'
import { db } from '@/db'
import { programTemplates } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { createTemplateSlug } from '@/lib/program/templates'

type RouteContext = { params: Promise<{ slug: string }> }

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
      .select({ id: programTemplates.id })
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
