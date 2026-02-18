import { NextResponse } from 'next/server'
import { db } from '@/db'
import { clients, oneRmRecords, programs } from '@/db/schema'
import { eq, sql, ne } from 'drizzle-orm'

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

    // Check if client already exists
    const [existing] = await db.select({ id: clients.id }).from(clients).where(eq(clients.slug, slug)).limit(1)
    if (existing) {
      return NextResponse.json(
        { error: 'Client with this name already exists' },
        { status: 409 }
      )
    }

    const now = new Date().toISOString()

    // Create client
    const [inserted] = await db.insert(clients).values({
      slug,
      name,
      email,
      status: 'active',
      skillLevel: skill_level || 'intermediate',
      createdAt: now,
      createdBy: 'Web Form',
      lastModified: now,
    }).returning({ id: clients.id })

    // Add initial 1RM if provided
    if (one_rm) {
      await db.insert(oneRmRecords).values({
        clientId: inserted.id,
        date: new Date().toISOString().split('T')[0],
        squat: one_rm.squat || 0,
        benchPress: one_rm.bench_press || 0,
        deadlift: one_rm.deadlift || 0,
        tested: false,
        notes: 'Initial entry',
      })
    }

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
    // Get all active clients with program count and latest 1RM
    const allClients = await db
      .select()
      .from(clients)
      .where(ne(clients.status, 'pending'))

    const result = []

    for (const c of allClients) {
      // Count programs
      const [programCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(programs)
        .where(eq(programs.clientId, c.id))

      // Get latest 1RM
      const [latestRm] = await db
        .select()
        .from(oneRmRecords)
        .where(eq(oneRmRecords.clientId, c.id))
        .orderBy(sql`date DESC`)
        .limit(1)

      result.push({
        slug: c.slug,
        name: c.name,
        email: c.email,
        skill_level: c.skillLevel || 'intermediate',
        latest_one_rm: latestRm ? {
          squat: latestRm.squat,
          bench_press: latestRm.benchPress,
          deadlift: latestRm.deadlift,
          date: latestRm.date,
        } : null,
        program_count: programCount?.count || 0,
        created_at: c.createdAt,
        last_modified: c.lastModified,
      })
    }

    result.sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({ clients: result })
  } catch (error) {
    console.error('Error listing clients:', error)
    return NextResponse.json(
      { error: 'Failed to list clients' },
      { status: 500 }
    )
  }
}
