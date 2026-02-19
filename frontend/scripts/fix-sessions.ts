/**
 * Fix program data in Turso DB:
 * 1. Replace monday/wednesday/friday → A/B/C in calculated.*.week_N.sessions
 * 2. Update the enriched Excel-converted programs with per-session NL data
 *
 * Run: cd frontend && DOTENV_CONFIG_PATH=.env.local npx tsx -r dotenv/config scripts/fix-sessions.ts
 */

import { db } from '../db/index'
import { programs } from '../db/schema'
import { eq } from 'drizzle-orm'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// Weekdays sorted by calendar order — used to assign A, B, C... deterministically
const WEEKDAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

function fixDayNamesInCalculated(calculated: Record<string, any>): { changed: boolean; data: Record<string, any> } {
  let changed = false
  // Deep clone to avoid mutation issues
  const result = JSON.parse(JSON.stringify(calculated))

  for (const [liftKey, liftData] of Object.entries(result)) {
    if (!liftData || typeof liftData !== 'object') continue

    const liftObj = liftData as Record<string, any>

    for (const [weekKey, weekData] of Object.entries(liftObj)) {
      if (!weekKey.startsWith('week_')) continue
      if (!weekData || typeof weekData !== 'object') continue

      const week = weekData as Record<string, any>
      const sessions = week.sessions
      if (!sessions || typeof sessions !== 'object') continue

      // Check if any key is a day name
      const keys = Object.keys(sessions)
      const dayKeys = keys.filter(k => WEEKDAY_ORDER.includes(k))

      if (dayKeys.length > 0) {
        // Sort by calendar order, then assign A, B, C...
        dayKeys.sort((a, b) => WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b))
        const letters = 'ABCDEFG'

        const newSessions: Record<string, any> = {}
        dayKeys.forEach((day, i) => {
          newSessions[letters[i]] = sessions[day]
        })
        // Keep any non-day keys as-is
        for (const key of keys) {
          if (!WEEKDAY_ORDER.includes(key)) {
            newSessions[key] = sessions[key]
          }
        }
        week.sessions = newSessions
        changed = true
      }
    }
  }

  return { changed, data: result }
}

async function main() {
  // ── Part 1: Fix day names in DB ──
  console.log('=== Part 1: Fix day names → A/B/C in DB ===\n')
  console.log('Fetching all programs from DB...')
  const allPrograms = await db.select().from(programs)
  console.log(`Found ${allPrograms.length} programs\n`)

  let fixedCount = 0

  for (const prog of allPrograms) {
    const calculated = prog.calculated as Record<string, any>
    if (!calculated) continue

    const { changed, data } = fixDayNamesInCalculated(calculated)

    if (changed) {
      await db.update(programs)
        .set({ calculated: data as any })
        .where(eq(programs.id, prog.id))
      console.log(`  ✅ Fixed: ${prog.filename} (id=${prog.id})`)
      fixedCount++
    }
  }

  console.log(`\nFixed ${fixedCount} programs in DB\n`)

  // ── Part 2: Fix day names in local JSON files ──
  console.log('=== Part 2: Fix day names in local JSON files ===\n')

  const projectRoot = resolve(__dirname, '../..')
  const localFiles = [
    'data/clients/katerina-balasova/programs/2026-01-10_katerina-balasova_prep_all_lifts.json',
    'data/clients/katerina-balasova/programs/2026-01-11_katerina-balasova_prep_all_lifts.json',
    'data/clients/katerina-balasova/programs/2026-01-12_katerina-balasova_prep_all_lifts.json',
    'data/clients/katerina-balasova/programs/2026-01-16_katerina-balasova_prep_all_lifts.json',
    'data/clients/katerina-balasova/programs/2026-02-04_katerina-balasova_prep_all_lifts.json',
  ]

  let localFixedCount = 0

  for (const relPath of localFiles) {
    const absPath = resolve(projectRoot, relPath)
    if (!existsSync(absPath)) {
      console.log(`  ⏭️  Not found: ${absPath}`)
      continue
    }

    const fileData = JSON.parse(readFileSync(absPath, 'utf-8'))
    const calc = fileData.calculated
    if (!calc) continue

    const { changed, data } = fixDayNamesInCalculated(calc)
    if (changed) {
      fileData.calculated = data
      writeFileSync(absPath, JSON.stringify(fileData, null, 2) + '\n')
      console.log(`  ✅ Fixed: ${relPath.split('/').pop()}`)
      localFixedCount++
    }
  }

  console.log(`\nFixed ${localFixedCount} local JSON files\n`)

  // ── Part 3: Update Excel-converted programs in DB with enriched calculated ──
  console.log('=== Part 3: Update Excel programs in DB with per-session NL ===\n')

  const excelFiles = [
    'data/programs_json/2025-02-01_katerina_prep_all_lifts.json',
    'data/programs_json/2025-04-01_katerina_prep_all_lifts.json',
  ]

  for (const relPath of excelFiles) {
    const absPath2 = resolve(projectRoot, relPath)
    if (!existsSync(absPath2)) {
      console.log(`  ⏭️  Not found: ${absPath2}`)
      continue
    }

    const fileData = JSON.parse(readFileSync(absPath2, 'utf-8'))
    const filename = fileData.meta?.filename

    if (!filename) {
      console.log(`  ⏭️  No meta.filename: ${relPath}`)
      continue
    }

    // Find the program in DB by filename
    const [existing] = await db.select().from(programs)
      .where(eq(programs.filename, filename))

    if (!existing) {
      console.log(`  ⏭️  Not in DB: ${filename}`)
      continue
    }

    // Update calculated with enriched data (includes per-session NL)
    await db.update(programs)
      .set({ calculated: fileData.calculated as any })
      .where(eq(programs.id, existing.id))
    console.log(`  ✅ Updated: ${filename} (id=${existing.id})`)
  }

  console.log('\n=== All done! ===')
  process.exit(0)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
