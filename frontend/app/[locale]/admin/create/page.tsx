'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import LiftColumn from './LiftColumn'
import { calculateAllTargets } from '@/lib/ai/calculate'

type LiftKey = 'squat' | 'bench_press' | 'deadlift'
type WeekKey = 'week_1' | 'week_2' | 'week_3' | 'week_4'

interface SetData {
  weight: number
  reps: number
  percentage: number
}

interface SessionLift {
  lift: LiftKey
  sets: SetData[]
}

interface SessionWeek {
  lifts: SessionLift[]
}

type SessionsData = Record<string, {
  week_1: SessionWeek
  week_2: SessionWeek
  week_3: SessionWeek
  week_4: SessionWeek
}>

interface LiftInputPayload {
  volume: number
  rounding: number
  one_rm: number
  weights: {
    '65': number
    '75': number
    '85': number
    '90': number
    '95': number
  }
  intensity_distribution: {
    '75_percent': number
    '85_percent': number
    '90_total_reps': number
    '95_total_reps': number
  }
  volume_pattern_main: string
  volume_pattern_8190: string
  sessions_per_week: number
  session_distribution: string
}

interface ProgramData {
  schema_version: string
  meta: {
    filename: string
    created_at: string
    created_by: string
    status: string
  }
  client: {
    name: string
    delta: 'beginner' | 'intermediate' | 'advanced' | 'elite'
    one_rm: {
      squat: number
      bench_press: number
      deadlift: number
    }
  }
  program_info: {
    block: 'prep' | 'comp'
    start_date: string
    end_date: string
    weeks: number
  }
  input: Record<LiftKey, LiftInputPayload>
  calculated: {
    [lift: string]: {
      _summary: {
        total_nl: number
        block_ari: number
        zone_distribution: { [zone: string]: number }
        zone_totals: { [zone: string]: number }
      }
      [key: string]: any
    }
  }
  sessions: SessionsData
}

interface GenerateProgramResponse {
  success: boolean
  error?: string
  program?: {
    calculated: ProgramData['calculated']
    sessions: SessionsData
  }
}

const DEFAULT_SESSIONS_PER_WEEK = 3
const DEFAULT_SESSION_DISTRIBUTION = 'd25_33_42'

const getLiftLabel = (lift: string) => (
  lift === 'squat' ? 'Squat' :
  lift === 'bench_press' ? 'Bench Press' :
  lift === 'deadlift' ? 'Deadlift' : lift
)

const toClientSlug = (name: string) => (
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
)

const toApiBlock = (block: string): 'prep' | 'comp' => (
  block === 'comp' ? 'comp' : 'prep'
)

