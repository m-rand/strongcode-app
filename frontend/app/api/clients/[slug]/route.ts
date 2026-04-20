import { NextResponse } from 'next/server'
import { db } from '@/db'
import { clients, oneRmRecords, programs } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()

    const [client] = await db.select().from(clients).where(eq(clients.slug, slug)).limit(1)

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Build update object from allowed fields
    const updates: Record<string, unknown> = {}

    if (body.name !== undefined) updates.name = body.name
    if (body.email !== undefined) updates.email = body.email
    if (body.skillLevel !== undefined) updates.skillLevel = body.skillLevel
    if (body.notes !== undefined) updates.notes = body.notes
    if (body.preferences !== undefined) updates.preferences = body.preferences
    if (body.survey !== undefined) updates.survey = body.survey
    if (body.status !== undefined) updates.status = body.status

    updates.lastModified = new Date().toISOString()

    await db.update(clients).set(updates).where(eq(clients.slug, slug))

    // Handle 1RM update: update existing record or insert new one
    if (body.oneRm) {
      const { date, squat, bench_press, deadlift, tested, notes: rmNotes } = body.oneRm

      if (body.oneRm.id) {
        // Update existing record
        await db.update(oneRmRecords).set({
          date,
          squat,
          benchPress: bench_press,
          deadlift,
          tested: tested ?? false,
          notes: rmNotes,
        }).where(and(eq(oneRmRecords.id, body.oneRm.id), eq(oneRmRecords.clientId, client.id)))
      } else {
        // Insert new record
        await db.insert(oneRmRecords).values({
          clientId: client.id,
          date,
          squat,
          benchPress: bench_press,
          deadlift,
          tested: tested ?? false,
          notes: rmNotes,
        })
      }
    }

    // Return updated client
    const [updated] = await db.select().from(clients).where(eq(clients.slug, slug)).limit(1)

    return NextResponse.json({ client: updated })
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    )
  }
}

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
      .orderBy(sql`start_date DESC`, sql`id DESC`)

    // Show only the latest row for each filename (older duplicates can exist
    // from historical saves before upsert logic was fixed).
    const seenFilenames = new Set<string>()
    const programList = clientPrograms
      .filter((p) => {
        if (seenFilenames.has(p.filename)) return false
        seenFilenames.add(p.filename)
        return true
      })
      .map(p => ({
        id: p.id,
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
        id: r.id,
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
