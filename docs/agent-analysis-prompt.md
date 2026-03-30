# Analýza: AI generování tréninkových programů (StrongCode)

Jsi expert na softwarovou architekturu, prompt engineering a silový trénink (powerlifting, weightlifting / sovětskou metodiku). Požaduji od tebe hloubkovou analýzu jedné části projektu a návrhy na vylepšení.

## Kontext projektu

StrongCode je webová aplikace pro generování silových tréninkových programů podle sovětské metodiky (odvozená od PlanStrong, který sám je odvozený od sovětské vzpěračské školy). Tréninkové programy se generují pomocí LLM (Claude Sonnet 4 přes Vercel AI SDK).

## Co si přečti jako první (referenční dokumenty)

1. **`docs/references/strong-code-60.md`** — stručný přehled metodiky: NL rozsahy, ARI cíle, zónové distribuce, rozložení objemu v týdnu i měsíci
2. **`docs/references/plan-strong-seminar-manual-en.pdf`** — plný manuál PlanStrong semináře (z něj je StrongCode odvozený a vylepšený)
3. **`CLAUDE.md`** (root projektu) — přehled tech stacku, struktury projektu, klíčových konceptů (NL, ARI, zóny, sessions)
4. **`AGENTS.md`** (root projektu) — popis AI generovacího pipeline, architektura, roadmapa

## Soubory k analýze

Přečti tyto soubory v tomto pořadí:

**Konstanty a výpočty:**
- `scripts/constants.py` — všechny Chernyak vzory, session distribuce, zónové rozsahy
- `frontend/lib/ai/constants.ts` — TypeScript verze konstant používaných v kódu

**Schémata:**
- `schemas/program-complete.schema.json` — JSON schema výstupu
- `frontend/lib/ai/schema.ts` — Zod/TypeScript typy pro AI vstup/výstup

**Jádro generovacího pipeline:**
- `frontend/lib/ai/calculate.ts` — deterministická část: výpočet zónových cílů, týdenní distribuce, session targets
- `frontend/lib/ai/prompt.ts` — re-exportuje z `prompts/registry.ts`, obsahuje `buildLiftPrompt()`
- `frontend/lib/ai/prompts/v1.ts` — aktuální system prompt (verze 1)
- `frontend/lib/ai/prompts/registry.ts` — registr verzí promptů

**API route:**
- `frontend/app/api/generate-program/route.ts` — POST endpoint: přijme vstup → spustí calculate → zavolá AI per lift → vrátí výsledek

**Debug UI:**
- `frontend/app/[locale]/admin/ai-debug/page.tsx` — admin debug stránka pro testování generování

## Na co se zaměř

### 1. Pochopení architektury
- Rozumíš tomu, jak je rozdělena deterministická část (`calculate.ts`) od AI části (`prompt.ts`)?
- Dává rozdělení zodpovědností smysl? Co dělá výpočet a co dělá AI?
- Je schéma vstupu/výstupu dobře navržené?

### 2. Analýza system promptu (`prompts/v1.ts`)
- Je prompt v souladu s Plan Strong metodikou z referenčních dokumentů?
- Jsou pravidla jasná, konzistentní a bez konfliktů?
- Jsou příklady (Examples 1–7) správné, dostatečné a reprezentativní?
- Chybí v promptu nějaká důležitá doménová pravidla?
- Je instrukce pro "planning process" (rozdělení zón do sessions před psaním setů) dobře formulovaná?
- Jsou bell-curve pravidla pro opakování jasně vysvětlena?

### 3. Návrhy na vylepšení
- Kde vidíš největší rizika chyb u AI výstupu?
- Jaké změny nebo doplnění by nejvíce zlepšily kvalitu generovaných programů?
- Napadá tě lepší způsob jak strukturovat prompt (např. chain-of-thought, jiné příklady, jiné pořadí sekcí)?
- Jsou v `buildLiftPrompt()` informace předávané AI kompletní a ve správném formátu?

### 4. Architektonické připomínky
- Je verzování promptů (`prompts/registry.ts`) dobře navržené pro budoucí experimentování?
- Jsou v `calculate.ts` nějaké výpočty, které by měla dělat AI (nebo naopak)?
- Vidíš v kódu něco, co je zbytečně složité nebo naopak příliš zjednodušené?

## Formát odpovědi

1. **Shrnutí porozumění** — stručně popiš jak pipeline funguje vlastními slovy (2–3 odstavce)
2. **Hodnocení návrhu** — co je dobře, co je problematické
3. **Konkrétní návrhy na vylepšení promptu** — s ukázkami přeformulovaných pasáží, nových pravidel nebo příkladů
4. **Ostatní architektonické poznámky** — co nesouvisí přímo s promptem
