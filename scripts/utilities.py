"""
Utility functions for StrongCode calculations
"""

from typing import Dict, List, Tuple
from constants import ZONE_PERCENTAGES, DEFAULT_ROUNDING


def calculate_weight(one_rm: float, percentage: int, rounding: float = DEFAULT_ROUNDING) -> float:
    """
    Calculate and round weight based on 1RM and percentage

    Args:
        one_rm: One rep max in kg
        percentage: Percentage of 1RM (e.g., 65, 75, 85)
        rounding: Rounding increment in kg (default 2.5)

    Returns:
        Rounded weight in kg

    Example:
        >>> calculate_weight(142.5, 75, 2.5)
        107.5
    """
    raw_weight = one_rm * (percentage / 100)
    rounded_weight = round(raw_weight / rounding) * rounding
    return rounded_weight


def calculate_all_weights(one_rm: float, rounding: float = DEFAULT_ROUNDING) -> Dict[str, float]:
    """
    Calculate all zone weights for a given 1RM

    Args:
        one_rm: One rep max in kg
        rounding: Rounding increment in kg

    Returns:
        Dictionary of zone -> rounded weight

    Example:
        >>> calculate_all_weights(142.5, 2.5)
        {'65': 92.5, '75': 107.5, '85': 121.0, '92': 132.5, '95': 135.0}
    """
    weights = {}
    for zone, percentage in ZONE_PERCENTAGES.items():
        weights[zone] = calculate_weight(one_rm, percentage, rounding)
    return weights


def calculate_ari(zone_reps: Dict[str, int]) -> float:
    """
    Calculate Average Relative Intensity (ARI)

    ARI = weighted average of intensities
    Formula: SUM(zone_intensity × zone_reps) / total_reps

    Args:
        zone_reps: Dictionary of zone -> reps count
                   Keys: '65', '75', '85', '90', '95'

    Returns:
        ARI as percentage (e.g., 74.07)

    Example:
        >>> calculate_ari({'65': 12, '75': 15, '85': 7})
        73.9  # (0.65×12 + 0.75×15 + 0.85×7) / 34
    """
    if not zone_reps:
        return 0.0

    total_intensity = 0
    total_reps = 0

    for zone, reps in zone_reps.items():
        if reps > 0:
            # Map zone to intensity percentage
            zone_intensity = ZONE_PERCENTAGES.get(zone, 75)
            total_intensity += zone_intensity * reps
            total_reps += reps

    if total_reps == 0:
        return 0.0

    return round(total_intensity / total_reps, 1)


def interpolate_rm(known_rms: Dict[float, int], target_pct: float) -> float:
    """
    Estimate RM (rep max) at a given percentage of 1RM using known data points.

    Uses linear interpolation between the two nearest bracketing points.
    Extrapolates below the lowest known point using Zonin's Case 2 formula:
        RM(P%) = RM(Pt%) + ((RM(Pt%) - 1) / (100 - Pt)) × (Pt - P)

    Args:
        known_rms: Dict of {percentage: max_reps}, e.g. {75: 8, 85: 4, 92.5: 2, 100: 1}
                   Must include at least one data point.
        target_pct: Target percentage (e.g. 65, 70, 80)

    Returns:
        Estimated RM at target_pct (float, minimum 1.0)

    Example:
        >>> interpolate_rm({75: 8, 85: 4, 92.5: 2, 100: 1}, 80)
        6.0
    """
    if not known_rms:
        raise ValueError("known_rms must have at least one data point")

    # Sort points by percentage ascending
    points = sorted(known_rms.items(), key=lambda x: x[0])

    # Exact match
    for pct, rm in points:
        if abs(pct - target_pct) < 0.01:
            return float(rm)

    # Find bracketing points
    lower = None
    upper = None
    for pct, rm in points:
        if pct < target_pct:
            lower = (pct, rm)
        elif pct > target_pct and upper is None:
            upper = (pct, rm)

    if lower and upper:
        # Linear interpolation between two bracketing points
        pct_lo, rm_lo = lower
        pct_hi, rm_hi = upper
        ratio = (target_pct - pct_lo) / (pct_hi - pct_lo)
        result = rm_lo + ratio * (rm_hi - rm_lo)
        return max(1.0, round(result, 1))

    if upper and not lower:
        # Extrapolate below the lowest known point using Zonin Case 2
        pt, rm_pt = upper
        result = rm_pt + ((rm_pt - 1) / (100 - pt)) * (pt - target_pct)
        return max(1.0, round(result, 1))

    if lower and not upper:
        # Extrapolate above the highest known point using Zonin Case 2
        pt, rm_pt = lower
        result = rm_pt + ((rm_pt - 1) / (100 - pt)) * (pt - target_pct)
        return max(1.0, round(result, 1))

    # Fallback (should not happen)
    return 1.0


