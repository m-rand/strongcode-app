'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

interface Client {
  slug: string
  name: string
  email: string
  skill_level: string
}

export default function ClientSurveyPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const tSurvey = useTranslations('survey')
  const tCommon = useTranslations('common')
  const tForm = useTranslations('admin.clientSurveyForm')
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    // Personal info
    name: '',
    nationality: '',
    gender: '',
    date_of_birth: '',
    height: '',
    weight: '',
    health_issues: '',
    other_comments: '',

    // 1RM values
    one_rm: {
      squat: '',
      bench: '',
      deadlift: ''
    },

    // Psyching readiness
    can_lift_1rm_anytime: {
      squat: false,
      bench: false,
      deadlift: false
    },

    // Reps at percentages
    reps_at_75_percent: {
      squat: '',
      bench: '',
      deadlift: ''
    },
    reps_at_85_percent: {
      squat: '',
      bench: '',
      deadlift: ''
    },
    reps_at_92_5_percent: {
      squat: '',
      bench: '',
      deadlift: ''
    },

    // Equipment
    minimum_weight_jump: {
      squat: '',
      bench: '',
      deadlift: ''
    },

    // Stress
    external_stress_level: '',

    // Frequency
    training_frequency_per_week: {
      squat: '',
      bench: '',
      deadlift: ''
    },

    // Volume
    avg_lifts_70_percent_per_week: {
      squat: '',
      bench: '',
      deadlift: ''
    },
    lifts_95_100_percent_per_month: {
      squat: '',
      bench: '',
      deadlift: ''
    },

    // Progress
    improvement_last_2_months: {
      squat: '',
      bench: '',
      deadlift: ''
    },
    improvement_last_year: {
      squat: '',
      bench: '',
      deadlift: ''
    },

    // Capacity
    training_sessions_per_week_lately: '',
    max_training_sessions_per_week: '',
    muscle_mass_importance: ''
  })

  useEffect(() => {
    fetchClient()
  }, [params.slug])

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clients/${params.slug}`)
      if (!response.ok) throw new Error(tForm('errors.loadClient'))

      const data = await response.json()
      setClient(data.client)

      // Pre-fill form with existing data
      setFormData(prev => ({
        ...prev,
        name: data.client.name || '',
        nationality: data.client.nationality || '',
        gender: data.client.gender || '',
        date_of_birth: data.client.date_of_birth || '',
        height: data.client.height?.toString() || '',
        weight: data.client.weight?.toString() || '',
        health_issues: data.client.health_issues || '',
        other_comments: data.client.notes || '',

        // Pre-fill from latest 1RM if exists
        one_rm: data.client.one_rm_history?.[0] ? {
          squat: data.client.one_rm_history[0].squat?.toString() || '',
          bench: data.client.one_rm_history[0].bench_press?.toString() || '',
          deadlift: data.client.one_rm_history[0].deadlift?.toString() || ''
        } : prev.one_rm,

        // Pre-fill from existing survey if exists
        can_lift_1rm_anytime: data.client.survey?.can_lift_1rm_anytime || prev.can_lift_1rm_anytime,
        reps_at_75_percent: data.client.survey?.reps_at_75_percent || prev.reps_at_75_percent,
        reps_at_85_percent: data.client.survey?.reps_at_85_percent || prev.reps_at_85_percent,
        reps_at_92_5_percent: data.client.survey?.reps_at_92_5_percent || prev.reps_at_92_5_percent,
        minimum_weight_jump: data.client.survey?.minimum_weight_jump || prev.minimum_weight_jump,
        external_stress_level: data.client.survey?.external_stress_level?.toString() || '',
        training_frequency_per_week: data.client.survey?.training_frequency_per_week || prev.training_frequency_per_week,
        avg_lifts_70_percent_per_week: data.client.survey?.avg_lifts_70_percent_per_week || prev.avg_lifts_70_percent_per_week,
        lifts_95_100_percent_per_month: data.client.survey?.lifts_95_100_percent_per_month || prev.lifts_95_100_percent_per_month,
        improvement_last_2_months: data.client.survey?.improvement_last_2_months || prev.improvement_last_2_months,
        improvement_last_year: data.client.survey?.improvement_last_year || prev.improvement_last_year,
        training_sessions_per_week_lately: data.client.survey?.training_sessions_per_week_lately?.toString() || '',
        max_training_sessions_per_week: data.client.survey?.max_training_sessions_per_week?.toString() || '',
        muscle_mass_importance: data.client.survey?.muscle_mass_importance || ''
      }))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tForm('errors.loadClient'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      // Convert strings to numbers where needed
      const payload = {
        ...formData,
        height: formData.height ? parseFloat(formData.height) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        one_rm: {
          squat: formData.one_rm.squat ? parseFloat(formData.one_rm.squat) : undefined,
          bench: formData.one_rm.bench ? parseFloat(formData.one_rm.bench) : undefined,
          deadlift: formData.one_rm.deadlift ? parseFloat(formData.one_rm.deadlift) : undefined
        },
        reps_at_75_percent: {
          squat: formData.reps_at_75_percent.squat ? parseInt(formData.reps_at_75_percent.squat) : undefined,
          bench: formData.reps_at_75_percent.bench ? parseInt(formData.reps_at_75_percent.bench) : undefined,
          deadlift: formData.reps_at_75_percent.deadlift ? parseInt(formData.reps_at_75_percent.deadlift) : undefined
        },
        reps_at_85_percent: {
          squat: formData.reps_at_85_percent.squat ? parseInt(formData.reps_at_85_percent.squat) : undefined,
          bench: formData.reps_at_85_percent.bench ? parseInt(formData.reps_at_85_percent.bench) : undefined,
          deadlift: formData.reps_at_85_percent.deadlift ? parseInt(formData.reps_at_85_percent.deadlift) : undefined
        },
        reps_at_92_5_percent: {
          squat: formData.reps_at_92_5_percent.squat ? parseInt(formData.reps_at_92_5_percent.squat) : undefined,
          bench: formData.reps_at_92_5_percent.bench ? parseInt(formData.reps_at_92_5_percent.bench) : undefined,
          deadlift: formData.reps_at_92_5_percent.deadlift ? parseInt(formData.reps_at_92_5_percent.deadlift) : undefined
        },
        minimum_weight_jump: {
          squat: formData.minimum_weight_jump.squat ? parseFloat(formData.minimum_weight_jump.squat) : undefined,
          bench: formData.minimum_weight_jump.bench ? parseFloat(formData.minimum_weight_jump.bench) : undefined,
          deadlift: formData.minimum_weight_jump.deadlift ? parseFloat(formData.minimum_weight_jump.deadlift) : undefined
        },
        external_stress_level: formData.external_stress_level ? parseInt(formData.external_stress_level) : undefined,
        training_frequency_per_week: {
          squat: formData.training_frequency_per_week.squat ? parseInt(formData.training_frequency_per_week.squat) : undefined,
          bench: formData.training_frequency_per_week.bench ? parseInt(formData.training_frequency_per_week.bench) : undefined,
          deadlift: formData.training_frequency_per_week.deadlift ? parseInt(formData.training_frequency_per_week.deadlift) : undefined
        },
        avg_lifts_70_percent_per_week: {
          squat: formData.avg_lifts_70_percent_per_week.squat ? parseInt(formData.avg_lifts_70_percent_per_week.squat) : undefined,
          bench: formData.avg_lifts_70_percent_per_week.bench ? parseInt(formData.avg_lifts_70_percent_per_week.bench) : undefined,
          deadlift: formData.avg_lifts_70_percent_per_week.deadlift ? parseInt(formData.avg_lifts_70_percent_per_week.deadlift) : undefined
        },
        lifts_95_100_percent_per_month: {
          squat: formData.lifts_95_100_percent_per_month.squat ? parseInt(formData.lifts_95_100_percent_per_month.squat) : undefined,
          bench: formData.lifts_95_100_percent_per_month.bench ? parseInt(formData.lifts_95_100_percent_per_month.bench) : undefined,
          deadlift: formData.lifts_95_100_percent_per_month.deadlift ? parseInt(formData.lifts_95_100_percent_per_month.deadlift) : undefined
        },
        improvement_last_2_months: {
          squat: formData.improvement_last_2_months.squat ? parseFloat(formData.improvement_last_2_months.squat) : undefined,
          bench: formData.improvement_last_2_months.bench ? parseFloat(formData.improvement_last_2_months.bench) : undefined,
          deadlift: formData.improvement_last_2_months.deadlift ? parseFloat(formData.improvement_last_2_months.deadlift) : undefined
        },
        improvement_last_year: {
          squat: formData.improvement_last_year.squat ? parseFloat(formData.improvement_last_year.squat) : undefined,
          bench: formData.improvement_last_year.bench ? parseFloat(formData.improvement_last_year.bench) : undefined,
          deadlift: formData.improvement_last_year.deadlift ? parseFloat(formData.improvement_last_year.deadlift) : undefined
        },
        training_sessions_per_week_lately: formData.training_sessions_per_week_lately ? parseInt(formData.training_sessions_per_week_lately) : undefined,
        max_training_sessions_per_week: formData.max_training_sessions_per_week ? parseInt(formData.max_training_sessions_per_week) : undefined
      }

      const response = await fetch(`/api/clients/${params.slug}/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || tForm('errors.saveSurvey'))
      }

      // Redirect back to client detail page
      router.push(`/${locale}/admin/clients/${params.slug}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tForm('errors.saveSurvey'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{tCommon('loading')}</p>
      </div>
    )
  }

  if (error && !client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href={`/${locale}/admin/clients`}
            className="text-blue-600 hover:text-blue-800"
          >
            ← {tForm('backToClients')}
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
          <div className="flex items-center gap-4">
            <Link
              href={`/${locale}/admin/clients/${client?.slug}`}
              className="text-blue-600 hover:text-blue-800"
            >
              ← {client?.name}
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {tForm('title')}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">{tSurvey('sections.personal.title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tSurvey('sections.personal.name')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tSurvey('sections.personal.nationality')}
                </label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tSurvey('sections.personal.gender')}
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">{tSurvey('sections.personal.genderOptions.select')}</option>
                  <option value="male">{tSurvey('sections.personal.genderOptions.male')}</option>
                  <option value="female">{tSurvey('sections.personal.genderOptions.female')}</option>
                  <option value="other">{tSurvey('sections.personal.genderOptions.other')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tSurvey('sections.personal.dateOfBirth')}
                </label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tSurvey('sections.personal.height')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.height}
                  onChange={(e) => setFormData({...formData, height: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tSurvey('sections.personal.weight')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tSurvey('sections.personal.healthIssues')}
                </label>
                <textarea
                  value={formData.health_issues}
                  onChange={(e) => setFormData({...formData, health_issues: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder={tSurvey('sections.personal.healthIssuesPlaceholder')}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tSurvey('sections.personal.otherComments')}
                </label>
                <textarea
                  value={formData.other_comments}
                  onChange={(e) => setFormData({...formData, other_comments: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder={tSurvey('sections.personal.otherCommentsPlaceholder')}
                />
              </div>
            </div>
          </div>

          {/* 1RM Data */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">{tSurvey('sections.oneRM.title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tSurvey('sections.oneRM.squat')}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.one_rm.squat}
                  onChange={(e) => setFormData({...formData, one_rm: {...formData.one_rm, squat: e.target.value}})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tSurvey('sections.oneRM.bench')}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.one_rm.bench}
                  onChange={(e) => setFormData({...formData, one_rm: {...formData.one_rm, bench: e.target.value}})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tSurvey('sections.oneRM.deadlift')}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.one_rm.deadlift}
                  onChange={(e) => setFormData({...formData, one_rm: {...formData.one_rm, deadlift: e.target.value}})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Psyching Readiness */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">{tSurvey('sections.psyching.title')}</h2>
            <p className="text-sm text-gray-600 mb-4">{tSurvey('sections.psyching.subtitle')}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.can_lift_1rm_anytime.squat}
                  onChange={(e) => setFormData({...formData, can_lift_1rm_anytime: {...formData.can_lift_1rm_anytime, squat: e.target.checked}})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm font-medium text-gray-900">
                  {tSurvey('sections.psyching.squat')}
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.can_lift_1rm_anytime.bench}
                  onChange={(e) => setFormData({...formData, can_lift_1rm_anytime: {...formData.can_lift_1rm_anytime, bench: e.target.checked}})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm font-medium text-gray-900">
                  {tSurvey('sections.psyching.bench')}
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.can_lift_1rm_anytime.deadlift}
                  onChange={(e) => setFormData({...formData, can_lift_1rm_anytime: {...formData.can_lift_1rm_anytime, deadlift: e.target.checked}})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm font-medium text-gray-900">
                  {tSurvey('sections.psyching.deadlift')}
                </label>
              </div>
            </div>
          </div>

          {/* Performance Tests */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">{tSurvey('sections.performance.title')}</h2>

            {/* 75% */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-gray-900">{tSurvey('sections.performance.repsAt75')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.performance.squat')}</label>
                  <input
                    type="number"
                    value={formData.reps_at_75_percent.squat}
                    onChange={(e) => setFormData({...formData, reps_at_75_percent: {...formData.reps_at_75_percent, squat: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.performance.bench')}</label>
                  <input
                    type="number"
                    value={formData.reps_at_75_percent.bench}
                    onChange={(e) => setFormData({...formData, reps_at_75_percent: {...formData.reps_at_75_percent, bench: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.performance.deadlift')}</label>
                  <input
                    type="number"
                    value={formData.reps_at_75_percent.deadlift}
                    onChange={(e) => setFormData({...formData, reps_at_75_percent: {...formData.reps_at_75_percent, deadlift: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* 85% */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-gray-900">{tSurvey('sections.performance.repsAt85')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.performance.squat')}</label>
                  <input
                    type="number"
                    value={formData.reps_at_85_percent.squat}
                    onChange={(e) => setFormData({...formData, reps_at_85_percent: {...formData.reps_at_85_percent, squat: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.performance.bench')}</label>
                  <input
                    type="number"
                    value={formData.reps_at_85_percent.bench}
                    onChange={(e) => setFormData({...formData, reps_at_85_percent: {...formData.reps_at_85_percent, bench: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.performance.deadlift')}</label>
                  <input
                    type="number"
                    value={formData.reps_at_85_percent.deadlift}
                    onChange={(e) => setFormData({...formData, reps_at_85_percent: {...formData.reps_at_85_percent, deadlift: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* 92.5% */}
            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-900">{tSurvey('sections.performance.repsAt925')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.performance.squat')}</label>
                  <input
                    type="number"
                    value={formData.reps_at_92_5_percent.squat}
                    onChange={(e) => setFormData({...formData, reps_at_92_5_percent: {...formData.reps_at_92_5_percent, squat: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.performance.bench')}</label>
                  <input
                    type="number"
                    value={formData.reps_at_92_5_percent.bench}
                    onChange={(e) => setFormData({...formData, reps_at_92_5_percent: {...formData.reps_at_92_5_percent, bench: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.performance.deadlift')}</label>
                  <input
                    type="number"
                    value={formData.reps_at_92_5_percent.deadlift}
                    onChange={(e) => setFormData({...formData, reps_at_92_5_percent: {...formData.reps_at_92_5_percent, deadlift: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Equipment */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">{tSurvey('sections.equipment.title')}</h2>
            <p className="text-sm text-gray-600 mb-4">{tSurvey('sections.equipment.subtitle')}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.equipment.squat')}</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.minimum_weight_jump.squat}
                  onChange={(e) => setFormData({...formData, minimum_weight_jump: {...formData.minimum_weight_jump, squat: e.target.value}})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.equipment.bench')}</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.minimum_weight_jump.bench}
                  onChange={(e) => setFormData({...formData, minimum_weight_jump: {...formData.minimum_weight_jump, bench: e.target.value}})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.equipment.deadlift')}</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.minimum_weight_jump.deadlift}
                  onChange={(e) => setFormData({...formData, minimum_weight_jump: {...formData.minimum_weight_jump, deadlift: e.target.value}})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="2.5"
                />
              </div>
            </div>
          </div>

          {/* Stress Level */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">{tSurvey('sections.stress.title')}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tSurvey('sections.stress.level')}
              </label>
              <select
                value={formData.external_stress_level}
                onChange={(e) => setFormData({...formData, external_stress_level: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="">{tSurvey('sections.stress.options.select')}</option>
                <option value="1">{tSurvey('sections.stress.options.1')}</option>
                <option value="2">{tSurvey('sections.stress.options.2')}</option>
                <option value="3">{tSurvey('sections.stress.options.3')}</option>
                <option value="4">{tSurvey('sections.stress.options.4')}</option>
                <option value="5">{tSurvey('sections.stress.options.5')}</option>
              </select>
            </div>
          </div>

          {/* Training Frequency */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">{tSurvey('sections.frequency.title')}</h2>
            <p className="text-sm text-gray-600 mb-4">{tSurvey('sections.frequency.subtitle')}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.frequency.squat')}</label>
                <input
                  type="number"
                  value={formData.training_frequency_per_week.squat}
                  onChange={(e) => setFormData({...formData, training_frequency_per_week: {...formData.training_frequency_per_week, squat: e.target.value}})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.frequency.bench')}</label>
                <input
                  type="number"
                  value={formData.training_frequency_per_week.bench}
                  onChange={(e) => setFormData({...formData, training_frequency_per_week: {...formData.training_frequency_per_week, bench: e.target.value}})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.frequency.deadlift')}</label>
                <input
                  type="number"
                  value={formData.training_frequency_per_week.deadlift}
                  onChange={(e) => setFormData({...formData, training_frequency_per_week: {...formData.training_frequency_per_week, deadlift: e.target.value}})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Volume Metrics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">{tSurvey('sections.volume.title')}</h2>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-gray-900">{tSurvey('sections.volume.avgLifts70')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.volume.squat')}</label>
                  <input
                    type="number"
                    value={formData.avg_lifts_70_percent_per_week.squat}
                    onChange={(e) => setFormData({...formData, avg_lifts_70_percent_per_week: {...formData.avg_lifts_70_percent_per_week, squat: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.volume.bench')}</label>
                  <input
                    type="number"
                    value={formData.avg_lifts_70_percent_per_week.bench}
                    onChange={(e) => setFormData({...formData, avg_lifts_70_percent_per_week: {...formData.avg_lifts_70_percent_per_week, bench: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.volume.deadlift')}</label>
                  <input
                    type="number"
                    value={formData.avg_lifts_70_percent_per_week.deadlift}
                    onChange={(e) => setFormData({...formData, avg_lifts_70_percent_per_week: {...formData.avg_lifts_70_percent_per_week, deadlift: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-900">{tSurvey('sections.volume.lifts95100')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.volume.squat')}</label>
                  <input
                    type="number"
                    value={formData.lifts_95_100_percent_per_month.squat}
                    onChange={(e) => setFormData({...formData, lifts_95_100_percent_per_month: {...formData.lifts_95_100_percent_per_month, squat: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.volume.bench')}</label>
                  <input
                    type="number"
                    value={formData.lifts_95_100_percent_per_month.bench}
                    onChange={(e) => setFormData({...formData, lifts_95_100_percent_per_month: {...formData.lifts_95_100_percent_per_month, bench: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.volume.deadlift')}</label>
                  <input
                    type="number"
                    value={formData.lifts_95_100_percent_per_month.deadlift}
                    onChange={(e) => setFormData({...formData, lifts_95_100_percent_per_month: {...formData.lifts_95_100_percent_per_month, deadlift: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Progress Tracking */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">{tSurvey('sections.progress.title')}</h2>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-gray-900">{tSurvey('sections.progress.improvement2Months')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.progress.squat')}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.improvement_last_2_months.squat}
                    onChange={(e) => setFormData({...formData, improvement_last_2_months: {...formData.improvement_last_2_months, squat: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.progress.bench')}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.improvement_last_2_months.bench}
                    onChange={(e) => setFormData({...formData, improvement_last_2_months: {...formData.improvement_last_2_months, bench: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.progress.deadlift')}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.improvement_last_2_months.deadlift}
                    onChange={(e) => setFormData({...formData, improvement_last_2_months: {...formData.improvement_last_2_months, deadlift: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-900">{tSurvey('sections.progress.improvementYear')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.progress.squat')}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.improvement_last_year.squat}
                    onChange={(e) => setFormData({...formData, improvement_last_year: {...formData.improvement_last_year, squat: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.progress.bench')}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.improvement_last_year.bench}
                    onChange={(e) => setFormData({...formData, improvement_last_year: {...formData.improvement_last_year, bench: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tSurvey('sections.progress.deadlift')}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.improvement_last_year.deadlift}
                    onChange={(e) => setFormData({...formData, improvement_last_year: {...formData.improvement_last_year, deadlift: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Capacity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">{tSurvey('sections.capacity.title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tSurvey('sections.capacity.sessionsLately')}
                </label>
                <input
                  type="number"
                  value={formData.training_sessions_per_week_lately}
                  onChange={(e) => setFormData({...formData, training_sessions_per_week_lately: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tSurvey('sections.capacity.maxSessions')}
                </label>
                <input
                  type="number"
                  value={formData.max_training_sessions_per_week}
                  onChange={(e) => setFormData({...formData, max_training_sessions_per_week: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tSurvey('sections.capacity.muscleMass')}
              </label>
              <textarea
                value={formData.muscle_mass_importance}
                onChange={(e) => setFormData({...formData, muscle_mass_importance: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder={tSurvey('sections.capacity.muscleMassPlaceholder')}
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-4 justify-end">
            <Link
              href={`/${locale}/admin/clients/${client?.slug}`}
              className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-900"
            >
              {tCommon('cancel')}
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? tForm('saving') : tForm('save')}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
