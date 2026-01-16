import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), '..', 'data', 'clients')

    // Check if clients directory exists
    try {
      await fs.access(dataDir)
    } catch {
      return NextResponse.json({ programs: [] })
    }

    // Read all client directories
    const clients = await fs.readdir(dataDir)

    const programs = []

    for (const clientSlug of clients) {
      const programsDir = path.join(dataDir, clientSlug, 'programs')

      try {
        await fs.access(programsDir)
      } catch {
        continue // Skip if programs directory doesn't exist
      }

      const files = await fs.readdir(programsDir)

      for (const filename of files) {
        if (!filename.endsWith('.json')) continue

        const filePath = path.join(programsDir, filename)
        const fileContent = await fs.readFile(filePath, 'utf-8')

        try {
          const programData = JSON.parse(fileContent)

          programs.push({
            filename,
            client: clientSlug,
            clientName: programData.client?.name || clientSlug,
            block: programData.program_info?.block || 'unknown',
            startDate: programData.program_info?.start_date || 'N/A',
            weeks: programData.program_info?.weeks || 4,
            status: programData.meta?.status || 'draft',
            hasSessions: !!programData.sessions,
            filePath,
          })
        } catch (parseError) {
          console.error(`Failed to parse ${filePath}:`, parseError)
        }
      }
    }

    // Sort by start date (newest first)
    programs.sort((a, b) => {
      if (a.startDate === 'N/A') return 1
      if (b.startDate === 'N/A') return -1
      return b.startDate.localeCompare(a.startDate)
    })

    return NextResponse.json({ programs })
  } catch (error) {
    console.error('Error listing programs:', error)
    return NextResponse.json(
      { error: 'Failed to list programs' },
      { status: 500 }
    )
  }
}
