/**
 * Deterministic calculation logic — ported from scripts/calculate_targets.py + utilities.py
 *
 * Computes: zone totals → weekly distribution → session targets → ARI
 * No AI needed for any of this — pure math.
 */

import {
  CHERNYAK_BY_LEVEL,
  SESSION_PATTERNS,
  ZONE_PERCENTAGES,
  ZONE_ORDER,
} from './constants'
import type { LiftInput } from './schema'

// ─── Types ──────────────────────────────────────────────────

export interface ZoneReps {
  '65': number
  '75': number
  '85': number
  '90': number
  '95': number
}

export interface SessionTarget {
  total: number    // Total reps for this session (AI decides zone allocation)
}

export interface WeekCalculated {
  total_reps: number
  zones: ZoneReps          // Week zone totals (what AI must distribute across sessions)
  ari: number              // Week-level ARI (target)
  sessions: Record<string, SessionTarget>  // A, B, C... — just total reps per session
}

export interface LiftSummary {
  total_nl: number
  actual_nl: number
  block_ari: number
  zone_distribution: Record<string, number>  // percentages
  zone_totals: ZoneReps
  weights: Record<string, number>
}

export interface LiftCalculated {
  _summary: LiftSummary
  [weekKey: string]: WeekCalculated | LiftSummary  // week_1..week_4 + _summary
}

export interface CalculatedResult {
  [lift: string]: LiftCalculated
}

/** Pre-computed zone×session allocation table for a single week */
export interface WeekAllocation {
  /** alloc[sessionLetter][zone] = reps assigned */
  [session: string]: Record<string, number>
}

// ─── Utility Functions ──────────────────────────────────────

/** Distribute total reps according to percentage distribution */
function distributeVolume(totalReps: number, distribution: number[]): number[] {
  const result: number[] = []
  let remaining = totalReps

  for (let i = 0; i < distribution.length; i++) {
    if (i === distribution.length - 1) {
      result.push(remaining)  // last item gets remainder
    } else {
      const reps = Math.round(totalReps * distribution[i] / 100)
      result.push(reps)
      remaining -= reps
    }
  }
  return result
}

/** Calculate ARI from zone reps */
function calculateAri(zoneReps: ZoneReps): number {
  let totalIntensity = 0
  let totalReps = 0

  for (const zone of ZONE_ORDER) {
    const reps = zoneReps[zone]
    if (reps > 0) {
      totalIntensity += ZONE_PERCENTAGES[zone] * reps
      totalReps += reps
    }
  }

  return totalReps > 0 ? Math.round((totalIntensity / totalReps) * 10) / 10 : 0
}

/** Convert zone_90/95 absolute reps to percentages, auto-calc 65% */
function convertToZonePercentages(
  totalNl: number,
  zone75Pct: number,
  zone85Pct: number,
  zone90Reps: number,
  zone95Reps: number,
): Record<string, number> {
  const zone90Pct = totalNl > 0 ? (zone90Reps / totalNl * 100) : 0
  const zone95Pct = totalNl > 0 ? (zone95Reps / totalNl * 100) : 0
  const zone65Pct = 100 - zone75Pct - zone85Pct - zone90Pct - zone95Pct

  return {
    '65': Math.round(zone65Pct * 10) / 10,
    '75': zone75Pct,
    '85': zone85Pct,
    '90': Math.round(zone90Pct * 10) / 10,
    '95': Math.round(zone95Pct * 10) / 10,
  }
}

/** Get session distribution pattern by name and session count */
function getSessionPattern(patternName: string, sessionsPerWeek: number): number[] {
  const patterns = SESSION_PATTERNS[sessionsPerWeek]
  if (patterns && patterns[patternName]) {
    return patterns[patternName]
  }
  // Fallback: even distribution
  const pct = Math.round(100 / sessionsPerWeek)
  return Array(sessionsPerWeek).fill(pct)
}

/**
 * Distribute total weekly reps across sessions.
 * Pure math — just applies the session distribution percentages.
 * Does NOT assign zones to sessions — that's the AI's job.
 */
function calculateSessionTargets(
  totalWeekReps: number,
  sessionDistribution: number[],
): SessionTarget[] {
  const targets: SessionTarget[] = []
  let remaining = totalWeekReps

  for (let i = 0; i < sessionDistribution.length; i++) {
    if (i === sessionDistribution.length - 1) {
      targets.push({ total: remaining })
    } else {
      const reps = Math.round(totalWeekReps * sessionDistribution[i] / 100)
      targets.push({ total: reps })
      remaining -= reps
    }
  }

  return targets
}

