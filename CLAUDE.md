# CLAUDE.md — StrongCode

## Project Overview

StrongCode is a web application for generating evidence-based powerlifting training programs using Soviet weightlifting methodology (PlanStrong / Chernyak). It serves a coach (admin) and their clients.

**Tagline:** *Strength, calculated.*

## Tech Stack

- **Frontend**: Next.js 16.1.1, React 19, TypeScript, Tailwind CSS v4
- **Database**: Turso (LibSQL) — hosted at `libsql://strongcode-m-rand.aws-eu-west-1.turso.io`
- **ORM**: Drizzle ORM with `@libsql/client`
- **Auth**: NextAuth v5 (beta 5.0.0-beta.30), Credentials provider, JWT strategy
- **i18n**: next-intl v4 (Czech + English), timezone Europe/Prague
- **Email**: Resend (from: info@strong-code.com)
- **Calculations**: Python scripts (calculate_targets.py, utilities.py, constants.py)
- **Deploy target**: Vercel (frontend)

## Project Structure

```
strong-code/
├── frontend/                # Next.js app
│   ├── app/
│   │   ├── [locale]/        # i18n routes (en, cs)
│   │   │   ├── page.tsx     # Landing / marketing page
│   │   │   ├── intro/       # Subpage: introduction
│   │   │   ├── features/    # Subpage: features
│   │   │   ├── how-it-works/# Subpage: how it works
│   │   │   ├── look-inside/ # Subpage: look inside
│   │   │   ├── about/       # Subpage: about the coach
│   │   │   ├── admin/       # Coach dashboard, clients, programs, surveys, create, import
│   │   │   ├── client/      # Client dashboard, survey
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── survey/      # Public survey (unauthenticated)
│   │   └── api/             # 16 API routes (all use Drizzle ORM)
│   ├── components/
│   │   ├── SubpageHeader.tsx # Shared header (logo, nav, theme/lang switchers, mobile menu)
│   │   ├── Logo.tsx          # SC monogram logo component
│   │   ├── ThemeSwitcher.tsx
│   │   └── LanguageSwitcher.tsx
│   ├── db/
│   │   ├── schema.ts        # Drizzle schema (6 tables)
│   │   ├── index.ts         # Database connection singleton
│   │   ├── seed.ts          # Data migration/seeding script
│   │   └── migrations/      # SQL migrations (managed by drizzle-kit)
│   ├── lib/auth.ts          # NextAuth config
│   ├── middleware.ts         # Auth (JWT verification) + i18n + role-based access
│   ├── messages/            # cs.json, en.json (~750 lines each)
│   ├── drizzle.config.ts    # Drizzle Kit config
│   └── .env.local           # Secrets (see Development section)
├── data/                    # Legacy JSON data files (kept for reference, no longer used by API)
├── scripts/                 # Python calculation scripts
│   ├── calculate_targets.py # Main: Excel formulas → JSON targets
│   ├── constants.py         # Chernyak patterns, intensity zones, session distributions
│   ├── utilities.py         # Volume distribution, ARI calculation helpers
│   └── validate.py          # JSON schema validation
├── schemas/                 # JSON Schema definitions
│   ├── program-complete.schema.json
│   ├── client-profile.schema.json
│   └── v1.0/                # Versioned schemas
└── backend/                 # FastAPI (planned, currently empty)
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

## Database (Turso + Drizzle ORM)

6 tables defined in `frontend/db/schema.ts`:

| Table | Purpose |
|-------|---------|
| `users` | Auth accounts — id, email, password (bcrypt), role (admin/client), client_slug |
| `clients` | Client profiles — name, slug, email, skill_level, survey (JSON), preferences (JSON), status |
| `one_rm_records` | Normalized 1RM history — client_id, date, squat, bench_press, deadlift |
| `programs` | Training programs — meta, input (JSON), calculated (JSON), sessions (JSON) |
| `invite_tokens` | Registration invites — token, client_slug, email, used, expires_at (48h TTL) |
| `audit_log` | Action log — user_id, action, entity_type, entity_id, details (JSON) |

- Programs store `input`, `calculated`, and `sessions` as JSON columns
- 1RM history normalized from nested arrays into `one_rm_records`
- All 16 API routes read/write via Drizzle — no filesystem dependency

### Database Commands

```bash
# Generate migration from schema changes
cd frontend && npx drizzle-kit generate

# Push schema directly to Turso (dev shortcut)
cd frontend && npx drizzle-kit push

# Open Drizzle Studio (visual DB browser)
cd frontend && npx drizzle-kit studio

