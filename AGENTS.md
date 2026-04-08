# AGENTS.md — StrongCode AI Program Generation

## Purpose
This document describes the **current** AI program generation implementation in StrongCode.
It focuses on how `/api/generate-program` works today, where domain rules live, and how generated output is validated and stored.

Last updated: **2026-04-08**

## Current AI Stack
- **Runtime**: Next.js App Router (`frontend/app/api/generate-program/route.ts`)
- **Unified AI SDK**: `ai`
- **Providers**:
  - Anthropic via `@ai-sdk/anthropic`
  - OpenAI via `@ai-sdk/openai`
- **Structured output**: Zod schemas in `frontend/lib/ai/schema.ts`
- **Deterministic math**: `frontend/lib/ai/calculate.ts`
- **Prompt versioning**: `frontend/lib/ai/prompts/registry.ts`

## Implemented End-to-End Pipeline

```text
Admin input (create page or AI debug)
  -> deterministic target calculation (zones/session totals/ARI)
  -> per-lift LLM generation of concrete sets
  -> strict arithmetic validation vs deterministic targets
  -> merge per-lift output into unified sessions object
  -> optional DB save as draft program
```

### 1) Input Sources
- `frontend/app/[locale]/admin/create/page.tsx` (main workflow)
- `frontend/app/[locale]/admin/ai-debug/page.tsx` (prompt/model debugging)

### 2) Deterministic Stage (No AI)
`calculateAllTargets()` computes, per lift:
- Weekly zone totals (`65/75/85/90/95`)
- Weekly ARI
- Session total reps targets (except dynamic logic in prompt v2.7 output decisions)
- Block summary (`total_nl`, `actual_nl`, `block_ari`, zone totals)

Code: `frontend/lib/ai/calculate.ts`

### 3) AI Stage
Route: `POST /api/generate-program`
- Generates per lift (squat/bench/deadlift) using `generateObject()`
- Supports provider selection (`anthropic` or `openai`)
- Supports explicit model override (`body.model`)
- Uses prompt version registry (`body.promptVersion`)
- Retries per lift when validation fails (`MAX_RETRIES = 2`)

### 4) Strict Validation
After generation, the route re-checks arithmetic consistency:
- Zone totals must match deterministic targets exactly
- Session totals must match exactly (v2.5/v2.6 session-first mode)
- Weekly totals must match exactly
- Invalid percentages/reps are rejected

If AI still violates constraints after retries:
- Route returns **HTTP 422**
- Includes partial generated program and detailed validation errors

### 5) Optional Save to DB
If `save: true` and `clientSlug` is provided:
- Finds client by slug
- Creates filename `YYYY-MM-DD_{clientSlug}_{block}_all_lifts.json`
- Persists to `programs` table with `status = draft`

## API Contract (Current)

### Endpoint
`POST /api/generate-program`

### Required body fields
- `client`
- `block` (`prep` | `comp`)
- `lifts` (at least one configured lift)

### Optional control fields
- `clientSlug: string`
- `save: boolean`
- `provider: "anthropic" | "openai"`
- `model: string`
- `promptVersion: string`
- `weeks: number` (current UI flow uses 4)

### Response (success)
- `success: true`
- `program: { calculated, sessions }`
- `validation: { errors, warnings }`
- `prompts: { promptVersion, system, user }`
- `usage: { provider, model, inputTokens, outputTokens, totalTokens, liftsGenerated }`
- `distributionInfo` (present for v2.7 week-first mode)
- `filename` (only when saved)

### Response (validation failure)
- HTTP `422`
- `success: false`
- `program` with partial output
- merged `validation.errors` (deterministic + AI math)
- prompt and usage payload for debugging

## Prompt System (Implemented)

Prompt files:
- `frontend/lib/ai/prompts/v1.ts`
- `frontend/lib/ai/prompts/v2.ts`
- `frontend/lib/ai/prompts/v2_2.ts`
- `frontend/lib/ai/prompts/v2_3.ts`
- `frontend/lib/ai/prompts/v2_4.ts`
- `frontend/lib/ai/prompts/v2_5.ts`
- `frontend/lib/ai/prompts/v2_6.ts`
- `frontend/lib/ai/prompts/v2-7.ts`

Registry: `frontend/lib/ai/prompts/registry.ts`
- Default prompt version: `v2_7`

### v2.7 behavior
- AI receives weekly zone totals and zone weights
- AI chooses session count/distribution per week
- Week-first output format (`weeks.week_1...week_4`)
- Route still enforces exact weekly/zone totals

## Domain Constants (Source of Truth)
Primary constants for AI pipeline live in:
- `frontend/lib/ai/constants.ts`

Python reference constants remain in:
- `scripts/constants.py`

Key encoded rules:
- 16 Chernyak distribution patterns (base/advanced/elite variants)
- Session distribution tables for 2/3/4/5 sessions
- Rep ranges per zone
- ARI targets (`prep` 71-74, `comp` 74-77)
- NL reference ranges by lift/block

## `weekly_plan` Support
`LiftInput` supports per-week overrides:
- `weekly_plan.week_1.sessions`
- `weekly_plan.week_1.distribution`
- ... week 2/3/4

Implementation is in deterministic calculator (`calculate.ts`), where week-specific values override default `sessions_per_week` and `session_distribution`.

Note: current admin create UI builds fixed top-level defaults; explicit per-week UI editing is not yet exposed there.

## Current File Map
- `frontend/app/api/generate-program/route.ts` — main AI generation endpoint
- `frontend/lib/ai/schema.ts` — Zod schemas for AI IO
- `frontend/lib/ai/calculate.ts` — deterministic calculations
- `frontend/lib/ai/prompt.ts` — prompt assembly helpers
- `frontend/lib/ai/prompts/*` — versioned system prompts
- `frontend/lib/ai/constants.ts` — TS constants used by AI pipeline
- `frontend/app/[locale]/admin/create/page.tsx` — main coach UI for generation/editing
- `frontend/app/[locale]/admin/ai-debug/page.tsx` — model/prompt debugging interface

Related but separate:
- `frontend/app/api/create-program/route.ts` — legacy deterministic path via Python script execution
- `frontend/app/api/programs/[client]/[filename]/enrich/route.ts` — ARE enrichment
- `frontend/lib/program/are.ts` — ARE math and enrichment helpers

## Operational Rules
- Session keys must be abstract letters (`A`, `B`, `C`, ...), never weekday names.
- AI is responsible for concrete set construction.
- Deterministic code is responsible for totals, constraints, and validation truth.
- Generated output should always be coach-reviewable before activation.

## Known Gaps / Backlog
- No automated test suite for AI route and prompt regressions yet.
- Root `README.md` is still legacy/outdated and does not reflect current Turso + App Router architecture.
- Per-week `weekly_plan` editing is supported by backend math but not fully surfaced as dedicated UI controls.
