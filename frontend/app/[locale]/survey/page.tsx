'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function PublicSurveyPage() {
  const t = useTranslations('survey')
  const tHome = useTranslations('home')
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')

  // Theme management
  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system'
    setTheme(saved)
    applyTheme(saved)
  }, [])

  const applyTheme = (newTheme: 'light' | 'dark' | 'system') => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = newTheme === 'dark' || (newTheme === 'system' && prefersDark)

    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  // Form state
  const [formData, setFormData] = useState({
    // Personal info
    name: '',
    email: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    // Validation
    if (!formData.name || !formData.email) {
      setError(t('errors.nameEmailRequired'))
      setSaving(false)
      return
    }

    if (!formData.one_rm.squat || !formData.one_rm.bench || !formData.one_rm.deadlift) {
      setError(t('errors.allOneRMRequired'))
      setSaving(false)
      return
    }

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

      const response = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('errors.submitFailed'))
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center transition-colors duration-200" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="p-12">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8" style={{ background: 'var(--accent-primary)' }}>
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="section-title mb-6">{t('success.title')}</h2>
            <p className="text-body mb-12">
              {t('success.message')}
            </p>
            <Link
              href="/"
              className="inline-block px-8 py-4 text-white font-light rounded hover:opacity-90 transition-opacity"
              style={{ background: 'var(--accent-primary)' }}
            >
              {t('success.backHome')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen transition-colors duration-200" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-sm" style={{ background: 'rgba(var(--bg-primary-rgb), 0.9)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <Link
                href="/"
                className="text-2xl font-light transition-colors"
                style={{ letterSpacing: '-0.02em', color: 'var(--text-primary)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              >
                {tHome('brand')}
              </Link>
              <p className="text-meta mt-1">
                {t('subtitle')}
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-light">
              <button
                onClick={() => handleThemeChange('light')}
                className="px-3 py-2 rounded transition-colors"
                style={{
                  background: theme === 'light' ? 'var(--accent-primary)' : 'transparent',
                  color: theme === 'light' ? '#fff' : 'var(--text-primary)'
                }}
              >
                {tHome('theme.light')}
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className="px-3 py-2 rounded transition-colors"
                style={{
                  background: theme === 'dark' ? 'var(--accent-primary)' : 'transparent',
                  color: theme === 'dark' ? '#fff' : 'var(--text-primary)'
                }}
              >
                {tHome('theme.dark')}
              </button>
              <button
                onClick={() => handleThemeChange('system')}
                className="px-3 py-2 rounded transition-colors"
                style={{
                  background: theme === 'system' ? 'var(--accent-primary)' : 'transparent',
                  color: theme === 'system' ? '#fff' : 'var(--text-primary)'
                }}
              >
                {tHome('theme.system')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="page-title mb-6">{t('title')}</h1>
          <p className="text-body border-l-2 pl-6" style={{ borderColor: 'var(--accent-primary)' }}>
            {t('description')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Personal Information */}
          <section className="border-t pt-8" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="section-title mb-8">{t('sections.personal.title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-light opacity-70 mb-2">
                  {t('sections.personal.name')} <span className="accent-text">{t('required')}</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="input-field"
                  placeholder={t('sections.personal.name')}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-light opacity-70 mb-2">
                  {t('sections.personal.email')} <span className="accent-text">{t('required')}</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="input-field"
                  placeholder={t('sections.personal.email')}
                />
              </div>

              <div>
                <label className="block text-sm font-light opacity-70 mb-2">{t('sections.personal.nationality')}</label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                  className="input-field"
                  placeholder={t('sections.personal.nationality')}
                />
              </div>

              <div>
                <label className="block text-sm font-light opacity-70 mb-2">{t('sections.personal.gender')}</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="input-field"
                >
                  <option value="">{t('sections.personal.genderOptions.select')}</option>
                  <option value="male">{t('sections.personal.genderOptions.male')}</option>
                  <option value="female">{t('sections.personal.genderOptions.female')}</option>
                  <option value="other">{t('sections.personal.genderOptions.other')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-light opacity-70 mb-2">{t('sections.personal.dateOfBirth')}</label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-light opacity-70 mb-2">{t('sections.personal.height')}</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.height}
                  onChange={(e) => setFormData({...formData, height: e.target.value})}
                  className="input-field"
                  placeholder="180"
                />
              </div>

              <div>
                <label className="block text-sm font-light opacity-70 mb-2">{t('sections.personal.weight')}</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  className="input-field"
                  placeholder="85"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-light opacity-70 mb-2">
                  {t('sections.personal.healthIssues')}
                </label>
                <textarea
                  value={formData.health_issues}
                  onChange={(e) => setFormData({...formData, health_issues: e.target.value})}
                  rows={3}
                  className="input-field"
                  placeholder={t('sections.personal.healthIssuesPlaceholder')}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-light opacity-70 mb-2">{t('sections.personal.otherComments')}</label>
                <textarea
                  value={formData.other_comments}
                  onChange={(e) => setFormData({...formData, other_comments: e.target.value})}
                  rows={3}
                  className="input-field"
                  placeholder={t('sections.personal.otherCommentsPlaceholder')}
                />
              </div>
            </div>
          </section>

          {/* 1RM Data */}
          <section className="border-t pt-8" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="section-title mb-2" style={{ letterSpacing: '-0.02em' }}>
              {t('sections.oneRM.title')} <span className="accent-text">{t('required')}</span>
            </h2>
            <p className="text-sm font-light opacity-60 mb-8">
              {t('sections.oneRM.subtitle')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-light opacity-70 mb-2">
                  {t('sections.oneRM.squat')} <span className="accent-text">{t('required')}</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={formData.one_rm.squat}
                  onChange={(e) => setFormData({...formData, one_rm: {...formData.one_rm, squat: e.target.value}})}
                  className="input-field"
                  placeholder="140"
                />
              </div>

              <div>
                <label className="block text-sm font-light opacity-70 mb-2">
                  {t('sections.oneRM.bench')} <span className="accent-text">{t('required')}</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={formData.one_rm.bench}
                  onChange={(e) => setFormData({...formData, one_rm: {...formData.one_rm, bench: e.target.value}})}
                  className="input-field"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-light opacity-70 mb-2">
                  {t('sections.oneRM.deadlift')} <span className="accent-text">{t('required')}</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={formData.one_rm.deadlift}
                  onChange={(e) => setFormData({...formData, one_rm: {...formData.one_rm, deadlift: e.target.value}})}
                  className="input-field"
                  placeholder="180"
                />
              </div>
            </div>
          </section>

          {/* Psyching Readiness */}
          <section className="border-t pt-8" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="section-title mb-2" style={{ letterSpacing: '-0.02em' }}>{t('sections.psyching.title')}</h2>
            <p className="text-sm font-light opacity-60 mb-8">{t('sections.psyching.subtitle')}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.can_lift_1rm_anytime.squat}
                  onChange={(e) => setFormData({...formData, can_lift_1rm_anytime: {...formData.can_lift_1rm_anytime, squat: e.target.checked}})}
                  className="h-5 w-5 rounded"
                />
                <span className="ml-3 text-sm font-light group-hover:accent-text transition-colors">
                  {t('sections.psyching.squat')}
                </span>
              </label>

              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.can_lift_1rm_anytime.bench}
                  onChange={(e) => setFormData({...formData, can_lift_1rm_anytime: {...formData.can_lift_1rm_anytime, bench: e.target.checked}})}
                  className="h-5 w-5 rounded"
                />
                <span className="ml-3 text-sm font-light group-hover:accent-text transition-colors">
                  {t('sections.psyching.bench')}
                </span>
              </label>

              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.can_lift_1rm_anytime.deadlift}
                  onChange={(e) => setFormData({...formData, can_lift_1rm_anytime: {...formData.can_lift_1rm_anytime, deadlift: e.target.checked}})}
                  className="h-5 w-5 rounded"
                />
                <span className="ml-3 text-sm font-light group-hover:accent-text transition-colors">
                  {t('sections.psyching.deadlift')}
                </span>
              </label>
            </div>
          </section>

          {/* Performance Tests */}
          <section className="border-t pt-8" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="section-title mb-8" style={{ letterSpacing: '-0.02em' }}>{t('sections.performance.title')}</h2>

            {/* 75% */}
            <div className="mb-10">
              <h3 className="subsection-title mb-6">{t('sections.performance.repsAt75')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-light opacity-70 mb-2">{t('sections.performance.squat')}</label>
                  <input
                    type="number"
                    value={formData.reps_at_75_percent.squat}
                    onChange={(e) => setFormData({...formData, reps_at_75_percent: {...formData.reps_at_75_percent, squat: e.target.value}})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-light opacity-70 mb-2">{t('sections.performance.bench')}</label>
                  <input
                    type="number"
                    value={formData.reps_at_75_percent.bench}
                    onChange={(e) => setFormData({...formData, reps_at_75_percent: {...formData.reps_at_75_percent, bench: e.target.value}})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-light opacity-70 mb-2">{t('sections.performance.deadlift')}</label>
                  <input
                    type="number"
                    value={formData.reps_at_75_percent.deadlift}
                    onChange={(e) => setFormData({...formData, reps_at_75_percent: {...formData.reps_at_75_percent, deadlift: e.target.value}})}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* 85% */}
            <div className="mb-10">
              <h3 className="subsection-title mb-6">{t('sections.performance.repsAt85')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-light opacity-70 mb-2">{t('sections.performance.squat')}</label>
                  <input
                    type="number"
                    value={formData.reps_at_85_percent.squat}
                    onChange={(e) => setFormData({...formData, reps_at_85_percent: {...formData.reps_at_85_percent, squat: e.target.value}})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-light opacity-70 mb-2">{t('sections.performance.bench')}</label>
                  <input
                    type="number"
                    value={formData.reps_at_85_percent.bench}
                    onChange={(e) => setFormData({...formData, reps_at_85_percent: {...formData.reps_at_85_percent, bench: e.target.value}})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-light opacity-70 mb-2">{t('sections.performance.deadlift')}</label>
                  <input
                    type="number"
                    value={formData.reps_at_85_percent.deadlift}
                    onChange={(e) => setFormData({...formData, reps_at_85_percent: {...formData.reps_at_85_percent, deadlift: e.target.value}})}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* 92.5% */}
            <div>
              <h3 className="subsection-title mb-6">{t('sections.performance.repsAt925')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-light opacity-70 mb-2">{t('sections.performance.squat')}</label>
                  <input
                    type="number"
                    value={formData.reps_at_92_5_percent.squat}
                    onChange={(e) => setFormData({...formData, reps_at_92_5_percent: {...formData.reps_at_92_5_percent, squat: e.target.value}})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-light opacity-70 mb-2">{t('sections.performance.bench')}</label>
                  <input
                    type="number"
                    value={formData.reps_at_92_5_percent.bench}
                    onChange={(e) => setFormData({...formData, reps_at_92_5_percent: {...formData.reps_at_92_5_percent, bench: e.target.value}})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-light opacity-70 mb-2">{t('sections.performance.deadlift')}</label>
                  <input
                    type="number"
                    value={formData.reps_at_92_5_percent.deadlift}
                    onChange={(e) => setFormData({...formData, reps_at_92_5_percent: {...formData.reps_at_92_5_percent, deadlift: e.target.value}})}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Equipment */}
          <section className="border-t pt-8" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="section-title mb-2" style={{ letterSpacing: '-0.02em' }}>{t('sections.equipment.title')}</h2>
            <p className="text-sm font-light opacity-60 mb-8">{t('sections.equipment.subtitle')}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-light opacity-70 mb-2">{t('sections.equipment.squat')}</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.minimum_weight_jump.squat}
                  onChange={(e) => setFormData({...formData, minimum_weight_jump: {...formData.minimum_weight_jump, squat: e.target.value}})}
                  className="input-field"
                  placeholder="2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-light opacity-70 mb-2">{t('sections.equipment.bench')}</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.minimum_weight_jump.bench}
                  onChange={(e) => setFormData({...formData, minimum_weight_jump: {...formData.minimum_weight_jump, bench: e.target.value}})}
                  className="input-field"
                  placeholder="2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-light opacity-70 mb-2">{t('sections.equipment.deadlift')}</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.minimum_weight_jump.deadlift}
                  onChange={(e) => setFormData({...formData, minimum_weight_jump: {...formData.minimum_weight_jump, deadlift: e.target.value}})}
                  className="input-field"
                  placeholder="2.5"
                />
              </div>
            </div>
          </section>

          {/* Stress Level */}
          <section className="border-t pt-8" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="section-title mb-8" style={{ letterSpacing: '-0.02em' }}>{t('sections.stress.title')}</h2>
            <div>
              <label className="block text-sm font-light opacity-70 mb-2">
                {t('sections.stress.level')}
              </label>
              <select
                value={formData.external_stress_level}
                onChange={(e) => setFormData({...formData, external_stress_level: e.target.value})}
                className="select-field"
              >
                <option value="">{t('sections.stress.options.select')}</option>
                <option value="1">{t('sections.stress.options.1')}</option>
                <option value="2">{t('sections.stress.options.2')}</option>
                <option value="3">{t('sections.stress.options.3')}</option>
                <option value="4">{t('sections.stress.options.4')}</option>
                <option value="5">{t('sections.stress.options.5')}</option>
              </select>
            </div>
          </section>

          {/* Training Frequency */}
          <section className="border-t pt-8" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="section-title mb-2" style={{ letterSpacing: '-0.02em' }}>{t('sections.frequency.title')}</h2>
            <p className="text-sm font-light opacity-60 mb-8">{t('sections.frequency.subtitle')}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-light opacity-70 mb-2">{t('sections.frequency.squat')}</label>
                <input
                  type="number"
                  value={formData.training_frequency_per_week.squat}
                  onChange={(e) => setFormData({...formData, training_frequency_per_week: {...formData.training_frequency_per_week, squat: e.target.value}})}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-light opacity-70 mb-2">{t('sections.frequency.bench')}</label>
                <input
                  type="number"
                  value={formData.training_frequency_per_week.bench}
                  onChange={(e) => setFormData({...formData, training_frequency_per_week: {...formData.training_frequency_per_week, bench: e.target.value}})}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-light opacity-70 mb-2">{t('sections.frequency.deadlift')}</label>
                <input
                  type="number"
                  value={formData.training_frequency_per_week.deadlift}
                  onChange={(e) => setFormData({...formData, training_frequency_per_week: {...formData.training_frequency_per_week, deadlift: e.target.value}})}
                  className="input-field"
                />
              </div>
            </div>
          </section>

          {/* Volume Metrics */}
          <section className="border-t pt-8" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="section-title mb-8" style={{ letterSpacing: '-0.02em' }}>{t('sections.volume.title')}</h2>

            <div className="mb-10">
              <h3 className="subsection-title mb-6">{t('sections.volume.avgLifts70')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-light opacity-70 mb-2">{t('sections.volume.squat')}</label>
                  <input
                    type="number"
                    value={formData.avg_lifts_70_percent_per_week.squat}
                    onChange={(e) => setFormData({...formData, avg_lifts_70_percent_per_week: {...formData.avg_lifts_70_percent_per_week, squat: e.target.value}})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-light opacity-70 mb-2">{t('sections.volume.bench')}</label>
                  <input
                    type="number"
                    value={formData.avg_lifts_70_percent_per_week.bench}
                    onChange={(e) => setFormData({...formData, avg_lifts_70_percent_per_week: {...formData.avg_lifts_70_percent_per_week, bench: e.target.value}})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-light opacity-70 mb-2">{t('sections.volume.deadlift')}</label>
                  <input
                    type="number"
                    value={formData.avg_lifts_70_percent_per_week.deadlift}
                    onChange={(e) => setFormData({...formData, avg_lifts_70_percent_per_week: {...formData.avg_lifts_70_percent_per_week, deadlift: e.target.value}})}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="subsection-title mb-6">{t('sections.volume.lifts95100')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-light opacity-70 mb-2">{t('sections.volume.squat')}</label>
                  <input
                    type="number"
                    value={formData.lifts_95_100_percent_per_month.squat}
                    onChange={(e) => setFormData({...formData, lifts_95_100_percent_per_month: {...formData.lifts_95_100_percent_per_month, squat: e.target.value}})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-light opacity-70 mb-2">{t('sections.volume.bench')}</label>
                  <input
                    type="number"
                    value={formData.lifts_95_100_percent_per_month.bench}
                    onChange={(e) => setFormData({...formData, lifts_95_100_percent_per_month: {...formData.lifts_95_100_percent_per_month, bench: e.target.value}})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-light opacity-70 mb-2">{t('sections.volume.deadlift')}</label>
                  <input
                    type="number"
                    value={formData.lifts_95_100_percent_per_month.deadlift}
                    onChange={(e) => setFormData({...formData, lifts_95_100_percent_per_month: {...formData.lifts_95_100_percent_per_month, deadlift: e.target.value}})}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Progress Tracking */}
          <section className="border-t pt-8" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="section-title mb-8" style={{ letterSpacing: '-0.02em' }}>{t('sections.progress.title')}</h2>

            <div className="mb-10">
              <h3 className="subsection-title mb-6">{t('sections.progress.improvement2Months')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-light opacity-70 mb-2">{t('sections.progress.squat')}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.improvement_last_2_months.squat}
                    onChange={(e) => setFormData({...formData, improvement_last_2_months: {...formData.improvement_last_2_months, squat: e.target.value}})}
                    className="input-field"
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-light opacity-70 mb-2">{t('sections.progress.bench')}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.improvement_last_2_months.bench}
                    onChange={(e) => setFormData({...formData, improvement_last_2_months: {...formData.improvement_last_2_months, bench: e.target.value}})}
                    className="input-field"
                    placeholder="2.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-light opacity-70 mb-2">{t('sections.progress.deadlift')}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.improvement_last_2_months.deadlift}
                    onChange={(e) => setFormData({...formData, improvement_last_2_months: {...formData.improvement_last_2_months, deadlift: e.target.value}})}
                    className="input-field"
                    placeholder="7.5"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="subsection-title mb-6">{t('sections.progress.improvementYear')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-light opacity-70 mb-2">{t('sections.progress.squat')}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.improvement_last_year.squat}
                    onChange={(e) => setFormData({...formData, improvement_last_year: {...formData.improvement_last_year, squat: e.target.value}})}
                    className="input-field"
                    placeholder="20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-light opacity-70 mb-2">{t('sections.progress.bench')}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.improvement_last_year.bench}
                    onChange={(e) => setFormData({...formData, improvement_last_year: {...formData.improvement_last_year, bench: e.target.value}})}
                    className="input-field"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-light opacity-70 mb-2">{t('sections.progress.deadlift')}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.improvement_last_year.deadlift}
                    onChange={(e) => setFormData({...formData, improvement_last_year: {...formData.improvement_last_year, deadlift: e.target.value}})}
                    className="input-field"
                    placeholder="30"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Capacity */}
          <section className="border-t pt-8" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="section-title mb-8" style={{ letterSpacing: '-0.02em' }}>{t('sections.capacity.title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-light opacity-70 mb-2">
                  {t('sections.capacity.sessionsLately')}
                </label>
                <input
                  type="number"
                  value={formData.training_sessions_per_week_lately}
                  onChange={(e) => setFormData({...formData, training_sessions_per_week_lately: e.target.value})}
                  className="input-field"
                  placeholder="4"
                />
              </div>

              <div>
                <label className="block text-sm font-light opacity-70 mb-2">
                  {t('sections.capacity.maxSessions')}
                </label>
                <input
                  type="number"
                  value={formData.max_training_sessions_per_week}
                  onChange={(e) => setFormData({...formData, max_training_sessions_per_week: e.target.value})}
                  className="input-field"
                  placeholder="5"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-light opacity-70 mb-2">
                {t('sections.capacity.muscleMass')}
              </label>
              <textarea
                value={formData.muscle_mass_importance}
                onChange={(e) => setFormData({...formData, muscle_mass_importance: e.target.value})}
                rows={3}
                className="input-field"
                placeholder={t('sections.capacity.muscleMassPlaceholder')}
              />
            </div>
          </section>

          {/* Error Display */}
          {error && (
            <div className="border-l-4 p-6" style={{ borderColor: 'var(--accent-primary)', background: 'var(--bg-secondary)' }}>
              <p className="accent-text font-light">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <section className="border-t pt-8" style={{ borderColor: 'var(--border-color)' }}>
            <button
              type="submit"
              disabled={saving}
              className="w-full px-8 py-5 text-white text-lg font-light rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ background: 'var(--accent-primary)' }}
            >
              {saving ? t('submitting') : t('submit')}
            </button>
            <p className="text-meta text-center mt-6">
              {t('footer')}
            </p>
          </section>
        </form>
      </main>
    </div>
  )
}
