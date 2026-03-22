type LiftKey = 'squat' | 'bench_press' | 'deadlift'

type SetData = {
  weight: number
  reps: number
  percentage?: number
  variant?: string
}

type SessionWeek = {
  lifts: Array<{ lift: LiftKey; sets: SetData[] }>
}

type NormalizedProgram = {
  id?: number
  schema_version: string
  meta: {
    filename: string
    created_at: string
    created_by?: string
    status?: string
  }
  client: Record<string, unknown>
  program_info: {
    block: string
    start_date: string
    end_date?: string
    weeks: number
  }
  input: Record<string, unknown>
  calculated: Record<string, unknown>
  sessions: Record<string, Record<string, SessionWeek>>
}

const LIFT_ORDER: LiftKey[] = ['squat', 'bench_press', 'deadlift']
const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const letterFromIndex = (index: number): string => String.fromCharCode(65 + index)

const toNumberOr = (value: unknown, fallback = 0): number => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const normalizeSet = (set: unknown): SetData | null => {
  if (!set || typeof set !== 'object') return null
  const record = set as Record<string, unknown>

  const weight = toNumberOr(record.weight ?? record.kg, 0)
  const reps = Math.max(0, Math.round(toNumberOr(record.reps ?? record.repetitions, 0)))
  if (reps <= 0) return null

  const percentageRaw = record.percentage ?? record.intensity
  const percentage = Number.isFinite(Number(percentageRaw)) ? Number(percentageRaw) : undefined
  const variant = typeof record.variant === 'string' ? record.variant : undefined

  return {
    weight,
    reps,
    ...(typeof percentage === 'number' ? { percentage } : {}),
    ...(variant ? { variant } : {}),
  }
}

const normalizeSessionsFromLetterFormat = (sessions: unknown): Record<string, Record<string, SessionWeek>> => {
  if (!sessions || typeof sessions !== 'object') return {}

  const record = sessions as Record<string, unknown>
  const keys = Object.keys(record)
  const hasLetterKeys = keys.some((key) => /^[A-Z]$/.test(key))
  if (!hasLetterKeys) return {}

  return record as Record<string, Record<string, SessionWeek>>
}

const normalizeSessionsFromWeekDayFormat = (sessions: unknown): Record<string, Record<string, SessionWeek>> => {
  if (!sessions || typeof sessions !== 'object') return {}

  const byWeek = sessions as Record<string, unknown>
  const weekKeys = Object.keys(byWeek).filter((key) => /^week_\d+$/.test(key)).sort()
  if (weekKeys.length === 0) return {}

  const dayToLetter = new Map<string, string>()
  const sessionsByLetter: Record<string, Record<string, SessionWeek>> = {}

  const allDays = new Set<string>()
  for (const weekKey of weekKeys) {
    const weekValue = byWeek[weekKey]
    if (!weekValue || typeof weekValue !== 'object') continue
    for (const dayKey of Object.keys(weekValue as Record<string, unknown>)) {
      allDays.add(dayKey)
    }
  }

  const sortedDays = [...allDays].sort((left, right) => {
    const leftIdx = DAY_ORDER.indexOf(left.toLowerCase())
    const rightIdx = DAY_ORDER.indexOf(right.toLowerCase())
    if (leftIdx === -1 && rightIdx === -1) return left.localeCompare(right)
    if (leftIdx === -1) return 1
    if (rightIdx === -1) return -1
    return leftIdx - rightIdx
  })

  sortedDays.forEach((day, idx) => dayToLetter.set(day, letterFromIndex(idx)))

  for (const weekKey of weekKeys) {
    const weekValue = byWeek[weekKey]
    if (!weekValue || typeof weekValue !== 'object') continue

    for (const [dayKey, dayDataRaw] of Object.entries(weekValue as Record<string, unknown>)) {
      if (!dayDataRaw || typeof dayDataRaw !== 'object') continue

      const letter = dayToLetter.get(dayKey)
      if (!letter) continue

      const dayData = dayDataRaw as Record<string, unknown>
      const exercises = (dayData.exercises && typeof dayData.exercises === 'object')
        ? (dayData.exercises as Record<string, unknown>)
        : {}

      const lifts = LIFT_ORDER
        .map((lift) => {
          const liftDataRaw = exercises[lift]
          if (!liftDataRaw || typeof liftDataRaw !== 'object') return null

          const liftData = liftDataRaw as Record<string, unknown>
          const setsRaw = Array.isArray(liftData.sets) ? liftData.sets : []
          const sets = setsRaw
            .map(normalizeSet)
            .filter((set): set is SetData => !!set)

          if (sets.length === 0) return null
          return { lift, sets }
        })
        .filter((liftEntry): liftEntry is { lift: LiftKey; sets: SetData[] } => !!liftEntry)

      if (!sessionsByLetter[letter]) sessionsByLetter[letter] = {}
      sessionsByLetter[letter][weekKey] = { lifts }
    }
  }

  return sessionsByLetter
}

const normalizeSessions = (rawSessions: unknown): Record<string, Record<string, SessionWeek>> => {
  const fromLetter = normalizeSessionsFromLetterFormat(rawSessions)
  if (Object.keys(fromLetter).length > 0) return fromLetter

  return normalizeSessionsFromWeekDayFormat(rawSessions)
}

export function normalizeProgramForView(rawProgram: unknown): NormalizedProgram {
  const program = (rawProgram && typeof rawProgram === 'object')
    ? (rawProgram as Record<string, unknown>)
    : {}

  const meta = (program.meta && typeof program.meta === 'object')
    ? (program.meta as Record<string, unknown>)
    : {}
  const info = (program.program_info && typeof program.program_info === 'object')
    ? (program.program_info as Record<string, unknown>)
    : {}

  const schemaVersion = typeof program.schema_version === 'string' ? program.schema_version : '1.0'
  const blockRaw = info.block ?? info.phase ?? 'prep'
  const block = typeof blockRaw === 'string' ? blockRaw : 'prep'

  const weeks = Math.max(1, Math.round(toNumberOr(info.weeks, 4)))

  const normalized: NormalizedProgram = {
    ...(typeof program.id === 'number' ? { id: program.id } : {}),
    schema_version: schemaVersion,
    meta: {
      filename: typeof meta.filename === 'string' ? meta.filename : 'program.json',
      created_at: typeof meta.created_at === 'string' ? meta.created_at : new Date().toISOString(),
      ...(typeof meta.created_by === 'string' ? { created_by: meta.created_by } : {}),
      ...(typeof meta.status === 'string' ? { status: meta.status } : {}),
    },
    client: (program.client && typeof program.client === 'object') ? (program.client as Record<string, unknown>) : {},
    program_info: {
      block,
      start_date: typeof info.start_date === 'string' ? info.start_date : '',
      ...(typeof info.end_date === 'string' ? { end_date: info.end_date } : {}),
      weeks,
    },
    input: (program.input && typeof program.input === 'object') ? (program.input as Record<string, unknown>) : {},
    calculated: (program.calculated && typeof program.calculated === 'object') ? (program.calculated as Record<string, unknown>) : {},
    sessions: normalizeSessions(program.sessions),
  }

  return normalized
}
