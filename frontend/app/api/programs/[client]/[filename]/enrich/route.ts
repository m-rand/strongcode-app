import { NextResponse } from 'next/server'
import { db } from '@/db'
import { programs, clients } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { buildRmProfileFromSurvey, enrichProgramWithAre } from '@/lib/program/are'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ client: string; filename: string }> }
) {
  try {
    const { client: clientSlug, filename } = await params
    const decodedFilename = decodeURIComponent(filename)

    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.slug, clientSlug))
      .limit(1)

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

    const snapshot = program.clientSnapshot as Record<string, unknown> | null

    // Priority: use rm_profile already snapshotted in the program,
    // fall back to current survey only if snapshot has none.
    let rmProfile = (snapshot?.rm_profile as Record<string, Record<number, number>> | undefined) ?? null
    let source: 'snapshot' | 'current_survey' = 'snapshot'

    if (!rmProfile) {
      rmProfile = buildRmProfileFromSurvey(client.survey as Record<string, Record<string, number> | undefined> | null)
      source = 'current_survey'
    }

    if (!rmProfile) {
      return NextResponse.json(
        { error: 'No RM profile available — neither in program snapshot nor in client survey' },
        { status: 400 }
      )
    }

    const sessions = program.sessionsData as Record<string, Record<string, { lifts?: Array<{ lift: string; sets?: Array<{ reps: number; zone_pct?: number; percentage?: number }> }> }>> | null
    if (!sessions || Object.keys(sessions).length === 0) {
      return NextResponse.json(
        { error: 'Program has no session data' },
        { status: 400 }
      )
    }

    // Compute enriched calculated with ARE
    const enrichedCalculated = enrichProgramWithAre(
      program.calculated as Record<string, import('@/lib/program/are').CalculatedLift>,
      sessions,
      rmProfile
    )

    // If rm_profile came from current survey (no snapshot existed),
    // save it into snapshot so future enrichments are reproducible.
    const updates: Record<string, unknown> = { calculated: enrichedCalculated }

    if (source === 'current_survey') {
      updates.clientSnapshot = {
        ...snapshot,
        rm_profile: rmProfile,
        rm_profile_source: 'backfilled_from_survey',
        rm_profile_backfilled_at: new Date().toISOString(),
      }
    }

    await db
      .update(programs)
      .set(updates)
      .where(eq(programs.id, program.id))

    return NextResponse.json({
      success: true,
      message: 'ARE enrichment complete',
      rm_profile_source: source,
    })
  } catch (error) {
    console.error('Error enriching program:', error)
    return NextResponse.json(
      { error: 'Failed to enrich program' },
      { status: 500 }
    )
  }
}
