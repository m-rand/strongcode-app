import { NextResponse } from 'next/server'
import { db } from '@/db'
import { clients, oneRmRecords } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const surveyData = await request.json()

    const [client] = await db.select().from(clients).where(eq(clients.slug, slug)).limit(1)

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const now = new Date().toISOString()

    // Build survey object
    const survey = {
      completed_at: now,
      can_lift_1rm_anytime: surveyData.can_lift_1rm_anytime,
      reps_at_75_percent: surveyData.reps_at_75_percent,
      reps_at_85_percent: surveyData.reps_at_85_percent,
      reps_at_92_5_percent: surveyData.reps_at_92_5_percent,
      minimum_weight_jump: surveyData.minimum_weight_jump,
      external_stress_level: surveyData.external_stress_level,
      training_frequency_per_week: surveyData.training_frequency_per_week,
      avg_lifts_70_percent_per_week: surveyData.avg_lifts_70_percent_per_week,
      lifts_95_100_percent_per_month: surveyData.lifts_95_100_percent_per_month,
      improvement_last_2_months: surveyData.improvement_last_2_months,
      improvement_last_year: surveyData.improvement_last_year,
      training_sessions_per_week_lately: surveyData.training_sessions_per_week_lately,
      max_training_sessions_per_week: surveyData.max_training_sessions_per_week,
      muscle_mass_importance: surveyData.muscle_mass_importance,
    }

    // Update client fields
    await db.update(clients)
      .set({
        name: surveyData.name || client.name,
        survey,
        notes: surveyData.other_comments || client.notes,
        lastModified: now,
      })
      .where(eq(clients.slug, slug))

    // Add new 1RM entry if provided
    if (surveyData.one_rm) {
      await db.insert(oneRmRecords).values({
        clientId: client.id,
        date: new Date().toISOString().split('T')[0],
        squat: surveyData.one_rm.squat,
        benchPress: surveyData.one_rm.bench,
        deadlift: surveyData.one_rm.deadlift,
        tested: false,
        notes: 'From Be Strong Survey',
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Survey saved successfully'
    })
  } catch (error) {
    console.error('Error saving survey:', error)
    return NextResponse.json(
      { error: 'Failed to save survey' },
      { status: 500 }
    )
  }
}
