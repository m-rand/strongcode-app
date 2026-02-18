# CLAUDE.md — StrongCode 60

## Project Overview

StrongCode 60 is a web application for generating evidence-based powerlifting training programs using Soviet weightlifting methodology (PlanStrong / Chernyak). It serves a coach (admin) and their clients.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **Auth**: NextAuth v5 (beta), Credentials provider, JWT strategy
- **i18n**: next-intl v4 (Czech + English), timezone Europe/Prague
- **Email**: Resend (from: info@strong-code.com)
- **Data**: JSON files on disk (migrating to Turso/LibSQL — branch `feature/turso-database`)
- **Calculations**: Python scripts (calculate_targets.py, utilities.py, constants.py)
- **Deploy target**: Vercel (frontend) + Synology Docker (backend/data)

## Project Structure

```
strong-code/
├── frontend/          # Next.js app
│   ├── app/
│   │   ├── [locale]/  # i18n routes (en, cs)
│   │   │   ├── admin/ # Coach dashboard, clients, programs, surveys, create, import
│   │   │   ├── client/# Client dashboard, survey
│   │   │   ├── login/
│   │   │   └── register/
│   │   └── api/       # API routes (clients, programs, invites, users, surveys, auth)
│   ├── lib/auth.ts    # NextAuth config
│   ├── middleware.ts   # Auth (JWT verification) + i18n middleware
│   ├── messages/      # cs.json, en.json
│   └── .env.local     # NEXTAUTH_URL, NEXTAUTH_SECRET, RESEND_API_KEY, RESEND_FROM_EMAIL
├── data/              # JSON data files (current storage, migrating to Turso)
│   ├── users.json
│   ├── invite-tokens.json
│   └── clients/{slug}/
│       ├── profile.json
│       └── programs/*.json
├── scripts/           # Python calculation scripts
│   ├── calculate_targets.py   # Main: Excel formulas → JSON targets
│   ├── constants.py           # Chernyak patterns, intensity zones, session distributions
│   ├── utilities.py           # Volume distribution, ARI calculation helpers
│   └── validate.py            # JSON schema validation
├── schemas/           # JSON Schema definitions
│   ├── program-complete.schema.json  # Full program with sessions (383 lines)
│   ├── client-profile.schema.json
│   └── v1.0/          # Versioned schemas
└── backend/           # FastAPI (planned, currently empty)
```

## Key Domain Concepts

- **1RM**: One-Rep Max (squat, bench_press, deadlift) in kg
- **NL**: Number of Lifts — total reps in a training block
- **ARI**: Average Relative Intensity — weighted average of intensity zones
- **Chernyak patterns**: 16 volume distribution patterns across 4-week blocks
- **Skill levels**: beginner, intermediate, advanced, elite (affects volume variability)
- **Blocks**: prep (preparation) or comp (competition)
- **Intensity zones**: 65%, 75%, 85%, 90%, 95% of 1RM
- **Session distribution**: d25_33_42, d40_60, etc. — how volume splits across sessions/week

## Data Model

### Current (JSON files)
- **Users** (`data/users.json`) — id, email, password (bcrypt), role (admin|client), client_slug
- **Clients** (`data/clients/{slug}/profile.json`) — name, email, skill_level, one_rm_history[], survey{}, preferences{}
- **Programs** (`data/clients/{slug}/programs/*.json`) — meta, client snapshot, program_info, input{}, calculated{}, sessions{}
- **Invite tokens** (`data/invite-tokens.json`) — token, clientSlug, email, used, expiresAt (48h TTL)

### Planned (Turso — branch feature/turso-database)
6 tables: `clients`, `one_rm_records`, `programs`, `users`, `invite_tokens`, `audit_log`
- Programs store input/calculated/sessions as JSON columns
- 1RM history normalized into `one_rm_records` table
- Survey and preferences stay as JSON columns in `clients`

## User Roles & Flows

### Admin (coach)
- Create clients manually or approve from public survey
- Create/import training programs
- Send invite emails (Resend) for client registration
- View all clients, programs, pending surveys

### Client
- Fill out public survey → creates pending profile → admin approves
- Or receive invite email → register with password
- View own dashboard (1RM, active program, survey)
- Update survey data
- (Planned) Record RPE per set in program sessions

## Auth Flow
1. Credentials provider → `/api/auth/validate-user` → bcrypt compare
2. JWT stores `role` + `client_slug`
3. Middleware verifies JWT (not just cookie existence) + role-based access
4. Clients can't access `/admin/*` routes

## Development

```bash
cd frontend && npm install && npm run dev  # http://localhost:3000
```

The `.env.local` must contain:
- `NEXTAUTH_URL` — base URL
- `NEXTAUTH_SECRET` — JWT secret
- `RESEND_API_KEY` — Resend API key
- `RESEND_FROM_EMAIL` — sender email (info@strong-code.com)

## Conventions

- File naming for programs: `YYYY-MM-DD_{client-slug}_{block}_all_lifts.json`
- Client slugs: lowercase, NFD-normalized (diacritics removed), hyphenated
- API routes use Next.js App Router (`app/api/`)
- All user-facing strings go through next-intl (`messages/cs.json`, `messages/en.json`)
- Prefer Tailwind utility classes over inline styles

## Current Status (Feb 2026)

- ✅ Landing page with i18n (CZ/EN) and theme switching
- ✅ Admin dashboard, client management, program creation/import
- ✅ Public survey → pending approval flow
- ✅ Invite system with Resend email
- ✅ Client dashboard with 1RM display, program list, survey
- ✅ Client registration via invite token
- ✅ Middleware with JWT verification + role-based access
- 🔄 Database migration to Turso (branch: feature/turso-database)
- ⬜ Python backend (FastAPI) — not started
- ⬜ Tests — none exist yet
- ⬜ RPE recording by clients in sessions