def build_rm_lookup(known_rms: Dict[float, int], zones: List[float] = None) -> Dict[float, float]:
    """
    Build a complete RM lookup table for all needed intensity zones.

    Args:
        known_rms: Dict of {percentage: max_reps}, e.g. {75: 8, 85: 4, 92.5: 2, 100: 1}
        zones: List of percentages to compute RM for.
               Default: [55, 60, 65, 70, 75, 80, 85, 90, 92.5, 95, 100]

    Returns:
        Dict of {percentage: estimated_rm}

    Example:
        >>> build_rm_lookup({75: 8, 85: 4, 92.5: 2, 100: 1})
        {55: 16.8, 60: 14.8, 65: 12.8, 70: 10.4, 75: 8.0, 80: 6.0, 85: 4.0, 90: 3.0, 92.5: 2.0, 95: 1.3, 100: 1.0}
    """
    if zones is None:
        zones = [55, 60, 65, 70, 75, 80, 85, 90, 92.5, 95, 100]

    return {pct: interpolate_rm(known_rms, pct) for pct in zones}


def calculate_are(sets: List[Dict], rm_lookup: Dict[float, float]) -> float:
    """
    Calculate Average Relative Effort (ARE) from a list of sets.

    ARE = average of (reps_performed / RM_at_that_weight) across all sets.
    Per-set average (not rep-weighted), per Zonin's definition.

    Args:
        sets: List of set dicts, each with 'reps' (int) and 'zone_pct' (float, 0.0-1.0)
        rm_lookup: Dict of {percentage: estimated_rm}, e.g. {75: 8.0, 80: 6.0, ...}

    Returns:
        ARE as percentage (0-100). Returns 0.0 if no valid sets.

    Example:
        >>> sets = [{'reps': 2, 'zone_pct': 0.80}, {'reps': 3, 'zone_pct': 0.80}, {'reps': 5, 'zone_pct': 0.80}]
        >>> rm_lookup = {80: 6.0}
        >>> calculate_are(sets, rm_lookup)
        55.6  # avg(2/6, 3/6, 5/6) = avg(33.3, 50.0, 83.3) = 55.6%
    """
    if not sets or not rm_lookup:
        return 0.0

    efforts = []
    for s in sets:
        reps = s.get('reps', 0)
        # Prefer percentage (0-100, from editor) over zone_pct (0-1, from import)
        percentage = s.get('percentage')
        zone_pct = s.get('zone_pct', 0)
        if percentage is not None:
            pct_100 = round(float(percentage), 1)
        elif zone_pct:
            pct_100 = round(zone_pct * 100, 1)
        else:
            continue
        if reps <= 0 or pct_100 <= 0:
            continue

        # Find nearest RM in lookup
        rm = _find_nearest_rm(rm_lookup, pct_100)
        if rm <= 0:
            continue

        effort = reps / rm
        # Cap at 1.0 (100%) — can't exceed RM by definition
        efforts.append(min(effort, 1.0))

    if not efforts:
        return 0.0

    return round(sum(efforts) / len(efforts) * 100, 1)


def _find_nearest_rm(rm_lookup: Dict[float, float], target_pct: float) -> float:
    """Find RM for the nearest percentage in the lookup table."""
    if not rm_lookup:
        return 0.0

    # Exact match (with tolerance)
    for pct, rm in rm_lookup.items():
        if abs(pct - target_pct) < 0.5:
            return rm

    # Find nearest
    nearest_pct = min(rm_lookup.keys(), key=lambda p: abs(p - target_pct))
    return rm_lookup[nearest_pct]


def convert_absolute_reps_to_percent(
    total_nl: int,
    zone_75_pct: float,
    zone_85_pct: float,
    zone_90_reps: int,
    zone_95_reps: int
) -> Dict[str, float]:
    """
    Convert absolute reps for 90% and 95% zones to percentages
    and auto-calculate 65% zone

    Args:
        total_nl: Total monthly NL
        zone_75_pct: Percentage for 75% zone (e.g., 45)
        zone_85_pct: Percentage for 85% zone (e.g., 13)
        zone_90_reps: Absolute reps for 90% zone
        zone_95_reps: Absolute reps for 95% zone

    Returns:
        Dictionary with all zone percentages

    Example:
        >>> convert_absolute_reps_to_percent(350, 45, 13, 4, 0)
        {'65': 41.0, '75': 45.0, '85': 13.0, '90': 1.1, '95': 0.0}
    """
    # Convert absolute reps to percentages
    zone_90_pct = (zone_90_reps / total_nl * 100) if total_nl > 0 else 0
    zone_95_pct = (zone_95_reps / total_nl * 100) if total_nl > 0 else 0

    # Calculate 65% as remainder to 100%
    zone_65_pct = 100 - zone_75_pct - zone_85_pct - zone_90_pct - zone_95_pct

    return {
        '65': round(zone_65_pct, 1),
        '75': float(zone_75_pct),
        '85': float(zone_85_pct),
        '90': round(zone_90_pct, 1),
        '95': round(zone_95_pct, 1),
    }


