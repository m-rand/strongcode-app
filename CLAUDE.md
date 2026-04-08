# CLAUDE.md — StrongCode

## Project Overview

StrongCode is a web app for coach-managed powerlifting programming based on PlanStrong/Chernyak principles.
It combines deterministic planning logic (volume/intensity math) with LLM-based session construction.

Tagline: **Strength, calculated.**

Last updated: **2026-04-08**

## Current Snapshot

- Active branch: `feature/turso-database`
- Latest commit at update time: `b9eba88`
- App state: Turso + Drizzle fully integrated, AI generation live, ARE + training log implemented

## Tech Stack

- Frontend: Next.js 16.1.1, React 19, TypeScript, Tailwind CSS v4
- Auth: NextAuth v5 (credentials, JWT sessions)
- i18n: next-intl v4 (`en`, `cs`), timezone Europe/Prague
- Database: Turso (LibSQL) via Drizzle ORM
- Email: Resend
- AI: Vercel AI SDK (`ai`) + Anthropic/OpenAI providers
- Validation: AJV (`frontend/lib/program/schemaValidation.ts`) and Zod (`frontend/lib/ai/schema.ts`)
- Python scripts: still present for legacy deterministic route (`create-program`) and reference utilities

## Repository Structure (Current)

```text
strong-code/
├── AGENTS.md
├── CLAUDE.md
├── SKILL_codex.md
├── docs/
├── scripts/                         # Python utilities/constants/validation
├── schemas/                         # JSON schemas
├── backend/                         # Placeholder (not active runtime)
└── frontend/                        # Next.js application
    ├── app/
    │   ├── [locale]/               # en/cs pages
    │   │   ├── page.tsx            # Landing page
    │   │   ├── intro/
    │   │   ├── features/
    │   │   ├── how-it-works/
    │   │   ├── look-inside/
    │   │   ├── about/
    │   │   ├── admin/
    │   │   │   ├── dashboard/
    │   │   │   ├── clients/
    │   │   │   ├── create/
    │   │   │   ├── programs/
    │   │   │   ├── surveys/
    │   │   │   └── ai-debug/
    │   │   ├── client/
    │   │   │   ├── dashboard/
    │   │   │   ├── programs/[filename]/
    │   │   │   └── survey/
    │   │   ├── login/
    │   │   ├── register/
    │   │   └── survey/
    │   └── api/                    # 20 API routes
    ├── components/
    ├── db/
    ├── lib/
    │   ├── ai/
    │   └── program/
    ├── messages/
    └── middleware.ts
```

## Key Domain Concepts

- 1RM: one-rep max for squat, bench press, deadlift
- NL: number of lifts (volume)
- ARI: average relative intensity
- ARE: average relative effort (computed from RM profile + performed reps)
- Blocks: `prep` / `comp`
- Sessions: abstract letters `A`, `B`, `C`, ... (never weekday keys)
- Intensity zones: 65, 75, 85, 90 (92.5), 95
- Chernyak patterns: weekly volume distributions by skill level

## Database Model (Turso + Drizzle)

Current schema in `frontend/db/schema.ts` contains **7 tables**:

1. `users` — auth users (admin/client)
2. `clients` — client profile, survey, preferences
3. `one_rm_records` — normalized 1RM history
4. `programs` — stored programs (`input`, `calculated`, `sessions_data` JSON)
5. `invite_tokens` — invite workflow
6. `audit_log` — action log
7. `training_log` — actual performed sets (RPE/completion/notes/actual values)

## API Surface (20 Routes)

Auth:
- `/api/auth/[...nextauth]`
- `/api/auth/change-password`
- `/api/auth/validate-user`

Clients and surveys:
- `/api/clients`
- `/api/clients/[slug]`
- `/api/clients/[slug]/approve`
- `/api/clients/[slug]/survey`
- `/api/survey`
- `/api/surveys/pending`
- `/api/users`

Programs:
- `/api/create-program` (legacy deterministic generation via Python script execution)
- `/api/generate-program` (current AI + deterministic hybrid generation)
- `/api/import-program`
- `/api/program`
- `/api/programs`
- `/api/programs/[client]/[filename]`
- `/api/programs/[client]/[filename]/enrich` (ARE enrichment)

Invites:
- `/api/invites`
- `/api/invites/complete`

Training log:
- `/api/training-log`

