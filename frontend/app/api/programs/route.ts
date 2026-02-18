import { NextResponse } from 'next/server'
import { db } from '@/db'
import { programs, clients } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

export async function GET() {
  try {
    const allPrograms = await db
      .select({
        id: programs.id,
        filename: programs.filename,
        clientId: programs.clientId,
        block: programs.block,
        startDate: programs.startDate,
        weeks: programs.weeks,
        status: programs.status,
        sessionsData: programs.sessionsData,
        clientSnapshot: programs.clientSnapshot,
        clientSlug: clients.slug,
      })
      .from(programs)
      .leftJoin(clients, eq(programs.clientId, clients.id))
      .orderBy(sql`programs.start_date DESC`)

    const result = allPrograms.map(p => ({
      filename: p.filename,
      client: p.clientSlug,
      clientName: (p.clientSnapshot as any)?.name || p.clientSlug,
      block: p.block,
      startDate: p.startDate,
      weeks: p.weeks,
      status: p.status,
      hasSessions: !!p.sessionsData && Object.keys(p.sessionsData as object).length > 0,
    }))

    return NextResponse.json({ programs: result })
  } catch (error) {
    console.error('Error listing programs:', error)
    return NextResponse.json(
      { error: 'Failed to list programs' },
      { status: 500 }
    )
  }
}
