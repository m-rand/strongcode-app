'use client'

import React, { useState } from 'react'
import { listPromptVersions, DEFAULT_PROMPT_VERSION } from '@/lib/ai/prompt'

// Default test input — Kateřina, squat only, prep block
const DEFAULT_INPUT = {
  clientSlug: 'katerina-balasova',
  save: false,
  client: {
    name: 'Kateřina Balašová',
    delta: 'advanced',
    one_rm: { squat: 147.5, bench_press: 80, deadlift: 170 },
  },
  block: 'prep',
  weeks: 4,
  lifts: {
    squat: {
      volume: 280,
      rounding: 2.5,
      one_rm: 147.5,
      weights: { '65': 95, '75': 110, '85': 125, '90': 135, '95': 140 },
      intensity_distribution: {
        '75_percent': 45,
        '85_percent': 13,
        '90_total_reps': 4,
        '95_total_reps': 0,
        '90_weekly_reps': [1, 1, 2, 0],
        '95_weekly_reps': [0, 0, 0, 0],
      },
      volume_pattern_main: '3a',
      volume_pattern_8190: '3a',
      sessions_per_week: 3,
      session_distribution: 'd25_33_42',
    },
  },
}

// ─── Named example inputs ──────────────────────────────────────────────────
const EXAMPLE_INPUTS: Array<{ id: string; label: string; input: object }> = [
  {
    id: 'katka-squat-prep-3x',
    label: 'Katka — dřep, prep, 3×/týden',
    input: DEFAULT_INPUT,
  },
  {
    id: 'katka-bench-prep-3x',
    label: 'Katka — bench, prep, 3×/týden',
    input: {
      clientSlug: 'katerina-balasova',
      save: false,
      client: {
        name: 'Kateřina Balašová',
        delta: 'advanced',
        one_rm: { squat: 147.5, bench_press: 80, deadlift: 170 },
      },
      block: 'prep',
      weeks: 4,
      lifts: {
        bench_press: {
          volume: 320,
          rounding: 2.5,
          one_rm: 80,
          weights: { '65': 52.5, '75': 60, '85': 67.5, '90': 72.5, '95': 77.5 },
          intensity_distribution: {
            '75_percent': 45,
            '85_percent': 13,
            '90_total_reps': 4,
            '95_total_reps': 0,
            '90_weekly_reps': [1, 1, 2, 0],
            '95_weekly_reps': [0, 0, 0, 0],
          },
          volume_pattern_main: '3a',
          volume_pattern_8190: '3a',
          sessions_per_week: 3,
          session_distribution: 'd25_33_42',
        },
      },
    },
  },
  {
    id: 'katka-deadlift-prep-2x',
    label: 'Katka — mrtvý tah, prep, 2×/týden',
    input: {
      clientSlug: 'katerina-balasova',
      save: false,
      client: {
        name: 'Kateřina Balašová',
        delta: 'advanced',
        one_rm: { squat: 147.5, bench_press: 80, deadlift: 170 },
      },
      block: 'prep',
      weeks: 4,
      lifts: {
        deadlift: {
          volume: 240,
          rounding: 2.5,
          one_rm: 170,
          weights: { '65': 110, '75': 127.5, '85': 145, '90': 152.5, '95': 162.5 },
          intensity_distribution: {
            '75_percent': 45,
            '85_percent': 13,
            '90_total_reps': 2,
            '95_total_reps': 0,
            '90_weekly_reps': [0, 1, 1, 0],
            '95_weekly_reps': [0, 0, 0, 0],
          },
          volume_pattern_main: '3b',
          volume_pattern_8190: '3b',
          sessions_per_week: 2,
          session_distribution: 'd40_60',
        },
      },
    },
  },
  {
    id: 'katka-all-prep',
    label: 'Katka — dřep + bench + mrtvý, prep',
    input: {
      clientSlug: 'katerina-balasova',
      save: false,
      client: {
        name: 'Kateřina Balašová',
        delta: 'advanced',
        one_rm: { squat: 147.5, bench_press: 80, deadlift: 170 },
      },
      block: 'prep',
      weeks: 4,
      lifts: {
        squat: {
          volume: 280,
          rounding: 2.5,
          one_rm: 147.5,
          weights: { '65': 95, '75': 110, '85': 125, '90': 135, '95': 140 },
          intensity_distribution: {
            '75_percent': 45,
            '85_percent': 13,
            '90_total_reps': 4,
            '95_total_reps': 0,
            '90_weekly_reps': [1, 1, 2, 0],
            '95_weekly_reps': [0, 0, 0, 0],
          },
          volume_pattern_main: '3a',
          volume_pattern_8190: '3a',
          sessions_per_week: 3,
          session_distribution: 'd25_33_42',
        },
        bench_press: {
          volume: 320,
          rounding: 2.5,
          one_rm: 80,
          weights: { '65': 52.5, '75': 60, '85': 67.5, '90': 72.5, '95': 77.5 },
          intensity_distribution: {
            '75_percent': 45,
            '85_percent': 13,
            '90_total_reps': 4,
            '95_total_reps': 0,
            '90_weekly_reps': [1, 1, 2, 0],
            '95_weekly_reps': [0, 0, 0, 0],
          },
          volume_pattern_main: '3a',
          volume_pattern_8190: '3a',
          sessions_per_week: 3,
          session_distribution: 'd25_33_42',
        },
        deadlift: {
          volume: 240,
          rounding: 2.5,
          one_rm: 170,
          weights: { '65': 110, '75': 127.5, '85': 145, '90': 152.5, '95': 162.5 },
          intensity_distribution: {
            '75_percent': 45,
            '85_percent': 13,
            '90_total_reps': 2,
            '95_total_reps': 0,
            '90_weekly_reps': [0, 1, 1, 0],
            '95_weekly_reps': [0, 0, 0, 0],
          },
          volume_pattern_main: '3b',
          volume_pattern_8190: '3b',
          sessions_per_week: 2,
          session_distribution: 'd40_60',
        },
      },
    },
  },
  {
    id: 'katka-squat-prep-2x',
    label: 'Katka — dřep, prep, 2×/týden (d40_60)',
    input: {
      clientSlug: 'katerina-balasova',
      save: false,
      client: {
        name: 'Kateřina Balašová',
        delta: 'advanced',
        one_rm: { squat: 147.5, bench_press: 80, deadlift: 170 },
      },
      block: 'prep',
      weeks: 4,
      lifts: {
        squat: {
          volume: 280,
          rounding: 2.5,
          one_rm: 147.5,
          weights: { '65': 95, '75': 110, '85': 125, '90': 135, '95': 140 },
          intensity_distribution: {
            '75_percent': 45,
            '85_percent': 13,
            '90_total_reps': 2,
            '95_total_reps': 0,
            '90_weekly_reps': [0, 1, 1, 0],
            '95_weekly_reps': [0, 0, 0, 0],
          },
          volume_pattern_main: '3b',
          volume_pattern_8190: '3b',
          sessions_per_week: 2,
          session_distribution: 'd40_60',
        },
      },
    },
  },
]

