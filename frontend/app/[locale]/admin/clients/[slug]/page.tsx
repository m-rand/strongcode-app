'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'

interface OneRMEntry {
  date: string
  squat: number
  bench_press: number
  deadlift: number
  tested: boolean
  notes?: string
}

interface Survey {
  completed_at: string
  can_lift_1rm_anytime?: {
    squat?: boolean
    bench?: boolean
    deadlift?: boolean
  }
  reps_at_75_percent?: {
    squat?: number
    bench?: number
    deadlift?: number
  }
  reps_at_85_percent?: {
    squat?: number
    bench?: number
    deadlift?: number
  }
  reps_at_92_5_percent?: {
    squat?: number
    bench?: number
    deadlift?: number
  }
  minimum_weight_jump?: {
    squat?: number
    bench?: number
    deadlift?: number
  }
  external_stress_level?: number
  training_frequency_per_week?: {
    squat?: number
    bench?: number
    deadlift?: number
  }
  avg_lifts_70_percent_per_week?: {
    squat?: number
    bench?: number
    deadlift?: number
  }
  lifts_95_100_percent_per_month?: {
    squat?: number
    bench?: number
    deadlift?: number
  }
  improvement_last_2_months?: {
    squat?: number
    bench?: number
    deadlift?: number
  }
  improvement_last_year?: {
    squat?: number
    bench?: number
    deadlift?: number
  }
  training_sessions_per_week_lately?: number
  max_training_sessions_per_week?: number
  muscle_mass_importance?: string
}

interface Client {
  slug: string
  name: string
  email: string
  skill_level: string
  one_rm_history: OneRMEntry[]
  survey?: Survey
  preferences?: any
  notes?: string
  created_at: string
  _meta?: any
}

interface Program {
  filename: string
  block: string
  startDate: string
  weeks: number
  status: string
  hasSessions: boolean
}

