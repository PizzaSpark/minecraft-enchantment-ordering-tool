import { ProhibitIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ENCHANTMENT_BY_ID, roman, type Enchantment } from '@/data'

export type Selection = Record<string, number>

interface Props {
  enchantments: Enchantment[]
  selection: Selection
  onSet: (id: string, level: number | null) => void
}

export function EnchantmentList({ enchantments, selection, onSet }: Props) {
  return (
    <ul className="flex flex-col divide-y">
      {enchantments.map((e) => {
        const level = selection[e.id]
        const selected = level !== undefined
        const conflicts = e.incompatible.filter((id) => selection[id] !== undefined)
        const blocked = !selected && conflicts.length > 0
        return (
          <li
            key={e.id}
            className={cn(
              'flex items-center gap-3 py-2 transition-colors',
              selected && 'text-foreground',
              !selected && 'text-muted-foreground',
            )}
          >
            <button
              type="button"
              onClick={() => onSet(e.id, selected ? null : e.maxLevel)}
              className="group flex min-w-0 flex-1 items-center gap-2 text-left outline-none focus-visible:underline"
            >
              <span
                className={cn(
                  'size-2 shrink-0 rotate-45 border transition-colors',
                  selected ? 'border-enchant bg-enchant shadow-[0_0_8px_var(--enchant)]' : 'border-muted-foreground/40',
                )}
              />
              <span className={cn('truncate text-xs', selected && 'text-enchant', e.curse && 'text-destructive')}>
                {e.name}
              </span>
              {blocked && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ProhibitIcon className="size-3.5 shrink-0 text-muted-foreground/70" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Conflicts with {conflicts.map((id) => ENCHANTMENT_BY_ID.get(id)?.name).join(', ')}. Picking it swaps
                    them out.
                  </TooltipContent>
                </Tooltip>
              )}
            </button>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              spacing={0}
              value={selected ? String(level) : ''}
              onValueChange={(v) => onSet(e.id, v ? Number(v) : null)}
              aria-label={`${e.name} level`}
            >
              {Array.from({ length: e.maxLevel }, (_, i) => i + 1).map((lvl) => (
                <ToggleGroupItem
                  key={lvl}
                  value={String(lvl)}
                  aria-label={`${e.name} ${roman(lvl)}`}
                  className="w-8 px-0 text-[0.7rem] data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {roman(lvl)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </li>
        )
      })}
    </ul>
  )
}
