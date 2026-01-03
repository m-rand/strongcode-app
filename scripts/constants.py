"""
StrongCode constants and patterns
Based on Chernyak's stable structural constants and PlanStrong methodology
Source: CLAUDE.md, PROFESSIONAL_PLANS_ANALYSIS.md
"""

# Chernyak's Volume Distribution Patterns (weekly distribution %)
# Format: [week1%, week2%, week3%, week4%]
# Source: CLAUDE.md - "16 Classic Variants"
CHERNYAK_PATTERNS = {
    # Gradual patterns (single peak)
    "1": [35, 28, 22, 15],      # Gradual descend
    "4": [15, 22, 28, 35],      # Gradual ascend

    # Sharp-Gradual patterns
    "2a": [15, 35, 28, 22],
    "2b": [28, 35, 22, 15],
    "2c": [22, 35, 28, 15],

    # Gradual-Sharp patterns
    "3a": [15, 22, 35, 28],     # Popular for prep
    "3b": [22, 28, 35, 15],     # Popular for comp
    "3c": [15, 28, 35, 22],

    # Sharp patterns (two peaks)
    "1-3a": [35, 15, 28, 22],
    "1-3b": [35, 22, 28, 15],   # Popular for comp
    "3-1a": [28, 15, 35, 22],
    "3-1b": [28, 22, 35, 15],   # Popular for comp

    # Mixed patterns
    "2-4a": [15, 35, 22, 28],
    "2-4b": [22, 35, 15, 28],
    "4-2a": [22, 28, 15, 35],
    "4-2b": [15, 28, 22, 35],
}

# Skill level adjustments for patterns
# Source: CLAUDE.md - "Skill Level Adjustments"
SKILL_LEVEL_ADJUSTMENTS = {
    "beginner": [15, 22, 28, 35],      # Standard variability
    "intermediate": [15, 22, 28, 35],   # Standard
    "advanced": [17, 22, 28, 33],       # Slightly less variable
    "elite": [19, 22, 27, 33],          # Even less variable
}

# Session distribution patterns (3 sessions per week)
# Source: Excel INPUT sheet
SESSION_PATTERNS_3_DAYS = {
    "d25_33_42": [25, 33, 42],
    "d20_35_45": [20, 35, 45],
    "d22_28_50": [22, 28, 50],
    "d20_30_50": [20, 30, 50],
    "d15_35_50": [15, 35, 50],
    "d15_30_55": [15, 30, 55],
}

# Session distribution patterns (2 sessions per week)
# Source: Excel INPUT sheet
SESSION_PATTERNS_2_DAYS = {
    "d40_60": [40, 60],
    "d35_65": [35, 65],
    "d30_70": [30, 70],
    "d25_75": [25, 75],
    "d20_80": [20, 80],
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

# Default rounding values (kg)
DEFAULT_ROUNDING = 2.5

# Days of week
DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
