import { NextResponse } from 'next/server'
import { db } from '@/db'
import { clients, oneRmRecords } from '@/db/schema'
import { eq } from 'drizzle-orm'

// Helper function to create slug from name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function POST(request: Request) {
  try {
    const surveyData = await request.json()

    // Validation
    if (!surveyData.name || !surveyData.email) {
      return NextResponse.json(
        { error: 'Jméno a email jsou povinné' },
        { status: 400 }
      )
    }

    if (!surveyData.one_rm?.squat || !surveyData.one_rm?.bench || !surveyData.one_rm?.deadlift) {
      return NextResponse.json(
        { error: 'Všechny 1RM hodnoty jsou povinné' },
        { status: 400 }
      )
    }

    // Check if client with this email already exists
    const allClients = await db.select({ email: clients.email }).from(clients)
    const emailExists = allClients.some(c => c.email?.toLowerCase() === surveyData.email.toLowerCase())
    if (emailExists) {
      return NextResponse.json(
        { error: 'Klient s tímto emailem již existuje' },
        { status: 409 }
      )
    }

    const slug = createSlug(surveyData.name)

    // Check if slug already exists
    const [existingSlug] = await db.select({ id: clients.id }).from(clients).where(eq(clients.slug, slug)).limit(1)
    if (existingSlug) {
      return NextResponse.json(
        { error: 'Klient s tímto jménem již existuje' },
        { status: 409 }
      )
    }

    // Determine skill level
    const total = (surveyData.one_rm.squat || 0) +
                  (surveyData.one_rm.bench || 0) +
                  (surveyData.one_rm.deadlift || 0)

    let skill_level: 'beginner' | 'intermediate' | 'advanced' | 'elite' = 'beginner'
    if (total >= 600) skill_level = 'elite'
    else if (total >= 500) skill_level = 'advanced'
    else if (total >= 350) skill_level = 'intermediate'

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

    // Create client with pending status
    const [inserted] = await db.insert(clients).values({
      slug,
      name: surveyData.name,
      email: surveyData.email,
      status: 'pending',
      skillLevel: skill_level,
      survey,
      notes: surveyData.other_comments || null,
      createdAt: now,
      createdBy: 'public_survey',
      lastModified: now,
    }).returning({ id: clients.id })

    // Add 1RM record
    await db.insert(oneRmRecords).values({
      clientId: inserted.id,
      date: new Date().toISOString().split('T')[0],
      squat: surveyData.one_rm.squat,
      benchPress: surveyData.one_rm.bench,
      deadlift: surveyData.one_rm.deadlift,
      tested: false,
      notes: 'Initial survey data',
    })

    return NextResponse.json({
      success: true,
      message: 'Dotazník byl úspěšně uložen',
      client_slug: slug
    })
  } catch (error) {
    console.error('Error creating client from survey:', error)
    return NextResponse.json(
      { error: 'Nepodařilo se uložit dotazník' },
      { status: 500 }
    )
  }
}
