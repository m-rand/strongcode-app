'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// ─── Types ──────────────────────────────────────────────────

interface SetData {
  weight: number
  reps: number
  percentage?: number
  variant?: string
  rpe?: number
}

interface LiftData {
  lift: string
  sets: SetData[]
}

interface WeekSession {
  lifts: LiftData[]
  accessories?: { name: string; prescription: string }[]
  notes?: string
}

interface Program {
  id: number
  schema_version: string
  meta: {
    filename: string
    created_at: string
    status: string
    notes?: string
  }
  client: {
    name: string
    one_rm: { squat: number; bench_press: number; deadlift: number }
  }
  program_info: {
    block: string
    start_date: string
    end_date: string
    weeks: number
  }
  input: any
  calculated: any
  sessions?: Record<string, Record<string, WeekSession>>
}

interface LogEntry {
  id?: number
  programId: number
  week: number
  session: string
  plannedSession?: string
  performedDate?: string
  lift: string
  setIndex: number
  prescribedWeight: number
  prescribedReps: number
  performedVariant?: string
  actualWeight?: number
  actualReps?: number
  rpe?: number
  completed: boolean
  notes?: string
}

interface FaqItem {
  question: string
  answer: string
}

interface InstructionSection {
  title: string
  content: string
}

type LiftKey = 'squat' | 'bench_press' | 'deadlift'
type ViewMode = 'lift' | 'session'

function MarkdownText({ content }: { content: string }) {
  return (
    <div className="content-markdown text-sm text-amber-900">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="text-sm text-amber-900">{children}</p>,
          li: ({ children }) => <li className="text-sm text-amber-900">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-amber-900">{children}</strong>,
          a: ({ children, href }) => (
            <a href={href} className="underline underline-offset-2 text-amber-900">
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="content-markdown-list">{children}</ul>,
          ol: ({ children }) => <ol className="content-markdown-ordered-list">{children}</ol>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────

function liftDisplayName(lift: string): string {
  if (lift === 'bench_press') return 'Bench Press'
  return lift.charAt(0).toUpperCase() + lift.slice(1)
}

// RPE color coding
function rpeColor(rpe: number | undefined): string {
  if (rpe === undefined) return ''
  if (rpe <= 6) return 'text-green-600'
  if (rpe <= 7.5) return 'text-yellow-600'
  if (rpe <= 8.5) return 'text-orange-500'
  return 'text-red-600'
}

function getVariantLabel(program: Program | null, lift: string, variant: string | undefined): string {
  if (!variant) return ''
  if (variant === 'comp' || variant === 'variant_1') return 'Variant 1 (Comp)'

  const liftVariants = program?.input?.[lift]?.variants || {}
  const base: Record<string, string> = {
    variant_2: liftVariants.variant_2 ? `Variant 2 (${liftVariants.variant_2})` : 'Variant 2',
    variant_3: liftVariants.variant_3 ? `Variant 3 (${liftVariants.variant_3})` : 'Variant 3',
    variant_4: liftVariants.variant_4 ? `Variant 4 (${liftVariants.variant_4})` : 'Variant 4',
  }

  return base[variant] || variant
}

function getVariantOptions(program: Program | null, lift: string, plannedVariant?: string): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = [{ value: 'variant_1', label: 'Variant 1 (Comp)' }]
  const variantsRaw = program?.input?.[lift]?.variants

  if (Array.isArray(variantsRaw)) {
    variantsRaw.forEach((name, idx) => {
      const trimmed = String(name || '').trim()
      if (!trimmed) return
      const code = `variant_${idx + 2}`
      options.push({ value: code, label: `${code.replace('variant_', 'Variant ')} (${trimmed})` })
    })
  } else if (variantsRaw && typeof variantsRaw === 'object') {
    ;(['variant_2', 'variant_3', 'variant_4'] as const).forEach((code) => {
      const raw = (variantsRaw as Record<string, unknown>)[code]
      const trimmed = typeof raw === 'string' ? raw.trim() : ''
      if (!trimmed) return
      options.push({ value: code, label: `${code.replace('variant_', 'Variant ')} (${trimmed})` })
    })
  }

  if (plannedVariant && !options.some((option) => option.value === plannedVariant)) {
    options.push({ value: plannedVariant, label: getVariantLabel(program, lift, plannedVariant) || plannedVariant })
  }

  return options
}

function getTodayIsoDate(): string {
  return new Date().toISOString().split('T')[0]
}

function sessionLiftKey(session: string, lift: string): string {
  return `${session}-${lift}`
}

function splitGeneralSections(rawGeneral: string): InstructionSection[] {
  const general = (rawGeneral || '').trim()
  if (!general) return []

  const lines = general.split('\n')
  const sections: InstructionSection[] = []
  let currentTitle = ''
  let currentBody: string[] = []

  const flush = () => {
    const content = currentBody.join('\n').trim()
    if (!currentTitle && !content) return
    sections.push({
      title: currentTitle || 'General Instructions',
      content,
    })
  }

  const isHeadingLine = (line: string, nextNonEmpty: string | null): boolean => {
    if (!line) return false
    if (line.startsWith('-')) return false
    if (/^\d+[\.\)]/.test(line)) return false
    if (/^[ivxlcdm]+\)/i.test(line)) return false
    if (!nextNonEmpty) return false
    return (
      nextNonEmpty.startsWith('-') ||
      /^\d+[\.\)]/.test(nextNonEmpty) ||
      /^[ivxlcdm]+\)/i.test(nextNonEmpty)
    )
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const line = rawLine.trim()
    const nextNonEmptyLine = (() => {
      for (let j = i + 1; j < lines.length; j++) {
        const candidate = lines[j].trim()
        if (candidate) return candidate
      }
      return null
    })()

    if (isHeadingLine(line, nextNonEmptyLine)) {
      if (currentTitle || currentBody.length > 0) flush()
      currentTitle = line
        .replace(/^#{1,6}\s*/, '')
        .replace(/:\s*$/, '')
        .trim()
      currentBody = []
      continue
    }

    currentBody.push(rawLine)
  }

  if (currentTitle || currentBody.length > 0) flush()

  if (sections.length === 0) {
    return [{ title: 'General Instructions', content: general }]
  }

  return sections
}

