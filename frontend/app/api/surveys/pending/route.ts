import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET() {
  try {
    const clientsDir = path.join(process.cwd(), '..', 'data', 'clients')

    // Check if clients directory exists
    try {
      await fs.access(clientsDir)
    } catch {
      return NextResponse.json({ surveys: [] })
    }

    // Read all client directories
    const clientSlugs = await fs.readdir(clientsDir)
    const pendingSurveys = []

    for (const slug of clientSlugs) {
      const clientPath = path.join(clientsDir, slug)
      const stats = await fs.stat(clientPath)

      if (!stats.isDirectory()) continue

      // Try to read profile.json
      const profilePath = path.join(clientPath, 'profile.json')
      let profile = null

      try {
        const profileContent = await fs.readFile(profilePath, 'utf-8')
        profile = JSON.parse(profileContent)
      } catch {
        continue
      }

      // Only include pending clients (from survey)
      if (profile.status !== 'pending') continue

      // Get latest 1RM
      const latestOneRM = profile.one_rm_history?.[0] || null

      pendingSurveys.push({
        slug,
        name: profile.name,
        email: profile.email,
        skill_level: profile.skill_level || 'intermediate',
        latest_one_rm: latestOneRM ? {
          squat: latestOneRM.squat,
          bench_press: latestOneRM.bench_press,
          deadlift: latestOneRM.deadlift,
          date: latestOneRM.date
        } : null,
        survey: profile.survey || null,
        created_at: profile.created_at,
        nationality: profile.nationality,
        gender: profile.gender,
        date_of_birth: profile.date_of_birth,
        height: profile.height,
        weight: profile.weight,
        health_issues: profile.health_issues,
        notes: profile.notes
      })
    }

    // Sort by created_at (newest first)
    pendingSurveys.sort((a, b) => {
      if (!a.created_at) return 1
      if (!b.created_at) return -1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return NextResponse.json({ surveys: pendingSurveys })
  } catch (error) {
    console.error('Error listing pending surveys:', error)
    return NextResponse.json(
      { error: 'Failed to list pending surveys' },
      { status: 500 }
    )
  }
}
