import { NextResponse } from 'next/server'
import { db } from '@/db'
import { appSettings } from '@/db/schema'
import { eq } from 'drizzle-orm'

const SETTINGS_KEY = 'global_program_instructions'

export async function GET() {
  try {
    const [row] = await db
      .select({ value: appSettings.value, updatedAt: appSettings.updatedAt })
      .from(appSettings)
      .where(eq(appSettings.key, SETTINGS_KEY))
      .limit(1)

    return NextResponse.json({
      instructions: typeof row?.value === 'string' ? row.value : '',
      updatedAt: row?.updatedAt || null,
    })
  } catch (error) {
    console.error('Error loading global program instructions:', error)
    return NextResponse.json(
      { error: 'Failed to load global program instructions' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const instructionsRaw = body?.instructions
    const instructions = typeof instructionsRaw === 'string'
      ? instructionsRaw.trim()
      : ''

    const [existing] = await db
      .select({ key: appSettings.key })
      .from(appSettings)
      .where(eq(appSettings.key, SETTINGS_KEY))
      .limit(1)

    if (existing) {
      await db
        .update(appSettings)
        .set({
          value: instructions,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(appSettings.key, SETTINGS_KEY))
    } else {
      await db.insert(appSettings).values({
        key: SETTINGS_KEY,
        value: instructions,
        updatedAt: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      instructions,
    })
  } catch (error) {
    console.error('Error saving global program instructions:', error)
    return NextResponse.json(
      { error: 'Failed to save global program instructions' },
      { status: 500 },
    )
  }
}
