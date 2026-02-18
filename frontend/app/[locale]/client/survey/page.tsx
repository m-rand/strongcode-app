'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'

export default function ClientSurveyPage() {
  const t = useTranslations('client.survey')
  const tSurvey = useTranslations('survey')
  const locale = useLocale()
  const router = useRouter()
  const { data: session, status } = useSession()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    one_rm: { squat: '', bench: '', deadlift: '' },
    can_lift_1rm_anytime: { squat: false, bench: false, deadlift: false },
    reps_at_75_percent: { squat: '', bench: '', deadlift: '' },
    reps_at_85_percent: { squat: '', bench: '', deadlift: '' },
    reps_at_92_5_percent: { squat: '', bench: '', deadlift: '' },
    minimum_weight_jump: { squat: '', bench: '', deadlift: '' },
    external_stress_level: '',
    training_frequency_per_week: { squat: '', bench: '', deadlift: '' },
    training_sessions_per_week_lately: '',
    max_training_sessions_per_week: '',
    health_issues: '',
    notes: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/login`)
    }
  }, [status, router, locale])

  useEffect(() => {
    if (session?.user?.client_slug) {
      fetchExistingData()
    }
  }, [session?.user?.client_slug])

  const fetchExistingData = async () => {
    try {
      const response = await fetch(`/api/clients/${session?.user?.client_slug}`)
      if (!response.ok) throw new Error('Failed to load data')

      const data = await response.json()
      const client = data.client
      const survey = client.survey || {}
      const latestRM = client.one_rm_history?.[0]

      setFormData({
        one_rm: {
          squat: latestRM?.squat?.toString() || '',
          bench: latestRM?.bench_press?.toString() || '',
          deadlift: latestRM?.deadlift?.toString() || ''
        },
        can_lift_1rm_anytime: survey.can_lift_1rm_anytime || { squat: false, bench: false, deadlift: false },
        reps_at_75_percent: {
          squat: survey.reps_at_75_percent?.squat?.toString() || '',
          bench: survey.reps_at_75_percent?.bench?.toString() || '',
          deadlift: survey.reps_at_75_percent?.deadlift?.toString() || ''
        },
        reps_at_85_percent: {
          squat: survey.reps_at_85_percent?.squat?.toString() || '',
          bench: survey.reps_at_85_percent?.bench?.toString() || '',
          deadlift: survey.reps_at_85_percent?.deadlift?.toString() || ''
        },
        reps_at_92_5_percent: {
          squat: survey.reps_at_92_5_percent?.squat?.toString() || '',
          bench: survey.reps_at_92_5_percent?.bench?.toString() || '',
          deadlift: survey.reps_at_92_5_percent?.deadlift?.toString() || ''
        },
        minimum_weight_jump: {
          squat: survey.minimum_weight_jump?.squat?.toString() || '',
          bench: survey.minimum_weight_jump?.bench?.toString() || '',
          deadlift: survey.minimum_weight_jump?.deadlift?.toString() || ''
        },
        external_stress_level: survey.external_stress_level?.toString() || '',
        training_frequency_per_week: {
          squat: survey.training_frequency_per_week?.squat?.toString() || '',
          bench: survey.training_frequency_per_week?.bench?.toString() || '',
          deadlift: survey.training_frequency_per_week?.deadlift?.toString() || ''
        },
        training_sessions_per_week_lately: survey.training_sessions_per_week_lately?.toString() || '',
        max_training_sessions_per_week: survey.max_training_sessions_per_week?.toString() || '',
        health_issues: client.health_issues || '',
        notes: client.notes || ''
      })
    } catch (err) {
      console.error('Failed to load existing data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch(`/api/clients/${session?.user?.client_slug}/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          one_rm: {
            squat: parseFloat(formData.one_rm.squat) || undefined,
            bench: parseFloat(formData.one_rm.bench) || undefined,
            deadlift: parseFloat(formData.one_rm.deadlift) || undefined
          },
          can_lift_1rm_anytime: formData.can_lift_1rm_anytime,
          reps_at_75_percent: {
            squat: parseInt(formData.reps_at_75_percent.squat) || undefined,
            bench: parseInt(formData.reps_at_75_percent.bench) || undefined,
            deadlift: parseInt(formData.reps_at_75_percent.deadlift) || undefined
          },
          reps_at_85_percent: {
            squat: parseInt(formData.reps_at_85_percent.squat) || undefined,
            bench: parseInt(formData.reps_at_85_percent.bench) || undefined,
            deadlift: parseInt(formData.reps_at_85_percent.deadlift) || undefined
          },
          reps_at_92_5_percent: {
            squat: parseInt(formData.reps_at_92_5_percent.squat) || undefined,
            bench: parseInt(formData.reps_at_92_5_percent.bench) || undefined,
            deadlift: parseInt(formData.reps_at_92_5_percent.deadlift) || undefined
          },
          minimum_weight_jump: {
            squat: parseFloat(formData.minimum_weight_jump.squat) || undefined,
            bench: parseFloat(formData.minimum_weight_jump.bench) || undefined,
            deadlift: parseFloat(formData.minimum_weight_jump.deadlift) || undefined
          },
          external_stress_level: parseInt(formData.external_stress_level) || undefined,
          training_frequency_per_week: {
            squat: parseInt(formData.training_frequency_per_week.squat) || undefined,
            bench: parseInt(formData.training_frequency_per_week.bench) || undefined,
            deadlift: parseInt(formData.training_frequency_per_week.deadlift) || undefined
          },
          training_sessions_per_week_lately: parseInt(formData.training_sessions_per_week_lately) || undefined,
          max_training_sessions_per_week: parseInt(formData.max_training_sessions_per_week) || undefined,
          health_issues: formData.health_issues || undefined,
          other_comments: formData.notes || undefined
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save survey')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/${locale}/client/dashboard`)
      }, 2000)
    } catch (err: any) {
      setError(err.message || t('error'))
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">{t('loading') || 'Loading...'}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/client/dashboard`} className="text-blue-600 hover:text-blue-800">
              ← {t('backToDashboard') || 'Back'}
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800">{t('success')}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Current 1RM */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">{tSurvey('sections.oneRM.title')}</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Squat (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.one_rm.squat}
                  onChange={e => setFormData({...formData, one_rm: {...formData.one_rm, squat: e.target.value}})}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bench (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.one_rm.bench}
                  onChange={e => setFormData({...formData, one_rm: {...formData.one_rm, bench: e.target.value}})}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadlift (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.one_rm.deadlift}
                  onChange={e => setFormData({...formData, one_rm: {...formData.one_rm, deadlift: e.target.value}})}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Psyching Readiness */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-2">{tSurvey('sections.psyching.title')}</h2>
            <p className="text-sm text-gray-600 mb-4">{tSurvey('sections.psyching.subtitle')}</p>
            <div className="flex gap-6">
              {['squat', 'bench', 'deadlift'].map(lift => (
                <label key={lift} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.can_lift_1rm_anytime[lift as keyof typeof formData.can_lift_1rm_anytime]}
                    onChange={e => setFormData({
                      ...formData,
                      can_lift_1rm_anytime: {...formData.can_lift_1rm_anytime, [lift]: e.target.checked}
                    })}
                    className="w-5 h-5"
                  />
                  <span className="capitalize">{lift === 'bench' ? 'Bench Press' : lift.charAt(0).toUpperCase() + lift.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Performance Tests */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">{tSurvey('sections.performance.title')}</h2>

            {[
              { key: 'reps_at_75_percent', label: tSurvey('sections.performance.repsAt75') },
              { key: 'reps_at_85_percent', label: tSurvey('sections.performance.repsAt85') },
              { key: 'reps_at_92_5_percent', label: tSurvey('sections.performance.repsAt925') }
            ].map(({ key, label }) => (
              <div key={key} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                <div className="grid grid-cols-3 gap-4">
                  {['squat', 'bench', 'deadlift'].map(lift => (
                    <input
                      key={lift}
                      type="number"
                      placeholder={lift.charAt(0).toUpperCase() + lift.slice(1)}
                      value={(formData[key as keyof typeof formData] as Record<string, string>)[lift]}
                      onChange={e => setFormData({
                        ...formData,
                        [key]: {...(formData[key as keyof typeof formData] as Record<string, string>), [lift]: e.target.value}
                      })}
                      className="px-3 py-2 border rounded-md"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Training Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">{tSurvey('sections.stress.title')}</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.stress.level')}</label>
              <select
                value={formData.external_stress_level}
                onChange={e => setFormData({...formData, external_stress_level: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">{tSurvey('sections.stress.options.select')}</option>
                {[1,2,3,4,5].map(n => (
                  <option key={n} value={n}>{tSurvey(`sections.stress.options.${n}`)}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.capacity.sessionsLately')}</label>
                <input
                  type="number"
                  value={formData.training_sessions_per_week_lately}
                  onChange={e => setFormData({...formData, training_sessions_per_week_lately: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.capacity.maxSessions')}</label>
                <input
                  type="number"
                  value={formData.max_training_sessions_per_week}
                  onChange={e => setFormData({...formData, max_training_sessions_per_week: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">{tSurvey('sections.personal.healthIssues')}</h2>
            <textarea
              value={formData.health_issues}
              onChange={e => setFormData({...formData, health_issues: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border rounded-md"
              placeholder={tSurvey('sections.personal.healthIssuesPlaceholder')}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link
              href={`/${locale}/client/dashboard`}
              className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? t('submitting') : t('submit')}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
