import { NextResponse } from 'next/server'
import { db } from '@/db'
import { programs, clients } from '@/db/schema'
import { eq } from 'drizzle-orm'

// Simple validation function
function validateProgram(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.schema_version) errors.push('Missing schema_version')
  if (!data.meta) errors.push('Missing meta')
  if (!data.client) errors.push('Missing client')
  if (!data.program_info) errors.push('Missing program_info')
  if (!data.input) errors.push('Missing input')
  if (!data.calculated) errors.push('Missing calculated')

  if (data.meta) {
    if (!data.meta.filename) errors.push('Missing meta.filename')
    if (!data.meta.created_at) errors.push('Missing meta.created_at')
    if (!data.meta.status) errors.push('Missing meta.status')
  }

  if (data.client) {
    if (!data.client.name) errors.push('Missing client.name')
    if (!data.client.one_rm) errors.push('Missing client.one_rm')
    if (data.client.one_rm) {
      if (!data.client.one_rm.squat) errors.push('Missing client.one_rm.squat')
      if (!data.client.one_rm.bench_press) errors.push('Missing client.one_rm.bench_press')
      if (!data.client.one_rm.deadlift) errors.push('Missing client.one_rm.deadlift')
    }
  }

  if (data.program_info) {
    if (!data.program_info.block) errors.push('Missing program_info.block')
    if (!data.program_info.start_date) errors.push('Missing program_info.start_date')
    if (!data.program_info.weeks) errors.push('Missing program_info.weeks')
  }

  if (data.input) {
    if (!data.input.squat) errors.push('Missing input.squat')
    if (!data.input.bench_press) errors.push('Missing input.bench_press')
    if (!data.input.deadlift) errors.push('Missing input.deadlift')
  }

  if (data.calculated) {
    if (!data.calculated.squat) errors.push('Missing calculated.squat')
    if (!data.calculated.bench_press) errors.push('Missing calculated.bench_press')
    if (!data.calculated.deadlift) errors.push('Missing calculated.deadlift')
  }

  return { valid: errors.length === 0, errors }
}

export async function POST(request: Request) {
  try {
    const programData = await request.json()

    // Validate program data
    const validation = validateProgram(programData)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid program format', details: validation.errors },
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
  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to import program' },
      { status: 500 }
    )
  }
}
