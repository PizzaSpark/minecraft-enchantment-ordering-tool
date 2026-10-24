import { ItemIcon } from '@/components/item-icon'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ITEMS, SECTION_LABELS, type Section } from '@/data'

const SECTIONS = Object.keys(SECTION_LABELS) as Section[]

export function ItemPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {SECTIONS.map((section) => (
        <div key={section} className="flex flex-col gap-1.5">
          <div className="text-[0.65rem] tracking-widest text-muted-foreground uppercase">
            {SECTION_LABELS[section]}
          </div>
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={1}
            value={value}
            onValueChange={(v) => v && onChange(v)}
            className="grid w-full grid-cols-[repeat(auto-fill,minmax(7rem,1fr))]"
          >
            {ITEMS.filter((i) => i.section === section).map((item) => (
              <ToggleGroupItem
                key={item.id}
                value={item.id}
                aria-label={item.name}
                title={item.members.length > 1 ? `Any ${item.name.toLowerCase()} (${item.members.length} variants)` : item.name}
                className="h-8 min-w-0 justify-start gap-2 px-2 data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
              >
                <ItemIcon id={item.id} className="size-4 shrink-0" weight="duotone" />
                <span className="truncate text-[0.7rem]">{item.name}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      ))}
    </div>
  )
}
