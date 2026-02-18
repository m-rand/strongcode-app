import { NextResponse } from 'next/server'
import { db } from '@/db'
import { programs, clients } from '@/db/schema'
import { eq, sql, and } from 'drizzle-orm'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientSlug = searchParams.get('client')
    const filename = searchParams.get('filename')

    if (clientSlug && filename) {
      // Load specific program by client slug and filename
      const [client] = await db.select({ id: clients.id }).from(clients).where(eq(clients.slug, clientSlug)).limit(1)

      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }

      const [program] = await db
        .select()
        .from(programs)
        .where(and(eq(programs.clientId, client.id), eq(programs.filename, filename)))
        .limit(1)

      if (!program) {
        return NextResponse.json({ error: 'Program not found' }, { status: 404 })
      }

      // Reconstruct full program JSON
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

      return NextResponse.json(programData)
    }

    // Default: return first program (backward compat)
    const [firstProgram] = await db.select().from(programs).orderBy(sql`start_date DESC`).limit(1)

    if (!firstProgram) {
      return NextResponse.json({ error: 'No programs found' }, { status: 404 })
    }

    return NextResponse.json({
      schema_version: firstProgram.schemaVersion,
      meta: {
        filename: firstProgram.filename,
        created_at: firstProgram.createdAt,
        created_by: firstProgram.createdBy,
        status: firstProgram.status,
      },
      client: firstProgram.clientSnapshot,
      program_info: {
        block: firstProgram.block,
        start_date: firstProgram.startDate,
        end_date: firstProgram.endDate,
        weeks: firstProgram.weeks,
      },
      input: firstProgram.input,
      calculated: firstProgram.calculated,
      sessions: firstProgram.sessionsData,
    })
  } catch (error) {
    console.error('Error loading program:', error)
    return NextResponse.json(
      { error: 'Failed to load program' },
      { status: 500 }
    )
  }
}
