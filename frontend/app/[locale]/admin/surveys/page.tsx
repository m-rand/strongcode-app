'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'

interface Survey {
  slug: string
  name: string
  email: string
  skill_level: string
  latest_one_rm: {
    squat: number
    bench_press: number
    deadlift: number
    date: string
  } | null
  survey: any
  created_at: string
  nationality?: string
  gender?: string
  height?: number
  weight?: number
}

export default function PendingSurveysPage() {
  const t = useTranslations('admin.surveys')
  const tClients = useTranslations('admin.clients')
  const locale = useLocale()
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [approving, setApproving] = useState<string | null>(null)
  const [expandedSurvey, setExpandedSurvey] = useState<string | null>(null)

  useEffect(() => {
    fetchSurveys()
  }, [])

  const fetchSurveys = async () => {
    try {
      const response = await fetch('/api/surveys/pending')
      if (!response.ok) throw new Error('Failed to load surveys')

      const data = await response.json()
      setSurveys(data.surveys || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (slug: string) => {
    setApproving(slug)
    try {
      const response = await fetch(`/api/clients/${slug}/approve`, {
        method: 'POST'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to approve')
      }

      // Remove from list
      setSurveys(surveys.filter(s => s.slug !== slug))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setApproving(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{t('loading')}</p>
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
              <Link href={`/${locale}/admin/dashboard`} className="text-blue-600 hover:text-blue-800">
                ← {t('backToDashboard')}
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
              {surveys.length > 0 && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                  {surveys.length} {t('pending')}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {surveys.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noSurveys')}</h3>
            <p className="text-gray-600">{t('noSurveysDescription')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {surveys.map((survey) => (
              <div key={survey.slug} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Survey Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{survey.name}</h3>
                      <p className="text-sm text-gray-600">{survey.email}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          survey.skill_level === 'elite' ? 'bg-purple-100 text-purple-800' :
                          survey.skill_level === 'advanced' ? 'bg-blue-100 text-blue-800' :
                          survey.skill_level === 'intermediate' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {tClients(`skillLevels.${survey.skill_level}`)}
                        </span>
                        <span className="text-gray-500">
                          {new Date(survey.created_at).toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-US')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setExpandedSurvey(expandedSurvey === survey.slug ? null : survey.slug)}
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                      >
                        {expandedSurvey === survey.slug ? t('hideDetails') : t('showDetails')}
                      </button>
                      <button
                        onClick={() => handleApprove(survey.slug)}
                        disabled={approving === survey.slug}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
                      >
                        {approving === survey.slug ? t('approving') : t('approve')}
                      </button>
                    </div>
                  </div>

                  {/* 1RM Summary */}
                  {survey.latest_one_rm && (
                    <div className="mt-4 flex gap-6 text-sm">
                      <div>
                        <span className="text-gray-500">Squat:</span>{' '}
                        <span className="font-semibold">{survey.latest_one_rm.squat} kg</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Bench:</span>{' '}
                        <span className="font-semibold">{survey.latest_one_rm.bench_press} kg</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Deadlift:</span>{' '}
                        <span className="font-semibold">{survey.latest_one_rm.deadlift} kg</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Total:</span>{' '}
                        <span className="font-bold text-blue-600">
                          {survey.latest_one_rm.squat + survey.latest_one_rm.bench_press + survey.latest_one_rm.deadlift} kg
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                {expandedSurvey === survey.slug && (
                  <div className="border-t bg-gray-50 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Personal Info */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">{t('personalInfo')}</h4>
                        <dl className="text-sm space-y-1">
                          {survey.nationality && (
                            <div><dt className="inline text-gray-500">{t('nationality')}:</dt> <dd className="inline">{survey.nationality}</dd></div>
                          )}
                          {survey.gender && (
                            <div><dt className="inline text-gray-500">{t('gender')}:</dt> <dd className="inline">{survey.gender}</dd></div>
                          )}
                          {survey.height && (
                            <div><dt className="inline text-gray-500">{t('height')}:</dt> <dd className="inline">{survey.height} cm</dd></div>
                          )}
                          {survey.weight && (
                            <div><dt className="inline text-gray-500">{t('weight')}:</dt> <dd className="inline">{survey.weight} kg</dd></div>
                          )}
                        </dl>
                      </div>

                      {/* Survey Data - Performance */}
                      {survey.survey && (
                        <>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">{t('performanceTests')}</h4>
                            <dl className="text-sm space-y-1">
                              {survey.survey.reps_at_75_percent && (
                                <div>
                                  <dt className="text-gray-500">@ 75%:</dt>
                                  <dd>S: {survey.survey.reps_at_75_percent.squat || '-'}, B: {survey.survey.reps_at_75_percent.bench || '-'}, D: {survey.survey.reps_at_75_percent.deadlift || '-'}</dd>
                                </div>
                              )}
                              {survey.survey.reps_at_85_percent && (
                                <div>
                                  <dt className="text-gray-500">@ 85%:</dt>
                                  <dd>S: {survey.survey.reps_at_85_percent.squat || '-'}, B: {survey.survey.reps_at_85_percent.bench || '-'}, D: {survey.survey.reps_at_85_percent.deadlift || '-'}</dd>
                                </div>
                              )}
                              {survey.survey.reps_at_92_5_percent && (
                                <div>
                                  <dt className="text-gray-500">@ 92.5%:</dt>
                                  <dd>S: {survey.survey.reps_at_92_5_percent.squat || '-'}, B: {survey.survey.reps_at_92_5_percent.bench || '-'}, D: {survey.survey.reps_at_92_5_percent.deadlift || '-'}</dd>
                                </div>
                              )}
                            </dl>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">{t('trainingInfo')}</h4>
                            <dl className="text-sm space-y-1">
                              {survey.survey.external_stress_level && (
                                <div><dt className="inline text-gray-500">{t('stressLevel')}:</dt> <dd className="inline">{survey.survey.external_stress_level}/5</dd></div>
                              )}
                              {survey.survey.training_sessions_per_week_lately && (
                                <div><dt className="inline text-gray-500">{t('sessionsPerWeek')}:</dt> <dd className="inline">{survey.survey.training_sessions_per_week_lately}</dd></div>
                              )}
                              {survey.survey.max_training_sessions_per_week && (
                                <div><dt className="inline text-gray-500">{t('maxSessions')}:</dt> <dd className="inline">{survey.survey.max_training_sessions_per_week}</dd></div>
                              )}
                            </dl>
                          </div>
                        </>
                      )}
                    </div>

                    {/* View Full Profile Link */}
                    <div className="mt-4 pt-4 border-t">
                      <Link
                        href={`/${locale}/admin/clients/${survey.slug}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {t('viewFullProfile')} →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
