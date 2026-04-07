/**
 * ARE (Average Relative Effort) calculation utilities.
 *
 * ARE = average of (reps_performed / RM_at_that_weight) across all sets.
 * Requires RM profile from client survey (reps at 75%, 85%, 92.5%).
 *
 * TypeScript port of scripts/utilities.py ARE functions.
 */

interface SetData {
  reps: number
  zone_pct?: number
  percentage?: number
}

/**
 * Interpolate RM at target_pct using known data points.
 * Uses linear interpolation between bracketing points.
 * Extrapolates using Zonin Case 2: RM(P%) = RM(Pt%) + ((RM(Pt%) - 1) / (100 - Pt)) * (Pt - P)
 */
function interpolateRm(knownRms: Map<number, number>, targetPct: number): number {
  const points = [...knownRms.entries()].sort((a, b) => a[0] - b[0])

  // Exact match
  for (const [pct, rm] of points) {
    if (Math.abs(pct - targetPct) < 0.01) return rm
  }

  // Find bracketing points
  let lower: [number, number] | null = null
  let upper: [number, number] | null = null

  for (const [pct, rm] of points) {
    if (pct < targetPct) lower = [pct, rm]
    else if (pct > targetPct && upper === null) upper = [pct, rm]
  }

  if (lower && upper) {
    const ratio = (targetPct - lower[0]) / (upper[0] - lower[0])
    const result = lower[1] + ratio * (upper[1] - lower[1])
    return Math.max(1.0, Math.round(result * 10) / 10)
  }

  // Zonin Case 2 extrapolation
  const ref = upper ?? lower
  if (ref) {
    const [pt, rmPt] = ref
    const result = rmPt + ((rmPt - 1) / (100 - pt)) * (pt - targetPct)
    return Math.max(1.0, Math.round(result * 10) / 10)
  }

  return 1.0
}

/**
 * Build complete RM lookup table for all needed intensity zones.
 */
export function buildRmLookup(knownRms: Record<number, number>): Record<number, number> {
  const zones = [55, 60, 65, 70, 75, 80, 85, 90, 92.5, 95, 100]
  const map = new Map(Object.entries(knownRms).map(([k, v]) => [Number(k), v]))
  const result: Record<number, number> = {}
  for (const zone of zones) {
    result[zone] = interpolateRm(map, zone)
  }
  return result
}

/**
 * Find RM for the nearest percentage in the lookup table.
 */
function findNearestRm(rmLookup: Record<number, number>, targetPct: number): number {
  const pcts = Object.keys(rmLookup).map(Number)

  // Exact match with tolerance
  for (const pct of pcts) {
    if (Math.abs(pct - targetPct) < 0.5) return rmLookup[pct]
  }

  // Nearest
  const nearest = pcts.reduce((a, b) =>
    Math.abs(a - targetPct) < Math.abs(b - targetPct) ? a : b
  )
  return rmLookup[nearest]
}

/**
 * Calculate ARE from a list of sets.
 * Per-set average (not rep-weighted), per Zonin's definition.
 */
export function calculateAre(sets: SetData[], rmLookup: Record<number, number>): number {
  if (!sets.length || !Object.keys(rmLookup).length) return 0

  const efforts: number[] = []

  for (const s of sets) {
    const reps = s.reps
    // Prefer percentage (0-100, set by editor) over zone_pct (0-1, from import)
    const zonePct = s.percentage != null ? s.percentage / 100 : (s.zone_pct ?? 0)
    if (reps <= 0 || zonePct <= 0) continue

    const pct100 = Math.round(zonePct * 1000) / 10 // convert 0.xx to xx.x
    const rm = findNearestRm(rmLookup, pct100)
    if (rm <= 0) continue

    efforts.push(Math.min(reps / rm, 1.0))
  }

  if (!efforts.length) return 0

  return Math.round((efforts.reduce((a, b) => a + b, 0) / efforts.length) * 1000) / 10
}

/**
 * Build rm_profile from client survey data.
 * Returns null if survey doesn't have RM data.
 */
