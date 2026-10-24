// Finds the cheapest order to combine enchanted books in an anvil (Java Edition).
//
// Anvil rules this models:
//   step cost   = sum(level × book multiplier) of the sacrifice
//               + prior work penalty of the target + prior work penalty of the sacrifice
//   penalty     = 2^uses − 1, and the result's uses = max(target uses, sacrifice uses) + 1
//   a step costing 40+ levels is "Too Expensive!" in survival
//
// Every merge plan is a binary tree over the books (+ the item, which must always be the
// leftmost target). The cost of a step only depends on *which* books are on each side and
// how many times each side has been worked, so an exact dynamic program over
// (subset of inputs, work count) finds the optimum without enumerating every tree.

export const MAX_STEP_LEVELS = 39
const MAX_WORK = 6 // 2^6 − 1 = 63 > 39, so nothing deeper is ever affordable

export type Objective = 'levels' | 'xp'

export interface SolverEnchant {
  id: string
  level: number
  multiplier: number
}

export type Operand =
  | { kind: 'item' }
  | { kind: 'book'; enchants: SolverEnchant[] }
  | { kind: 'result'; step: number; enchants: SolverEnchant[]; hasItem: boolean }

export interface Step {
  index: number
  target: Operand
  sacrifice: Operand
  levels: number
  xp: number
  /** Prior work penalty of the output, i.e. what it adds to its next anvil use. */
  penaltyAfter: number
}

export interface Solution {
  steps: Step[]
  totalLevels: number
  totalXp: number
  finalPenalty: number
}

/** Experience points needed to go from level 0 to `level`. */
export function xpForLevel(level: number): number {
  if (level <= 16) return level * level + 6 * level
  if (level <= 31) return 2.5 * level * level - 40.5 * level + 360
  return 4.5 * level * level - 162.5 * level + 2220
}

const penalty = (work: number) => 2 ** work - 1

interface Cell {
  score: number
  tie: number
  levels: number
  xp: number
  // back-pointer: left subset and work counts on each side
  left: number
  wl: number
  wr: number
}

/**
 * @param enchants one book per enchantment
 * @param onItem   true → apply to a tool/armor piece; false → merge everything into one book
 * Returns null when every possible order hits "Too Expensive!".
 */
export function solve(enchants: SolverEnchant[], onItem: boolean, objective: Objective): Solution | null {
  const books = enchants.length
  const n = books + (onItem ? 1 : 0)
  if (books === 0 || n < 2) return null

  const ITEM = onItem ? 1 << books : 0
  const full = (1 << n) - 1
  const value = new Int32Array(1 << n)
  for (let m = 1; m <= full; m++) {
    const low = 31 - Math.clz32(m & -m)
    value[m] = value[m & (m - 1)] + (low < books ? enchants[low].level * enchants[low].multiplier : 0)
  }

  const table: (Cell | undefined)[][] = Array.from({ length: full + 1 }, () => [])
  for (let i = 0; i < n; i++) table[1 << i][0] = { score: 0, tie: 0, levels: 0, xp: 0, left: 0, wl: 0, wr: 0 }

  for (let m = 1; m <= full; m++) {
    if ((m & (m - 1)) === 0) continue
    const cells = table[m]
    // every ordered split (left = target, right = sacrifice)
    for (let a = (m - 1) & m; a > 0; a = (a - 1) & m) {
      const b = m ^ a
      if (ITEM && (b & ITEM)) continue // the item is never a sacrifice
      const L = table[a]
      const R = table[b]
      for (let wl = 0; wl < MAX_WORK; wl++) {
        const l = L[wl]
        if (!l) continue
        for (let wr = 0; wr < MAX_WORK; wr++) {
          const r = R[wr]
          if (!r) continue
          const cost = value[b] + penalty(wl) + penalty(wr)
          if (cost > MAX_STEP_LEVELS) continue
          const w = Math.max(wl, wr) + 1
          if (w >= MAX_WORK) continue
          const levels = l.levels + r.levels + cost
          const xp = l.xp + r.xp + xpForLevel(cost)
          const score = objective === 'levels' ? levels : xp
          const tie = objective === 'levels' ? xp : levels
          const cur = cells[w]
          if (!cur || score < cur.score || (score === cur.score && tie < cur.tie)) {
            cells[w] = { score, tie, levels, xp, left: a, wl, wr }
          }
        }
      }
    }
  }

  // Pick the cheapest result; among equals prefer less prior work (cheaper future repairs).
  let bestW = -1
  for (let w = 0; w < MAX_WORK; w++) {
    const c = table[full][w]
    if (!c) continue
    const b = bestW < 0 ? undefined : table[full][bestW]!
    if (!b || c.score < b.score || (c.score === b.score && c.tie < b.tie)) bestW = w
  }
  if (bestW < 0) return null

  const steps: Step[] = []
  const enchantsOf = (m: number) => enchants.filter((_, i) => m & (1 << i))
  const build = (m: number, w: number): Operand => {
    if ((m & (m - 1)) === 0) return m === ITEM ? { kind: 'item' } : { kind: 'book', enchants: enchantsOf(m) }
    const c = table[m][w]!
    const b = m ^ c.left
    const target = build(c.left, c.wl)
    const sacrifice = build(b, c.wr)
    const levels = value[b] + penalty(c.wl) + penalty(c.wr)
    const step: Step = {
      index: steps.length + 1,
      target,
      sacrifice,
      levels,
      xp: xpForLevel(levels),
      penaltyAfter: penalty(w),
    }
    steps.push(step)
    return { kind: 'result', step: step.index, enchants: enchantsOf(m), hasItem: !!(m & ITEM) }
  }
  build(full, bestW)

  const best = table[full][bestW]!
  return { steps, totalLevels: best.levels, totalXp: best.xp, finalPenalty: penalty(bestW) }
}
