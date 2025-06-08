
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import type { LoggedFoodItem, UserProfile, TimelineEntry, Symptom, SymptomLog, SafeFood, DailyNutritionSummary } from '@/types';
import { COMMON_SYMPTOMS } from '@/types';
import { Loader2, PlusCircle, ListChecks, Pencil, CalendarDays, Edit3, ChevronUp, Repeat, Camera, LayoutGrid } from 'lucide-react';
import { analyzeFoodItem, type AnalyzeFoodItemOutput, type FoodFODMAPProfile as DetailedFodmapProfileFromAI } from '@/ai/flows/fodmap-detection';
import { isSimilarToSafeFoods, type FoodFODMAPProfile, type FoodSimilarityOutput } from '@/ai/flows/food-similarity';
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
  where,
} from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import AddFoodItemDialog, { type ManualEntryFormValues } from '@/components/food-logging/AddFoodItemDialog';
import SimplifiedAddFoodDialog, { type SimplifiedFoodLogFormValues } from '@/components/food-logging/SimplifiedAddFoodDialog';
import SymptomLoggingDialog from '@/components/food-logging/SymptomLoggingDialog';
import AddManualMacroEntryDialog, { type ManualMacroFormValues } from '@/components/food-logging/AddManualMacroEntryDialog';
import LogPreviousMealDialog from '@/components/food-logging/LogPreviousMealDialog';
import IdentifyFoodByPhotoDialog, { type IdentifiedPhotoData } from '@/components/food-logging/IdentifyFoodByPhotoDialog';
import Navbar from '@/components/shared/Navbar';
import GuestHomePage from '@/components/guest/GuestHomePage';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import PremiumDashboardSheet from '@/components/premium/PremiumDashboardSheet';
import LandingPageClientContent from '@/components/landing/LandingPageClientContent'; // Updated import

const TEMPORARILY_UNLOCK_ALL_FEATURES = true;

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