## AI Generation Architecture (Current)

Main route: `frontend/app/api/generate-program/route.ts`

Flow:
1. Parse input (`client`, `block`, `lifts`, control flags)
2. Run deterministic calculation (`calculateAllTargets`)
3. Generate sets per lift with LLM (`generateObject`)
4. Validate strict totals (zones/session totals/week totals)
5. Merge per-lift outputs into session structure
6. Optionally save to DB (`save: true` + `clientSlug`)

Implemented features:
- Provider switch: Anthropic/OpenAI
- Model override per request
- Prompt versioning (`v1` ... `v2_7`)
- Default prompt version: `v2_7`
- Retry loop on arithmetic failures
- 422 response with partial output + diagnostics when constraints fail
- Token usage and prompt payload returned for debug

Prompt + schema files:
- `frontend/lib/ai/prompts/*`
- `frontend/lib/ai/prompts/registry.ts`
- `frontend/lib/ai/prompt.ts`
- `frontend/lib/ai/schema.ts`
- `frontend/lib/ai/calculate.ts`
- `frontend/lib/ai/constants.ts`

Admin tools:
- Main create/edit screen: `frontend/app/[locale]/admin/create/page.tsx`
- Prompt/model sandbox: `frontend/app/[locale]/admin/ai-debug/page.tsx`

## ARE and Training Log (Implemented)

ARE:
- Utilities: `frontend/lib/program/are.ts`
- Enrichment endpoint: `POST /api/programs/[client]/[filename]/enrich`
- Admin program detail page displays block/week/session ARE when available

Training log:
- Table: `training_log`
- Endpoint: `/api/training-log` (GET + POST upsert)
- Client UI: `frontend/app/[locale]/client/programs/[filename]/page.tsx`
  - per-set completion
  - per-set RPE selection
  - per-set notes
- Admin program detail includes adherence and average RPE stats from logs

## Auth and Access Control

- Credentials login -> `/api/auth/validate-user`
- JWT carries `role` and `client_slug`
- Middleware enforces role-based access:
  - unauthenticated users redirected to login for `/admin` and `/client`
  - clients cannot access `/admin`
- Host redirect: `strong-code.com` -> `www.strong-code.com`

## UI / Branding Notes

- Logo component: `frontend/components/Logo.tsx`
  - current mark is bracket + stylized S in SVG
  - colors use CSS variables for light/dark theme compatibility
- Header: `frontend/components/SubpageHeader.tsx`
  - currently shows nav links for `features`, `look-inside`, `about`
  - includes theme switcher and login link
- Locales supported: `en`, `cs`
- Locale prefix mode: `as-needed` (default locale `en`)

## Development

### Run frontend
```bash
cd frontend
npm install
npm run dev
```

### Build frontend
```bash
cd frontend
npm run build
npm run start
```

### Database commands
```bash
cd frontend
npx drizzle-kit generate
npx drizzle-kit push
npx drizzle-kit studio
npx tsx db/seed.ts
```

### Important note about legacy route
`/api/create-program` executes Python scripts and expects this interpreter path:
- `scripts/venv/bin/python`

If this venv is missing, that route will fail. AI route `/api/generate-program` does not depend on Python.

## Environment Variables

Frontend `.env.local` uses:
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `ANTHROPIC_API_KEY` (for AI generation)
- `OPENAI_API_KEY` (optional fallback provider)

## Deployment

- Deployment target: Vercel
- Runtime app root: `frontend/`
- `.vercel/project.json` exists in both repo root and `frontend/` and points to project `strong-code`
- For CLI deploys, use frontend as working directory (or set project Root Directory to `frontend` in Vercel settings)

## Conventions and Data Rules

- Programs are stored in DB (not filesystem) with filename convention:
  - `YYYY-MM-DD_{client-slug}_{block}_all_lifts.json`
- Session keys in stored programs should be letter-based (`A/B/C/...`)
- `normalizeProgramForView()` handles older weekday-shaped session payloads for display compatibility
- Schema validation utility supports versions `1.0`, `1.1`, `1.2`

## Current Gaps

- No automated tests (unit/integration/e2e) for API logic and prompt regressions
- Root `README.md` is legacy and does not match current Turso/App Router architecture
- `weekly_plan` backend support exists in deterministic calc, but dedicated weekly-plan UI controls are still limited
