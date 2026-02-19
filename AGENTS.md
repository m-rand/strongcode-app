# AGENTS.md — StrongCode AI Program Generation

## Overview

StrongCode generates evidence-based powerlifting training programs using LLM prompts grounded in Soviet weightlifting methodology (PlanStrong / Chernyak). This document describes the AI generation pipeline, prompt architecture, and integration options.

## AI Provider Options

| Provider | SDK | Strengths | Integration |
|----------|-----|-----------|-------------|
| **Claude (Anthropic)** | `@anthropic-ai/sdk` | Best structured JSON, strong rule-following, large context | Direct API or via Vercel AI |
| **GPT-4o (OpenAI)** | `openai` | JSON mode, function calling | Direct API or via Vercel AI |
| **Vercel AI SDK** | `ai` | Unified API for both providers, streaming, Next.js integration | `npm i ai @ai-sdk/anthropic @ai-sdk/openai` |

### Recommended: Vercel AI SDK

The Vercel AI SDK provides a unified interface that works with both Claude and OpenAI. It integrates cleanly with Next.js App Router and supports streaming, structured output, and tool calling.

```bash
cd frontend && npm install ai @ai-sdk/anthropic @ai-sdk/openai
```

```typescript
// Example: Generate program with Claude via Vercel AI SDK
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { programSchema } from '@/schemas/program'

const result = await generateObject({
  model: anthropic('claude-sonnet-4-20250514'),
  system: SYSTEM_PROMPT,          // Domain rules + methodology
  prompt: userInputPrompt,        // Client data + targets
  schema: programSchema,          // Zod schema for type-safe output
})
```

## Generation Pipeline

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│ User Input  │───▶│ Build Prompt │───▶│ LLM Generate│───▶│ Validate &   │
│ (UI form)   │    │ (system+user)│    │ (JSON output)│   │ Review (admin)│
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
```

### 1. User Input (Admin UI)
The coach provides:
- Client profile: name, 1RM values (squat, bench_press, deadlift), skill level
- Block type: `prep` or `comp`
- Volume targets per lift (NL)
- Sessions per week per lift (can vary by week)
- Session distribution code (e.g. `d25_33_42`)
- Volume distribution pattern (e.g. `3b`)
- Number of weeks (typically 4)
- Optional: variant preferences, specific constraints

### 2. System Prompt Construction
The system prompt is built from:
- **Domain rules** — Chernyak methodology, stable structural constants
- **Pattern tables** — `scripts/constants.py` contains all reference data:
  - 16 Chernyak volume distribution patterns (base/advanced/elite variants)
  - Session distribution tables (2/3/4/5 sessions)
  - Rep ranges per intensity zone
  - ARI targets
  - NL ranges per lift/block
- **Output schema** — the exact JSON structure from `schemas/program-complete.schema.json`
- **Constraints** — rep ranges, zone percentages, rounding rules

### 3. LLM Output
The LLM generates a complete program JSON with:
- `input` — echo of configuration parameters
- `calculated` — per-week zone breakdown, ARI, per-session NL distribution
- `sessions` — concrete workout prescriptions (sets × reps × weight × variant)
- `session_assignments` — mapping of lift sessions to training days

### 4. Validation & Review
- Validate against JSON schema
- Check ARI is within target range
- Check NL totals match targets
- Check rep ranges are within zone limits
- Coach can manually adjust any values before saving

## Key Domain Constants

All constants are defined in `scripts/constants.py` and must be included in the system prompt.

### Volume Distribution Patterns (Chernyak)
16 variants, each with 4-week percentages adjusted by skill level:

| Pattern | Base (weeks 1-4) | Advanced | Elite |
|---------|-------------------|----------|-------|
| 1       | 35 28 22 15 | 33 28 22 17 | 32 27 22 19 |
| 2a      | 15 35 28 22 | 17 33 28 22 | 19 32 27 22 |
| 2b      | 28 35 22 15 | 28 33 22 17 | 27 32 22 19 |
| 2c      | 22 35 28 15 | 22 33 28 17 | 22 32 27 19 |
| 3a      | 15 22 35 28 | 17 22 33 28 | 19 22 32 27 |
| 3b      | 22 28 35 15 | 22 28 33 17 | 22 27 32 19 |
| 3c      | 15 28 35 22 | 17 28 33 22 | 19 27 32 22 |
| 1-3a    | 35 15 28 22 | 33 17 28 22 | 32 19 27 22 |
| 1-3b    | 35 22 28 15 | 33 22 28 17 | 32 22 27 19 |
| 3-1a    | 28 15 35 22 | 28 17 33 22 | 27 19 32 22 |
| 3-1b    | 28 22 35 15 | 28 22 33 17 | 27 22 32 19 |
| 4       | 15 22 28 35 | 17 22 28 33 | 19 22 27 32 |
| 2-4a    | 15 35 22 28 | 17 33 22 28 | 19 32 22 27 |
| 2-4b    | 22 35 15 28 | 22 33 17 28 | 22 32 19 27 |
| 4-2a    | 22 28 15 35 | 22 28 17 33 | 22 27 19 32 |
| 4-2b    | 15 28 22 35 | 17 28 22 33 | 19 27 22 32 |

Week-to-week variability decreases with skill level (base → advanced → elite).

### Session Distributions
How volume splits across sessions within a week:

**2 sessions:** d40_60, d35_65, d30_70, d25_75, d20_80
**3 sessions:** d25_33_42 (LMH), d20_35_45 (LHM), d22_28_50 (MLH), d20_30_50 (MHL), d15_35_50 (HLM), d15_30_55 (HML)
**4 sessions:** d15_22_28_35, d10_20_30_40
**5 sessions:** d10_15_20_25_30

Session order labels (for 3 sessions): LMH, LHM, MLH, MHL, HLM, HML
(L=Light, M=Medium, H=Heavy)

### Two-Week Session Distributions
For 2-session distributions: MH, HM
For 3-session distributions: Three-week rotation patterns available

### Rep Ranges per Zone
| Zone | Rep Range |
|------|-----------|
| 55% (50-60%) | 5-8 |
| 65% (61-70%) | 4-7 |
| 75% (71-80%) | 3-6 |
| 85% (81-90%) | 2-4 |
| 90% (91-94%) | 1 |
| 95% (95-100%) | 1 |

### Session Model
- Sessions are **abstract units**: `A`, `B`, `C`, `D`... — never specific days
- Client chooses which days to train
- `sessions_per_week` can vary per lift and per week
- `session_distribution` can vary per lift and per week
- Use `input.{lift}.weekly_plan` for per-week configuration

## File Structure

```
scripts/constants.py          # All pattern tables and domain constants
schemas/program-complete.schema.json  # Output JSON schema
schemas/v1.0/program.schema.json      # Versioned schema
frontend/app/api/create-program/      # API route for program creation
frontend/app/[locale]/admin/create/   # Admin UI for program creation
```

## Future: API Route for AI Generation

```
POST /api/generate-program
Body: { clientId, block, lifts: { squat: { volume, pattern, sessions_per_week, ... }, ... } }
Response: { program: { ... complete JSON ... }, validation: { ... } }
```

The admin UI will call this endpoint, display the generated program for review, and allow the coach to edit before saving to the database.
