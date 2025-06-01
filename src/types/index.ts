
import type { AnalyzeFoodItemOutput, FoodFODMAPProfile as DetailedFodmapProfileFromAI } from "@/ai/flows/fodmap-detection"; // Renamed for clarity
import type { FoodFODMAPProfile } from "@/ai/flows/food-similarity"; // This is the one used for generating mock, might be similar or identical to DetailedFodmapProfileFromAI

export type FodmapScore = 'Green' | 'Yellow' | 'Red';

export interface LoggedFoodItem {
  id: string; // Unique ID for the logged item
  name: string;
  ingredients: string; // Comma-separated
  portionSize: string; // e.g., "100", "0.5", "1"
  portionUnit: string; // e.g., "g", "cup", "medium apple"
  timestamp: Date;
  fodmapData?: AnalyzeFoodItemOutput; // Result from fodmap-detection AI
  isSimilarToSafe?: boolean; // Result from food-similarity AI
  userFodmapProfile?: FoodFODMAPProfile; // Detailed profile, ideally from AI or user input
  calories?: number; // Estimated calories
  protein?: number; // Estimated protein in grams
  carbs?: number; // Estimated carbs in grams
  fat?: number; // Estimated fat in grams
  entryType: 'food';
}

export interface Symptom {
  id: string; // e.g., 'bloating', 'gas', 'cramps'
  name: string; // User-friendly name
  icon?: string; // Optional: for UI representation
}

export const COMMON_SYMPTOMS: Symptom[] = [
  { id: 'bloating', name: 'Bloating' },
  { id: 'gas', name: 'Gas' },
  { id: 'cramps', name: 'Cramps' },
  { id: 'diarrhea', name: 'Diarrhea' },
  { id: 'constipation', name: 'Constipation' },
  { id: 'nausea', name: 'Nausea' },
  { id: 'reflux', name: 'Reflux' },
  { id: 'other', name: 'Other' },
];

export interface SymptomLog {
  id: string; // Unique ID for the symptom log entry
  linkedFoodItemIds?: string[]; // Optional: IDs of food items this symptom log might be related to
  symptoms: Symptom[]; // Array of symptoms experienced
  severity?: number; // Optional: e.g., 1-5 scale
  notes?: string; // User notes about the symptoms
  timestamp: Date;
  entryType: 'symptom';
}

export type TimelineEntry = LoggedFoodItem | SymptomLog;


export interface SafeFood {
  id: string; // Unique identifier for the safe food entry
  name: string;
  ingredients: string;
  portionSize: string;
  portionUnit: string;
  // This is the detailed FODMAP profile required by isSimilarToSafeFoods
  fodmapProfile: FoodFODMAPProfile;
  // Store original AI analysis if available
  originalAnalysis?: AnalyzeFoodItemOutput;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  safeFoods: SafeFood[];
  premium?: boolean; // Added for premium status
}

// Re-export for convenience if used elsewhere, though fodmap-detection now provides it.
export type { DetailedFodmapProfileFromAI };

export interface DailyNutritionSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
