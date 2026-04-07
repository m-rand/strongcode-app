'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'

interface Survey {
  completed_at?: string
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

interface OneRMEntry {
  id?: number
  date: string
  squat: number
  bench_press: number
  deadlift: number
  tested: boolean
  notes?: string
}

interface ClientData {
  slug: string
  name: string
  email: string
  skill_level: string
  notes?: string
  preferences?: {
    training_days?: string[]
    focus_lifts?: string[]
    session_duration_minutes?: number
    sessions_per_week?: number
  }
  survey?: Survey
  one_rm_history?: OneRMEntry[]
}

const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'elite'] as const
const LIFTS = ['squat', 'bench', 'deadlift'] as const

export default function ClientEditPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('admin.clientEdit')
  const tClients = useTranslations('admin.clients')
  const locale = useLocale()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [skillLevel, setSkillLevel] = useState('')
  const [notes, setNotes] = useState('')
  const [sessionsPerWeek, setSessionsPerWeek] = useState<number | ''>('')
  const [sessionDuration, setSessionDuration] = useState<number | ''>('')
  const [focusLifts, setFocusLifts] = useState<string[]>([])

  // 1RM data
  const [oneRmId, setOneRmId] = useState<number | undefined>()
  const [oneRmDate, setOneRmDate] = useState('')
  const [oneRmSquat, setOneRmSquat] = useState<number | ''>('')
  const [oneRmBench, setOneRmBench] = useState<number | ''>('')
  const [oneRmDeadlift, setOneRmDeadlift] = useState<number | ''>('')
  const [oneRmTested, setOneRmTested] = useState(false)
  const [oneRmNotes, setOneRmNotes] = useState('')
  const [oneRmHistory, setOneRmHistory] = useState<OneRMEntry[]>([])

  // Survey RM data
  const [repsAt75, setRepsAt75] = useState<{ squat: number | ''; bench: number | ''; deadlift: number | '' }>({ squat: '', bench: '', deadlift: '' })
  const [repsAt85, setRepsAt85] = useState<{ squat: number | ''; bench: number | ''; deadlift: number | '' }>({ squat: '', bench: '', deadlift: '' })
  const [repsAt925, setRepsAt925] = useState<{ squat: number | ''; bench: number | ''; deadlift: number | '' }>({ squat: '', bench: '', deadlift: '' })

  // Survey other fields
  const [externalStress, setExternalStress] = useState<number | ''>('')
  const [sessionsLately, setSessionsLately] = useState<number | ''>('')
  const [maxSessions, setMaxSessions] = useState<number | ''>('')
  const [minWeightJump, setMinWeightJump] = useState<{ squat: number | ''; bench: number | ''; deadlift: number | '' }>({ squat: '', bench: '', deadlift: '' })

  // Original survey (to preserve fields we don't edit)
  const [originalSurvey, setOriginalSurvey] = useState<Survey | undefined>()

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clients/${params.slug}`)
      if (!response.ok) throw new Error('Failed to load client')

      const data = await response.json()
      const c: ClientData = data.client

      setName(c.name)
      setEmail(c.email || '')
      setSkillLevel(c.skill_level || '')
      setNotes(c.notes || '')
      setSessionsPerWeek(c.preferences?.sessions_per_week || '')
      setSessionDuration(c.preferences?.session_duration_minutes || '')
      setFocusLifts(c.preferences?.focus_lifts || [])

      // 1RM history
      if (c.one_rm_history && c.one_rm_history.length > 0) {
        setOneRmHistory(c.one_rm_history)
        const latest = c.one_rm_history[0]
        setOneRmId(latest.id)
        setOneRmDate(latest.date)
        setOneRmSquat(latest.squat ?? '')
        setOneRmBench(latest.bench_press ?? '')
        setOneRmDeadlift(latest.deadlift ?? '')
        setOneRmTested(latest.tested)
        setOneRmNotes(latest.notes || '')
      }

      if (c.survey) {
        setOriginalSurvey(c.survey)
        setRepsAt75({
          squat: c.survey.reps_at_75_percent?.squat ?? '',
          bench: c.survey.reps_at_75_percent?.bench ?? '',
          deadlift: c.survey.reps_at_75_percent?.deadlift ?? '',
        })
        setRepsAt85({
          squat: c.survey.reps_at_85_percent?.squat ?? '',
          bench: c.survey.reps_at_85_percent?.bench ?? '',
          deadlift: c.survey.reps_at_85_percent?.deadlift ?? '',
        })
        setRepsAt925({
          squat: c.survey.reps_at_92_5_percent?.squat ?? '',
          bench: c.survey.reps_at_92_5_percent?.bench ?? '',
          deadlift: c.survey.reps_at_92_5_percent?.deadlift ?? '',
        })
        setExternalStress(c.survey.external_stress_level ?? '')
        setSessionsLately(c.survey.training_sessions_per_week_lately ?? '')
        setMaxSessions(c.survey.max_training_sessions_per_week ?? '')
        setMinWeightJump({
          squat: c.survey.minimum_weight_jump?.squat ?? '',
          bench: c.survey.minimum_weight_jump?.bench ?? '',
          deadlift: c.survey.minimum_weight_jump?.deadlift ?? '',
        })
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchClient() }, [params.slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      // Build survey object merging original with edited fields
      const survey: Survey = {
        ...originalSurvey,
        reps_at_75_percent: {
          squat: repsAt75.squat === '' ? undefined : Number(repsAt75.squat),
          bench: repsAt75.bench === '' ? undefined : Number(repsAt75.bench),
          deadlift: repsAt75.deadlift === '' ? undefined : Number(repsAt75.deadlift),
        },
        reps_at_85_percent: {
          squat: repsAt85.squat === '' ? undefined : Number(repsAt85.squat),
          bench: repsAt85.bench === '' ? undefined : Number(repsAt85.bench),
          deadlift: repsAt85.deadlift === '' ? undefined : Number(repsAt85.deadlift),
        },
        reps_at_92_5_percent: {
          squat: repsAt925.squat === '' ? undefined : Number(repsAt925.squat),
          bench: repsAt925.bench === '' ? undefined : Number(repsAt925.bench),
          deadlift: repsAt925.deadlift === '' ? undefined : Number(repsAt925.deadlift),
        },
        external_stress_level: externalStress === '' ? undefined : Number(externalStress),
        training_sessions_per_week_lately: sessionsLately === '' ? undefined : Number(sessionsLately),
        max_training_sessions_per_week: maxSessions === '' ? undefined : Number(maxSessions),
        minimum_weight_jump: {
          squat: minWeightJump.squat === '' ? undefined : Number(minWeightJump.squat),
          bench: minWeightJump.bench === '' ? undefined : Number(minWeightJump.bench),
          deadlift: minWeightJump.deadlift === '' ? undefined : Number(minWeightJump.deadlift),
        },
      }

      const preferences = {
        sessions_per_week: sessionsPerWeek === '' ? undefined : Number(sessionsPerWeek),
        session_duration_minutes: sessionDuration === '' ? undefined : Number(sessionDuration),
        focus_lifts: focusLifts.length > 0 ? focusLifts : undefined,
      }

      const response = await fetch(`/api/clients/${params.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          skillLevel,
          notes,
          preferences,
          survey,
          oneRm: oneRmDate ? {
            id: oneRmId,
            date: oneRmDate,
            squat: oneRmSquat === '' ? null : Number(oneRmSquat),
            bench_press: oneRmBench === '' ? null : Number(oneRmBench),
            deadlift: oneRmDeadlift === '' ? null : Number(oneRmDeadlift),
            tested: oneRmTested,
            notes: oneRmNotes || undefined,
          } : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/${locale}/admin/clients/${params.slug}`)
      }, 1000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  const toggleFocusLift = (lift: string) => {
    setFocusLifts(prev =>
      prev.includes(lift) ? prev.filter(l => l !== lift) : [...prev, lift]
    )
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
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/${locale}/admin/clients/${params.slug}`}
                className="text-blue-600 hover:text-blue-800"
              >
                {t('back')}
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-800">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded text-green-800">
            {t('saved')}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">{t('basicInfo')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('skillLevel')}</label>
                <select
                  value={skillLevel}
                  onChange={e => setSkillLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">—</option>
                  {SKILL_LEVELS.map(level => (
                    <option key={level} value={level}>
                      {tClients(`skillLevels.${level}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('notes')}</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Current 1RM */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">{t('currentOneRM')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('date')}</label>
                <input
                  type="date"
                  value={oneRmDate}
                  onChange={e => setOneRmDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Squat (kg)</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={oneRmSquat}
                  onChange={e => setOneRmSquat(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bench Press (kg)</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={oneRmBench}
                  onChange={e => setOneRmBench(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadlift (kg)</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={oneRmDeadlift}
                  onChange={e => setOneRmDeadlift(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={oneRmTested}
                  onChange={e => setOneRmTested(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                {t('tested')}
              </label>
              <div className="flex-1">
                <input
                  type="text"
                  value={oneRmNotes}
                  onChange={e => setOneRmNotes(e.target.value)}
                  placeholder={t('oneRmNotesPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Previous records (read-only) */}
            {oneRmHistory.length > 1 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-gray-600 mb-2">{t('previousRecords')}</p>
                <div className="space-y-1">
                  {oneRmHistory.slice(1).map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="w-24">{entry.date}</span>
                      <span>S: {entry.squat}</span>
                      <span>B: {entry.bench_press}</span>
                      <span>D: {entry.deadlift}</span>
                      {entry.tested && <span className="text-green-600 text-xs font-semibold">T</span>}
                      {entry.notes && <span className="text-gray-400">— {entry.notes}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">{t('preferences')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sessionsPerWeek')}</label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={sessionsPerWeek}
                  onChange={e => setSessionsPerWeek(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sessionDuration')}</label>
                <input
                  type="number"
                  min={30}
                  max={180}
                  step={15}
                  value={sessionDuration}
                  onChange={e => setSessionDuration(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('focusLifts')}</label>
              <div className="flex gap-3">
                {['squat', 'bench_press', 'deadlift'].map(lift => (
                  <button
                    key={lift}
                    type="button"
                    onClick={() => toggleFocusLift(lift)}
                    className={`px-4 py-2 rounded border text-sm font-medium transition-colors ${
                      focusLifts.includes(lift)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {lift === 'bench_press' ? 'Bench Press' : lift.charAt(0).toUpperCase() + lift.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Survey — RM Profile */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">{t('rmProfile')}</h2>
            <p className="text-sm text-gray-600 mb-4">{t('rmProfileDesc')}</p>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('lift')}</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">@ 75%</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">@ 85%</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">@ 92.5%</th>
                  </tr>
                </thead>
                <tbody>
                  {LIFTS.map(lift => (
                    <tr key={lift}>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">
                        {lift === 'bench' ? 'Bench Press' : lift.charAt(0).toUpperCase() + lift.slice(1)}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={repsAt75[lift]}
                          onChange={e => setRepsAt75(prev => ({ ...prev, [lift]: e.target.value === '' ? '' : Number(e.target.value) }))}
                          className="w-20 mx-auto block px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder="—"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={repsAt85[lift]}
                          onChange={e => setRepsAt85(prev => ({ ...prev, [lift]: e.target.value === '' ? '' : Number(e.target.value) }))}
                          className="w-20 mx-auto block px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder="—"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={repsAt925[lift]}
                          onChange={e => setRepsAt925(prev => ({ ...prev, [lift]: e.target.value === '' ? '' : Number(e.target.value) }))}
                          className="w-20 mx-auto block px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder="—"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Survey — Other Fields */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">{t('surveyData')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('externalStress')}</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={externalStress}
                  onChange={e => setExternalStress(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1–5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sessionsLately')}</label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={sessionsLately}
                  onChange={e => setSessionsLately(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('maxSessions')}</label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={maxSessions}
                  onChange={e => setMaxSessions(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('minWeightJump')}</label>
              <div className="grid grid-cols-3 gap-4">
                {LIFTS.map(lift => (
                  <div key={lift}>
                    <label className="block text-xs text-gray-500 mb-1">
                      {lift === 'bench' ? 'Bench' : lift.charAt(0).toUpperCase() + lift.slice(1)}
                    </label>
                    <input
                      type="number"
                      min={0.5}
                      max={10}
                      step={0.5}
                      value={minWeightJump[lift]}
                      onChange={e => setMinWeightJump(prev => ({ ...prev, [lift]: e.target.value === '' ? '' : Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="kg"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Link
              href={`/${locale}/admin/clients/${params.slug}`}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
            >
              {t('cancel')}
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {saving ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