export default function ClientDetailPage() {
  const params = useParams()
  const t = useTranslations('admin.clientDetail')
  const tClients = useTranslations('admin.clients')
  const locale = useLocale()
  const [client, setClient] = useState<Client | null>(null)
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchClient()
  }, [params.slug])

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clients/${params.slug}`)
      if (!response.ok) throw new Error('Failed to load client')

      const data = await response.json()
      setClient(data.client)
      setPrograms(data.programs || [])
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

  if (error || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || t('notFound')}</p>
          <Link
            href={`/${locale}/admin/clients`}
            className="text-blue-600 hover:text-blue-800"
          >
            {t('backToClients')}
          </Link>
        </div>
      </div>
    )
  }

  const latestOneRM = client.one_rm_history?.[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/${locale}/admin/clients`}
                className="text-blue-600 hover:text-blue-800"
              >
                {t('clients')}
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                {client.name}
              </h1>
              <span
                className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                  client.skill_level === 'elite'
                    ? 'bg-purple-100 text-purple-800'
                    : client.skill_level === 'advanced'
                    ? 'bg-blue-100 text-blue-800'
                    : client.skill_level === 'intermediate'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {tClients(`skillLevels.${client.skill_level}`)}
              </span>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/${locale}/admin/clients/${client.slug}/survey`}
                className="px-4 py-2 border border-purple-300 bg-purple-50 text-purple-700 rounded hover:bg-purple-100"
              >
                📋 {t('survey')}
              </Link>
              <Link
                href={`/${locale}/admin/clients/${client.slug}/edit`}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                {t('edit')}
              </Link>
              <Link
                href={`/${locale}/admin/create?client=${client.slug}`}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {t('newProgram')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">{t('basicInfo')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">{t('email')}</p>
              <p className="font-semibold text-gray-900">{client.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('skillLevel')}</p>
              <p className="font-semibold text-gray-900">{tClients(`skillLevels.${client.skill_level}`)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('created')}</p>
              <p className="font-semibold text-gray-900">
                {new Date(client.created_at).toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-US')}
              </p>
            </div>
          </div>
          {client.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600 mb-1">{t('notes')}</p>
              <p className="text-gray-900">{client.notes}</p>
            </div>
          )}
        </div>

        {/* Current 1RM */}
        {latestOneRM && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">{t('currentOneRM')}</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Squat</p>
                <p className="text-2xl font-bold text-gray-900">{latestOneRM.squat} kg</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bench Press</p>
                <p className="text-2xl font-bold text-gray-900">{latestOneRM.bench_press} kg</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Deadlift</p>
                <p className="text-2xl font-bold text-gray-900">{latestOneRM.deadlift} kg</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">
                {t('date')}: <span className="font-semibold text-gray-900">{latestOneRM.date}</span>
              </span>
              {latestOneRM.tested && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                  {t('tested')}
                </span>
              )}
              {latestOneRM.notes && (
                <span className="text-gray-600">{latestOneRM.notes}</span>
              )}
            </div>
          </div>
        )}

        {/* Survey Results */}
        {client.survey && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{t('surveyTitle')}</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {t('completed')}: {new Date(client.survey.completed_at).toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-US')}
                </span>
                <Link
                  href={`/${locale}/admin/clients/${client.slug}/survey`}
                  className="text-sm text-purple-600 hover:text-purple-800"
                >
                  {t('update')}
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Psyching Readiness */}
              {client.survey.can_lift_1rm_anytime && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">{t('psychingReadiness')}</h3>
                  <div className="space-y-1">
                    {client.survey.can_lift_1rm_anytime.squat !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded ${client.survey.can_lift_1rm_anytime.squat ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="text-sm text-gray-900">Squat</span>
                      </div>
                    )}
                    {client.survey.can_lift_1rm_anytime.bench !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded ${client.survey.can_lift_1rm_anytime.bench ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="text-sm text-gray-900">Bench</span>
                      </div>
                    )}
                    {client.survey.can_lift_1rm_anytime.deadlift !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded ${client.survey.can_lift_1rm_anytime.deadlift ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="text-sm text-gray-900">Deadlift</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* External Stress */}
              {client.survey.external_stress_level && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">{t('externalStress')}</h3>
                  <p className="text-2xl font-bold text-gray-900">{client.survey.external_stress_level}/5</p>
                </div>
              )}

              {/* Training Capacity */}
              {(client.survey.training_sessions_per_week_lately || client.survey.max_training_sessions_per_week) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">{t('trainingCapacity')}</h3>
                  <div className="space-y-1">
                    {client.survey.training_sessions_per_week_lately && (
                      <p className="text-sm text-gray-900">{t('currently')}: <span className="font-semibold">{client.survey.training_sessions_per_week_lately}{t('perWeek')}</span></p>
                    )}
                    {client.survey.max_training_sessions_per_week && (
                      <p className="text-sm text-gray-900">{t('maximum')}: <span className="font-semibold">{client.survey.max_training_sessions_per_week}{t('perWeek')}</span></p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Performance Tests Summary */}
            {(client.survey.reps_at_75_percent || client.survey.reps_at_85_percent || client.survey.reps_at_92_5_percent) && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('performanceTests')}</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('lift')}</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">@ 75%</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">@ 85%</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">@ 92.5%</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">Squat</td>
                        <td className="px-4 py-2 text-center text-sm text-gray-900">{client.survey.reps_at_75_percent?.squat || '-'}</td>
                        <td className="px-4 py-2 text-center text-sm text-gray-900">{client.survey.reps_at_85_percent?.squat || '-'}</td>
                        <td className="px-4 py-2 text-center text-sm text-gray-900">{client.survey.reps_at_92_5_percent?.squat || '-'}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">Bench</td>
                        <td className="px-4 py-2 text-center text-sm text-gray-900">{client.survey.reps_at_75_percent?.bench || '-'}</td>
                        <td className="px-4 py-2 text-center text-sm text-gray-900">{client.survey.reps_at_85_percent?.bench || '-'}</td>
                        <td className="px-4 py-2 text-center text-sm text-gray-900">{client.survey.reps_at_92_5_percent?.bench || '-'}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">Deadlift</td>
                        <td className="px-4 py-2 text-center text-sm text-gray-900">{client.survey.reps_at_75_percent?.deadlift || '-'}</td>
                        <td className="px-4 py-2 text-center text-sm text-gray-900">{client.survey.reps_at_85_percent?.deadlift || '-'}</td>
                        <td className="px-4 py-2 text-center text-sm text-gray-900">{client.survey.reps_at_92_5_percent?.deadlift || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Progress Summary */}
            {(client.survey.improvement_last_2_months || client.survey.improvement_last_year) && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('strengthProgress')}</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('lift')}</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">{t('twoMonths')}</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">{t('year')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">Squat</td>
                        <td className="px-4 py-2 text-center text-sm text-gray-900">{client.survey.improvement_last_2_months?.squat ? `+${client.survey.improvement_last_2_months.squat} kg` : '-'}</td>
                        <td className="px-4 py-2 text-center text-sm text-gray-900">{client.survey.improvement_last_year?.squat ? `+${client.survey.improvement_last_year.squat} kg` : '-'}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">Bench</td>
                        <td className="px-4 py-2 text-center text-sm text-gray-900">{client.survey.improvement_last_2_months?.bench ? `+${client.survey.improvement_last_2_months.bench} kg` : '-'}</td>
                        <td className="px-4 py-2 text-center text-sm text-gray-900">{client.survey.improvement_last_year?.bench ? `+${client.survey.improvement_last_year.bench} kg` : '-'}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">Deadlift</td>
                        <td className="px-4 py-2 text-center text-sm text-gray-900">{client.survey.improvement_last_2_months?.deadlift ? `+${client.survey.improvement_last_2_months.deadlift} kg` : '-'}</td>
                        <td className="px-4 py-2 text-center text-sm text-gray-900">{client.survey.improvement_last_year?.deadlift ? `+${client.survey.improvement_last_year.deadlift} kg` : '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 1RM History */}
        {client.one_rm_history && client.one_rm_history.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">{t('oneRMHistory')}</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('date')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Squat
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Bench Press
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Deadlift
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      {t('total')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('notes')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {client.one_rm_history.map((entry, idx) => (
                    <tr key={idx} className={idx === 0 ? 'bg-blue-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{entry.date}</span>
                          {entry.tested && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-semibold">
                              T
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                        {entry.squat} kg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                        {entry.bench_press} kg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                        {entry.deadlift} kg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-blue-900">
                        {entry.squat + entry.bench_press + entry.deadlift} kg
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {entry.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Programs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{t('programs')} ({programs.length})</h2>
            <Link
              href={`/${locale}/admin/create?client=${client.slug}`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              {t('createProgram')}
            </Link>
          </div>

          {programs.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              {t('noPrograms')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('program')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('block')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('start')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('weeks')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('status')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      {tClients('table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {programs.map((program, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {program.filename}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            program.block === 'prep'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {program.block}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {program.startDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {program.weeks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            program.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : program.status === 'completed'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {program.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/${locale}/admin/programs/${client.slug}/${encodeURIComponent(program.filename)}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {t('view')}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