export function buildRmProfileFromSurvey(survey: Record<string, Record<string, number> | undefined> | null | undefined): Record<string, Record<number, number>> | null {
  if (!survey) return null

  const lifts = ['squat', 'bench_press', 'deadlift']
  const surveyLiftKeys: Record<string, string> = {
    squat: 'squat',
    bench_press: 'bench',
    deadlift: 'deadlift',
  }

  const profile: Record<string, Record<number, number>> = {}
  let hasData = false

  for (const lift of lifts) {
    const surveyKey = surveyLiftKeys[lift]
    const rm: Record<number, number> = { 100: 1 }

    const r75 = survey.reps_at_75_percent?.[surveyKey]
    const r85 = survey.reps_at_85_percent?.[surveyKey]
    const r925 = survey.reps_at_92_5_percent?.[surveyKey]

    if (r75 != null) { rm[75] = r75; hasData = true }
    if (r85 != null) { rm[85] = r85; hasData = true }
    if (r925 != null) { rm[92.5] = r925; hasData = true }

    if (Object.keys(rm).length > 1) {
      profile[lift] = rm
    }
  }

  return hasData ? profile : null
}

interface SessionWeekData {
  lifts?: Array<{ lift: string; sets?: Array<{ reps: number; zone_pct?: number; percentage?: number }> }>
}

interface CalculatedLiftWeek {
  are?: number
  sessions?: Record<string, Record<string, unknown>>
  [key: string]: unknown
}

export interface CalculatedLift {
  _summary?: { block_are?: number; [key: string]: unknown }
  [weekKey: string]: CalculatedLiftWeek | { block_are?: number; [key: string]: unknown } | undefined
}

/**
 * Compute ARE for an entire program and return enriched calculated data.
 *
 * Reads sessions data, computes per-session/week/block ARE for each lift.
 */
export function enrichProgramWithAre(
  calculated: Record<string, CalculatedLift>,
  sessions: Record<string, Record<string, SessionWeekData>>,
  rmProfile: Record<string, Record<number, number>>
): Record<string, CalculatedLift> {
  if (!sessions || !rmProfile || !calculated) return calculated

  const enriched = JSON.parse(JSON.stringify(calculated))

  for (const liftName of Object.keys(rmProfile)) {
    if (!enriched[liftName]) continue

    const knownRms = rmProfile[liftName]
    const rmLookup = buildRmLookup(knownRms)

    const allBlockSets: SetData[] = []

    // Iterate weeks
    for (let w = 1; w <= 6; w++) {
      const weekKey = `week_${w}`
      if (!enriched[liftName][weekKey]) continue

      const weekSets: SetData[] = []

      // Collect sets from all sessions for this lift and week
      for (const sessLetter of Object.keys(sessions)) {
        const weekData = sessions[sessLetter]?.[weekKey]
        if (!weekData?.lifts) continue

        const sessLiftSets: SetData[] = []
        for (const liftEntry of weekData.lifts) {
          if (liftEntry.lift !== liftName) continue
          for (const s of liftEntry.sets || []) {
            const setData: SetData = {
              reps: s.reps,
              percentage: s.percentage,
              zone_pct: s.zone_pct,
            }
            if ((setData.percentage != null || setData.zone_pct != null) && setData.reps > 0) {
              sessLiftSets.push(setData)
            }
          }
        }

        if (sessLiftSets.length > 0) {
          const sessAre = calculateAre(sessLiftSets, rmLookup)
          // Store per-session ARE
          if (!enriched[liftName][weekKey].sessions) {
            enriched[liftName][weekKey].sessions = {}
          }
          if (!enriched[liftName][weekKey].sessions[sessLetter]) {
            enriched[liftName][weekKey].sessions[sessLetter] = {}
          }
          enriched[liftName][weekKey].sessions[sessLetter].are = sessAre
          weekSets.push(...sessLiftSets)
        }
      }

      if (weekSets.length > 0) {
        enriched[liftName][weekKey].are = calculateAre(weekSets, rmLookup)
        allBlockSets.push(...weekSets)
      }
    }

    if (allBlockSets.length > 0) {
      if (!enriched[liftName]._summary) enriched[liftName]._summary = {}
      enriched[liftName]._summary.block_are = calculateAre(allBlockSets, rmLookup)
    }
  }

  return enriched
}
