#!/usr/bin/env python3
"""
Calculate training targets from input parameters

Implements Excel formulas from SC60 PWL Template:
- Volume distribution across weeks (Chernyak patterns with skill level adjustments)
- Intensity zone distribution (with auto-calculation of 65% zone)
- Session targets
- ARI calculation (per week + overall block)

Usage: python calculate_targets.py <program.json>
"""

import sys
import json
from pathlib import Path
from typing import Dict, List

from constants import (
    CHERNYAK_PATTERNS,
    SKILL_LEVEL_ADJUSTMENTS,
    SESSION_PATTERNS_3_DAYS,
    SESSION_PATTERNS_2_DAYS,
    DAYS_OF_WEEK,
)
from utilities import (
    distribute_volume,
    distribute_intensity_zones,
    calculate_session_targets,
    calculate_ari,
    convert_absolute_reps_to_percent,
    validate_distribution,
)


def load_program(filepath: str) -> Dict:
    """Load program JSON file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"❌ Error: File not found: {filepath}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON: {e}")
        sys.exit(1)


def save_program(filepath: str, data: Dict):
    """Save program JSON file"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"✅ Saved: {filepath}\n")


def apply_skill_level_adjustment(pattern: List[int], skill_level: str) -> List[int]:
    """
    Apply skill level adjustment to Chernyak pattern

    Advanced/Elite patterns have less variability
    """
    if skill_level in SKILL_LEVEL_ADJUSTMENTS:
        return SKILL_LEVEL_ADJUSTMENTS[skill_level]
    return pattern


def get_session_pattern(pattern_name: str, sessions_per_week: int) -> List[int]:
    """Get session distribution pattern"""
    if sessions_per_week == 3:
        if pattern_name in SESSION_PATTERNS_3_DAYS:
            return SESSION_PATTERNS_3_DAYS[pattern_name]
        # Default for 3 days
        return SESSION_PATTERNS_3_DAYS['d25_33_42']
    elif sessions_per_week == 2:
        if pattern_name in SESSION_PATTERNS_2_DAYS:
            return SESSION_PATTERNS_2_DAYS[pattern_name]
        # Default for 2 days
        return SESSION_PATTERNS_2_DAYS['d40_60']
    else:
        # Custom: even distribution
        pct = round(100 / sessions_per_week)
        return [pct] * sessions_per_week


def calculate_lift_targets(
    lift_name: str,
    lift_config: Dict,
    skill_level: str,
    weeks: int,
    training_days: List[str]
) -> Dict:
    """
    Calculate all targets for a single lift

    Implements Excel formulas:
    1. Monthly NL → Weekly NL (Chernyak pattern + skill level)
    2. Convert 90%/95% absolute reps → percentages
    3. Weekly NL → Zone NL (intensity distribution)
    4. Weekly NL → Session NL (session distribution)
    5. Calculate ARI (per week + block overall)
    """
    print(f"\n  📊 Calculating: {lift_name}")

    # Extract config
    monthly_nl = lift_config['volume']
    volume_pattern_main = lift_config['volume_pattern_main']
    volume_pattern_8190 = lift_config.get('volume_pattern_8190', volume_pattern_main)
    intensity_dist = lift_config['intensity_distribution']
    sessions_per_week = lift_config['sessions_per_week']
    session_dist_name = lift_config['session_distribution']
    weights = lift_config['weights']

    print(f"     Volume: {monthly_nl} NL")
    print(f"     Pattern (main): {volume_pattern_main}")
    print(f"     Pattern (81-90): {volume_pattern_8190}")
    print(f"     Skill level: {skill_level}")

    # Get Chernyak patterns
    if volume_pattern_main not in CHERNYAK_PATTERNS:
        raise ValueError(f"Unknown volume pattern: {volume_pattern_main}")
    if volume_pattern_8190 not in CHERNYAK_PATTERNS:
        raise ValueError(f"Unknown 81-90 pattern: {volume_pattern_8190}")

    weekly_dist_main = CHERNYAK_PATTERNS[volume_pattern_main][:weeks]
    weekly_dist_8190 = CHERNYAK_PATTERNS[volume_pattern_8190][:weeks]

    # Note: We use patterns as-is. Skill level adjustments only apply
    # when no specific pattern is chosen (default/auto mode).
    # Explicitly chosen patterns like "3a", "2-4a" should be used exactly.

    print(f"     Weekly distribution (main): {weekly_dist_main}")
    print(f"     Weekly distribution (81-90): {weekly_dist_8190}")

    # Convert absolute reps (90%, 95%) to percentages
    zone_75_pct = intensity_dist['75_percent']
    zone_85_pct = intensity_dist['85_percent']
    zone_90_reps = intensity_dist['90_total_reps']
    zone_95_reps = intensity_dist['95_total_reps']

    zone_percentages = convert_absolute_reps_to_percent(
        monthly_nl,
        zone_75_pct,
        zone_85_pct,
        zone_90_reps,
        zone_95_reps
    )

    print(f"     Zone distribution: {zone_percentages}")

    # Calculate monthly NL for each zone
    monthly_zone_nl = {
        zone: round(monthly_nl * pct / 100)
        for zone, pct in zone_percentages.items()
    }

    # Distribute each zone across weeks using appropriate pattern
    # - 65%, 75% zones use MAIN pattern
    # - 85% zone uses 8190 pattern
    # - 90%, 95% zones use 8190 pattern (or could be constant)
    weekly_zones = {
        '65': distribute_volume(monthly_zone_nl['65'], weekly_dist_main),
        '75': distribute_volume(monthly_zone_nl['75'], weekly_dist_main),
        '85': distribute_volume(monthly_zone_nl['85'], weekly_dist_8190),
        '90': distribute_volume(monthly_zone_nl['90'], weekly_dist_8190),
        '95': distribute_volume(monthly_zone_nl['95'], weekly_dist_8190),
    }

    # Calculate weekly totals by summing all zones
    weekly_nl = [
        sum(weekly_zones[zone][week] for zone in weekly_zones)
        for week in range(weeks)
    ]
    print(f"     Weekly NL: {weekly_nl}")

    # Get session distribution pattern
    session_distribution = get_session_pattern(session_dist_name, sessions_per_week)
    print(f"     Session distribution: {session_distribution}")

    # Calculate targets for each week
    result = {}
    all_zone_reps = {'65': 0, '75': 0, '85': 0, '90': 0, '95': 0}

    for week_num in range(1, weeks + 1):
        week_idx = week_num - 1
        week_total = weekly_nl[week_idx]

        # Get zone reps for this week (already calculated above)
        zone_reps = {
            zone: weekly_zones[zone][week_idx]
            for zone in weekly_zones
        }

        # Accumulate for overall ARI
        for zone in all_zone_reps:
            all_zone_reps[zone] += zone_reps.get(zone, 0)

        # Calculate ARI for this week
        week_ari = calculate_ari(zone_reps)

        # Calculate session targets
        sessions = calculate_session_targets(
            week_total,
            zone_reps,
            session_distribution
        )

        # Map sessions to days
        session_data = {}
        for i, day in enumerate(training_days[:len(sessions)]):
            session_data[day] = sessions[i]

        result[f'week_{week_num}'] = {
            'total_reps': week_total,
            'zones': zone_reps,
            'ari': week_ari,
            'sessions': session_data,
        }

        print(f"     Week {week_num}: {week_total} NL, ARI={week_ari}%")

    # Calculate overall block ARI
    block_ari = calculate_ari(all_zone_reps)
    print(f"     Block ARI: {block_ari}%")

    # Add summary
    result['_summary'] = {
        'total_nl': monthly_nl,
        'actual_nl': sum(weekly_nl),
        'block_ari': block_ari,
        'zone_distribution': zone_percentages,
        'zone_totals': all_zone_reps,
        'weights': weights,
    }

    return result


