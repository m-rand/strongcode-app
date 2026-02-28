/**
 * StrongCode constants — ported from scripts/constants.py
 * Chernyak patterns, session distributions, zone config
 */

// ─── Chernyak Volume Distribution Patterns ──────────────────
// Format: [week1%, week2%, week3%, week4%] — must sum to 100

export const CHERNYAK_PATTERNS: Record<string, number[]> = {
  '1':    [35, 28, 22, 15],
  '4':    [15, 22, 28, 35],
  '2a':   [15, 35, 28, 22],
  '2b':   [28, 35, 22, 15],
  '2c':   [22, 35, 28, 15],
  '3a':   [15, 22, 35, 28],
  '3b':   [22, 28, 35, 15],
  '3c':   [15, 28, 35, 22],
  '1-3a': [35, 15, 28, 22],
  '1-3b': [35, 22, 28, 15],
  '3-1a': [28, 15, 35, 22],
  '3-1b': [28, 22, 35, 15],
  '2-4a': [15, 35, 22, 28],
  '2-4b': [22, 35, 15, 28],
  '4-2a': [22, 28, 15, 35],
  '4-2b': [15, 28, 22, 35],
}

export const CHERNYAK_PATTERNS_ADVANCED: Record<string, number[]> = {
  '1':    [33, 28, 22, 17],
  '2a':   [17, 33, 28, 22],
  '2b':   [28, 33, 22, 17],
  '2c':   [22, 33, 28, 17],
  '3a':   [17, 22, 33, 28],
  '3b':   [22, 28, 33, 17],
  '3c':   [17, 28, 33, 22],
  '1-3a': [33, 17, 28, 22],
  '1-3b': [33, 22, 28, 17],
  '3-1a': [28, 17, 33, 22],
  '3-1b': [28, 22, 33, 17],
  '4':    [17, 22, 28, 33],
  '2-4a': [17, 33, 22, 28],
  '2-4b': [22, 33, 17, 28],
  '4-2a': [22, 28, 17, 33],
  '4-2b': [17, 28, 22, 33],
}

export const CHERNYAK_PATTERNS_ELITE: Record<string, number[]> = {
  '1':    [32, 27, 22, 19],
  '2a':   [19, 32, 27, 22],
  '2b':   [27, 32, 22, 19],
  '2c':   [22, 32, 27, 19],
  '3a':   [19, 22, 32, 27],
  '3b':   [22, 27, 32, 19],
  '3c':   [19, 27, 32, 22],
  '1-3a': [32, 19, 27, 22],
  '1-3b': [32, 22, 27, 19],
  '3-1a': [27, 19, 32, 22],
  '3-1b': [27, 22, 32, 19],
  '4':    [19, 22, 27, 32],
  '2-4a': [19, 32, 22, 27],
  '2-4b': [22, 32, 19, 27],
  '4-2a': [22, 27, 19, 32],
  '4-2b': [19, 27, 22, 32],
}

export const CHERNYAK_BY_LEVEL: Record<string, Record<string, number[]>> = {
  beginner: CHERNYAK_PATTERNS,
  intermediate: CHERNYAK_PATTERNS,
  advanced: CHERNYAK_PATTERNS_ADVANCED,
  elite: CHERNYAK_PATTERNS_ELITE,
}

// ─── Session Distribution Patterns ──────────────────────────

export const SESSION_PATTERNS: Record<number, Record<string, number[]>> = {
  2: {
    d40_60: [40, 60],
    d35_65: [35, 65],
    d30_70: [30, 70],
    d25_75: [25, 75],
    d20_80: [20, 80],
  },
  3: {
    d25_33_42: [25, 33, 42],
    d20_35_45: [20, 35, 45],
    d22_28_50: [22, 28, 50],
    d20_30_50: [20, 30, 50],
    d15_35_50: [15, 35, 50],
    d15_30_55: [15, 30, 55],
  },
  4: {
    d15_22_28_35: [15, 22, 28, 35],
    d10_20_30_40: [10, 20, 30, 40],
  },
  5: {
    d10_15_20_25_30: [10, 15, 20, 25, 30],
  },
}

// ─── Zone Configuration ─────────────────────────────────────

/** Zone key → percentage of 1RM (used for ARI calculation) */
export const ZONE_PERCENTAGES: Record<string, number> = {
  '65': 65,
  '75': 75,
  '85': 85,
  '90': 92.5,  // 90% zone = 91-94% range, central value 92.5
  '95': 95,
}

/** Rep ranges per zone: [min, max] */
export const REP_RANGES: Record<string, [number, number]> = {
  '55': [5, 8],
  '65': [4, 7],
  '75': [3, 6],
  '85': [2, 4],
  '90': [1, 1],
  '95': [1, 1],
}

/** All zone keys in ascending intensity order */
export const ZONE_ORDER = ['65', '75', '85', '90', '95'] as const

// ─── Reference Data ─────────────────────────────────────────

export const MONTHLY_NL_RANGES = {
  prep: {
    squat: [150, 350] as const,
    bench_press: [250, 400] as const,
    deadlift: [150, 350] as const,
  },
  comp: {
    squat: [150, 250] as const,
    bench_press: [200, 350] as const,
    deadlift: [150, 250] as const,
  },
}

export const TARGET_ARI = {
  prep: { min: 71, max: 74 },
  comp: { min: 74, max: 77 },
}
