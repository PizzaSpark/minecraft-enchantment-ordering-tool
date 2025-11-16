'use client';

import { useState } from 'react';
import { ITEMS, ITEM_DISPLAY_NAMES, ENCHANTMENTS } from '@/lib/enchantment-data';
import { calculateOptimalEnchantmentOrder, CalculationResult } from '@/lib/enchantment-calculator';
import EnchantmentSelector from '@/components/EnchantmentSelector';
import ResultsDisplay from '@/components/ResultsDisplay';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Home() {
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [selectedEnchantments, setSelectedEnchantments] = useState<Map<string, number>>(new Map());
  const [allowIncompatible, setAllowIncompatible] = useState(false);
  const [allowMany, setAllowMany] = useState(false);
  const [optimizeMode, setOptimizeMode] = useState<'levels' | 'prior_work'>('levels');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleItemChange = (item: string) => {
    setSelectedItem(item);
    setSelectedEnchantments(new Map());
    setResult(null);
  };

  const handleAllowIncompatibleChange = (checked: boolean) => {
    setAllowIncompatible(checked);
    
    // If disabling incompatible enchantments, remove any conflicting ones
    if (!checked) {
      const newEnchantments = new Map(selectedEnchantments);
      const enchantsToRemove: string[] = [];
      
      // Check each selected enchantment for conflicts
      for (const [enchant1] of newEnchantments) {
        for (const [enchant2] of newEnchantments) {
          if (enchant1 !== enchant2) {
            const incompatible = ENCHANTMENTS[enchant1]?.incompatible || [];
            if (incompatible.includes(enchant2)) {
              // Mark the second one for removal (arbitrary choice)
              if (!enchantsToRemove.includes(enchant2)) {
                enchantsToRemove.push(enchant2);
              }
            }
          }
        }
      }
      
      // Remove conflicting enchantments
      enchantsToRemove.forEach(enchant => {
        newEnchantments.delete(enchant);
      });
      
      setSelectedEnchantments(newEnchantments);
      setResult(null);
    }
  };

  const handleEnchantmentToggle = (enchant: string, level: number) => {
    const newEnchantments = new Map(selectedEnchantments);
    
    if (newEnchantments.get(enchant) === level) {
      newEnchantments.delete(enchant);
    } else {
      if (!allowMany && newEnchantments.size >= 10 && !newEnchantments.has(enchant)) {
        alert('You can only select up to 10 enchantments. Enable "Allow more than 10 enchantments" to select more.');
        return;
      }
      newEnchantments.set(enchant, level);
    }
    
    setSelectedEnchantments(newEnchantments);
    setResult(null);
  };

  const handleCalculate = () => {
    if (selectedEnchantments.size === 0) return;

    setIsCalculating(true);
    
    setTimeout(() => {
      try {
        const enchantsArray: [string, number][] = Array.from(selectedEnchantments.entries());
        const calculationResult = calculateOptimalEnchantmentOrder(
          selectedItem,
          enchantsArray,
          optimizeMode
        );
        setResult(calculationResult);
      } catch (error) {
        console.error('Calculation error:', error);
        alert('An error occurred during calculation. Please try again.');
      } finally {
        setIsCalculating(false);
      }
    }, 10);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 text-center space-y-2 relative">
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
          <h1 className="text-5xl font-bold tracking-tight">
            Minecraft Enchantment Ordering Tool
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Find the optimal order for combining enchantments in Minecraft to minimize XP cost and avoid "Too Expensive!" errors
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Label htmlFor="item-select">Choose an item to enchant</Label>
              </CardHeader>
              <CardContent>
                <Select value={selectedItem} onValueChange={handleItemChange}>
                  <SelectTrigger id="item-select">
                    <SelectValue placeholder="Select an item..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEMS.map(item => (
                      <SelectItem key={item} value={item}>
                        {ITEM_DISPLAY_NAMES[item]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedItem && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Enchantments</CardTitle>
                  <CardDescription>
                    Click the level buttons to add or remove enchantments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <EnchantmentSelector
                      selectedItem={selectedItem}
                      selectedEnchantments={selectedEnchantments}
                      onEnchantmentToggle={handleEnchantmentToggle}
                      allowIncompatible={allowIncompatible}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedItem && (
              <Card>
                <CardHeader>
                  <CardTitle>Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="allow-incompatible"
                        checked={allowIncompatible}
                        onCheckedChange={handleAllowIncompatibleChange}
                      />
                      <Label htmlFor="allow-incompatible" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Allow incompatible enchantments
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="allow-many"
                        checked={allowMany}
                        onCheckedChange={(checked) => setAllowMany(checked as boolean)}
                      />
                      <Label htmlFor="allow-many" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Allow more than 10 enchantments
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Optimize for:</Label>
                    <RadioGroup value={optimizeMode} onValueChange={(value) => setOptimizeMode(value as 'levels' | 'prior_work')}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="levels" id="optimize-levels" />
                        <Label htmlFor="optimize-levels" className="font-normal">
                          Least XP/Levels
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="prior_work" id="optimize-prior-work" />
                        <Label htmlFor="optimize-prior-work" className="font-normal">
                          Least Prior Work Penalty
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button
                    onClick={handleCalculate}
                    disabled={selectedEnchantments.size === 0 || isCalculating}
                    className="w-full"
                    size="lg"
                  >
                    {isCalculating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      'Calculate Optimal Order →'
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:sticky lg:top-8 lg:self-start">
            {result ? (
              <ResultsDisplay result={result} mode={optimizeMode} />
            ) : (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="text-6xl mb-4">📖</div>
                  <h3 className="text-xl font-semibold mb-2">
                    No Results Yet
                  </h3>
                  <p className="text-muted-foreground">
                    Select an item and enchantments, then click "Calculate Optimal Order" to see the results
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <footer className="mt-16 pt-8 border-t text-center text-muted-foreground text-sm">
          <p>
            Inspired by{' '}
            <a
              href="https://github.com/iamcal/enchant-order"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline"
            >
              iamcal/enchant-order
            </a>
            {' • '}
            Built with Next.js, shadcn/ui, and Tailwind CSS
          </p>
        </footer>
      </div>
    </div>
  );
}
