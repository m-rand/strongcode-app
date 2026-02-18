import { NextResponse } from 'next/server'
import { db } from '@/db'
import { clients, oneRmRecords, programs } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const [client] = await db.select().from(clients).where(eq(clients.slug, slug)).limit(1)

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Get 1RM history
    const rmHistory = await db
      .select()
      .from(oneRmRecords)
      .where(eq(oneRmRecords.clientId, client.id))
      .orderBy(sql`date DESC`)

    // Get programs
    const clientPrograms = await db
      .select()
      .from(programs)
      .where(eq(programs.clientId, client.id))
      .orderBy(sql`start_date DESC`)

    const programList = clientPrograms.map(p => ({
      filename: p.filename,
      block: p.block,
      startDate: p.startDate,
      weeks: p.weeks,
      status: p.status,
      hasSessions: !!p.sessionsData && Object.keys(p.sessionsData as object).length > 0,
    }))

    // Build profile-like response for backward compatibility
    const profile = {
      schema_version: client.schemaVersion,
      status: client.status,
      name: client.name,
      email: client.email,
      skill_level: client.skillLevel,
      preferences: client.preferences,
      survey: client.survey,
      notes: client.notes,
      one_rm_history: rmHistory.map(r => ({
        date: r.date,
        squat: r.squat,
        bench_press: r.benchPress,
        deadlift: r.deadlift,
        tested: r.tested,
        notes: r.notes,
      })),
      created_at: client.createdAt,
      _meta: {
        created_by: client.createdBy,
        last_modified: client.lastModified,
      },
    }

    return NextResponse.json({
      client: { slug, ...profile },
      programs: programList,
    })
  } catch (error) {
    console.error('Error loading client:', error)
    return NextResponse.json(
      { error: 'Failed to load client' },
      { status: 500 }
    )
  }
}