function parseGlobalInstructions(raw: string): { sections: InstructionSection[]; faqItems: FaqItem[] } {
  const text = (raw || '').trim()
  if (!text) return { sections: [], faqItems: [] }

  const faqMatch = text.match(/\n\s*FAQ\s*:?\s*\n/i)
  if (!faqMatch || faqMatch.index == null) {
    return { sections: splitGeneralSections(text), faqItems: [] }
  }

  const splitIndex = faqMatch.index
  const general = text.slice(0, splitIndex).trim()
  const faqRaw = text.slice(splitIndex + faqMatch[0].length).trim()
  const faqItems: FaqItem[] = []

  const regex = /(?:^|\n)Q:\s*(.+?)\nA:\s*([\s\S]*?)(?=\nQ:\s*|$)/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(faqRaw)) !== null) {
    const question = (match[1] || '').trim()
    const answer = (match[2] || '').trim()
    if (!question || !answer) continue
    faqItems.push({ question, answer })
  }

  return { sections: splitGeneralSections(general), faqItems }
}

// ─── Component ──────────────────────────────────────────────

export default function ClientProgramDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status: authStatus } = useSession()
  const t = useTranslations('client')
  const locale = useLocale()

  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Current view state
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [selectedSession, setSelectedSession] = useState('A')
  const [selectedLift, setSelectedLift] = useState<LiftKey>('squat')
  const [viewMode, setViewMode] = useState<ViewMode>('lift')

  // Training log state
  const [logEntries, setLogEntries] = useState<Record<string, LogEntry>>({})
  const [workoutDateBySessionLift, setWorkoutDateBySessionLift] = useState<Record<string, string>>({})
  const [globalProgramInstructions, setGlobalProgramInstructions] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  // Auth redirect
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push(`/${locale}/login`)
    }
  }, [authStatus, router, locale])

  // Fetch program
  useEffect(() => {
    if (session?.user?.client_slug && params.filename) {
      fetchProgram()
    }
  }, [session?.user?.client_slug, params.filename])

  useEffect(() => {
    let cancelled = false
    const loadGlobalProgramInstructions = async () => {
      try {
        const response = await fetch('/api/settings/program-instructions')
        if (!response.ok) return
        const data = await response.json()
        if (cancelled) return
        setGlobalProgramInstructions(typeof data?.instructions === 'string' ? data.instructions : '')
      } catch {
        if (!cancelled) setGlobalProgramInstructions('')
      }
    }
    loadGlobalProgramInstructions()
    return () => {
      cancelled = true
    }
  }, [])

  // Fetch training log when program/week/session changes
  useEffect(() => {
    if (program?.id) {
      fetchTrainingLog()
    }
  }, [program?.id, selectedWeek])

  const fetchProgram = async () => {
    try {
      const slug = session?.user?.client_slug
      const filename = decodeURIComponent(params.filename as string)
      const response = await fetch(
        `/api/programs/${slug}/${encodeURIComponent(filename)}`
      )
      if (!response.ok) throw new Error('Failed to load program')
      const data = await response.json()
      setProgram(data.program)

      // Set initial selected session to first available
      if (data.program.sessions) {
        const sessionKeys = Object.keys(data.program.sessions).sort()
        if (sessionKeys.length > 0) {
          setSelectedSession(sessionKeys[0])
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchTrainingLog = async () => {
    try {
      const response = await fetch(
        `/api/training-log?programId=${program!.id}&week=${selectedWeek}`
      )
      if (!response.ok) return

      const data = await response.json()
      const entries: Record<string, LogEntry> = {}
      for (const log of data.logs) {
        const key = `${log.session}-${log.lift}-${log.setIndex}`
        entries[key] = log
      }
      setLogEntries(entries)
    } catch {
      // Silently fail — log might not exist yet
    }
  }

  useEffect(() => {
    const nextDates: Record<string, string> = {}
    const weekKey = `week_${selectedWeek}`
    const sessionKeys = program?.sessions ? Object.keys(program.sessions).sort() : []

    for (const sessionKey of sessionKeys) {
      const liftsInSession = program?.sessions?.[sessionKey]?.[weekKey]?.lifts || []
      for (const liftData of liftsInSession) {
        const lift = liftData?.lift
        if (!lift) continue
        const liftEntries = Object.values(logEntries).filter(
          (entry) =>
            entry.week === selectedWeek &&
            entry.session === sessionKey &&
            entry.lift === lift &&
            !!entry.performedDate
        )
        nextDates[sessionLiftKey(sessionKey, lift)] = liftEntries[0]?.performedDate || getTodayIsoDate()
      }
    }

    setWorkoutDateBySessionLift(nextDates)
  }, [program?.sessions, selectedWeek, logEntries])

  // Get or create a log entry for a specific set
  const getLogEntry = useCallback(
    (sessionLetter: string, lift: string, setIndex: number, set: SetData): LogEntry => {
      const key = `${sessionLetter}-${lift}-${setIndex}`
      return (
        logEntries[key] || {
          programId: program!.id,
          week: selectedWeek,
          session: sessionLetter,
          plannedSession: sessionLetter,
          performedDate: workoutDateBySessionLift[sessionLiftKey(sessionLetter, lift)] || getTodayIsoDate(),
          lift,
          setIndex,
          prescribedWeight: set.weight,
          prescribedReps: set.reps,
          performedVariant: set.variant,
          actualWeight: set.weight,
          completed: false,
        }
      )
    },
    [logEntries, program, selectedWeek, workoutDateBySessionLift]
  )

  // Update a log entry locally
  const updateLogEntry = (
    sessionLetter: string,
    lift: string,
    setIndex: number,
    set: SetData,
    updates: Partial<LogEntry>
  ) => {
    const key = `${sessionLetter}-${lift}-${setIndex}`
    const current = getLogEntry(sessionLetter, lift, setIndex, set)
    setLogEntries((prev) => ({
      ...prev,
      [key]: { ...current, ...updates },
    }))
    setSaveMessage('')
  }

  const updateLiftWorkoutDate = (sessionLetter: string, lift: string, nextDate: string) => {
    setWorkoutDateBySessionLift((prev) => ({ ...prev, [sessionLiftKey(sessionLetter, lift)]: nextDate }))
    setLogEntries((prev) => {
      const next = { ...prev }
      for (const [key, entry] of Object.entries(next)) {
        if (entry.week === selectedWeek && entry.session === sessionLetter && entry.lift === lift) {
          next[key] = { ...entry, performedDate: nextDate, plannedSession: sessionLetter }
        }
      }
      return next
    })
    setSaveMessage('')
  }

  // Toggle set completion
  const toggleCompleted = (sessionLetter: string, lift: string, setIndex: number, set: SetData) => {
    const entry = getLogEntry(sessionLetter, lift, setIndex, set)
    updateLogEntry(sessionLetter, lift, setIndex, set, { completed: !entry.completed })
  }

  // Save all log entries for current week/session
  const saveLog = async () => {
    if (!program) return
    setSaving(true)
    setSaveMessage('')

    try {
      // Collect all entries that have been interacted with
      const entries = Object.values(logEntries)
        .filter((entry) => {
          if (entry.week !== selectedWeek) return false
          if (viewMode === 'session') return entry.session === selectedSession
          return entry.lift === selectedLift
        })
        .map((entry) => ({
          ...entry,
          plannedSession: entry.plannedSession || entry.session,
          performedDate: entry.performedDate || workoutDateBySessionLift[sessionLiftKey(entry.session, entry.lift)] || getTodayIsoDate(),
        }))

      if (entries.length === 0) {
        setSaveMessage('Nothing to save')
        setSaving(false)
        return
      }

      const response = await fetch('/api/training-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      })

      if (!response.ok) throw new Error('Failed to save')
      const data = await response.json()
      setSaveMessage(`Saved ${data.results.length} sets ✓`)

      // Refresh log
      await fetchTrainingLog()
    } catch (err: any) {
      setSaveMessage(`Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  // ─── Render ─────────────────────────────────────────────────

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">{t('dashboard.loading')}</p>
      </div>
    )
  }

  if (error || !program) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Program not found'}</p>
          <Link
            href={`/${locale}/client/dashboard`}
            className="text-blue-600 hover:text-blue-800"
          >
            ← {t('dashboard.welcome')}
          </Link>
        </div>
      </div>
    )
  }

  const sessionKeys = program.sessions
    ? Object.keys(program.sessions).sort()
    : []
  const hasSessions = sessionKeys.length > 0
  const weekKey = `week_${selectedWeek}`
  const currentWeekData =
    program.sessions?.[selectedSession]?.[weekKey]
  const sessionsForSelectedLift = sessionKeys
    .map((sessionKey) => {
      const weekData = program.sessions?.[sessionKey]?.[weekKey]
      const liftData = weekData?.lifts?.find((item) => item.lift === selectedLift)
      return { sessionKey, weekData, liftData }
    })
    .filter(({ liftData }) => !!liftData && Array.isArray(liftData.sets) && liftData.sets.length > 0) as Array<{
      sessionKey: string
      weekData: WeekSession | undefined
      liftData: LiftData
    }>
  const prescribedSessionsByLift = { squat: 0, bench_press: 0, deadlift: 0 }
  if (program.sessions) {
    for (const sessionKey of sessionKeys) {
      const weekData = program.sessions[sessionKey]?.[weekKey]
      if (!weekData?.lifts) continue
      for (const liftData of weekData.lifts) {
        if (!liftData?.lift) continue
        if (liftData.lift === 'squat' || liftData.lift === 'bench_press' || liftData.lift === 'deadlift') {
          if (Array.isArray(liftData.sets) && liftData.sets.length > 0) {
            prescribedSessionsByLift[liftData.lift] += 1
          }
        }
      }
    }
  }
  const completedSessionSetsByLift = {
    squat: new Set<string>(),
    bench_press: new Set<string>(),
    deadlift: new Set<string>(),
  }
  for (const entry of Object.values(logEntries)) {
    if (entry.week !== selectedWeek) continue
    if (entry.lift === 'squat' || entry.lift === 'bench_press' || entry.lift === 'deadlift') {
      completedSessionSetsByLift[entry.lift].add(entry.session)
    }
  }
  const parsedGlobal = parseGlobalInstructions(globalProgramInstructions)

  const renderSessionLiftCard = (
    sessionLetter: string,
    liftData: LiftData,
    options?: { showSessionLabel?: boolean; accessories?: WeekSession['accessories'] },
  ) => (
    <div
      key={`${sessionLetter}-${liftData.lift}`}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
    >
      <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {options?.showSessionLabel ? `Session ${sessionLetter} · ${liftDisplayName(liftData.lift)}` : liftDisplayName(liftData.lift)}
          </h3>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 dark:text-gray-300">Workout date</label>
            <input
              type="date"
              value={workoutDateBySessionLift[sessionLiftKey(sessionLetter, liftData.lift)] || getTodayIsoDate()}
              onChange={(e) => updateLiftWorkoutDate(sessionLetter, liftData.lift, e.target.value)}
              className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs text-gray-800 dark:text-gray-200"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b dark:border-gray-700 text-gray-500 dark:text-gray-400">
              <th className="py-2 px-3 text-center w-10">✓</th>
              <th className="py-2 px-3 text-left">Set</th>
              <th className="py-2 px-3 text-left">Variant</th>
              <th className="py-2 px-3 text-right">Planned</th>
              <th className="py-2 px-3 text-right">Actual kg</th>
              <th className="py-2 px-3 text-right">Reps</th>
              <th className="py-2 px-3 text-center">RPE</th>
              <th className="py-2 px-3 text-left">Notes</th>
            </tr>
          </thead>
          <tbody>
            {liftData.sets.map((set, setIdx) => {
              const entry = getLogEntry(
                sessionLetter,
                liftData.lift,
                setIdx,
                set,
              )
              return (
                <tr
                  key={setIdx}
                  className={`border-b dark:border-gray-700 ${
                    entry.completed
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : ''
                  }`}
                >
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() =>
                        toggleCompleted(
                          sessionLetter,
                          liftData.lift,
                          setIdx,
                          set,
                        )
                      }
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                        entry.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
                      }`}
                    >
                      {entry.completed && '✓'}
                    </button>
                  </td>

                  <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                    {setIdx + 1}
                  </td>

                  <td className="py-2 px-3">
                    <select
                      value={entry.performedVariant ?? set.variant ?? 'variant_1'}
                      onChange={(e) =>
                        updateLogEntry(
                          sessionLetter,
                          liftData.lift,
                          setIdx,
                          set,
                          { performedVariant: e.target.value || undefined },
                        )
                      }
                      className="w-full rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 py-1 px-2 text-sm text-gray-700 dark:text-gray-200"
                    >
                      {getVariantOptions(program, liftData.lift, set.variant).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="py-2 px-3 text-right">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {set.weight}
                    </span>
                    <span className="text-gray-400 ml-1">kg</span>
                    {set.percentage && (
                      <span className="text-xs text-gray-400 ml-1">
                        ({set.percentage.toFixed(0)}%)
                      </span>
                    )}
                  </td>

                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      step="0.5"
                      value={entry.actualWeight ?? ''}
                      onChange={(e) =>
                        updateLogEntry(
                          sessionLetter,
                          liftData.lift,
                          setIdx,
                          set,
                          {
                            actualWeight: e.target.value === ''
                              ? undefined
                              : Number(e.target.value),
                          },
                        )
                      }
                      className="w-24 text-right rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 py-1 px-2 text-sm text-gray-700 dark:text-gray-200"
                    />
                  </td>

                  <td className="py-2 px-3 text-right font-medium text-gray-900 dark:text-gray-100">
                    × {set.reps}
                  </td>

                  <td className="py-2 px-3 text-center">
                    <select
                      value={entry.rpe ?? ''}
                      onChange={(e) =>
                        updateLogEntry(
                          sessionLetter,
                          liftData.lift,
                          setIdx,
                          set,
                          {
                            rpe: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          },
                        )
                      }
                      className={`w-16 text-center rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 py-1 text-sm ${rpeColor(entry.rpe)}`}
                    >
                      <option value="">-</option>
                      {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(
                        (v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        )
                      )}
                    </select>
                  </td>

                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={entry.notes || ''}
                      onChange={(e) =>
                        updateLogEntry(
                          sessionLetter,
                          liftData.lift,
                          setIdx,
                          set,
                          { notes: e.target.value || undefined },
                        )
                      }
                      placeholder="..."
                      className="w-full text-sm border-0 border-b border-gray-200 dark:border-gray-600 bg-transparent py-1 focus:ring-0 focus:border-blue-500 text-gray-700 dark:text-gray-300 placeholder-gray-300"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {options?.accessories && options.accessories.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
            Accessories
          </h4>
          <ul className="text-sm space-y-1">
            {options.accessories.map((acc, idx) => (
              <li key={idx} className="text-gray-700 dark:text-gray-300">
                {acc.name}: {acc.prescription}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href={`/${locale}/client/dashboard`}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm"
              >
                ← Dashboard
              </Link>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  program.program_info.block === 'prep'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}
              >
                {program.program_info.block.toUpperCase()}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {program.program_info.weeks} weeks
              </span>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {program.program_info.start_date}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!hasSessions ? (
          /* No sessions — show calculated targets only */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Program Targets
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              This program has calculated targets but no concrete sessions yet.
              Your coach will add session details soon.
            </p>
          </div>
        ) : (
          <>
            {/* Week Selector */}
            <div className="flex gap-2 mb-4">
              {Array.from({ length: program.program_info.weeks }, (_, i) => i + 1).map(
                (week) => (
                  <button
                    key={week}
                    onClick={() => setSelectedWeek(week)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedWeek === week
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow'
                    }`}
                  >
                    Week {week}
                  </button>
                )
              )}
            </div>

            {/* View Mode Selector */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setViewMode('lift')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'lift'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow'
                }`}
              >
                By Lift
              </button>
              <button
                onClick={() => setViewMode('session')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'session'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow'
                }`}
              >
                By Session
              </button>
            </div>

            {viewMode === 'session' ? (
              <div className="flex gap-2 mb-6">
                {sessionKeys.map((key) => (
                  <button
                    key={key}
                    onClick={() => setSelectedSession(key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedSession === key
                        ? 'bg-green-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow'
                    }`}
                  >
                    Session {key}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex gap-2 mb-6">
                {(['squat', 'bench_press', 'deadlift'] as LiftKey[]).map((lift) => (
                  <button
                    key={lift}
                    onClick={() => setSelectedLift(lift)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedLift === lift
                        ? 'bg-green-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow'
                    }`}
                  >
                    {liftDisplayName(lift)}
                  </button>
                ))}
              </div>
            )}

            {/* Weekly Lift Progress */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {(['squat', 'bench_press', 'deadlift'] as const).map((lift) => (
                <div
                  key={`week-progress-${lift}`}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow px-4 py-3 border border-gray-100 dark:border-gray-700"
                >
                  <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {liftDisplayName(lift)}
                  </div>
                  <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    Completed this week:{' '}
                    <span className="font-semibold text-green-700 dark:text-green-400">
                      {completedSessionSetsByLift[lift].size}
                    </span>
                    <span className="text-gray-400"> / </span>
                    <span className="font-semibold">{prescribedSessionsByLift[lift]}</span>
                  </div>
                </div>
              ))}
            </div>

            {(globalProgramInstructions || program.meta.notes) && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-900 mb-1">
                  Program instructions
                </p>
                {parsedGlobal.sections.map((section, idx) => (
                  <details key={`${section.title}-${idx}`} className={`rounded border border-amber-200 bg-white/60 ${idx > 0 ? 'mt-2' : ''}`}>
                    <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-amber-900">
                      {section.title}
                    </summary>
                    <div className="px-3 pb-3">
                      <MarkdownText content={section.content} />
                    </div>
                  </details>
                ))}
                {parsedGlobal.faqItems.length > 0 && (
                  <details className="mt-2 rounded border border-amber-200 bg-white/60">
                    <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-amber-900">
                      FAQ
                    </summary>
                    <div className="px-3 pb-3 space-y-2">
                      {parsedGlobal.faqItems.map((item, idx) => (
                        <details key={`${item.question}-${idx}`} className="rounded border border-amber-100 bg-white">
                          <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-amber-900">
                            {item.question}
                          </summary>
                          <div className="px-3 pb-3">
                            <MarkdownText content={item.answer} />
                          </div>
                        </details>
                      ))}
                    </div>
                  </details>
                )}
                {(globalProgramInstructions && program.meta.notes) && (
                  <div className="my-2 border-t border-amber-200" />
                )}
                {program.meta.notes && (
                  <details className="rounded border border-amber-200 bg-white/60">
                    <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-amber-900">
                      Program-specific notes
                    </summary>
                    <div className="px-3 pb-3">
                      <MarkdownText content={program.meta.notes} />
                    </div>
                  </details>
                )}
              </div>
            )}

            {/* Session Content */}
            {(viewMode === 'session' ? !!currentWeekData?.lifts : sessionsForSelectedLift.length > 0) ? (
              <div className="space-y-6">
                {viewMode === 'session' ? (
                  <>
                    {currentWeekData?.lifts?.map((liftData) => (
                      renderSessionLiftCard(selectedSession, liftData)
                    ))}

                    {currentWeekData?.accessories && currentWeekData.accessories.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                          Accessories
                        </h4>
                        <ul className="text-sm space-y-1">
                          {currentWeekData.accessories.map((acc, idx) => (
                            <li key={idx} className="text-gray-700 dark:text-gray-300">
                              {acc.name}: {acc.prescription}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  sessionsForSelectedLift.map(({ sessionKey, weekData, liftData }) =>
                    renderSessionLiftCard(sessionKey, liftData, {
                      showSessionLabel: true,
                      accessories: weekData?.accessories,
                    }),
                  )
                )}

                {/* Save Button */}
                <div className="flex items-center gap-4 pt-2">
                  <button
                    onClick={saveLog}
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Progress'}
                  </button>
                  {saveMessage && (
                    <span
                      className={`text-sm ${
                        saveMessage.includes('Error')
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {saveMessage}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  {viewMode === 'session'
                    ? `No session data for Week ${selectedWeek}, Session ${selectedSession}`
                    : `No session data for ${liftDisplayName(selectedLift)} in Week ${selectedWeek}`}
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
