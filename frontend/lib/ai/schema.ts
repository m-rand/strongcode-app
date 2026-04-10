/**
 * Zod schema for AI-generated session output
 * Used with Vercel AI SDK generateObject() for type-safe structured output
 *
 * The AI generates ONLY sessions (concrete sets).
 * Calculated data (zone targets, ARI, weekly distribution) is computed
 * deterministically in calculate.ts BEFORE calling the AI.
 */

import { z } from 'zod'

// ─── Set (single prescribed set) ────────────────────────────
const setSchema = z.object({
  weight: z.number().describe('Weight in kg (exact zone weight)'),
  // Keep schema Anthropic-4.6 compatible: avoid integer/min/max JSON Schema keywords.
  reps: z.number().describe('Number of repetitions (integer expected, >= 1)'),
  percentage: z.number().describe('Zone central percentage (55, 65, 75, 85, 92.5, or 95)'),
})

// ─── Per-lift AI output (single lift, no lift field) ────────
const liftWeekSchema = z.object({
  sets: z.array(setSchema).describe('Ordered list of sets for this lift'),
})

const liftSessionSchema = z.object({
  session: z.string().describe('Session letter (A, B, C, ...)'),
  week_1: liftWeekSchema,
  week_2: liftWeekSchema,
  week_3: liftWeekSchema,
  week_4: liftWeekSchema,
})

export const liftSessionsSchema = z.object({
  sessions: z.array(liftSessionSchema).describe('Array of sessions for this lift, one per session letter'),
})

export type LiftSessionsOutput = z.infer<typeof liftSessionsSchema>

// ─── Session Lift (one lift within a merged session/week) ───
const sessionLiftSchema = z.object({
  lift: z.enum(['squat', 'bench_press', 'deadlift']).describe('Main lift type'),
  sets: z.array(setSchema).describe('Ordered list of sets'),
})

// ─── Week within a session letter ───────────────────────────
const sessionWeekSchema = z.object({
  lifts: z.array(sessionLiftSchema).describe('Lifts for this session/week'),
})

// ─── Top-level: AI-generated sessions output ────────────────
export const sessionsOutputSchema = z.record(
  z.string().regex(/^[A-Z]$/),
  z.object({
    week_1: sessionWeekSchema,
    week_2: sessionWeekSchema,
    week_3: sessionWeekSchema,
    week_4: sessionWeekSchema,
  })
).describe('Concrete workout sessions. Keys are session letters (A, B, C, ...)')

export type SessionsOutput = z.infer<typeof sessionsOutputSchema>

// ─── v2.7 week-first schema (variable sessions per week) ────
// Used when AI decides session count dynamically from zone totals.
const weekSessionSchema = z.object({
  session: z.string().describe('Session letter A, B, C, D'),
  sets: z.array(setSchema).describe('Ordered sets for this session/week'),
})

const weekOutputSchema = z.object({
  sessions_used: z.number().describe('Number of sessions this week (2, 3, or 4)'),
  distribution_code: z.string().describe('Distribution code used, e.g. d25_33_42'),
  tried_distributions: z.array(z.string()).describe('Ordered list of attempted distribution codes for this week'),
  selection_reason: z.string().describe('Short explanation why this distribution/session-count was selected'),
  sessions: z.array(weekSessionSchema).describe('Sessions for this week'),
})

export const liftWeeksSchema = z.object({
  weeks: z.object({
    week_1: weekOutputSchema,
    week_2: weekOutputSchema,
    week_3: weekOutputSchema,
    week_4: weekOutputSchema,
  }).describe('Per-week sessions with dynamically chosen distribution'),
})

export type LiftWeeksOutput = z.infer<typeof liftWeeksSchema>

// ─── Input types (provided by coach, not AI) ────────────────

export interface WeekPlanEntry {
  sessions: number       // Sessions this week (can differ from default)
  distribution: string   // Session distribution code for this week
}

export interface LiftInput {
  volume: number           // Total NL for the block
  rounding: number         // Weight rounding (1, 2.5, or 5)
  one_rm: number           // 1RM in kg
  weights: Record<string, number> // Pre-calculated zone weights (e.g. {"65": 52.5, "75": 60, ...})
  intensity_distribution: {
    '55_percent'?: number   // % of NL in 55% zone (optional, default 0)
    '75_percent': number   // % of NL in 75% zone
    '85_percent': number   // % of NL in 85% zone
    '90_total_reps': number  // Absolute block total (fallback)
    '95_total_reps': number  // Absolute block total (fallback)
    '90_weekly_reps'?: number[] // Per-week reps [w1,w2,w3,w4] — overrides 90_total_reps
    '95_weekly_reps'?: number[] // Per-week reps [w1,w2,w3,w4] — overrides 95_total_reps
  }
  volume_pattern_main: string    // Chernyak pattern for 65%+75% zones
  volume_pattern_8190: string    // Chernyak pattern for 85% zone (+ 90/95 fallback)
  sessions_per_week: number      // Default sessions per week
  session_distribution: string   // Default session distribution code
  weekly_plan?: Record<string, WeekPlanEntry> // Per-week overrides (week_1, week_2, ...)
}

export interface GenerateInput {
  client: {
    name: string
    delta: 'beginner' | 'intermediate' | 'advanced' | 'elite'
    one_rm: { squat: number; bench_press: number; deadlift: number }
  }
  block: 'prep' | 'comp'
  weeks: number
  lifts: Partial<{
    squat: LiftInput
    bench_press: LiftInput
    deadlift: LiftInput
  }>
}
