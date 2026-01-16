import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ client: string; filename: string }> }
) {
  try {
    const { client, filename } = await params
    const decodedFilename = decodeURIComponent(filename)

    const filePath = path.join(
      process.cwd(),
      '..',
      'data',
      'clients',
      client,
      'programs',
      decodedFilename
    )

    // Check if file exists
    try {
      await fs.access(filePath)
    } catch {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      )
    }

    // Read and parse program
    const fileContent = await fs.readFile(filePath, 'utf-8')
    const programData = JSON.parse(fileContent)

    return NextResponse.json({ program: programData })
  } catch (error) {
    console.error('Error loading program:', error)
    return NextResponse.json(
      { error: 'Failed to load program' },
      { status: 500 }
    )
  }
}
