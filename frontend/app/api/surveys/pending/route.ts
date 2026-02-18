import { NextResponse } from 'next/server'
import { db } from '@/db'
import { clients, oneRmRecords } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

export async function GET() {
  try {
    const pendingClients = await db
      .select()
      .from(clients)
      .where(eq(clients.status, 'pending'))
      .orderBy(sql`created_at DESC`)

    const surveys = []

    for (const c of pendingClients) {
      // Get latest 1RM
      const [latestRm] = await db
        .select()
        .from(oneRmRecords)
        .where(eq(oneRmRecords.clientId, c.id))
        .orderBy(sql`date DESC`)
        .limit(1)

      surveys.push({
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
        survey: c.survey,
        created_at: c.createdAt,
        notes: c.notes,
      })
    }

    return NextResponse.json({ surveys })
  } catch (error) {
    console.error('Error listing pending surveys:', error)
    return NextResponse.json(
      { error: 'Failed to list pending surveys' },
      { status: 500 }
    )
  }
}
