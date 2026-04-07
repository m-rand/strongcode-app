"""
StrongCode constants and patterns
Based on Chernyak's stable structural constants and PlanStrong methodology
Source: CLAUDE.md, PROFESSIONAL_PLANS_ANALYSIS.md
"""

# Chernyak's Volume Distribution Patterns (weekly distribution %)
# Format: [week1%, week2%, week3%, week4%]
# Source: Excel reference tables (Volume Distribution Variant)

# Base patterns (standard variability — beginner/intermediate)
CHERNYAK_PATTERNS = {
    # Gradual patterns (single peak)
    "1": [35, 28, 22, 15],      # Gradual descend
    "4": [15, 22, 28, 35],      # Gradual ascend

    # Sharp-Gradual patterns (peak in week 2)
    "2a": [15, 35, 28, 22],
    "2b": [28, 35, 22, 15],
    "2c": [22, 35, 28, 15],

    # Gradual-Sharp patterns (peak in week 3)
    "3a": [15, 22, 35, 28],     # Popular for prep
    "3b": [22, 28, 35, 15],     # Popular for comp
    "3c": [15, 28, 35, 22],

    # Sharp patterns (two peaks — weeks 1+3 or 3+1)
    "1-3a": [35, 15, 28, 22],
    "1-3b": [35, 22, 28, 15],   # Popular for comp
    "3-1a": [28, 15, 35, 22],
    "3-1b": [28, 22, 35, 15],   # Popular for comp

    # Mixed patterns (peaks in weeks 2+4 or 4+2)
    "2-4a": [15, 35, 22, 28],
    "2-4b": [22, 35, 15, 28],
    "4-2a": [22, 28, 15, 35],
    "4-2b": [15, 28, 22, 35],
}

# Advanced patterns (slightly reduced variability)
CHERNYAK_PATTERNS_ADVANCED = {
    "1": [33, 28, 22, 17],
    "2a": [17, 33, 28, 22],
    "2b": [28, 33, 22, 17],
    "2c": [22, 33, 28, 17],
    "3a": [17, 22, 33, 28],
    "3b": [22, 28, 33, 17],
    "3c": [17, 28, 33, 22],
    "1-3a": [33, 17, 28, 22],
    "1-3b": [33, 22, 28, 17],
    "3-1a": [28, 17, 33, 22],
    "3-1b": [28, 22, 33, 17],
    "4": [17, 22, 28, 33],
    "2-4a": [17, 33, 22, 28],
    "2-4b": [22, 33, 17, 28],
    "4-2a": [22, 28, 17, 33],
    "4-2b": [17, 28, 22, 33],
}

# Elite patterns (minimal variability)
CHERNYAK_PATTERNS_ELITE = {
    "1": [32, 27, 22, 19],
    "2a": [19, 32, 27, 22],
    "2b": [27, 32, 22, 19],
    "2c": [22, 32, 27, 19],
    "3a": [19, 22, 32, 27],
    "3b": [22, 27, 32, 19],
    "3c": [19, 27, 32, 22],
    "1-3a": [32, 19, 27, 22],
    "1-3b": [32, 22, 27, 19],
    "3-1a": [27, 19, 32, 22],
    "3-1b": [27, 22, 32, 19],
    "4": [19, 22, 27, 32],
    "2-4a": [19, 32, 22, 27],
    "2-4b": [22, 32, 19, 27],
    "4-2a": [22, 27, 19, 32],
    "4-2b": [19, 27, 22, 32],
}

# All patterns by skill level
CHERNYAK_PATTERNS_BY_LEVEL = {
    "beginner": CHERNYAK_PATTERNS,
    "intermediate": CHERNYAK_PATTERNS,
    "advanced": CHERNYAK_PATTERNS_ADVANCED,
    "elite": CHERNYAK_PATTERNS_ELITE,
}

# Week-to-week volume percentages per pattern (for reference)
# Source: Excel "Volume Distribution Variant" table with two extra columns
#   Base: 50 30 20, 20 50 30, 30 50 20, 20 30 50, 30 20 50
#   Advanced: same values as CHERNYAK_PATTERNS
#   Elite: same values as CHERNYAK_PATTERNS_ELITE

# Session distribution patterns (2 sessions per week)
SESSION_PATTERNS_2_DAYS = {
    "d40_60": [40, 60],
    "d35_65": [35, 65],
    "d30_70": [30, 70],
    "d25_75": [25, 75],
    "d20_80": [20, 80],
}

# Session order labels for 2-session weeks
# M=Medium, H=Heavy
SESSION_ORDER_2_DAYS = {
    "d40_60": "MH",
    "d35_65": "HM",
}

