import { NextResponse } from 'next/server'
import { db } from '@/db'
import { programs, clients } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ client: string; filename: string }> }
) {
  try {
    const { client: clientSlug, filename } = await params
    const decodedFilename = decodeURIComponent(filename)

    const [client] = await db.select({ id: clients.id }).from(clients).where(eq(clients.slug, clientSlug)).limit(1)

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const [program] = await db
      .select()
      .from(programs)
      .where(and(
        eq(programs.clientId, client.id),
        eq(programs.filename, decodedFilename)
      ))
      .limit(1)

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    const programData = {
      schema_version: program.schemaVersion,
      meta: {
        filename: program.filename,
        created_at: program.createdAt,
        created_by: program.createdBy,
        status: program.status,
      },
      client: program.clientSnapshot,
      program_info: {
        block: program.block,
        start_date: program.startDate,
        end_date: program.endDate,
        weeks: program.weeks,
      },
      input: program.input,
      calculated: program.calculated,
      sessions: program.sessionsData,
    }

    return NextResponse.json({ program: programData })
  } catch (error) {
    console.error('Error loading program:', error)
    return NextResponse.json(
      { error: 'Failed to load program' },
      { status: 500 }
    )
  }
}
