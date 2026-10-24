import raw from './minecraft.json'

export interface Enchantment {
  id: string
  name: string
  maxLevel: number
  anvilCost: number
  bookMultiplier: number
  curse: boolean
  incompatible: string[]
}

export type Section = 'armor' | 'weapons' | 'tools' | 'other'

export interface Item {
  id: string
  name: string
  section: Section
  members: string[]
  enchantments: string[]
}

export const GAME_VERSION: string = raw.version
export const SYNCED_AT: string = raw.syncedAt

export const ENCHANTMENTS: Enchantment[] = raw.enchantments
export const ENCHANTMENT_BY_ID = new Map(ENCHANTMENTS.map((e) => [e.id, e]))

export const BOOK: Item = {
  id: 'book',
  name: 'Enchanted Book',
  section: 'other',
  members: ['enchanted_book'],
  enchantments: ENCHANTMENTS.map((e) => e.id),
}

export const ITEMS: Item[] = [BOOK, ...(raw.items as Item[])]
export const ITEM_BY_ID = new Map(ITEMS.map((i) => [i.id, i]))

export const SECTION_LABELS: Record<Section, string> = {
  armor: 'Armor',
  weapons: 'Weapons',
  tools: 'Tools',
  other: 'Other',
}

/** Merging more books than this into a single book gets slow (the search is exponential). */
export const MAX_BOOKS = 12

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
export const roman = (n: number) => ROMAN[n] ?? String(n)