# Session distribution patterns (3 sessions per week)
SESSION_PATTERNS_3_DAYS = {
    "d25_33_42": [25, 33, 42],
    "d20_35_45": [20, 35, 45],
    "d22_28_50": [22, 28, 50],
    "d20_30_50": [20, 30, 50],
    "d15_35_50": [15, 35, 50],
    "d15_30_55": [15, 30, 55],
}

# Session order labels for 3-session weeks
# L=Light, M=Medium, H=Heavy
SESSION_ORDER_3_DAYS = {
    "d25_33_42": "LMH",
    "d20_35_45": "LHM",
    "d22_28_50": "MLH",
    "d20_30_50": "MHL",
    "d15_35_50": "HLM",
    "d15_30_55": "HML",
}

# Session distribution patterns (4 sessions per week)
SESSION_PATTERNS_4_DAYS = {
    "d15_22_28_35": [15, 22, 28, 35],
    "d10_20_30_40": [10, 20, 30, 40],
}

# Session distribution patterns (5 sessions per week)
SESSION_PATTERNS_5_DAYS = {
    "d10_15_20_25_30": [10, 15, 20, 25, 30],
}

# All session patterns by number of sessions
SESSION_PATTERNS = {
    2: SESSION_PATTERNS_2_DAYS,
    3: SESSION_PATTERNS_3_DAYS,
    4: SESSION_PATTERNS_4_DAYS,
    5: SESSION_PATTERNS_5_DAYS,
}

# Skill level labels for 2-session distributions
SESSION_SKILL_2_DAYS = {
    "d40_60": "base",
    "d35_65": "advanced",
    "d30_70": "elite",
}

# Rep ranges per intensity zone
# Source: CLAUDE.md - "REP RANGES PRO JEDNOTLIVÉ SÉRIE"
REP_RANGES = {
    "65": [4, 7],   # 61-70% zone: 4-7 reps
    "75": [3, 6],   # 71-80% zone: 3-6 reps
    "85": [2, 4],   # 81-90% zone: 2-4 reps
    "92": [1, 1],   # 91-94% zone: 1 rep
    "95": [1, 1],   # 95-100% zone: 1 rep
}

# Intensity zone central weights (% of 1RM)
ZONE_PERCENTAGES = {
    "65": 65,
    "75": 75,
    "85": 85,
    "92": 92.5,
    "95": 95,
}

# Recommended patterns for competition
# Source: CLAUDE.md - "Recommended patterns pro Competition"
COMPETITION_PATTERNS = {
    "bench_press": ["3-1b"],
    "squat": ["1-3b", "3-1b", "2b", "2c", "3b", "1"],
    "deadlift": ["1-3b", "3-1b", "2b", "2c", "3b", "1"],
}

# Recommended monthly NL ranges
# Source: CLAUDE.md - "Number of reps / month"
MONTHLY_NL_RANGES = {
    "prep": {
        "squat": (150, 350),
        "bench_press": (250, 400),
        "deadlift": (150, 350),
        "overhead_press": (250, 400),
    },
    "comp": {
        "squat": (150, 250),
        "bench_press": (200, 350),
        "deadlift": (150, 250),
        "overhead_press": (200, 350),
    },
}

# Target ARI (Average Relative Intensity) ranges
# Source: CLAUDE.md - "ARI (Average Relative Intensity) cíle"
TARGET_ARI = {
    "hypertrophy": (71, 73),
    "strength": (73, 77),
    "preparatory": (71, 74),
    "peak": (74, 77),
}

# Intensity distribution guidelines (% of monthly NL)
# Source: CLAUDE.md - "Distribution of volume by intensity zones"
INTENSITY_DISTRIBUTION_GUIDELINES = {
    "hypertrophy_optimal": {
        "65": 40,
        "75": 45,
        "85": 15,
        "92": 0,
        "95": 0,
    },
    "strength_optimal": {
        "65": 30,
        "75": 40,
        "85": 25,
        "92": 5,
        "95": 0,
    },
}

# Target ARE (Average Relative Effort) ranges
# Source: Zonin, Programming Demystified seminar manual
# ARE = average of (reps_performed / RM_at_that_weight) across sets
TARGET_ARE = {
    "power": (30, 50),
    "strength": (40, 60),
    "strength_hypertrophy": (50, 70),
    "bodybuilding": (80, 100),
}

# Default rounding values (kg)
DEFAULT_ROUNDING = 2.5

# Session labels are abstract: A, B, C, D, ...
# Never use day names (monday, etc.) — the client decides when to train.
