'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'

interface Program {
  id: number
  schema_version: string
  meta: {
    filename: string
    created_at: string
    created_by: string
    status: string
    notes?: string
  }
  client: {
    name: string
    delta: string
    one_rm: {
      squat: number
      bench_press: number
      deadlift: number
    }
  }
  program_info: {
    block: string
    start_date: string
    end_date: string
    weeks: number
  }
  input: any
  calculated: any
  sessions?: any
}

interface LogEntry {
  id: number
  programId: number
  week: number
  session: string
  lift: string
  setIndex: number
  prescribedWeight: number
  prescribedReps: number
  actualWeight: number | null
  actualReps: number | null
  rpe: number | null
  completed: boolean
  notes: string | null
  loggedAt: string
}

function liftDisplayName(lift: string): string {
  if (lift === 'bench_press') return 'Bench Press'
  return lift.charAt(0).toUpperCase() + lift.slice(1)
}

function rpeColor(rpe: number | null): string {
  if (rpe === null) return 'text-gray-400'
  if (rpe <= 6) return 'text-green-600'
  if (rpe <= 7.5) return 'text-yellow-600'
  if (rpe <= 8.5) return 'text-orange-500'
  return 'text-red-600'
}

export default function ProgramDetailPage() {
  const params = useParams()
  const t = useTranslations('admin.programDetail')
  const locale = useLocale()
  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [trainingLog, setTrainingLog] = useState<LogEntry[]>([])
  const [logLoading, setLogLoading] = useState(false)
  const [enriching, setEnriching] = useState(false)

  useEffect(() => {
    fetchProgram()
  }, [params.client, params.filename])

  useEffect(() => {
    if (program?.id) {
      fetchTrainingLog()
    }
  }, [program?.id])

  const fetchProgram = async () => {
    try {
      const response = await fetch(
        `/api/programs/${params.client}/${params.filename}`
      )
      if (!response.ok) throw new Error('Failed to load program')

      const data = await response.json()
      setProgram(data.program)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const enrichWithAre = async () => {
    setEnriching(true)
    try {
      const response = await fetch(
        `/api/programs/${params.client}/${params.filename}/enrich`,
        { method: 'POST' }
      )
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Enrichment failed')
      }
      // Reload program to show ARE
      await fetchProgram()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setEnriching(false)
    }
  }

  const fetchTrainingLog = async () => {
    setLogLoading(true)
    try {
      const response = await fetch(`/api/training-log?programId=${program!.id}`)
      if (!response.ok) return
      const data = await response.json()
      setTrainingLog(data.logs || [])
    } catch {
      // Silently fail
    } finally {
      setLogLoading(false)
    }
  }

  // ─── Training Log Stats ─────────────────────────────────
  const logStats = (() => {
    if (trainingLog.length === 0) return null

    const completed = trainingLog.filter(e => e.completed)
    const withRpe = trainingLog.filter(e => e.rpe !== null)
    const avgRpe = withRpe.length > 0
      ? withRpe.reduce((sum, e) => sum + e.rpe!, 0) / withRpe.length
      : null

    // Per-week breakdown
    const weekStats: Record<number, { total: number; completed: number; avgRpe: number | null }> = {}
    for (const entry of trainingLog) {
      if (!weekStats[entry.week]) {
        weekStats[entry.week] = { total: 0, completed: 0, avgRpe: null }
      }
      weekStats[entry.week].total++
      if (entry.completed) weekStats[entry.week].completed++
    }
    for (const week of Object.keys(weekStats).map(Number)) {
      const weekRpe = trainingLog.filter(e => e.week === week && e.rpe !== null)
      weekStats[week].avgRpe = weekRpe.length > 0
        ? weekRpe.reduce((sum, e) => sum + e.rpe!, 0) / weekRpe.length
        : null
    }

    return {
      totalSets: trainingLog.length,
      completedSets: completed.length,
      adherence: Math.round((completed.length / trainingLog.length) * 100),
      avgRpe,
      weekStats,
    }
  })()

  // Group log entries by week → session → lift for quick lookup
  const groupedLog = (() => {
    const grouped: Record<number, Record<string, Record<string, LogEntry[]>>> = {}
    for (const entry of trainingLog) {
      if (!grouped[entry.week]) grouped[entry.week] = {}
      if (!grouped[entry.week][entry.session]) grouped[entry.week][entry.session] = {}
      if (!grouped[entry.week][entry.session][entry.lift]) grouped[entry.week][entry.session][entry.lift] = []
      grouped[entry.week][entry.session][entry.lift].push(entry)
    }
    for (const week of Object.values(grouped)) {
      for (const session of Object.values(week)) {
        for (const lift of Object.keys(session)) {
          session[lift].sort((a, b) => a.setIndex - b.setIndex)
        }
      }
    }
    return grouped
  })()

  // Lookup helper: find log entry for a specific set
  const findLogEntry = (weekNum: number, sessionLetter: string, lift: string, setIndex: number): LogEntry | undefined => {
    return groupedLog[weekNum]?.[sessionLetter]?.[lift]?.[setIndex]
  }

  const hasAnyLog = trainingLog.length > 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{t('loading')}</p>
      </div>
    )
  }

  if (error || !program) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || t('notFound')}</p>
          <Link
            href={`/${locale}/admin/programs`}
            className="text-blue-600 hover:text-blue-800"
          >
            {t('backToPrograms')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/${locale}/admin/programs`}
                className="text-blue-600 hover:text-blue-800"
              >
                {t('programs')}
              </Link>
              <Link
                href={`/${locale}/admin/create?editClient=${encodeURIComponent(String(params.client))}&editFilename=${encodeURIComponent(String(params.filename))}`}
                className="text-sm px-3 py-1 rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                Edit in Create
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                {program.client.name}
              </h1>
              <span
                className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                  program.program_info.block === 'prep'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {program.program_info.block}
              </span>
              <span
                className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                  program.meta.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : program.meta.status === 'completed'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {program.meta.status}
              </span>
            </div>
            {/* Compute ARE button — show when any lift is missing block_are */}
            {program.calculated && Object.keys(program.calculated).some(
              lift => !lift.startsWith('_') && (program.calculated as any)[lift]?._summary?.block_are == null
            ) && (
              <button
                onClick={enrichWithAre}
                disabled={enriching}
                className="px-3 py-1 text-sm rounded-md border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 disabled:opacity-50"
              >
                {enriching ? 'Computing...' : 'Compute ARE'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Program Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">{t('programInfo')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">{t('start')}</p>
              <p className="font-semibold text-gray-900">{program.program_info.start_date}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('end')}</p>
              <p className="font-semibold text-gray-900">{program.program_info.end_date}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('weeks')}</p>
              <p className="font-semibold text-gray-900">{program.program_info.weeks}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('skillLevel')}</p>
              <p className="font-semibold text-gray-900">{program.client.delta}</p>
            </div>
          </div>
        </div>

        {/* 1RM Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">1RM</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Squat</p>
              <p className="text-2xl font-bold text-gray-900">{program.client.one_rm.squat} kg</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bench Press</p>
              <p className="text-2xl font-bold text-gray-900">{program.client.one_rm.bench_press} kg</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Deadlift</p>
              <p className="text-2xl font-bold text-gray-900">{program.client.one_rm.deadlift} kg</p>
            </div>
          </div>
        </div>

        {/* Calculated Summary */}
        {program.calculated && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">{t('volumeTargets')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['squat', 'bench_press', 'deadlift'].map((lift) => {
                const liftName = lift === 'bench_press' ? 'Bench Press' : lift.charAt(0).toUpperCase() + lift.slice(1)
                const summary = program.calculated[lift]?._summary
                if (!summary) return null

                return (
                  <div key={lift} className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-semibold text-lg mb-2 text-gray-900">{liftName}</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-600">{t('totalNL')}:</span> <span className="font-semibold text-gray-900">{summary.total_nl}</span></p>
                      <p><span className="text-gray-600">{t('blockARI')}:</span> <span className="font-semibold text-gray-900">{summary.block_ari?.toFixed(1)}%</span></p>
                      {summary.block_are != null && (
                        <p><span className="text-gray-600">{t('blockARE')}:</span> <span className="font-semibold text-amber-800">{summary.block_are.toFixed(0)}%</span></p>
                      )}
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 mb-1">{t('zoneDistribution')}:</p>
                      <div className="space-y-1 text-xs">
                        {Object.entries(summary.zone_totals || {}).map(([zone, reps]: [string, any]) => (
                          <div key={zone} className="flex justify-between">
                            <span className="text-gray-600">{zone}%:</span>
                            <span className="font-medium text-gray-900">{reps} reps</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Vypočítané targety - Detail Tables */}
        {program.calculated && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">{t('calculatedTargets')}</h2>
            <div className="space-y-12">
              {['squat', 'bench_press', 'deadlift'].map((lift) => {
                const liftName = lift === 'bench_press' ? 'Bench Press' : lift.charAt(0).toUpperCase() + lift.slice(1)
                const liftData = program.calculated[lift]
                if (!liftData) return null

                const summary = liftData._summary
                const inputData = program.input[lift]

                return (
                  <div key={lift} className="space-y-6">
                    {/* Lift Header */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="text-xl font-semibold text-center text-blue-900">{liftName}</h3>
                    </div>

                    {/* Table 1: Intensity Zones by Week */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">Int.zone / Week</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">1</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">2</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">3</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">4</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2 font-medium text-gray-900">%1RM / NL</td>
                            {[1, 2, 3, 4].map(weekNum => {
                              const weekData = liftData[`week_${weekNum}`]
                              return (
                                <td key={weekNum} className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">
                                  {weekData?.total_reps || 0}
                                </td>
                              )
                            })}
                            <td className="border border-gray-300 px-4 py-2 text-center font-semibold text-blue-900">
                              {inputData?.volume || summary?.total_nl || 0}
                            </td>
                          </tr>
                          {['55', '65', '75', '85', '90', '95'].map(zone => {
                            const actualTotal = [1, 2, 3, 4].reduce((sum, weekNum) => {
                              const weekData = liftData[`week_${weekNum}`]
                              return sum + (weekData?.zones?.[zone] || 0)
                            }, 0)

                            return (
                              <tr key={zone} className={zone === '55' || zone === '90' || zone === '95' ? 'bg-gray-50' : ''}>
                                <td className="border border-gray-300 px-4 py-2 text-gray-900">
                                  {zone === '90' ? '92,50%' : `${zone}%`}
                                </td>
                                {[1, 2, 3, 4].map(weekNum => {
                                  const weekData = liftData[`week_${weekNum}`]
                                  const reps = weekData?.zones?.[zone] || 0
                                  return (
                                    <td key={weekNum} className={`border border-gray-300 px-2 py-2 text-center ${reps === 0 ? 'text-gray-400' : 'text-gray-900'}`}>
                                      {reps}
                                    </td>
                                  )
                                })}
                                <td className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-900">
                                  {actualTotal}
                                </td>
                              </tr>
                            )
                          })}
                          <tr className="bg-gray-100 font-semibold">
                            <td className="border border-gray-300 px-4 py-2 text-gray-900">ARI</td>
                            {[1, 2, 3, 4].map(weekNum => {
                              const weekData = liftData[`week_${weekNum}`]
                              return (
                                <td key={weekNum} className="border border-gray-300 px-4 py-2 text-center text-gray-900">
                                  {weekData?.ari?.toFixed(1) || 0}
                                </td>
                              )
                            })}
                            <td className="border border-gray-300 px-4 py-2 text-center text-blue-900 font-semibold">
                              {summary?.block_ari?.toFixed(1) || 0}
                            </td>
                          </tr>
                          {summary?.block_are != null && (
                            <tr className="bg-amber-50 font-semibold">
                              <td className="border border-gray-300 px-4 py-2 text-gray-900">ARE</td>
                              {[1, 2, 3, 4].map(weekNum => {
                                const weekData = liftData[`week_${weekNum}`]
                                return (
                                  <td key={weekNum} className="border border-gray-300 px-4 py-2 text-center text-gray-900">
                                    {weekData?.are != null ? `${weekData.are.toFixed(0)}%` : '–'}
                                  </td>
                                )
                              })}
                              <td className="border border-gray-300 px-4 py-2 text-center text-amber-800 font-semibold">
                                {summary.block_are.toFixed(0)}%
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Table 2: Session Distribution */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-green-100">
                            <th className="border border-gray-300 px-4 py-2 text-center text-gray-900">
                              {inputData?.sessions_per_week || 3}
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900" colSpan={4}>
                              days / week
                            </th>
                          </tr>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-4 py-2 text-center text-gray-900">
                              {inputData?.session_distribution || '-'}
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900" colSpan={4}>
                              distribution in a week
                            </th>
                          </tr>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-center text-gray-900">LMH</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">#reps</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">#reps</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">#reps</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">#reps</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Get session keys from first week to determine order */}
                          {(() => {
                            const firstWeek = liftData.week_1
                            if (!firstWeek?.sessions) return null
                            const sessionKeys = Object.keys(firstWeek.sessions).sort()

                            const hasSessionAre = sessionKeys.some(sk =>
                              [1, 2, 3, 4].some(w => liftData[`week_${w}`]?.sessions?.[sk]?.are != null)
                            )

                            return (
                              <>
                                {sessionKeys.map((sessionKey) => (
                                  <tr key={sessionKey}>
                                    <td className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">
                                      {sessionKey}
                                    </td>
                                    {[1, 2, 3, 4].map(weekNum => {
                                      const weekData = liftData[`week_${weekNum}`]
                                      const sessions = weekData?.sessions || {}
                                      const sessionData = sessions[sessionKey]
                                      const reps = sessionData?.total || 0
                                      const are = sessionData?.are
                                      return (
                                        <td key={weekNum} className="border border-gray-300 px-4 py-2 text-center text-gray-900">
                                          {reps}
                                          {are != null && (
                                            <span className="ml-1 text-xs text-amber-700">({are.toFixed(0)}%)</span>
                                          )}
                                        </td>
                                      )
                                    })}
                                  </tr>
                                ))}
                              </>
                            )
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Sessions — integrated with Training Log */}
        {program.sessions && Object.keys(program.sessions).length > 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Sessions</h2>
              {logStats && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                    ✓ {logStats.adherence}% ({logStats.completedSets}/{logStats.totalSets})
                  </span>
                  {logStats.avgRpe !== null && (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium ${
                      logStats.avgRpe <= 7.5 ? 'bg-green-100 text-green-800' :
                      logStats.avgRpe <= 8.5 ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      RPE {logStats.avgRpe.toFixed(1)}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-6">
              {Object.entries(program.sessions).map(([sessionLetter, sessionData]: [string, any]) => (
                <div key={sessionLetter} className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold text-lg mb-3">Session {sessionLetter}</h3>
                  <div className="space-y-4">
                    {Object.entries(sessionData)
                      .filter(([key]) => key.startsWith('week_'))
                      .map(([week, weekData]: [string, any]) => {
                        const weekNum = parseInt(week.replace('week_', ''))
                        return (
                        <div key={week} className="bg-gray-50 rounded p-4">
                          <h4 className="font-medium text-sm text-gray-700 mb-3">
                            {week.replace('_', ' ').toUpperCase()}
                          </h4>
                          {weekData.lifts?.map((liftData: any, idx: number) => (
                            <div key={idx} className="mb-3">
                              <p className="text-sm font-semibold text-gray-800 mb-2">
                                {liftData.lift === 'bench_press' ? 'Bench Press' : liftData.lift.charAt(0).toUpperCase() + liftData.lift.slice(1)}
                              </p>
                              <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                  <thead>
                                    <tr className="border-b">
                                      <th className="text-left py-1 px-2">Set</th>
                                      <th className="text-left py-1 px-2">Variant</th>
                                      <th className="text-right py-1 px-2">Weight</th>
                                      <th className="text-right py-1 px-2">Reps</th>
                                      {hasAnyLog && (
                                        <>
                                          <th className="text-right py-1 px-2 border-l-2 border-blue-300 bg-blue-50/50">Actual kg</th>
                                          <th className="text-right py-1 px-2 bg-blue-50/50">Reps</th>
                                          <th className="text-center py-1 px-2 bg-blue-50/50">RPE</th>
                                          <th className="text-center py-1 px-2 bg-blue-50/50">✓</th>
                                        </>
                                      )}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {liftData.sets?.map((set: any, setIdx: number) => {
                                      const logEntry = findLogEntry(weekNum, sessionLetter, liftData.lift, setIdx)
                                      const weightDiff = logEntry?.actualWeight != null && set.weight
                                        ? logEntry.actualWeight - set.weight : null
                                      return (
                                      <tr key={setIdx} className={`border-b ${logEntry?.completed ? 'bg-green-50/40' : ''}`}>
                                        <td className="py-1 px-2">{setIdx + 1}</td>
                                        <td className="py-1 px-2 text-gray-600">{set.variant}</td>
                                        <td className="text-right py-1 px-2 font-medium">{set.weight} kg</td>
                                        <td className="text-right py-1 px-2 font-medium">{set.reps}</td>
                                        {hasAnyLog && (
                                          <>
                                            <td className="text-right py-1 px-2 border-l-2 border-blue-300 font-medium">
                                              {logEntry?.actualWeight != null ? (
                                                <>
                                                  {logEntry.actualWeight}
                                                  {weightDiff != null && weightDiff !== 0 && (
                                                    <span className={`ml-1 text-xs ${weightDiff > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                      {weightDiff > 0 ? '+' : ''}{weightDiff}
                                                    </span>
                                                  )}
                                                </>
                                              ) : (
                                                <span className="text-gray-300">—</span>
                                              )}
                                            </td>
                                            <td className="text-right py-1 px-2 font-medium">
                                              {logEntry?.actualReps != null ? logEntry.actualReps : <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className={`text-center py-1 px-2 font-medium ${rpeColor(logEntry?.rpe ?? null)}`}>
                                              {logEntry?.rpe != null ? logEntry.rpe : <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="text-center py-1 px-2">
                                              {logEntry?.completed ? (
                                                <span className="text-green-600 font-bold">✓</span>
                                              ) : logEntry ? (
                                                <span className="text-gray-400">✗</span>
                                              ) : null}
                                            </td>
                                          </>
                                        )}
                                      </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              </div>
                              {/* Notes from log entries for this lift */}
                              {(() => {
                                const liftNotes = (groupedLog[weekNum]?.[sessionLetter]?.[liftData.lift] || [])
                                  .filter(e => e.notes)
                                if (liftNotes.length === 0) return null
                                return (
                                  <div className="mt-1 pl-2">
                                    {liftNotes.map(e => (
                                      <p key={e.id} className="text-xs text-blue-600 italic">
                                        Set {e.setIndex + 1}: {e.notes}
                                      </p>
                                    ))}
                                  </div>
                                )
                              })()}
                            </div>
                          ))}
                          {weekData.accessories && weekData.accessories.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs font-semibold text-gray-600 mb-2">Accessories:</p>
                              <ul className="text-sm space-y-1">
                                {weekData.accessories.map((acc: any, idx: number) => (
                                  <li key={idx} className="text-gray-700">
                                    {acc.name}: {acc.prescription}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        )
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-center">
              {t('noSessions')}
            </p>
          </div>
        )}

      </main>
    </div>
  )
}
