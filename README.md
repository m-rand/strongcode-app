# StrongCode - Powerlifting Program Generator

JSON-based powerlifting program generator with AI-enhanced session planning.

## Project Structure

```
strong-code/
├── data/                    # JSON data files
│   ├── clients/            # Client data & programs
│   └── templates/          # Program templates
├── scripts/                # Python calculation scripts
├── backend/                # FastAPI server (optional)
├── frontend/               # Next.js web app
└── docs/                   # Documentation
```

## Tech Stack

- **Data**: JSON files (file-based, no database)
- **Calculations**: Python (FastAPI)
- **Frontend**: Next.js + TypeScript
- **Hosting**: Vercel (frontend) + Synology (backend/data)
- **AI**: Claude API (optional session generation)

## Quick Start

### 1. Setup Python environment

```bash
cd scripts
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Create a program

```bash
python create_program.py \
  --client "katerina-balasova" \
  --start-date "2025-01-20" \
  --phase "prep"
```

### 3. Calculate targets

```bash
python calculate_targets.py \
  data/clients/katerina-balasova/programs/2025-01-20_prep.json
```

### 4. Generate sessions (AI)

```bash
python generate_sessions.py \
  data/clients/katerina-balasova/programs/2025-01-20_prep.json
```

## File Naming Convention

Programs: `YYYY-MM-DD_phase_lifts.json`

Examples:
- `2025-01-20_prep_squat-bench-deadlift.json`
- `2025-02-17_comp_squat.json`

## Development

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
# http://localhost:3000
```

### Backend (FastAPI)

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
# http://localhost:8000
```

## Deployment

**Frontend:** Vercel (free tier)
```bash
vercel deploy
```

**Backend:** Synology Docker
```bash
docker-compose up -d
```

## Documentation

See `../Strong Code/` directory for:
- `CLAUDE.md` - Complete StrongCode 60 analysis
- `JSON_WORKFLOW_DESIGN.md` - Architecture & schemas
- `PROFESSIONAL_PLANS_ANALYSIS.md` - Real-world examples

## License

Private project - Marcel Balas
