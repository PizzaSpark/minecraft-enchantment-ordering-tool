import { useEffect, useMemo, useState } from 'react'
import { ArrowDownIcon, GithubLogoIcon, LinkIcon, SparkleIcon, TrashIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { EnchantmentList, type Selection } from '@/components/enchantment-list'
import { ItemIcon } from '@/components/item-icon'
import { ItemPicker } from '@/components/item-picker'
import { Results } from '@/components/results'
import { ThemeToggle } from '@/components/theme-toggle'
import { ENCHANTMENT_BY_ID, GAME_VERSION, ITEM_BY_ID, MAX_BOOKS, SYNCED_AT } from '@/data'
import { useSolution } from '@/hooks/use-solution'
import type { Objective } from '@/lib/solver'

const REPO_URL = 'https://github.com/PizzaSpark/minecraft-enchantment-ordering-tool'

interface State {
  item: string
  selection: Selection
  objective: Objective
}

// Shareable state lives in the hash: #sword/sharpness-5,looting-3/xp
function readHash(): State {
  const [item = 'sword', list = '', mode] = decodeURIComponent(location.hash.slice(1)).split('/')
  const it = ITEM_BY_ID.get(item) ?? ITEM_BY_ID.get('sword')!
  const selection: Selection = {}
  for (const part of list.split(',').filter(Boolean)) {
    const [id, lvl] = part.split('-')
    const e = ENCHANTMENT_BY_ID.get(id)
    if (e && it.enchantments.includes(id)) selection[id] = Math.min(Math.max(Number(lvl) || e.maxLevel, 1), e.maxLevel)
  }
  return { item: it.id, selection, objective: mode === 'xp' ? 'xp' : 'levels' }
}

function writeHash({ item, selection, objective }: State) {
  const list = Object.entries(selection).map(([id, lvl]) => `${id}-${lvl}`).join(',')
  history.replaceState(null, '', `#${[item, list, objective === 'xp' ? 'xp' : ''].join('/').replace(/\/+$/, '')}`)
}

export default function App() {
  const [state, setState] = useState(readHash)
  const [showCurses, setShowCurses] = useState(false)
  const { item: itemId, selection, objective } = state
  const item = ITEM_BY_ID.get(itemId)!

  useEffect(() => writeHash(state), [state])
  useEffect(() => {
    const onHash = () => setState(readHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const enchantments = useMemo(
    () =>
      item.enchantments
        .map((id) => ENCHANTMENT_BY_ID.get(id)!)
        .filter((e) => showCurses || !e.curse || selection[e.id] !== undefined)
        .sort((a, b) => Number(a.curse) - Number(b.curse) || a.name.localeCompare(b.name)),
    [item, showCurses, selection],
  )

  const books = useMemo(
    () =>
      Object.entries(selection).map(([id, level]) => ({
        id,
        level,
        multiplier: ENCHANTMENT_BY_ID.get(id)!.bookMultiplier,
      })),
    [selection],
  )
  const onItem = item.id !== 'book'
  const { solution, pending } = useSolution(books, onItem, objective)

  const setItem = (id: string) => {
    const next = ITEM_BY_ID.get(id)!
    setState((s) => ({
      ...s,
      item: id,
      selection: Object.fromEntries(Object.entries(s.selection).filter(([e]) => next.enchantments.includes(e))),
    }))
  }

  const setLevel = (id: string, level: number | null) => {
    const e = ENCHANTMENT_BY_ID.get(id)!
    if (level === null) {
      setState((s) => {
        const { [id]: _, ...rest } = s.selection
        return { ...s, selection: rest }
      })
      return
    }
    const removed = e.incompatible.filter((other) => selection[other] !== undefined)
    if (selection[id] === undefined && Object.keys(selection).length - removed.length >= MAX_BOOKS) {
      toast.warning(`${MAX_BOOKS} enchantments is the limit`, {
        description: 'Beyond that the search takes too long. Merge in two batches instead.',
      })
      return
    }
    setState((s) => {
      const next = { ...s.selection, [id]: level }
      removed.forEach((other) => delete next[other])
      return { ...s, selection: next }
    })
    if (removed.length) {
      toast(`Swapped out ${removed.map((r) => ENCHANTMENT_BY_ID.get(r)!.name).join(', ')}`, {
        description: `${e.name} can't be combined with ${removed.length > 1 ? 'them' : 'it'}.`,
      })
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(location.href)
      toast.success('Link copied', { description: 'It opens with this exact item and enchantments.' })
    } catch {
      toast.error("Couldn't copy the link")
    }
  }

  const count = books.length

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl xl:max-w-7xl items-center gap-3 px-4">
          <SparkleIcon className="size-5 text-enchant" weight="fill" />
          <h1 className="truncate text-sm font-semibold">Anvil Order</h1>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            Java {GAME_VERSION}
          </Badge>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={copyLink}>
              <LinkIcon /> <span className="hidden sm:inline">Copy link</span>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a href={REPO_URL} target="_blank" rel="noreferrer" aria-label="Source on GitHub">
                <GithubLogoIcon />
              </a>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl xl:max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start xl:grid-cols-[19rem_minmax(0,1fr)_minmax(0,26rem)]">
        <div className="flex min-w-0 flex-col gap-6 xl:contents">
          <Card className="xl:sticky xl:top-20">
            <CardHeader>
              <CardTitle>1 · What are you enchanting?</CardTitle>
              <CardDescription>Material doesn't matter: a wooden sword costs the same as a netherite one.</CardDescription>
            </CardHeader>
            <CardContent>
              <ItemPicker value={itemId} onChange={setItem} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                2 · Enchantments
                <span className="flex items-center gap-1.5 font-normal text-muted-foreground">
                  for <ItemIcon id={item.id} className="size-3.5" weight="duotone" /> {item.name}
                </span>
              </CardTitle>
              <CardDescription>
                Click a name for its max level, or pick a level. {count > 0 && `${count} selected.`}
              </CardDescription>
              <CardAction>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={count === 0}
                  onClick={() => setState((s) => ({ ...s, selection: {} }))}
                >
                  <TrashIcon /> Clear
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <EnchantmentList enchantments={enchantments} selection={selection} onSet={setLevel} />
              {item.enchantments.some((id) => ENCHANTMENT_BY_ID.get(id)!.curse) && (
                <div className="flex items-center gap-2 border-t pt-3">
                  <Switch id="curses" size="sm" checked={showCurses} onCheckedChange={setShowCurses} />
                  <Label htmlFor="curses" className="text-xs text-muted-foreground">
                    Show curses
                  </Label>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card id="order" className="scroll-mt-20 lg:sticky lg:top-20 lg:max-h-[calc(100svh-6rem)] lg:overflow-y-auto">
          <CardHeader>
            <CardTitle>3 · Anvil order</CardTitle>
            <CardDescription>Cheapest way to combine them, step by step.</CardDescription>
            <CardAction>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                spacing={0}
                value={objective}
                onValueChange={(v) => v && setState((s) => ({ ...s, objective: v as Objective }))}
                aria-label="Optimize for"
              >
                <ToggleGroupItem value="levels" className="px-2 text-[0.7rem]">
                  Levels
                </ToggleGroupItem>
                <ToggleGroupItem value="xp" className="px-2 text-[0.7rem]">
                  XP
                </ToggleGroupItem>
              </ToggleGroup>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Results item={item} count={count} solution={solution} pending={pending} />
          </CardContent>
        </Card>
      </main>

      {solution && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/90 backdrop-blur lg:hidden">
          <div className="flex items-center gap-3 px-4 py-2.5">
            <span className="text-lg font-semibold text-xp tabular-nums">{solution.totalLevels}</span>
            <span className="text-xs text-muted-foreground">
              levels · {solution.steps.length} anvil {solution.steps.length === 1 ? 'use' : 'uses'}
            </span>
            <Button
              size="sm"
              className="ml-auto"
              onClick={() => document.getElementById('order')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Show order <ArrowDownIcon />
            </Button>
          </div>
        </div>
      )}

      <footer className="mx-auto max-w-6xl xl:max-w-7xl px-4 pt-2 pb-24 text-[0.65rem] lg:pb-10 leading-relaxed text-muted-foreground">
        Java Edition rules. Enchantment data from Minecraft {GAME_VERSION}'s own game files, synced {SYNCED_AT}. Not
        affiliated with Mojang or Microsoft.
      </footer>
    </div>
  )
}
