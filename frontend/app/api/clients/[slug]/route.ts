import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const clientPath = path.join(process.cwd(), '..', 'data', 'clients', slug)
    const profilePath = path.join(clientPath, 'profile.json')

    // Check if client exists
    try {
      await fs.access(profilePath)
    } catch {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Read profile
    const profileContent = await fs.readFile(profilePath, 'utf-8')
    const profile = JSON.parse(profileContent)

    // Get programs
    const programsDir = path.join(clientPath, 'programs')
    const programs = []

    try {
      const files = await fs.readdir(programsDir)

      for (const filename of files) {
        if (!filename.endsWith('.json')) continue

        const filePath = path.join(programsDir, filename)
        const fileContent = await fs.readFile(filePath, 'utf-8')

        try {
          const programData = JSON.parse(fileContent)

          programs.push({
            filename,
            block: programData.program_info?.block || 'unknown',
            startDate: programData.program_info?.start_date || 'N/A',
            weeks: programData.program_info?.weeks || 4,
            status: programData.meta?.status || 'draft',
            hasSessions: !!programData.sessions,
          })
        } catch (parseError) {
          console.error(`Failed to parse ${filePath}:`, parseError)
        }
      }
    } catch {
      // Programs directory doesn't exist
    }

    // Sort programs by start date (newest first)
    programs.sort((a, b) => {
      if (a.startDate === 'N/A') return 1
      if (b.startDate === 'N/A') return -1
      return b.startDate.localeCompare(a.startDate)
    })

    return NextResponse.json({
      client: {
        slug,
        ...profile
      },
      programs
    })
  } catch (error) {
    console.error('Error loading client:', error)
    return NextResponse.json(
      { error: 'Failed to load client' },
      { status: 500 }
    )
  }
}
