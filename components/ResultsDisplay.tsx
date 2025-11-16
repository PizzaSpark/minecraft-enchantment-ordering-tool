'use client';

import { CalculationResult } from '@/lib/enchantment-calculator';
import { ENCHANTMENT_DISPLAY_NAMES, ITEM_DISPLAY_NAMES } from '@/lib/enchantment-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface ResultsDisplayProps {
  result: CalculationResult | null;
  mode: 'levels' | 'prior_work';
  selectedItem: string;
  selectedEnchantments: Map<string, number>;
}

export default function ResultsDisplay({ result, mode, selectedItem, selectedEnchantments }: ResultsDisplayProps) {
  if (!result) return null;

  function formatTime(ms: number): string {
    if (ms < 1) {
      return `${Math.round(ms * 1000)} microseconds`;
    } else if (ms < 1000) {
      return `${Math.round(ms)} milliseconds`;
    } else {
      return `${Math.round(ms / 1000)} seconds`;
    }
  }

  function formatXp(xp: number, minXp?: number): string {
    if (minXp !== undefined && minXp !== xp) {
      return `${minXp.toLocaleString()}-${xp.toLocaleString()} xp`;
    }
    return `${xp.toLocaleString()} xp`;
  }

  function getItemDisplay(item: any): { name: string; enchants: string[]; isItem: boolean } {
    let itemName = '';
    const enchants: string[] = [];
    let isItem = false;

    // Helper to find the root item type by traversing the tree
    const findRootItemType = (obj: any): string | null => {
      if (!obj) return null;
      
      // If this node has an I property that's not an enchantment, it's an item
      if (obj.I && typeof obj.I === 'string' && obj.I !== 'item' && !ENCHANTMENT_DISPLAY_NAMES[obj.I]) {
        return obj.I;
      }
      if (obj.I === 'item') {
        return 'item';
      }
      
      // Check left and right children
      const leftItem = obj.L ? findRootItemType(obj.L) : null;
      if (leftItem) return leftItem;
      
      const rightItem = obj.R ? findRootItemType(obj.R) : null;
      if (rightItem) return rightItem;
      
      return null;
    };

    const rootItemType = findRootItemType(item);
    
    if (rootItemType) {
      if (rootItemType === 'item') {
        itemName = ITEM_DISPLAY_NAMES[selectedItem] || selectedItem;
      } else {
        itemName = ITEM_DISPLAY_NAMES[rootItemType] || rootItemType;
      }
      isItem = true;
    } else {
      itemName = 'Book';
      isItem = false;
    }

    // Find enchantment names recursively
    const findEnchantNames = (obj: any): string[] => {
      const found: string[] = [];
      if (obj.I && typeof obj.I === 'string' && ENCHANTMENT_DISPLAY_NAMES[obj.I]) {
        found.push(obj.I);
      }
      if (obj.L) found.push(...findEnchantNames(obj.L));
      if (obj.R) found.push(...findEnchantNames(obj.R));
      return found;
    };

    const foundEnchantNames = findEnchantNames(item);
    
    // Map enchant names to display names with levels
    foundEnchantNames.forEach(enchantKey => {
      const displayName = ENCHANTMENT_DISPLAY_NAMES[enchantKey];
      const level = selectedEnchantments.get(enchantKey);
      
      if (displayName && level) {
        enchants.push(level > 1 ? `${displayName} ${level}` : displayName);
      }
    });

    return { name: itemName, enchants: Array.from(new Set(enchants)), isItem };
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">✨</span>
              {mode === 'levels' ? 'Optimal Solution (Least XP)' : 'Optimal Solution (Least Prior Work)'}
            </CardTitle>
            <CardDescription className="mt-1 flex items-center gap-1.5">
              <span>{result.totalLevels} levels ({formatXp(result.totalXp, result.minXp)})</span>
              {result.minXp !== result.totalXp && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        The two XP values shown are the difference between saving up for all levels/XP at once versus earning levels/XP between each enchantment step.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {result.instructions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">📋</span>
              <h3 className="text-lg font-semibold">Steps</h3>
            </div>
            
            <div className="space-y-3">
              {result.instructions.map((instruction, index) => {
                const leftItem = getItemDisplay(instruction.left);
                const rightItem = getItemDisplay(instruction.right);

                return (
                  <Card key={index} className="hover:border-primary/40 transition-colors">
                    <CardContent className="pt-1 pb-1">
                      <div className="flex gap-4">
                        <div className="shrink-0">
                          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Combine </span>
                            <span className="font-semibold">
                              {leftItem.name}
                              {leftItem.enchants.length > 0 && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({leftItem.enchants.join(', ')})
                                </span>
                              )}
                            </span>
                            <span className="text-muted-foreground"> with </span>
                            <span className="font-semibold">
                              {rightItem.name}
                              {rightItem.enchants.length > 0 && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({rightItem.enchants.join(', ')})
                                </span>
                              )}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">
                              Cost: {instruction.levels} levels ({instruction.xp.toLocaleString()} xp)
                            </Badge>
                            <Badge variant="outline">
                              Prior Work: {instruction.priorWork} levels
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
