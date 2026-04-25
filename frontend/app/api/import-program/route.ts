import { NextResponse } from 'next/server'
import { db } from '@/db'
import { programs, clients } from '@/db/schema'
import { eq, and, desc, ne } from 'drizzle-orm'
import { validateProgramWithVersion } from '@/lib/program/schemaValidation'

const FILENAME_PATTERN = /^\d{4}-\d{2}-\d{2}_[a-z0-9-]+_(prep|comp)_all_lifts\.json$/

const toClientSlug = (name: string) => {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || 'client'
}

const canonicalSessionLetter = (raw: string, fallbackIndex: number): string => {
  const normalized = raw.trim().toUpperCase()
  if (/^[A-Z]$/.test(normalized)) return normalized

  const standalone = normalized.match(/\b([A-Z])\b/)
  if (standalone?.[1]) return standalone[1]

  const lastLetter = normalized.match(/([A-Z])[^A-Z]*$/)
  if (lastLetter?.[1]) return lastLetter[1]

  return String.fromCharCode(65 + (fallbackIndex % 26))
}

const normalizeSessionsShape = (sessions: unknown): unknown => {
  if (!sessions || typeof sessions !== 'object' || Array.isArray(sessions)) return sessions

  const input = sessions as Record<string, unknown>
  const output: Record<string, unknown> = {}

  Object.entries(input).forEach(([sessionKey, sessionValue], index) => {
    const normalizedKey = canonicalSessionLetter(sessionKey, index)

    if (!sessionValue || typeof sessionValue !== 'object' || Array.isArray(sessionValue)) {
      output[normalizedKey] = sessionValue
      return
    }

    const sessionRecord = sessionValue as Record<string, unknown>
    const normalizedSession: Record<string, unknown> = {}
    for (let week = 1; week <= 6; week++) {
      const weekKey = `week_${week}`
      if (sessionRecord[weekKey] !== undefined) {
        normalizedSession[weekKey] = sessionRecord[weekKey]
      }
    }
    output[normalizedKey] = normalizedSession
  })

  return output
}

export async function POST(request: Request) {
  try {
    const programData = await request.json()

    // Make payload robust for older UI/client formats before schema validation.
    if (programData && typeof programData === 'object') {
      const payload = programData as Record<string, unknown>
      const meta = (payload.meta && typeof payload.meta === 'object')
        ? payload.meta as Record<string, unknown>
        : {}
      const client = (payload.client && typeof payload.client === 'object')
        ? payload.client as Record<string, unknown>
        : {}
      const info = (payload.program_info && typeof payload.program_info === 'object')
        ? payload.program_info as Record<string, unknown>
        : {}

      // Normalize session keys to schema-compatible letter keys (A, B, C...).
      payload.sessions = normalizeSessionsShape(payload.sessions)

      // Ensure filename always matches schema pattern.
      const filenameRaw = typeof meta.filename === 'string' ? meta.filename : ''
      if (!FILENAME_PATTERN.test(filenameRaw)) {
        const date = new Date().toISOString().split('T')[0]
        const clientSlug = toClientSlug(typeof client.name === 'string' ? client.name : 'client')
        const block = info.block === 'comp' ? 'comp' : 'prep'
        meta.filename = `${date}_${clientSlug}_${block}_all_lifts.json`
      }

      if (!payload.meta || typeof payload.meta !== 'object') {
        payload.meta = meta
      }
    }

    // Validate program data
    const validation = await validateProgramWithVersion(programData)
    if (!validation.valid) {
      const detailSummary = validation.errors.slice(0, 3).join(' | ')
      return NextResponse.json(
        {
          error: detailSummary ? `Invalid program format: ${detailSummary}` : 'Invalid program format',
          schema_version: validation.schemaVersion,
          details: validation.errors,
        },
        { status: 400 }
      )
    }

    // Determine client slug
    const clientSlug = programData.client.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')

    // Find client in DB
    const [client] = await db.select({ id: clients.id }).from(clients).where(eq(clients.slug, clientSlug)).limit(1)

    if (!client) {
      return NextResponse.json(
        { error: `Client "${clientSlug}" not found in database` },
        { status: 404 }
      )
    }

    // Generate filename if not provided
    let filename = programData.meta.filename
    if (!filename) {
      const date = new Date().toISOString().split('T')[0]
      const block = programData.program_info.block || 'unknown'
      filename = `${date}_${clientSlug}_${block}_all_lifts.json`
    }
    if (!filename.endsWith('.json')) {
      filename += '.json'
    }

    // Update meta
    programData.meta.filename = filename
    programData.meta.imported_at = new Date().toISOString()
    if (!programData.meta.created_at) {
      programData.meta.created_at = new Date().toISOString()
    }

    const [existingProgram] = await db
      .select({
        id: programs.id,
        status: programs.status,
        createdAt: programs.createdAt,
        createdBy: programs.createdBy,
      })
      .from(programs)
      .where(and(eq(programs.clientId, client.id), eq(programs.filename, filename)))
      .orderBy(desc(programs.id))
      .limit(1)

    const rowValues = {
      clientId: client.id,
      filename,
      schemaVersion: programData.schema_version || '1.0',
      status: programData.meta.status || existingProgram?.status || 'draft',
      block: programData.program_info.block,
      startDate: programData.program_info.start_date,
      endDate: programData.program_info.end_date || '',
      weeks: programData.program_info.weeks || 4,
      clientSnapshot: programData.client,
      input: programData.input,
      calculated: programData.calculated,
      sessionsData: programData.sessions || {},
      notes: typeof programData.meta?.notes === 'string' ? programData.meta.notes : null,
      createdAt: programData.meta.created_at || existingProgram?.createdAt || new Date().toISOString(),
      createdBy: programData.meta.created_by || existingProgram?.createdBy || 'Import',
    }

    let savedProgramId: number
    if (existingProgram) {
      await db.update(programs).set(rowValues).where(eq(programs.id, existingProgram.id))
      savedProgramId = existingProgram.id
    } else {
      const inserted = await db.insert(programs).values(rowValues).returning({ id: programs.id })
      savedProgramId = inserted[0]?.id
        ? Number(inserted[0].id)
        : 0
    }

    if (rowValues.status === 'active' && savedProgramId > 0) {
      await db
        .update(programs)
        .set({ status: 'completed' })
        .where(and(
          eq(programs.clientId, client.id),
          eq(programs.status, 'active'),
          ne(programs.id, savedProgramId),
        ))
    }

    return NextResponse.json({
      success: true,
      filename,
      client: clientSlug,
      has_sessions: !!programData.sessions,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to import program'
    console.error('Import error:', error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
