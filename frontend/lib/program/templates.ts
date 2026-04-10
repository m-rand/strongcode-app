export type LiftKey = 'squat' | 'bench_press' | 'deadlift'
export type BlockType = 'prep' | 'comp'
export type TemplateScope = 'full' | 'single_lift'

export interface ZoneTemplateSet {
  reps: number
  percentage: number
  variant?: string
}

export interface ZoneTemplateLift {
  lift: LiftKey
  sets: ZoneTemplateSet[]
}

export interface ZoneTemplateWeek {
  lifts: ZoneTemplateLift[]
}

export type ZoneTemplateSessions = Record<string, Record<string, ZoneTemplateWeek>>

const LIFTS: LiftKey[] = ['squat', 'bench_press', 'deadlift']
const ZONE_KEYS = ['65', '75', '85', '90', '95'] as const

function toNumber(value: unknown): number | null {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function toRoundedInteger(value: unknown): number | null {
  const n = toNumber(value)
  if (n === null) return null
  const rounded = Math.round(n)
  return rounded > 0 ? rounded : null
}

function roundToStep(value: number, step: number): number {
  if (!Number.isFinite(step) || step <= 0) return value
  return Math.round(value / step) * step
}

function normalizePercentage(raw: number): number {
  if (Math.abs(raw - 92.5) < 0.2) return 92.5
  if (Math.abs(raw - 65) < 0.2) return 65
  if (Math.abs(raw - 75) < 0.2) return 75
  if (Math.abs(raw - 85) < 0.2) return 85
  if (Math.abs(raw - 95) < 0.2) return 95
  return raw
}

export function percentageToZoneKey(percentage: number): '65' | '75' | '85' | '90' | '95' | null {
  const p = normalizePercentage(percentage)
  if (Math.abs(p - 65) < 0.2) return '65'
  if (Math.abs(p - 75) < 0.2) return '75'
  if (Math.abs(p - 85) < 0.2) return '85'
  if (Math.abs(p - 92.5) < 0.2) return '90'
  if (Math.abs(p - 95) < 0.2) return '95'
  return null
}

export function createTemplateSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return slug || 'template'
}

export function buildLiftWeightsFromOneRm(oneRm: number, rounding: number): Record<'65' | '75' | '85' | '90' | '95', number> {
  return {
    '65': roundToStep(oneRm * 0.65, rounding),
    '75': roundToStep(oneRm * 0.75, rounding),
    '85': roundToStep(oneRm * 0.85, rounding),
    '90': roundToStep(oneRm * 0.925, rounding),
    '95': roundToStep(oneRm * 0.95, rounding),
  }
}

function getLiftWeightMapFromCalculated(calculated: Record<string, unknown>, lift: LiftKey): Record<string, number> {
  const liftData = calculated[lift]
  if (!liftData || typeof liftData !== 'object') return {}

  const summary = (liftData as Record<string, unknown>)._summary
  if (!summary || typeof summary !== 'object') return {}

  const weights = (summary as Record<string, unknown>).weights
  if (!weights || typeof weights !== 'object') return {}

  const out: Record<string, number> = {}
  for (const key of ZONE_KEYS) {
    const numeric = toNumber((weights as Record<string, unknown>)[key])
    if (numeric !== null) out[key] = numeric
  }
  return out
}

function inferPercentageFromWeight(weight: number, liftWeightMap: Record<string, number>): number | null {
  let best: { percentage: number; diff: number } | null = null

  const zoneToPct: Array<{ zone: '65' | '75' | '85' | '90' | '95'; percentage: number }> = [
    { zone: '65', percentage: 65 },
    { zone: '75', percentage: 75 },
    { zone: '85', percentage: 85 },
    { zone: '90', percentage: 92.5 },
    { zone: '95', percentage: 95 },
  ]

  for (const { zone, percentage } of zoneToPct) {
    const zoneWeight = liftWeightMap[zone]
    if (!Number.isFinite(zoneWeight)) continue
    const diff = Math.abs(weight - zoneWeight)
    if (!best || diff < best.diff) best = { percentage, diff }
  }

  if (!best) return null

  // tolerate minor rounding/import drift
  if (best.diff > 5) return null
  return best.percentage
}

