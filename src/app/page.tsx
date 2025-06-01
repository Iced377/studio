'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/hooks/use-auth-context';
import MealSection from '@/components/food-logging/MealSection';
import type { LoggedFoodItem, MealType, SafeFood, UserProfile } from '@/types';
import { MEAL_TYPES } from '@/types';
import { Loader2, ShieldAlert, Utensils } from 'lucide-react';
import { analyzeFoodItem, type AnalyzeFoodItemOutput } from '@/ai/flows/fodmap-detection';
import { isSimilarToSafeFoods, type FoodFODMAPProfile, type FoodSimilarityOutput } from '@/ai/flows/food-similarity';
import { generateMockFodmapProfile } from '@/components/food-logging/FoodItemCard'; // Import the helper
import { useToast } from '@/hooks/use-toast';

// Mock User Profile and Firestore interaction
// In a real app, this would come from Firestore
const initialUserProfile: UserProfile = {
  uid: '',
  email: null,
  displayName: null,
  safeFoods: [],
};

export default function FoodLoggingPage() {
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const { toast } = useToast();

  const [userProfile, setUserProfile] = useState<UserProfile>(initialUserProfile);
  const [foodLog, setFoodLog] = useState<Record<MealType, LoggedFoodItem[]>>({
    Breakfast: [],
    Lunch: [],
    Dinner: [],
    Snacks: [],
  });
  const [isLoadingAi, setIsLoadingAi] = useState<Record<string, boolean>>({}); // Track loading state per item

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (user) {
      // Mock fetching user profile and log data
      setUserProfile(prev => ({ ...prev, uid: user.uid, email: user.email, displayName: user.displayName }));
      // In a real app, fetch foodLog and safeFoods from Firestore here
    }
  }, [user, authLoading, router]);

  const handleAddFoodItem = async (
    foodItemData: Omit<LoggedFoodItem, 'id' | 'timestamp' | 'mealType'>,
    mealType: MealType
  ) => {
    const newItemId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setIsLoadingAi(prev => ({ ...prev, [newItemId]: true }));

    try {
      // 1. Get FODMAP analysis
      const fodmapAnalysis: AnalyzeFoodItemOutput = await analyzeFoodItem({
        foodItem: foodItemData.name,
        ingredients: foodItemData.ingredients,
      });

      // 2. Generate a mock FODMAP profile for the new item (since analyzeFoodItem doesn't provide it)
      const newItemMockProfile: FoodFODMAPProfile = generateMockFodmapProfile(foodItemData.name);
      
      // 3. Check similarity with safe foods (if any)
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
        userFodmapProfile: newItemMockProfile, // Store the mock profile
      };

      setFoodLog(prevLog => ({
        ...prevLog,
        [mealType]: [...prevLog[mealType], newFoodItem],
      }));

    } catch (error) {
      console.error('AI analysis failed:', error);
      toast({ title: 'AI Analysis Error', description: 'Could not analyze food item with AI.', variant: 'destructive' });
      // Add item without AI data or with placeholder
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
    // Prevent duplicates
    if (userProfile.safeFoods.some(sf => sf.name === foodItem.name && sf.ingredients === foodItem.ingredients)) {
      toast({ title: 'Already Safe', description: `${foodItem.name} is already in your safe foods list.` });
      return;
    }

    const newSafeFood: SafeFood = {
      id: foodItem.id, // Use logged item's id or generate a new one for safe food list
      name: foodItem.name,
      ingredients: foodItem.ingredients,
      fodmapProfile: fodmapProfile, // This is the (potentially mocked) detailed profile
      originalAnalysis: analysisOutput, // Store the AI's direct output too
    };
    setUserProfile(prev => ({
      ...prev,
      safeFoods: [...prev.safeFoods, newSafeFood],
    }));
    toast({ title: 'Marked as Safe!', description: `${foodItem.name} added to your safe foods.`, variant: 'default' });
    // In a real app, update Firestore
  };

  const handleRemoveItem = (itemId: string, mealType: MealType) => {
    setFoodLog(prevLog => ({
      ...prevLog,
      [mealType]: prevLog[mealType].filter(item => item.id !== itemId),
    }));
    // In a real app, update Firestore
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // This case should ideally be handled by redirect in useEffect,
    // but as a fallback:
    return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">Please log in to access FODMAPSafe.</p>
      </div>
    );
  }
  
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
