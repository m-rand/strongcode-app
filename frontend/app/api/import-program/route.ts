import { NextResponse } from 'next/server'
import { db } from '@/db'
import { programs, clients } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { validateProgramWithVersion } from '@/lib/program/schemaValidation'

export async function POST(request: Request) {
  try {
    const programData = await request.json()

    // Validate program data
    const validation = await validateProgramWithVersion(programData)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid program format',
          schema_version: validation.schemaVersion,
          details: validation.errors,
        },
        { status: 400 }
      )
    }

    // Determine client slug
    const clientSlug = programData.client.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')

    // Find client in DB
    const [client] = await db.select({ id: clients.id }).from(clients).where(eq(clients.slug, clientSlug)).limit(1)

    if (!client) {
      return NextResponse.json(
        { error: `Client "${clientSlug}" not found in database` },
        { status: 404 }
      )
    }

    // Generate filename if not provided
    let filename = programData.meta.filename
    if (!filename) {
      const date = new Date().toISOString().split('T')[0]
      const block = programData.program_info.block || 'unknown'
      filename = `${date}_${clientSlug}_${block}_all_lifts.json`
    }
    if (!filename.endsWith('.json')) {
      filename += '.json'
    }

    // Update meta
    programData.meta.filename = filename
    programData.meta.imported_at = new Date().toISOString()
    if (!programData.meta.created_at) {
      programData.meta.created_at = new Date().toISOString()
    }

    // Save to database
    await db.insert(programs).values({
      clientId: client.id,
      filename,
      schemaVersion: programData.schema_version || '1.0',
      status: programData.meta.status || 'draft',
      block: programData.program_info.block,
      startDate: programData.program_info.start_date,
      endDate: programData.program_info.end_date || '',
      weeks: programData.program_info.weeks || 4,
      clientSnapshot: programData.client,
      input: programData.input,
      calculated: programData.calculated,
      sessionsData: programData.sessions || {},
      createdAt: programData.meta.created_at,
      createdBy: programData.meta.created_by || 'Import',
    })

    return NextResponse.json({
      success: true,
      filename,
      client: clientSlug,
      has_sessions: !!programData.sessions,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to import program'
    console.error('Import error:', error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
