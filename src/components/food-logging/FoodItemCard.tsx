'use client';

import type { LoggedFoodItem, SafeFood } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FodmapIndicator from '@/components/shared/FodmapIndicator';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, Trash2, CheckCheck } from 'lucide-react';
import { analyzeFoodItem, type AnalyzeFoodItemOutput } from '@/ai/flows/fodmap-detection';
import type { FoodFODMAPProfile } from '@/ai/flows/food-similarity';


// Helper function to generate a mock FODMAP profile
// This is used because analyzeFoodItem doesn't return the detailed numeric profile
// needed by isSimilarToSafeFoods. In a real app, this data would ideally come from
// a comprehensive food database or a more detailed AI analysis.
const generateMockFodmapProfile = (foodName: string): FoodFODMAPProfile => {
  // Simple hash function to get somewhat consistent random numbers based on food name
  let hash = 0;
  for (let i = 0; i < foodName.length; i++) {
    const char = foodName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  const pseudoRandom = (seed: number) => {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  return {
    fructans: pseudoRandom(hash + 1) * 5,
    galactans: pseudoRandom(hash + 2) * 5,
    polyols: pseudoRandom(hash + 3) * 5,
    lactose: pseudoRandom(hash + 4) * 5,
    mannitol: pseudoRandom(hash + 5) * 5,
    fructose: pseudoRandom(hash + 6) * 5,
  };
};


interface FoodItemCardProps {
  item: LoggedFoodItem;
  onMarkAsSafe: (foodItem: LoggedFoodItem, fodmapProfile: FoodFODMAPProfile, analysisOutput: AnalyzeFoodItemOutput) => void;
  onRemoveItem: (itemId: string, mealType: LoggedFoodItem['mealType']) => void;
  isSafeFood: boolean;
}

export default function FoodItemCard({ item, onMarkAsSafe, onRemoveItem, isSafeFood }: FoodItemCardProps) {
  
  const handleMarkAsSafe = () => {
    if (item.fodmapData) { // Ensure fodmapData is available
      const mockProfile = item.userFodmapProfile || generateMockFodmapProfile(item.name);
      onMarkAsSafe(item, mockProfile, item.fodmapData);
    } else {
      // Handle case where FODMAP data might not be loaded yet (e.g. show a message)
      console.warn("FODMAP data not available to mark as safe for item:", item.name);
    }
  };

  return (
    <Card className="mb-4 shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold font-headline">{item.name}</CardTitle>
          {item.fodmapData && <FodmapIndicator score={item.fodmapData.overallRisk} reason={item.fodmapData.reason} />}
        </div>
        <p className="text-xs text-muted-foreground break-all">Ingredients: {item.ingredients || 'Not specified'}</p>
      </CardHeader>
      <CardContent className="px-4 pb-2 pt-1">
        {item.isSimilarToSafe && (
          <Badge variant="secondary" className="mb-2 text-sm bg-accent/30 text-accent-foreground">
            <CheckCheck className="mr-1 h-4 w-4" /> Similar to your Safe Foods
          </Badge>
        )}
         {item.fodmapData && Object.entries(item.fodmapData.ingredientFodmapScores).length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium text-muted-foreground mb-1">Ingredient Analysis:</p>
            <ul className="list-disc list-inside pl-1 space-y-0.5">
              {Object.entries(item.fodmapData.ingredientFodmapScores).map(([ingredient, score]) => (
                <li key={ingredient} className={`text-xs ${
                  score === 'Green' ? 'text-green-600' : score === 'Yellow' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {ingredient}: <span className="font-medium">{score}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center px-4 pb-4 pt-2">
        <Button 
          variant={isSafeFood ? "default" : "outline"} 
          size="sm" 
          onClick={handleMarkAsSafe}
          disabled={isSafeFood || !item.fodmapData} // Disable if already safe or no FODMAP data
          className={isSafeFood ? "bg-primary/80 hover:bg-primary text-primary-foreground cursor-not-allowed" : ""}
        >
          {isSafeFood ? <CheckCheck className="mr-2 h-4 w-4" /> : <ThumbsUp className="mr-2 h-4 w-4" />}
          {isSafeFood ? 'Marked Safe' : 'Mark as Safe'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onRemoveItem(item.id, item.mealType)} className="text-destructive hover:bg-destructive/10">
          <Trash2 className="mr-2 h-4 w-4" /> Remove
        </Button>
      </CardFooter>
    </Card>
  );
}

// Re-export generateMockFodmapProfile if it needs to be used outside this component,
// for example, when initially populating safe foods list or new items.
export { generateMockFodmapProfile };
