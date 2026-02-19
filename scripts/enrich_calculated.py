#!/usr/bin/env python3
"""
Enrich Excel-converted program JSONs with per-session NL distribution
in calculated.{lift}.week_N.sessions.

Reads the actual sets from sessions.{A,B,C}.week_N.lifts[].sets[] and
computes per-session zone breakdown to populate the missing data.

Usage:
    python3 scripts/enrich_calculated.py
"""

import json
import os
from pathlib import Path


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
                    pct = s.get("zone_pct", 0)
                    zone = zone_from_pct(pct)
                    zones[zone] += reps
                    total += reps

                result[lift_name][week_key][sess_letter] = {
                    "total": total,
                    "zones": zones,
                }

    return result


def enrich_program(filepath):
    """Add per-session NL to calculated section of a program JSON."""
    with open(filepath, "r", encoding="utf-8") as f:
        program = json.load(f)

    calculated = program.get("calculated", {})
    if not calculated:
        print(f"  Skipping {filepath}: no calculated section")
        return False

    per_session = compute_per_session_nl(program)
    changed = False

    for lift_name, lift_calc in calculated.items():
        if lift_name.startswith("_"):
            continue

        for week_key in [f"week_{w}" for w in range(1, 9)]:
            if week_key not in lift_calc:
                continue

            # Check if sessions already present
            if "sessions" in lift_calc[week_key] and lift_calc[week_key]["sessions"]:
                continue

            # Get per-session data for this lift/week
            if lift_name in per_session and week_key in per_session[lift_name]:
                sess_data = per_session[lift_name][week_key]
                # Sort by letter
                lift_calc[week_key]["sessions"] = dict(sorted(sess_data.items()))
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