export function extractZoneTemplateSessions(
  sessions: unknown,
  calculated: Record<string, unknown>,
  allowedLifts: Set<LiftKey>,
): ZoneTemplateSessions {
  if (!sessions || typeof sessions !== 'object') return {}

  const sessionsRecord = sessions as Record<string, unknown>
  const output: ZoneTemplateSessions = {}

  for (const [sessionKey, sessionRaw] of Object.entries(sessionsRecord)) {
    if (!/^[A-Z]$/.test(sessionKey)) continue
    if (!sessionRaw || typeof sessionRaw !== 'object') continue

    const weekRecord = sessionRaw as Record<string, unknown>
    const outWeekRecord: Record<string, ZoneTemplateWeek> = {}

    for (const [weekKey, weekRaw] of Object.entries(weekRecord)) {
      if (!/^week_\d+$/.test(weekKey)) continue
      if (!weekRaw || typeof weekRaw !== 'object') continue

      const liftsRaw = (weekRaw as Record<string, unknown>).lifts
      if (!Array.isArray(liftsRaw)) continue

      const templateLifts: ZoneTemplateLift[] = []

      for (const liftRaw of liftsRaw) {
        if (!liftRaw || typeof liftRaw !== 'object') continue

        const liftObj = liftRaw as Record<string, unknown>
        const lift = liftObj.lift
        if (lift !== 'squat' && lift !== 'bench_press' && lift !== 'deadlift') continue
        if (!allowedLifts.has(lift)) continue

        const setsRaw = Array.isArray(liftObj.sets) ? liftObj.sets : []
        const liftWeightMap = getLiftWeightMapFromCalculated(calculated, lift)

        const sets: ZoneTemplateSet[] = []
        for (const setRaw of setsRaw) {
          if (!setRaw || typeof setRaw !== 'object') continue

          const setObj = setRaw as Record<string, unknown>
          const reps = toRoundedInteger(setObj.reps)
          if (reps === null) continue

          let percentage = toNumber(setObj.percentage)
          if (percentage === null) {
            const weight = toNumber(setObj.weight)
            if (weight !== null) {
              percentage = inferPercentageFromWeight(weight, liftWeightMap)
            }
          }

          if (percentage === null || percentageToZoneKey(percentage) === null) {
            throw new Error(
              `Cannot extract zone percentage for ${lift} ${sessionKey}/${weekKey}; template requires zone-based sets.`,
            )
          }

          const variant = typeof setObj.variant === 'string' ? setObj.variant : undefined
          sets.push({
            reps,
            percentage: normalizePercentage(percentage),
            ...(variant ? { variant } : {}),
          })
        }

        if (sets.length > 0) {
          templateLifts.push({ lift, sets })
        }
      }

      outWeekRecord[weekKey] = { lifts: templateLifts }
    }

    output[sessionKey] = outWeekRecord
  }

  return output
}

export function buildClientInputFromTemplateInput(
  templateInput: unknown,
  clientOneRm: Record<LiftKey, number>,
): Record<string, unknown> {
  const input = (templateInput && typeof templateInput === 'object')
    ? templateInput as Record<string, unknown>
    : {}

  const out: Record<string, unknown> = {}

  for (const lift of LIFTS) {
    const liftRaw = input[lift]
    if (!liftRaw || typeof liftRaw !== 'object') continue

    const liftInput = { ...(liftRaw as Record<string, unknown>) }
    const rounding = toNumber(liftInput.rounding) ?? 2.5
    const oneRm = toNumber(clientOneRm[lift])

    if (oneRm === null || oneRm <= 0) {
      throw new Error(`Missing or invalid 1RM for lift: ${lift}`)
    }

    liftInput.one_rm = oneRm
    liftInput.weights = buildLiftWeightsFromOneRm(oneRm, rounding)

    out[lift] = liftInput
  }

  return out
}

export function materializeSessionsForClient(
  templateSessions: unknown,
  clientInput: Record<string, unknown>,
): Record<string, Record<string, { lifts: Array<{ lift: LiftKey; sets: Array<{ weight: number; reps: number; percentage: number; variant?: string }> }> }>> {
  const input = (clientInput && typeof clientInput === 'object')
    ? clientInput as Record<string, unknown>
    : {}

  const sessions = (templateSessions && typeof templateSessions === 'object')
    ? templateSessions as ZoneTemplateSessions
    : {}

  const result: Record<string, Record<string, { lifts: Array<{ lift: LiftKey; sets: Array<{ weight: number; reps: number; percentage: number; variant?: string }> }> }>> = {}

  for (const [sessionKey, weekData] of Object.entries(sessions)) {
    if (!/^[A-Z]$/.test(sessionKey)) continue

    const outWeeks: Record<string, { lifts: Array<{ lift: LiftKey; sets: Array<{ weight: number; reps: number; percentage: number; variant?: string }> }> }> = {}

    for (const [weekKey, week] of Object.entries(weekData || {})) {
      if (!/^week_\d+$/.test(weekKey)) continue

      const liftsRaw = Array.isArray(week?.lifts) ? week.lifts : []
      const outLifts: Array<{ lift: LiftKey; sets: Array<{ weight: number; reps: number; percentage: number; variant?: string }> }> = []

      for (const liftData of liftsRaw) {
        const lift = liftData?.lift
        if (lift !== 'squat' && lift !== 'bench_press' && lift !== 'deadlift') continue

        const inputLiftRaw = input[lift]
        if (!inputLiftRaw || typeof inputLiftRaw !== 'object') {
          throw new Error(`Missing input for lift "${lift}" while materializing template`) 
        }

        const weightsRaw = (inputLiftRaw as Record<string, unknown>).weights
        if (!weightsRaw || typeof weightsRaw !== 'object') {
          throw new Error(`Missing weights for lift "${lift}" while materializing template`)
        }

        const weights = weightsRaw as Record<string, unknown>
        const setsRaw = Array.isArray(liftData.sets) ? liftData.sets : []

        const outSets: Array<{ weight: number; reps: number; percentage: number; variant?: string }> = []

        for (const setData of setsRaw) {
          const reps = toRoundedInteger(setData?.reps)
          const percentage = toNumber(setData?.percentage)
          if (reps === null || percentage === null) continue

          const zone = percentageToZoneKey(percentage)
          if (!zone) {
            throw new Error(`Unsupported percentage "${percentage}" for lift "${lift}"`) 
          }

          const weight = toNumber(weights[zone])
          if (weight === null) {
            throw new Error(`Missing weight for zone ${zone} on lift "${lift}"`) 
          }

          const variant = typeof setData?.variant === 'string' ? setData.variant : undefined
          outSets.push({
            weight,
            reps,
            percentage: normalizePercentage(percentage),
            ...(variant ? { variant } : {}),
          })
        }

        outLifts.push({ lift, sets: outSets })
      }

      outWeeks[weekKey] = { lifts: outLifts }
    }

    result[sessionKey] = outWeeks
  }

  return result
}
