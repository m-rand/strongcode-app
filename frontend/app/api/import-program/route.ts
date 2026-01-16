import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// Simple validation function
function validateProgram(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Required top-level fields
  if (!data.schema_version) errors.push('Missing schema_version')
  if (!data.meta) errors.push('Missing meta')
  if (!data.client) errors.push('Missing client')
  if (!data.program_info) errors.push('Missing program_info')
  if (!data.input) errors.push('Missing input')
  if (!data.calculated) errors.push('Missing calculated')

  // Validate meta
  if (data.meta) {
    if (!data.meta.filename) errors.push('Missing meta.filename')
    if (!data.meta.created_at) errors.push('Missing meta.created_at')
    if (!data.meta.status) errors.push('Missing meta.status')
  }

  // Validate client
  if (data.client) {
    if (!data.client.name) errors.push('Missing client.name')
    if (!data.client.one_rm) errors.push('Missing client.one_rm')
    if (data.client.one_rm) {
      if (!data.client.one_rm.squat) errors.push('Missing client.one_rm.squat')
      if (!data.client.one_rm.bench_press) errors.push('Missing client.one_rm.bench_press')
      if (!data.client.one_rm.deadlift) errors.push('Missing client.one_rm.deadlift')
    }
  }

  // Validate program_info
  if (data.program_info) {
    if (!data.program_info.block) errors.push('Missing program_info.block')
    if (!data.program_info.start_date) errors.push('Missing program_info.start_date')
    if (!data.program_info.weeks) errors.push('Missing program_info.weeks')
  }

  // Validate input (must have all 3 lifts)
  if (data.input) {
    if (!data.input.squat) errors.push('Missing input.squat')
    if (!data.input.bench_press) errors.push('Missing input.bench_press')
    if (!data.input.deadlift) errors.push('Missing input.deadlift')
  }

  // Validate calculated (must have all 3 lifts)
  if (data.calculated) {
    if (!data.calculated.squat) errors.push('Missing calculated.squat')
    if (!data.calculated.bench_press) errors.push('Missing calculated.bench_press')
    if (!data.calculated.deadlift) errors.push('Missing calculated.deadlift')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export async function POST(request: Request) {
  try {
    const programData = await request.json()

    // Validate program data
    const validation = validateProgram(programData)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid program format',
          details: validation.errors,
        },
        { status: 400 }
      )
    }

    // Determine client slug
    const clientSlug = programData.client.name.toLowerCase().replace(/\s+/g, '-')

    // Ensure directory exists
    const clientDir = path.join(process.cwd(), '..', 'data', 'clients', clientSlug, 'programs')
    await fs.mkdir(clientDir, { recursive: true })

    // Generate filename if not provided or use existing
    let filename = programData.meta.filename
    if (!filename) {
      const date = new Date().toISOString().split('T')[0]
      const block = programData.program_info.block || 'unknown'
      filename = `${date}_${clientSlug}_${block}_all_lifts.json`
    }

    // Ensure filename ends with .json
    if (!filename.endsWith('.json')) {
      filename += '.json'
    }

    // Update meta with import info
    programData.meta.filename = filename
    programData.meta.imported_at = new Date().toISOString()
    if (!programData.meta.created_at) {
      programData.meta.created_at = new Date().toISOString()
    }

    // Save to file
    const filePath = path.join(clientDir, filename)
    await fs.writeFile(filePath, JSON.stringify(programData, null, 2))

    console.log(`✅ Program imported: ${filePath}`)

    return NextResponse.json({
      success: true,
      filename,
      client: clientSlug,
      path: filePath,
      has_sessions: !!programData.sessions,
    })
  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to import program',
      },
      { status: 500 }
    )
  }
}