# Re-seed database
cd frontend && npx tsx db/seed.ts
```

## Design System & Branding

- **Brand name**: StrongCode
- **Tagline**: "Strength, calculated." (English in both locales — brand claim)
- **Logo**: SC monogram — orange rounded rect with white "SC" text (`components/Logo.tsx`)
- **Font**: Figtree (Google Fonts) — weights 300, 400, 600, 700, 900
- **Accent**: `#f65d2e` (light) / `#ff784c` (dark) — stored as CSS custom property `--accent-primary`
- **Body text**: Ultra-light (weight 200), generous leading
- **Headings**: Bold uppercase (weight 700), wide tracking
- **Fluid typography**: `clamp()` for responsive sizes

### Typography Utility Classes (globals.css)
- `.hero-title` — h1, ~4.5rem→7rem, weight 700, uppercase, tight leading
- `.page-title` — ~2.5rem→4rem, weight 700, uppercase
- `.section-title` — ~2rem→3rem, weight 700, uppercase
- `.subsection-title` — 1.25rem, weight 600
- `.text-body` — 1.05rem, weight 200, generous leading
- `.text-subtitle` — 1.15rem, weight 300, secondary color
- `.text-meta` — 0.85rem, weight 300, dimmed

### Layout Pattern (from bestrong-angie reference)
- **Title area**: `max-w-7xl mx-auto` — wide, left-aligned
- **Content area**: `max-w-4xl mx-auto` — narrower, centered for readability
- Dot (`.`) after accent-colored title text
- Subtitle underneath title in `text-subtitle` style

## Landing Page & Subpages

### Landing Page (`[locale]/page.tsx`)
Sections in order: SubpageHeader → Hero (title + tagline + CTA) → Marquee strip → What is SC → How It Works (3-step grid) → Who Is It For → Feature Cards grid → Quote → Pricing → Coach → CTA section → Footer (copyright + tagline)

### 5 Subpages
All use `SubpageHeader` and the bestrong-angie layout pattern:
- `/intro` — detailed introduction
- `/features` — feature breakdown
- `/how-it-works` — methodology explanation
- `/look-inside` — app walkthrough
- `/about` — coach profile

### SubpageHeader (`components/SubpageHeader.tsx`)
Shared across ALL pages. Features:
- Logo (SC monogram) + "StrongCode" brand text
- 5 nav links: intro, features, how-it-works, look-inside, about
- Active page highlighting with accent underline
- ThemeSwitcher + LanguageSwitcher + Login link
- Mobile hamburger menu with slide-down panel

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

### Environment Variables (`.env.local`)
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<jwt-secret>
RESEND_API_KEY=<resend-key>
RESEND_FROM_EMAIL=info@strong-code.com
TURSO_DATABASE_URL=libsql://strongcode-m-rand.aws-eu-west-1.turso.io
TURSO_AUTH_TOKEN=<turso-token>
```

### Key Dependencies
```
next@16.1.1, react@19, typescript@^5
next-auth@5.0.0-beta.30, @auth/drizzle-adapter
next-intl@^4.7.0
drizzle-orm, @libsql/client, drizzle-kit (dev)
tailwindcss@^4, @tailwindcss/postcss
resend
bcryptjs
```

## Conventions

- File naming for programs: `YYYY-MM-DD_{client-slug}_{block}_all_lifts.json`
- Client slugs: lowercase, NFD-normalized (diacritics removed), hyphenated
- API routes use Next.js App Router (`app/api/`) + Drizzle ORM queries
- All user-facing strings go through next-intl (`messages/cs.json`, `messages/en.json`)
- Prefer Tailwind utility classes; use CSS custom properties for theme colors
- Shared components in `frontend/components/`
- Database schema in `frontend/db/schema.ts`, connection in `frontend/db/index.ts`

## Git & Branching

- **Remote**: `https://github.com/m-rand/strongcode-app.git`
- **main**: Stable — last commit `626ba52` (pre-Turso state)
- **feature/turso-database**: Active development branch — DB migration, landing page redesign, subpages, branding

## Current Status (Feb 18, 2026)

### ✅ Completed
- Landing page redesign (hero, marquee, sections, CTA, footer)
- 5 content subpages (intro, features, how-it-works, look-inside, about)
- Shared SubpageHeader with Logo across all pages
- Branding: "StrongCode" name, SC monogram logo, "Strength, calculated." tagline
- Turso database setup (AWS Ireland) + Drizzle ORM schema (6 tables)
- All 16 API routes migrated from JSON files to Drizzle ORM
- Data seeded to Turso from legacy JSON files
- Middleware security rewrite (proper JWT verification + role-based access)
- Admin dashboard, client management, program creation/import
- Public survey → pending approval flow
- Invite system with Resend email
- Client dashboard with 1RM display, program list, survey
- Client registration via invite token
- i18n (CZ/EN) with theme switching (light/dark)

### ⬜ Planned / Not Started
- Python backend (FastAPI) for calculation scripts
- Tests — none exist yet
- RPE recording by clients in sessions
- Vercel deployment configuration
- Image assets for landing page (currently placeholder backgrounds)
- SEO metadata for subpages
- Merge `feature/turso-database` → `main`
