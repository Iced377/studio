import type { AnalyzeFoodItemOutput } from "@/ai/flows/fodmap-detection";
import type { FoodFODMAPProfile } from "@/ai/flows/food-similarity";

export type FodmapScore = 'Green' | 'Yellow' | 'Red';

export interface LoggedFoodItem {
  id: string; // Unique ID for the logged item
  name: string;
  ingredients: string; // Comma-separated
  mealType: MealType;
  timestamp: Date;
  fodmapData?: AnalyzeFoodItemOutput; // Result from fodmap-detection AI
  isSimilarToSafe?: boolean; // Result from food-similarity AI
  userFodmapProfile?: FoodFODMAPProfile; // Mocked or user-inputted detailed profile
}

export interface SafeFood {
  id: string; // Food name or unique identifier
  name: string;
  ingredients: string;
  // This is the detailed FODMAP profile required by isSimilarToSafeFoods
  // It will be mocked for now.
  fodmapProfile: FoodFODMAPProfile; 
  // Store original AI analysis if available
  originalAnalysis?: AnalyzeFoodItemOutput; 
}

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

export const MEAL_TYPES: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  safeFoods: SafeFood[];
}
