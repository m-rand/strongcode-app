import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET() {
  try {
    const clientsDir = path.join(process.cwd(), '..', 'data', 'clients')

    // Check if clients directory exists
    try {
      await fs.access(clientsDir)
    } catch {
      return NextResponse.json({ clients: [] })
    }

    // Read all client directories
    const clientSlugs = await fs.readdir(clientsDir)

    const clients = []

    for (const slug of clientSlugs) {
      const clientPath = path.join(clientsDir, slug)
      const stats = await fs.stat(clientPath)

      if (!stats.isDirectory()) continue

      // Try to read profile.json
      const profilePath = path.join(clientPath, 'profile.json')
      let profile = null

      try {
        const profileContent = await fs.readFile(profilePath, 'utf-8')
        profile = JSON.parse(profileContent)
      } catch {
        // Profile doesn't exist, skip this client or use defaults
        continue
      }

      // Count programs
      const programsDir = path.join(clientPath, 'programs')
      let programCount = 0

      try {
        const files = await fs.readdir(programsDir)
        programCount = files.filter(f => f.endsWith('.json')).length
      } catch {
        // Programs directory doesn't exist
        programCount = 0
      }

      // Get latest 1RM
      const latestOneRM = profile.one_rm_history?.[0] || null

      clients.push({
        slug,
        name: profile.name,
        email: profile.email,
        skill_level: profile.skill_level || 'intermediate',
        latest_one_rm: latestOneRM ? {
          squat: latestOneRM.squat,
          bench_press: latestOneRM.bench_press,
          deadlift: latestOneRM.deadlift,
          date: latestOneRM.date
        } : null,
        program_count: programCount,
        created_at: profile.created_at,
        last_modified: profile._meta?.last_modified
      })
    }

    // Sort by name
    clients.sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({ clients })
  } catch (error) {
    console.error('Error listing clients:', error)
    return NextResponse.json(
      { error: 'Failed to list clients' },
      { status: 500 }
    )
  }
}
