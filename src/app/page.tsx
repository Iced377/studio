
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import type { LoggedFoodItem, UserProfile, TimelineEntry, Symptom, SymptomLog, SafeFood, DailyNutritionSummary, DailyFodmapCount } from '@/types';
import { COMMON_SYMPTOMS } from '@/types';
import { Loader2, Utensils, PlusCircle, ListChecks, Brain, Activity, Info, TrendingUp, CircleDotDashed, Zap, Palette, Edit3, Pencil } from 'lucide-react';
import { analyzeFoodItem, type AnalyzeFoodItemOutput, type FoodFODMAPProfile as DetailedFodmapProfileFromAI } from '@/ai/flows/fodmap-detection';
import { isSimilarToSafeFoods, type FoodFODMAPProfile, type FoodSimilarityOutput } from '@/ai/flows/food-similarity';
import { getSymptomCorrelations, type SymptomCorrelationInput, type SymptomCorrelationOutput } from '@/ai/flows/symptom-correlation-flow';
import { processMealDescription, type ProcessMealDescriptionOutput } from '@/ai/flows/process-meal-description-flow';


import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/config/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  Timestamp,
  query,
  orderBy,
  arrayUnion,
  writeBatch,
} from 'firebase/firestore';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import AddFoodItemDialog from '@/components/food-logging/AddFoodItemDialog';
import SimplifiedAddFoodDialog from '@/components/food-logging/SimplifiedAddFoodDialog';
import TimelineFoodCard from '@/components/food-logging/TimelineFoodCard';
import TimelineSymptomCard from '@/components/food-logging/TimelineSymptomCard';
import SymptomLoggingDialog from '@/components/food-logging/SymptomLoggingDialog';
import AddManualMacroEntryDialog, { type ManualMacroFormValues } from '@/components/food-logging/AddManualMacroEntryDialog';
import InsightCard from '@/components/insights/InsightCard';
import DailyTotalsCard from '@/components/insights/DailyTotalsCard';
import BannerAdPlaceholder from '@/components/ads/BannerAdPlaceholder';
import InterstitialAdPlaceholder from '@/components/ads/InterstitialAdPlaceholder';
import PremiumDashboardSheet from '@/components/premium/PremiumDashboardSheet';
import Navbar from '@/components/shared/Navbar';
import GuestHomePage from '@/components/guest/GuestHomePage'; 

