import { useState } from 'react'
import { BookmarkSimpleIcon, FloppyDiskIcon, XIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Selection } from '@/components/enchantment-list'
import { ItemIcon } from '@/components/item-icon'
import { ENCHANTMENT_BY_ID, ITEM_BY_ID, ITEMS, roman, type Item } from '@/data'
import type { Template } from '@/lib/saved'

interface Props {
  item: Item
  selection: Selection
  /** Last selection per item; the items a set can include. */
  remembered: Record<string, Selection>
  templates: Template[]
  onSave: (name: string, items: Record<string, Selection>) => void
  onApply: (template: Template, itemId?: string) => void
  onDelete: (id: string) => void
}

const describe = (selection: Selection) =>
  Object.entries(selection)
    .map(([id, lvl]) => {
      const e = ENCHANTMENT_BY_ID.get(id)!
      return e.maxLevel > 1 ? `${e.name} ${roman(lvl)}` : e.name
    })
    .join(', ') || 'No enchantments'

export function Templates({ item, selection, remembered, templates, onSave, onApply, onDelete }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [scope, setScope] = useState<'item' | 'set'>('item')
  const [picked, setPicked] = useState<string[]>([])

  // Items with something selected, in picker order, current item included.
  const configured = ITEMS.filter((i) =>
    Object.keys(i.id === item.id ? selection : (remembered[i.id] ?? {})).length > 0,
  )
  const forItem = templates.filter((t) => t.items[item.id])
  const count = Object.keys(selection).length
  const setItems = picked.filter((id) => configured.some((i) => i.id === id))
  const canSave = scope === 'item' ? count > 0 : setItems.length > 0

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) return
    setName('')
    // A set defaults to the items you've set up in the same group, e.g. all four armor pieces.
    setPicked(configured.filter((i) => i.section === item.section && i.id !== 'book').map((i) => i.id))
  }

  const save = () => {
    const items =
      scope === 'item'
        ? { [item.id]: selection }
        : Object.fromEntries(setItems.map((id) => [id, id === item.id ? selection : remembered[id]]))
    onSave(name.trim() || (scope === 'item' ? `My ${item.name}` : 'My set'), items)
    setName('')
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          <BookmarkSimpleIcon /> Templates
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle>Templates</PopoverTitle>
          <PopoverDescription>Saved in this browser. Sets cover several items at once.</PopoverDescription>
        </PopoverHeader>

        {forItem.length === 0 ? (
          <p className="py-1 text-muted-foreground">Nothing saved for {item.name} yet.</p>
        ) : (
          <ul className="flex max-h-64 flex-col divide-y overflow-y-auto">
            {forItem.map((t) => {
              const ids = Object.keys(t.items)
              return (
                <li key={t.id} className="flex items-start gap-2 py-1.5">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 flex-col gap-0.5 text-left outline-none hover:text-enchant focus-visible:underline"
                    onClick={() => {
                      onApply(t)
                      setOpen(false)
                    }}
                  >
                    <span className="truncate font-medium">{t.name}</span>
                    <span className="line-clamp-2 text-[0.65rem] text-muted-foreground">{describe(t.items[item.id])}</span>
                  </button>
                  {ids.length > 1 && (
                    <span className="flex shrink-0 items-center">
                      {ids.map((id) => (
                        <Tooltip key={id}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label={`Load set and open ${ITEM_BY_ID.get(id)!.name}`}
                              className={id === item.id ? 'text-enchant' : 'text-muted-foreground'}
                              onClick={() => {
                                onApply(t, id)
                                setOpen(false)
                              }}
                            >
                              <ItemIcon id={id} weight="duotone" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {ITEM_BY_ID.get(id)!.name}: {describe(t.items[id])}
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Delete ${t.name}`}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(t.id)}
                  >
                    <XIcon />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}

        <Separator />

        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (canSave) save()
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">Save current</span>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              spacing={0}
              value={scope}
              onValueChange={(v) => v && setScope(v as 'item' | 'set')}
              aria-label="Save as"
            >
              <ToggleGroupItem value="item" className="px-2 text-[0.7rem]">
                {item.name}
              </ToggleGroupItem>
              <ToggleGroupItem value="set" className="px-2 text-[0.7rem]">
                Set
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {scope === 'set' &&
            (configured.length === 0 ? (
              <p className="text-muted-foreground">Pick enchantments on a few items first; each item remembers its last picks.</p>
            ) : (
              <ul className="flex max-h-40 flex-col gap-1.5 overflow-y-auto">
                {configured.map((i) => (
                  <li key={i.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`set-${i.id}`}
                      checked={picked.includes(i.id)}
                      onCheckedChange={(c) =>
                        setPicked((p) => (c ? [...p, i.id] : p.filter((id) => id !== i.id)))
                      }
                    />
                    <Label htmlFor={`set-${i.id}`} className="flex min-w-0 items-center gap-1.5 text-xs font-normal">
                      <ItemIcon id={i.id} className="size-3.5 shrink-0" weight="duotone" />
                      <span className="shrink-0">{i.name}</span>
                      <span className="truncate text-muted-foreground">
                        {describe(i.id === item.id ? selection : remembered[i.id])}
                      </span>
                    </Label>
                  </li>
                ))}
              </ul>
            ))}

          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={scope === 'item' ? `My ${item.name}` : 'My set'}
              aria-label="Template name"
              maxLength={40}
            />
            <Button type="submit" size="default" disabled={!canSave}>
              <FloppyDiskIcon /> Save
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}