// ─── Main Calculation ───────────────────────────────────────

/** Calculate targets for a single lift */
export function calculateLiftTargets(
  liftConfig: LiftInput,
  skillLevel: string,
  weeks: number = 4,
): LiftCalculated {
  const {
    volume: monthlyNl,
    volume_pattern_main: patternMain,
    volume_pattern_8190: pattern8190,
    intensity_distribution: intensityDist,
    sessions_per_week: defaultSessionsPerWeek,
    session_distribution: defaultSessionDistName,
    weekly_plan,
    weights,
  } = liftConfig

  // 1. Get Chernyak patterns for this skill level
  const levelPatterns = CHERNYAK_BY_LEVEL[skillLevel] || CHERNYAK_BY_LEVEL.intermediate
  const weeklyDistMain = levelPatterns[patternMain]
  const weeklyDist8190 = levelPatterns[pattern8190] || weeklyDistMain

  if (!weeklyDistMain) {
    throw new Error(`Unknown volume pattern: ${patternMain}`)
  }

  // 2. Determine per-week 90/95 reps (direct specification or fallback to block total + distribution)
  const zone90Weekly: number[] = intensityDist['90_weekly_reps'] && intensityDist['90_weekly_reps'].length === weeks
    ? intensityDist['90_weekly_reps']
    : null as unknown as number[]
  const zone95Weekly: number[] = intensityDist['95_weekly_reps'] && intensityDist['95_weekly_reps'].length === weeks
    ? intensityDist['95_weekly_reps']
    : null as unknown as number[]

  // Block totals for 90/95 (from per-week or from fallback)
  const total90 = zone90Weekly
    ? zone90Weekly.reduce((a, b) => a + b, 0)
    : intensityDist['90_total_reps']
  const total95 = zone95Weekly
    ? zone95Weekly.reduce((a, b) => a + b, 0)
    : intensityDist['95_total_reps']

  // 3. Convert intensity distribution to zone percentages
  const zonePcts = convertToZonePercentages(
    monthlyNl,
    intensityDist['75_percent'],
    intensityDist['85_percent'],
    total90,
    total95,
  )

  // 4. Calculate monthly NL per zone
  const monthlyZoneNl: Record<string, number> = {
    '65': Math.round(monthlyNl * zonePcts['65'] / 100),
    '75': Math.round(monthlyNl * zonePcts['75'] / 100),
    '85': Math.round(monthlyNl * zonePcts['85'] / 100),
    '90': total90,
    '95': total95,
  }

  // 5. Distribute zones across weeks
  // 65%, 75% use main pattern; 85% uses 8190 pattern
  // 90%, 95% use per-week values if specified, otherwise 8190 pattern
  const weeklyZones: Record<string, number[]> = {
    '65': distributeVolume(monthlyZoneNl['65'], weeklyDistMain.slice(0, weeks)),
    '75': distributeVolume(monthlyZoneNl['75'], weeklyDistMain.slice(0, weeks)),
    '85': distributeVolume(monthlyZoneNl['85'], weeklyDist8190.slice(0, weeks)),
    '90': zone90Weekly ?? distributeVolume(monthlyZoneNl['90'], weeklyDist8190.slice(0, weeks)),
    '95': zone95Weekly ?? distributeVolume(monthlyZoneNl['95'], weeklyDist8190.slice(0, weeks)),
  }

  // 6. Calculate per-week data (now supporting per-week session config via weekly_plan)
  const allZoneReps: ZoneReps = { '65': 0, '75': 0, '85': 0, '90': 0, '95': 0 }
  const result: Record<string, WeekCalculated | LiftSummary> = {}

  for (let w = 0; w < weeks; w++) {
    const weekKey = `week_${w + 1}`

    // Per-week session config (from weekly_plan or defaults)
    const weekPlan = weekly_plan?.[weekKey]
    const weekSessionCount = weekPlan?.sessions ?? defaultSessionsPerWeek
    const weekDistName = weekPlan?.distribution ?? defaultSessionDistName
    const weekSessionDist = getSessionPattern(weekDistName, weekSessionCount)
    const weekSessionLetters = 'ABCDEFGH'.slice(0, weekSessionCount).split('')

    const weekZones: ZoneReps = {
      '65': weeklyZones['65'][w],
      '75': weeklyZones['75'][w],
      '85': weeklyZones['85'][w],
      '90': weeklyZones['90'][w],
      '95': weeklyZones['95'][w],
    }

    const weekTotal = ZONE_ORDER.reduce((sum, z) => sum + weekZones[z], 0)
    const weekAri = calculateAri(weekZones)

    // Accumulate for block summary
    for (const z of ZONE_ORDER) {
      allZoneReps[z] += weekZones[z]
    }

    // Calculate session targets (just total reps — AI decides zone allocation)
    const sessionTargets = calculateSessionTargets(weekTotal, weekSessionDist)
    const sessionsMap: Record<string, SessionTarget> = {}
    weekSessionLetters.forEach((letter, i) => {
      sessionsMap[letter] = sessionTargets[i]
    })

    result[weekKey] = {
      total_reps: weekTotal,
      zones: weekZones,
      ari: weekAri,
      sessions: sessionsMap,
    }
  }

  // 7. Block summary
  const actualNl = ZONE_ORDER.reduce((sum, z) => sum + allZoneReps[z], 0)
  const blockAri = calculateAri(allZoneReps)

  result._summary = {
    total_nl: monthlyNl,
    actual_nl: actualNl,
    block_ari: blockAri,
    zone_distribution: zonePcts,
    zone_totals: allZoneReps,
    weights: weights,
  }

  return result as LiftCalculated
}

