# StrongCode

Coach-managed powerlifting programming app built on PlanStrong/Chernyak principles.

StrongCode combines:
- deterministic block math (NL, zone distribution, ARI),
- AI-assisted set/session construction,
- coach/client workflows (surveys, program review, logging).

## Current Architecture

- App runtime: **Next.js App Router** in `frontend/`
- Database: **Turso (LibSQL)** via **Drizzle ORM**
- Auth: **NextAuth v5** (credentials + JWT)
- i18n: **next-intl** (`en`, `cs`)
- AI generation: **Vercel AI SDK** (`ai`) + Anthropic/OpenAI providers
- Program persistence: DB-backed (`programs` table), not filesystem-backed JSON

## Repository Layout

```text
strong-code/
├── frontend/                 # Main app (Next.js)
├── scripts/                  # Python utilities/reference scripts
├── schemas/                  # JSON schema files
├── docs/                     # Domain/reference docs
├── AGENTS.md                 # AI-generation implementation notes
└── CLAUDE.md                 # Full project snapshot
```

## Quick Start

### 1) Install frontend dependencies

```bash
cd frontend
npm install
```

### 2) Configure environment

Create `frontend/.env.local` with at least:

```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<strong-random-secret>

TURSO_DATABASE_URL=<libsql-url>
TURSO_AUTH_TOKEN=<turso-token>

RESEND_API_KEY=<optional-for-email-invites>
RESEND_FROM_EMAIL=info@strong-code.com

ANTHROPIC_API_KEY=<required-for-anthropic-generation>
OPENAI_API_KEY=<optional-fallback-provider>
```

Notes:
- `RESEND_*` is required only if you use invite emailing.
- AI route `/api/generate-program` can run with Anthropic only; OpenAI is optional fallback.

### 3) Run the app

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000`.

## Database Workflow (Drizzle)

```bash
cd frontend

# Generate migration files from schema changes
npx drizzle-kit generate

# Push schema directly (dev shortcut)
npx drizzle-kit push

# Visual DB browser
npx drizzle-kit studio

# Seed data
npx tsx db/seed.ts
```

## Program Generation Paths

### Primary (current): AI + deterministic hybrid
- Endpoint: `POST /api/generate-program`
- Deterministic stage computes targets first (`frontend/lib/ai/calculate.ts`)
- LLM generates concrete sets
- Route validates exact totals and can return `422` with diagnostics if constraints fail

### Legacy route (kept for compatibility)
- Endpoint: `POST /api/create-program`
- Executes Python scripts from `scripts/`
- Requires interpreter at `scripts/venv/bin/python`

## Implemented Training Feedback

- `training_log` table stores actual performed sets (completed, RPE, notes, actual reps/weight)
- Endpoint: `/api/training-log` (GET + POST upsert)
- Admin can compute/display ARE via `/api/programs/[client]/[filename]/enrich`

## Deployment (Vercel)

StrongCode is deployed as the **frontend app**.

Important:
- Set Vercel Root Directory to `frontend` (or run Vercel CLI from `frontend/`).
- Keep required env vars configured in Vercel project settings.

Typical CLI flow:

```bash
cd frontend
npm run build
vercel deploy
```

## Documentation

- Project snapshot: [CLAUDE.md](./CLAUDE.md)
- AI generation details: [AGENTS.md](./AGENTS.md)
- Domain references: `docs/references/`

## License

Private project.
