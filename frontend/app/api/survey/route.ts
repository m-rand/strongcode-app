import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// Helper function to create slug from name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single
}

// Helper function to check if client with email already exists
async function findClientByEmail(email: string): Promise<string | null> {
  try {
    const clientsDir = path.join(process.cwd(), '..', 'data', 'clients')
    const clientSlugs = await fs.readdir(clientsDir)

    for (const slug of clientSlugs) {
      const profilePath = path.join(clientsDir, slug, 'profile.json')
      try {
        const profileContent = await fs.readFile(profilePath, 'utf-8')
        const profile = JSON.parse(profileContent)
        if (profile.email?.toLowerCase() === email.toLowerCase()) {
          return slug
        }
      } catch {
        // Skip if profile doesn't exist or can't be read
        continue
      }
    }
  } catch {
    // Clients directory doesn't exist yet
  }
  return null
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
    const existingSlug = await findClientByEmail(surveyData.email)
    if (existingSlug) {
      return NextResponse.json(
        { error: 'Klient s tímto emailem již existuje' },
        { status: 409 }
      )
    }

    // Create slug from name
    const slug = createSlug(surveyData.name)

    // Create client directory structure
    const clientDir = path.join(process.cwd(), '..', 'data', 'clients', slug)
    const programsDir = path.join(clientDir, 'programs')

    try {
      await fs.access(clientDir)
      return NextResponse.json(
        { error: 'Klient s tímto jménem již existuje' },
        { status: 409 }
      )
    } catch {
      // Directory doesn't exist, which is what we want
    }

    // Create directories
    await fs.mkdir(clientDir, { recursive: true })
    await fs.mkdir(programsDir, { recursive: true })

    // Determine skill level based on 1RM total
    const total = (surveyData.one_rm.squat || 0) +
                  (surveyData.one_rm.bench || 0) +
                  (surveyData.one_rm.deadlift || 0)

    let skill_level = 'beginner'
    if (total >= 600) skill_level = 'elite'
    else if (total >= 500) skill_level = 'advanced'
    else if (total >= 350) skill_level = 'intermediate'

    // Create profile object
    const profile = {
      schema_version: '1.0',
      name: surveyData.name,
      email: surveyData.email,
      nationality: surveyData.nationality || undefined,
      gender: surveyData.gender || undefined,
      date_of_birth: surveyData.date_of_birth || undefined,
      height: surveyData.height || undefined,
      weight: surveyData.weight || undefined,
      health_issues: surveyData.health_issues || undefined,
      skill_level,
      one_rm_history: [
        {
          date: new Date().toISOString().split('T')[0],
          squat: surveyData.one_rm.squat,
          bench_press: surveyData.one_rm.bench,
          deadlift: surveyData.one_rm.deadlift,
          tested: false,
          notes: 'Initial survey data'
        }
      ],
      survey: {
        completed_at: new Date().toISOString(),
        can_lift_1rm_anytime: surveyData.can_lift_1rm_anytime || undefined,
        reps_at_75_percent: surveyData.reps_at_75_percent || undefined,
        reps_at_85_percent: surveyData.reps_at_85_percent || undefined,
        reps_at_92_5_percent: surveyData.reps_at_92_5_percent || undefined,
        minimum_weight_jump: surveyData.minimum_weight_jump || undefined,
        external_stress_level: surveyData.external_stress_level || undefined,
        training_frequency_per_week: surveyData.training_frequency_per_week || undefined,
        avg_lifts_70_percent_per_week: surveyData.avg_lifts_70_percent_per_week || undefined,
        lifts_95_100_percent_per_month: surveyData.lifts_95_100_percent_per_month || undefined,
        improvement_last_2_months: surveyData.improvement_last_2_months || undefined,
        improvement_last_year: surveyData.improvement_last_year || undefined,
        training_sessions_per_week_lately: surveyData.training_sessions_per_week_lately || undefined,
        max_training_sessions_per_week: surveyData.max_training_sessions_per_week || undefined,
        muscle_mass_importance: surveyData.muscle_mass_importance || undefined
      },
      notes: surveyData.other_comments || undefined,
      created_at: new Date().toISOString(),
      _meta: {
        created_by: 'public_survey',
        last_modified: new Date().toISOString()
      }
    }

    // Remove undefined values
    const cleanProfile = JSON.parse(JSON.stringify(profile))

    // Write profile.json
    const profilePath = path.join(clientDir, 'profile.json')
    await fs.writeFile(profilePath, JSON.stringify(cleanProfile, null, 2))

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
