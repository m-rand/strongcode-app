'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
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
  input: Record<string, { variants?: Record<string, unknown> | string[] } | undefined>
  calculated: Record<string, unknown>
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
type DetailTab = 'plan' | 'history'

interface ProgramDayLog {
  id?: number
  performedDate: string
  notes?: string
  accessories?: string
}

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

function liftShortCode(lift: string): string {
  if (lift === 'bench_press') return 'BP'
  if (lift === 'deadlift') return 'DL'
  return 'SQ'
}

function liftBadgeClass(lift: string): string {
  if (lift === 'bench_press') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
  if (lift === 'deadlift') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
  return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200'
}

function variantBarClass(index: number): string {
  const palette = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-violet-500',
    'bg-amber-500',
  ]
  return palette[index % palette.length]
}

function variantCodeToNumberLabel(variant: string | undefined): string {
  if (!variant || variant === 'variant_1' || variant === 'comp') return 'V1'
  const match = variant.match(/^variant_(\d+)$/)
  if (match) return `V${match[1]}`
  return variant
}

function getLiftVariantName(program: Program | null, lift: string, variant: string | undefined): string {
  if (!variant || variant === 'variant_1' || variant === 'comp') return 'main'
  const variantsRaw = program?.input?.[lift]?.variants
  if (Array.isArray(variantsRaw)) {
    const match = variant.match(/^variant_(\d+)$/)
    const index = match ? Number(match[1]) - 2 : -1
    const name = index >= 0 ? String(variantsRaw[index] || '').trim() : ''
    return name || variant
  }
  if (variantsRaw && typeof variantsRaw === 'object') {
    const raw = (variantsRaw as Record<string, unknown>)[variant]
    const name = typeof raw === 'string' ? raw.trim() : ''
    return name || variant
  }
  return variant
}

function formatVariantPercent(percent: number): string {
  const rounded = percent >= 10 ? Math.round(percent) : Number(percent.toFixed(1))
  return `${rounded}%`
}

// RPE color coding
function rpeColor(rpe: number | undefined): string {
  if (rpe === undefined) return ''
  if (rpe <= 6) return 'text-green-600'
  if (rpe <= 7.5) return 'text-yellow-600'
  if (rpe <= 8.5) return 'text-orange-500'
  return 'text-red-600'
}

function isMeaningfulLogEntry(entry: LogEntry): boolean {
  const hasNotes = typeof entry.notes === 'string' && entry.notes.trim().length > 0
  const hasRpe = typeof entry.rpe === 'number'
  const hasWeightOverride = typeof entry.actualWeight === 'number' && entry.actualWeight !== entry.prescribedWeight
  const hasRepsOverride = typeof entry.actualReps === 'number' && entry.actualReps !== entry.prescribedReps
  const hasNonDefaultVariant =
    typeof entry.performedVariant === 'string' &&
    entry.performedVariant.length > 0 &&
    entry.performedVariant !== 'variant_1' &&
    entry.performedVariant !== 'comp'
  return !!entry.completed || hasNotes || hasRpe || hasWeightOverride || hasRepsOverride || hasNonDefaultVariant
}

function hasTrainingSignal(entry: LogEntry): boolean {
  const hasRpe = typeof entry.rpe === 'number'
  const hasWeightOverride = typeof entry.actualWeight === 'number' && entry.actualWeight !== entry.prescribedWeight
  const hasRepsOverride = typeof entry.actualReps === 'number' && entry.actualReps !== entry.prescribedReps
  const hasNonDefaultVariant =
    typeof entry.performedVariant === 'string' &&
    entry.performedVariant.length > 0 &&
    entry.performedVariant !== 'variant_1' &&
    entry.performedVariant !== 'comp'
  return !!entry.completed || hasRpe || hasWeightOverride || hasRepsOverride || hasNonDefaultVariant
}

function getVariantLabel(program: Program | null, lift: string, variant: string | undefined): string {
  const numberLabel = variantCodeToNumberLabel(variant)
  const name = getLiftVariantName(program, lift, variant)
  return name ? `${numberLabel}: ${name}` : numberLabel
}

