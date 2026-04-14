'use client'

import { useState, useEffect, useRef, useCallback, useMemo, type DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import LiftColumn from './LiftColumn'
import { calculateAllTargets } from '@/lib/ai/calculate'
import { buildRmLookup, calculateAre } from '@/lib/program/are'
import { buildClientInputFromTemplateInput, materializeSessionsForClient } from '@/lib/program/templates'

type LiftKey = 'squat' | 'bench_press' | 'deadlift'
type WeekKey = 'week_1' | 'week_2' | 'week_3' | 'week_4'

interface SetData {
  weight: number
  reps: number
  percentage: number
  variant?: string
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
  variants?: {
    variant_1: string
    variant_2?: string
    variant_3?: string
    variant_4?: string
  }
  weights: {
    '55': number
    '65': number
    '75': number
    '85': number
    '90': number
    '95': number
  }
  intensity_distribution: {
    '55_percent'?: number
    '75_percent': number
    '85_percent': number
    '90_total_reps': number
    '95_total_reps': number
    '90_weekly_reps'?: number[]
    '95_weekly_reps'?: number[]
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
    notes?: string
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
  input: Partial<Record<LiftKey, LiftInputPayload>>
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

interface ExistingClientSummary {
  slug: string
  name: string
  skill_level?: 'beginner' | 'intermediate' | 'advanced' | 'elite' | string
  latest_one_rm?: {
    squat?: number | null
    bench_press?: number | null
    deadlift?: number | null
  } | null
}

interface TemplateSummary {
  slug: string
  name: string
  description?: string | null
  scope: 'full' | 'single_lift'
  lift: LiftKey | null
  block: 'prep' | 'comp'
  weeks: number
  sourceProgramFilename?: string | null
  createdAt?: string
  createdBy?: string | null
}

interface TemplateDetailResponse {
  template?: {
    slug: string
    name: string
    description?: string | null
    scope: 'full' | 'single_lift'
    lift: LiftKey | null
    block: 'prep' | 'comp'
    weeks: number
    schemaVersion?: string
    input?: Record<string, unknown>
    calculated?: Record<string, unknown>
    sessionsTemplate?: unknown
    createdAt?: string
    createdBy?: string | null
  }
}

interface TemplateListResponse {
  templates?: TemplateSummary[]
}

interface EditingTemplateMeta {
  scope: 'full' | 'single_lift'
  lift: LiftKey | null
}

const DEFAULT_SESSIONS_PER_WEEK = 3
const DEFAULT_SESSION_DISTRIBUTION = 'd25_33_42'
const DEFAULT_COMP_VARIANT = 'variant_1'
const DEFAULT_COMP_VARIANT_LABEL = 'Comp variant'

interface VariantOption {
  code: string
  label: string
}

const normalizeVariantCode = (rawVariant: string | undefined, options: VariantOption[]): string => {
  if (!rawVariant || rawVariant === 'comp') return DEFAULT_COMP_VARIANT

  if (options.some(option => option.code === rawVariant)) {
    return rawVariant
  }

  const matchedByLabel = options.find(option => option.label === rawVariant)
  return matchedByLabel?.code || DEFAULT_COMP_VARIANT
}

const getLiftVariantOptions = (liftVariants: [string, string, string]): VariantOption[] => {
  const options: VariantOption[] = [
    { code: 'variant_1', label: 'Variant 1 (Comp)' },
  ]

  liftVariants.forEach((rawName, index) => {
    const name = rawName.trim()
    if (!name) return

    const variantNumber = index + 2
    options.push({
      code: `variant_${variantNumber}`,
      label: `Variant ${variantNumber} (${name})`,
    })
  })

  return options
}

const getLiftLabel = (lift: string) => (
  lift === 'squat' ? 'Squat' :
  lift === 'bench_press' ? 'Bench Press' :
  lift === 'deadlift' ? 'Deadlift' : lift
)

const LIFT_KEYS: LiftKey[] = ['squat', 'bench_press', 'deadlift']
const SESSION_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

const toClientSlug = (name: string) => {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || 'client'
}

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
  const [isFlexibleBridgeMode, setIsFlexibleBridgeMode] = useState(false)
  const [isEditingExistingProgram, setIsEditingExistingProgram] = useState(false)
  const [editingTemplateSlug, setEditingTemplateSlug] = useState<string | null>(null)
  const [editingTemplateMeta, setEditingTemplateMeta] = useState<EditingTemplateMeta | null>(null)
  const [editingTemplateDescription, setEditingTemplateDescription] = useState<string>('')
  const [programInstructions, setProgramInstructions] = useState<string>('')
  const [isProgramPinned, setIsProgramPinned] = useState(false)
  const [clientRmProfiles, setClientRmProfiles] = useState<Record<string, Record<number, number>> | null>(null)
  const [existingClients, setExistingClients] = useState<ExistingClientSummary[]>([])
  const [existingClientsLoading, setExistingClientsLoading] = useState(false)
  const [selectedExistingClientSlug, setSelectedExistingClientSlug] = useState('')
  const [liftTemplates, setLiftTemplates] = useState<TemplateSummary[]>([])
  const [liftTemplatesLoading, setLiftTemplatesLoading] = useState(false)
  const [selectedLiftTemplateByLift, setSelectedLiftTemplateByLift] = useState<Record<LiftKey, string>>({
    squat: '',
    bench_press: '',
    deadlift: '',
  })
  const loadedProgramKeyRef = useRef<string | null>(null)
  const lastDeterministicRecalcKeyRef = useRef<string>('')
  const isApplyingTemplatesRef = useRef(false)

  // Default lift configuration
  const defaultLiftConfig = (oneRM: number, volume: number) => ({
    oneRM,
    rounding: 2.5,
    volume,
    weight_55: Math.round((oneRM * 0.55) / 2.5) * 2.5,
    weight_65: Math.round((oneRM * 0.65) / 2.5) * 2.5,
    weight_75: Math.round((oneRM * 0.75) / 2.5) * 2.5,
    weight_85: Math.round((oneRM * 0.85) / 2.5) * 2.5,
    weight_90: Math.round((oneRM * 0.925) / 2.5) * 2.5,
    weight_95: Math.round((oneRM * 0.95) / 2.5) * 2.5,
    include_55_zone: false,
    zone_55_percent: 0,
    zone_75_percent: 45,
    zone_85_percent: 13,
    zone_90_total_reps: 4,
    zone_95_total_reps: 0,
    volume_pattern_main: '3a',
    volume_pattern_8190: '3a',
    variants: ['', '', ''] as [string, string, string],
  })

  type LiftConfig = ReturnType<typeof defaultLiftConfig>

  const getTemplateLiftConfig = useCallback((
    templateInput: Record<string, unknown>,
    lift: LiftKey,
    fallbackOneRm: number,
    fallbackVolume: number,
  ): LiftConfig => {
    const inputLift = (templateInput[lift] || {}) as Record<string, unknown>
    const weights = (inputLift.weights || {}) as Record<string, number>
    const intensity = (inputLift.intensity_distribution || {}) as Record<string, number>
    const variants = (inputLift.variants || {}) as Record<string, string>

    return {
      oneRM: Number(inputLift.one_rm ?? fallbackOneRm),
      rounding: Number(inputLift.rounding ?? 2.5),
      volume: Number(inputLift.volume ?? fallbackVolume),
      weight_55: Number(weights['55'] ?? Math.round((fallbackOneRm * 0.55) / 2.5) * 2.5),
      weight_65: Number(weights['65'] ?? Math.round((fallbackOneRm * 0.65) / 2.5) * 2.5),
      weight_75: Number(weights['75'] ?? Math.round((fallbackOneRm * 0.75) / 2.5) * 2.5),
      weight_85: Number(weights['85'] ?? Math.round((fallbackOneRm * 0.85) / 2.5) * 2.5),
      weight_90: Number(weights['90'] ?? Math.round((fallbackOneRm * 0.925) / 2.5) * 2.5),
      weight_95: Number(weights['95'] ?? Math.round((fallbackOneRm * 0.95) / 2.5) * 2.5),
      include_55_zone: Number(intensity['55_percent'] ?? 0) > 0,
      zone_55_percent: Number(intensity['55_percent'] ?? 0),
      zone_75_percent: Number(intensity['75_percent'] ?? 45),
      zone_85_percent: Number(intensity['85_percent'] ?? 13),
      zone_90_total_reps: Number(intensity['90_total_reps'] ?? 4),
      zone_95_total_reps: Number(intensity['95_total_reps'] ?? 0),
      volume_pattern_main: String(inputLift.volume_pattern_main ?? '3a'),
      volume_pattern_8190: String(inputLift.volume_pattern_8190 ?? '3a'),
      variants: [
        String(variants.variant_2 ?? ''),
        String(variants.variant_3 ?? ''),
        String(variants.variant_4 ?? ''),
      ] as [string, string, string],
    }
  }, [])

  // Form state - now with 3 lifts
  const [formData, setFormData] = useState<{
    clientName: string
    delta: 'beginner' | 'intermediate' | 'advanced' | 'elite'
    block: 'prep' | 'comp'
    lifts: {
      squat: LiftConfig
      bench_press: LiftConfig
      deadlift: LiftConfig
    }
  }>({
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
    variants: {
      variant_1: DEFAULT_COMP_VARIANT_LABEL,
      ...(liftData.variants[0].trim() ? { variant_2: liftData.variants[0].trim() } : {}),
      ...(liftData.variants[1].trim() ? { variant_3: liftData.variants[1].trim() } : {}),
      ...(liftData.variants[2].trim() ? { variant_4: liftData.variants[2].trim() } : {}),
    },
    weights: {
      '55': liftData.weight_55,
      '65': liftData.weight_65,
      '75': liftData.weight_75,
      '85': liftData.weight_85,
      '90': liftData.weight_90,
      '95': liftData.weight_95,
    },
    intensity_distribution: {
      '55_percent': liftData.include_55_zone ? liftData.zone_55_percent : 0,
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
    const activeLiftKeys: LiftKey[] = (
      editingTemplateSlug &&
      editingTemplateMeta?.scope === 'single_lift' &&
      editingTemplateMeta.lift
    )
      ? [editingTemplateMeta.lift]
      : ['squat', 'bench_press', 'deadlift']

    const lifts = activeLiftKeys.reduce((acc, lift) => {
      acc[lift] = buildLiftPayload(formData.lifts[lift])
      return acc
    }, {} as Partial<Record<LiftKey, LiftInputPayload>>)

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
      lifts,
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
        ...(programInstructions.trim() ? { notes: programInstructions.trim() } : {}),
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

  const isSkillLevel = (
    value: unknown,
  ): value is 'beginner' | 'intermediate' | 'advanced' | 'elite' => (
    value === 'beginner' ||
    value === 'intermediate' ||
    value === 'advanced' ||
    value === 'elite'
  )

  const applyClientToForm = useCallback((client: ExistingClientSummary) => {
    setFormData(prev => {
      const roundWeight = (oneRM: number, percentage: number, rounding: number): number => {
        const raw = oneRM * (percentage / 100)
        return Math.round(raw / rounding) * rounding
      }

      const updateLiftWithOneRm = (liftData: LiftConfig, oneRM: number | null | undefined): LiftConfig => {
        const numeric = Number(oneRM)
        if (!Number.isFinite(numeric) || numeric <= 0) return liftData

        return {
          ...liftData,
          oneRM: numeric,
          weight_55: roundWeight(numeric, 55, liftData.rounding),
          weight_65: roundWeight(numeric, 65, liftData.rounding),
          weight_75: roundWeight(numeric, 75, liftData.rounding),
          weight_85: roundWeight(numeric, 85, liftData.rounding),
          weight_90: roundWeight(numeric, 92.5, liftData.rounding),
          weight_95: roundWeight(numeric, 95, liftData.rounding),
        }
      }

      return {
        ...prev,
        clientName: client.name,
        delta: isSkillLevel(client.skill_level) ? client.skill_level : prev.delta,
        lifts: {
          squat: updateLiftWithOneRm(prev.lifts.squat, client.latest_one_rm?.squat),
          bench_press: updateLiftWithOneRm(prev.lifts.bench_press, client.latest_one_rm?.bench_press),
          deadlift: updateLiftWithOneRm(prev.lifts.deadlift, client.latest_one_rm?.deadlift),
        },
      }
    })
    setIsSaved(false)
  }, [])

  const recalculateDeterministic = () => {
    if ((isEditingExistingProgram || isProgramPinned) && !editingTemplateSlug) return

    try {
      const payload = buildGeneratePayload()
      const calculated = calculateAllTargets(
        payload.lifts,
        payload.client.delta,
        payload.weeks,
      ) as unknown as ProgramData['calculated']
      const programData = buildProgramData(payload, {
        calculated,
        sessions: editingTemplateSlug
          ? (calculatedResults?.sessions || {} as SessionsData)
          : ({} as SessionsData),
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
      const requestPayload = {
        ...payload,
        ...(calculatedResults ? { calculated: calculatedResults.calculated } : {}),
      }

      // Call AI generation API (preview only, no DB save)
      const response = await fetch('/api/generate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      })

      const result: GenerateProgramResponse = await response.json()

      if (!result.program) {
        throw new Error(result.error || 'Failed to generate program')
      }

      const programData = buildProgramData(payload, result.program)
      setCalculatedResults(programData)
      setIsProgramPinned(true)

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

  // Deterministic recalculation on input changes that affect calculations
  useEffect(() => {
    // In template edit mode, keep persisted calculated targets as the source of truth.
    // Recalculation is explicit via the "Recalculate targets" button.
    if (editingTemplateSlug) {
      return
    }

    const recalculationKey = JSON.stringify({
      delta: formData.delta,
      block: formData.block,
      lifts: {
        squat: {
          oneRM: formData.lifts.squat.oneRM,
          rounding: formData.lifts.squat.rounding,
          volume: formData.lifts.squat.volume,
          weight_55: formData.lifts.squat.weight_55,
          weight_65: formData.lifts.squat.weight_65,
          weight_75: formData.lifts.squat.weight_75,
          weight_85: formData.lifts.squat.weight_85,
          weight_90: formData.lifts.squat.weight_90,
          weight_95: formData.lifts.squat.weight_95,
          include_55_zone: formData.lifts.squat.include_55_zone,
          zone_55_percent: formData.lifts.squat.zone_55_percent,
          zone_75_percent: formData.lifts.squat.zone_75_percent,
          zone_85_percent: formData.lifts.squat.zone_85_percent,
          zone_90_total_reps: formData.lifts.squat.zone_90_total_reps,
          zone_95_total_reps: formData.lifts.squat.zone_95_total_reps,
          volume_pattern_main: formData.lifts.squat.volume_pattern_main,
          volume_pattern_8190: formData.lifts.squat.volume_pattern_8190,
        },
        bench_press: {
          oneRM: formData.lifts.bench_press.oneRM,
          rounding: formData.lifts.bench_press.rounding,
          volume: formData.lifts.bench_press.volume,
          weight_55: formData.lifts.bench_press.weight_55,
          weight_65: formData.lifts.bench_press.weight_65,
          weight_75: formData.lifts.bench_press.weight_75,
          weight_85: formData.lifts.bench_press.weight_85,
          weight_90: formData.lifts.bench_press.weight_90,
          weight_95: formData.lifts.bench_press.weight_95,
          include_55_zone: formData.lifts.bench_press.include_55_zone,
          zone_55_percent: formData.lifts.bench_press.zone_55_percent,
          zone_75_percent: formData.lifts.bench_press.zone_75_percent,
          zone_85_percent: formData.lifts.bench_press.zone_85_percent,
          zone_90_total_reps: formData.lifts.bench_press.zone_90_total_reps,
          zone_95_total_reps: formData.lifts.bench_press.zone_95_total_reps,
          volume_pattern_main: formData.lifts.bench_press.volume_pattern_main,
          volume_pattern_8190: formData.lifts.bench_press.volume_pattern_8190,
        },
        deadlift: {
          oneRM: formData.lifts.deadlift.oneRM,
          rounding: formData.lifts.deadlift.rounding,
          volume: formData.lifts.deadlift.volume,
          weight_55: formData.lifts.deadlift.weight_55,
          weight_65: formData.lifts.deadlift.weight_65,
          weight_75: formData.lifts.deadlift.weight_75,
          weight_85: formData.lifts.deadlift.weight_85,
          weight_90: formData.lifts.deadlift.weight_90,
          weight_95: formData.lifts.deadlift.weight_95,
          include_55_zone: formData.lifts.deadlift.include_55_zone,
          zone_55_percent: formData.lifts.deadlift.zone_55_percent,
          zone_75_percent: formData.lifts.deadlift.zone_75_percent,
          zone_85_percent: formData.lifts.deadlift.zone_85_percent,
          zone_90_total_reps: formData.lifts.deadlift.zone_90_total_reps,
          zone_95_total_reps: formData.lifts.deadlift.zone_95_total_reps,
          volume_pattern_main: formData.lifts.deadlift.volume_pattern_main,
          volume_pattern_8190: formData.lifts.deadlift.volume_pattern_8190,
        },
      },
    })

    if (recalculationKey === lastDeterministicRecalcKeyRef.current) {
      return
    }

    lastDeterministicRecalcKeyRef.current = recalculationKey
    recalculateDeterministic()
  }, [formData, isEditingExistingProgram, isProgramPinned])

  useEffect(() => {
    let cancelled = false

    const loadExistingClients = async () => {
      setExistingClientsLoading(true)
      try {
        const response = await fetch('/api/clients')
        if (!response.ok) throw new Error('Failed to load clients')

        const data = await response.json()
        const clients = Array.isArray(data?.clients) ? data.clients as ExistingClientSummary[] : []
        if (cancelled) return

        setExistingClients(clients)
      } catch (error) {
        console.error('Error loading existing clients:', error)
        if (!cancelled) setExistingClients([])
      } finally {
        if (!cancelled) setExistingClientsLoading(false)
      }
    }

    loadExistingClients()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (editingTemplateSlug) return

    let cancelled = false
    const loadLiftTemplates = async () => {
      setLiftTemplatesLoading(true)
      try {
        const response = await fetch('/api/program-templates')
        if (!response.ok) throw new Error('Failed to load lift templates')

        const data = await response.json() as TemplateListResponse
        if (cancelled) return

        const templates = Array.isArray(data.templates) ? data.templates : []
        setLiftTemplates(templates)
      } catch (error) {
        console.error('Error loading lift templates:', error)
        if (!cancelled) setLiftTemplates([])
      } finally {
        if (!cancelled) setLiftTemplatesLoading(false)
      }
    }

    loadLiftTemplates()
    return () => {
      cancelled = true
    }
  }, [editingTemplateSlug])

  useEffect(() => {
    if (existingClients.length === 0) {
      setSelectedExistingClientSlug('')
      return
    }

    const selectedClient = existingClients.find(c => c.slug === selectedExistingClientSlug)
    const clientByName = existingClients.find(c => c.name === formData.clientName)
    const fallbackClient = selectedClient || clientByName || existingClients[0]
    if (!fallbackClient) return

    if (selectedExistingClientSlug !== fallbackClient.slug) {
      setSelectedExistingClientSlug(fallbackClient.slug)
    }

    if (!isNewClient && !isEditingExistingProgram && formData.clientName !== fallbackClient.name) {
      applyClientToForm(fallbackClient)
    }
  }, [existingClients, selectedExistingClientSlug, formData.clientName, isNewClient, isEditingExistingProgram, applyClientToForm])

  const applySelectedLiftTemplates = async () => {
    if (editingTemplateSlug) return

    const isLiftKey = (value: unknown): value is LiftKey => (
      value === 'squat' || value === 'bench_press' || value === 'deadlift'
    )

    const remapTemplateSessionsLift = (
      sessionsTemplate: unknown,
      sourceLift: LiftKey,
      targetLift: LiftKey,
    ): unknown => {
      if (sourceLift === targetLift) return sessionsTemplate
      if (!sessionsTemplate || typeof sessionsTemplate !== 'object') return sessionsTemplate

      const clone = JSON.parse(JSON.stringify(sessionsTemplate)) as Record<string, unknown>
      for (const sessionValue of Object.values(clone)) {
        if (!sessionValue || typeof sessionValue !== 'object') continue
        for (const weekValue of Object.values(sessionValue as Record<string, unknown>)) {
          if (!weekValue || typeof weekValue !== 'object') continue
          const weekRecord = weekValue as Record<string, unknown>
          const liftsRaw = Array.isArray(weekRecord.lifts) ? weekRecord.lifts : []
          weekRecord.lifts = liftsRaw.map((liftData) => {
            if (!liftData || typeof liftData !== 'object') return liftData
            const liftRecord = liftData as Record<string, unknown>
            if (liftRecord.lift !== sourceLift) return liftData
            return { ...liftRecord, lift: targetLift }
          })
        }
      }

      return clone
    }

    const filterTemplateSessionsToLift = (
      sessionsTemplate: unknown,
      allowedLift: LiftKey,
    ): unknown => {
      if (!sessionsTemplate || typeof sessionsTemplate !== 'object') return sessionsTemplate

      const clone = JSON.parse(JSON.stringify(sessionsTemplate)) as Record<string, unknown>
      for (const sessionValue of Object.values(clone)) {
        if (!sessionValue || typeof sessionValue !== 'object') continue
        for (const weekValue of Object.values(sessionValue as Record<string, unknown>)) {
          if (!weekValue || typeof weekValue !== 'object') continue
          const weekRecord = weekValue as Record<string, unknown>
          const liftsRaw = Array.isArray(weekRecord.lifts) ? weekRecord.lifts : []
          weekRecord.lifts = liftsRaw.filter((liftData) => {
            if (!liftData || typeof liftData !== 'object') return false
            return (liftData as Record<string, unknown>).lift === allowedLift
          })
        }
      }

      return clone
    }

    const selections = LIFT_KEYS
      .map((lift) => [lift, (selectedLiftTemplateByLift[lift] || '').trim()] as [LiftKey, string])
      .filter(([, slug]) => slug.length > 0)

    if (selections.length === 0) {
      alert('Select at least one lift template first.')
      return
    }

    isApplyingTemplatesRef.current = true
    setLoading(true)
    try {
      const detailResults = await Promise.all(
        selections.map(async ([lift, slug]) => {
          const response = await fetch(`/api/program-templates/${encodeURIComponent(slug)}`)
          const data = await response.json() as TemplateDetailResponse
          if (!response.ok || !data.template) {
            const message = (data as { error?: string })?.error
            throw new Error(message || `Failed to load template "${slug}"`)
          }

          const template = data.template
          if (template.scope !== 'single_lift' && template.scope !== 'full') {
            throw new Error(`Template "${template.name}" has unsupported scope.`)
          }
          if (template.weeks !== 4) {
            throw new Error(`Template "${template.name}" has ${template.weeks} weeks. Create Program editor currently supports 4 weeks.`)
          }

          const templateInput = (template.input && typeof template.input === 'object')
            ? template.input as Record<string, unknown>
            : {}
          const templateCalculated = (template.calculated && typeof template.calculated === 'object')
            ? template.calculated as Record<string, unknown>
            : {}

          const inputLiftCandidates = Object.keys(templateInput).filter(isLiftKey)
          const calculatedLiftCandidates = Object.keys(templateCalculated).filter(isLiftKey)

          let sourceLift: LiftKey | null = null
          if (template.scope === 'full') {
            if (inputLiftCandidates.includes(lift) || calculatedLiftCandidates.includes(lift)) {
              sourceLift = lift
            } else {
              sourceLift = inputLiftCandidates[0] || calculatedLiftCandidates[0] || null
            }
          } else {
            sourceLift = isLiftKey(template.lift)
              ? template.lift
              : (inputLiftCandidates[0] || calculatedLiftCandidates[0] || null)
          }

          if (!sourceLift) {
            throw new Error(`Template "${template.name}" has no valid source lift payload.`)
          }

          return { lift, template, sourceLift, templateInput, templateCalculated }
        }),
      )

      const blockSet = new Set(detailResults.map(({ template }) => template.block))
      if (blockSet.size > 1) {
        throw new Error('Selected templates must use the same block (prep/comp).')
      }

      const targetBlock = detailResults[0]?.template.block ?? formData.block
      const clientOneRm: Record<LiftKey, number> = {
        squat: formData.lifts.squat.oneRM,
        bench_press: formData.lifts.bench_press.oneRM,
        deadlift: formData.lifts.deadlift.oneRM,
      }

      const nextLifts = { ...formData.lifts }
      const nextInput: Partial<Record<LiftKey, LiftInputPayload>> = {
        ...(calculatedResults?.input || {}),
      }
      const nextCalculated: ProgramData['calculated'] = {
        ...(calculatedResults?.calculated || {}),
      }

      const baseSessions: SessionsData = calculatedResults?.sessions
        ? JSON.parse(JSON.stringify(calculatedResults.sessions))
        : {} as SessionsData
      const weekKeys: WeekKey[] = ['week_1', 'week_2', 'week_3', 'week_4']
      const sessionsByLift: Partial<Record<LiftKey, SessionsData>> = {}

      for (const { lift, template, sourceLift, templateInput, templateCalculated } of detailResults) {
        const sourceLiftInput = (templateInput[sourceLift] && typeof templateInput[sourceLift] === 'object')
          ? templateInput[sourceLift] as Record<string, unknown>
          : null
        if (!sourceLiftInput) {
          throw new Error(`Template "${template.name}" is missing source lift input (${getLiftLabel(sourceLift)}).`)
        }

        const clientInput = buildClientInputFromTemplateInput({ [lift]: sourceLiftInput }, clientOneRm)
        const liftInputRecord = (clientInput[lift] && typeof clientInput[lift] === 'object')
          ? clientInput[lift] as Record<string, unknown>
          : null
        if (!liftInputRecord) {
          throw new Error(`Template "${template.name}" cannot be mapped to ${getLiftLabel(lift)} input.`)
        }

        const fallbackVolume = lift === 'squat' ? 350 : (lift === 'bench_press' ? 300 : 250)
        nextLifts[lift] = getTemplateLiftConfig(clientInput, lift, clientOneRm[lift], fallbackVolume)
        nextInput[lift] = buildLiftPayload(nextLifts[lift])

        const calculatedLiftRaw = templateCalculated[sourceLift]
        if (calculatedLiftRaw && typeof calculatedLiftRaw === 'object') {
          const calculatedLift = JSON.parse(JSON.stringify(calculatedLiftRaw)) as Record<string, unknown>
          const weights = (liftInputRecord.weights && typeof liftInputRecord.weights === 'object')
            ? liftInputRecord.weights as Record<string, number>
            : null
          if (weights && calculatedLift._summary && typeof calculatedLift._summary === 'object') {
            calculatedLift._summary = {
              ...(calculatedLift._summary as Record<string, unknown>),
              weights,
            }
          }
          nextCalculated[lift] = calculatedLift as ProgramData['calculated'][string]
        } else if (nextInput[lift]) {
          const fallbackCalculated = calculateAllTargets(
            { [lift]: nextInput[lift] },
            formData.delta,
            4,
          ) as unknown as ProgramData['calculated']
          if (fallbackCalculated[lift]) nextCalculated[lift] = fallbackCalculated[lift]
        }

        const filteredSessionsTemplate = filterTemplateSessionsToLift(
          template.sessionsTemplate || {},
          sourceLift,
        )
        const remappedSessionsTemplate = remapTemplateSessionsLift(
          filteredSessionsTemplate,
          sourceLift,
          lift,
        )
        sessionsByLift[lift] = materializeSessionsForClient(
          remappedSessionsTemplate,
          clientInput,
        ) as unknown as SessionsData
      }

      for (const lift of LIFT_KEYS) {
        if (!nextInput[lift]) {
          nextInput[lift] = buildLiftPayload(nextLifts[lift])
        }
      }

      const missingCalculatedLifts = LIFT_KEYS.filter((lift) => !nextCalculated[lift])
      if (missingCalculatedLifts.length > 0) {
        const fallbackCalculated = calculateAllTargets(
          nextInput as Record<string, LiftInputPayload>,
          formData.delta,
          4,
        ) as unknown as ProgramData['calculated']
        for (const lift of missingCalculatedLifts) {
          if (fallbackCalculated[lift]) nextCalculated[lift] = fallbackCalculated[lift]
        }
      }

      const selectedLiftSet = new Set(detailResults.map(({ lift }) => lift))
      const allSessionKeys = new Set<string>(Object.keys(baseSessions).filter(key => /^[A-Z]$/.test(key)))
      for (const sessionData of Object.values(sessionsByLift)) {
        Object.keys(sessionData || {}).forEach((sessionKey) => {
          if (/^[A-Z]$/.test(sessionKey)) allSessionKeys.add(sessionKey)
        })
      }

      for (const sessionKey of allSessionKeys) {
        if (!baseSessions[sessionKey]) {
          baseSessions[sessionKey] = {
            week_1: { lifts: [] },
            week_2: { lifts: [] },
            week_3: { lifts: [] },
            week_4: { lifts: [] },
          }
        }

        for (const weekKey of weekKeys) {
          if (!baseSessions[sessionKey][weekKey]) {
            baseSessions[sessionKey][weekKey] = { lifts: [] }
          }
        }
      }

      for (const lift of selectedLiftSet) {
        const sourceSessions = sessionsByLift[lift] || ({} as SessionsData)

        for (const sessionKey of allSessionKeys) {
          for (const weekKey of weekKeys) {
            const week = baseSessions[sessionKey][weekKey]
            const sourceLiftEntry = sourceSessions[sessionKey]?.[weekKey]?.lifts?.find(item => item.lift === lift)
            const nextSets = Array.isArray(sourceLiftEntry?.sets)
              ? sourceLiftEntry.sets.map((set) => ({
                weight: Number(set.weight),
                reps: Number(set.reps),
                percentage: Number(set.percentage),
                ...(set.variant ? { variant: String(set.variant) } : {}),
              }))
              : []

            const existingIndex = week.lifts.findIndex(item => item.lift === lift)
            if (existingIndex >= 0) {
              week.lifts[existingIndex] = { ...week.lifts[existingIndex], sets: nextSets }
            } else {
              week.lifts.push({ lift, sets: nextSets })
            }
          }
        }
      }

      const today = new Date().toISOString().split('T')[0]
      const endDate = new Date(Date.now() + 4 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      setIsProgramPinned(true)
      setFormData(prev => ({
        ...prev,
        block: targetBlock,
        lifts: nextLifts,
      }))
      setCalculatedResults(prev => ({
        schema_version: prev?.schema_version || '1.2',
        meta: {
          filename: `${today}_${toClientSlug(formData.clientName)}_${targetBlock}_all_lifts.json`,
          created_at: prev?.meta.created_at || new Date().toISOString(),
          created_by: prev?.meta.created_by || 'AI Generator',
          status: prev?.meta.status || 'draft',
          ...(prev?.meta?.notes ? { notes: prev.meta.notes } : (programInstructions.trim() ? { notes: programInstructions.trim() } : {})),
        },
        client: {
          name: formData.clientName,
          delta: formData.delta,
          one_rm: {
            squat: nextLifts.squat.oneRM,
            bench_press: nextLifts.bench_press.oneRM,
            deadlift: nextLifts.deadlift.oneRM,
          },
        },
        program_info: {
          block: targetBlock,
          start_date: prev?.program_info.start_date || today,
          end_date: prev?.program_info.end_date || endDate,
          weeks: prev?.program_info.weeks || 4,
        },
        input: nextInput,
        calculated: nextCalculated,
        sessions: baseSessions,
      }))
      setIsSaved(false)
    } catch (error) {
      console.error('Error applying selected lift templates:', error)
      alert(error instanceof Error ? error.message : 'Failed to apply selected lift templates')
    } finally {
      setLoading(false)
      isApplyingTemplatesRef.current = false
    }
  }

  useEffect(() => {
    if (!isProgramPinned || !calculatedResults) return

    const payload = buildGeneratePayload()
    const today = new Date().toISOString().split('T')[0]

    setCalculatedResults(prev => {
      if (!prev) return prev

      return {
        ...prev,
        meta: {
          ...prev.meta,
          filename: editingTemplateSlug
            ? `template_${editingTemplateSlug}.json`
            : `${today}_${payload.clientSlug}_${payload.block}_all_lifts.json`,
        },
        client: payload.client,
        program_info: {
          ...prev.program_info,
          block: payload.block,
          weeks: payload.weeks,
        },
        input: payload.lifts,
      }
    })
  }, [formData, isProgramPinned, editingTemplateSlug])

  // Fetch RM profile when client name changes (for ARE display)
  useEffect(() => {
    if (editingTemplateSlug) {
      setClientRmProfiles(null)
      return
    }

    const slug = toClientSlug(formData.clientName)
    if (!slug || slug.length < 2) {
      setClientRmProfiles(null)
      return
    }

    let cancelled = false
    const fetchRmProfile = async () => {
      try {
        const resp = await fetch(`/api/clients/${encodeURIComponent(slug)}`)
        if (!resp.ok || cancelled) return
        const data = await resp.json()
        const survey = data.client?.survey
        if (cancelled) return
        if (survey) {
          const { buildRmProfileFromSurvey } = await import('@/lib/program/are')
          const prof = buildRmProfileFromSurvey(survey)
          if (!cancelled) setClientRmProfiles(prof)
        } else {
          if (!cancelled) setClientRmProfiles(null)
        }
      } catch {
        if (!cancelled) setClientRmProfiles(null)
      }
    }

    const timer = setTimeout(fetchRmProfile, 500)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [formData.clientName, editingTemplateSlug])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const editTemplate = params.get('editTemplate')
    if (editTemplate) {
      const loadKey = `template:${editTemplate}`
      if (loadedProgramKeyRef.current === loadKey) return
      loadedProgramKeyRef.current = loadKey

      const loadTemplateForEditing = async () => {
        try {
          setLoading(true)
          const response = await fetch(`/api/program-templates/${encodeURIComponent(editTemplate)}`)
          if (!response.ok) throw new Error('Failed to load template for editing')

          const data = await response.json() as TemplateDetailResponse
          const template = data.template
          if (!template) throw new Error('Template payload missing')

          setEditingTemplateSlug(template.slug)
          setEditingTemplateMeta({
            scope: template.scope,
            lift: template.lift,
          })
        setEditingTemplateDescription((template.description || '').trim())
        setProgramInstructions('')
        setIsEditingExistingProgram(true)

          const templateInput = (template.input && typeof template.input === 'object')
            ? template.input as Record<string, unknown>
            : {}
          const squatCfg = getTemplateLiftConfig(templateInput, 'squat', 100, 350)
          const benchCfg = getTemplateLiftConfig(templateInput, 'bench_press', 100, 300)
          const deadCfg = getTemplateLiftConfig(templateInput, 'deadlift', 100, 250)

          setFormData({
            clientName: template.name || 'Template',
            delta: 'intermediate',
            block: template.block,
            lifts: {
              squat: squatCfg,
              bench_press: benchCfg,
              deadlift: deadCfg,
            },
          })

          const today = new Date().toISOString().split('T')[0]
          const endDate = new Date(Date.now() + template.weeks * 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0]

          const sessions = materializeSessionsForClient(
            template.sessionsTemplate || {},
            templateInput,
          ) as unknown as SessionsData

          const programForEditor = {
            schema_version: template.schemaVersion || '1.2',
            meta: {
              filename: `template_${template.slug}.json`,
              created_at: template.createdAt || new Date().toISOString(),
              created_by: template.createdBy || 'Template',
              status: 'draft',
            },
            client: {
              name: template.name || 'Template',
              delta: 'intermediate',
              one_rm: {
                squat: squatCfg.oneRM,
                bench_press: benchCfg.oneRM,
                deadlift: deadCfg.oneRM,
              },
            },
            program_info: {
              block: template.block,
              start_date: today,
              end_date: endDate,
              weeks: template.weeks,
            },
            input: (template.input || {}) as ProgramData['input'],
            calculated: (template.calculated || {}) as ProgramData['calculated'],
            sessions,
          } as ProgramData

          setCalculatedResults(programForEditor)
          setIsEditMode(false)
          setIsNewClient(true)
          setIsSaved(true)
          setIsProgramPinned(true)
        } catch (error) {
          console.error('Error loading template for editing:', error)
        } finally {
          setLoading(false)
        }
      }

      loadTemplateForEditing()
      return
    }

    const editClient = params.get('editClient')
    const editFilename = params.get('editFilename')
    if (!editClient || !editFilename) return

    const loadKey = `${editClient}:${editFilename}`
    if (loadedProgramKeyRef.current === loadKey) return
    loadedProgramKeyRef.current = loadKey

    const loadProgramForEditing = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/programs/${encodeURIComponent(editClient)}/${encodeURIComponent(editFilename)}`)
        if (!response.ok) throw new Error('Failed to load program for editing')

        const data = await response.json()
        const program = data?.program as ProgramData | undefined
        if (!program) throw new Error('Program payload missing')

        setIsEditingExistingProgram(true)
        setEditingTemplateSlug(null)
        setEditingTemplateMeta(null)
        setEditingTemplateDescription('')
        setProgramInstructions(((program.meta as { notes?: string } | undefined)?.notes || '').trim())

        const getLiftConfigFromProgram = (lift: LiftKey, fallbackOneRm: number, fallbackVolume: number) => {
          const inputLift = (program.input?.[lift] || {}) as any
          const weights = (inputLift.weights || {}) as Record<string, number>
          const intensity = (inputLift.intensity_distribution || {}) as Record<string, number>
          const variants = (inputLift.variants || {}) as Record<string, string>

          return {
            oneRM: Number(inputLift.one_rm ?? program.client.one_rm[lift] ?? fallbackOneRm),
            rounding: Number(inputLift.rounding ?? 2.5),
            volume: Number(inputLift.volume ?? fallbackVolume),
            weight_55: Number(weights['55'] ?? Math.round((fallbackOneRm * 0.55) / 2.5) * 2.5),
            weight_65: Number(weights['65'] ?? Math.round((fallbackOneRm * 0.65) / 2.5) * 2.5),
            weight_75: Number(weights['75'] ?? Math.round((fallbackOneRm * 0.75) / 2.5) * 2.5),
            weight_85: Number(weights['85'] ?? Math.round((fallbackOneRm * 0.85) / 2.5) * 2.5),
            weight_90: Number(weights['90'] ?? Math.round((fallbackOneRm * 0.925) / 2.5) * 2.5),
            weight_95: Number(weights['95'] ?? Math.round((fallbackOneRm * 0.95) / 2.5) * 2.5),
            include_55_zone: Number(intensity['55_percent'] ?? 0) > 0,
            zone_55_percent: Number(intensity['55_percent'] ?? 0),
            zone_75_percent: Number(intensity['75_percent'] ?? 45),
            zone_85_percent: Number(intensity['85_percent'] ?? 13),
            zone_90_total_reps: Number(intensity['90_total_reps'] ?? 4),
            zone_95_total_reps: Number(intensity['95_total_reps'] ?? 0),
            volume_pattern_main: String(inputLift.volume_pattern_main ?? '3a'),
            volume_pattern_8190: String(inputLift.volume_pattern_8190 ?? '3a'),
            variants: [
              String(variants.variant_2 ?? ''),
              String(variants.variant_3 ?? ''),
              String(variants.variant_4 ?? ''),
            ] as [string, string, string],
          }
        }

        setFormData({
          clientName: program.client.name,
          delta: program.client.delta,
          block: program.program_info.block,
          lifts: {
            squat: getLiftConfigFromProgram('squat', program.client.one_rm.squat, 350),
            bench_press: getLiftConfigFromProgram('bench_press', program.client.one_rm.bench_press, 300),
            deadlift: getLiftConfigFromProgram('deadlift', program.client.one_rm.deadlift, 250),
          },
        })

        setCalculatedResults(program)
        setIsEditMode(true)
        setIsNewClient(false)
        setIsSaved(true)
        setIsProgramPinned(true)

        // If program already has rm_profile snapshot, use it directly
        // (the clientName effect will also fire, but snapshot takes priority
        //  for historical accuracy — set it here so it's available immediately)
        const existingRmProfile = (program as any).client?.rm_profile
        if (existingRmProfile) {
          setClientRmProfiles(existingRmProfile)
        }
        // Otherwise the clientName effect will fetch from current survey
      } catch (error) {
        console.error('Error loading existing program for editing:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProgramForEditing()
  }, [getTemplateLiftConfig])

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isApplyingTemplatesRef.current) return
    await triggerCalculation()
  }

  const handleSave = async () => {
    if (!calculatedResults) return

    try {
      setLoading(true)
      const normalizedNotes = programInstructions.trim()
      const programToSave: ProgramData = {
        ...calculatedResults,
        meta: {
          ...calculatedResults.meta,
          ...(normalizedNotes ? { notes: normalizedNotes } : {}),
        },
      }

      if (editingTemplateSlug) {
        const trimmedTemplateName = formData.clientName.trim()
        if (!trimmedTemplateName) {
          throw new Error('Template name is required')
        }

        const response = await fetch(`/api/program-templates/${encodeURIComponent(editingTemplateSlug)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            program: programToSave,
            name: trimmedTemplateName,
            description: editingTemplateDescription.trim(),
          }),
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to save template')
        }

        const updatedSlug = typeof data?.slug === 'string' && data.slug
          ? data.slug
          : editingTemplateSlug
        if (updatedSlug !== editingTemplateSlug) {
          setEditingTemplateSlug(updatedSlug)
          const params = new URLSearchParams(window.location.search)
          params.set('editTemplate', updatedSlug)
          const query = params.toString()
          window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`)
        }

        setIsSaved(true)
        alert('Template saved')
        return
      }

      const response = await fetch('/api/import-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(programToSave),
      })

      const data = await response.json()
      if (!response.ok) {
        const details = Array.isArray(data?.details)
          ? data.details.filter((item: unknown): item is string => typeof item === 'string')
          : []
        const detailText = details.length > 0 ? `\n${details.slice(0, 3).join('\n')}` : ''
        throw new Error(`${data?.error || 'Failed to save program'}${detailText}`)
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

  useEffect(() => {
    if (hasBridgePercentagesInSessions(calculatedResults?.sessions || null)) {
      setIsFlexibleBridgeMode(true)
    }
  }, [calculatedResults])

  const initializeManualSessions = () => {
    if (!calculatedResults) return

    const liftKeys = Object.keys(calculatedResults.calculated).filter((lift): lift is LiftKey => (
      lift === 'squat' || lift === 'bench_press' || lift === 'deadlift'
    ))

    const sessionLetters = new Set<string>()
    for (const lift of liftKeys) {
      const liftData = calculatedResults.calculated[lift] as Record<string, unknown>
      for (let week = 1; week <= 4; week++) {
        const weekData = liftData[`week_${week}`] as Record<string, unknown> | undefined
        const weekSessions = (weekData?.sessions && typeof weekData.sessions === 'object')
          ? weekData.sessions as Record<string, unknown>
          : {}
        Object.keys(weekSessions).forEach((sessionLetter) => sessionLetters.add(sessionLetter))
      }
    }

    const sortedSessions = [...sessionLetters].sort()
    if (sortedSessions.length === 0) {
      sortedSessions.push('A', 'B', 'C')
    }

    const sessions: SessionsData = {}
    for (const sessionLetter of sortedSessions) {
      sessions[sessionLetter] = {
        week_1: { lifts: liftKeys.map((lift) => ({ lift, sets: [] })) },
        week_2: { lifts: liftKeys.map((lift) => ({ lift, sets: [] })) },
        week_3: { lifts: liftKeys.map((lift) => ({ lift, sets: [] })) },
        week_4: { lifts: liftKeys.map((lift) => ({ lift, sets: [] })) },
      }
    }

    setCalculatedResults((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        sessions,
      }
    })

    setIsProgramPinned(true)
    setIsEditMode(true)
    setIsSaved(false)
  }

  const addSessionColumn = () => {
    if (!calculatedResults) return

    const existingKeys = new Set<string>(
      Object.keys(calculatedResults.sessions || {}).filter((key) => /^[A-Z]$/.test(key)),
    )
    const weekKeys: WeekKey[] = ['week_1', 'week_2', 'week_3', 'week_4']
    for (const lift of Object.keys(calculatedResults.calculated || {})) {
      const liftData = calculatedResults.calculated[lift]
      if (!liftData || typeof liftData !== 'object') continue
      for (const weekKey of weekKeys) {
        const weekSessions = (liftData[weekKey] as Record<string, unknown> | undefined)?.sessions
        if (!weekSessions || typeof weekSessions !== 'object') continue
        Object.keys(weekSessions).forEach((key) => {
          if (/^[A-Z]$/.test(key)) existingKeys.add(key)
        })
      }
    }

    const nextSessionKey = SESSION_LETTERS.find((key) => !existingKeys.has(key))
    if (!nextSessionKey) {
      alert('Cannot add more session columns (A-Z already used).')
      return
    }

    const liftKeys = Object.keys(calculatedResults.calculated).filter((lift): lift is LiftKey => (
      lift === 'squat' || lift === 'bench_press' || lift === 'deadlift'
    ))

    setCalculatedResults(prev => {
      if (!prev) return prev
      const nextSessions: SessionsData = JSON.parse(JSON.stringify(prev.sessions || {}))
      nextSessions[nextSessionKey] = {
        week_1: { lifts: liftKeys.map((lift) => ({ lift, sets: [] })) },
        week_2: { lifts: liftKeys.map((lift) => ({ lift, sets: [] })) },
        week_3: { lifts: liftKeys.map((lift) => ({ lift, sets: [] })) },
        week_4: { lifts: liftKeys.map((lift) => ({ lift, sets: [] })) },
      }

      return {
        ...prev,
        sessions: nextSessions,
      }
    })

    setIsProgramPinned(true)
    setIsEditMode(true)
    setIsSaved(false)
  }

  const plannedSessionKeys = useMemo(() => {
    const keys = new Set<string>()
    if (!calculatedResults) return keys

    const weekKeys: WeekKey[] = ['week_1', 'week_2', 'week_3', 'week_4']
    for (const liftData of Object.values(calculatedResults.calculated || {})) {
      if (!liftData || typeof liftData !== 'object') continue
      for (const weekKey of weekKeys) {
        const week = (liftData as Record<string, unknown>)[weekKey]
        if (!week || typeof week !== 'object') continue
        const weekSessions = (week as Record<string, unknown>).sessions
        if (!weekSessions || typeof weekSessions !== 'object') continue
        Object.keys(weekSessions).forEach((key) => {
          if (/^[A-Z]$/.test(key)) keys.add(key)
        })
      }
    }

    return keys
  }, [calculatedResults])

  const removeSessionColumn = (sessionKey: string) => {
    if (!calculatedResults) return
    if (!/^[A-Z]$/.test(sessionKey)) return
    if (plannedSessionKeys.has(sessionKey)) {
      alert(`Session ${sessionKey} is part of planned weekly targets and cannot be removed. Leave it empty if unused.`)
      return
    }

    const sessionData = calculatedResults.sessions?.[sessionKey]
    if (!sessionData) return

    const weekKeys: WeekKey[] = ['week_1', 'week_2', 'week_3', 'week_4']
    const hasAnySets = weekKeys.some((weekKey) => (
      (sessionData[weekKey]?.lifts || []).some((liftData) => (liftData.sets || []).length > 0)
    ))
    if (hasAnySets && !confirm(`Session ${sessionKey} contains sets. Remove the whole column?`)) {
      return
    }

    setCalculatedResults(prev => {
      if (!prev) return prev
      if (!prev.sessions?.[sessionKey]) return prev

      const nextSessions: SessionsData = JSON.parse(JSON.stringify(prev.sessions))
      delete nextSessions[sessionKey]

      return {
        ...prev,
        sessions: nextSessions,
      }
    })

    setIsProgramPinned(true)
    setIsEditMode(true)
    setIsSaved(false)
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

  const getZone55Percent = (liftConfig: LiftConfig): number => {
    if (!liftConfig.include_55_zone) return 0
    const n = Number(liftConfig.zone_55_percent)
    return Number.isFinite(n) ? n : 0
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
    setIsSaved(false)
  }

  const updateProgramInstructions = (value: string) => {
    setProgramInstructions(value)
    setCalculatedResults((prev) => {
      if (!prev) return prev

      const trimmed = value.trim()
      const nextMeta: ProgramData['meta'] = { ...prev.meta }
      if (trimmed) {
        nextMeta.notes = trimmed
      } else {
        delete nextMeta.notes
      }

      return {
        ...prev,
        meta: nextMeta,
      }
    })
    setIsSaved(false)
  }

  // Update lift-specific field
  const updateLiftField = (lift: 'squat' | 'bench_press' | 'deadlift', field: string, value: any) => {
    setFormData(prev => {
      const newLifts = { ...prev.lifts }
      const safeValue = typeof value === 'number'
        ? (Number.isFinite(value) ? value : 0)
        : value
      const liftData = { ...newLifts[lift], [field]: safeValue }

      // Auto-calculate zone weights when 1RM or rounding changes
      if (field === 'oneRM' || field === 'rounding') {
        const oneRM = field === 'oneRM' ? safeValue : liftData.oneRM
        const rounding = field === 'rounding' ? safeValue : liftData.rounding

        liftData.weight_55 = calculateWeight(oneRM, 55, rounding)
        liftData.weight_65 = calculateWeight(oneRM, 65, rounding)
        liftData.weight_75 = calculateWeight(oneRM, 75, rounding)
        liftData.weight_85 = calculateWeight(oneRM, 85, rounding)
        liftData.weight_90 = calculateWeight(oneRM, 92.5, rounding)
        liftData.weight_95 = calculateWeight(oneRM, 95, rounding)
      }

      newLifts[lift] = liftData
      return { ...prev, lifts: newLifts }
    })
    setIsSaved(false)
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

  const updateSessionSet = (
    lift: LiftKey,
    weekNum: number,
    sessionLetter: string,
    setIndex: number,
    field: 'weight' | 'reps' | 'percentage' | 'variant',
    rawValue: number | string,
  ) => {
    setCalculatedResults(prev => {
      if (!prev) return prev

      const weekKey = `week_${weekNum}` as WeekKey
      const nextSessions: SessionsData = JSON.parse(JSON.stringify(prev.sessions))
      const ensureSessionLiftEntry = (sessionsData: SessionsData, sessionKey: string, wk: WeekKey, liftKey: LiftKey) => {
        if (!sessionsData[sessionKey]) {
          sessionsData[sessionKey] = {
            week_1: { lifts: [] },
            week_2: { lifts: [] },
            week_3: { lifts: [] },
            week_4: { lifts: [] },
          }
        }
        const sessionData = sessionsData[sessionKey]
        if (!sessionData[wk]) {
          sessionData[wk] = { lifts: [] }
        }
        let liftEntryLocal = sessionData[wk].lifts.find(item => item.lift === liftKey)
        if (!liftEntryLocal) {
          liftEntryLocal = { lift: liftKey, sets: [] }
          sessionData[wk].lifts.push(liftEntryLocal)
        }
        return liftEntryLocal
      }

      const liftEntry = ensureSessionLiftEntry(nextSessions, sessionLetter, weekKey, lift)
      if (!liftEntry || !liftEntry.sets[setIndex]) return prev

      const value = field === 'variant'
        ? String(rawValue || DEFAULT_COMP_VARIANT)
        : (Number.isFinite(rawValue) ? rawValue : 0)
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

  const moveSessionSet = (
    lift: LiftKey,
    weekNum: number,
    fromSessionLetter: string,
    fromIndex: number,
    toSessionLetter: string,
    toIndex: number,
    targetPercentage?: number,
    targetWeight?: number,
  ) => {
    setCalculatedResults(prev => {
      if (!prev) return prev

      const weekKey = `week_${weekNum}` as WeekKey
      const nextSessions: SessionsData = JSON.parse(JSON.stringify(prev.sessions))
      const ensureSessionLiftEntry = (sessionsData: SessionsData, sessionKey: string, wk: WeekKey, liftKey: LiftKey) => {
        if (!sessionsData[sessionKey]) {
          sessionsData[sessionKey] = {
            week_1: { lifts: [] },
            week_2: { lifts: [] },
            week_3: { lifts: [] },
            week_4: { lifts: [] },
          }
        }
        const sessionData = sessionsData[sessionKey]
        if (!sessionData[wk]) {
          sessionData[wk] = { lifts: [] }
        }
        let liftEntryLocal = sessionData[wk].lifts.find(item => item.lift === liftKey)
        if (!liftEntryLocal) {
          liftEntryLocal = { lift: liftKey, sets: [] }
          sessionData[wk].lifts.push(liftEntryLocal)
        }
        return liftEntryLocal
      }

      const fromLiftEntry = ensureSessionLiftEntry(nextSessions, fromSessionLetter, weekKey, lift)
      const toLiftEntry = ensureSessionLiftEntry(nextSessions, toSessionLetter, weekKey, lift)

      const fromSets = fromLiftEntry.sets
      const toSets = toLiftEntry.sets
      if (fromIndex < 0 || fromIndex >= fromSets.length) return prev

      const [moved] = fromSets.splice(fromIndex, 1)
      if (!moved) return prev

      const effectiveToIndex = Math.max(0, Math.min(toIndex, toSets.length))
      if (typeof targetPercentage === 'number') {
        moved.percentage = targetPercentage
      }
      if (typeof targetWeight === 'number' && targetWeight > 0) {
        moved.weight = targetWeight
      }
      toSets.splice(effectiveToIndex, 0, moved)

      return {
        ...prev,
        sessions: nextSessions,
      }
    })

    setIsSaved(false)
  }

  const insertSessionSet = (
    lift: LiftKey,
    weekNum: number,
    sessionLetter: string,
    afterIndex: number,
    percentage: number,
    weight: number,
  ) => {
    setCalculatedResults(prev => {
      if (!prev) return prev

      const weekKey = `week_${weekNum}` as WeekKey
      const nextSessions: SessionsData = JSON.parse(JSON.stringify(prev.sessions))
      const ensureSessionLiftEntry = (sessionsData: SessionsData, sessionKey: string, wk: WeekKey, liftKey: LiftKey) => {
        if (!sessionsData[sessionKey]) {
          sessionsData[sessionKey] = {
            week_1: { lifts: [] },
            week_2: { lifts: [] },
            week_3: { lifts: [] },
            week_4: { lifts: [] },
          }
        }
        const sessionData = sessionsData[sessionKey]
        if (!sessionData[wk]) {
          sessionData[wk] = { lifts: [] }
        }
        let liftEntryLocal = sessionData[wk].lifts.find(item => item.lift === liftKey)
        if (!liftEntryLocal) {
          liftEntryLocal = { lift: liftKey, sets: [] }
          sessionData[wk].lifts.push(liftEntryLocal)
        }
        return liftEntryLocal
      }

      const liftEntry = ensureSessionLiftEntry(nextSessions, sessionLetter, weekKey, lift)

      const insertAt = Math.min(afterIndex + 1, liftEntry.sets.length)
      liftEntry.sets.splice(insertAt, 0, {
        weight,
        reps: 1,
        percentage,
        variant: DEFAULT_COMP_VARIANT,
      })

      return {
        ...prev,
        sessions: nextSessions,
      }
    })

    setIsSaved(false)
  }

  const deleteSessionSet = (
    lift: LiftKey,
    weekNum: number,
    sessionLetter: string,
    setIndex: number,
  ) => {
    setCalculatedResults(prev => {
      if (!prev) return prev

      const weekKey = `week_${weekNum}` as WeekKey
      const nextSessions: SessionsData = JSON.parse(JSON.stringify(prev.sessions))
      const weekData = nextSessions[sessionLetter]?.[weekKey]
      if (!weekData) return prev

      const liftEntry = weekData.lifts.find(item => item.lift === lift)
      if (!liftEntry) return prev
      if (setIndex < 0 || setIndex >= liftEntry.sets.length) return prev

      liftEntry.sets.splice(setIndex, 1)

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

        <form
          onSubmit={handleCalculate}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            const target = e.target as HTMLElement | null
            const tag = target?.tagName?.toLowerCase()
            if (tag === 'textarea') return
            e.preventDefault()
          }}
          className="space-y-6"
        >
          {isEditingExistingProgram && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-900 text-sm">
              {editingTemplateSlug
                ? 'Editing template. Save writes back to the template.'
                : 'Editing existing saved program. AI generation stays manual on Calculate.'}
            </div>
          )}

          {editingTemplateSlug && (
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template name
                  </label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => updateSharedField('clientName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={editingTemplateDescription}
                    onChange={(e) => {
                      setEditingTemplateDescription(e.target.value)
                      setIsSaved(false)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
                    placeholder="Optional template description"
                  />
                </div>
              </div>
            </div>
          )}

          {!editingTemplateSlug && (
            <>
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
                      onChange={(e) => {
                        const nextIsNew = e.target.value === 'new'
                        setIsNewClient(nextIsNew)

                        if (!nextIsNew && existingClients.length > 0) {
                          const selectedClient = existingClients.find(c => c.slug === selectedExistingClientSlug) || existingClients[0]
                          setSelectedExistingClientSlug(selectedClient.slug)
                          applyClientToForm(selectedClient)
                        }
                      }}
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
                        value={selectedExistingClientSlug}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-600"
                        onChange={(e) => {
                          const slug = e.target.value
                          setSelectedExistingClientSlug(slug)

                          const selectedClient = existingClients.find(c => c.slug === slug)
                          if (selectedClient) {
                            applyClientToForm(selectedClient)
                          }
                        }}
                        disabled={existingClientsLoading || existingClients.length === 0}
                      >
                        {existingClients.length === 0 ? (
                          <option value="">
                            {existingClientsLoading ? 'Loading clients...' : 'No existing clients found'}
                          </option>
                        ) : (
                          existingClients.map(client => (
                            <option key={client.slug} value={client.slug}>
                              {client.name}
                            </option>
                          ))
                        )}
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

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Program-specific instructions (optional)
                    </label>
                    <Link
                      href={`/${locale}/admin/settings`}
                      className="text-xs text-indigo-700 hover:text-indigo-900"
                    >
                      Edit global instructions in Settings
                    </Link>
                  </div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Visible only in this specific program.
                  </label>
                  <textarea
                    value={programInstructions}
                    onChange={(e) => updateProgramInstructions(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-500"
                    placeholder="Extra notes only for this one program."
                  />
                </div>
              </div>

              {/* Per-lift template preload */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Lift templates (optional)</h2>
                    <p className="text-sm text-gray-600">
                      Pick template per lift and load its input, targets, and saved sessions into this client program.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      applySelectedLiftTemplates()
                    }}
                    disabled={
                      loading ||
                      liftTemplatesLoading ||
                      LIFT_KEYS.every((lift) => !selectedLiftTemplateByLift[lift])
                    }
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                  >
                    Apply selected templates
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {LIFT_KEYS.map((lift) => {
                    const templatesForLift = liftTemplates
                      .filter((template) => template.scope === 'single_lift' || template.scope === 'full')
                    return (
                      <div key={`lift-template-${lift}`}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {getLiftLabel(lift)} template
                        </label>
                        <select
                          value={selectedLiftTemplateByLift[lift]}
                          onChange={(e) => {
                            const slug = e.target.value
                            setSelectedLiftTemplateByLift((prev) => ({ ...prev, [lift]: slug }))
                          }}
                          disabled={liftTemplatesLoading}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-600"
                        >
                          <option value="">
                            {liftTemplatesLoading ? 'Loading templates...' : '— No template —'}
                          </option>
                          {templatesForLift.map((template) => (
                            <option key={template.slug} value={template.slug}>
                              {template.name} ({template.block}, {template.scope === 'full'
                                ? 'full'
                                : (template.lift ? getLiftLabel(template.lift) : 'single lift')})
                            </option>
                          ))}
                        </select>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* 3-Column Layout for Lifts */}
          <div className={`grid grid-cols-1 ${editingTemplateSlug && editingTemplateMeta?.scope === 'single_lift' ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-6`}>
            {(
              editingTemplateSlug &&
              editingTemplateMeta?.scope === 'single_lift' &&
              editingTemplateMeta.lift
                ? [editingTemplateMeta.lift]
                : (['squat', 'bench_press', 'deadlift'] as LiftKey[])
            ).map((liftKey) => (
              <LiftColumn
                key={liftKey}
                liftName={liftKey}
                liftData={formData.lifts[liftKey]}
                onUpdate={(field, value) => updateLiftField(liftKey, field, value)}
                onNumberInput={(field, value) => handleLiftNumberInput(liftKey, field, value)}
                calculateActualPercentage={calculateActualPercentage}
                calculatePercentageFromReps={calculatePercentageFromReps}
              />
            ))}
          </div>

          {/* AI generation trigger */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Deterministic calculations update automatically. AI sessions generate only after clicking “{t('calculateProgram')}”.
            </div>

            <div className="flex gap-4">
              {calculatedResults && (
                <button
                  type="button"
                  onClick={initializeManualSessions}
                  disabled={loading}
                  className="px-6 py-3 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:bg-gray-400"
                >
                  Start manual sessions
                </button>
              )}
              {editingTemplateSlug && (
                <button
                  type="button"
                  onClick={recalculateDeterministic}
                  disabled={loading}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  Recalculate targets
                </button>
              )}
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
                  {Object.entries(calculatedResults.calculated).map(([lift]) => {
                    const liftLabel = lift === 'squat' ? 'Squat' :
                                     lift === 'bench_press' ? 'Bench Press' :
                                     lift === 'deadlift' ? 'Deadlift' : lift

                    // Get target zone distribution from formData
                    const liftConfig = formData.lifts[lift as keyof typeof formData.lifts]
                    const targetZones = {
                      '55': Math.round(getZone55Percent(liftConfig) * liftConfig.volume / 100),
                      '65': Math.round((100 - getZone55Percent(liftConfig) - liftConfig.zone_75_percent - liftConfig.zone_85_percent -
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
                          <div className="flex justify-between"><span className="text-gray-700">55%:</span><span className="font-semibold text-gray-900">{targetZones['55']}</span></div>
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
                const variantOptions = getLiftVariantOptions(formData.lifts[liftKey].variants)

                // Get target zone distribution from formData
                const liftConfig = formData.lifts[lift as keyof typeof formData.lifts]
                const targetZones = {
                  '55': Math.round(getZone55Percent(liftConfig) * liftConfig.volume / 100),
                  '65': Math.round((100 - getZone55Percent(liftConfig) - liftConfig.zone_75_percent - liftConfig.zone_85_percent -
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
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <h4 className="text-lg font-semibold text-gray-900">AI Sessions</h4>
                        <div className="flex items-center gap-3 flex-wrap">
                          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={isFlexibleBridgeMode}
                              onChange={(e) => setIsFlexibleBridgeMode(e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            Flexible bridge % (50/60/70/80/90/97.5)
                          </label>
                        </div>
                      </div>
                      {isFlexibleBridgeMode && (
                        <p className="text-xs text-gray-500">
                          Canonical zone deltas are validated via weekly allocation of bridge percentages.
                        </p>
                      )}
                      <AISessionLiftTable
                        sessions={calculatedResults.sessions}
                        lift={liftKey}
                        calculatedLift={liftData}
                        oneRm={formData.lifts[liftKey].oneRM}
                        rounding={formData.lifts[liftKey].rounding}
                        variantOptions={variantOptions}
                        showVariants={!editingTemplateSlug}
                        isFlexibleBridgeMode={isFlexibleBridgeMode}
                        isEditMode={isEditMode}
                        onUpdateSet={updateSessionSet}
                        onMoveSet={moveSessionSet}
                        onInsertSet={insertSessionSet}
                        onDeleteSet={deleteSessionSet}
                        onAddSessionColumn={addSessionColumn}
                        onRemoveSessionColumn={removeSessionColumn}
                        isSessionRemovable={(sessionKey) => !plannedSessionKeys.has(sessionKey)}
                        showSessionColumnControls={index === 0}
                        rmProfile={clientRmProfiles?.[liftKey] || null}
                      />
                    </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Save and Download Buttons */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setCalculatedResults(null)
                  setIsProgramPinned(false)
                  setIsEditingExistingProgram(false)
                  setEditingTemplateSlug(null)
                  setEditingTemplateMeta(null)
                  setEditingTemplateDescription('')
                }}
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
                {isSaved
                  ? (editingTemplateSlug ? 'Template saved' : t('saved'))
                  : (editingTemplateSlug ? 'Save template' : t('saveProgram'))}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

const BASE_ZONE_ROWS = [
  { key: 55, label: '55%' },
  { key: 65, label: '65%' },
  { key: 75, label: '75%' },
  { key: 85, label: '85%' },
  { key: 92.5, label: '90%' },
  { key: 95, label: '95%' },
] as const

const EXPANDED_ZONE_ROWS = [
  { key: 50, label: '50%' },
  { key: 55, label: '55%' },
  { key: 60, label: '60%' },
  { key: 65, label: '65%' },
  { key: 70, label: '70%' },
  { key: 75, label: '75%' },
  { key: 80, label: '80%' },
  { key: 85, label: '85%' },
  { key: 90, label: '90%' },
  { key: 92.5, label: '92.5%' },
  { key: 95, label: '95%' },
  { key: 97.5, label: '97.5%' },
] as const

type CanonicalZoneKey = '55' | '65' | '75' | '85' | '90' | '95'
const CANONICAL_ZONE_KEYS: CanonicalZoneKey[] = ['55', '65', '75', '85', '90', '95']

const normalizePercentageKey = (percentage: number): number => (
  Math.round(percentage * 10) / 10
)

const hasBridgePercentagesInSessions = (sessions: SessionsData | null): boolean => {
  if (!sessions) return false

  for (const session of Object.values(sessions)) {
    for (const weekKey of ['week_1', 'week_2', 'week_3', 'week_4'] as WeekKey[]) {
      const week = session?.[weekKey]
      if (!week?.lifts) continue
      for (const liftData of week.lifts) {
        for (const set of liftData.sets || []) {
          const pct = normalizePercentageKey(Number(set.percentage))
          if (pct === 50 || pct === 60 || pct === 70 || pct === 80 || pct === 90 || pct === 97.5) {
            return true
          }
        }
      }
    }
  }

  return false
}

const getAllowedCanonicalZones = (percentageRaw: number, flexibleMode: boolean): CanonicalZoneKey[] => {
  const percentage = normalizePercentageKey(percentageRaw)
  if (Math.abs(percentage - 92.5) < 0.2) return ['90']
  if (Math.abs(percentage - 90) < 0.2) return flexibleMode ? ['85', '90'] : ['90']
  if (Math.abs(percentage - 97.5) < 0.2) return ['95']
  if (Math.abs(percentage - 95) < 0.2) return ['95']
  if (Math.abs(percentage - 85) < 0.2) return ['85']
  if (Math.abs(percentage - 75) < 0.2) return ['75']
  if (Math.abs(percentage - 65) < 0.2) return ['65']
  if (Math.abs(percentage - 55) < 0.2) return ['55']
  if (!flexibleMode) return []
  if (Math.abs(percentage - 50) < 0.2) return ['55']
  if (Math.abs(percentage - 60) < 0.2) return ['55', '65']
  if (Math.abs(percentage - 70) < 0.2) return ['65', '75']
  if (Math.abs(percentage - 80) < 0.2) return ['75', '85']
  return []
}

const allocateCanonicalZoneReps = (
  totalsByPercentage: Record<string, number>,
  targets: Record<CanonicalZoneKey, number>,
  flexibleMode: boolean,
): { assignedByZone: Record<CanonicalZoneKey, number>; totalAssigned: number } => {
  type Edge = { to: number; rev: number; capacity: number }
  const graph: Edge[][] = []
  const makeNode = () => {
    graph.push([])
    return graph.length - 1
  }
  const addEdge = (from: number, to: number, capacity: number) => {
    const forward: Edge = { to, rev: graph[to].length, capacity }
    const backward: Edge = { to: from, rev: graph[from].length, capacity: 0 }
    graph[from].push(forward)
    graph[to].push(backward)
  }

  const source = makeNode()
  const percentageEntries = Object.entries(totalsByPercentage)
    .filter(([, reps]) => Number.isFinite(reps) && reps > 0)
    .map(([percentage, reps]) => ({ percentage: Number(percentage), reps: Math.round(reps) }))
  const pctNodes = percentageEntries.map(() => makeNode())
  const zoneNodes = CANONICAL_ZONE_KEYS.reduce((acc, key) => {
    acc[key] = makeNode()
    return acc
  }, {} as Record<CanonicalZoneKey, number>)
  const sink = makeNode()

  percentageEntries.forEach(({ reps }, idx) => {
    addEdge(source, pctNodes[idx], reps)
  })
  for (const [zoneKey, zoneNode] of Object.entries(zoneNodes) as Array<[CanonicalZoneKey, number]>) {
    const target = Math.max(0, Math.round(Number(targets[zoneKey] ?? 0)))
    addEdge(zoneNode, sink, target)
  }
  percentageEntries.forEach(({ percentage, reps }, idx) => {
    const allowed = getAllowedCanonicalZones(percentage, flexibleMode)
    if (allowed.length === 0 || reps <= 0) return
    for (const zoneKey of allowed) {
      addEdge(pctNodes[idx], zoneNodes[zoneKey], reps)
    }
  })

  let totalFlow = 0
  while (true) {
    const parentNode = Array(graph.length).fill(-1)
    const parentEdge = Array(graph.length).fill(-1)
    const queue: number[] = [source]
    parentNode[source] = source

    for (let q = 0; q < queue.length; q++) {
      const current = queue[q]
      for (let edgeIndex = 0; edgeIndex < graph[current].length; edgeIndex++) {
        const edge = graph[current][edgeIndex]
        if (edge.capacity <= 0 || parentNode[edge.to] !== -1) continue
        parentNode[edge.to] = current
        parentEdge[edge.to] = edgeIndex
        queue.push(edge.to)
        if (edge.to === sink) break
      }
      if (parentNode[sink] !== -1) break
    }

    if (parentNode[sink] === -1) break

    let bottleneck = Number.POSITIVE_INFINITY
    for (let node = sink; node !== source; node = parentNode[node]) {
      const prev = parentNode[node]
      const edge = graph[prev][parentEdge[node]]
      bottleneck = Math.min(bottleneck, edge.capacity)
    }

    for (let node = sink; node !== source; node = parentNode[node]) {
      const prev = parentNode[node]
      const edge = graph[prev][parentEdge[node]]
      edge.capacity -= bottleneck
      graph[node][edge.rev].capacity += bottleneck
    }

    totalFlow += bottleneck
  }

  const assignedByZone = CANONICAL_ZONE_KEYS.reduce((acc, key) => {
    acc[key] = 0
    return acc
  }, {} as Record<CanonicalZoneKey, number>)
  for (const [zoneKey, zoneNode] of Object.entries(zoneNodes) as Array<[CanonicalZoneKey, number]>) {
    const edgeToSink = graph[zoneNode].find((edge) => edge.to === sink)
    if (!edgeToSink) continue
    const initialCapacity = Math.max(0, Math.round(Number(targets[zoneKey] ?? 0)))
    assignedByZone[zoneKey] = initialCapacity - edgeToSink.capacity
  }

  return { assignedByZone, totalAssigned: totalFlow }
}

function AISessionLiftTable({
  sessions,
  lift,
  calculatedLift,
  oneRm,
  rounding,
  variantOptions,
  showVariants,
  isFlexibleBridgeMode,
  isEditMode,
  onUpdateSet,
  onMoveSet,
  onInsertSet,
  onDeleteSet,
  onAddSessionColumn,
  onRemoveSessionColumn,
  isSessionRemovable,
  showSessionColumnControls,
  rmProfile,
}: {
  sessions: SessionsData
  lift: LiftKey
  calculatedLift: Record<string, any>
  oneRm: number
  rounding: number
  variantOptions: VariantOption[]
  showVariants: boolean
  isFlexibleBridgeMode: boolean
  isEditMode: boolean
  rmProfile: Record<number, number> | null
  onUpdateSet: (
    lift: LiftKey,
    weekNum: number,
    sessionLetter: string,
    setIndex: number,
    field: 'weight' | 'reps' | 'percentage' | 'variant',
    rawValue: number | string,
  ) => void
  onMoveSet: (
    lift: LiftKey,
    weekNum: number,
    fromSessionLetter: string,
    fromIndex: number,
    toSessionLetter: string,
    toIndex: number,
    targetPercentage?: number,
    targetWeight?: number,
  ) => void
  onInsertSet: (
    lift: LiftKey,
    weekNum: number,
    sessionLetter: string,
    afterIndex: number,
    percentage: number,
    weight: number,
  ) => void
  onDeleteSet: (
    lift: LiftKey,
    weekNum: number,
    sessionLetter: string,
    setIndex: number,
  ) => void
  onAddSessionColumn?: () => void
  onRemoveSessionColumn?: (sessionKey: string) => void
  isSessionRemovable?: (sessionKey: string) => boolean
  showSessionColumnControls?: boolean
}) {
  const dragSetRef = useRef<{
    weekNum: number
    sessionKey: string
    setIndex: number
  } | null>(null)
  const [dragOverCell, setDragOverCell] = useState<string | null>(null)

  const sessionKeySet = new Set<string>(Object.keys(sessions).filter(key => /^[A-Z]$/.test(key)))
  for (const weekKey of ['week_1', 'week_2', 'week_3', 'week_4'] as WeekKey[]) {
    const calculatedSessions = calculatedLift?.[weekKey]?.sessions as Record<string, unknown> | undefined
    if (!calculatedSessions || typeof calculatedSessions !== 'object') continue
    Object.keys(calculatedSessions).forEach((key) => {
      if (/^[A-Z]$/.test(key)) sessionKeySet.add(key)
    })
  }
  const sessionKeys = [...sessionKeySet].sort()
  const weekKeys: WeekKey[] = ['week_1', 'week_2', 'week_3', 'week_4']
  const zoneRows = isFlexibleBridgeMode ? EXPANDED_ZONE_ROWS : BASE_ZONE_ROWS
  const summaryRowsPerWeek = rmProfile ? 3 : 2
  const rowsPerWeek = zoneRows.length + summaryRowsPerWeek

  const getAllSets = (sessionKey: string, weekKey: WeekKey): SetData[] => {
    const weekData = sessions[sessionKey]?.[weekKey]
    const liftData = weekData?.lifts?.find(item => item.lift === lift)
    return liftData?.sets ?? []
  }

  const roundToStep = (value: number, step: number): number => {
    if (!Number.isFinite(value)) return 0
    if (!Number.isFinite(step) || step <= 0) return Math.round(value * 10) / 10
    return Math.round(value / step) * step
  }

  const getWeightForZone = (zonePct: number): number | null => {
    for (const sessionKey of sessionKeys) {
      for (const weekKey of weekKeys) {
        const set = getAllSets(sessionKey, weekKey).find(item => item.percentage === zonePct)
        if (set) return set.weight
      }
    }

    const isCanonicalDisplayPercentage = (
      zonePct === 55 ||
      zonePct === 65 ||
      zonePct === 75 ||
      zonePct === 85 ||
      zonePct === 92.5 ||
      zonePct === 95
    )

    if (isCanonicalDisplayPercentage) {
      const calcKey = zoneToCalculatedKey(zonePct)
      const fallbackWeight = Number(calculatedLift?._summary?.weights?.[calcKey])
      if (Number.isFinite(fallbackWeight) && fallbackWeight > 0) {
        return fallbackWeight
      }
    }

    if (Number.isFinite(oneRm) && oneRm > 0) {
      const base = roundToStep(oneRm * (zonePct / 100), rounding)
      if (Number.isFinite(base) && base > 0) return base
    }

    return null
  }

  const zoneToCalculatedKey = (zonePct: number): '55' | '65' | '75' | '85' | '90' | '95' => {
    if (zonePct === 92.5) return '90'
    return String(zonePct) as '55' | '65' | '75' | '85' | '90' | '95'
  }

  const getVariantCellClass = (variantRaw: string): string => {
    const variant = normalizeVariantCode(variantRaw, variantOptions)
    const index = variantOptions.findIndex(option => option.code === variant)

    if (index <= 0) return ''
    if (index === 1) return 'bg-yellow-100'
    if (index === 2) return 'bg-rose-100'
    return 'bg-blue-100'
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

  const handleDragStart = (
    event: DragEvent<HTMLElement>,
    weekNum: number,
    sessionKey: string,
    setIndex: number,
  ) => {
    if (!isEditMode) return

    const payload = { weekNum, sessionKey, setIndex }
    dragSetRef.current = payload
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', `${weekNum}:${sessionKey}:${setIndex}`)
  }

  const handleDragOver = (
    event: DragEvent<HTMLTableCellElement>,
    weekNum: number,
    targetSessionKey: string,
    targetIndex: number,
    sessionLength: number,
    zoneKey: number,
  ) => {
    const activeDrag = dragSetRef.current
    if (!isEditMode || !activeDrag) return
    if (activeDrag.weekNum !== weekNum) return

    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    const normalizedTargetIndex = Math.max(0, Math.min(targetIndex, sessionLength))
    setDragOverCell(`${weekNum}-${targetSessionKey}-${normalizedTargetIndex}-${zoneKey}`)
  }

  const handleDrop = (
    event: DragEvent<HTMLTableCellElement>,
    weekNum: number,
    targetSessionKey: string,
    targetIndex: number,
    sessionLength: number,
    targetZonePercentage: number,
    targetZoneWeight: number,
  ) => {
    event.preventDefault()

    const activeDrag = dragSetRef.current
    if (!isEditMode || !activeDrag) return
    if (activeDrag.weekNum !== weekNum) return

    const normalizedTargetIndex = Math.max(0, Math.min(targetIndex, sessionLength))

    onMoveSet(
      lift,
      weekNum,
      activeDrag.sessionKey,
      activeDrag.setIndex,
      targetSessionKey,
      normalizedTargetIndex,
      targetZonePercentage,
      targetZoneWeight,
    )

    dragSetRef.current = null
    setDragOverCell(null)
  }

  const handleDragEnd = () => {
    dragSetRef.current = null
    setDragOverCell(null)
  }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th rowSpan={2} className="border border-gray-300 px-2 py-1 font-semibold text-gray-900">week</th>
            <th rowSpan={2} className="border border-gray-300 px-2 py-1 font-semibold text-gray-900">lift</th>
            <th rowSpan={2} className="border border-gray-300 px-2 py-1 font-semibold text-gray-900">%1RM</th>
            <th rowSpan={2} className="border border-gray-300 px-2 py-1 font-semibold text-gray-900">kg</th>
            <th rowSpan={2} className="border border-gray-300 px-2 py-1 font-semibold text-gray-900">#reps</th>
            {sessionKeys.map(sessionKey => {
              const nCols = maxSetsPerSession[sessionKey]
              const canRemove = !!showSessionColumnControls && !!onRemoveSessionColumn && !!isSessionRemovable?.(sessionKey)
              const canAdd = !!showSessionColumnControls && !!onAddSessionColumn && sessionKey === sessionKeys[sessionKeys.length - 1]
              return (
                <th
                  key={`${sessionKey}-group`}
                  colSpan={nCols}
                  className="border border-gray-300 px-2 py-1 font-semibold text-gray-900 border-l-2 border-l-gray-500"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{`Session ${sessionKey}`}</span>
                    {canRemove && (
                      <button
                        type="button"
                        onClick={() => onRemoveSessionColumn(sessionKey)}
                        className="h-5 w-5 leading-none rounded border border-gray-400 text-gray-700 hover:bg-gray-100"
                        title={`Remove session ${sessionKey}`}
                      >
                        ×
                      </button>
                    )}
                    {canAdd && (
                      <button
                        type="button"
                        onClick={onAddSessionColumn}
                        className="h-5 w-5 leading-none rounded border border-gray-400 text-gray-700 hover:bg-gray-100"
                        title="Add session column"
                      >
                        +
                      </button>
                    )}
                  </div>
                </th>
              )
            })}
            <th rowSpan={2} className="border border-gray-300 px-2 py-1 font-semibold text-gray-900">Δ</th>
          </tr>
          <tr className="bg-gray-100">
            {sessionKeys.map(sessionKey => {
              const nCols = maxSetsPerSession[sessionKey]
              return Array.from({ length: nCols }, (_, idx) => (
                <th
                  key={`${sessionKey}-${idx}`}
                  className={`border border-gray-300 px-2 py-1 font-semibold ${idx === 0 ? 'border-l-2 border-l-gray-500' : ''} text-gray-900`}
                >
                  {`#${idx + 1}`}
                </th>
              ))
            })}
          </tr>
        </thead>
        {weekKeys.map((weekKey, weekIdx) => {
          const totalsByPercentage: Record<string, number> = {}
          let actualWeekTotal = 0
          for (const sessionKey of sessionKeys) {
            const sets = getAllSets(sessionKey, weekKey)
            for (const set of sets) {
              const reps = Number(set.reps)
              const pct = Number(set.percentage)
              if (!Number.isFinite(reps) || reps <= 0 || !Number.isFinite(pct)) continue
              const pctKey = String(normalizePercentageKey(pct))
              totalsByPercentage[pctKey] = (totalsByPercentage[pctKey] || 0) + reps
              actualWeekTotal += reps
            }
          }

          const plannedByZone = CANONICAL_ZONE_KEYS.reduce((acc, zoneKey) => {
            const pct = zoneKey === '90' ? 92.5 : Number(zoneKey)
            const calcKey = zoneToCalculatedKey(pct)
            acc[zoneKey] = Number(calculatedLift?.[weekKey]?.zones?.[calcKey] ?? 0)
            return acc
          }, {} as Record<CanonicalZoneKey, number>)

          const canonicalActual = CANONICAL_ZONE_KEYS.reduce((acc, zoneKey) => {
            acc[zoneKey] = 0
            return acc
          }, {} as Record<CanonicalZoneKey, number>)

          if (isFlexibleBridgeMode) {
            const allocated = allocateCanonicalZoneReps(totalsByPercentage, plannedByZone, true)
            for (const zoneKey of CANONICAL_ZONE_KEYS) {
              canonicalActual[zoneKey] = allocated.assignedByZone[zoneKey] || 0
            }
          } else {
            for (const zoneKey of CANONICAL_ZONE_KEYS) {
              const pct = zoneKey === '90' ? 92.5 : Number(zoneKey)
              canonicalActual[zoneKey] = totalsByPercentage[String(normalizePercentageKey(pct))] || 0
            }
          }

          const plannedWeekTotal = CANONICAL_ZONE_KEYS.reduce((sum, zoneKey) => sum + (plannedByZone[zoneKey] || 0), 0)
          const weekDiff = plannedWeekTotal - actualWeekTotal

          return (
          <tbody key={weekKey}>
              {zoneRows.map((zone, zoneIdx) => {
                const exactRowReps = totalsByPercentage[String(normalizePercentageKey(zone.key))] || 0
                const canonicalForRow = getAllowedCanonicalZones(zone.key, false)[0] || null
                const totalZoneReps = (isFlexibleBridgeMode && canonicalForRow)
                  ? (canonicalActual[canonicalForRow] || 0)
                  : exactRowReps
                const plannedZoneReps = canonicalForRow ? (plannedByZone[canonicalForRow] || 0) : 0
                const zoneDiff = canonicalForRow ? (plannedZoneReps - totalZoneReps) : null

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

                    <td className="border border-gray-300 px-2 py-1 text-center font-semibold text-gray-800">
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
                        const isThisZone = !!set && normalizePercentageKey(set.percentage) === normalizePercentageKey(zone.key)
                        const activeVariant = normalizeVariantCode(set?.variant, variantOptions)

                        const weekNum = Number(weekKey.replace('week_', ''))
                        const zoneWeight = getWeightForZone(zone.key) ?? set?.weight ?? 0

                        const dropCellKey = `${weekNum}-${sessionKey}-${Math.max(0, Math.min(idx, allSessionSets.length))}-${zone.key}`
                        const isDropTarget = dragOverCell === dropCellKey

                        return (
                          <td
                            key={`${weekKey}-${sessionKey}-${zone.key}-${idx}`}
                            className={`border border-gray-300 px-2 py-1 text-center font-semibold ${idx === 0 ? 'border-l-2 border-l-gray-500' : ''} ${isThisZone ? (showVariants ? getVariantCellClass(activeVariant) : '') : 'text-transparent bg-transparent'} ${isDropTarget ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                            onDragOver={(event) => handleDragOver(event, weekNum, sessionKey, idx, allSessionSets.length, zone.key)}
                            onDrop={(event) => handleDrop(
                              event,
                              weekNum,
                              sessionKey,
                              idx,
                              allSessionSets.length,
                              zone.key,
                              zoneWeight,
                            )}
                          >
                            {isThisZone ? (
                              isEditMode ? (
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    draggable
                                    onDragStart={(event) => handleDragStart(event, weekNum, sessionKey, idx)}
                                    onDragEnd={handleDragEnd}
                                    className="px-1 text-xs border rounded cursor-grab active:cursor-grabbing"
                                    title="Drag set"
                                  >
                                    ⠿
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={set.reps}
                                    onChange={(e) => onUpdateSet(lift, weekNum, sessionKey, idx, 'reps', parseInt(e.target.value) || 0)}
                                    className="w-12 px-1 py-0.5 text-center border border-blue-300 rounded text-xs"
                                  />
                                  {showVariants && (
                                    <select
                                      value={activeVariant}
                                      onChange={(e) => onUpdateSet(lift, weekNum, sessionKey, idx, 'variant', e.target.value)}
                                      className="max-w-28 px-1 py-0.5 border border-gray-300 rounded text-xs bg-white text-gray-900"
                                    >
                                      {variantOptions.map(option => (
                                        <option key={option.code} value={option.code}>{option.label}</option>
                                      ))}
                                    </select>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => onInsertSet(lift, weekNum, sessionKey, idx, zone.key, zoneWeight)}
                                    className="px-1 text-xs border rounded"
                                    title="Insert set after"
                                  >
                                    +
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onDeleteSet(lift, weekNum, sessionKey, idx)}
                                    className="px-1 text-xs border rounded"
                                    title="Delete set"
                                  >
                                    ×
                                  </button>
                                </div>
                              ) : (
                                set.reps
                              )
                            ) : (
                              isEditMode ? (
                                <button
                                  type="button"
                                  onClick={() => onInsertSet(lift, weekNum, sessionKey, idx - 1, zone.key, zoneWeight)}
                                  className="px-1 text-xs border rounded text-gray-600 hover:bg-gray-100"
                                  title="Add set in this zone"
                                >
                                  +
                                </button>
                              ) : ''
                            )}
                          </td>
                        )
                      })
                    })}

                    <td
                      className={`border border-gray-300 px-2 py-1 text-center font-semibold ${zoneDiff === null ? 'text-gray-400' : (zoneDiff === 0 ? 'text-green-700' : 'text-red-700')}`}
                    >
                      {zoneDiff === null ? '—' : zoneDiff}
                    </td>
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
                <td className="border border-gray-300 px-2 py-1 text-center text-gray-400">—</td>
              </tr>

              {rmProfile && (
              <tr className="bg-amber-50">
                <td colSpan={3} className="border border-gray-300 px-2 py-1 text-right text-xs font-semibold text-amber-800">
                  ARE
                </td>
                {sessionKeys.map(sessionKey => {
                  const sets = getAllSets(sessionKey, weekKey)
                  const rmLookup = buildRmLookup({ ...rmProfile, 100: 1 })
                  const areSets = sets.filter(s => s.reps > 0 && s.percentage > 0).map(s => ({
                    reps: s.reps,
                    zone_pct: s.percentage / 100,
                  }))
                  const are = areSets.length > 0 ? calculateAre(areSets, rmLookup) : null

                  return (
                    <td
                      key={`${weekKey}-${sessionKey}-are`}
                      colSpan={maxSetsPerSession[sessionKey]}
                      className="border border-gray-300 px-2 py-1 text-center font-semibold text-amber-800 border-l-2 border-l-gray-500"
                    >
                      {are !== null ? `${are.toFixed(0)}%` : ''}
                    </td>
                  )
                })}
                <td className="border border-gray-300 px-2 py-1 text-center text-gray-400">—</td>
              </tr>
              )}

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
                <td className={`border border-gray-300 px-2 py-1 text-center font-semibold ${weekDiff === 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {weekDiff}
                </td>
              </tr>
          </tbody>
        )})}
      </table>
    </div>
  )
}