def calculate_program_targets(program: Dict) -> Dict:
    """
    Calculate targets for entire program
    """
    print("🔢 Calculating program targets...")

    # Extract program info
    program_info = program.get('program_info', {})
    weeks = program_info.get('weeks', 4)

    # Get client info
    client = program.get('client', {})
    skill_level = client.get('delta', 'intermediate')
    one_rms = client.get('one_rm', {})

    # Get input data
    input_data = program.get('input', {})

    # Determine training days from first lift
    first_lift_config = next(iter(input_data.values()), {})
    sessions_per_week = first_lift_config.get('sessions_per_week', 3)

    # Default training days
    default_days = {
        2: ['monday', 'thursday'],
        3: ['monday', 'wednesday', 'friday'],
        4: ['monday', 'tuesday', 'thursday', 'friday'],
        5: ['monday', 'tuesday', 'wednesday', 'friday', 'saturday'],
    }
    training_days = default_days.get(sessions_per_week, ['monday', 'wednesday', 'friday'])

    # Calculate for each lift
    calculated = {}

    for lift_name, lift_config in input_data.items():
        if lift_name not in one_rms:
            print(f"⚠️  Warning: No 1RM found for {lift_name}, skipping")
            continue

        try:
            lift_targets = calculate_lift_targets(
                lift_name,
                lift_config,
                skill_level,
                weeks,
                training_days
            )
            calculated[lift_name] = lift_targets

        except Exception as e:
            print(f"❌ Error calculating {lift_name}: {e}")
            raise

    return calculated


def main():
    if len(sys.argv) < 2:
        print("Usage: python calculate_targets.py <program.json>")
        print("\nExample:")
        print("  python calculate_targets.py ../data/clients/katerina-balasova/programs/2025-01-20_prep_squat.json")
        sys.exit(1)

    filepath = sys.argv[1]
    print(f"📄 Loading: {filepath}\n")

    # Load program
    program = load_program(filepath)

    # Validate required fields
    if 'input' not in program:
        print("❌ Error: No 'input' section found in program JSON")
        sys.exit(1)

    if 'client' not in program or 'one_rm' not in program['client']:
        print("❌ Error: No 'client.one_rm' found in program JSON")
        sys.exit(1)

    # Calculate targets
    try:
        calculated = calculate_program_targets(program)

        # Add to program
        program['calculated'] = calculated

        # Save back
        save_program(filepath, program)

        print("✅ Calculation complete!")
        print(f"   Total lifts processed: {len(calculated)}")

        # Print summary
        for lift_name, lift_data in calculated.items():
            summary = lift_data.get('_summary', {})
            print(f"\n   {lift_name.upper()}:")
            print(f"     Total NL: {summary.get('actual_nl', 0)}")
            print(f"     Block ARI: {summary.get('block_ari', 0)}%")

    except Exception as e:
        print(f"\n❌ Calculation failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