export default function RootPage() { 
  const { toast } = useToast();
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPathname = usePathname();

  const [userProfile, setUserProfile] = useState<UserProfile>(initialGuestProfile);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState<Record<string, boolean>>({});

  const [isAddFoodDialogOpenState, setIsAddFoodDialogOpenState] = useState(false);
  const setIsAddFoodDialogOpen = (val: boolean) => {
    setIsAddFoodDialogOpenState(val);
  }

  const [isSimplifiedAddFoodDialogOpen, setIsSimplifiedAddFoodDialogOpen] = useState(false);
  const [isIdentifyByPhotoDialogOpen, setIsIdentifyByPhotoDialogOpen] = useState(false);
  const [isSymptomLogDialogOpen, setIsSymptomLogDialogOpen] = useState(false);
  const [isAddManualMacroDialogOpen, setIsAddManualMacroDialogOpen] = useState(false);
  const [isLogPreviousMealDialogOpen, setIsLogPreviousMealDialogOpen] = useState(false);
  const [selectedLogDateForPreviousMeal, setSelectedLogDateForPreviousMeal] = useState<Date | undefined>(undefined);


  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isPremiumDashboardOpen, setIsPremiumDashboardOpen] = useState(false);

  const [lastGuestFoodItem, setLastGuestFoodItem] = useState<LoggedFoodItem | null>(null);
  const [isGuestLogFoodDialogOpen, setIsGuestLogFoodDialogOpen] = useState(false);
  const [isGuestSheetOpen, setIsGuestSheetOpen] = useState(false);

  const [editingItem, setEditingItem] = useState<LoggedFoodItem | null>(null);

  useEffect(() => {
    const setupUserOrGuest = async () => {
      setIsDataLoading(true);
      if (authLoading) return;

      if (authUser) {
        const userDocRef = doc(db, 'users', authUser.uid);
        const timelineEntriesColRef = collection(db, 'users', authUser.uid, 'timelineEntries');

        try {
          const userDocSnap = await getDoc(userDocRef);
          let currentIsPremium = false;
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            currentIsPremium = data.premium || false;
            setUserProfile({
              uid: authUser.uid,
              email: authUser.email,
              displayName: authUser.displayName,
              safeFoods: data.safeFoods || [],
              premium: currentIsPremium,
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
            currentIsPremium = false;
          }

          let q;
          if (TEMPORARILY_UNLOCK_ALL_FEATURES || currentIsPremium) {
            q = query(timelineEntriesColRef, orderBy('timestamp', 'desc'));
          } else {
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
            q = query(timelineEntriesColRef, orderBy('timestamp', 'desc'), where('timestamp', '>=', Timestamp.fromDate(twoDaysAgo)));
            if (!TEMPORARILY_UNLOCK_ALL_FEATURES) {
              toast({ title: "Data Retention Notice", description: "As a free user, your data is retained for 2 days.", variant: "default", duration: 10000 });
            }
          }

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
          
        } finally {
          setIsDataLoading(false);
        }
      } else { 
        setUserProfile(initialGuestProfile);
        setTimelineEntries([]);
        setLastGuestFoodItem(null);
        setIsDataLoading(false);
      }
    };
    setupUserOrGuest();
  }, [authUser, authLoading, toast]);

  
  useEffect(() => {
    if (searchParams.get('openDashboard') === 'true') {
      setIsPremiumDashboardOpen(true);
      
      router.replace(currentPathname, { scroll: false });
    }
  }, [searchParams, router, currentPathname]);


  const addTimelineEntry = (entry: TimelineEntry) => {
    setTimelineEntries(prevEntries => [entry, ...prevEntries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  const updateTimelineEntry = (updatedEntry: TimelineEntry) => {
    setTimelineEntries(prevEntries =>
      prevEntries.map(entry => (entry.id === updatedEntry.id ? updatedEntry : entry))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    );
  };

  const handleSetFoodFeedback = async (itemId: string, feedback: 'safe' | 'unsafe' | null) => {
    const itemIndex = timelineEntries.findIndex(e => e.id === itemId && (e.entryType === 'food' || e.entryType === 'manual_macro'));
    if (itemIndex === -1) return;

    const originalItem = timelineEntries[itemIndex] as LoggedFoodItem;
    const updatedItem = { ...originalItem, userFeedback: feedback };

    setTimelineEntries(prevEntries => {
      const newEntries = [...prevEntries];
      newEntries[itemIndex] = updatedItem;
      return newEntries;
    });


    if (authUser && authUser.uid !== 'guest-user') {
      const entryDocRef = doc(db, 'users', authUser.uid, 'timelineEntries', itemId);
      try {
        await updateDoc(entryDocRef, { userFeedback: feedback });
        toast({ title: "Feedback Saved", description: `Food item marked as ${feedback || 'neutral'}.` });
      } catch (error) {
        console.error("Error saving food feedback to Firestore:", error);
        setTimelineEntries(prevEntries => {
            const newEntries = [...prevEntries];
            newEntries[itemIndex] = originalItem;
            return newEntries;
        });
        toast({ title: 'Feedback Error', description: 'Could not save feedback to cloud.', variant: 'destructive' });
      }
    } else {
      toast({ title: 'Feedback Saved (Locally)', description: `Login to save feedback permanently.` });
    }
  };

  const handleSubmitFoodItem = async (
    foodItemData: Omit<LoggedFoodItem, 'id' | 'timestamp' | 'entryType' | 'calories' | 'protein' | 'carbs' | 'fat' | 'sourceDescription' | 'userFeedback' | 'macrosOverridden'>,
    customTimestamp?: Date
  ) => {
    const currentItemId = editingItem ? editingItem.id : `food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setIsLoadingAi(prev => ({ ...prev, [currentItemId]: true }));

    let processedFoodItem: LoggedFoodItem;
    let fodmapAnalysis: AnalyzeFoodItemOutput | undefined;
    let similarityOutput: FoodSimilarityOutput | undefined;
    const logTimestamp = customTimestamp || (editingItem ? editingItem.timestamp : new Date());


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
      }

      processedFoodItem = {
        ...foodItemData,
        id: currentItemId,
        timestamp: logTimestamp,
        fodmapData: fodmapAnalysis,
        isSimilarToSafe: isSimilar,
        userFodmapProfile: itemFodmapProfileForSimilarity,
        calories: fodmapAnalysis?.calories,
        protein: fodmapAnalysis?.protein,
        carbs: fodmapAnalysis?.carbs,
        fat: fodmapAnalysis?.fat,
        entryType: 'food',
        userFeedback: editingItem ? editingItem.userFeedback : null,
        macrosOverridden: false,
      };

      if (authUser && authUser.uid !== 'guest-user') {
        const { id, ...itemToSave } = processedFoodItem;
        const docRefPath = doc(db, 'users', authUser.uid, 'timelineEntries', currentItemId);
        if (editingItem) {
          await updateDoc(docRefPath, { ...itemToSave, timestamp: Timestamp.fromDate(processedFoodItem.timestamp as Date) });
          toast({ title: "Food Item Updated", description: `${processedFoodItem.name} updated with new AI analysis.` });
        } else {
          await setDoc(docRefPath, { ...itemToSave, timestamp: Timestamp.fromDate(processedFoodItem.timestamp as Date) });
          toast({ title: "Food Logged & Saved", description: `${processedFoodItem.name} added with AI analysis.` });
        }
      } else {
         toast({ title: editingItem ? "Food Item Updated (Locally)" : "Food Logged (Locally)", description: `${processedFoodItem.name} ${editingItem ? 'updated' : 'added'}. Login to save.` });
      }

      if (editingItem) {
        updateTimelineEntry(processedFoodItem);
      } else {
        addTimelineEntry(processedFoodItem);
      }
      if (customTimestamp) setSelectedLogDateForPreviousMeal(undefined);
       setIsAddFoodDialogOpen(false);
       setEditingItem(null);

    } catch (error: any) {
      console.error('AI analysis or food logging/updating failed:', error);
       toast({ title: 'Error Processing Food', description: `Could not ${editingItem ? 'update' : 'log'} food. AI analysis might have failed.`, variant: 'destructive' });
      
      processedFoodItem = {
        ...foodItemData,
        id: currentItemId,
        timestamp: logTimestamp,
        isSimilarToSafe: similarityOutput?.isSimilar ?? false,
        entryType: 'food',
        fodmapData: undefined, 
        userFodmapProfile: generateFallbackFodmapProfile(foodItemData.name),
        calories: undefined, protein: undefined, carbs: undefined, fat: undefined,
        userFeedback: editingItem ? editingItem.userFeedback : null,
        macrosOverridden: false,
      };
       if (editingItem) {
        updateTimelineEntry(processedFoodItem);
      } else {
        addTimelineEntry(processedFoodItem);
      }
    } finally {
      setIsLoadingAi(prev => ({ ...prev, [currentItemId]: false }));
    }
  };

  const handleSubmitMealDescription = async (
    formData: SimplifiedFoodLogFormValues,
    userDidOverrideMacros: boolean,
    customTimestamp?: Date
  ) => {
    const currentItemId = editingItem ? editingItem.id : `food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setIsLoadingAi(prev => ({ ...prev, [currentItemId]: true }));

    let mealDescriptionOutput: ProcessMealDescriptionOutput | undefined;
    let fodmapAnalysis: AnalyzeFoodItemOutput | undefined;
    let similarityOutput: FoodSimilarityOutput | undefined;
    let processedFoodItem: LoggedFoodItem;
    const logTimestamp = customTimestamp || (editingItem ? editingItem.timestamp : new Date());

    try {
      mealDescriptionOutput = await processMealDescription({ mealDescription: formData.mealDescription });
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
      }

      let finalCalories, finalProtein, finalCarbs, finalFat;

      if (userDidOverrideMacros) {
        finalCalories = formData.calories;
        finalProtein = formData.protein;
        finalCarbs = formData.carbs;
        finalFat = formData.fat;
      } else {
        finalCalories = fodmapAnalysis?.calories;
        finalProtein = fodmapAnalysis?.protein;
        finalCarbs = fodmapAnalysis?.carbs;
        finalFat = fodmapAnalysis?.fat;
      }


      processedFoodItem = {
        id: currentItemId,
        name: mealDescriptionOutput.wittyName,
        originalName: mealDescriptionOutput.primaryFoodItemForAnalysis,
        ingredients: mealDescriptionOutput.consolidatedIngredients,
        portionSize: mealDescriptionOutput.estimatedPortionSize,
        portionUnit: mealDescriptionOutput.estimatedPortionUnit,
        sourceDescription: formData.mealDescription,
        timestamp: logTimestamp,
        fodmapData: fodmapAnalysis,
        isSimilarToSafe: isSimilar,
        userFodmapProfile: itemFodmapProfileForSimilarity,
        calories: finalCalories,
        protein: finalProtein,
        carbs: finalCarbs,
        fat: finalFat,
        entryType: 'food',
        userFeedback: editingItem ? editingItem.userFeedback : null,
        macrosOverridden: userDidOverrideMacros,
      };

      if (authUser && authUser.uid !== 'guest-user') {
        const { id, ...itemToSave } = processedFoodItem;
        const docRefPath = doc(db, 'users', authUser.uid, 'timelineEntries', currentItemId);
         if (editingItem) {
          await updateDoc(docRefPath, { ...itemToSave, timestamp: Timestamp.fromDate(processedFoodItem.timestamp as Date) });
          toast({ title: "Meal Updated!", description: `"${processedFoodItem.name}" updated with new AI insights.` });
        } else {
          await setDoc(docRefPath, { ...itemToSave, timestamp: Timestamp.fromDate(processedFoodItem.timestamp as Date) });
          toast({ title: "Meal Logged!", description: `"${processedFoodItem.name}" added with AI insights.` });
        }
      } else {
        toast({ title: editingItem ? "Meal Updated (Locally)" : "Meal Logged (Locally)", description: `"${processedFoodItem.name}" ${editingItem ? 'updated' : 'added'}. Login to save.` });
      }

      if (editingItem) {
        updateTimelineEntry(processedFoodItem);
      } else {
        addTimelineEntry(processedFoodItem);
      }
      if (customTimestamp) setSelectedLogDateForPreviousMeal(undefined);
      setIsSimplifiedAddFoodDialogOpen(false);
      setEditingItem(null);


    } catch (error: any) {
      console.error('Full AI meal processing/updating failed:', error);
       toast({ title: 'Error Processing Meal', description: `Could not ${editingItem ? 'update' : 'log'} meal via AI.`, variant: 'destructive' });
       
       processedFoodItem = {
            id: currentItemId,
            name: mealDescriptionOutput?.wittyName || editingItem?.name || "Meal (Analysis Failed)",
            originalName: mealDescriptionOutput?.primaryFoodItemForAnalysis || editingItem?.originalName || formData.mealDescription.substring(0,30) + "...",
            ingredients: mealDescriptionOutput?.consolidatedIngredients || editingItem?.ingredients || "See description",
            portionSize: mealDescriptionOutput?.estimatedPortionSize || editingItem?.portionSize || "N/A",
            portionUnit: mealDescriptionOutput?.estimatedPortionUnit || editingItem?.portionUnit || "",
            sourceDescription: formData.mealDescription,
            timestamp: logTimestamp,
            fodmapData: undefined,
            isSimilarToSafe: similarityOutput?.isSimilar ?? false,
            userFodmapProfile: fodmapAnalysis?.detailedFodmapProfile || editingItem?.userFodmapProfile || generateFallbackFodmapProfile(mealDescriptionOutput?.primaryFoodItemForAnalysis || "fallback"),
            calories: userDidOverrideMacros ? formData.calories : (editingItem ? editingItem.calories : undefined),
            protein: userDidOverrideMacros ? formData.protein : (editingItem ? editingItem.protein : undefined),
            carbs: userDidOverrideMacros ? formData.carbs : (editingItem ? editingItem.carbs : undefined),
            fat: userDidOverrideMacros ? formData.fat : (editingItem ? editingItem.fat : undefined),
            entryType: 'food',
            userFeedback: editingItem ? editingItem.userFeedback : null,
            macrosOverridden: userDidOverrideMacros,
        };
        if (editingItem) {
            updateTimelineEntry(processedFoodItem);
        } else {
            addTimelineEntry(processedFoodItem);
        }
    } finally {
      setIsLoadingAi(prev => ({ ...prev, [currentItemId]: false }));
    }
  };

  const handleProcessAndLogPhotoIdentification = async (
    photoData: IdentifiedPhotoData,
    customTimestamp?: Date
  ) => {
    const currentItemId = `food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setIsLoadingAi(prev => ({ ...prev, [currentItemId]: true }));

    let processedFoodItem: LoggedFoodItem;
    let fodmapAnalysis: AnalyzeFoodItemOutput | undefined;
    let similarityOutput: FoodSimilarityOutput | undefined;
    const logTimestamp = customTimestamp || new Date();

    try {
      fodmapAnalysis = await analyzeFoodItem({
        foodItem: photoData.name,
        ingredients: photoData.ingredients,
        portionSize: photoData.portionSize,
        portionUnit: photoData.portionUnit,
      });

      const itemFodmapProfileForSimilarity: FoodFODMAPProfile = fodmapAnalysis?.detailedFodmapProfile || generateFallbackFodmapProfile(photoData.name);
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
            name: photoData.name,
            portionSize: photoData.portionSize,
            portionUnit: photoData.portionUnit,
            fodmapProfile: itemFodmapProfileForSimilarity
          },
          userSafeFoodItems: safeFoodItemsForSimilarity,
        });
        isSimilar = similarityOutput?.isSimilar ?? false;
      }

      processedFoodItem = {
        name: photoData.name,
        ingredients: photoData.ingredients,
        portionSize: photoData.portionSize,
        portionUnit: photoData.portionUnit,
        id: currentItemId,
        timestamp: logTimestamp,
        fodmapData: fodmapAnalysis,
        isSimilarToSafe: isSimilar,
        userFodmapProfile: itemFodmapProfileForSimilarity,
        calories: fodmapAnalysis?.calories,
        protein: fodmapAnalysis?.protein,
        carbs: fodmapAnalysis?.carbs,
        fat: fodmapAnalysis?.fat,
        entryType: 'food',
        userFeedback: null,
        macrosOverridden: false,
        sourceDescription: "Identified by photo",
      };

      if (authUser && authUser.uid !== 'guest-user') {
        const { id, ...itemToSave } = processedFoodItem;
        const docRefPath = doc(db, 'users', authUser.uid, 'timelineEntries', currentItemId);
        await setDoc(docRefPath, { ...itemToSave, timestamp: Timestamp.fromDate(processedFoodItem.timestamp as Date) });
        toast({ title: "Food Logged from Photo", description: `${processedFoodItem.name} added with AI analysis.` });
      } else {
         toast({ title: "Food Logged from Photo (Locally)", description: `${processedFoodItem.name} added. Login to save.` });
      }

      addTimelineEntry(processedFoodItem);
      if (customTimestamp) setSelectedLogDateForPreviousMeal(undefined);
      setIsIdentifyByPhotoDialogOpen(false);

    } catch (error: any) {
      console.error('AI analysis or food logging from photo failed:', error);
      toast({ title: 'Error Processing Photo Log', description: `Could not log food from photo. AI analysis might have failed.`, variant: 'destructive' });
      processedFoodItem = {
        name: photoData.name,
        ingredients: photoData.ingredients,
        portionSize: photoData.portionSize,
        portionUnit: photoData.portionUnit,
        id: currentItemId,
        timestamp: logTimestamp,
        isSimilarToSafe: similarityOutput?.isSimilar ?? false,
        entryType: 'food',
        fodmapData: undefined,
        userFodmapProfile: fodmapAnalysis?.detailedFodmapProfile || generateFallbackFodmapProfile(photoData.name),
        calories: undefined, protein: undefined, carbs: undefined, fat: undefined,
        userFeedback: null,
        macrosOverridden: false,
        sourceDescription: "Identified by photo (analysis partially failed)",
      };
      addTimelineEntry(processedFoodItem);
    } finally {
      setIsLoadingAi(prev => ({ ...prev, [currentItemId]: false }));
    }
  };


  const handleSubmitManualMacroEntry = async (
    entryData: Omit<LoggedFoodItem, 'id' | 'timestamp' | 'entryType' | 'ingredients' | 'portionSize' | 'portionUnit' | 'fodmapData' | 'isSimilarToSafe' | 'userFodmapProfile' | 'sourceDescription' | 'userFeedback' | 'macrosOverridden'> & { entryType: 'manual_macro' | 'food' },
    customTimestamp?: Date
  ) => {
    const currentItemId = editingItem ? editingItem.id : `macro-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const logTimestamp = customTimestamp || (editingItem ? editingItem.timestamp : new Date());
    const newEntry: LoggedFoodItem = {
      ...entryData,
      id: currentItemId,
      timestamp: logTimestamp,
      entryType: 'manual_macro',
      ingredients: "Manual entry",
      portionSize: "1",
      portionUnit: "serving",
      userFeedback: editingItem ? editingItem.userFeedback : null,
      macrosOverridden: true,
    };

    if (authUser && authUser.uid !== 'guest-user') {
      const { id, ...itemToSave } = newEntry;
      const docRefPath = doc(db, 'users', authUser.uid, 'timelineEntries', currentItemId);
      try {
        if (editingItem) {
          await updateDoc(docRefPath, { ...itemToSave, timestamp: Timestamp.fromDate(newEntry.timestamp as Date) });
          toast({ title: "Manual Macros Updated", description: `${newEntry.name} updated.` });
        } else {
          await setDoc(docRefPath, { ...itemToSave, timestamp: Timestamp.fromDate(newEntry.timestamp as Date) });
          toast({ title: "Manual Macros Logged", description: `${newEntry.name} added to timeline.` });
        }
      } catch (error: any) {
        console.error("Error saving/updating manual macro entry to Firestore:", error);
        toast({ title: "Save Error", description: `Could not ${editingItem ? 'update' : 'save'} manual macro entry.`, variant: "destructive" });
        return;
      }
    } else {
      toast({ title: editingItem ? "Manual Macros Updated (Locally)" : "Manual Macros Logged (Locally)", description: `${newEntry.name} ${editingItem ? 'updated' : 'added'}. Login to save.` });
    }

    if (editingItem) {
      updateTimelineEntry(newEntry);
    } else {
      addTimelineEntry(newEntry);
    }
    setIsAddManualMacroDialogOpen(false);
    setEditingItem(null);
    if (customTimestamp) setSelectedLogDateForPreviousMeal(undefined);
  };

  const handleEditTimelineEntry = (itemToEdit: LoggedFoodItem) => {
    setEditingItem(itemToEdit);
    if (itemToEdit.entryType === 'manual_macro') {
      setIsAddManualMacroDialogOpen(true);
    } else if (itemToEdit.entryType === 'food') {
      if (itemToEdit.sourceDescription && !itemToEdit.sourceDescription.startsWith("Identified by photo")) {
        setIsSimplifiedAddFoodDialogOpen(true);
      } else {
        setIsAddFoodDialogOpen(true);
      }
    }
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
            toast({ title: "Symptoms Logged (Locally)", description: "Could not save to cloud. Logged locally.", variant: "destructive" });
        }
    } else {
        toast({ title: "Symptoms Logged (Locally)", description: "Login to save your symptoms." });
    }

    addTimelineEntry(newSymptomLog);
    setIsSymptomLogDialogOpen(false);
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
    setIsSymptomLogDialogOpen(true);
  };


  const handleSimplifiedLogFoodClick = () => {
    setEditingItem(null);
    setIsSimplifiedAddFoodDialogOpen(true);
  };

  const handleIdentifyByPhotoClick = () => {
    setEditingItem(null);
    setIsIdentifyByPhotoDialogOpen(true);
  };

  const handleLogPreviousMealFlow = (logMethod: 'AI' | 'Manual' | 'Photo') => {
    
    setIsSimplifiedAddFoodDialogOpen(false);
    setIsAddFoodDialogOpen(false);
    setIsIdentifyByPhotoDialogOpen(false);
    setEditingItem(null);

    if (logMethod === 'AI') {
      setIsSimplifiedAddFoodDialogOpen(true);
    } else if (logMethod === 'Manual') {
      setIsAddFoodDialogOpen(true);
    } else if (logMethod === 'Photo') {
      setIsIdentifyByPhotoDialogOpen(true);
    }
  };


  const handleOpenLogPreviousMealDialog = () => {
    setEditingItem(null);
    setSelectedLogDateForPreviousMeal(new Date()); 
    setIsLogPreviousMealDialogOpen(true);
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


  const handleGuestLogFoodOpen = () => {
    setEditingItem(null);
    setIsGuestLogFoodDialogOpen(true);
  };

  const handleGuestProcessMealDescription = async (formData: SimplifiedFoodLogFormValues) => {
    const newItemId = `guest-food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setIsLoadingAi(prev => ({ ...prev, [newItemId]: true }));

    let mealDescriptionOutput: ProcessMealDescriptionOutput | undefined;
    let fodmapAnalysis: AnalyzeFoodItemOutput | undefined;
    let newFoodItem: LoggedFoodItem;

    try {
      mealDescriptionOutput = await processMealDescription({ mealDescription: formData.mealDescription });
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
        sourceDescription: formData.mealDescription,
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
        macrosOverridden: false,
      };
      setLastGuestFoodItem(newFoodItem);
      toast({title: "Meal Noted (Locally)", description: "Sign in with Google to save and track!"});
      setIsGuestSheetOpen(true);
    } catch (error: any) {
        console.error('Guest AI meal processing failed:', error);
        toast({ title: "Error Noting Meal", description: "Could not analyze meal.", variant: 'destructive' });
        
    } finally {
      setIsLoadingAi(prev => ({ ...prev, [newItemId]: false }));
      setIsGuestLogFoodDialogOpen(false);
    }
  };

  const handleGuestSetFoodFeedback = (itemId: string, feedback: 'safe' | 'unsafe' | null) => {
    if (lastGuestFoodItem && lastGuestFoodItem.id === itemId) {
        setLastGuestFoodItem(prev => prev ? ({ ...prev, userFeedback: feedback }) : null);
    }
  };

  const handleGuestRemoveFoodItem = (itemId: string) => {
     if (lastGuestFoodItem && lastGuestFoodItem.id === itemId) {
        setLastGuestFoodItem(null);
        setIsGuestSheetOpen(false); 
     }
  };

  const handleRepeatMeal = async (itemToRepeat: LoggedFoodItem) => {
    const newItemId = `food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setIsLoadingAi(prev => ({ ...prev, [newItemId]: true }));
    const newTimestamp = new Date();
    let processedFoodItem: LoggedFoodItem;

    try {
      let fodmapAnalysis: AnalyzeFoodItemOutput | undefined;
      let similarityOutput: FoodSimilarityOutput | undefined;
      let mealDescriptionOutput: ProcessMealDescriptionOutput | undefined;

      const baseRepetitionData = {
        id: newItemId,
        timestamp: newTimestamp,
        isSimilarToSafe: false, 
        userFodmapProfile: undefined, 
        calories: undefined, protein: undefined, carbs: undefined, fat: undefined,
        entryType: 'food' as 'food',
        userFeedback: null, 
        macrosOverridden: itemToRepeat.macrosOverridden || false,
      };

      if (itemToRepeat.sourceDescription && !itemToRepeat.sourceDescription.startsWith("Identified by photo")) {
        
        mealDescriptionOutput = await processMealDescription({ mealDescription: itemToRepeat.sourceDescription });
        fodmapAnalysis = await analyzeFoodItem({
          foodItem: mealDescriptionOutput.primaryFoodItemForAnalysis,
          ingredients: mealDescriptionOutput.consolidatedIngredients,
          portionSize: mealDescriptionOutput.estimatedPortionSize,
          portionUnit: mealDescriptionOutput.estimatedPortionUnit,
        });
        
        const itemFodmapProfileForSimilarity: FoodFODMAPProfile = fodmapAnalysis?.detailedFodmapProfile || generateFallbackFodmapProfile(mealDescriptionOutput.primaryFoodItemForAnalysis);
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
        }

        processedFoodItem = {
          ...baseRepetitionData,
          name: mealDescriptionOutput.wittyName, 
          originalName: mealDescriptionOutput.primaryFoodItemForAnalysis,
          ingredients: mealDescriptionOutput.consolidatedIngredients,
          portionSize: mealDescriptionOutput.estimatedPortionSize,
          portionUnit: mealDescriptionOutput.estimatedPortionUnit,
          sourceDescription: itemToRepeat.sourceDescription,
          fodmapData: fodmapAnalysis,
          isSimilarToSafe: similarityOutput?.isSimilar ?? false,
          userFodmapProfile: itemFodmapProfileForSimilarity,
          calories: itemToRepeat.macrosOverridden ? itemToRepeat.calories : fodmapAnalysis?.calories,
          protein: itemToRepeat.macrosOverridden ? itemToRepeat.protein : fodmapAnalysis?.protein,
          carbs: itemToRepeat.macrosOverridden ? itemToRepeat.carbs : fodmapAnalysis?.carbs,
          fat: itemToRepeat.macrosOverridden ? itemToRepeat.fat : fodmapAnalysis?.fat,
        };

      } else { 
        fodmapAnalysis = await analyzeFoodItem({
          foodItem: itemToRepeat.originalName || itemToRepeat.name,
          ingredients: itemToRepeat.ingredients,
          portionSize: itemToRepeat.portionSize,
          portionUnit: itemToRepeat.portionUnit,
        });

        const itemFodmapProfileForSimilarity: FoodFODMAPProfile = fodmapAnalysis?.detailedFodmapProfile || generateFallbackFodmapProfile(itemToRepeat.originalName || itemToRepeat.name);
        if (userProfile.safeFoods && userProfile.safeFoods.length > 0) {
           const safeFoodItemsForSimilarity = userProfile.safeFoods.map(sf => ({
              name: sf.name,
              portionSize: sf.portionSize,
              portionUnit: sf.portionUnit,
              fodmapProfile: sf.fodmapProfile,
          }));
          similarityOutput = await isSimilarToSafeFoods({
            currentFoodItem: {
              name: itemToRepeat.originalName || itemToRepeat.name,
              portionSize: itemToRepeat.portionSize,
              portionUnit: itemToRepeat.portionUnit,
              fodmapProfile: itemFodmapProfileForSimilarity
            },
            userSafeFoodItems: safeFoodItemsForSimilarity,
          });
        }
        
        processedFoodItem = {
          ...baseRepetitionData,
          name: itemToRepeat.name, 
          originalName: itemToRepeat.originalName || itemToRepeat.name,
          ingredients: itemToRepeat.ingredients,
          portionSize: itemToRepeat.portionSize,
          portionUnit: itemToRepeat.portionUnit,
          sourceDescription: itemToRepeat.sourceDescription,
          fodmapData: fodmapAnalysis,
          isSimilarToSafe: similarityOutput?.isSimilar ?? false,
          userFodmapProfile: itemFodmapProfileForSimilarity,
          calories: itemToRepeat.macrosOverridden ? itemToRepeat.calories : fodmapAnalysis?.calories,
          protein: itemToRepeat.macrosOverridden ? itemToRepeat.protein : fodmapAnalysis?.protein,
          carbs: itemToRepeat.macrosOverridden ? itemToRepeat.carbs : fodmapAnalysis?.carbs,
          fat: itemToRepeat.macrosOverridden ? itemToRepeat.fat : fodmapAnalysis?.fat,
        };
      }

      if (authUser && authUser.uid !== 'guest-user') {
        const { id, ...itemToSave } = processedFoodItem;
        const docRefPath = doc(db, 'users', authUser.uid, 'timelineEntries', newItemId);
        await setDoc(docRefPath, { ...itemToSave, timestamp: Timestamp.fromDate(processedFoodItem.timestamp as Date) });
        toast({ title: "Meal Repeated & Saved", description: `"${processedFoodItem.name}" added with fresh AI analysis.` });
      } else {
        toast({ title: "Meal Repeated (Locally)", description: `"${processedFoodItem.name}" added. Login to save.` });
      }
      addTimelineEntry(processedFoodItem);
    } catch (error: any) {
      console.error('Error repeating meal:', error);
      toast({ title: 'Error Repeating Meal', description: `Could not repeat the meal. AI analysis might have failed.`, variant: 'destructive' });
       
       processedFoodItem = {
        ...baseRepetitionData,
        name: itemToRepeat.name + " (Repeat Failed)",
        originalName: itemToRepeat.originalName,
        ingredients: itemToRepeat.ingredients,
        portionSize: itemToRepeat.portionSize,
        portionUnit: itemToRepeat.portionUnit,
        sourceDescription: itemToRepeat.sourceDescription,
        fodmapData: undefined,
        userFodmapProfile: itemToRepeat.userFodmapProfile,
        calories: itemToRepeat.calories, protein: itemToRepeat.protein, carbs: itemToRepeat.carbs, fat: itemToRepeat.fat,
        macrosOverridden: itemToRepeat.macrosOverridden,
      };
      addTimelineEntry(processedFoodItem);
    } finally {
      setIsLoadingAi(prev => ({ ...prev, [newItemId]: false }));
    }
  };


  if (authLoading || (isDataLoading && authUser) ) { 
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
         <p className="ml-4 text-lg text-foreground">
            {authLoading ? "Authenticating..." : "Loading your GutCheck dashboard..."}
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
            onSubmitLog={(data, userDidOverrideMacros) => handleGuestProcessMealDescription(data)}
            isGuestView={true}
            key={editingItem ? `edit-${editingItem.id}` : 'guest-new'}
        />
      </>
    );
  }

  
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
      <Navbar
        onOpenDashboardClick={() => setIsPremiumDashboardOpen(true)}
        onLogFoodAIClick={handleSimplifiedLogFoodClick}
        onIdentifyByPhotoClick={handleIdentifyByPhotoClick}
        onLogSymptomsClick={() => openSymptomDialog()}
        onLogPreviousMealClick={handleOpenLogPreviousMealDialog}
        className="z-50"
      />

      
      <div className="flex-grow flex flex-col items-center justify-start pt-0 overflow-y-auto">
        <LandingPageClientContent />
      </div>

      <PremiumDashboardSheet
        isOpen={isPremiumDashboardOpen}
        onOpenChange={setIsPremiumDashboardOpen}
        userProfile={userProfile}
        timelineEntries={timelineEntries}
        dailyNutritionSummary={dailyNutritionSummary}
        isLoadingAi={isLoadingAi}
        onSetFeedback={handleSetFoodFeedback}
        onRemoveTimelineEntry={handleRemoveTimelineEntry}
        onLogSymptomsForFood={openSymptomDialog}
        onEditIngredients={handleEditTimelineEntry}
        onRepeatMeal={handleRepeatMeal}
      >
        
      </PremiumDashboardSheet>


      
      <SimplifiedAddFoodDialog
        isOpen={isSimplifiedAddFoodDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditingItem(null);
            setSelectedLogDateForPreviousMeal(undefined);
          }
          setIsSimplifiedAddFoodDialogOpen(open);
        }}
        onSubmitLog={(data, userDidOverrideMacros) => handleSubmitMealDescription(data, userDidOverrideMacros, selectedLogDateForPreviousMeal)}
        isEditing={!!editingItem && editingItem.entryType === 'food' && !!editingItem.sourceDescription && !editingItem.sourceDescription.startsWith("Identified by photo")}
        initialValues={editingItem && editingItem.entryType === 'food' && editingItem.sourceDescription && !editingItem.sourceDescription.startsWith("Identified by photo") ?
            {
              mealDescription: editingItem.sourceDescription,
              calories: editingItem.calories,
              protein: editingItem.protein,
              carbs: editingItem.carbs,
              fat: editingItem.fat
            }
            : { mealDescription: '' }}
        initialMacrosOverridden={editingItem?.macrosOverridden || false}
        isGuestView={false}
        key={editingItem?.id ? `edit-simplified-${editingItem.id}` : 'new-simplified'}
      />
      <IdentifyFoodByPhotoDialog
        isOpen={isIdentifyByPhotoDialogOpen}
        onOpenChange={(open) => {
          if (!open) setSelectedLogDateForPreviousMeal(undefined);
          setIsIdentifyByPhotoDialogOpen(open);
        }}
        onFoodIdentified={(data) => handleProcessAndLogPhotoIdentification(data, selectedLogDateForPreviousMeal)}
      />
      <AddFoodItemDialog
          isOpen={isAddFoodDialogOpenState}
          onOpenChange={(open) => {
              if (!open) {
                setEditingItem(null);
                setSelectedLogDateForPreviousMeal(undefined);
              }
              setIsAddFoodDialogOpen(open);
          }}
          onSubmitFoodItem={(data) => handleSubmitFoodItem(data, selectedLogDateForPreviousMeal)}
          isEditing={!!editingItem && editingItem.entryType === 'food' && (!editingItem.sourceDescription || editingItem.sourceDescription.startsWith("Identified by photo"))}
          initialValues={editingItem && editingItem.entryType === 'food' && (!editingItem.sourceDescription || editingItem.sourceDescription.startsWith("Identified by photo"))
                          ? { name: editingItem.name, ingredients: editingItem.ingredients, portionSize: editingItem.portionSize, portionUnit: editingItem.portionUnit }
                          : undefined}
          key={editingItem?.id ? `edit-manual-${editingItem.id}` : 'new-manual'}
      />
      <SymptomLoggingDialog
          isOpen={isSymptomLogDialogOpen}
          onOpenChange={setIsSymptomLogDialogOpen}
          onLogSymptoms={handleLogSymptoms}
          allSymptoms={COMMON_SYMPTOMS}
      />
      <AddManualMacroEntryDialog
          isOpen={isAddManualMacroDialogOpen}
          onOpenChange={(open) => {
              if (!open) {
                setEditingItem(null);
                setSelectedLogDateForPreviousMeal(undefined);
              }
              setIsAddManualMacroDialogOpen(open);
          }}
          onSubmitEntry={(data) => handleSubmitManualMacroEntry(data, selectedLogDateForPreviousMeal)}
          isEditing={!!editingItem && editingItem.entryType === 'manual_macro'}
          initialValues={editingItem && editingItem.entryType === 'manual_macro' ?
            { calories: editingItem.calories, protein: editingItem.protein, carbs: editingItem.carbs, fat: editingItem.fat, entryName: editingItem.name }
            : undefined
          }
          key={editingItem?.id ? `edit-macro-${editingItem.id}` : 'new-macro'}
      />
       <LogPreviousMealDialog
          isOpen={isLogPreviousMealDialogOpen}
          onOpenChange={setIsLogPreviousMealDialogOpen}
          onDateSelect={setSelectedLogDateForPreviousMeal}
          onLogMethodSelect={handleLogPreviousMealFlow}
          currentSelectedDate={selectedLogDateForPreviousMeal}
      />
      {isAnyItemLoadingAi && (
          <div className="fixed bottom-20 right-4 bg-card text-card-foreground p-3 rounded-lg shadow-lg flex items-center space-x-2 z-50">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>AI is analyzing...</span>
          </div>
      )}
    </div>
  );
}