export default function CreateProgram() {
  const router = useRouter()
  const t = useTranslations('admin.create')
  const locale = useLocale()
  const [loading, setLoading] = useState(false)
  const [calculatedResults, setCalculatedResults] = useState<ProgramData | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [isNewClient, setIsNewClient] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)

  // Default lift configuration
  const defaultLiftConfig = (oneRM: number, volume: number) => ({
    oneRM,
    rounding: 2.5,
    volume,
    weight_65: Math.round((oneRM * 0.65) / 2.5) * 2.5,
    weight_75: Math.round((oneRM * 0.75) / 2.5) * 2.5,
    weight_85: Math.round((oneRM * 0.85) / 2.5) * 2.5,
    weight_90: Math.round((oneRM * 0.925) / 2.5) * 2.5,
    weight_95: Math.round((oneRM * 0.95) / 2.5) * 2.5,
    zone_75_percent: 45,
    zone_85_percent: 13,
    zone_90_total_reps: 4,
    zone_95_total_reps: 0,
    volume_pattern_main: '3a',
    volume_pattern_8190: '3a',
  })

  // Form state - now with 3 lifts
  const [formData, setFormData] = useState({
    // Shared client info
    clientName: 'Katerina Balasova',
    delta: 'advanced' as const,
    block: 'prep',

    // Per-lift configurations
    lifts: {
      squat: defaultLiftConfig(142.5, 350),
      bench_press: defaultLiftConfig(85, 300),
      deadlift: defaultLiftConfig(170, 250),
    }
  })

  const buildLiftPayload = (liftData: typeof formData.lifts.squat): LiftInputPayload => ({
    volume: liftData.volume,
    rounding: liftData.rounding,
    one_rm: liftData.oneRM,
    weights: {
      '65': liftData.weight_65,
      '75': liftData.weight_75,
      '85': liftData.weight_85,
      '90': liftData.weight_90,
      '95': liftData.weight_95,
    },
    intensity_distribution: {
      '75_percent': liftData.zone_75_percent,
      '85_percent': liftData.zone_85_percent,
      '90_total_reps': liftData.zone_90_total_reps,
      '95_total_reps': liftData.zone_95_total_reps,
    },
    volume_pattern_main: liftData.volume_pattern_main,
    volume_pattern_8190: liftData.volume_pattern_8190,
    sessions_per_week: DEFAULT_SESSIONS_PER_WEEK,
    session_distribution: DEFAULT_SESSION_DISTRIBUTION,
  })

  const buildGeneratePayload = () => {
    const clientSlug = toClientSlug(formData.clientName)
    const block = toApiBlock(formData.block)

    return {
      clientSlug,
      save: false,
      provider: 'anthropic' as const,
      model: 'claude-opus-4-6',
      promptVersion: 'v2_7',
      client: {
        name: formData.clientName,
        delta: formData.delta,
        one_rm: {
          squat: formData.lifts.squat.oneRM,
          bench_press: formData.lifts.bench_press.oneRM,
          deadlift: formData.lifts.deadlift.oneRM,
        },
      },
      block,
      weeks: 4,
      lifts: {
        squat: buildLiftPayload(formData.lifts.squat),
        bench_press: buildLiftPayload(formData.lifts.bench_press),
        deadlift: buildLiftPayload(formData.lifts.deadlift),
      },
    }
  }

  const buildProgramData = (
    payload: ReturnType<typeof buildGeneratePayload>,
    generated: NonNullable<GenerateProgramResponse['program']>,
  ): ProgramData => {
    const today = new Date().toISOString().split('T')[0]
    const endDate = new Date(Date.now() + payload.weeks * 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    return {
      schema_version: '1.2',
      meta: {
        filename: `${today}_${payload.clientSlug}_${payload.block}_all_lifts.json`,
        created_at: new Date().toISOString(),
        created_by: 'AI Generator',
        status: 'draft',
      },
      client: payload.client,
      program_info: {
        block: payload.block,
        start_date: today,
        end_date: endDate,
        weeks: payload.weeks,
      },
      input: payload.lifts,
      calculated: generated.calculated,
      sessions: generated.sessions,
    }
  }

  const recalculateDeterministic = () => {
    try {
      const payload = buildGeneratePayload()
      const calculated = calculateAllTargets(payload.lifts, payload.client.delta, payload.weeks)
      const programData = buildProgramData(payload, {
        calculated,
        sessions: {} as SessionsData,
      })

      setCalculatedResults(programData)
      setIsSaved(false)
    } catch (error) {
      console.error('Error in deterministic calculation:', error)
    }
  }

  const triggerCalculation = async () => {

    setLoading(true)
    setIsSaved(false)

    try {
      const payload = buildGeneratePayload()

      // Call AI generation API (preview only, no DB save)
      const response = await fetch('/api/generate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result: GenerateProgramResponse = await response.json()

      if (!result.program) {
        throw new Error(result.error || 'Failed to generate program')
      }

      const programData = buildProgramData(payload, result.program)
      setCalculatedResults(programData)

      if (!response.ok) {
        console.warn('Program generated with validation issues:', result.error)
      }
    } catch (error) {
      console.error('Error calculating program:', error)
      // Don't show alert for auto-calculation errors
    } finally {
      setLoading(false)
    }
  }

  // Deterministic recalculation on every input change
  useEffect(() => {
    recalculateDeterministic()
  }, [formData])

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    await triggerCalculation()
  }

  const handleSave = async () => {
    if (!calculatedResults) return

    try {
      setLoading(true)

      const response = await fetch('/api/import-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calculatedResults),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save program')
      }

      setIsSaved(true)
      alert(t('programSaved'))
    } catch (error) {
      console.error('Error saving program:', error)
      alert(error instanceof Error ? error.message : 'Failed to save program')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!calculatedResults) return

    // Create JSON blob
    const jsonString = JSON.stringify(calculatedResults, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    // Create download link
    const a = document.createElement('a')
    a.href = url
    const filename = `${formData.clientName}_${formData.block}_${new Date().toISOString().split('T')[0]}.json`
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Calculate weight from 1RM and percentage
  const calculateWeight = (oneRM: number, percentage: number, rounding: number): number => {
    const raw = oneRM * (percentage / 100)
    return Math.round(raw / rounding) * rounding
  }

  // Calculate actual percentage from weight and 1RM
  const calculateActualPercentage = (weight: number, oneRM: number): number => {
    if (oneRM === 0) return 0
    return Math.round((weight / oneRM) * 100 * 10) / 10 // Round to 1 decimal
  }

  // Calculate percentage from absolute reps and total volume
  const calculatePercentageFromReps = (reps: number, totalVolume: number): number => {
    if (totalVolume === 0) return 0
    return Math.round((reps / totalVolume) * 100 * 10) / 10 // Round to 1 decimal
  }

  // Calculate ARI from zone reps
  const calculateARI = (zoneReps: { [key: string]: number }): number => {
    const zoneIntensities: { [key: string]: number } = {
      '55': 55,
      '65': 65,
      '75': 75,
      '85': 85,
      '90': 92.5,
      '95': 95
    }

    let totalIntensity = 0
    let totalReps = 0

    Object.entries(zoneReps).forEach(([zone, reps]) => {
      if (reps > 0) {
        const intensity = zoneIntensities[zone] || 75
        totalIntensity += intensity * reps
        totalReps += reps
      }
    })

    if (totalReps === 0) return 0
    return Math.round((totalIntensity / totalReps) * 10) / 10
  }

  // Update zone reps in calculated results
  const updateZoneReps = (lift: string, weekNum: number, zone: string, newValue: number) => {
    if (!calculatedResults) return

    setCalculatedResults(prev => {
      if (!prev) return prev

      const newResults = { ...prev }
      const liftData = { ...newResults.calculated[lift] }
      const weekData = { ...liftData[`week_${weekNum}`] }
      const zones = { ...weekData.zones }

      zones[zone] = newValue

      // Recalculate week total
      const weekTotal = Object.values(zones).reduce((sum: number, val) => sum + (val as number), 0)

      // Recalculate ARI for this week
      const weekARI = calculateARI(zones)

      weekData.zones = zones
      weekData.total_reps = weekTotal
      weekData.ari = weekARI

      liftData[`week_${weekNum}`] = weekData

      // Recalculate summary
      const allZoneReps: { [key: string]: number } = { '55': 0, '65': 0, '75': 0, '85': 0, '90': 0, '95': 0 }
      for (let w = 1; w <= 4; w++) {
        const wData = liftData[`week_${w}`]
        if (wData?.zones) {
          Object.entries(wData.zones).forEach(([z, r]) => {
            allZoneReps[z] = (allZoneReps[z] || 0) + (r as number)
          })
        }
      }

      const blockARI = calculateARI(allZoneReps)
      liftData._summary = {
        ...liftData._summary,
        block_ari: blockARI,
        zone_totals: allZoneReps
      }

      newResults.calculated[lift] = liftData
      return newResults
    })

    setIsSaved(false)
  }

  // Update shared field (clientName, delta, etc.)
  const updateSharedField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Update lift-specific field
  const updateLiftField = (lift: 'squat' | 'bench_press' | 'deadlift', field: string, value: any) => {
    setFormData(prev => {
      const newLifts = { ...prev.lifts }
      const liftData = { ...newLifts[lift], [field]: value }

      // Auto-calculate zone weights when 1RM or rounding changes
      if (field === 'oneRM' || field === 'rounding') {
        const oneRM = field === 'oneRM' ? value : liftData.oneRM
        const rounding = field === 'rounding' ? value : liftData.rounding

        liftData.weight_65 = calculateWeight(oneRM, 65, rounding)
        liftData.weight_75 = calculateWeight(oneRM, 75, rounding)
        liftData.weight_85 = calculateWeight(oneRM, 85, rounding)
        liftData.weight_90 = calculateWeight(oneRM, 92.5, rounding)
        liftData.weight_95 = calculateWeight(oneRM, 95, rounding)
      }

      newLifts[lift] = liftData
      return { ...prev, lifts: newLifts }
    })
  }

  // Handle number input with decimal comma/point support
  const handleLiftNumberInput = (lift: LiftKey, field: string, inputValue: string) => {
    // Replace comma with dot for decimal separator
    const normalized = inputValue.replace(',', '.')

    // Allow empty string, numbers, and numbers ending with dot
    if (normalized === '' || normalized === '-' || /^-?\d*\.?\d*$/.test(normalized)) {
      const numValue = parseFloat(normalized)
      // Only update if it's a valid number or empty/partial input
      if (!isNaN(numValue)) {
        updateLiftField(lift, field, numValue)
      }
    }
  }

  const getLiftWeekSessions = (lift: LiftKey, weekNum: number) => {
    if (!calculatedResults?.sessions) return []

    const weekKey = `week_${weekNum}` as WeekKey
    return Object.entries(calculatedResults.sessions)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([sessionLetter, sessionData]) => {
        const liftSession = sessionData?.[weekKey]?.lifts?.find(item => item.lift === lift)
        return {
          session: sessionLetter,
          sets: liftSession?.sets ?? [],
        }
      })
      .filter(session => session.sets.length > 0)
  }

  const updateSessionSet = (
    lift: LiftKey,
    weekNum: number,
    sessionLetter: string,
    setIndex: number,
    field: 'weight' | 'reps' | 'percentage',
    rawValue: number,
  ) => {
    setCalculatedResults(prev => {
      if (!prev) return prev

      const weekKey = `week_${weekNum}` as WeekKey
      const nextSessions: SessionsData = JSON.parse(JSON.stringify(prev.sessions))
      const weekData = nextSessions[sessionLetter]?.[weekKey]
      if (!weekData) return prev

      const liftEntry = weekData.lifts.find(item => item.lift === lift)
      if (!liftEntry || !liftEntry.sets[setIndex]) return prev

      const value = Number.isFinite(rawValue) ? rawValue : 0
      liftEntry.sets[setIndex] = {
        ...liftEntry.sets[setIndex],
        [field]: value,
      }

      return {
        ...prev,
        sessions: nextSessions,
      }
    })

    setIsSaved(false)
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-600">
            {t('subtitle')}
          </p>
        </header>

        <form onSubmit={handleCalculate} className="space-y-6">
          {/* Client Selector */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">{t('clientSelection')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('recordType')}
                </label>
                <select
                  value={isNewClient ? 'new' : 'existing'}
                  onChange={(e) => setIsNewClient(e.target.value === 'new')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-600"
                >
                  <option value="new">{t('newClient')}</option>
                  <option value="existing">{t('existingClient')}</option>
                </select>
              </div>
              {!isNewClient && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('selectClient')}
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-600"
                    onChange={(e) => updateSharedField('clientName', e.target.value)}
                  >
                    <option value="Katerina Balasova">Katerina Balasova</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">{t('clientInfo')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('clientName')}
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => updateSharedField('clientName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-600"
                  required
                  disabled={!isNewClient}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('level')}
                </label>
                <select
                  value={formData.delta}
                  onChange={(e) => updateSharedField('delta', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-600"
                >
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="elite">Elite</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('block')}
                </label>
                <select
                  value={formData.block}
                  onChange={(e) => updateSharedField('block', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-600"
                >
                  <option value="prep">Prep</option>
                  <option value="comp">Comp</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3-Column Layout for Lifts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <LiftColumn
              liftName="squat"
              liftData={formData.lifts.squat}
              onUpdate={(field, value) => updateLiftField('squat', field, value)}
              onNumberInput={(field, value) => handleLiftNumberInput('squat', field, value)}
              calculateActualPercentage={calculateActualPercentage}
              calculatePercentageFromReps={calculatePercentageFromReps}
            />

            <LiftColumn
              liftName="bench_press"
              liftData={formData.lifts.bench_press}
              onUpdate={(field, value) => updateLiftField('bench_press', field, value)}
              onNumberInput={(field, value) => handleLiftNumberInput('bench_press', field, value)}
              calculateActualPercentage={calculateActualPercentage}
              calculatePercentageFromReps={calculatePercentageFromReps}
            />

            <LiftColumn
              liftName="deadlift"
              liftData={formData.lifts.deadlift}
              onUpdate={(field, value) => updateLiftField('deadlift', field, value)}
              onNumberInput={(field, value) => handleLiftNumberInput('deadlift', field, value)}
              calculateActualPercentage={calculateActualPercentage}
              calculatePercentageFromReps={calculatePercentageFromReps}
            />
          </div>

          {/* AI generation trigger */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Deterministic calculations update automatically. AI sessions generate only after clicking “{t('calculateProgram')}”.
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push(`/${locale}`)}
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? t('calculating') : t('calculateProgram')}
              </button>
            </div>
          </div>
        </form>

        {/* Results Display */}
        {calculatedResults && (
          <div className="mt-8 space-y-6">
            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-green-900 mb-2">
                    {t('programCalculated')}
                  </h2>
                  <p className="text-green-700">
                    {isEditMode ? t('editMode') : t('checkResults')}
                  </p>
                </div>
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`px-4 py-2 rounded-md ${
                    isEditMode
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isEditMode ? `✓ ${t('done')}` : `✏️ ${t('editResults')}`}
                </button>
              </div>
            </div>

            {/* Target Summary Panel (sticky when in edit mode) */}
            {isEditMode && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sticky top-4 z-10">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">{t('targetValues')}</h3>
                <div className="grid grid-cols-3 gap-6">
                  {Object.entries(calculatedResults.calculated).map(([lift, liftData]) => {
                    const liftLabel = lift === 'squat' ? 'Squat' :
                                     lift === 'bench_press' ? 'Bench Press' :
                                     lift === 'deadlift' ? 'Deadlift' : lift

                    // Get target zone distribution from formData
                    const liftConfig = formData.lifts[lift as keyof typeof formData.lifts]
                    const targetZones = {
                      '65': Math.round((100 - liftConfig.zone_75_percent - liftConfig.zone_85_percent -
                            calculatePercentageFromReps(liftConfig.zone_90_total_reps, liftConfig.volume) -
                            calculatePercentageFromReps(liftConfig.zone_95_total_reps, liftConfig.volume)) * liftConfig.volume / 100),
                      '75': Math.round(liftConfig.zone_75_percent * liftConfig.volume / 100),
                      '85': Math.round(liftConfig.zone_85_percent * liftConfig.volume / 100),
                      '90': liftConfig.zone_90_total_reps,
                      '95': liftConfig.zone_95_total_reps,
                    }

                    return (
                      <div key={lift} className="bg-white rounded p-3 shadow-sm">
                        <h4 className="font-semibold text-sm text-blue-900 mb-2">{liftLabel}</h4>
                        <div className="space-y-1 text-xs text-gray-800">
                          <div className="flex justify-between"><span className="text-gray-700">65%:</span><span className="font-semibold text-gray-900">{targetZones['65']}</span></div>
                          <div className="flex justify-between"><span className="text-gray-700">75%:</span><span className="font-semibold text-gray-900">{targetZones['75']}</span></div>
                          <div className="flex justify-between"><span className="text-gray-700">85%:</span><span className="font-semibold text-gray-900">{targetZones['85']}</span></div>
                          <div className="flex justify-between"><span className="text-gray-700">92.5%:</span><span className="font-semibold text-gray-900">{targetZones['90']}</span></div>
                          <div className="flex justify-between"><span className="text-gray-700">95%:</span><span className="font-semibold text-gray-900">{targetZones['95']}</span></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Results Tables */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('calculatedTargets')}</h2>
              {Object.entries(calculatedResults.calculated).map(([lift, liftData], index) => {
                const summary = liftData._summary

                // Format lift name (e.g., "bench_press" -> "Bench Press")
                const liftLabel = getLiftLabel(lift)
                const liftKey = lift as LiftKey

                // Get target zone distribution from formData
                const liftConfig = formData.lifts[lift as keyof typeof formData.lifts]
                const targetZones = {
                  '55': 0,
                  '65': Math.round((100 - liftConfig.zone_75_percent - liftConfig.zone_85_percent -
                        calculatePercentageFromReps(liftConfig.zone_90_total_reps, liftConfig.volume) -
                        calculatePercentageFromReps(liftConfig.zone_95_total_reps, liftConfig.volume)) * liftConfig.volume / 100),
                  '75': Math.round(liftConfig.zone_75_percent * liftConfig.volume / 100),
                  '85': Math.round(liftConfig.zone_85_percent * liftConfig.volume / 100),
                  '90': liftConfig.zone_90_total_reps,
                  '95': liftConfig.zone_95_total_reps,
                }

                return (
                  <div key={lift}>
                    {index > 0 && <hr className="my-8 border-gray-300" />}
                    <div className="space-y-6">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="text-2xl font-semibold text-center text-blue-900">{liftLabel}</h3>
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
                              {liftConfig.volume}
                            </td>
                          </tr>
                          {['55', '65', '75', '85', '90', '95'].map(zone => {
                            // Calculate actual total for this zone
                            const actualTotal = [1, 2, 3, 4].reduce((sum, weekNum) => {
                              const weekData = liftData[`week_${weekNum}`]
                              return sum + (weekData?.zones?.[zone] || 0)
                            }, 0)
                            const expectedTotal = targetZones[zone as keyof typeof targetZones]
                            const hasMismatch = actualTotal !== expectedTotal

                            return (
                              <tr key={zone} className={`${zone === '55' || zone === '90' || zone === '95' ? 'bg-gray-50' : ''} ${hasMismatch && isEditMode ? 'bg-red-50' : ''}`}>
                                <td className="border border-gray-300 px-4 py-2 text-gray-900">
                                  <div className="flex items-center justify-between">
                                    <span>{zone === '90' ? '92,50%' : `${zone}%`}</span>
                                    {isEditMode && expectedTotal > 0 && (
                                      <span className={`text-xs ml-2 ${hasMismatch ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                        ({t('target')}: {expectedTotal})
                                      </span>
                                    )}
                                  </div>
                                </td>
                                {[1, 2, 3, 4].map(weekNum => {
                                  const weekData = liftData[`week_${weekNum}`]
                                  const reps = weekData?.zones?.[zone] || 0
                                  return (
                                    <td key={weekNum} className={`border border-gray-300 px-2 py-2 text-center ${reps === 0 ? 'text-gray-400' : 'text-gray-900'}`}>
                                      {isEditMode ? (
                                        <input
                                          type="number"
                                          value={reps}
                                          onChange={(e) => updateZoneReps(lift, weekNum, zone, parseInt(e.target.value) || 0)}
                                          className="w-full px-2 py-1 text-center border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          min="0"
                                        />
                                      ) : (
                                        <span>{reps}</span>
                                      )}
                                    </td>
                                  )
                                })}
                                <td className={`border border-gray-300 px-3 py-2 text-center font-semibold ${hasMismatch && isEditMode ? 'text-red-700' : 'text-gray-900'}`}>
                                  {actualTotal}
                                  {isEditMode && hasMismatch && expectedTotal > 0 && (
                                    <span className="text-xs ml-1 text-red-600">
                                      ({actualTotal > expectedTotal ? '+' : ''}{actualTotal - expectedTotal})
                                    </span>
                                  )}
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
                                  {weekData?.ari || 0}
                                </td>
                              )
                            })}
                            <td className="border border-gray-300 px-4 py-2 text-center text-blue-900 font-semibold">
                              {summary.block_ari}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* AI Sessions (manual set editing) */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-900">AI Sessions</h4>
                      <AISessionLiftTable sessions={calculatedResults.sessions} lift={liftKey} />

                      {isEditMode && (
                        <div className="space-y-4">
                          <h5 className="text-sm font-semibold text-gray-800">Manual Set Editor</h5>
                          {[1, 2, 3, 4].map(weekNum => {
                            const weekSessions = getLiftWeekSessions(liftKey, weekNum)

                            return (
                              <div key={weekNum} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <div className="font-semibold text-gray-900 mb-3">Week {weekNum}</div>
                                {weekSessions.length === 0 ? (
                                  <p className="text-sm text-gray-500">No generated sessions for this week.</p>
                                ) : (
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {weekSessions.map(({ session, sets }) => (
                                      <div key={session} className="bg-white border border-gray-200 rounded-md p-3">
                                        <div className="font-semibold text-blue-800 mb-2">Session {session}</div>
                                        <div className="overflow-x-auto">
                                          <table className="min-w-full border-collapse border border-gray-200 text-sm">
                                            <thead>
                                              <tr className="bg-gray-100">
                                                <th className="border border-gray-200 px-2 py-1 text-center text-gray-900">#</th>
                                                <th className="border border-gray-200 px-2 py-1 text-center text-gray-900">kg</th>
                                                <th className="border border-gray-200 px-2 py-1 text-center text-gray-900">reps</th>
                                                <th className="border border-gray-200 px-2 py-1 text-center text-gray-900">%1RM</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {sets.map((set, setIndex) => (
                                                <tr key={`${session}-${weekNum}-${setIndex}`}>
                                                  <td className="border border-gray-200 px-2 py-1 text-center text-gray-900">{setIndex + 1}</td>
                                                  <td className="border border-gray-200 px-2 py-1 text-center text-gray-900">
                                                    <input
                                                      type="number"
                                                      step="0.5"
                                                      min="0"
                                                      value={set.weight}
                                                      onChange={(e) => updateSessionSet(liftKey, weekNum, session, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                                                      className="w-20 px-1 py-1 text-center border border-blue-300 rounded"
                                                    />
                                                  </td>
                                                  <td className="border border-gray-200 px-2 py-1 text-center text-gray-900">
                                                    <input
                                                      type="number"
                                                      step="1"
                                                      min="0"
                                                      value={set.reps}
                                                      onChange={(e) => updateSessionSet(liftKey, weekNum, session, setIndex, 'reps', parseInt(e.target.value) || 0)}
                                                      className="w-16 px-1 py-1 text-center border border-blue-300 rounded"
                                                    />
                                                  </td>
                                                  <td className="border border-gray-200 px-2 py-1 text-center text-gray-900">
                                                    <input
                                                      type="number"
                                                      step="0.5"
                                                      min="0"
                                                      value={set.percentage}
                                                      onChange={(e) => updateSessionSet(liftKey, weekNum, session, setIndex, 'percentage', parseFloat(e.target.value) || 0)}
                                                      className="w-20 px-1 py-1 text-center border border-blue-300 rounded"
                                                    />
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Save and Download Buttons */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setCalculatedResults(null)}
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                {t('editInput')}
              </button>
              <button
                onClick={handleDownload}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                📥 {t('downloadJson')}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaved}
                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {isSaved ? t('saved') : t('saveProgram')}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

const ZONE_ROWS = [
  { key: 65, label: '65%' },
  { key: 75, label: '75%' },
  { key: 85, label: '85%' },
  { key: 92.5, label: '90%' },
  { key: 95, label: '95%' },
] as const

function AISessionLiftTable({
  sessions,
  lift,
}: {
  sessions: SessionsData
  lift: LiftKey
}) {
  const sessionKeys = Object.keys(sessions).sort()
  const weekKeys: WeekKey[] = ['week_1', 'week_2', 'week_3', 'week_4']
  const rowsPerWeek = ZONE_ROWS.length + 2

  const getAllSets = (sessionKey: string, weekKey: WeekKey): SetData[] => {
    const weekData = sessions[sessionKey]?.[weekKey]
    const liftData = weekData?.lifts?.find(item => item.lift === lift)
    return liftData?.sets ?? []
  }

  const getWeightForZone = (zonePct: number): number | null => {
    for (const sessionKey of sessionKeys) {
      for (const weekKey of weekKeys) {
        const set = getAllSets(sessionKey, weekKey).find(item => item.percentage === zonePct)
        if (set) return set.weight
      }
    }
    return null
  }

  const maxSetsPerSession: Record<string, number> = {}
  for (const sessionKey of sessionKeys) {
    let max = 0
    for (const weekKey of weekKeys) {
      const n = getAllSets(sessionKey, weekKey).length
      if (n > max) max = n
    }
    maxSetsPerSession[sessionKey] = Math.max(max, 1)
  }

  if (sessionKeys.length === 0) {
    return <p className="text-sm text-gray-500">No AI sessions generated yet.</p>
  }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-2 py-1 font-semibold text-gray-900">week</th>
            <th className="border border-gray-300 px-2 py-1 font-semibold text-gray-900">lift</th>
            <th className="border border-gray-300 px-2 py-1 font-semibold text-gray-900">%1RM</th>
            <th className="border border-gray-300 px-2 py-1 font-semibold text-gray-900">kg</th>
            <th className="border border-gray-300 px-2 py-1 font-semibold text-gray-900">#reps</th>
            {sessionKeys.map(sessionKey => {
              const nCols = maxSetsPerSession[sessionKey]
              return Array.from({ length: nCols }, (_, idx) => (
                <th
                  key={`${sessionKey}-${idx}`}
                  className={`border border-gray-300 px-2 py-1 font-semibold ${idx === 0 ? 'border-l-2 border-l-gray-500' : ''} text-gray-900`}
                >
                  {idx === 0 ? `Session ${sessionKey}` : `#${idx + 1}`}
                </th>
              ))
            })}
          </tr>
        </thead>
        {weekKeys.map((weekKey, weekIdx) => (
          <tbody key={weekKey}>
              {ZONE_ROWS.map((zone, zoneIdx) => {
                let totalZoneReps = 0
                for (const sessionKey of sessionKeys) {
                  totalZoneReps += getAllSets(sessionKey, weekKey)
                    .filter(set => set.percentage === zone.key)
                    .reduce((sum, set) => sum + set.reps, 0)
                }

                return (
                  <tr key={`${weekKey}-${zone.key}`} className={zoneIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {zoneIdx === 0 && (
                      <td
                        rowSpan={rowsPerWeek}
                        className="border border-gray-300 px-2 py-1 text-center font-bold text-gray-900 align-middle"
                      >
                        {weekIdx + 1}
                      </td>
                    )}
                    {zoneIdx === 0 && (
                      <td
                        rowSpan={rowsPerWeek}
                        className="border border-gray-300 px-2 py-1 text-center font-semibold text-gray-800 align-middle"
                      >
                        {getLiftLabel(lift)}
                      </td>
                    )}

                    <td className="border border-gray-300 px-2 py-1 text-center font-semibold" style={{ color: getZoneColor(zone.key) }}>
                      {zone.label}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center text-gray-700">
                      {getWeightForZone(zone.key) ?? ''}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center font-semibold text-gray-900">
                      {totalZoneReps || ''}
                    </td>

                    {sessionKeys.map(sessionKey => {
                      const allSessionSets = getAllSets(sessionKey, weekKey)
                      const nCols = maxSetsPerSession[sessionKey]

                      return Array.from({ length: nCols }, (_, idx) => {
                        const set = allSessionSets[idx]
                        const isThisZone = !!set && set.percentage === zone.key

                        return (
                          <td
                            key={`${weekKey}-${sessionKey}-${zone.key}-${idx}`}
                            className={`border border-gray-300 px-2 py-1 text-center font-semibold ${idx === 0 ? 'border-l-2 border-l-gray-500' : ''} ${isThisZone ? '' : 'text-transparent'}`}
                            style={{
                              backgroundColor: isThisZone ? `${getZoneColor(zone.key)}22` : undefined,
                              color: isThisZone ? '#111' : 'transparent',
                            }}
                          >
                            {isThisZone ? set.reps : ''}
                          </td>
                        )
                      })
                    })}
                  </tr>
                )
              })}

              <tr className="bg-blue-50">
                <td colSpan={3} className="border border-gray-300 px-2 py-1 text-right text-xs font-semibold text-blue-800">
                  ARI
                </td>
                {sessionKeys.map(sessionKey => {
                  const sets = getAllSets(sessionKey, weekKey)
                  const totalReps = sets.reduce((sum, set) => sum + set.reps, 0)
                  const ari = totalReps > 0
                    ? sets.reduce((sum, set) => sum + (set.reps * set.percentage), 0) / totalReps
                    : null

                  return (
                    <td
                      key={`${weekKey}-${sessionKey}-ari`}
                      colSpan={maxSetsPerSession[sessionKey]}
                      className="border border-gray-300 px-2 py-1 text-center font-semibold text-blue-900 border-l-2 border-l-gray-500"
                    >
                      {ari !== null ? `${ari.toFixed(2)}%` : ''}
                    </td>
                  )
                })}
              </tr>

              <tr className="bg-green-50 border-b-2 border-b-gray-400">
                <td colSpan={3} className="border border-gray-300 px-2 py-1 text-right text-xs font-semibold text-green-800">
                  NL
                </td>
                {sessionKeys.map(sessionKey => {
                  const total = getAllSets(sessionKey, weekKey).reduce((sum, set) => sum + set.reps, 0)
                  return (
                    <td
                      key={`${weekKey}-${sessionKey}-nl`}
                      colSpan={maxSetsPerSession[sessionKey]}
                      className="border border-gray-300 px-2 py-1 text-center font-bold text-green-800 border-l-2 border-l-gray-500"
                    >
                      {total || ''}
                    </td>
                  )
                })}
              </tr>
          </tbody>
        ))}
      </table>
    </div>
  )
}

function getZoneColor(percentage: number): string {
  if (percentage <= 65) return '#16a34a'
  if (percentage <= 75) return '#2563eb'
  if (percentage <= 85) return '#ea580c'
  if (percentage <= 92.5) return '#dc2626'
  return '#9333ea'
}
