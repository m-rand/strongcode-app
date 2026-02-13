import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// Helper to create slug from name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, skill_level, one_rm } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    const slug = createSlug(name)
    const clientsDir = path.join(process.cwd(), '..', 'data', 'clients')
    const clientDir = path.join(clientsDir, slug)

    // Check if client already exists
    try {
      await fs.access(clientDir)
      return NextResponse.json(
        { error: 'Client with this name already exists' },
        { status: 409 }
      )
    } catch {
      // Client doesn't exist, which is what we want
    }

    // Create client directory
    await fs.mkdir(clientDir, { recursive: true })
    await fs.mkdir(path.join(clientDir, 'programs'), { recursive: true })

    // Create profile
    const now = new Date().toISOString()
    const profile = {
      schema_version: '1.0',
      status: 'active', // Admin-created clients are immediately active
      name,
      email,
      skill_level: skill_level || 'intermediate',
      one_rm_history: one_rm ? [
        {
          date: new Date().toISOString().split('T')[0],
          squat: one_rm.squat || 0,
          bench_press: one_rm.bench_press || 0,
          deadlift: one_rm.deadlift || 0,
          tested: false,
          notes: 'Initial entry'
        }
      ] : [],
      created_at: now,
      _meta: {
        created_by: 'Web Form',
        last_modified: now
      }
    }

    await fs.writeFile(
      path.join(clientDir, 'profile.json'),
      JSON.stringify(profile, null, 2)
    )

    return NextResponse.json({
      success: true,
      slug,
      message: 'Client created successfully'
    })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    )
  }
}

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

      // Only show active clients (skip pending)
      // Clients without status field are treated as active (backward compatibility)
      if (profile.status === 'pending') continue

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
