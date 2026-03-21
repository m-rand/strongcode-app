/**
 * Prompt version registry
 *
 * Add new versions here by:
 * 1. Creating a new file `vN.ts` in this directory (copy the previous version as a starting point)
 * 2. Importing it below and adding an entry to PROMPT_REGISTRY
 * 3. Optionally update DEFAULT_PROMPT_VERSION
 */

import * as v1 from './v1'
import * as v2 from './v2'
import * as v22 from './v2_2'
import * as v23 from './v2_3'
import * as v24 from './v2_4'
import * as v25 from './v2_5'
import * as v26 from './v2_6'
import * as v27 from './v2-7'

export interface PromptVersion {
  id: string
  label: string
  tags: string[]
  createdAt: string
  description: string
  systemPrompt: string
}

export const PROMPT_REGISTRY: Record<string, PromptVersion> = {
  v1: {
    ...v1.metadata,
    systemPrompt: v1.SYSTEM_PROMPT,
  },
  [v2.metadata.id]: {
    ...v2.metadata,
    systemPrompt: v2.SYSTEM_PROMPT,
  },
  [v22.metadata.id]: {
    ...v22.metadata,
    systemPrompt: v22.SYSTEM_PROMPT,
  },
  [v23.metadata.id]: {
    ...v23.metadata,
    systemPrompt: v23.SYSTEM_PROMPT,
  },
  [v24.metadata.id]: {
    ...v24.metadata,
    systemPrompt: v24.SYSTEM_PROMPT,
  },
  [v25.metadata.id]: {
    ...v25.metadata,
    systemPrompt: v25.SYSTEM_PROMPT,
  },
  v2_6: {
    ...v26.metadata,
    id: 'v2_6',
    systemPrompt: v26.SYSTEM_PROMPT,
  },
  v2_7: {
    ...v27.metadata,
    systemPrompt: v27.SYSTEM_PROMPT,
  },
}

/** The version used by default (API route, production) */
export const DEFAULT_PROMPT_VERSION = 'v2_7'

/** Backward-compatible aliases for old prompt ids */
const PROMPT_ALIASES: Record<string, string> = {
  v2: v2.metadata.id,
  'v2.1': v2.metadata.id,
  v22: v22.metadata.id,
  'v2.2': v22.metadata.id,
  v23: v23.metadata.id,
  'v2.3': v23.metadata.id,
  v24: v24.metadata.id,
  'v2.4': v24.metadata.id,
}

/** Returns the requested version, or the default if not found */
export function getPromptVersion(id?: string): PromptVersion {
  if (id && PROMPT_REGISTRY[id]) return PROMPT_REGISTRY[id]
  if (id && PROMPT_ALIASES[id] && PROMPT_REGISTRY[PROMPT_ALIASES[id]]) {
    return PROMPT_REGISTRY[PROMPT_ALIASES[id]]
  }
  return PROMPT_REGISTRY[DEFAULT_PROMPT_VERSION]
}

/** Sorted list of all versions (newest first by createdAt) */
export function listPromptVersions(): PromptVersion[] {
  return Object.values(PROMPT_REGISTRY).sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt),
  )
}
