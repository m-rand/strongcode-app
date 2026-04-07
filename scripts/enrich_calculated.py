#!/usr/bin/env python3
"""
Enrich Excel-converted program JSONs with per-session NL distribution
in calculated.{lift}.week_N.sessions, and compute ARE (Average Relative
Effort) when rm_profile is available.

Reads the actual sets from sessions.{A,B,C}.week_N.lifts[].sets[] and
computes per-session zone breakdown to populate the missing data.

Usage:
    python3 scripts/enrich_calculated.py
"""

import json
import os
import sys
from pathlib import Path

# Add scripts dir to path for imports
sys.path.insert(0, str(Path(__file__).parent))
from utilities import build_rm_lookup, calculate_are


def zone_from_pct(pct):
    """Map zone_pct (0.0-1.0) to zone key string."""
    if pct <= 0.60:
        return "55"
    elif pct <= 0.70:
        return "65"
    elif pct <= 0.80:
        return "75"
    elif pct <= 0.90:
        return "85"
    elif pct <= 0.94:
        return "90"
    else:
        return "95"


def compute_per_session_nl(program):
    """
    From sessions.{letter}.{week}.lifts[].sets[],
    compute per-session NL distribution grouped by lift and zone.
    
    Returns: {lift: {week_key: {session_letter: {total, zones}}}}
    """
    sessions = program.get("sessions", {})
    result = {}  # lift -> week_key -> session_letter -> {total, zones}

    for sess_letter, weeks in sessions.items():
        for week_key, week_data in weeks.items():
            lifts = week_data.get("lifts", [])
            for lift_entry in lifts:
                lift_name = lift_entry["lift"]
                if lift_name not in result:
                    result[lift_name] = {}
                if week_key not in result[lift_name]:
                    result[lift_name][week_key] = {}

                zones = {"55": 0, "65": 0, "75": 0, "85": 0, "90": 0, "95": 0}
                total = 0

                for s in lift_entry.get("sets", []):
                    reps = s.get("reps", 0)
                    # Prefer percentage (0-100) over zone_pct (0-1)
                    percentage = s.get("percentage")
                    if percentage is not None:
                        pct = float(percentage) / 100
                    else:
                        pct = s.get("zone_pct", 0)
                    zone = zone_from_pct(pct)
                    zones[zone] += reps
                    total += reps

                result[lift_name][week_key][sess_letter] = {
                    "total": total,
                    "zones": zones,
                }

    return result


def collect_sets_by_lift_week_session(program):
    """
    Collect raw sets grouped by lift, week, and session letter.

    Returns: {lift: {week_key: {session_letter: [set_dicts]}}}
    """
    sessions = program.get("sessions", {})
    result = {}

    for sess_letter, weeks in sessions.items():
        for week_key, week_data in weeks.items():
            lifts = week_data.get("lifts", [])
            for lift_entry in lifts:
                lift_name = lift_entry["lift"]
                if lift_name not in result:
                    result[lift_name] = {}
                if week_key not in result[lift_name]:
                    result[lift_name][week_key] = {}
                if sess_letter not in result[lift_name][week_key]:
                    result[lift_name][week_key][sess_letter] = []

                result[lift_name][week_key][sess_letter].extend(
                    lift_entry.get("sets", [])
                )

    return result


def compute_are_for_program(program):
    """
    Compute ARE (Average Relative Effort) per session, week, and block
    for each lift, using rm_profile from program's client section.

    Returns: {lift: {_summary: {block_are}, week_N: {are, sessions: {letter: {are}}}}}
             or empty dict if rm_profile is not available.
    """
    client = program.get("client", {})
    rm_profile_data = client.get("rm_profile", {})
    if not rm_profile_data:
        return {}

    sets_by_lift = collect_sets_by_lift_week_session(program)
    result = {}

    for lift_name, rm_data in rm_profile_data.items():
        if lift_name not in sets_by_lift:
            continue

        # Build known_rms: {pct: rm} — add 100: 1 (1RM = 1 rep by definition)
        known_rms = {float(pct): int(rm) for pct, rm in rm_data.items()}
        known_rms[100] = 1
        rm_lookup = build_rm_lookup(known_rms)

        lift_result = {}
        all_block_sets = []

        week_data = sets_by_lift[lift_name]
        for week_key in sorted(week_data.keys()):
            sessions_data = week_data[week_key]
            week_sets = []
            session_ares = {}

            for sess_letter in sorted(sessions_data.keys()):
                sess_sets = sessions_data[sess_letter]
                sess_are = calculate_are(sess_sets, rm_lookup)
                session_ares[sess_letter] = {"are": sess_are}
                week_sets.extend(sess_sets)

            week_are = calculate_are(week_sets, rm_lookup)
            lift_result[week_key] = {
                "are": week_are,
                "sessions": session_ares,
            }
            all_block_sets.extend(week_sets)

        block_are = calculate_are(all_block_sets, rm_lookup)
        lift_result["_summary"] = {"block_are": block_are}
        result[lift_name] = lift_result

    return result


def enrich_program(filepath):
    """Add per-session NL and ARE to calculated section of a program JSON."""
    with open(filepath, "r", encoding="utf-8") as f:
        program = json.load(f)

    calculated = program.get("calculated", {})
    if not calculated:
        print(f"  Skipping {filepath}: no calculated section")
        return False

    per_session = compute_per_session_nl(program)
    are_data = compute_are_for_program(program)
    changed = False

    for lift_name, lift_calc in calculated.items():
        if lift_name.startswith("_"):
            continue

        # Enrich with ARE block summary
        if lift_name in are_data and "_summary" in are_data[lift_name]:
            summary = lift_calc.get("_summary", {})
            summary["block_are"] = are_data[lift_name]["_summary"]["block_are"]
            lift_calc["_summary"] = summary
            changed = True

        for week_key in [f"week_{w}" for w in range(1, 9)]:
            if week_key not in lift_calc:
                continue

            # Add per-session NL if missing
            if not lift_calc[week_key].get("sessions"):
                if lift_name in per_session and week_key in per_session[lift_name]:
                    sess_data = per_session[lift_name][week_key]
                    lift_calc[week_key]["sessions"] = dict(sorted(sess_data.items()))
                    changed = True

            # Add ARE per week and per session
            if lift_name in are_data and week_key in are_data[lift_name]:
                week_are = are_data[lift_name][week_key]
                lift_calc[week_key]["are"] = week_are["are"]
                # Merge session ARE into existing session data
                if "sessions" in lift_calc[week_key]:
                    for sess_letter, sess_are in week_are.get("sessions", {}).items():
                        if sess_letter in lift_calc[week_key]["sessions"]:
                            lift_calc[week_key]["sessions"][sess_letter]["are"] = sess_are["are"]
                changed = True

    if changed:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(program, f, ensure_ascii=False, indent=2)
        print(f"  Enriched: {os.path.basename(filepath)}")
    else:
        print(f"  No changes: {os.path.basename(filepath)}")

    return changed


def main():
    programs_dir = Path("data/programs_json")
    files = sorted(programs_dir.glob("*.json"))

    if not files:
        print("No JSON files found in data/programs_json/")
        return

    print(f"Processing {len(files)} files...")
    for f in files:
        enrich_program(str(f))


if __name__ == "__main__":
    main()