function getVariantOptions(program: Program | null, lift: string, plannedVariant?: string): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = [{ value: 'variant_1', label: getVariantLabel(program, lift, 'variant_1') }]
  const variantsRaw = program?.input?.[lift]?.variants

  if (Array.isArray(variantsRaw)) {
    variantsRaw.forEach((name, idx) => {
      const trimmed = String(name || '').trim()
      if (!trimmed) return
      const code = `variant_${idx + 2}`
      options.push({ value: code, label: getVariantLabel(program, lift, code) })
    })
  } else if (variantsRaw && typeof variantsRaw === 'object') {
    ;(['variant_2', 'variant_3', 'variant_4'] as const).forEach((code) => {
      const raw = (variantsRaw as Record<string, unknown>)[code]
      const trimmed = typeof raw === 'string' ? raw.trim() : ''
      if (!trimmed) return
      options.push({ value: code, label: getVariantLabel(program, lift, code) })
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
  const searchParams = useSearchParams()
  const { data: session, status: authStatus } = useSession()
  const t = useTranslations('client')
  const locale = useLocale()

  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Current view state
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [detailTab, setDetailTab] = useState<DetailTab>('plan')
  const [selectedSession, setSelectedSession] = useState('A')
  const [selectedLift, setSelectedLift] = useState<LiftKey>('squat')
  const [viewMode, setViewMode] = useState<ViewMode>('lift')

  // Training log state
  const [logEntries, setLogEntries] = useState<Record<string, LogEntry>>({})
  const [allLogEntries, setAllLogEntries] = useState<LogEntry[]>([])
  const [workoutDateBySessionLift, setWorkoutDateBySessionLift] = useState<Record<string, string>>({})
  const [globalProgramInstructions, setGlobalProgramInstructions] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [dayLogsByDate, setDayLogsByDate] = useState<Record<string, ProgramDayLog>>({})
  const [dayLogSavingByDate, setDayLogSavingByDate] = useState<Record<string, boolean>>({})
  const [dayLogMessageByDate, setDayLogMessageByDate] = useState<Record<string, string>>({})
  const adminPreviewClientSlug = searchParams.get('client') || ''
  const isAdminPreview = session?.user?.role === 'admin' && searchParams.get('adminPreview') === '1'
  const isReadOnly = isAdminPreview || program?.meta?.status !== 'active'
  const backHref = isAdminPreview ? `/${locale}/admin/programs` : `/${locale}/client/dashboard`
  const backLabel = isAdminPreview ? 'Programs' : 'Dashboard'

  // Auth redirect
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push(`/${locale}/login`)
    }
  }, [authStatus, router, locale])

  // Fetch program
  useEffect(() => {
    const hasClientSlug = !!session?.user?.client_slug || (isAdminPreview && !!adminPreviewClientSlug)
    if (hasClientSlug && params.filename) {
      fetchProgram()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.client_slug, params.filename, isAdminPreview, adminPreviewClientSlug])

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

  // Fetch training + day logs when program/week changes
  useEffect(() => {
    if (program?.id) {
      fetchTrainingLog()
      fetchTrainingDayLogs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program?.id, selectedWeek])

  useEffect(() => {
    if (program?.id) {
      fetchAllTrainingLog()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program?.id])

  const fetchProgram = async () => {
    try {
      const slug = isAdminPreview ? adminPreviewClientSlug : session?.user?.client_slug
      if (!slug) throw new Error('Missing client slug')
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load program')
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

  const fetchAllTrainingLog = async () => {
    if (!program?.id) return
    try {
      const response = await fetch(`/api/training-log?programId=${program.id}`)
      if (!response.ok) return
      const data = await response.json()
      setAllLogEntries(Array.isArray(data?.logs) ? data.logs : [])
    } catch {
      // Silently fail — summary widgets are optional
    }
  }

  const fetchTrainingDayLogs = async () => {
    if (!program?.id) return

    try {
      const response = await fetch(
        `/api/training-day-log?programId=${program.id}&week=${selectedWeek}`
      )
      if (!response.ok) return

      const data = await response.json()
      const rows = Array.isArray(data?.logs) ? data.logs : []
      const next: Record<string, ProgramDayLog> = {}
      for (const row of rows) {
        const performedDate = typeof row?.performedDate === 'string' ? row.performedDate : ''
        if (!performedDate) continue
        next[performedDate] = {
          id: typeof row?.id === 'number' ? row.id : undefined,
          performedDate,
          notes: typeof row?.notes === 'string' ? row.notes : '',
          accessories: typeof row?.accessories === 'string' ? row.accessories : '',
        }
      }
      setDayLogsByDate(next)
      setDayLogMessageByDate({})
    } catch {
      // Silently fail — optional day-level notes
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
    if (isReadOnly) {
      setSaveMessage('This program is read-only.')
      return
    }
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
      await fetchAllTrainingLog()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save'
      setSaveMessage(`Error: ${message}`)
    } finally {
      setSaving(false)
    }
  }

  const updateDayLogField = (
    performedDate: string,
    field: 'notes' | 'accessories',
    value: string,
  ) => {
    setDayLogsByDate((prev) => ({
      ...prev,
      [performedDate]: {
        ...(prev[performedDate] || { performedDate }),
        [field]: value,
      },
    }))
    setDayLogMessageByDate((prev) => ({ ...prev, [performedDate]: '' }))
  }

  const saveDayLog = async (performedDate: string) => {
    if (!program || isReadOnly) return

    const draft = dayLogsByDate[performedDate] || { performedDate, notes: '', accessories: '' }
    setDayLogSavingByDate((prev) => ({ ...prev, [performedDate]: true }))
    setDayLogMessageByDate((prev) => ({ ...prev, [performedDate]: '' }))

    try {
      const response = await fetch('/api/training-day-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: program.id,
          week: selectedWeek,
          performedDate,
          notes: draft.notes || '',
          accessories: draft.accessories || '',
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Failed to save day note')

      setDayLogMessageByDate((prev) => ({
        ...prev,
        [performedDate]: data?.deleted ? 'Removed' : 'Saved ✓',
      }))
      await fetchTrainingDayLogs()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save day note'
      setDayLogMessageByDate((prev) => ({ ...prev, [performedDate]: `Error: ${message}` }))
    } finally {
      setDayLogSavingByDate((prev) => ({ ...prev, [performedDate]: false }))
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
            href={backHref}
            className="text-blue-600 hover:text-blue-800"
          >
            ← {backLabel}
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
  const plannedSetCountsBySessionLift: Record<string, number> = {}
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
            plannedSetCountsBySessionLift[sessionLiftKey(sessionKey, liftData.lift)] = liftData.sets.length
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
  const loggedSetCountsBySessionLift: Record<string, number> = {}
  const completedSetCountsBySessionLift: Record<string, number> = {}
  for (const entry of Object.values(logEntries)) {
    if (entry.week !== selectedWeek) continue
    if (entry.lift === 'squat' || entry.lift === 'bench_press' || entry.lift === 'deadlift') {
      if (!isMeaningfulLogEntry(entry)) continue
      const sessionLetter = entry.plannedSession || entry.session
      const key = sessionLiftKey(sessionLetter, entry.lift)
      loggedSetCountsBySessionLift[key] = (loggedSetCountsBySessionLift[key] || 0) + 1
      if (entry.completed) {
        completedSetCountsBySessionLift[key] = (completedSetCountsBySessionLift[key] || 0) + 1
      }
    }
  }
  for (const [key, plannedSetCount] of Object.entries(plannedSetCountsBySessionLift)) {
    if (plannedSetCount <= 0) continue
    const completedSetCount = completedSetCountsBySessionLift[key] || 0
    const loggedSetCount = loggedSetCountsBySessionLift[key] || 0
    const effectiveDoneSetCount = Math.max(completedSetCount, loggedSetCount)
    if (effectiveDoneSetCount < plannedSetCount) continue
    const separatorIndex = key.indexOf('-')
    if (separatorIndex <= 0) continue
    const sessionLetter = key.slice(0, separatorIndex)
    const lift = key.slice(separatorIndex + 1)
    if (lift === 'squat' || lift === 'bench_press' || lift === 'deadlift') {
      completedSessionSetsByLift[lift].add(sessionLetter)
    }
  }
  const parsedGlobal = parseGlobalInstructions(globalProgramInstructions)
  const blockVariantUsageByLift = (() => {
    const countsByLift: Record<LiftKey, Record<string, number>> = {
      squat: {},
      bench_press: {},
      deadlift: {},
    }

    for (const entry of allLogEntries) {
      if (entry.lift !== 'squat' && entry.lift !== 'bench_press' && entry.lift !== 'deadlift') continue
      if (!hasTrainingSignal(entry)) continue
      const variantCode = (entry.performedVariant || 'variant_1').trim() || 'variant_1'
      countsByLift[entry.lift][variantCode] = (countsByLift[entry.lift][variantCode] || 0) + 1
    }

    return (['squat', 'bench_press', 'deadlift'] as LiftKey[]).reduce((acc, lift) => {
      const total = Object.values(countsByLift[lift]).reduce((sum, count) => sum + count, 0)
      acc[lift] = Object.entries(countsByLift[lift])
        .map(([variantCode, count]) => ({
          variantCode,
          label: getVariantLabel(program, lift, variantCode),
          count,
          percent: total > 0 ? (count / total) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count)
      return acc
    }, { squat: [], bench_press: [], deadlift: [] } as Record<LiftKey, Array<{
      variantCode: string
      label: string
      count: number
      percent: number
    }>>)
  })()

  const getPlannedPercentageForEntry = (entry: LogEntry): number | null => {
    const weekData = program.sessions?.[entry.session]?.[weekKey]
    const liftData = weekData?.lifts?.find((item) => item.lift === entry.lift)
    const set = liftData?.sets?.[entry.setIndex]
    return typeof set?.percentage === 'number' ? set.percentage : null
  }

  const historyByDate = (() => {
    const byDate = new Map<
      string,
      {
        sessionTags: Map<string, {
          lift: string
          sessionLetter: string
          completedSets: number
          loggedSets: number
          plannedSets: number
        }>
        lifts: Record<string, {
          sessionLetters: Set<string>
          totalSets: number
          completedSets: number
          rpeSum: number
          rpeCount: number
        }>
      }
    >()

    for (const entry of Object.values(logEntries)) {
      if (entry.week !== selectedWeek) continue
      if (!entry.performedDate) continue
      if (!isMeaningfulLogEntry(entry)) continue
      const sessionLetter = entry.plannedSession || entry.session
      const key = entry.performedDate
      if (!byDate.has(key)) {
        byDate.set(key, { sessionTags: new Map(), lifts: {} })
      }
      const day = byDate.get(key)!
      const tagKey = `${entry.lift}-${sessionLetter}`
      const existingTag = day.sessionTags.get(tagKey)
      if (existingTag) {
        existingTag.loggedSets += 1
        if (entry.completed) existingTag.completedSets += 1
      } else {
        day.sessionTags.set(tagKey, {
          lift: entry.lift,
          sessionLetter,
          completedSets: entry.completed ? 1 : 0,
          loggedSets: 1,
          plannedSets: plannedSetCountsBySessionLift[sessionLiftKey(sessionLetter, entry.lift)] || 0,
        })
      }

      if (!day.lifts[entry.lift]) {
        day.lifts[entry.lift] = {
          sessionLetters: new Set<string>(),
          totalSets: 0,
          completedSets: 0,
          rpeSum: 0,
          rpeCount: 0,
        }
      }
      const liftRow = day.lifts[entry.lift]
      liftRow.sessionLetters.add(sessionLetter)
      liftRow.totalSets += 1
      if (entry.completed) liftRow.completedSets += 1
      if (typeof entry.rpe === 'number') {
        liftRow.rpeSum += entry.rpe
        liftRow.rpeCount += 1
      }
    }

    for (const performedDate of Object.keys(dayLogsByDate)) {
      if (!byDate.has(performedDate)) {
        byDate.set(performedDate, { sessionTags: new Map(), lifts: {} })
      }
    }

    return [...byDate.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([performedDate, value]) => {
        const lifts = Object.entries(value.lifts).map(([lift, row]) => ({
          lift,
          sessionLetters: [...row.sessionLetters].sort(),
          totalSets: row.totalSets,
          completedSets: row.completedSets,
          avgRpe: row.rpeCount > 0 ? row.rpeSum / row.rpeCount : null,
        }))
        const sessionTags = [...value.sessionTags.values()]
          .map((tag) => {
            const effectiveDoneSets = Math.max(tag.completedSets, tag.loggedSets)
            const isComplete = tag.plannedSets > 0 && effectiveDoneSets >= tag.plannedSets
            const baseLabel = `${liftShortCode(tag.lift)} ${tag.sessionLetter}`
            const label = isComplete || tag.plannedSets <= 0
              ? baseLabel
              : `${baseLabel} (${effectiveDoneSets}/${tag.plannedSets})`
            return {
              ...tag,
              isComplete,
              label,
            }
          })
          .sort((a, b) => a.label.localeCompare(b.label))
        return {
          performedDate,
          sessionTags,
          lifts,
        }
      })
  })()

  const renderSessionLiftCard = (
    sessionLetter: string,
    liftData: LiftData,
    options?: { showSessionLabel?: boolean; accessories?: WeekSession['accessories'] },
  ) => {
    const variantCounts = liftData.sets.reduce<Record<string, number>>((acc, set, setIdx) => {
      const entry = getLogEntry(sessionLetter, liftData.lift, setIdx, set)
      const variantCode = entry.performedVariant ?? set.variant ?? 'variant_1'
      acc[variantCode] = (acc[variantCode] || 0) + 1
      return acc
    }, {})

    const variantDistribution = Object.entries(variantCounts)
      .map(([variantCode, count]) => ({
        variantCode,
        count,
        label: getVariantLabel(program, liftData.lift, variantCode),
        percent: liftData.sets.length > 0 ? (count / liftData.sets.length) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
    const variantSummary = variantDistribution
      .map((item) => `${formatVariantPercent(item.percent)} ${item.label}`)
      .join(' · ')

    return (
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
                disabled={isReadOnly}
                className={`px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs text-gray-800 dark:text-gray-200 ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>
          {variantDistribution.length > 0 && (
            <div className="mt-2">
              <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-300 mb-1">
                Variant mix
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                {variantSummary}
              </p>
              <div className="h-1.5 w-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex">
                {variantDistribution.map((item, idx) => (
                  <div
                    key={`bar-${item.variantCode}-${idx}`}
                    className={`h-full ${variantBarClass(idx)}`}
                    style={{ width: `${item.percent}%` }}
                    title={`${item.label} (${formatVariantPercent(item.percent)})`}
                  />
                ))}
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {variantDistribution.map((item, idx) => (
                  <span
                    key={`chip-${item.variantCode}-${idx}`}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${variantBarClass(idx)}`} />
                    <span>{item.label}</span>
                    <span className="text-gray-500 dark:text-gray-300">{formatVariantPercent(item.percent)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
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
                      disabled={isReadOnly}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                        entry.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
                      } ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                      disabled={isReadOnly}
                      className={`w-full rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 py-1 px-2 text-sm text-gray-700 dark:text-gray-200 ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                      disabled={isReadOnly}
                      className={`w-24 text-right rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 py-1 px-2 text-sm text-gray-700 dark:text-gray-200 ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                      disabled={isReadOnly}
                      className={`w-16 text-center rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 py-1 text-sm ${
                        entry.completed ? rpeColor(entry.rpe) : 'text-gray-500 dark:text-gray-400'
                      } ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <option value="">-</option>
                      {[4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(
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
                      disabled={isReadOnly}
                      className={`w-full text-sm border-0 border-b border-gray-200 dark:border-gray-600 bg-transparent py-1 focus:ring-0 focus:border-blue-500 text-gray-700 dark:text-gray-300 placeholder-gray-300 ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
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
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href={backHref}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm"
              >
                ← {backLabel}
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
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  program.meta.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : program.meta.status === 'completed'
                      ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}
              >
                {program.meta.status.toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {program.program_info.start_date}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isReadOnly && (
          <div className="mb-4 rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
            This program is in <strong>{program.meta.status}</strong> status and is shown in read-only mode.
          </div>
        )}
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

            {/* Plan/History tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setDetailTab('plan')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  detailTab === 'plan'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow'
                }`}
              >
                Plan
              </button>
              <button
                onClick={() => setDetailTab('history')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  detailTab === 'history'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow'
                }`}
              >
                History
              </button>
            </div>

            {detailTab === 'plan' && (
              <>
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
              </>
            )}

            {/* Main Content by tab */}
            {detailTab === 'plan' ? (
              (viewMode === 'session' ? !!currentWeekData?.lifts : sessionsForSelectedLift.length > 0) ? (
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
                    {!isReadOnly && (
                      <button
                        onClick={saveLog}
                        disabled={saving}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                      >
                        {saving ? 'Saving...' : 'Save Progress'}
                      </button>
                    )}
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
              )
            ) : (
              <div className="space-y-3">
                {historyByDate.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <p className="text-gray-500 dark:text-gray-400 text-center">
                      No completed sessions logged yet for Week {selectedWeek}.
                    </p>
                  </div>
                ) : (
                  historyByDate.map((day, idx) => {
                    const dayLog = dayLogsByDate[day.performedDate] || { performedDate: day.performedDate, notes: '', accessories: '' }
                    const dayMessage = dayLogMessageByDate[day.performedDate] || ''
                    const daySaving = !!dayLogSavingByDate[day.performedDate]
                    const dayEntries = Object.values(logEntries)
                      .filter((entry) =>
                        entry.week === selectedWeek &&
                        entry.performedDate === day.performedDate &&
                        isMeaningfulLogEntry(entry)
                      )
                      .sort((a, b) => {
                        if (a.lift !== b.lift) return a.lift.localeCompare(b.lift)
                        if (a.session !== b.session) return a.session.localeCompare(b.session)
                        return a.setIndex - b.setIndex
                      })
                    const dayEntriesByLift = dayEntries.reduce<Record<string, LogEntry[]>>((acc, entry) => {
                      if (!acc[entry.lift]) acc[entry.lift] = []
                      acc[entry.lift].push(entry)
                      return acc
                    }, {})

                    return (
                      <details key={day.performedDate} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden" open={idx === 0}>
                        <summary className="cursor-pointer list-none px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-gray-100">
                                {day.performedDate}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Week {selectedWeek}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {day.sessionTags.map((tag) => {
                                return (
                                  <span
                                    key={`${day.performedDate}-${tag.lift}-${tag.sessionLetter}`}
                                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                                      tag.isComplete
                                        ? liftBadgeClass(tag.lift)
                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                                    }`}
                                  >
                                    {tag.label}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        </summary>
                        <div className="px-4 py-4 space-y-4">
                          {Object.entries(dayEntriesByLift).length > 0 && (
                            <div className="space-y-4">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Cell values are reps in <strong>planned/actual</strong> format.
                              </p>
                              {Object.entries(dayEntriesByLift).map(([lift, liftEntries]) => {
                                const columns = liftEntries.map((entry, colIndex) => ({
                                  ...entry,
                                  colId: `${entry.session}-${entry.setIndex}-${colIndex}`,
                                  header: `${entry.session}${entry.setIndex + 1}`,
                                }))

                                type LiftRow = {
                                  key: string
                                  label: string
                                  sortPct: number
                                  sortKg: number
                                  cells: Record<string, string>
                                }
                                const rowMap: Record<string, LiftRow> = {}

                                for (const col of columns) {
                                  const pctRaw = getPlannedPercentageForEntry(col)
                                  const pct = typeof pctRaw === 'number'
                                    ? Number(pctRaw.toFixed(1))
                                    : Number((((col.prescribedWeight || 0) / Math.max(1, Number(program.client.one_rm[col.lift as LiftKey] || 1))) * 100).toFixed(1))
                                  const kg = Number(col.prescribedWeight || 0)
                                  const pctLabel = Number.isFinite(pct) ? `${String(pct).replace(/\.0$/, '')}%` : '—'
                                  const key = `${pctLabel}-${kg}`
                                  if (!rowMap[key]) {
                                    rowMap[key] = {
                                      key,
                                      label: `${pctLabel} / ${kg}kg`,
                                      sortPct: Number.isFinite(pct) ? pct : 999,
                                      sortKg: Number.isFinite(kg) ? kg : 0,
                                      cells: {},
                                    }
                                  }
                                  const actual = typeof col.actualReps === 'number' ? col.actualReps : '—'
                                  rowMap[key].cells[col.colId] = `${col.prescribedReps}/${actual}`
                                }

                                const rows = Object.values(rowMap).sort((a, b) => {
                                  if (a.sortPct !== b.sortPct) return a.sortPct - b.sortPct
                                  return a.sortKg - b.sortKg
                                })

                                return (
                                  <div key={`${day.performedDate}-${lift}`} className="overflow-x-auto">
                                    <div className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                      {liftDisplayName(lift)}
                                    </div>
                                    <table className="min-w-full text-sm border border-gray-200 dark:border-gray-700">
                                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                                        <tr>
                                          <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-200">Zone / kg</th>
                                          {columns.map((col) => (
                                            <th key={`${day.performedDate}-${lift}-${col.colId}`} className="px-2 py-2 text-center text-gray-700 dark:text-gray-200">
                                              {col.header}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {rows.map((row) => (
                                          <tr key={`${day.performedDate}-${lift}-${row.key}`} className="border-t border-gray-200 dark:border-gray-700">
                                            <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                                              {row.label}
                                            </td>
                                            {columns.map((col) => (
                                              <td key={`${day.performedDate}-${lift}-${row.key}-${col.colId}`} className="px-2 py-2 text-center text-gray-700 dark:text-gray-300">
                                                {row.cells[col.colId] || '—'}
                                              </td>
                                            ))}
                                          </tr>
                                        ))}
                                        <tr className="border-t border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30">
                                          <td className="px-3 py-2 font-semibold text-gray-900 dark:text-gray-100">RPE</td>
                                          {columns.map((col) => (
                                            <td key={`${day.performedDate}-${lift}-rpe-${col.colId}`} className="px-2 py-2 text-center text-gray-700 dark:text-gray-300">
                                              {typeof col.rpe === 'number' ? col.rpe : '—'}
                                            </td>
                                          ))}
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">
                                Session note
                              </label>
                              <textarea
                                value={dayLog.notes || ''}
                                onChange={(e) => updateDayLogField(day.performedDate, 'notes', e.target.value)}
                                disabled={isReadOnly}
                                rows={4}
                                placeholder="How the day felt, key takeaways..."
                                className={`w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm text-gray-800 dark:text-gray-200 ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">
                                Completed accessories
                              </label>
                              <textarea
                                value={dayLog.accessories || ''}
                                onChange={(e) => updateDayLogField(day.performedDate, 'accessories', e.target.value)}
                                disabled={isReadOnly}
                                rows={4}
                                placeholder="e.g. Pull-ups 4x8, dips 3x12, abs 3x20..."
                                className={`w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-sm text-gray-800 dark:text-gray-200 ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {!isReadOnly && (
                              <button
                                onClick={() => saveDayLog(day.performedDate)}
                                disabled={daySaving}
                                className="px-4 py-2 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-60"
                              >
                                {daySaving ? 'Saving...' : 'Save day note'}
                              </button>
                            )}
                            {dayMessage && (
                              <span className={`text-sm ${dayMessage.startsWith('Error:') ? 'text-red-600' : 'text-green-600'}`}>
                                {dayMessage}
                              </span>
                            )}
                          </div>
                        </div>
                      </details>
                    )
                  })
                )}
              </div>
            )}

            {detailTab === 'plan' && (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

                <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:bg-gray-800 dark:border-gray-700">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-2">
                    Block Variant Overview
                  </p>
                  <div className="space-y-3">
                    {(['squat', 'bench_press', 'deadlift'] as LiftKey[]).map((lift) => {
                      const variants = blockVariantUsageByLift[lift]
                      return (
                        <div key={`block-variants-${lift}`}>
                          <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                            {liftDisplayName(lift)}
                          </div>
                          {variants.length === 0 ? (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              No logged sets yet.
                            </div>
                          ) : (
                            <>
                              <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                                {variants.map((item) => `${formatVariantPercent(item.percent)} ${item.label}`).join(' · ')}
                              </div>
                              <div className="h-1.5 w-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex mb-1">
                                {variants.map((item, idx) => (
                                  <div
                                    key={`block-bar-${lift}-${item.variantCode}-${idx}`}
                                    className={`h-full ${variantBarClass(idx)}`}
                                    style={{ width: `${item.percent}%` }}
                                  />
                                ))}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {variants.map((item, idx) => (
                                  <span
                                    key={`block-chip-${lift}-${item.variantCode}-${idx}`}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200"
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${variantBarClass(idx)}`} />
                                    <span>{item.label}</span>
                                    <span className="text-gray-500 dark:text-gray-300">{formatVariantPercent(item.percent)}</span>
                                  </span>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {program.meta.notes && (
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-900 mb-1">
                      Program-specific Notes
                    </p>
                    <div className="rounded border border-indigo-200 bg-white/70 px-3 py-3">
                      <MarkdownText content={program.meta.notes} />
                    </div>
                  </div>
                )}

                {(parsedGlobal.sections.length > 0 || parsedGlobal.faqItems.length > 0) && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-900 mb-1">
                      Global Instructions
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
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
