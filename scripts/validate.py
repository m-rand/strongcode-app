#!/usr/bin/env python3
"""
JSON Schema validator for StrongCode files
Usage: python validate.py <file.json>
"""

import sys
import json
from pathlib import Path
from jsonschema import validate, ValidationError, Draft7Validator
from jsonschema.exceptions import SchemaError


def load_json(filepath):
    """Load JSON file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"❌ Error: File not found: {filepath}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON: {e}")
        sys.exit(1)


def get_schema_path(data, schema_type):
    """Get schema file path based on version"""
    version = data.get('schema_version', '1.0')

    # Get script directory and construct schema path
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    schema_path = project_root / 'schemas' / f'v{version}' / f'{schema_type}.schema.json'

    if not schema_path.exists():
        print(f"❌ Error: Schema not found: {schema_path}")
        print(f"   Available versions: {list((project_root / 'schemas').glob('v*'))}")
        sys.exit(1)

    return schema_path


def detect_schema_type(filepath, data):
    """Detect whether file is profile or program"""
    filename = Path(filepath).name

    if filename == 'profile.json':
        return 'profile'
    elif filename.endswith('.json') and 'program_info' in data:
        return 'program'
    elif filename.endswith('.json') and 'one_rm_history' in data:
        return 'profile'
    else:
        print(f"❌ Error: Cannot detect schema type for: {filename}")
        print("   Expected: profile.json or program file with program_info")
        sys.exit(1)


def validate_json(filepath):
    """Validate JSON file against schema"""
    print(f"📄 Validating: {filepath}")

    # Load data
    data = load_json(filepath)

    # Detect schema type
    schema_type = detect_schema_type(filepath, data)
    print(f"   Type: {schema_type}")

    # Get version
    version = data.get('schema_version', 'unknown')
    print(f"   Schema version: {version}")

    # Load schema
    schema_path = get_schema_path(data, schema_type)
    schema = load_json(schema_path)
    print(f"   Using schema: {schema_path}")

    # Validate
    try:
        validator = Draft7Validator(schema)
        errors = list(validator.iter_errors(data))

        if errors:
            print(f"\n❌ Validation FAILED ({len(errors)} errors):\n")
            for i, error in enumerate(errors, 1):
                print(f"{i}. Path: {' -> '.join(str(p) for p in error.path)}")
                print(f"   Error: {error.message}")
                if error.validator == 'required':
                    print(f"   Missing: {error.validator_value}")
                print()
            return False
        else:
            print("\n✅ Validation PASSED")

            # Additional checks
            if schema_type == 'profile':
                validate_profile_data(data)
            elif schema_type == 'program':
                validate_program_data(data)

            return True

    except SchemaError as e:
        print(f"❌ Schema Error: {e}")
        return False


def validate_profile_data(data):
    """Additional validation for profile data"""
    # Check 1RM history is sorted
    history = data.get('one_rm_history', [])
    if len(history) > 1:
        dates = [entry['date'] for entry in history]
        if dates != sorted(dates, reverse=True):
            print("⚠️  Warning: one_rm_history should be sorted by date (newest first)")

    # Check at least one 1RM value exists in latest entry
    if history:
        latest = history[0]
        lifts = ['squat', 'bench_press', 'deadlift', 'overhead_press']
        if not any(latest.get(lift) for lift in lifts):
            print("⚠️  Warning: Latest 1RM entry has no lift values")


def validate_program_data(data):
    """Additional validation for program data"""
    # Check intensity distribution sums to ~100%
    if 'input' in data:
        for lift, config in data['input'].items():
            dist = config.get('intensity_distribution', {})
            total = sum(dist.values())
            if abs(total - 100) > 1:
                print(f"⚠️  Warning: {lift} intensity_distribution sums to {total}% (should be ~100%)")

    # Check calculated targets match input
    if 'calculated' in data and 'input' in data:
        for lift in data['input'].keys():
            if lift in data['calculated']:
                input_nl = data['input'][lift]['monthly_nl']
                calc_total = sum(
                    week_data.get('total_reps', 0)
                    for week_data in data['calculated'][lift].values()
                )
                diff = abs(calc_total - input_nl)
                if diff > 5:
                    print(f"⚠️  Warning: {lift} calculated total ({calc_total}) differs from input ({input_nl}) by {diff} reps")


def main():
    if len(sys.argv) < 2:
        print("Usage: python validate.py <file.json>")
        print("\nExamples:")
        print("  python validate.py data/clients/katerina-balasova/profile.json")
        print("  python validate.py data/clients/katerina-balasova/programs/2025-01-20_prep.json")
        sys.exit(1)

    filepath = sys.argv[1]
    success = validate_json(filepath)

    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