interface SetData {
  weight: number
  reps: number
  percentage: number
}

interface ApiResponse {
  success: boolean
  error?: string
  program?: {
    calculated: Record<string, Record<string, unknown>>
    sessions: Record<string, Record<string, { lifts: { lift: string; sets: SetData[] }[] }>>
  }
  distributionInfo?: Record<string, Record<string, {
    sessions_used: number
    distribution_code: string
    session_totals: number[]
    tried_distributions: string[]
    selection_reason: string
  }>>
  validation?: {
    errors: string[]
    warnings: string[]
  }
  prompts?: {
    promptVersion: string
    system: string
    user: Record<string, string>
  }
  usage?: {
    provider: string
    model: string
    liftsGenerated: number
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
}

const MODEL_OPTIONS: Record<'anthropic' | 'openai', Array<{ value: string; label: string }>> = {
  anthropic: [
    { value: 'claude-sonnet-4-20250514', label: 'claude-sonnet-4-20250514' },
    { value: 'claude-opus-4-20250514', label: 'claude-opus-4-20250514' },
    { value: 'claude-sonnet-4-6', label: 'claude-sonnet-4-6' },
    { value: 'claude-opus-4-6', label: 'claude-opus-4-6 (default)' },
    { value: 'claude-3-7-sonnet-latest', label: 'claude-3-7-sonnet-latest' },
    { value: 'claude-3-5-sonnet-latest', label: 'claude-3-5-sonnet-latest' },
  ],
  openai: [
    { value: 'gpt-4o', label: 'gpt-4o (default)' },
    { value: 'gpt-4o-mini', label: 'gpt-4o-mini' },
    { value: 'gpt-4.1', label: 'gpt-4.1' },
    { value: 'gpt-4.1-mini', label: 'gpt-4.1-mini' },
    { value: 'gpt-5-codex', label: 'gpt-5-codex' },
    { value: 'gpt-5.1-codex', label: 'gpt-5.1-codex' },
    { value: 'gpt-5.1-codex-mini', label: 'gpt-5.1-codex-mini' },
    { value: 'gpt-5.3-codex', label: 'gpt-5.3-codex' },
    { value: 'codex-mini-latest', label: 'codex-mini-latest' },
    { value: 'o4-mini', label: 'o4-mini' },
    { value: 'o3', label: 'o3' },
  ],
}

export default function AIDebugPage() {
  const [input, setInput] = useState(JSON.stringify(DEFAULT_INPUT, null, 2))
  const [result, setResult] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'input' | 'system' | 'user' | 'output' | 'sessions'>('input')
  const [elapsed, setElapsed] = useState<number | null>(null)
  const [sessionsView, setSessionsView] = useState<'cards' | 'excel'>('excel')
  const [promptVersion, setPromptVersion] = useState(DEFAULT_PROMPT_VERSION)
  const [provider, setProvider] = useState<'anthropic' | 'openai'>('anthropic')
  const [model, setModel] = useState('')
  const [customModel, setCustomModel] = useState('')
  const [exampleId, setExampleId] = useState(EXAMPLE_INPUTS[0].id)
  const promptVersions = listPromptVersions()
  const selectedPrompt = promptVersions.find(v => v.id === promptVersion)?.systemPrompt ?? ''

  // Restore last result from localStorage on mount
  useState(() => {
    try {
      const saved = localStorage.getItem('ai-debug-result')
      if (saved) {
        const parsed = JSON.parse(saved)
        setResult(parsed.result)
        setElapsed(parsed.elapsed)
        setActiveTab('sessions')
      }
      const savedInput = localStorage.getItem('ai-debug-input')
      if (savedInput) setInput(savedInput)
    } catch { /* ignore */ }
  })

  function resetToDefaults() {
    const found = EXAMPLE_INPUTS.find(e => e.id === exampleId)
    setInput(JSON.stringify(found?.input ?? DEFAULT_INPUT, null, 2))
    setResult(null)
    setElapsed(null)
    setActiveTab('input')
    localStorage.removeItem('ai-debug-result')
    localStorage.removeItem('ai-debug-input')
  }

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    setResult(null)
    setElapsed(null)
    const start = Date.now()

    try {
      const body = JSON.parse(input)
      const chosenModel = model === '__custom__' ? customModel.trim() : model.trim()
      const res = await fetch('/api/generate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, promptVersion, provider, ...(chosenModel ? { model: chosenModel } : {}) }),
      })
      const data = await res.json()
      const ms = Date.now() - start
      setResult(data)
      setElapsed(ms)

      // Persist to localStorage
      try {
        localStorage.setItem('ai-debug-result', JSON.stringify({ result: data, elapsed: ms }))
        localStorage.setItem('ai-debug-input', input)
      } catch { /* quota exceeded, ignore */ }

      if (!data.success) {
        setError(data.error || 'Unknown error')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { key: 'input' as const, label: '1. Vstup (JSON)' },
    { key: 'system' as const, label: '2. System Prompt' },
    { key: 'user' as const, label: '3. User Prompt(y)' },
    { key: 'output' as const, label: '4. Calculated (determin.)' },
    { key: 'sessions' as const, label: '5. Sessions (AI výstup)' },
  ]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        AI Program Generation — Debug
      </h1>
      <p style={{ color: '#888', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Zobrazuje kompletní pipeline: vstup → system prompt → user prompt → deterministic calculation → AI sessions
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #444',
              borderRadius: '6px 6px 0 0',
              background: activeTab === tab.key ? '#f65d2e' : '#222',
              color: activeTab === tab.key ? '#fff' : '#aaa',
              fontWeight: activeTab === tab.key ? 600 : 400,
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{
        border: '1px solid #444',
        borderRadius: '0 8px 8px 8px',
        padding: '1rem',
        background: '#1a1a1a',
        minHeight: 400,
      }}>
        {/* === TAB 1: Input JSON === */}
        {activeTab === 'input' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Vstupní JSON pro API</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  value={exampleId}
                  onChange={(e) => {
                    const id = e.target.value
                    setExampleId(id)
                    const found = EXAMPLE_INPUTS.find(ex => ex.id === id)
                    if (found) setInput(JSON.stringify(found.input, null, 2))
                  }}
                  style={{
                    padding: '0.6rem 0.8rem',
                    background: '#1a2a1a',
                    color: '#8f8',
                    border: '1px solid #3a5a3a',
                    borderRadius: 6,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    minWidth: 280,
                  }}
                >
                  {EXAMPLE_INPUTS.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.label}</option>
                  ))}
                </select>
                <select
                  value={provider}
                  onChange={(e) => {
                    setProvider(e.target.value as 'anthropic' | 'openai')
                    setModel('')
                    setCustomModel('')
                  }}
                  style={{
                    padding: '0.6rem 0.8rem',
                    background: '#222',
                    color: '#ccc',
                    border: '1px solid #555',
                    borderRadius: 6,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value="anthropic">Claude (Anthropic)</option>
                  <option value="openai">GPT-4o (OpenAI)</option>
                </select>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  style={{
                    padding: '0.6rem 0.8rem',
                    background: '#222',
                    color: '#ccc',
                    border: '1px solid #555',
                    borderRadius: 6,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    minWidth: 320,
                  }}
                >
                  <option value="">Model: backend default</option>
                  {MODEL_OPTIONS[provider].map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                  <option value="__custom__">Custom model id...</option>
                </select>
                {model === '__custom__' && (
                  <input
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder="e.g. gpt-4.1 or claude-sonnet-4-20250514"
                    style={{
                      padding: '0.6rem 0.8rem',
                      background: '#222',
                      color: '#ccc',
                      border: '1px solid #555',
                      borderRadius: 6,
                      fontSize: '0.85rem',
                      minWidth: 320,
                    }}
                  />
                )}
                <select
                  value={promptVersion}
                  onChange={(e) => setPromptVersion(e.target.value)}
                  style={{
                    padding: '0.6rem 0.8rem',
                    background: '#222',
                    color: '#ccc',
                    border: '1px solid #555',
                    borderRadius: 6,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  {promptVersions.map(v => (
                    <option key={v.id} value={v.id}>{v.label}</option>
                  ))}
                </select>
                <button
                  onClick={resetToDefaults}
                  style={{
                    padding: '0.75rem 1.2rem',
                    background: '#333',
                    color: '#aaa',
                    border: '1px solid #555',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '0.85rem',
                  }}
                >
                  ↩ Reset
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  style={{
                    padding: '0.75rem 2rem',
                    background: loading ? '#555' : '#f65d2e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: loading ? 'wait' : 'pointer',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                  }}
                >
                  {loading ? '⏳ Generuji...' : '🚀 Generate'}
                </button>
              </div>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                width: '100%',
                height: 500,
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                background: '#111',
                color: '#e0e0e0',
                border: '1px solid #333',
                borderRadius: 4,
                padding: '0.75rem',
                resize: 'vertical',
              }}
            />
            {error && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#3a1111', border: '1px solid #c44', borderRadius: 4, color: '#f88' }}>
                ❌ {error}
              </div>
            )}
          </div>
        )}

        {/* === TAB 2: System Prompt === */}
        {activeTab === 'system' && (
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>System Prompt</h2>
            <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '1rem' }}>
              Zobrazuje prompt podle aktuálně vybrané verze v dropdownu.
              {selectedPrompt && ` (${selectedPrompt.length.toLocaleString()} znaků)`}
            </p>
            {result?.prompts?.promptVersion && result.prompts.promptVersion !== promptVersion && (
              <div style={{
                marginBottom: '0.75rem',
                padding: '0.5rem 0.75rem',
                background: '#2a2412',
                border: '1px solid #6f5d2a',
                borderRadius: 4,
                color: '#e8d38a',
                fontSize: '0.75rem',
              }}>
                Poslední generování běželo s verzí <strong>{result.prompts.promptVersion}</strong>, aktuálně je vybraná <strong>{promptVersion}</strong>.
              </div>
            )}
            {selectedPrompt ? (
              <pre style={{
                background: '#111',
                color: '#c8e6c9',
                padding: '1rem',
                borderRadius: 4,
                overflow: 'auto',
                maxHeight: 700,
                fontSize: '0.75rem',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {selectedPrompt}
              </pre>
            ) : (
              <p style={{ color: '#666', fontStyle: 'italic' }}>Vyber verzi promptu v tab 1.</p>
            )}
          </div>
        )}

        {/* === TAB 3: User Prompts === */}
        {activeTab === 'user' && (
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>User Prompt(y) — per lift</h2>
            <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '1rem' }}>
              Pro každý lift se generuje samostatný user prompt s pre-kalkulovanými zónovými cíli (kolik reps v jaké zóně, na jakou váhu).
            </p>
            {result?.prompts?.user ? (
              Object.entries(result.prompts.user).map(([lift, prompt]) => (
                <div key={lift} style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f65d2e', marginBottom: '0.5rem' }}>
                    {lift === 'bench_press' ? 'Bench Press' : lift.charAt(0).toUpperCase() + lift.slice(1)}
                    <span style={{ color: '#888', fontWeight: 400, fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                      ({prompt.length.toLocaleString()} znaků)
                    </span>
                  </h3>
                  <pre style={{
                    background: '#111',
                    color: '#bbdefb',
                    padding: '1rem',
                    borderRadius: 4,
                    overflow: 'auto',
                    maxHeight: 500,
                    fontSize: '0.75rem',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {prompt}
                  </pre>
                </div>
              ))
            ) : (
              <p style={{ color: '#666', fontStyle: 'italic' }}>Nejdříve spusť generování (tab 1).</p>
            )}
          </div>
        )}

        {/* === TAB 4: Calculated === */}
        {activeTab === 'output' && (
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Calculated (deterministický výpočet)</h2>
            <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '1rem' }}>
              Krok 1 — čistá matematika, žádné AI. Rozdělení objemu do zón, týdnů, sessions.
            </p>
            {result?.program?.calculated ? (
              <pre style={{
                background: '#111',
                color: '#fff9c4',
                padding: '1rem',
                borderRadius: 4,
                overflow: 'auto',
                maxHeight: 700,
                fontSize: '0.75rem',
                lineHeight: 1.4,
              }}>
                {JSON.stringify(result.program.calculated, null, 2)}
              </pre>
            ) : (
              <p style={{ color: '#666', fontStyle: 'italic' }}>Nejdříve spusť generování (tab 1).</p>
            )}
          </div>
        )}

        {/* === TAB 5: AI Sessions Output === */}
        {activeTab === 'sessions' && (
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Sessions (AI výstup)</h2>
            <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '1rem' }}>
              Krok 2 — AI navrhne konkrétní sety (váha × opakování) podle pravidel pyramid/ladders.
            </p>

            {/* Usage stats */}
            {result?.usage && (
              <div style={{
                display: 'flex',
                gap: '1.5rem',
                marginBottom: '1rem',
                padding: '0.75rem',
                background: '#1e1e2e',
                borderRadius: 4,
                fontSize: '0.8rem',
                flexWrap: 'wrap',
              }}>
                <span>⚡ <strong>{result.usage.provider}</strong> / {result.usage.model}</span>
                <span>📊 {result.usage.liftsGenerated} lift(s)</span>
                <span>📥 {result.usage.inputTokens?.toLocaleString()} input tokens</span>
                <span>📤 {result.usage.outputTokens?.toLocaleString()} output tokens</span>
                <span>🔢 {result.usage.totalTokens?.toLocaleString()} total</span>
                <span>💰 ~${((result.usage.inputTokens * 3 + result.usage.outputTokens * 15) / 1_000_000).toFixed(3)}</span>
                {elapsed && <span>⏱ {(elapsed / 1000).toFixed(1)}s</span>}
              </div>
            )}

            {/* Error banner */}
            {result?.success === false && (
              <div style={{
                padding: '1rem',
                background: '#2a0808',
                border: '2px solid #e04444',
                borderRadius: 6,
                marginBottom: '1rem',
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ff6666', marginBottom: '0.5rem' }}>
                  ⚠️ Validace selhala — AI výsledek obsahuje chyby
                </div>
                <div style={{ fontSize: '0.8rem', color: '#cc4444' }}>
                  {result.error}
                </div>
              </div>
            )}

            {/* Validation */}
            {result?.validation && (result.validation.errors.length > 0 || result.validation.warnings.length > 0) && (
              <div style={{ marginBottom: '1rem' }}>
                {result.validation.errors.map((e: string, i: number) => (
                  <div key={`e${i}`} style={{ padding: '0.5rem', background: '#3a1111', border: '1px solid #c44', borderRadius: 4, color: '#f88', marginBottom: '0.25rem', fontSize: '0.8rem' }}>
                    ❌ {e}
                  </div>
                ))}
                {result.validation.warnings.map((w: string, i: number) => (
                  <div key={`w${i}`} style={{ padding: '0.5rem', background: '#3a3a11', border: '1px solid #bb8', borderRadius: 4, color: '#ee8', marginBottom: '0.25rem', fontSize: '0.8rem' }}>
                    ⚠️ {w}
                  </div>
                ))}
              </div>
            )}

            {result?.program?.sessions ? (
              <div>
                {/* Distribution info (v2.7 only) */}
            {result?.distributionInfo && (() => {
              // Compute what the decision tree SHOULD choose
              function computeExpected(total: number): { n: number; code: string; splits: number[] } {
                const try3 = [25, 33, 42].map((p, i, arr) => {
                  if (i < arr.length - 1) return Math.round(total * p / 100)
                  return total - Math.round(total * 25 / 100) - Math.round(total * 33 / 100)
                })
                if (try3.every(v => v >= 10 && v <= 50)) return { n: 3, code: 'd25_33_42', splits: try3 }
                if (try3.some(v => v < 10)) {
                  const try2 = [40, 60].map((p, i) => i === 0 ? Math.round(total * p / 100) : total - Math.round(total * 40 / 100))
                  return { n: 2, code: 'd40_60', splits: try2 }
                }
                const try4 = [15, 22, 28, 35].map((p, i, arr) => {
                  if (i < arr.length - 1) return Math.round(total * p / 100)
                  return total - [15, 22, 28].reduce((s, pp) => s + Math.round(total * pp / 100), 0)
                })
                return { n: 4, code: 'd15_22_28_35', splits: try4 }
              }

              return (
                <div style={{ marginBottom: '1.25rem', padding: '0.75rem', background: '#131320', borderRadius: 6, border: '1px solid #2a2a4a' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#aaa', marginBottom: '0.75rem' }}>📐 Distribution rozhodnutí AI (v2.7)</div>
                  {Object.entries(result.distributionInfo!).map(([lift, liftDist]) => (
                    <div key={lift} style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f65d2e', marginBottom: '0.35rem' }}>
                        {lift === 'bench_press' ? 'Bench Press' : lift.charAt(0).toUpperCase() + lift.slice(1)}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {['week_1', 'week_2', 'week_3', 'week_4'].map(wk => {
                          const ai = liftDist[wk]
                          if (!ai) return null
                          const calcWeek = result?.program?.calculated?.[lift]?.[wk] as { total_reps?: number } | undefined
                          const total = calcWeek?.total_reps ?? 0
                          const expected = computeExpected(total)
                          const match = ai.sessions_used === expected.n && ai.distribution_code === expected.code
                          return (
                            <div key={wk} style={{
                              background: '#1a1a2e',
                              border: `1px solid ${match ? '#2a4a2a' : '#4a2a2a'}`,
                              borderRadius: 5,
                              padding: '0.5rem 0.75rem',
                              fontSize: '0.75rem',
                              minWidth: 180,
                            }}>
                              <div style={{ fontWeight: 700, color: '#888', marginBottom: '0.25rem' }}>
                                {wk.replace('_', ' ').toUpperCase()} — {total} reps
                              </div>
                              <div style={{ color: '#ccc' }}>
                                AI: <span style={{ color: '#81d4fa', fontWeight: 600 }}>{ai.sessions_used}×</span> {ai.distribution_code}
                              </div>
                              <div style={{ color: '#9aa0a6', marginTop: 2 }}>
                                sety: [{ai.session_totals.join(', ')}]
                              </div>
                              <div style={{ color: '#7f8c9a', marginTop: 2 }}>
                                zkoušeno: {ai.tried_distributions?.join(' → ') || '—'}
                              </div>
                              <div style={{ color: match ? '#888' : '#ffb74d', marginTop: 2 }}>
                                očekáváno: {expected.n}× {expected.code} [{expected.splits.join(', ')}]
                                {!match && ' ⚠️'}
                              </div>
                              <div style={{ color: '#b0bec5', marginTop: 4, fontStyle: 'italic' }}>
                                důvod: {ai.selection_reason || '—'}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}

            <p style={{ color: '#777', fontSize: '0.75rem', marginBottom: '0.6rem' }}>
              Pozn.: počet sloupců #2/#3/... v Excel view není fixní limit (8 je jen aktuální maximum z dat).
            </p>

            {/* View toggle */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <button
                    onClick={() => setSessionsView('excel')}
                    style={{
                      padding: '0.4rem 1rem',
                      border: '1px solid #555',
                      borderRadius: 4,
                      background: sessionsView === 'excel' ? '#f65d2e' : '#333',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: sessionsView === 'excel' ? 600 : 400,
                    }}
                  >
                    📊 Excel view
                  </button>
                  <button
                    onClick={() => setSessionsView('cards')}
                    style={{
                      padding: '0.4rem 1rem',
                      border: '1px solid #555',
                      borderRadius: 4,
                      background: sessionsView === 'cards' ? '#f65d2e' : '#333',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: sessionsView === 'cards' ? 600 : 400,
                    }}
                  >
                    🃏 Card view
                  </button>
                </div>

                {/* === EXCEL VIEW === */}
                {sessionsView === 'excel' && (
                  <ExcelView sessions={result.program.sessions} />
                )}

                {/* === CARD VIEW === */}
                {sessionsView === 'cards' && Object.entries(result.program.sessions).sort().map(([sessionKey, weekData]) => (
                  <div key={sessionKey} style={{ marginBottom: '2.5rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f65d2e', marginBottom: '1rem', borderBottom: '2px solid #f65d2e', paddingBottom: '0.25rem' }}>
                      Session {sessionKey}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                      {['week_1', 'week_2', 'week_3', 'week_4'].map((weekKey) => {
                        const week = weekData[weekKey] as { lifts: { lift: string; sets: SetData[] }[] } | undefined
                        if (!week?.lifts?.length) return null
                        return (
                          <div key={weekKey} style={{
                            background: '#222',
                            borderRadius: 8,
                            padding: '1rem',
                            border: '1px solid #333',
                          }}>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: '#e0e0e0' }}>
                              {weekKey.replace('_', ' ').replace('w', 'W')}
                            </h4>
                            {week.lifts.map((liftData, li) => {
                              const totalReps = liftData.sets.reduce((s, set) => s + set.reps, 0)
                              const grouped = groupSets(liftData.sets)
                              return (
                                <div key={li}>
                                  <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.5rem', fontWeight: 500 }}>
                                    {liftData.lift === 'bench_press' ? 'Bench Press' : liftData.lift.charAt(0).toUpperCase() + liftData.lift.slice(1)}
                                    <span style={{ color: '#666', fontWeight: 400 }}>
                                      {' '}— {totalReps} NL, {liftData.sets.length} sets
                                    </span>
                                  </div>
                                  {/* Individual sets view */}
                                  <div style={{ marginBottom: '0.5rem' }}>
                                    {liftData.sets.map((set, si) => (
                                      <div key={si} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '3px 0',
                                        borderBottom: '1px solid #2a2a2a',
                                        gap: '0.5rem',
                                      }}>
                                        <span style={{ color: '#555', fontSize: '0.75rem', width: 18, textAlign: 'right', flexShrink: 0 }}>{si + 1}.</span>
                                        <span style={{
                                          fontSize: '0.95rem',
                                          fontWeight: 600,
                                          color: '#fff',
                                          fontFamily: 'monospace',
                                          minWidth: 110,
                                        }}>
                                          {set.reps} × {set.weight} kg
                                        </span>
                                        <span style={{
                                          fontSize: '0.8rem',
                                          fontWeight: 600,
                                          color: getZoneColor(set.percentage),
                                          marginLeft: 'auto',
                                          padding: '1px 6px',
                                          borderRadius: 3,
                                          background: `${getZoneColor(set.percentage)}15`,
                                        }}>
                                          {set.percentage}%
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  {/* Grouped summary */}
                                  <div style={{
                                    fontSize: '0.75rem',
                                    color: '#888',
                                    borderTop: '1px solid #333',
                                    paddingTop: '0.4rem',
                                    fontFamily: 'monospace',
                                  }}>
                                    {grouped.map((g, gi) => (
                                      <span key={gi}>
                                        {gi > 0 && <span style={{ color: '#444' }}> → </span>}
                                        <span style={{ color: getZoneColor(g.percentage) }}>
                                          {g.count > 1 ? `${g.count}×` : ''}{g.reps}×{g.weight}
                                        </span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}

                {sessionsView === 'cards' && (
                  <>
                  {/* Raw JSON */}
                  <details style={{ marginTop: '2rem' }}>
                    <summary style={{ cursor: 'pointer', color: '#888', fontSize: '0.85rem' }}>📋 Raw JSON</summary>
                    <pre style={{
                      background: '#111',
                      color: '#e0e0e0',
                      padding: '1rem',
                      borderRadius: 4,
                      overflow: 'auto',
                      maxHeight: 500,
                      fontSize: '0.7rem',
                      lineHeight: 1.4,
                      marginTop: '0.5rem',
                    }}>
                      {JSON.stringify(result.program.sessions, null, 2)}
                    </pre>
                  </details>
                  </>
                )}
              </div>
            ) : (
              <p style={{ color: '#666', fontStyle: 'italic' }}>Nejdříve spusť generování (tab 1).</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Excel-like view component ──────────────────────────────────
const ZONES = [
  { key: 65, label: '65%', pctRange: '61-70%' },
  { key: 75, label: '75%', pctRange: '71-80%' },
  { key: 85, label: '85%', pctRange: '81-90%' },
  { key: 92.5, label: '90%', pctRange: '91-94%' },
  { key: 95, label: '95%', pctRange: '95-100%' },
] as const

function ExcelView({ sessions }: { sessions: Record<string, Record<string, { lifts: { lift: string; sets: SetData[] }[] }>> }) {
  const sessionKeys = Object.keys(sessions).sort()
  const weeks = ['week_1', 'week_2', 'week_3', 'week_4']

  // Collect all lifts
  const allLifts = new Set<string>()
  for (const sessionData of Object.values(sessions)) {
    for (const weekData of Object.values(sessionData)) {
      const w = weekData as { lifts: { lift: string; sets: SetData[] }[] }
      w.lifts?.forEach(l => allLifts.add(l.lift))
    }
  }

  // Get all sets (in order) for a lift/session/week
  function getAllSets(lift: string, sessionKey: string, weekKey: string): SetData[] {
    const weekData = sessions[sessionKey]?.[weekKey] as { lifts: { lift: string; sets: SetData[] }[] } | undefined
    if (!weekData?.lifts) return []
    const liftData = weekData.lifts.find(l => l.lift === lift)
    return liftData?.sets ?? []
  }

  // Get weight used for a zone (from any session)
  function getWeightForZone(lift: string, zonePct: number): number | null {
    for (const sessionData of Object.values(sessions)) {
      for (const weekData of Object.values(sessionData)) {
        const w = weekData as { lifts: { lift: string; sets: SetData[] }[] }
        const liftData = w.lifts?.find(l => l.lift === lift)
        const set = liftData?.sets.find(s => s.percentage === zonePct)
        if (set) return set.weight
      }
    }
    return null
  }

  // Max sets per session across all weeks/lifts (total sets, not per zone)
  const maxSetsPerSession: Record<string, number> = {}
  for (const sk of sessionKeys) {
    let max = 0
    for (const lift of allLifts) {
      for (const wk of weeks) {
        const n = getAllSets(lift, sk, wk).length
        if (n > max) max = n
      }
    }
    maxSetsPerSession[sk] = Math.max(max, 1)
  }

  const cell: React.CSSProperties = {
    padding: '2px 5px',
    borderBottom: '1px solid #333',
    borderRight: '1px solid #2a2a2a',
    fontSize: '0.82rem',
    textAlign: 'center',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
  }

  const ZONE_ROWS = ZONES.length // 5
  const ROWS_PER_WEEK = ZONE_ROWS + 2 // +ARI +NL

  return (
    <div>
      {[...allLifts].map(lift => {
        const liftName = lift === 'bench_press' ? 'Bench Press' : lift.charAt(0).toUpperCase() + lift.slice(1)
        return (
          <div key={lift} style={{ marginBottom: '2rem', overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', tableLayout: 'auto' }}>
              <thead>
                <tr>
                  <th style={{ ...cell, background: '#181818', fontWeight: 700, width: 35 }}>week</th>
                  <th style={{ ...cell, background: '#181818', fontWeight: 700, width: 25 }}>lift</th>
                  <th style={{ ...cell, background: '#181818', fontWeight: 700, width: 42 }}>%1RM</th>
                  <th style={{ ...cell, background: '#181818', fontWeight: 700, width: 50 }}>kg</th>
                  <th style={{ ...cell, background: '#181818', fontWeight: 700, width: 35 }}>#reps</th>
                  {sessionKeys.map(sk => {
                    const nCols = maxSetsPerSession[sk]
                    return (
                      <React.Fragment key={sk}>
                        {Array.from({ length: nCols }, (_, i) => (
                          <th key={i} style={{
                            ...cell,
                            background: '#181818',
                            fontWeight: 700,
                            borderLeft: i === 0 ? '2px solid #666' : undefined,
                            minWidth: 28,
                            fontSize: '0.7rem',
                            color: i === 0 ? '#f65d2e' : '#888',
                          }}>
                            {i === 0 ? `Session ${sk}` : `#${i + 1}`}
                          </th>
                        ))}
                      </React.Fragment>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {weeks.map((weekKey, wi) => {
                  const weekNum = wi + 1

                  return (
                    <React.Fragment key={weekKey}>
                      {ZONES.map((zone, zi) => {
                        const weight = getWeightForZone(lift, zone.key)
                        // Total reps in this zone across all sessions this week
                        let totalZoneReps = 0
                        for (const sk of sessionKeys) {
                          const sets = getAllSets(lift, sk, weekKey)
                          totalZoneReps += sets.filter(s => s.percentage === zone.key).reduce((a, s) => a + s.reps, 0)
                        }

                        return (
                          <tr key={zone.key} style={{ background: zi % 2 === 0 ? '#1e1e1e' : '#222' }}>
                            {zi === 0 && (
                              <td rowSpan={ROWS_PER_WEEK} style={{
                                ...cell,
                                fontWeight: 700,
                                fontSize: '1.3rem',
                                color: '#e0e0e0',
                                background: '#151515',
                                borderRight: '2px solid #444',
                                borderBottom: '3px solid #555',
                              }}>
                                {weekNum}
                              </td>
                            )}
                            {zi === 0 && (
                              <td rowSpan={ROWS_PER_WEEK} style={{
                                ...cell,
                                fontWeight: 600,
                                fontSize: '0.65rem',
                                color: '#777',
                                background: '#151515',
                                writingMode: 'vertical-lr',
                                borderRight: '1px solid #444',
                                borderBottom: '3px solid #555',
                                letterSpacing: 1,
                              }}>
                                {liftName}
                              </td>
                            )}
                            <td style={{ ...cell, color: getZoneColor(zone.key), fontWeight: 600, fontSize: '0.75rem' }}>
                              {zone.label}
                            </td>
                            <td style={{ ...cell, fontSize: '0.75rem', color: '#999' }}>
                              {weight ?? ''}
                            </td>
                            <td style={{ ...cell, fontWeight: 600, color: totalZoneReps > 0 ? '#fff' : '#444' }}>
                              {totalZoneReps || ''}
                            </td>
                            {/* Set columns — each column = one set in ORDER, reps shown in matching zone row */}
                            {sessionKeys.map(sk => {
                              const allSessionSets = getAllSets(lift, sk, weekKey)
                              const nCols = maxSetsPerSession[sk]
                              const cells = []
                              for (let i = 0; i < nCols; i++) {
                                const set = allSessionSets[i]
                                const isThisZone = set && set.percentage === zone.key
                                cells.push(
                                  <td key={`${sk}-${i}`} style={{
                                    ...cell,
                                    borderLeft: i === 0 ? '2px solid #666' : undefined,
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    color: isThisZone ? '#fff' : 'transparent',
                                    background: isThisZone ? `${getZoneColor(zone.key)}30` : 'transparent',
                                  }}>
                                    {isThisZone ? set.reps : ''}
                                  </td>
                                )
                              }
                              return cells
                            })}
                          </tr>
                        )
                      })}

                      {/* ARI row */}
                      <tr style={{ background: '#191930' }}>
                        <td colSpan={3} style={{ ...cell, textAlign: 'right', fontSize: '0.7rem', color: '#778', fontWeight: 600 }}>
                          ARI
                        </td>
                        {sessionKeys.map(sk => {
                          const sets = getAllSets(lift, sk, weekKey)
                          const totalReps = sets.reduce((a, s) => a + s.reps, 0)
                          const ari = totalReps > 0 ? sets.reduce((a, s) => a + s.reps * s.percentage, 0) / totalReps : null
                          return (
                            <td key={sk} colSpan={maxSetsPerSession[sk]} style={{
                              ...cell,
                              borderLeft: '2px solid #666',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              color: '#90caf9',
                            }}>
                              {ari !== null ? `${ari.toFixed(2)}%` : ''}
                            </td>
                          )
                        })}
                      </tr>

                      {/* NL row */}
                      <tr style={{ background: '#193019', borderBottom: '3px solid #555' }}>
                        <td colSpan={3} style={{ ...cell, textAlign: 'right', fontSize: '0.7rem', color: '#787', fontWeight: 600, borderBottom: '3px solid #555' }}>
                          NL
                        </td>
                        {sessionKeys.map(sk => {
                          const sets = getAllSets(lift, sk, weekKey)
                          const total = sets.reduce((a, s) => a + s.reps, 0)
                          return (
                            <td key={sk} colSpan={maxSetsPerSession[sk]} style={{
                              ...cell,
                              borderLeft: '2px solid #666',
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              color: '#81c784',
                              borderBottom: '3px solid #555',
                            }}>
                              {total || ''}
                            </td>
                          )
                        })}
                      </tr>
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────
function getZoneColor(percentage: number): string {
  if (percentage <= 65) return '#81c784'  // green
  if (percentage <= 75) return '#64b5f6'  // blue
  if (percentage <= 85) return '#ffb74d'  // orange
  if (percentage <= 92.5) return '#e57373' // red
  return '#ce93d8'                         // purple (95%+)
}

/** Group consecutive identical sets (same weight + reps) → "3×5×110" format */
function groupSets(sets: SetData[]): { count: number; reps: number; weight: number; percentage: number }[] {
  const groups: { count: number; reps: number; weight: number; percentage: number }[] = []
  for (const set of sets) {
    const last = groups[groups.length - 1]
    if (last && last.reps === set.reps && last.weight === set.weight) {
      last.count++
    } else {
      groups.push({ count: 1, reps: set.reps, weight: set.weight, percentage: set.percentage })
    }
  }
  return groups
}