/**
 * Deterministically compute zone×session allocation for one week.
 *
 * Rules:
 * - 90%/95% → middle-volume session
 * - 85%      → proportional among all sessions except the lowest (for 3+ sessions)
 * - 75%      → proportional among all sessions by remaining capacity
 * - 65%      → fills whatever capacity remains per session exactly
 *
 * Both row sums (zone totals) and column sums (session totals) are guaranteed correct.
 */
export function computeWeekAllocation(
  zones: ZoneReps,
  sessions: Record<string, SessionTarget>,
): WeekAllocation {
  // Sort sessions by volume ascending
  const sorted = Object.entries(sessions).sort(([, a], [, b]) => a.total - b.total)
  const n = sorted.length

  // Initialize allocation and track remaining capacity per session
  const alloc: WeekAllocation = {}
  const remaining: Record<string, number> = {}
  for (const [letter, target] of sorted) {
    alloc[letter] = { '65': 0, '75': 0, '85': 0, '90': 0, '95': 0 }
    remaining[letter] = target.total
  }

  // ── Step 1: 90% and 95% → middle session ────────────────
  const middleLetter = sorted[Math.floor((n - 1) / 2)][0]
  for (const zone of ['90', '95'] as const) {
    const total = zones[zone]
    if (total > 0) {
      alloc[middleLetter][zone] = total
      remaining[middleLetter] -= total
    }
  }

  // ── Step 2: 85% → exclude lowest session when 3+ sessions ───
  const zone85 = zones['85']
  if (zone85 > 0) {
    const eligible85 = n >= 3 ? sorted.slice(1) : sorted
    distributeProportionally(zone85, eligible85.map(([l]) => l), remaining, alloc, '85')
  }

  // ── Step 3: 75% → proportional to remaining capacity ────
  const zone75 = zones['75']
  if (zone75 > 0) {
    distributeProportionally(zone75, sorted.map(([l]) => l), remaining, alloc, '75')
  }

  // ── Step 4: 65% → fills leftover exactly ────────────────
  const zone65 = zones['65']
  if (zone65 > 0) {
    // Use proportional distribution to handle edge cases, then verify
    distributeProportionally(zone65, sorted.map(([l]) => l), remaining, alloc, '65')
  }

  return alloc
}

/** Proportionally distribute `total` reps across `sessions` by their current remaining capacity */
function distributeProportionally(
  total: number,
  sessions: string[],
  remaining: Record<string, number>,
  alloc: WeekAllocation,
  zone: string,
): void {
  const caps = sessions.map(l => Math.max(0, remaining[l]))
  const sumCaps = caps.reduce((a, b) => a + b, 0)
  if (sumCaps === 0) return

  let distributed = 0
  for (let i = 0; i < sessions.length - 1; i++) {
    const share = Math.min(Math.round(total * caps[i] / sumCaps), caps[i])
    alloc[sessions[i]][zone] = share
    remaining[sessions[i]] -= share
    distributed += share
  }
  // Last session absorbs the remainder to guarantee exact row sum
  const last = sessions[sessions.length - 1]
  const lastShare = total - distributed
  alloc[last][zone] = lastShare
  remaining[last] -= lastShare
}

/** Calculate targets for all lifts in a program */
export function calculateAllTargets(
  lifts: Record<string, LiftInput>,
  skillLevel: string,
  weeks: number = 4,
): CalculatedResult {
  const result: CalculatedResult = {}

  for (const [lift, config] of Object.entries(lifts)) {
    result[lift] = calculateLiftTargets(config, skillLevel, weeks)
  }

  return result
}
