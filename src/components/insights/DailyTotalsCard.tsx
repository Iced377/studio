
'use client';

import type { DailyNutritionSummary } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Beef, Wheat, Droplet, TrendingUp } from 'lucide-react';

interface DailyTotalsCardProps {
  summary: DailyNutritionSummary;
}

export default function DailyTotalsCard({ summary }: DailyTotalsCardProps) {
  const { calories, protein, carbs, fat } = summary;

  // Helper to round numbers for display
  const round = (num: number) => Math.round(num);

  return (
    <Card className="bg-card border-border shadow-md">
      <CardHeader className="pb-3 pt-4">
        <CardTitle className="font-headline text-xl sm:text-2xl flex items-center text-foreground">
          <TrendingUp className="mr-3 h-6 w-6 sm:h-7 sm:w-7 text-gray-400" />
          Today&apos;s Nutrition
        </CardTitle>
      </CardHeader>
      <CardContent>
        {calories === 0 && protein === 0 && carbs === 0 && fat === 0 ? (
          <p className="text-muted-foreground text-center py-4">Log food items to see your daily totals here.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="flex flex-col items-center p-3 bg-card rounded-lg shadow-inner">
              <Flame className="h-7 w-7 text-orange-400 mb-1" />
              <p className="text-2xl font-bold text-foreground">{round(calories)}</p>
              <p className="text-xs text-muted-foreground">KCAL</p>
            </div>
            <div className="flex flex-col items-center p-3 bg-card rounded-lg shadow-inner">
              <Beef className="h-7 w-7 text-red-400 mb-1" />
              <p className="text-2xl font-bold text-foreground">{round(protein)}g</p>
              <p className="text-xs text-muted-foreground">PROTEIN</p>
            </div>
            <div className="flex flex-col items-center p-3 bg-card rounded-lg shadow-inner">
              <Wheat className="h-7 w-7 text-yellow-400 mb-1" />
              <p className="text-2xl font-bold text-foreground">{round(carbs)}g</p>
              <p className="text-xs text-muted-foreground">CARBS</p>
            </div>
            <div className="flex flex-col items-center p-3 bg-card rounded-lg shadow-inner">
              <Droplet className="h-7 w-7 text-blue-400 mb-1" />
              <p className="text-2xl font-bold text-foreground">{round(fat)}g</p>
              <p className="text-xs text-muted-foreground">FAT</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
