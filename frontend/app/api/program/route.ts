import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const client = searchParams.get('client')
    const filename = searchParams.get('filename')

    let jsonPath: string

    if (client && filename) {
      // Load specific program by client and filename
      jsonPath = path.join(
        process.cwd(),
        '..',
        'data',
        'clients',
        client,
        'programs',
        filename
      )
    } else {
      // Default: load the example program
      jsonPath = path.join(
        process.cwd(),
        '..',
        'data',
        'clients',
        'katerina-balasova',
        'programs',
        '2025-01-20_prep_squat.json'
      )
    }

    // Read the file
    const fileContents = fs.readFileSync(jsonPath, 'utf8')
    const program = JSON.parse(fileContents)

    return NextResponse.json(program)
  } catch (error) {
    console.error('Error loading program:', error)
    return NextResponse.json(
      { error: 'Failed to load program' },
      { status: 500 }
    )
  }
}
