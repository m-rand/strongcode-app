'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'

interface Program {
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

export default function ProgramDetailPage() {
  const params = useParams()
  const t = useTranslations('admin.programDetail')
  const locale = useLocale()
  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProgram()
  }, [params.client, params.filename])

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

                            return sessionKeys.map((sessionKey, sessionIdx) => (
                              <tr key={sessionKey}>
                                <td className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">
                                  {sessionKey}
                                </td>
                                {[1, 2, 3, 4].map(weekNum => {
                                  const weekData = liftData[`week_${weekNum}`]
                                  const sessions = weekData?.sessions || {}
                                  const sessionData = sessions[sessionKey]
                                  const reps = sessionData?.total || 0
                                  return (
                                    <td key={weekNum} className="border border-gray-300 px-4 py-2 text-center text-gray-900">
                                      {reps}
                                    </td>
                                  )
                                })}
                              </tr>
                            ))
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

        {/* Sessions */}
        {program.sessions && Object.keys(program.sessions).length > 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Sessions</h2>
            <div className="space-y-6">
              {Object.entries(program.sessions).map(([sessionLetter, sessionData]: [string, any]) => (
                <div key={sessionLetter} className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold text-lg mb-3">Session {sessionLetter}</h3>
                  <div className="space-y-4">
                    {Object.entries(sessionData)
                      .filter(([key]) => key.startsWith('week_'))
                      .map(([week, weekData]: [string, any]) => (
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
                                      <th className="text-right py-1 px-2">RPE</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {liftData.sets?.map((set: any, setIdx: number) => (
                                      <tr key={setIdx} className="border-b">
                                        <td className="py-1 px-2">{setIdx + 1}</td>
                                        <td className="py-1 px-2 text-gray-600">{set.variant}</td>
                                        <td className="text-right py-1 px-2 font-medium">{set.weight} kg</td>
                                        <td className="text-right py-1 px-2 font-medium">{set.reps}</td>
                                        <td className="text-right py-1 px-2">{set.rpe}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
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
                      ))}
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
