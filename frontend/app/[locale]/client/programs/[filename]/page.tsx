'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'

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
  lift: string
  setIndex: number
  prescribedWeight: number
  prescribedReps: number
  actualWeight?: number
  actualReps?: number
  rpe?: number
  completed: boolean
  notes?: string
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

  // Training log state
  const [logEntries, setLogEntries] = useState<Record<string, LogEntry>>({})
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

  // Fetch training log when program/week/session changes
  useEffect(() => {
    if (program?.id) {
      fetchTrainingLog()
    }
  }, [program?.id, selectedWeek, selectedSession])

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
        `/api/training-log?programId=${program!.id}&week=${selectedWeek}&session=${selectedSession}`
      )
      if (!response.ok) return

      const data = await response.json()
      const entries: Record<string, LogEntry> = {}
      for (const log of data.logs) {
        const key = `${log.lift}-${log.setIndex}`
        entries[key] = log
      }
      setLogEntries(entries)
    } catch {
      // Silently fail — log might not exist yet
    }
  }

  // Get or create a log entry for a specific set
  const getLogEntry = useCallback(
    (lift: string, setIndex: number, set: SetData): LogEntry => {
      const key = `${lift}-${setIndex}`
      return (
        logEntries[key] || {
          programId: program!.id,
          week: selectedWeek,
          session: selectedSession,
          lift,
          setIndex,
          prescribedWeight: set.weight,
          prescribedReps: set.reps,
          completed: false,
        }
      )
    },
    [logEntries, program, selectedWeek, selectedSession]
  )

  // Update a log entry locally
  const updateLogEntry = (
    lift: string,
    setIndex: number,
    set: SetData,
    updates: Partial<LogEntry>
  ) => {
    const key = `${lift}-${setIndex}`
    const current = getLogEntry(lift, setIndex, set)
    setLogEntries((prev) => ({
      ...prev,
      [key]: { ...current, ...updates },
    }))
    setSaveMessage('')
  }

  // Toggle set completion
  const toggleCompleted = (lift: string, setIndex: number, set: SetData) => {
    const entry = getLogEntry(lift, setIndex, set)
    updateLogEntry(lift, setIndex, set, { completed: !entry.completed })
  }

  // Save all log entries for current week/session
  const saveLog = async () => {
    if (!program) return
    setSaving(true)
    setSaveMessage('')

    try {
      // Collect all entries that have been interacted with
      const entries = Object.values(logEntries).filter(
        (e) => e.week === selectedWeek && e.session === selectedSession
      )

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
  const currentWeekData =
    program.sessions?.[selectedSession]?.[`week_${selectedWeek}`]

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

            {/* Session Selector */}
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

            {/* Session Content */}
            {currentWeekData?.lifts ? (
              <div className="space-y-6">
                {currentWeekData.lifts.map((liftData, liftIdx) => (
                  <div
                    key={liftIdx}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
                  >
                    {/* Lift Header */}
                    <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {liftDisplayName(liftData.lift)}
                      </h3>
                    </div>

                    {/* Sets Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b dark:border-gray-700 text-gray-500 dark:text-gray-400">
                            <th className="py-2 px-3 text-center w-10">✓</th>
                            <th className="py-2 px-3 text-left">Set</th>
                            <th className="py-2 px-3 text-right">Weight</th>
                            <th className="py-2 px-3 text-right">Reps</th>
                            <th className="py-2 px-3 text-center">RPE</th>
                            <th className="py-2 px-3 text-left">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {liftData.sets.map((set, setIdx) => {
                            const entry = getLogEntry(
                              liftData.lift,
                              setIdx,
                              set
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
                                {/* Completed checkbox */}
                                <td className="py-2 px-3 text-center">
                                  <button
                                    onClick={() =>
                                      toggleCompleted(
                                        liftData.lift,
                                        setIdx,
                                        set
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

                                {/* Set number */}
                                <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                                  {setIdx + 1}
                                  {set.variant && (
                                    <span className="ml-1 text-xs text-gray-400">
                                      ({set.variant})
                                    </span>
                                  )}
                                </td>

                                {/* Weight */}
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

                                {/* Reps */}
                                <td className="py-2 px-3 text-right font-medium text-gray-900 dark:text-gray-100">
                                  × {set.reps}
                                </td>

                                {/* RPE Input */}
                                <td className="py-2 px-3 text-center">
                                  <select
                                    value={entry.rpe ?? ''}
                                    onChange={(e) =>
                                      updateLogEntry(
                                        liftData.lift,
                                        setIdx,
                                        set,
                                        {
                                          rpe: e.target.value
                                            ? Number(e.target.value)
                                            : undefined,
                                        }
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

                                {/* Notes */}
                                <td className="py-2 px-3">
                                  <input
                                    type="text"
                                    value={entry.notes || ''}
                                    onChange={(e) =>
                                      updateLogEntry(
                                        liftData.lift,
                                        setIdx,
                                        set,
                                        { notes: e.target.value || undefined }
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
                  </div>
                ))}

                {/* Accessories */}
                {currentWeekData.accessories &&
                  currentWeekData.accessories.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                      <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        Accessories
                      </h4>
                      <ul className="text-sm space-y-1">
                        {currentWeekData.accessories.map((acc, idx) => (
                          <li
                            key={idx}
                            className="text-gray-700 dark:text-gray-300"
                          >
                            {acc.name}: {acc.prescription}
                          </li>
                        ))}
                      </ul>
                    </div>
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
                  No session data for Week {selectedWeek}, Session{' '}
                  {selectedSession}
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