const generateFallbackFodmapProfile = (foodName: string): FoodFODMAPProfile => {
  let hash = 0;
  for (let i = 0; i < foodName.length; i++) {
    const char = foodName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const pseudoRandom = (seed: number) => {
    let x = Math.sin(seed) * 10000;
    return parseFloat((x - Math.floor(x)).toFixed(1)) * 2;
  };
  return {
    fructans: pseudoRandom(hash + 1),
    galactans: pseudoRandom(hash + 2),
    polyolsSorbitol: pseudoRandom(hash + 3),
    polyolsMannitol: pseudoRandom(hash + 4),
    lactose: pseudoRandom(hash + 5),
    fructose: pseudoRandom(hash + 6),
  };
};

const initialGuestProfile: UserProfile = {
  uid: 'guest-user',
  email: null,
  displayName: 'Guest User',
  safeFoods: [],
  premium: false,
};

type PendingAction = 'logFood' | 'simplifiedLogFood' | null;

export default function FoodTimelinePage() {
  const { toast } = useToast();
  const { user: authUser, loading: authLoading } = useAuth(); 

  const [userProfile, setUserProfile] = useState<UserProfile>(initialGuestProfile);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState<Record<string, boolean>>({});
  const [isAddFoodDialogOpen, setIsAddFoodDialogOpen] = useState(false);
  const [isSimplifiedAddFoodDialogOpen, setIsSimplifiedAddFoodDialogOpen] = useState(false);
  const [isSymptomLogDialogOpen, setIsSymptomLogDialogOpen] = useState(false);
  const [isAddManualMacroDialogOpen, setIsAddManualMacroDialogOpen] = useState(false);
  const [symptomDialogContext, setSymptomDialogContext] = useState<{ foodItemIds?: string[] }>({});
  const [aiInsights, setAiInsights] = useState<SymptomCorrelationOutput['insights']>([]);
  const [isLoadingInsightsState, setIsLoadingInsightsState] = useState(false); // Renamed to avoid conflict with premium popover prop
  const [showInterstitialAd, setShowInterstitialAd] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [pendingActionAfterInterstitial, setPendingActionAfterInterstitial] = useState<PendingAction>(null);
  const [isPremiumDashboardOpen, setIsPremiumDashboardOpen] = useState(false);
  const [isCentralPopoverOpen, setIsCentralPopoverOpen] = useState(false);

  // Guest specific state
  const [lastGuestFoodItem, setLastGuestFoodItem] = useState<LoggedFoodItem | null>(null);
  const [isGuestLogFoodDialogOpen, setIsGuestLogFoodDialogOpen] = useState(false); 
  const [isGuestSheetOpen, setIsGuestSheetOpen] = useState(false);


  const bannerAdUnitId = process.env.NEXT_PUBLIC_BANNER_AD_UNIT_ID;
  const interstitialAdUnitId = process.env.NEXT_PUBLIC_INTERSTITIAL_AD_UNIT_ID;

 useEffect(() => {
    const setupUser = async () => {
      setIsDataLoading(true);

      if (authLoading) { 
        return;
      }

      if (authUser) {
        const userDocRef = doc(db, 'users', authUser.uid);
        const timelineEntriesColRef = collection(db, 'users', authUser.uid, 'timelineEntries');

        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUserProfile({
              uid: authUser.uid,
              email: authUser.email,
              displayName: authUser.displayName,
              safeFoods: data.safeFoods || [],
              premium: data.premium || false,
            });
          } else {
            const newUserProfile: UserProfile = {
              uid: authUser.uid,
              email: authUser.email,
              displayName: authUser.displayName,
              safeFoods: [],
              premium: false,
            };
            await setDoc(userDocRef, newUserProfile);
            setUserProfile(newUserProfile);
          }

          const q = query(timelineEntriesColRef, orderBy('timestamp', 'desc'));
          const querySnapshot = await getDocs(q);
          const fetchedEntries: TimelineEntry[] = querySnapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              ...data,
              id: docSnap.id,
              timestamp: (data.timestamp as Timestamp).toDate(),
            } as TimelineEntry;
          });
          setTimelineEntries(fetchedEntries);
          
        } catch (error) {
          console.error("Error loading user data from Firestore:", error);
          let errorDescription = "Could not fetch your saved data. Firestore rules or connection might be an issue.";
           if (error instanceof Error) {
            if (error.message.includes("Missing or insufficient permissions") || error.message.includes("permission-denied")) {
              errorDescription = "Could not fetch data due to Firestore security rules. Please check your rules configuration.";
            } else if (error.message.includes("Failed to get document because the client is offline")){
              errorDescription = "You appear to be offline. Could not fetch data.";
            } else if (error.message.includes("Function setDoc() called with invalid data")) {
              errorDescription = "There was an error creating your profile. Please try again.";
            } else if (error.message.includes("FirebaseError: Missing or insufficient permissions.")) {
              errorDescription = "Action failed due to Firestore security rules. Please check your rules configuration.";
            } else if (error.message.includes("Firebase: Error (auth/network-request-failed)")) {
              errorDescription = "Network error during authentication. Please check your internet connection.";
            } else if (error.message.toLowerCase().includes("api key not valid")) {
                errorDescription = "Firebase API Key is not valid. Please check your .env configuration.";
            }
          }
          toast({ title: "Data Load Error", description: errorDescription, variant: "destructive", duration: 9000 });
           setUserProfile(prev => ({
             ...prev, 
             uid: authUser.uid, 
             email: authUser.email,
             displayName: authUser.displayName,
             safeFoods: prev.uid === authUser.uid ? prev.safeFoods : [], 
             premium: prev.uid === authUser.uid ? prev.premium : false, 
           }));
        } finally {
            setIsDataLoading(false);
        }
      } else { 
        setUserProfile(initialGuestProfile);
        setTimelineEntries([]);
        setAiInsights([]);
        setLastGuestFoodItem(null); 
        setIsDataLoading(false);
      }
    };
    setupUser();
  }, [authUser, authLoading, toast]);


  const addTimelineEntry = (entry: TimelineEntry) => {
    setTimelineEntries(prevEntries => [...prevEntries, entry].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  const handleAddFoodItem = async (
    foodItemData: Omit<LoggedFoodItem, 'id' | 'timestamp' | 'entryType' | 'calories' | 'protein' | 'carbs' | 'fat' | 'sourceDescription' | 'originalName' | 'userFeedback'>
  ) => {
    const newItemId = `food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setIsLoadingAi(prev => ({ ...prev, [newItemId]: true }));

    let newFoodItem: LoggedFoodItem;
    let fodmapAnalysis: AnalyzeFoodItemOutput | undefined;
    let similarityOutput: FoodSimilarityOutput | undefined;

    try {
      fodmapAnalysis = await analyzeFoodItem({
        foodItem: foodItemData.name,
        ingredients: foodItemData.ingredients,
        portionSize: foodItemData.portionSize,
        portionUnit: foodItemData.portionUnit,
      });

      const itemFodmapProfileForSimilarity: FoodFODMAPProfile = fodmapAnalysis?.detailedFodmapProfile || generateFallbackFodmapProfile(foodItemData.name);
      let isSimilar = false; 
      if (userProfile.safeFoods && userProfile.safeFoods.length > 0) {
        const safeFoodItemsForSimilarity = userProfile.safeFoods.map(sf => ({
            name: sf.name,
            portionSize: sf.portionSize,
            portionUnit: sf.portionUnit,
            fodmapProfile: sf.fodmapProfile,
        }));

        similarityOutput = await isSimilarToSafeFoods({
          currentFoodItem: {
            name: foodItemData.name,
            portionSize: foodItemData.portionSize,
            portionUnit: foodItemData.portionUnit,
            fodmapProfile: itemFodmapProfileForSimilarity
          },
          userSafeFoodItems: safeFoodItemsForSimilarity,
        });
        isSimilar = similarityOutput?.isSimilar ?? false;
      } else {
        isSimilar = false; 
      }


      newFoodItem = {
        ...foodItemData,
        id: newItemId,
        timestamp: new Date(),
        fodmapData: fodmapAnalysis,
        isSimilarToSafe: isSimilar,
        userFodmapProfile: itemFodmapProfileForSimilarity,
        calories: fodmapAnalysis?.calories,
        protein: fodmapAnalysis?.protein,
        carbs: fodmapAnalysis?.carbs,
        fat: fodmapAnalysis?.fat,
        entryType: 'food',
        userFeedback: null,
      };

      if (authUser && authUser.uid !== 'guest-user') {
        const { id, ...itemToSave } = newFoodItem;
        const docRef = await addDoc(collection(db, 'users', authUser.uid, 'timelineEntries'), {
            ...itemToSave,
            timestamp: Timestamp.fromDate(newFoodItem.timestamp)
        });
        newFoodItem.id = docRef.id;
        toast({ title: "Food Logged & Saved", description: `${newFoodItem.name} added with AI analysis.` });
      } else {
        toast({ title: "Food Logged (Locally)", description: `${newFoodItem.name} added with AI analysis. Login to save.` });
      }
      addTimelineEntry(newFoodItem);

    } catch (error: any) {
      console.error('AI analysis or food logging failed:', error);
      let toastTitle = 'Error Logging Food';
      let toastDescription = 'Food added without full AI analysis.';
      
      if (error?.message && typeof error.message === 'string') {
        const errorMessageLower = error.message.toLowerCase();
        if (errorMessageLower.includes('503') || errorMessageLower.includes('model is overloaded') || errorMessageLower.includes('resource has been exhausted')) {
          toastTitle = 'AI Model Overloaded';
          toastDescription = 'The AI model is temporarily busy. Food added without full AI analysis. Please try again later.';
        } else if (errorMessageLower.includes('400') || errorMessageLower.includes('schema validation') || errorMessageLower.includes('invalid argument')) {
          toastTitle = 'AI Analysis Input/Output Error';
          toastDescription = 'There was an issue with the data for AI analysis. Food added without AI insights.';
        } else if (errorMessageLower.includes('api key') || errorMessageLower.includes('permission denied') || errorMessageLower.includes('authentication failed') || errorMessageLower.includes('credential') || errorMessageLower.includes('forbidden') || errorMessageLower.includes('access denied')) {
            toastTitle = 'AI Service Access Issue';
            toastDescription = 'Could not access AI services (permissions/auth). Food added without AI insights. Check Google Cloud project setup & local auth (gcloud auth application-default login).';
        } else if (errorMessageLower.includes('deadline exceeded') || errorMessageLower.includes('timeout')) {
            toastTitle = 'AI Request Timeout';
            toastDescription = 'The request to the AI service timed out. Food added without AI insights. Please try again.';
        } else {
            toastDescription = `Error: ${error.message.substring(0, 100)}. Food added without AI analysis.`;
        }
      }
      toast({ title: toastTitle, description: toastDescription, variant: 'destructive', duration: 9000 });

      newFoodItem = {
        ...foodItemData,
        id: newItemId,
        timestamp: new Date(),
        isSimilarToSafe: similarityOutput?.isSimilar ?? false, 
        entryType: 'food',
        fodmapData: fodmapAnalysis, 
        userFodmapProfile: fodmapAnalysis?.detailedFodmapProfile || generateFallbackFodmapProfile(foodItemData.name),
        calories: fodmapAnalysis?.calories,
        protein: fodmapAnalysis?.protein,
        carbs: fodmapAnalysis?.carbs,
        fat: fodmapAnalysis?.fat,
        userFeedback: null,
      };
       if (authUser && authUser.uid !== 'guest-user') {
        const { id, ...itemToSave } = newFoodItem;
        try {
            const docRef = await addDoc(collection(db, 'users', authUser.uid, 'timelineEntries'), {
                ...itemToSave,
                timestamp: Timestamp.fromDate(newFoodItem.timestamp)
            });
            newFoodItem.id = docRef.id;
        } catch (saveError: any) {
            console.error("Error saving partially processed food item to Firestore:", saveError);
             let saveErrorDesc = "Could not save food item to cloud after AI failure. Please try again.";
            if (saveError.message && saveError.message.includes("invalid data") && saveError.message.includes("undefined")){
                saveErrorDesc = "Could not save item to cloud: data format issue (undefined field). Item logged locally only."
            }
            toast({ title: "Food Save Error (Partial AI)", description: saveErrorDesc, variant: 'destructive'});
        }
      } else {
         toast({ title: "Food Logged (Locally, Partial AI)", description: `${newFoodItem.name} added. AI analysis failed or incomplete. Login to save.`, variant: 'destructive'});
      }
      addTimelineEntry(newFoodItem);
    } finally {
      setIsLoadingAi(prev => ({ ...prev, [newItemId]: false }));
      setIsAddFoodDialogOpen(false);
    }
  };

  const handleProcessMealDescription = async (description: string) => {
    const newItemId = `food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setIsLoadingAi(prev => ({ ...prev, [newItemId]: true }));
    
    let mealDescriptionOutput: ProcessMealDescriptionOutput | undefined;
    let fodmapAnalysis: AnalyzeFoodItemOutput | undefined;
    let similarityOutput: FoodSimilarityOutput | undefined;
    let newFoodItem: LoggedFoodItem;

    try {
      mealDescriptionOutput = await processMealDescription({ mealDescription: description });

      fodmapAnalysis = await analyzeFoodItem({
        foodItem: mealDescriptionOutput.primaryFoodItemForAnalysis,
        ingredients: mealDescriptionOutput.consolidatedIngredients,
        portionSize: mealDescriptionOutput.estimatedPortionSize,
        portionUnit: mealDescriptionOutput.estimatedPortionUnit,
      });
      
      const itemFodmapProfileForSimilarity: FoodFODMAPProfile = fodmapAnalysis?.detailedFodmapProfile || generateFallbackFodmapProfile(mealDescriptionOutput.primaryFoodItemForAnalysis);
      let isSimilar = false; 
      if (userProfile.safeFoods && userProfile.safeFoods.length > 0) {
         const safeFoodItemsForSimilarity = userProfile.safeFoods.map(sf => ({
            name: sf.name,
            portionSize: sf.portionSize,
            portionUnit: sf.portionUnit,
            fodmapProfile: sf.fodmapProfile,
        }));
        similarityOutput = await isSimilarToSafeFoods({
          currentFoodItem: {
            name: mealDescriptionOutput.primaryFoodItemForAnalysis,
            portionSize: mealDescriptionOutput.estimatedPortionSize,
            portionUnit: mealDescriptionOutput.estimatedPortionUnit,
            fodmapProfile: itemFodmapProfileForSimilarity
          },
          userSafeFoodItems: safeFoodItemsForSimilarity,
        });
        isSimilar = similarityOutput?.isSimilar ?? false;
      } else {
        isSimilar = false;
      }

      newFoodItem = {
        id: newItemId,
        name: mealDescriptionOutput.wittyName, 
        originalName: mealDescriptionOutput.primaryFoodItemForAnalysis, 
        ingredients: mealDescriptionOutput.consolidatedIngredients,
        portionSize: mealDescriptionOutput.estimatedPortionSize,
        portionUnit: mealDescriptionOutput.estimatedPortionUnit,
        sourceDescription: description, 
        timestamp: new Date(),
        fodmapData: fodmapAnalysis,
        isSimilarToSafe: isSimilar,
        userFodmapProfile: itemFodmapProfileForSimilarity,
        calories: fodmapAnalysis?.calories,
        protein: fodmapAnalysis?.protein,
        carbs: fodmapAnalysis?.carbs,
        fat: fodmapAnalysis?.fat,
        entryType: 'food',
        userFeedback: null,
      };

      if (authUser && authUser.uid !== 'guest-user') {
        const { id, ...itemToSave } = newFoodItem;
        const docRef = await addDoc(collection(db, 'users', authUser.uid, 'timelineEntries'), {
            ...itemToSave,
            timestamp: Timestamp.fromDate(newFoodItem.timestamp)
        });
        newFoodItem.id = docRef.id; 
        toast({ title: "Meal Logged!", description: `"${newFoodItem.name}" added with AI insights.` });
      } else {
        toast({ title: "Meal Logged (Locally)", description: `"${newFoodItem.name}" added. Login to save.` });
      }
      addTimelineEntry(newFoodItem);

    } catch (error: any) {
        console.error('Full AI meal processing failed:', error);
        let toastTitle = 'Error Logging Meal';
        let toastDescription = 'Food added without full AI analysis.';
        
        if (error?.message && typeof error.message === 'string') {
          const errorMessageLower = error.message.toLowerCase();
          if (errorMessageLower.includes('503') || errorMessageLower.includes('model is overloaded') || errorMessageLower.includes('resource has been exhausted')) {
            toastTitle = 'AI Model Overloaded';
            toastDescription = 'The AI model is temporarily busy. Food added without full AI analysis. Please try again later.';
          } else if (errorMessageLower.includes('400') || errorMessageLower.includes('schema validation') || errorMessageLower.includes('invalid argument')) {
            toastTitle = 'AI Analysis Input/Output Error';
            toastDescription = 'There was an issue with the data for AI analysis. Food added without AI insights.';
          } else if (errorMessageLower.includes('api key') || errorMessageLower.includes('permission denied') || errorMessageLower.includes('authentication failed') || errorMessageLower.includes('credential') || errorMessageLower.includes('forbidden') || errorMessageLower.includes('access denied')) {
              toastTitle = 'AI Service Access Issue';
              toastDescription = 'Could not access AI services (permissions/auth). Food added without AI insights. Check Google Cloud project setup & local auth (gcloud auth application-default login).';
          } else if (errorMessageLower.includes('deadline exceeded') || errorMessageLower.includes('timeout')) {
              toastTitle = 'AI Request Timeout';
              toastDescription = 'The request to the AI service timed out. Food added without AI insights. Please try again.';
          } else {
              toastDescription = `Error: ${error.message.substring(0,100)}. Food added without AI analysis.`;
          }
        }
        toast({ title: toastTitle, description: toastDescription, variant: 'destructive', duration: 9000 });

        newFoodItem = {
            id: newItemId,
            name: mealDescriptionOutput?.wittyName || "Meal (Analysis Pending)",
            originalName: mealDescriptionOutput?.primaryFoodItemForAnalysis || description.substring(0,30) + "...",
            ingredients: mealDescriptionOutput?.consolidatedIngredients || "See description",
            portionSize: mealDescriptionOutput?.estimatedPortionSize || "N/A",
            portionUnit: mealDescriptionOutput?.estimatedPortionUnit || "",
            sourceDescription: description,
            timestamp: new Date(),
            fodmapData: fodmapAnalysis, 
            isSimilarToSafe: similarityOutput?.isSimilar ?? false, 
            userFodmapProfile: fodmapAnalysis?.detailedFodmapProfile || generateFallbackFodmapProfile(mealDescriptionOutput?.primaryFoodItemForAnalysis || "fallback"),
            calories: fodmapAnalysis?.calories,
            protein: fodmapAnalysis?.protein,
            carbs: fodmapAnalysis?.carbs,
            fat: fodmapAnalysis?.fat,
            entryType: 'food',
            userFeedback: null,
        };

        if (authUser && authUser.uid !== 'guest-user') {
            const { id, ...itemToSave } = newFoodItem;
            try {
                const docRef = await addDoc(collection(db, 'users', authUser.uid, 'timelineEntries'), {
                    ...itemToSave,
                    timestamp: Timestamp.fromDate(newFoodItem.timestamp)
                });
                newFoodItem.id = docRef.id;
            } catch (saveError: any) {
                 console.error("Error saving partially processed meal item to Firestore:", saveError);
                 toast({ title: "Meal Save Error (Partial AI)", description: "Could not save meal to cloud after AI issue. Item logged locally only.", variant: 'destructive'});
            }
        } else {
             toast({ title: "Meal Logged (Locally, Partial AI)", description: `Meal added with limited AI analysis. Login to save.`, variant: 'destructive'});
        }
        addTimelineEntry(newFoodItem);
    } finally {
      setIsLoadingAi(prev => ({ ...prev, [newItemId]: false }));
      setIsSimplifiedAddFoodDialogOpen(false);
    }
  };
  
  const handleAddManualMacroEntry = async (
    entryData: Omit<LoggedFoodItem, 'id' | 'timestamp' | 'ingredients' | 'portionSize' | 'portionUnit' | 'fodmapData' | 'isSimilarToSafe' | 'userFodmapProfile' | 'sourceDescription' | 'userFeedback'> & { entryType: 'manual_macro' | 'food' }
  ) => {
    const newItemId = `macro-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newEntry: LoggedFoodItem = {
      ...entryData,
      id: newItemId,
      timestamp: new Date(),
      entryType: 'manual_macro',
      ingredients: "Manual entry", 
      portionSize: "1",
      portionUnit: "serving",
      userFeedback: null,
    };

    if (authUser && authUser.uid !== 'guest-user') {
      const { id, ...itemToSave } = newEntry;
      try {
        const docRef = await addDoc(collection(db, 'users', authUser.uid, 'timelineEntries'), {
          ...itemToSave,
          timestamp: Timestamp.fromDate(newEntry.timestamp),
        });
        newEntry.id = docRef.id;
        toast({ title: "Manual Macros Logged", description: `${newEntry.name} added to timeline.` });
      } catch (error: any) {
        console.error("Error saving manual macro entry to Firestore:", error);
        toast({ title: "Save Error", description: "Could not save manual macro entry.", variant: "destructive" });
        return; 
      }
    } else {
      toast({ title: "Manual Macros Logged (Locally)", description: `${newEntry.name} added. Login to save.` });
    }
    addTimelineEntry(newEntry);
    setIsAddManualMacroDialogOpen(false);
  };


  const handleLogSymptoms = async (symptoms: Symptom[], notes?: string, severity?: number, linkedFoodItemIds?: string[]) => {
    let newSymptomLog: SymptomLog = {
      id: `sym-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      symptoms,
      notes,
      severity,
      linkedFoodItemIds: linkedFoodItemIds || [], 
      timestamp: new Date(),
      entryType: 'symptom',
    };

    if (authUser && authUser.uid !== 'guest-user') {
        const { id, ...logToSave } = newSymptomLog;
        try {
            const docRef = await addDoc(collection(db, 'users', authUser.uid, 'timelineEntries'), {
                ...logToSave,
                timestamp: Timestamp.fromDate(newSymptomLog.timestamp)
            });
            newSymptomLog.id = docRef.id;
            toast({ title: "Symptoms Logged & Saved", description: "Your symptoms have been recorded." });
        } catch (error: any) {
            console.error("Error saving symptom log to Firestore:", error);
            let errorDescription = "Could not save symptoms to cloud. Please try again.";
            if (error.message && error.message.includes("Missing or insufficient permissions")) {
                errorDescription = "Could not save symptoms due to Firestore security rules. Please check your rules configuration.";
            } else if (error.message && error.message.includes("invalid data") && error.message.includes("undefined")) {
                errorDescription = "Could not save symptoms: data format issue (undefined field). Logged locally only.";
            } else if (error.message && typeof error.message === 'string' && error.message.includes('linkedFoodItemIds')) {
               errorDescription = "Could not save symptoms: issue with linked food items. Logged locally only.";
            }
            toast({ title: "Symptoms Logged (Locally)", description: errorDescription, variant: "destructive" });
        }
    } else {
        toast({ title: "Symptoms Logged (Locally)", description: "Login to save your symptoms." });
    }

    addTimelineEntry(newSymptomLog);
    setIsSymptomLogDialogOpen(false);
  };

  const handleSetFoodFeedback = async (itemId: string, feedback: 'safe' | 'unsafe' | null) => {
    setTimelineEntries(prevEntries =>
      prevEntries.map(entry =>
        entry.id === itemId && (entry.entryType === 'food' || entry.entryType === 'manual_macro')
          ? { ...entry, userFeedback: feedback }
          : entry
      )
    );
    const item = timelineEntries.find(e => e.id === itemId);


    if (authUser && authUser.uid !== 'guest-user') {
      const entryDocRef = doc(db, 'users', authUser.uid, 'timelineEntries', itemId);
      try {
        await updateDoc(entryDocRef, { userFeedback: feedback });
        toast({ title: "Feedback Saved", description: `Food item marked as ${feedback || 'neutral'}.` });
      } catch (error) {
        console.error("Error saving food feedback to Firestore:", error);
        setTimelineEntries(prevEntries =>
          prevEntries.map(entry =>
            entry.id === itemId && (entry.entryType === 'food' || entry.entryType === 'manual_macro')
              ? { ...entry, userFeedback: item?.userFeedback === feedback ? item?.userFeedback : item?.userFeedback  } 
              : entry
          )
        );
        toast({ title: 'Feedback Error', description: 'Could not save feedback to cloud.', variant: 'destructive' });
      }
    } else {
      toast({ title: 'Feedback Saved (Locally)', description: `Login to save feedback permanently.` });
    }
  };


  const handleRemoveTimelineEntry = async (entryId: string) => {
    const entryToRemove = timelineEntries.find(entry => entry.id === entryId);
    setTimelineEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
    setIsLoadingAi(prev => {
      const newState = {...prev};
      delete newState[entryId];
      return newState;
    });

    if (authUser && authUser.uid !== 'guest-user') {
        try {
            await deleteDoc(doc(db, 'users', authUser.uid, 'timelineEntries', entryId));
            toast({ title: "Entry Removed", description: "The timeline entry has been deleted from cloud." });
        } catch (error) {
            console.error("Error removing timeline entry from Firestore:", error);
            if (entryToRemove) addTimelineEntry(entryToRemove); 
            toast({ title: "Error Removing Entry", description: "Could not remove entry from cloud. Removed locally.", variant: "destructive" });
        }
    } else {
        toast({ title: "Entry Removed (Locally)", description: "The timeline entry has been removed locally." });
    }
  };

  const openSymptomDialog = (foodItemIds?: string[]) => {
    setSymptomDialogContext({ foodItemIds });
    setIsSymptomLogDialogOpen(true);
    setIsCentralPopoverOpen(false); 
  };

  const fetchAiInsightsInternal = useCallback(async () => {
    setIsLoadingInsightsState(true);
    try {
      const foodLogForAI: SymptomCorrelationInput['foodLog'] = timelineEntries
        .filter((e): e is LoggedFoodItem => e.entryType === 'food' || e.entryType === 'manual_macro')
        .map(e => ({
          id: e.id,
          name: e.originalName || e.name, 
          ingredients: e.ingredients,
          portionSize: e.portionSize,
          portionUnit: e.portionUnit,
          timestamp: e.timestamp instanceof Date ? e.timestamp.toISOString() : String(e.timestamp),
          overallFodmapRisk: e.fodmapData?.overallRisk,
        }));

      const symptomLogForAI: SymptomCorrelationInput['symptomLog'] = timelineEntries
        .filter((e): e is SymptomLog => e.entryType === 'symptom')
        .map(e => {
            let sanitizedLinkedFoodItemIds: string[];
            if (Array.isArray(e.linkedFoodItemIds)) {
                sanitizedLinkedFoodItemIds = e.linkedFoodItemIds;
            } else if (typeof e.linkedFoodItemIds === 'string' && e.linkedFoodItemIds.length > 0) {
                sanitizedLinkedFoodItemIds = [e.linkedFoodItemIds]; 
            } else {
                sanitizedLinkedFoodItemIds = [];
            }
            return {
                id: e.id,
                linkedFoodItemIds: sanitizedLinkedFoodItemIds,
                symptoms: e.symptoms.map(s => ({id: s.id, name: s.name})),
                severity: e.severity,
                notes: e.notes,
                timestamp: e.timestamp instanceof Date ? e.timestamp.toISOString() : String(e.timestamp),
            };
        });

      const safeFoodsForAI = userProfile.safeFoods.map(sf => ({
        name: sf.name,
        portionSize: sf.portionSize,
        portionUnit: sf.portionUnit,
      }));

      const insightsOutput = await getSymptomCorrelations({
        foodLog: foodLogForAI,
        symptomLog: symptomLogForAI,
        safeFoods: safeFoodsForAI,
      });
      setAiInsights(insightsOutput.insights);
      if (insightsOutput.insights.length === 0) {
        toast({title: "No Specific Insights Yet", description: "Keep logging regularly for more personalized insights.", variant: "default"});
      } else {
        toast({title: "Insights Generated!", description: "Check out your new AI-powered insights.", variant: "default"});
      }
    } catch (error: any) {
      console.error("Failed to fetch AI insights:", error);
       let toastTitle = "Error Fetching Insights";
       let toastDescription = "Could not retrieve AI-powered insights at this time.";
       if (error?.message && typeof error.message === 'string') {
        const errorMessageLower = error.message.toLowerCase();
         if (errorMessageLower.includes('api key') || errorMessageLower.includes('permission denied') || errorMessageLower.includes('authentication failed') || errorMessageLower.includes('credential') || errorMessageLower.includes('forbidden') || errorMessageLower.includes('access denied')) {
            toastTitle = 'AI Insights Access Issue';
            toastDescription = 'Could not access AI for insights due to an authentication or permission problem. Please check Google Cloud project setup.';
        } else if (errorMessageLower.includes('503') || errorMessageLower.includes('model is overloaded')) {
            toastTitle = 'AI Insights Model Overloaded';
            toastDescription = 'The AI model for insights is temporarily busy. Please try again later.';
        } else if (errorMessageLower.includes('invalid_argument') && errorMessageLower.includes('schema validation')) { 
            toastTitle = 'AI Insights Data Error';
            toastDescription = `There was an issue with the data format sent for AI analysis: ${error.message.substring(0, 150)}. Please check your logs.`;
        } else if (errorMessageLower.includes('linkedfooditemids') && errorMessageLower.includes('must be array')) {
            toastTitle = 'AI Insights Data Error';
            toastDescription = 'Symptom data for AI is not correctly formatted (linkedFoodItemIds). Please try re-logging recent symptoms.';
        }
      }
      toast({title: toastTitle, description: toastDescription, variant: "destructive", duration: 9000});
      setAiInsights([]);
    } finally {
      setIsLoadingInsightsState(false);
    }
  }, [timelineEntries, userProfile.safeFoods, toast]);


  const handleLogFoodClick = () => {
    setIsCentralPopoverOpen(false); 
    if (authUser && authUser.uid !== 'guest-user' && !userProfile.premium) {
      setPendingActionAfterInterstitial('logFood');
      setShowInterstitialAd(true);
    } else {
      setIsAddFoodDialogOpen(true);
    }
  };
  
  const handleSimplifiedLogFoodClick = () => {
    setIsCentralPopoverOpen(false); 
    if (authUser && authUser.uid !== 'guest-user' && !userProfile.premium) {
      setPendingActionAfterInterstitial('simplifiedLogFood');
      setShowInterstitialAd(true);
    } else {
      setIsSimplifiedAddFoodDialogOpen(true);
    }
  };


  useEffect(() => {
    if (timelineEntries.length === 0 && !isDataLoading && authUser && !authLoading) {
        setAiInsights([]);
    }
  }, [timelineEntries, isDataLoading, authUser, authLoading]);

  const handleUpgradeToPremium = async () => {
    if (authUser && authUser.uid !== 'guest-user') {
        const userDocRef = doc(db, 'users', authUser.uid);
        try {
            await updateDoc(userDocRef, { premium: true });
            setUserProfile(prev => ({ ...prev, premium: true }));
            toast({ 
              title: "Premium Status Activated! (Simulated)", 
              description: "Ads removed & premium features unlocked. This is a simulation - no real payment was processed." 
            });
        } catch (error) {
            console.error("Error updating premium status in Firestore:", error);
            toast({ 
              title: "Upgrade Failed (Simulated)", 
              description: "Could not save premium status to the cloud. Please try again. (Payment not processed).", 
              variant: "destructive"
            });
        }
    } else {
        setUserProfile(prev => ({ ...prev, premium: true }));
        toast({ 
          title: "Premium Activated (Locally, Simulated)", 
          description: "Ads removed & premium features unlocked for this session. Login to save this status. (This is a simulation - no real payment was processed)." 
        });
    }
    setIsPremiumDashboardOpen(false); 
  };

  const handleInterstitialClosed = (continued: boolean) => {
    setShowInterstitialAd(false);
    if (continued) {
      if (pendingActionAfterInterstitial === 'logFood') {
        setIsAddFoodDialogOpen(true);
      } else if (pendingActionAfterInterstitial === 'simplifiedLogFood') {
        setIsSimplifiedAddFoodDialogOpen(true);
      }
    }
    setPendingActionAfterInterstitial(null);
  };

  const isAnyItemLoadingAi = Object.values(isLoadingAi).some(loading => loading);

  const dailyNutritionSummary = useMemo<DailyNutritionSummary>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); 

    let totals: DailyNutritionSummary = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    timelineEntries.forEach(entry => {
      if (entry.entryType === 'food' || entry.entryType === 'manual_macro') {
        const entryDate = new Date(entry.timestamp);
        if (entryDate >= today && entryDate < tomorrow) {
          totals.calories += entry.calories || 0;
          totals.protein += entry.protein || 0;
          totals.carbs += entry.carbs || 0;
          totals.fat += entry.fat || 0;
        }
      }
    });
    return totals;
  }, [timelineEntries]);

  const dailyFodmapCount = useMemo<DailyFodmapCount>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const counts: DailyFodmapCount = { green: 0, yellow: 0, red: 0 };
    timelineEntries.forEach(entry => {
      if (entry.entryType === 'food') { 
        const entryDate = new Date(entry.timestamp);
        if (entryDate >= today && entryDate < tomorrow) {
          const risk = entry.fodmapData?.overallRisk;
          if (risk === 'Green') counts.green++;
          else if (risk === 'Yellow') counts.yellow++;
          else if (risk === 'Red') counts.red++;
        }
      }
    });
    return counts;
  }, [timelineEntries]);

  const handleGuestLogFoodOpen = () => {
    setIsGuestLogFoodDialogOpen(true);
  };

  const handleGuestProcessMealDescription = async (description: string) => {
    const newItemId = `guest-food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setIsLoadingAi(prev => ({ ...prev, [newItemId]: true }));
    
    let mealDescriptionOutput: ProcessMealDescriptionOutput | undefined;
    let fodmapAnalysis: AnalyzeFoodItemOutput | undefined;
    let newFoodItem: LoggedFoodItem;

    try {
      mealDescriptionOutput = await processMealDescription({ mealDescription: description });
      fodmapAnalysis = await analyzeFoodItem({
        foodItem: mealDescriptionOutput.primaryFoodItemForAnalysis,
        ingredients: mealDescriptionOutput.consolidatedIngredients,
        portionSize: mealDescriptionOutput.estimatedPortionSize,
        portionUnit: mealDescriptionOutput.estimatedPortionUnit,
      });
      
      newFoodItem = {
        id: newItemId,
        name: mealDescriptionOutput.wittyName,
        originalName: mealDescriptionOutput.primaryFoodItemForAnalysis,
        ingredients: mealDescriptionOutput.consolidatedIngredients,
        portionSize: mealDescriptionOutput.estimatedPortionSize,
        portionUnit: mealDescriptionOutput.estimatedPortionUnit,
        sourceDescription: description,
        timestamp: new Date(),
        fodmapData: fodmapAnalysis,
        isSimilarToSafe: false, 
        userFodmapProfile: fodmapAnalysis?.detailedFodmapProfile || generateFallbackFodmapProfile(mealDescriptionOutput.primaryFoodItemForAnalysis),
        calories: fodmapAnalysis?.calories,
        protein: fodmapAnalysis?.protein,
        carbs: fodmapAnalysis?.carbs,
        fat: fodmapAnalysis?.fat,
        entryType: 'food',
        userFeedback: null,
      };
      setLastGuestFoodItem(newFoodItem);
      toast({title: "Meal Noted (Locally)", description: "Sign in with Google to save and track!"});
      setIsGuestSheetOpen(true); 
    } catch (error: any) {
        console.error('Guest AI meal processing failed:', error);
        let toastTitle = 'Error Noting Meal';
        let toastDescription = 'Could not analyze meal. Please try again.';
         if (error?.message && typeof error.message === 'string') {
             const errorMessageLower = error.message.toLowerCase();
             if (errorMessageLower.includes('api key') || errorMessageLower.includes('permission denied') ) {
                 toastTitle = 'AI Service Access Issue';
                 toastDescription = 'Could not access AI services. Please check configuration.';
             }
         }
        toast({ title: toastTitle, description: toastDescription, variant: 'destructive', duration: 9000 });
        setLastGuestFoodItem({
            id: newItemId,
            name: description.substring(0,30) + "...",
            ingredients: "N/A - AI Error",
            portionSize: "N/A",
            portionUnit: "",
            timestamp: new Date(),
            entryType: 'food',
            userFeedback: null,
            sourceDescription: description,
        });
        setIsGuestSheetOpen(true);
    } finally {
      setIsLoadingAi(prev => ({ ...prev, [newItemId]: false }));
      setIsGuestLogFoodDialogOpen(false); 
    }
  };

  const handleGuestSetFoodFeedback = (itemId: string, feedback: 'safe' | 'unsafe' | null) => {
    if (lastGuestFoodItem && lastGuestFoodItem.id === itemId) {
      setLastGuestFoodItem(prev => prev ? { ...prev, userFeedback: feedback } : null);
      toast({title: "Feedback Noted (Locally)", description: "Sign in to save your preferences."});
    }
  };

  const handleGuestRemoveFoodItem = (itemId: string) => {
    if (lastGuestFoodItem && lastGuestFoodItem.id === itemId) {
      setLastGuestFoodItem(null);
      toast({title: "Item Removed (Locally)"});
      setIsGuestSheetOpen(false);
    }
  };


  if (authLoading || (isDataLoading && authUser)) { 
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
         <p className="ml-4 text-lg text-foreground">
            {authLoading ? "Authenticating..." : (authUser ? "Loading your personalized data..." : "Initializing App...")}
         </p>
      </div>
    );
  }
  
  if (!authUser && !authLoading) {
    return (
      <>
        <GuestHomePage
          onLogFoodClick={handleGuestLogFoodOpen}
          lastLoggedItem={lastGuestFoodItem}
          isSheetOpen={isGuestSheetOpen}
          onSheetOpenChange={setIsGuestSheetOpen}
          onSetFeedback={handleGuestSetFoodFeedback}
          onRemoveItem={handleGuestRemoveFoodItem}
          isLoadingAiForItem={lastGuestFoodItem ? !!isLoadingAi[lastGuestFoodItem.id] : false}
        />
        <SimplifiedAddFoodDialog
            isOpen={isGuestLogFoodDialogOpen}
            onOpenChange={setIsGuestLogFoodDialogOpen}
            onProcessDescription={handleGuestProcessMealDescription}
            isGuestView={true}
        />
      </>
    );
  }

  // Registered User UI
  if (userProfile.premium) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
        
        <div className="flex-grow flex items-center justify-center">
          <Popover open={isCentralPopoverOpen} onOpenChange={setIsCentralPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="rounded-full h-32 w-32 sm:h-40 sm:w-40 border-2 border-primary bg-transparent animate-pulse-glow hover:bg-primary/10 focus:bg-primary/10 focus:ring-primary focus:ring-offset-background focus:ring-offset-2"
                aria-label="Open Actions Menu"
              >
                <CircleDotDashed className="h-16 w-16 sm:h-20 sm:w-20 text-primary" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
                side="top" 
                align="center" 
                className="w-auto bg-card text-card-foreground border-border shadow-xl rounded-xl p-0"
                onInteractOutside={() => setIsCentralPopoverOpen(false)}
            >
                <div className="flex flex-col gap-1 p-2">
                     <Button variant="ghost" className="justify-start w-full text-base py-3 px-4 text-card-foreground hover:bg-accent hover:text-accent-foreground" onClick={handleSimplifiedLogFoodClick}>
                        <PlusCircle className="mr-3 h-5 w-5" /> Log Food
                    </Button>
                    <Button variant="ghost" className="justify-start w-full text-base py-3 px-4 text-card-foreground hover:bg-accent hover:text-accent-foreground" onClick={() => openSymptomDialog()}>
                        <ListChecks className="mr-3 h-5 w-5" /> Log Symptoms
                    </Button>
                     <Button variant="ghost" className="justify-start w-full text-base py-3 px-4 text-card-foreground hover:bg-accent hover:text-accent-foreground" onClick={() => setIsAddManualMacroDialogOpen(true)}>
                        <Pencil className="mr-3 h-5 w-5" /> Add Macros Manually
                    </Button>
                </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <PremiumDashboardSheet
            isOpen={isPremiumDashboardOpen}
            onOpenChange={setIsPremiumDashboardOpen}
            userProfile={userProfile}
            timelineEntries={timelineEntries}
            dailyNutritionSummary={dailyNutritionSummary}
            dailyFodmapCount={dailyFodmapCount}
            isLoadingAi={isLoadingAi}
            onSetFeedback={handleSetFoodFeedback}
            onRemoveTimelineEntry={handleRemoveTimelineEntry}
            onLogSymptomsForFood={openSymptomDialog}
            onUpgradeClick={handleUpgradeToPremium} 
            onEditIngredients={(itemToEdit: LoggedFoodItem) => {
              const fullItem = timelineEntries.find(entry => entry.id === itemToEdit.id && entry.entryType === 'food') as LoggedFoodItem | undefined;
              if (fullItem) {
                toast({title: "Edit Meal", description: `Editing "${fullItem.name}" (functionality to be implemented).`});
              }
            }}
        >
         <div></div> 
        </PremiumDashboardSheet>
        
        {!isPremiumDashboardOpen && (
            <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-4">
                <Button
                    variant="ghost"
                    className="text-xs text-muted-foreground/70 hover:text-muted-foreground hover:bg-muted/30 py-1 px-3 rounded-full"
                    onClick={() => setIsPremiumDashboardOpen(true)}
                    aria-label="Open Dashboard"
                >
                    Swipe Up or Tap to View Dashboard
                </Button>
            </div>
        )}
        
        <SimplifiedAddFoodDialog
          isOpen={isSimplifiedAddFoodDialogOpen}
          onOpenChange={setIsSimplifiedAddFoodDialogOpen}
          onProcessDescription={handleProcessMealDescription}
          isGuestView={false}
        />
        <SymptomLoggingDialog
            isOpen={isSymptomLogDialogOpen}
            onOpenChange={setIsSymptomLogDialogOpen}
            onLogSymptoms={handleLogSymptoms}
            context={symptomDialogContext}
            allSymptoms={COMMON_SYMPTOMS}
        />
        <AddManualMacroEntryDialog
            isOpen={isAddManualMacroDialogOpen}
            onOpenChange={setIsAddManualMacroDialogOpen}
            onAddEntry={handleAddManualMacroEntry}
        />
        {isAnyItemLoadingAi && (
            <div className="fixed bottom-20 right-4 bg-card text-card-foreground p-3 rounded-lg shadow-lg flex items-center space-x-2 z-50">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>AI is analyzing...</span>
            </div>
        )}
        <style jsx global>{`
            .animate-pulse-soft {
                animation: pulse-soft 2.5s infinite cubic-bezier(0.4, 0, 0.6, 1);
            }
            @keyframes pulse-soft {
                0%, 100% { box-shadow: 0 0 0 0px hsl(var(--primary) / 0.3); }
                50% { box-shadow: 0 0 0 15px hsl(var(--primary) / 0); }
            }
        `}</style>
      </div>
    );
  }

  // Standard (Non-Premium) User UI
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar onUpgradeClick={handleUpgradeToPremium} isPremium={userProfile.premium || false} />
      <header className="sticky top-16 bg-background/80 backdrop-blur-md z-40 py-6 mb-6 shadow-xl rounded-b-2xl border-b border-border">
        <div className="container mx-auto flex flex-col items-center gap-4">
          <Button
            size="lg"
            className="w-72 h-20 text-2xl rounded-full bg-primary text-primary-foreground hover:bg-primary/80 focus:ring-4 ring-ring flex items-center justify-center animate-pulse-glow"
            onClick={handleLogFoodClick}
            aria-label="Log Food"
            disabled={(showInterstitialAd && authUser && authUser.uid !== 'guest-user' && !userProfile.premium) || isAnyItemLoadingAi}
          >
            <PlusCircle className="mr-3 h-8 w-8" /> Tap to Log Food
          </Button>
          <div className="flex flex-wrap justify-center gap-3 mt-3">
             <Button variant="outline" className="border-accent text-foreground hover:bg-accent hover:text-accent-foreground" onClick={handleSimplifiedLogFoodClick} disabled={(showInterstitialAd && authUser && authUser.uid !== 'guest-user' && !userProfile.premium) || isAnyItemLoadingAi}>
                <Brain className="mr-2 h-5 w-5" /> Log Food (AI)
            </Button>
            <Button variant="outline" className="border-accent text-foreground hover:bg-accent hover:text-accent-foreground" onClick={() => openSymptomDialog()}>
              <ListChecks className="mr-2 h-5 w-5" /> Log Symptoms
            </Button>
            {/* "Get Insights" button removed */}
          </div>
        </div>
      </header>

      <AddFoodItemDialog
        isOpen={isAddFoodDialogOpen}
        onOpenChange={setIsAddFoodDialogOpen}
        onAddFoodItem={handleAddFoodItem}
      />
      <SimplifiedAddFoodDialog
        isOpen={isSimplifiedAddFoodDialogOpen}
        onOpenChange={setIsSimplifiedAddFoodDialogOpen}
        onProcessDescription={handleProcessMealDescription}
        isGuestView={false}
      />
       <AddManualMacroEntryDialog
        isOpen={isAddManualMacroDialogOpen}
        onOpenChange={setIsAddManualMacroDialogOpen}
        onAddEntry={handleAddManualMacroEntry}
      />
      <SymptomLoggingDialog
        isOpen={isSymptomLogDialogOpen}
        onOpenChange={setIsSymptomLogDialogOpen}
        onLogSymptoms={handleLogSymptoms}
        context={symptomDialogContext}
        allSymptoms={COMMON_SYMPTOMS}
      />
      {showInterstitialAd && authUser && authUser.uid !== 'guest-user' && !userProfile.premium && interstitialAdUnitId && (
        <InterstitialAdPlaceholder
          isOpen={showInterstitialAd}
          onClose={() => handleInterstitialClosed(false)}
          onContinue={() => handleInterstitialClosed(true)}
          adUnitId={interstitialAdUnitId}
          actionName={pendingActionAfterInterstitial === 'logFood' ? 'Log Food' : pendingActionAfterInterstitial === 'simplifiedLogFood' ? 'Log Food (AI)' : 'Action'}
        />
      )}

      {isAnyItemLoadingAi && (
        <div className="fixed bottom-4 right-4 bg-card text-card-foreground p-3 rounded-lg shadow-lg flex items-center space-x-2 z-50 border border-border">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>AI is analyzing...</span>
        </div>
      )}

      <main className="flex-grow container mx-auto px-2 sm:px-4 py-2">
        <div className="mb-6">
           <DailyTotalsCard summary={dailyNutritionSummary} onEditMacrosClick={() => setIsAddManualMacroDialogOpen(true)} />
        </div>
       
        {aiInsights.length > 0 && (
          <Card className="mb-6 bg-card border-border shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-xl sm:text-2xl flex items-center text-foreground">
                <Brain className="mr-3 h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground" /> AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiInsights.map((insight, index) => (
                <InsightCard key={index} insight={insight} />
              ))}
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
         {timelineEntries.length === 0 && !isAnyItemLoadingAi && !isDataLoading && !authLoading && (
            <Card className="text-center py-12 bg-card border-border shadow-md">
              <CardContent>
                <Utensils className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold font-headline mb-2 text-foreground">Your Timeline is Empty</h2>
                <p className="text-muted-foreground mb-6">Tap a log button above to record your first food item or symptom.</p>
                 {!authUser && <p className="text-muted-foreground">Consider <Link href="/login" className="underline text-primary">logging in</Link> to save your data.</p>}
              </CardContent>
            </Card>
          )}

          {timelineEntries.map(entry => {
            if (entry.entryType === 'food' || entry.entryType === 'manual_macro') {
              return (
                <TimelineFoodCard
                  key={entry.id}
                  item={entry}
                  onSetFeedback={handleSetFoodFeedback}
                  onRemoveItem={() => handleRemoveTimelineEntry(entry.id)}
                  onLogSymptoms={() => openSymptomDialog([entry.id])}
                  isLoadingAi={!!isLoadingAi[entry.id]}
                  onEditIngredients={(itemToEdit: LoggedFoodItem) => {
                      const fullItem = timelineEntries.find(e => e.id === itemToEdit.id && e.entryType === 'food') as LoggedFoodItem | undefined;
                      if (fullItem) {
                          toast({title: "Edit Meal", description: `Editing "${fullItem.name}" (functionality to be implemented for standard UI).`});
                      }
                  }}
                />
              );
            }
            if (entry.entryType === 'symptom') {
              return (
                <TimelineSymptomCard
                  key={entry.id}
                  item={entry}
                  onRemoveItem={() => handleRemoveTimelineEntry(entry.id)}
                />
              );
            }
            return null;
          })}
        </div>

        {authUser && authUser.uid !== 'guest-user' && !userProfile.premium && bannerAdUnitId && (
          <div className="mt-8">
            <BannerAdPlaceholder adUnitId={bannerAdUnitId} />
          </div>
        )}

        <Card className="mt-12 bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-xl sm:text-2xl flex items-center text-foreground">
              <Activity className="mr-3 h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground" />
              Your Safe Foods List (Legacy)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userProfile.safeFoods.length === 0 ? (
              <p className="text-muted-foreground">You haven&apos;t marked any foods as safe using the old system. Use the Thumbs Up icon on food items to mark them as safe.</p>
            ) : (
              <ScrollArea className="h-60">
                <ul className="space-y-3 pr-4">
                  {userProfile.safeFoods.map(sf => (
                    <li key={sf.id} className="p-4 border border-border rounded-lg bg-card shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-lg text-foreground">{sf.name}</p>
                          <p className="text-sm text-muted-foreground">Portion: {sf.portionSize} {sf.portionUnit}</p>
                          <p className="text-xs text-muted-foreground break-all">Ingredients: {sf.ingredients}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
             {authUser && authUser.uid !== 'guest-user' && !userProfile.premium && (
                <div className="mt-6 text-center">
                    <Button onClick={handleUpgradeToPremium} className="bg-primary text-primary-foreground hover:bg-primary/80">
                        <Zap className="mr-2 h-4 w-4" /> Upgrade to Premium (Simulated)
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">Current Status: Free User</p>
                </div>
            )}
            {authUser && userProfile.premium && (
                 <p className="text-sm text-center text-green-400 mt-4">Premium User - Ads Removed</p>
            )}
             {!authUser && ( 
                 <p className="text-sm text-center text-muted-foreground mt-4">
                    This app is best experienced when <Link href="/login" className="underline text-primary">Logged In</Link>.
                </p>
            )}
          </CardContent>
        </Card>
         <div className="py-8 text-center">
            <Info className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
                GutCheck helps you track food and symptoms.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
                This app is not a substitute for professional medical advice.
            </p>
        </div>
      </main>
    </div>
  );
}
