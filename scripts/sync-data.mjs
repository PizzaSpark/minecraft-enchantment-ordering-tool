#!/usr/bin/env node
// Pulls enchantment data straight from Minecraft's own data pack (via misode/mcmeta,
// which mirrors the files extracted from every official Java Edition jar) and writes
// src/data/minecraft.json.
//
//   node scripts/sync-data.mjs           -> latest stable release
//   node scripts/sync-data.mjs 26.3      -> a specific version

import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'src/data/minecraft.json')
const MCMETA = 'https://raw.githubusercontent.com/misode/mcmeta'

async function getJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`)
  return res.json()
}

// Items that share a type are collapsed into one pickable "item" (every sword is a sword).
// Anything not matched here becomes its own entry, named from the game's language file.
const GROUPS = [
  { id: 'helmet', name: 'Helmet', section: 'armor', match: /_helmet$/ },
  { id: 'chestplate', name: 'Chestplate', section: 'armor', match: /_chestplate$/ },
  { id: 'leggings', name: 'Leggings', section: 'armor', match: /_leggings$/ },
  { id: 'boots', name: 'Boots', section: 'armor', match: /_boots$/ },
  { id: 'sword', name: 'Sword', section: 'weapons', match: /_sword$/ },
  { id: 'spear', name: 'Spear', section: 'weapons', match: /_spear$/ },
  { id: 'pickaxe', name: 'Pickaxe', section: 'tools', match: /_pickaxe$/ },
  { id: 'axe', name: 'Axe', section: 'tools', match: /_axe$/ },
  { id: 'shovel', name: 'Shovel', section: 'tools', match: /_shovel$/ },
  { id: 'hoe', name: 'Hoe', section: 'tools', match: /_hoe$/ },
  { id: 'head', name: 'Head / Pumpkin', section: 'other', match: /(_head|_skull|^carved_pumpkin)$/ },
]
const SECTION_OF = {
  trident: 'weapons', mace: 'weapons', bow: 'weapons', crossbow: 'weapons',
  elytra: 'armor', turtle_helmet: 'armor', shield: 'armor',
  fishing_rod: 'tools', shears: 'tools', brush: 'tools', flint_and_steel: 'tools',
}

async function main() {
  let version = process.argv[2]
  const versions = await getJson(`${MCMETA}/summary/versions/data.json`)
  const meta = version ? versions.find((v) => v.id === version) : versions.find((v) => v.stable)
  if (!meta) throw new Error(`Unknown Minecraft version: ${version}`)
  version = meta.id
  console.log(`Syncing enchantments for Minecraft ${version}`)

  const [enchantments, itemTags, enchantTags, lang] = await Promise.all([
    getJson(`${MCMETA}/${version}-summary/data/enchantment/data.min.json`),
    getJson(`${MCMETA}/${version}-summary/data/tag/item/data.min.json`),
    getJson(`${MCMETA}/${version}-summary/data/tag/enchantment/data.min.json`),
    getJson(`${MCMETA}/${version}-assets-json/assets/minecraft/lang/en_us.json`),
  ])

  const strip = (id) => id.replace(/^minecraft:/, '')
  const resolveTag = (tags, ref, out = new Set()) => {
    if (Array.isArray(ref)) {
      ref.forEach((r) => resolveTag(tags, r, out))
    } else if (ref.startsWith('#')) {
      const tag = tags[strip(ref.slice(1))]
      if (!tag) throw new Error(`Missing tag ${ref}`)
      tag.values.forEach((v) => resolveTag(tags, typeof v === 'string' ? v : v.id, out))
    } else {
      out.add(strip(ref))
    }
    return out
  }

  // Enchantments
  const ids = Object.keys(enchantments).sort()
  const supported = {}
  const exclusive = {}
  for (const id of ids) {
    const e = enchantments[id]
    supported[id] = resolveTag(itemTags, e.supported_items)
    exclusive[id] = e.exclusive_set ? resolveTag(enchantTags, e.exclusive_set) : new Set()
  }

  // Compatibility is symmetric in-game: either side listing the other is enough to block it.
  const incompatible = Object.fromEntries(ids.map((id) => [id, new Set()]))
  for (const a of ids) {
    for (const b of exclusive[a]) {
      if (a === b || !incompatible[b]) continue
      incompatible[a].add(b)
      incompatible[b].add(a)
    }
  }

  // Items
  const allItems = new Set(ids.flatMap((id) => [...supported[id]]))
  const groups = new Map()
  for (const item of [...allItems].sort()) {
    const g = GROUPS.find((g) => g.match.test(item) && !(item in SECTION_OF))
    const key = g ? g.id : item
    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        name: g ? g.name : lang[`item.minecraft.${item}`] ?? item,
        section: g ? g.section : SECTION_OF[item] ?? 'other',
        members: [],
      })
    }
    groups.get(key).members.push(item)
  }

  // Every member of a group must accept exactly the same enchantments, otherwise the
  // grouping is lying. A new Minecraft version can break this; fail loudly so CI notices.
  const items = []
  for (const g of groups.values()) {
    const sig = (item) => ids.filter((id) => supported[id].has(item)).join(',')
    const first = sig(g.members[0])
    const odd = g.members.filter((m) => sig(m) !== first)
    if (odd.length) {
      throw new Error(`Group "${g.id}" mixes items with different enchantments: ${odd.join(', ')}`)
    }
    items.push({ ...g, enchantments: first.split(',').filter(Boolean) })
  }
  const sectionOrder = ['armor', 'weapons', 'tools', 'other']
  items.sort((a, b) => sectionOrder.indexOf(a.section) - sectionOrder.indexOf(b.section))

  const out = {
    version,
    syncedAt: new Date().toISOString().slice(0, 10),
    source: `https://github.com/misode/mcmeta/tree/${version}-summary`,
    enchantments: ids.map((id) => {
      const e = enchantments[id]
      return {
        id,
        name: lang[`enchantment.minecraft.${id}`] ?? id,
        maxLevel: e.max_level,
        anvilCost: e.anvil_cost,
        // Applying from a book halves the multiplier (minimum 1).
        bookMultiplier: Math.max(1, Math.floor(e.anvil_cost / 2)),
        curse: id.endsWith('_curse'),
        incompatible: [...incompatible[id]].sort(),
      }
    }),
    items,
  }

  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(out, null, 2) + '\n')
  console.log(`Wrote ${out.enchantments.length} enchantments and ${items.length} items to ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
