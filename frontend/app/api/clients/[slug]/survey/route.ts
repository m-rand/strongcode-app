import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const surveyData = await request.json()

    const clientPath = path.join(process.cwd(), '..', 'data', 'clients', slug)
    const profilePath = path.join(clientPath, 'profile.json')

    // Check if client exists
    try {
      await fs.access(profilePath)
    } catch {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Read current profile
    const profileContent = await fs.readFile(profilePath, 'utf-8')
    const profile = JSON.parse(profileContent)

    // Update basic profile fields
    if (surveyData.name) profile.name = surveyData.name
    if (surveyData.nationality) profile.nationality = surveyData.nationality
    if (surveyData.gender) profile.gender = surveyData.gender
    if (surveyData.date_of_birth) profile.date_of_birth = surveyData.date_of_birth
    if (surveyData.height !== undefined) profile.height = surveyData.height
    if (surveyData.weight !== undefined) profile.weight = surveyData.weight
    if (surveyData.health_issues !== undefined) profile.health_issues = surveyData.health_issues
    if (surveyData.other_comments) profile.notes = surveyData.other_comments

    // Add new 1RM entry to history if provided
    if (surveyData.one_rm) {
      const newOneRM = {
        date: new Date().toISOString().split('T')[0],
        squat: surveyData.one_rm.squat,
        bench_press: surveyData.one_rm.bench,
        deadlift: surveyData.one_rm.deadlift,
        tested: false,
        notes: 'From Be Strong Survey'
      }

      if (!profile.one_rm_history) {
        profile.one_rm_history = []
      }

      // Add to beginning (most recent first)
      profile.one_rm_history.unshift(newOneRM)
    }

    // Update survey data
    profile.survey = {
      completed_at: new Date().toISOString(),
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
      muscle_mass_importance: surveyData.muscle_mass_importance
    }

    // Update metadata
    if (!profile._meta) {
      profile._meta = {}
    }
    profile._meta.last_modified = new Date().toISOString()

    // Save updated profile
    await fs.writeFile(profilePath, JSON.stringify(profile, null, 2))

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
