'use client';

import { useState, useEffect } from 'react';
import MealSection from '@/components/food-logging/MealSection';
import type { LoggedFoodItem, MealType, SafeFood, UserProfile } from '@/types';
import { MEAL_TYPES } from '@/types';
import { Loader2, Utensils } from 'lucide-react';
import { analyzeFoodItem, type AnalyzeFoodItemOutput } from '@/ai/flows/fodmap-detection';
import { isSimilarToSafeFoods, type FoodFODMAPProfile, type FoodSimilarityOutput } from '@/ai/flows/food-similarity';
import { generateMockFodmapProfile } from '@/components/food-logging/FoodItemCard';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import FodmapIndicator from '@/components/shared/FodmapIndicator';


const initialUserProfile: UserProfile = {
  uid: 'local-user', // Using a generic ID as there's no authenticated user
  email: null,
  displayName: null,
  safeFoods: [],
};

export default function FoodLoggingPage() {
  const { toast } = useToast();

  const [userProfile, setUserProfile] = useState<UserProfile>(initialUserProfile);
  const [foodLog, setFoodLog] = useState<Record<MealType, LoggedFoodItem[]>>({
    Breakfast: [],
    Lunch: [],
    Dinner: [],
    Snacks: [],
  });
  const [isLoadingAi, setIsLoadingAi] = useState<Record<string, boolean>>({});

  // Removed useEffect for auth checking and redirection

  const handleAddFoodItem = async (
    foodItemData: Omit<LoggedFoodItem, 'id' | 'timestamp' | 'mealType'>,
    mealType: MealType
  ) => {
    const newItemId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setIsLoadingAi(prev => ({ ...prev, [newItemId]: true }));

    try {
      const fodmapAnalysis: AnalyzeFoodItemOutput = await analyzeFoodItem({
        foodItem: foodItemData.name,
        ingredients: foodItemData.ingredients,
      });

      const newItemMockProfile: FoodFODMAPProfile = generateMockFodmapProfile(foodItemData.name);
      
      let similarityOutput: FoodSimilarityOutput | undefined;
      if (userProfile.safeFoods.length > 0) {
        const safeFoodProfiles = userProfile.safeFoods.map(sf => sf.fodmapProfile);
        similarityOutput = await isSimilarToSafeFoods({
          foodItemFODMAPProfile: newItemMockProfile,
          userSafeFoodsFODMAPProfiles: safeFoodProfiles,
        });
      }
      
      const newFoodItem: LoggedFoodItem = {
        ...foodItemData,
        id: newItemId,
        mealType,
        timestamp: new Date(),
        fodmapData: fodmapAnalysis,
        isSimilarToSafe: similarityOutput?.isSimilar,
        userFodmapProfile: newItemMockProfile,
      };

      setFoodLog(prevLog => ({
        ...prevLog,
        [mealType]: [...prevLog[mealType], newFoodItem],
      }));

    } catch (error) {
      console.error('AI analysis failed:', error);
      toast({ title: 'AI Analysis Error', description: 'Could not analyze food item with AI.', variant: 'destructive' });
       const newFoodItem: LoggedFoodItem = {
        ...foodItemData,
        id: newItemId,
        mealType,
        timestamp: new Date(),
      };
       setFoodLog(prevLog => ({
        ...prevLog,
        [mealType]: [...prevLog[mealType], newFoodItem],
      }));
    } finally {
      setIsLoadingAi(prev => ({ ...prev, [newItemId]: false }));
    }
  };

  const handleMarkAsSafe = (foodItem: LoggedFoodItem, fodmapProfile: FoodFODMAPProfile, analysisOutput: AnalyzeFoodItemOutput) => {
    if (userProfile.safeFoods.some(sf => sf.name === foodItem.name && sf.ingredients === foodItem.ingredients)) {
      toast({ title: 'Already Safe', description: `${foodItem.name} is already in your safe foods list.` });
      return;
    }

    const newSafeFood: SafeFood = {
      id: foodItem.id,
      name: foodItem.name,
      ingredients: foodItem.ingredients,
      fodmapProfile: fodmapProfile,
      originalAnalysis: analysisOutput,
    };
    setUserProfile(prev => ({
      ...prev,
      safeFoods: [...prev.safeFoods, newSafeFood],
    }));
    toast({ title: 'Marked as Safe!', description: `${foodItem.name} added to your safe foods.`, variant: 'default' });
  };

  const handleRemoveItem = (itemId: string, mealType: MealType) => {
    setFoodLog(prevLog => ({
      ...prevLog,
      [mealType]: prevLog[mealType].filter(item => item.id !== itemId),
    }));
  };
  
  const isAnyItemLoadingAi = Object.values(isLoadingAi).some(loading => loading);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Your Daily Food Log
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Track your meals and discover your triggers with FODMAPSafe.
        </p>
      </div>

      {isAnyItemLoadingAi && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground p-3 rounded-lg shadow-lg flex items-center space-x-2 z-50">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>AI is analyzing your food...</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {MEAL_TYPES.map(mealType => (
          <MealSection
            key={mealType}
            mealType={mealType}
            foodItems={foodLog[mealType]}
            safeFoods={userProfile.safeFoods}
            onAddFoodItem={handleAddFoodItem}
            onMarkAsSafe={handleMarkAsSafe}
            onRemoveItem={handleRemoveItem}
          />
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center">
            <Utensils className="mr-3 h-7 w-7 text-primary" />
            Your Safe Foods
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userProfile.safeFoods.length === 0 ? (
            <p className="text-muted-foreground">You haven&apos;t marked any foods as safe yet. Add foods to your log and mark them!</p>
          ) : (
            <ul className="space-y-2">
              {userProfile.safeFoods.map(sf => (
                <li key={sf.id} className="p-3 border rounded-md bg-secondary/30">
                  <p className="font-semibold">{sf.name}</p>
                  <p className="text-xs text-muted-foreground">{sf.ingredients}</p>
                  {sf.originalAnalysis && (
                     <div className="mt-1">
                        <FodmapIndicator score={sf.originalAnalysis.overallRisk} />
                     </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
