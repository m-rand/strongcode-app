# StrongCode Scripts

Python scripts for program generation and validation.

## Setup

```bash
cd scripts
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Available Scripts

### 1. `validate.py` - JSON Schema Validator

Validates JSON files against schemas.

**Usage:**
```bash
python validate.py <file.json>
```

**Examples:**
```bash
# Validate profile
python validate.py ../data/clients/katerina-balasova/profile.json

# Validate program
python validate.py ../data/clients/katerina-balasova/programs/2025-01-20_prep.json
```

**Output:**
```
📄 Validating: data/clients/katerina-balasova/profile.json
   Type: profile
   Schema version: 1.0
   Using schema: schemas/v1.0/profile.schema.json

✅ Validation PASSED
```

**Error example:**
```
❌ Validation FAILED (2 errors):

1. Path: one_rm_history
   Error: [] is too short
   Missing: ['date']

2. Path: schema_version
   Error: '2.0' does not match '^1\\.0$'
```

---

### 2. `create_program.py` - Program Creator (TODO)

Creates new program from template.

```bash
python create_program.py \
  --client "katerina-balasova" \
  --start-date "2025-01-20" \
  --phase "prep" \
  --lifts "squat,bench_press,deadlift"
```

---

### 3. `calculate_targets.py` - Target Calculator (TODO)

Calculates volume/intensity targets from input parameters.

```bash
python calculate_targets.py \
  ../data/clients/katerina-balasova/programs/2025-01-20_prep.json
```

---

### 4. `generate_sessions.py` - AI Session Generator (TODO)

Generates specific sessions using Claude API.

```bash
export ANTHROPIC_API_KEY="sk-..."

python generate_sessions.py \
  ../data/clients/katerina-balasova/programs/2025-01-20_prep.json \
  --ai
```

---

## Development

Run validator in development mode:

```bash
# Watch mode (validates on file changes)
# TODO: implement
python validate.py --watch ../data/
```

## Testing

```bash
# Validate all files in data directory
find ../data -name "*.json" -exec python validate.py {} \;
```
