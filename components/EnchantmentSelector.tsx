'use client';

import { ENCHANTMENTS, ENCHANTMENT_DISPLAY_NAMES } from '@/lib/enchantment-data';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EnchantmentSelectorProps {
  selectedItem: string;
  selectedEnchantments: Map<string, number>;
  onEnchantmentToggle: (enchant: string, level: number) => void;
  allowIncompatible: boolean;
}

export default function EnchantmentSelector({
  selectedItem,
  selectedEnchantments,
  onEnchantmentToggle,
  allowIncompatible
}: EnchantmentSelectorProps) {
  if (!selectedItem) return null;

  // Filter enchantments for selected item
  const availableEnchantments = Object.keys(ENCHANTMENTS).filter(enchant => {
    const enchantData = ENCHANTMENTS[enchant];
    return selectedItem === 'book' || enchantData.items.includes(selectedItem);
  });

  // Group enchantments by incompatibility
  const incompatibleGroups: string[][] = [];
  const grouped = new Set<string>();

  availableEnchantments.forEach(enchant => {
    if (grouped.has(enchant)) return;

    const group = getIncompatibleGroup(enchant, availableEnchantments);
    group.forEach(e => grouped.add(e));
    incompatibleGroups.push(group);
  });

  function getIncompatibleGroup(enchant: string, available: string[]): string[] {
    const queue = [enchant];
    const group: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (group.includes(current)) continue;

      group.push(current);
      const incompatible = ENCHANTMENTS[current].incompatible;

      incompatible.forEach(inc => {
        if (available.includes(inc) && !group.includes(inc) && !queue.includes(inc)) {
          queue.push(inc);
        }
      });
    }

    return group.sort();
  }

  function isEnchantmentDisabled(enchant: string): boolean {
    if (allowIncompatible) return false;

    for (const [selectedEnchant] of selectedEnchantments) {
      const incompatible = ENCHANTMENTS[selectedEnchant].incompatible;
      if (incompatible.includes(enchant)) {
        return true;
      }
    }
    return false;
  }

  return (
    <div className="space-y-0.5">
      {incompatibleGroups.map((group, groupIndex) => (
        <div key={groupIndex} className={cn(
          "rounded-sm",
          groupIndex % 2 === 0 ? 'bg-muted/50' : 'bg-muted/30'
        )}>
          {group.map(enchant => {
            const maxLevel = parseInt(ENCHANTMENTS[enchant].levelMax);
            const currentLevel = selectedEnchantments.get(enchant) || 0;
            const disabled = isEnchantmentDisabled(enchant);

            return (
              <div key={enchant} className="flex items-center gap-2 p-2.5 border-b border-border/50 last:border-0">
                <div className="flex-1 text-sm font-medium">
                  {ENCHANTMENT_DISPLAY_NAMES[enchant]}
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: maxLevel }, (_, i) => i + 1).map(level => (
                    <Button
                      key={level}
                      size="sm"
                      variant={currentLevel === level ? "default" : "outline"}
                      onClick={() => !disabled && onEnchantmentToggle(enchant, level)}
                      disabled={disabled}
                      className={cn(
                        "h-8 w-8 p-0 text-xs",
                        currentLevel === level && "shadow-lg"
                      )}
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
