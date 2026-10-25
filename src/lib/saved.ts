import { useEffect, useState } from 'react'
import { ENCHANTMENT_BY_ID, ITEM_BY_ID } from '@/data'
import type { Selection } from '@/components/enchantment-list'
import type { Objective } from '@/lib/solver'

/** A named selection. One item is a template for that item; several make a set (e.g. a full armor kit). */
export interface Template {
  id: string
  name: string
  items: Record<string, Selection>
}

export interface Last {
  item?: string
  objective?: Objective
  /** Last selection per item, so switching back to an item restores it. */
  selections: Record<string, Selection>
}

const KEYS = { last: 'anvil-order:last', templates: 'anvil-order:templates' }

/** Drops unknown or incompatible enchantments and clamps levels. */
export function sanitize(itemId: string, selection: Record<string, unknown>): Selection {
  const item = ITEM_BY_ID.get(itemId)
  const out: Selection = {}
  if (!item) return out
  for (const [id, lvl] of Object.entries(selection)) {
    const e = ENCHANTMENT_BY_ID.get(id)
    if (e && item.enchantments.includes(id)) out[id] = Math.min(Math.max(Number(lvl) || e.maxLevel, 1), e.maxLevel)
  }
  return out
}

function sanitizeItems(items: Record<string, unknown>): Record<string, Selection> {
  return Object.fromEntries(
    Object.entries(items ?? {})
      .filter(([id, sel]) => ITEM_BY_ID.has(id) && sel && typeof sel === 'object')
      .map(([id, sel]) => [id, sanitize(id, sel as Record<string, unknown>)]),
  )
}

// Storage can be missing or throw (private windows, blocked site data), so every access is guarded.
function read<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : undefined
  } catch {
    return undefined
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Not persisted; the app still works for this visit.
  }
}

export function readLast(): Last {
  const raw = read<Partial<Last>>(KEYS.last)
  return {
    item: raw?.item && ITEM_BY_ID.has(raw.item) ? raw.item : undefined,
    objective: raw?.objective === 'xp' ? 'xp' : raw?.objective === 'levels' ? 'levels' : undefined,
    selections: sanitizeItems(raw?.selections ?? {}),
  }
}

export const writeLast = (last: Last) => write(KEYS.last, last)

function readTemplates(): Template[] {
  const raw = read<Template[]>(KEYS.templates)
  if (!Array.isArray(raw)) return []
  return raw
    .filter((t) => t && typeof t.name === 'string' && t.items)
    .map((t) => ({ id: String(t.id ?? crypto.randomUUID()), name: t.name, items: sanitizeItems(t.items) }))
    .filter((t) => Object.keys(t.items).length > 0)
}

export function useTemplates() {
  const [templates, setTemplates] = useState(readTemplates)
  useEffect(() => write(KEYS.templates, templates), [templates])
  useEffect(() => {
    // Keep several open tabs in step.
    const onStorage = (e: StorageEvent) => e.key === KEYS.templates && setTemplates(readTemplates())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
  return [templates, setTemplates] as const
}
