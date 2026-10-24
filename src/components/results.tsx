import { ArrowRightIcon, BookIcon, PlusIcon, SpinnerIcon, WarningIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ItemIcon } from '@/components/item-icon'
import { ENCHANTMENT_BY_ID, roman, type Item } from '@/data'
import { MAX_STEP_LEVELS, type Operand, type Solution, type SolverEnchant } from '@/lib/solver'

const fmt = new Intl.NumberFormat()

function enchantLabel(e: SolverEnchant) {
  const data = ENCHANTMENT_BY_ID.get(e.id)!
  return data.maxLevel === 1 ? data.name : `${data.name} ${roman(e.level)}`
}

function OperandView({ op, item }: { op: Operand; item: Item }) {
  if (op.kind === 'item') {
    return (
      <div className="flex min-w-0 items-center gap-2 border bg-muted/40 px-2.5 py-2">
        <ItemIcon id={item.id} className="size-4 shrink-0" weight="duotone" />
        <span className="text-xs">{item.name}</span>
      </div>
    )
  }
  if (op.kind === 'book') {
    return (
      <div className="flex min-w-0 items-center gap-2 border border-enchant/40 bg-enchant/5 px-2.5 py-2">
        <BookIcon className="size-4 shrink-0 text-enchant" weight="duotone" />
        <span className="text-xs text-enchant">{op.enchants.map(enchantLabel).join(', ')}</span>
      </div>
    )
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex min-w-0 cursor-default items-center gap-2 border border-dashed px-2.5 py-2">
          {op.hasItem ? (
            <ItemIcon id={item.id} className="size-4 shrink-0" weight="duotone" />
          ) : (
            <BookIcon className="size-4 shrink-0 text-enchant" weight="duotone" />
          )}
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-xs">{op.hasItem ? item.name : 'Combined book'}</span>
            <span className="truncate text-[0.65rem] text-muted-foreground">
              from step {op.step} · {op.enchants.length} ench.
            </span>
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-60">{op.enchants.map(enchantLabel).join(', ')}</TooltipContent>
    </Tooltip>
  )
}

function Stat({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-1 bg-card p-3">
      <span className="text-[0.65rem] tracking-widest text-muted-foreground uppercase">{label}</span>
      <span className={cn('text-xl font-semibold tabular-nums', accent && 'text-xp')}>{value}</span>
      {hint && <span className="text-[0.65rem] text-muted-foreground">{hint}</span>}
    </div>
  )
}

interface Props {
  item: Item
  count: number
  solution: Solution | null
  pending: boolean
}

export function Results({ item, count, solution, pending }: Props) {
  const needed = item.id === 'book' ? 2 : 1
  if (count < needed) {
    return (
      <div className="flex flex-col items-center gap-3 border border-dashed px-6 py-14 text-center">
        <BookIcon className="size-8 text-muted-foreground/60" weight="duotone" />
        <p className="max-w-xs text-xs text-muted-foreground">
          {item.id === 'book'
            ? 'Pick at least two enchantments to merge them into one book.'
            : `Pick the enchantments you want on your ${item.name.toLowerCase()}, and the cheapest anvil order shows up here.`}
        </p>
      </div>
    )
  }

  if (!solution) {
    if (pending) {
      return (
        <div className="flex items-center justify-center gap-2 py-14 text-xs text-muted-foreground">
          <SpinnerIcon className="size-4 animate-spin" /> Finding the cheapest order…
        </div>
      )
    }
    return (
      <div className="flex flex-col items-center gap-3 border border-destructive/40 bg-destructive/5 px-6 py-14 text-center">
        <WarningIcon className="size-8 text-destructive" weight="duotone" />
        <p className="max-w-xs text-xs">
          <span className="font-semibold text-destructive">Too Expensive!</span> Every possible order has a step costing{' '}
          {MAX_STEP_LEVELS + 1}+ levels. Drop an enchantment or lower some levels.
        </p>
      </div>
    )
  }

  const hardest = Math.max(...solution.steps.map((s) => s.levels))
  return (
    <div className={cn('flex flex-col gap-5 transition-opacity', pending && 'opacity-60')}>
      <div className="grid grid-cols-2 gap-px border bg-border">
        <Stat label="Total levels" value={fmt.format(solution.totalLevels)} accent hint={`hardest step ${hardest}`} />
        <Stat label="Total XP" value={fmt.format(solution.totalXp)} hint="points, starting from level 0 each step" />
        <Stat label="Anvil uses" value={String(solution.steps.length)} />
        <Stat label="Prior work after" value={`+${solution.finalPenalty}`} hint="added to any later anvil use" />
      </div>

      <ol className="flex flex-col gap-3">
        {solution.steps.map((step) => (
          <li key={step.index} className="flex flex-col gap-2 border bg-card p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[0.65rem] tracking-widest text-muted-foreground uppercase">Step {step.index}</span>
              <Badge variant="outline" className="border-xp/50 font-semibold text-xp tabular-nums">
                {step.levels} {step.levels === 1 ? 'level' : 'levels'}
              </Badge>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <OperandView op={step.target} item={item} />
              <PlusIcon className="size-3.5 text-muted-foreground" />
              <OperandView op={step.sacrifice} item={item} />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 flex-1 bg-muted">
                <div
                  className={cn('h-full', step.levels > 30 ? 'bg-destructive/80' : 'bg-xp/80')}
                  style={{ width: `${(step.levels / MAX_STEP_LEVELS) * 100}%` }}
                />
              </div>
              <span className="flex items-center gap-1 text-[0.65rem] text-muted-foreground tabular-nums">
                <ArrowRightIcon className="size-3" /> penalty {step.penaltyAfter}
              </span>
            </div>
          </li>
        ))}
      </ol>
      <p className="text-[0.65rem] leading-relaxed text-muted-foreground">
        Left slot first, right slot second. The bar shows each step against the {MAX_STEP_LEVELS}-level survival cap.
      </p>
    </div>
  )
}
