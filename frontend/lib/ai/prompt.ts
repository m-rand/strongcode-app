/**
 * AI prompt for session generation
 *
 * The AI's ONLY job: take pre-calculated zone targets per session
 * and generate concrete sets (weight × reps × percentage).
 *
 * All math (zone totals, weekly distribution, session targets, ARI)
 * is done deterministically in calculate.ts BEFORE calling AI.
 */

import { REP_RANGES } from './constants'
import type { CalculatedResult, WeekCalculated, SessionTarget } from './calculate'
import { computeWeekAllocation } from './calculate'
import { getPromptVersion, DEFAULT_PROMPT_VERSION } from './prompts/registry'

export { getPromptVersion, listPromptVersions, PROMPT_REGISTRY, DEFAULT_PROMPT_VERSION } from './prompts/registry'
export type { PromptVersion } from './prompts/registry'

/** Default system prompt — use getPromptVersion(id).systemPrompt for version selection */
export const SYSTEM_PROMPT = getPromptVersion(DEFAULT_PROMPT_VERSION).systemPrompt


/**
 * Build user prompt for a SINGLE LIFT with pre-calculated targets.
 *
 * The prompt provides:
 * - Per-week ZONE TOTALS (how many reps in each zone this week)
 * - Per-week SESSION TOTALS (how many total reps each session should have)
 * - The AI decides how to allocate zone reps to sessions + creates concrete sets
 */
export function buildLiftPrompt(
  lift: string,
  liftCalc: Record<string, unknown>,
  weights: Record<string, number>,
  weeks: number = 4,
): string {
  const liftName = lift === 'bench_press' ? 'Bench Press' : lift.charAt(0).toUpperCase() + lift.slice(1)
  const sections: string[] = [`# ${liftName}`]

  // Weights reference
  const weightLines: string[] = []
  for (const zone of ['65', '75', '85', '90', '95'] as const) {
    if (weights[zone]) {
      const repRange = REP_RANGES[zone]
      weightLines.push(`${zone}% zone: ${weights[zone]}kg (${repRange[0]}-${repRange[1]} reps per set)`)
    }
  }
  sections.push(`## Zone Weights`)
  sections.push(weightLines.join('\n'))
  sections.push('')

  // Per-week data
  const ZONE_KEYS = ['65', '75', '85', '90', '95'] as const

  for (let w = 1; w <= weeks; w++) {
    const week = liftCalc[`week_${w}`] as WeekCalculated | undefined
    if (!week) continue

    sections.push(`## Week ${w} (total: ${week.total_reps} reps, ARI target: ${week.ari}%)`)

    // Sessions sorted by volume ascending → rank labels
    const sessionEntries = Object.entries(week.sessions).sort(([, a], [, b]) => (a as SessionTarget).total - (b as SessionTarget).total)
    const ranks: Record<string, string> = {}
    sessionEntries.forEach(([letter], idx) => {
      if (sessionEntries.length === 1) { ranks[letter] = 'ONLY' }
      else if (idx === 0) { ranks[letter] = 'LOWEST' }
      else if (idx === sessionEntries.length - 1) { ranks[letter] = 'HIGHEST' }
      else { ranks[letter] = 'MIDDLE ← place singles here' }
    })

    // Zone totals
    const activeZones = ZONE_KEYS.filter(z => (week.zones[z] ?? 0) > 0)
    const zoneParts = activeZones.map(z => `- ${z}% zone: ${week.zones[z]} reps`)
    sections.push(`Zone totals this week:`)
    sections.push(zoneParts.join('\n'))

    // Sessions with rank labels
    sections.push(`\nSessions (sorted by volume):`)
    for (const [letter, target] of sessionEntries) {
      const t = target as SessionTarget
      sections.push(`- Session ${letter}: ${t.total} reps [${ranks[letter]}]`)
    }

    // Pre-computed allocation table — AI just writes sets to match these numbers
    const allocation = computeWeekAllocation(week.zones, week.sessions)
    const sessionLetters = sessionEntries.map(([l]) => l)
    const colSums = sessionLetters.map(l => `${l}=${(week.sessions[l] as SessionTarget).total}`).join('  ')
    sections.push(`\nAllocation table (pre-computed — use these exact numbers):`)
    for (const z of activeZones) {
      const cells = sessionLetters.map(l => `${l}=${allocation[l]?.[z] ?? 0}`).join('  ')
      sections.push(`  zone ${z}%: ${cells}  → sum = ${week.zones[z]}`)
    }
    sections.push(`  ${'─'.repeat(40)}`)
    sections.push(`  col sums: ${colSums}`)

    sections.push('')
  }

  return `Generate concrete sets for ${liftName}.

${sections.join('\n')}`
}
