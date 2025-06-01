'use client';

import type { LoggedFoodItem, MealType, SafeFood } from '@/types';
import FoodItemCard, { generateMockFodmapProfile } from './FoodItemCard';
import AddFoodItemDialog from './AddFoodItemDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FoodFODMAPProfile } from '@/ai/flows/food-similarity';
import type { AnalyzeFoodItemOutput } from '@/ai/flows/fodmap-detection';


interface MealSectionProps {
  mealType: MealType;
  foodItems: LoggedFoodItem[];
  safeFoods: SafeFood[];
  onAddFoodItem: (foodItemData: Omit<LoggedFoodItem, 'id' | 'timestamp' | 'mealType'>, mealType: MealType) => Promise<void>;
  onMarkAsSafe: (foodItem: LoggedFoodItem, fodmapProfile: FoodFODMAPProfile, analysisOutput: AnalyzeFoodItemOutput) => void;
  onRemoveItem: (itemId: string, mealType: MealType) => void;
}

export default function MealSection({ 
  mealType, 
  foodItems, 
  safeFoods,
  onAddFoodItem, 
  onMarkAsSafe, 
  onRemoveItem 
}: MealSectionProps) {
  const isFoodItemSafe = (itemId: string) => {
    // Check if the food item's name and ingredients match any safe food.
    // This is a simplified check. A more robust check might use IDs if available.
    const food = foodItems.find(fi => fi.id === itemId);
    if (!food) return false;
    return safeFoods.some(sf => sf.name === food.name && sf.ingredients === food.ingredients);
  };
  
  return (
    <Card className="flex flex-col h-full shadow-lg">
      <CardHeader className="border-b">
        <CardTitle className="font-headline text-2xl text-primary">{mealType}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-grow overflow-hidden">
        <ScrollArea className="h-[calc(100%-4rem)] pr-3"> {/* Adjust height as needed */}
          {foodItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No food items logged for {mealType.toLowerCase()} yet.</p>
          ) : (
            foodItems.map(item => (
              <FoodItemCard 
                key={item.id} 
                item={item} 
                onMarkAsSafe={onMarkAsSafe}
                onRemoveItem={onRemoveItem}
                isSafeFood={isFoodItemSafe(item.id)}
              />
            ))
          )}
        </ScrollArea>
      </CardContent>
      <div className="p-4 border-t">
        <AddFoodItemDialog mealType={mealType} onAddFoodItem={(data) => onAddFoodItem(data, mealType)} />
      </div>
    </Card>
  );
}