def distribute_volume(total_reps: int, distribution: List[int]) -> List[int]:
    """
    Distribute total reps according to percentage distribution

    Args:
        total_reps: Total number of reps to distribute
        distribution: List of percentages (must sum to 100)

    Returns:
        List of rep counts

    Example:
        >>> distribute_volume(350, [15, 22, 35, 28])
        [52, 77, 122, 98]  # Note: may not sum exactly due to rounding
    """
    if sum(distribution) != 100:
        raise ValueError(f"Distribution must sum to 100, got {sum(distribution)}")

    result = []
    remaining = total_reps

    for i, pct in enumerate(distribution):
        if i == len(distribution) - 1:
            # Last item gets remainder to ensure exact total
            result.append(remaining)
        else:
            reps = round(total_reps * pct / 100)
            result.append(reps)
            remaining -= reps

    return result


def distribute_intensity_zones(total_reps: int, zone_distribution: Dict[str, float]) -> Dict[str, int]:
    """
    Distribute total reps across intensity zones

    Args:
        total_reps: Total number of reps
        zone_distribution: Dictionary of zone -> percentage (float)

    Returns:
        Dictionary of zone -> rep count (int, never negative)

    Example:
        >>> distribute_intensity_zones(350, {'65': 40.9, '75': 45.0, '85': 13.0, '90': 1.1, '95': 0.0})
        {'65': 143, '75': 158, '85': 46, '90': 4, '95': 0}
    """
    total_pct = sum(zone_distribution.values())
    if abs(total_pct - 100) > 1:
        raise ValueError(f"Zone distribution must sum to ~100%, got {total_pct}%")

    result = {}
    remaining = total_reps
    zones = list(zone_distribution.keys())

    for i, zone in enumerate(zones):
        pct = zone_distribution[zone]

        if i == len(zones) - 1:
            # Last zone gets remainder (ensure non-negative)
            result[zone] = max(0, remaining)
        else:
            reps = round(total_reps * pct / 100)
            # Ensure non-negative
            reps = max(0, reps)
            result[zone] = reps
            remaining -= reps

    return result


def get_current_1rm(profile: Dict, lift: str) -> Tuple[float, str]:
    """
    Get most recent 1RM for a lift from profile

    Args:
        profile: Profile dictionary with one_rm_history
        lift: Lift name (e.g., 'squat', 'bench_press')

    Returns:
        Tuple of (1rm_value, date)

    Example:
        >>> profile = {
        ...     'one_rm_history': [
        ...         {'date': '2025-01-15', 'squat': 142.5},
        ...         {'date': '2024-12-01', 'squat': 140.0}
        ...     ]
        ... }
        >>> get_current_1rm(profile, 'squat')
        (142.5, '2025-01-15')
    """
    history = profile.get('one_rm_history', [])

    # Sort by date descending
    sorted_history = sorted(history, key=lambda x: x['date'], reverse=True)

    for entry in sorted_history:
        if lift in entry and entry[lift] is not None:
            return entry[lift], entry['date']

    raise ValueError(f"No 1RM found for {lift} in profile history")


def validate_distribution(distribution: List[int], expected_sum: int = 100) -> bool:
    """
    Validate that distribution sums to expected value

    Args:
        distribution: List of percentages
        expected_sum: Expected sum (default 100)

    Returns:
        True if valid

    Raises:
        ValueError if invalid
    """
    total = sum(distribution)
    if abs(total - expected_sum) > 1:  # Allow 1% tolerance
        raise ValueError(f"Distribution sums to {total}, expected {expected_sum}")
    return True


def calculate_session_targets(
    week_total: int,
    zone_reps: Dict[str, int],
    session_distribution: List[int]
) -> List[Dict]:
    """
    Calculate targets for each session in a week

    Args:
        week_total: Total reps for the week
        zone_reps: Reps per zone for the week
        session_distribution: Percentage distribution across sessions

    Returns:
        List of session dictionaries with total and zone targets

    Example:
        >>> calculate_session_targets(
        ...     week_total=52,
        ...     zone_reps={'65': 21, '75': 23, '85': 8},
        ...     session_distribution=[25, 33, 42]
        ... )
        [
            {'total': 13, 'zones': {'65': 5, '75': 6, '85': 2}},
            {'total': 17, 'zones': {'65': 7, '75': 8, '85': 2}},
            {'total': 22, 'zones': {'65': 9, '75': 9, '85': 4}}
        ]
    """
    validate_distribution(session_distribution)

    # Distribute total reps across sessions
    session_totals = distribute_volume(week_total, session_distribution)

    sessions = []
    remaining_zones = {zone: reps for zone, reps in zone_reps.items()}

    for i, session_total in enumerate(session_totals):
        session_zones = {}

        # Distribute each zone across sessions
        for zone, zone_total in zone_reps.items():
            if i == len(session_totals) - 1:
                # Last session gets remainder
                session_zones[zone] = remaining_zones[zone]
            else:
                pct = session_distribution[i]
                zone_reps_this_session = round(zone_total * pct / 100)
                session_zones[zone] = zone_reps_this_session
                remaining_zones[zone] -= zone_reps_this_session

        sessions.append({
            'total': session_total,
            'zones': session_zones
        })

    return sessions
