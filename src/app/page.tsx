
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { LoggedFoodItem, UserProfile, TimelineEntry, Symptom, SymptomLog, SafeFood } from '@/types';
import { COMMON_SYMPTOMS } from '@/types';
import { Loader2, Utensils, PlusCircle, ListChecks, Brain, Activity, Info } from 'lucide-react';
import { analyzeFoodItem, type AnalyzeFoodItemOutput, type FoodFODMAPProfile as DetailedFodmapProfileFromAI } from '@/ai/flows/fodmap-detection';
import { isSimilarToSafeFoods, type FoodFODMAPProfile, type FoodSimilarityOutput } from '@/ai/flows/food-similarity';
import { getSymptomCorrelations, type SymptomCorrelationInput, type SymptomCorrelationOutput } from '@/ai/flows/symptom-correlation-flow';

import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/hooks/use-auth-context';
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
  writeBatch,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import AddFoodItemDialog from '@/components/food-logging/AddFoodItemDialog';
import TimelineFoodCard from '@/components/food-logging/TimelineFoodCard';
import TimelineSymptomCard from '@/components/food-logging/TimelineSymptomCard';
import SymptomLoggingDialog from '@/components/food-logging/SymptomLoggingDialog';
import InsightCard from '@/components/insights/InsightCard';
import BannerAdPlaceholder from '@/components/ads/BannerAdPlaceholder';
import InterstitialAdPlaceholder from '@/components/ads/InterstitialAdPlaceholder';

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

export default function FoodTimelinePage() {
  const { toast } = useToast();
  const { user: authUser, loading: authLoading } = useAuthContext();

  const [userProfile, setUserProfile] = useState<UserProfile>(initialGuestProfile);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState<Record<string, boolean>>({});
  const [isAddFoodDialogOpen, setIsAddFoodDialogOpen] = useState(false);
  const [isSymptomLogDialogOpen, setIsSymptomLogDialogOpen] = useState(false);
  const [symptomDialogContext, setSymptomDialogContext] = useState<{ foodItemIds?: string[] }>({});
  const [aiInsights, setAiInsights] = useState<SymptomCorrelationOutput['insights']>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [showInterstitialAd, setShowInterstitialAd] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);


  const bannerAdUnitId = process.env.NEXT_PUBLIC_BANNER_AD_UNIT_ID;
  const interstitialAdUnitId = process.env.NEXT_PUBLIC_INTERSTITIAL_AD_UNIT_ID;

 useEffect(() => {
    const setupUser = async () => {
      setIsDataLoading(true); // Always start with loading true when auth state might change

      if (authLoading) {
        // Still authenticating, wait for it to resolve
        // isDataLoading remains true
        return;
      }

      if (authUser) {
        // User is logged in
        toast({ title: "User Authenticated", description: "Loading your personalized data..." });
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
            toast({ title: "Profile Loaded", description: "Your settings are up to date." });
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
            toast({ title: "Profile Created!", description: "Welcome! Your new profile is ready." });
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

          if (fetchedEntries.length > 0) {
            toast({ title: "Timeline Loaded", description: "Your food and symptom history is ready." });
          } else {
             toast({ title: "Timeline Ready", description: "Your timeline is empty. Start logging!" });
          }

        } catch (error) {
          console.error("Error loading user data from Firestore:", error);
          toast({ title: "Data Load Error", description: "Could not fetch your saved data. Firestore rules or connection might be an issue.", variant: "destructive" });
           setUserProfile(prev => ({ // Fallback to authUser details but local data for this session
             ...prev,
             uid: authUser.uid,
             email: authUser.email,
             displayName: authUser.displayName,
             safeFoods: prev.safeFoods || [], // Keep local safe foods if any
             premium: prev.premium || false, // Keep local premium if any
           }));
        } finally {
          setIsDataLoading(false);
        }
      } else {
        // User is logged out or guest
        setUserProfile(initialGuestProfile);
        setTimelineEntries([]);
        setAiInsights([]);
        toast({ title: "Guest Mode", description: "Log in to save your data and access personalized insights."});
        setIsDataLoading(false);
      }
    };

    setupUser();
  }, [authUser, authLoading, toast]);


  const addTimelineEntry = (entry: TimelineEntry) => {
    setTimelineEntries(prevEntries => [...prevEntries, entry].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  const handleAddFoodItem = async (
    foodItemData: Omit<LoggedFoodItem, 'id' | 'timestamp' | 'entryType'>
  ) => {
    const newItemId = `food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setIsLoadingAi(prev => ({ ...prev, [newItemId]: true }));

    let newFoodItem: LoggedFoodItem;

    try {
      const fodmapAnalysis: AnalyzeFoodItemOutput = await analyzeFoodItem({
        foodItem: foodItemData.name,
        ingredients: foodItemData.ingredients,
        portionSize: foodItemData.portionSize,
        portionUnit: foodItemData.portionUnit,
      });

      const itemFodmapProfileForSimilarity: FoodFODMAPProfile = fodmapAnalysis.detailedFodmapProfile || generateFallbackFodmapProfile(foodItemData.name);

      let similarityOutput: FoodSimilarityOutput | undefined;
      if (userProfile.safeFoods.length > 0) {
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
      }

      newFoodItem = {
        ...foodItemData,
        id: newItemId,
        timestamp: new Date(),
        fodmapData: fodmapAnalysis,
        isSimilarToSafe: similarityOutput?.isSimilar,
        userFodmapProfile: itemFodmapProfileForSimilarity,
        entryType: 'food',
      };

      if (authUser && authUser.uid !== 'guest-user') {
        const { id, ...itemToSave } = newFoodItem;
        const docRef = await addDoc(collection(db, 'users', authUser.uid, 'timelineEntries'), {
            ...itemToSave,
            timestamp: Timestamp.fromDate(newFoodItem.timestamp)
        });
        newFoodItem.id = docRef.id; // Update with Firestore generated ID
        toast({ title: "Food Logged & Saved", description: `${newFoodItem.name} added with AI analysis.` });
      } else {
        toast({ title: "Food Logged (Locally)", description: `${newFoodItem.name} added with AI analysis. Login to save.` });
      }
      addTimelineEntry(newFoodItem);


    } catch (error: any) {
      console.error('AI analysis or food logging failed:', error);
      let toastTitle = 'Error Logging Food';
      let toastDescription = 'Could not fully process food item. It has been added with available data.';

       if (error?.message && typeof error.message === 'string') {
        const errorMessageLower = error.message.toLowerCase();
        if (errorMessageLower.includes('503') || errorMessageLower.includes('model is overloaded') || errorMessageLower.includes('resource has been exhausted')) {
          toastTitle = 'AI Model Overloaded';
          toastDescription = 'The AI model is temporarily busy or unavailable. Food added without full AI analysis. Please try again later.';
        } else if (errorMessageLower.includes('400') || errorMessageLower.includes('schema validation') || errorMessageLower.includes('invalid argument')) {
          toastTitle = 'AI Analysis Input/Output Error';
          toastDescription = 'There was an issue with the data sent for AI analysis or the AI\'s response format was unexpected. Food added without AI insights.';
        } else if (errorMessageLower.includes('api key') || errorMessageLower.includes('permission denied') || errorMessageLower.includes('authentication failed') || errorMessageLower.includes('credential')) {
            toastTitle = 'AI Service Access Issue';
            toastDescription = 'Could not access the AI service due to an authentication or permission problem. Please check your Google Cloud project setup (APIs, billing, credentials). Food added without AI insights.';
        } else if (errorMessageLower.includes('deadline exceeded') || errorMessageLower.includes('timeout')) {
            toastTitle = 'AI Request Timeout';
            toastDescription = 'The request to the AI service timed out. Food added without AI insights. Please try again.';
        }
      }
      toast({ title: toastTitle, description: toastDescription, variant: 'destructive', duration: 9000 });

      // Fallback: log food item without AI data
      newFoodItem = {
        ...foodItemData,
        id: newItemId,
        timestamp: new Date(),
        entryType: 'food',
      };
       if (authUser && authUser.uid !== 'guest-user') {
        const { id, ...itemToSave } = newFoodItem; // Exclude local ID for Firestore
        try {
            const docRef = await addDoc(collection(db, 'users', authUser.uid, 'timelineEntries'), {
                ...itemToSave,
                timestamp: Timestamp.fromDate(newFoodItem.timestamp)
            });
            newFoodItem.id = docRef.id; // Update with Firestore generated ID
            toast({ title: "Food Logged & Saved (No AI)", description: `${newFoodItem.name} added. AI analysis was skipped or failed.` });
        } catch (saveError) {
            console.error("Error saving partially processed food item to Firestore:", saveError);
            // If even fallback save fails, it's logged locally only.
            toast({ title: "Food Logged (Locally, No AI)", description: `${newFoodItem.name} added. AI analysis and cloud save failed.`, variant: 'destructive'});
        }
      } else {
         toast({ title: "Food Logged (Locally, No AI)", description: `${newFoodItem.name} added. AI analysis failed. Login to save.`, variant: 'destructive'});
      }
      addTimelineEntry(newFoodItem);
    } finally {
      setIsLoadingAi(prev => ({ ...prev, [newItemId]: false }));
      setIsAddFoodDialogOpen(false);
    }
  };

  const handleLogSymptoms = async (symptoms: Symptom[], notes?: string, severity?: number, linkedFoodItemIds?: string[]) => {
    let newSymptomLog: SymptomLog = {
      id: `sym-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      symptoms,
      notes,
      severity,
      linkedFoodItemIds,
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
        } catch (error) {
            console.error("Error saving symptom log to Firestore:", error);
            toast({ title: "Symptoms Logged (Locally)", description: "Could not save symptoms to cloud. Firestore rules or connection might be an issue.", variant: "destructive" });
        }
    } else {
        toast({ title: "Symptoms Logged (Locally)", description: "Login to save your symptoms." });
    }

    addTimelineEntry(newSymptomLog);
    setIsSymptomLogDialogOpen(false);
  };

  const handleMarkAsSafe = async (foodItem: LoggedFoodItem) => {
     if (!foodItem.fodmapData || !foodItem.userFodmapProfile) {
      toast({ title: 'Cannot Mark as Safe', description: 'Detailed FODMAP profile is missing for this item.', variant: 'destructive'});
      return;
    }
    if (userProfile.safeFoods.some(sf => sf.name === foodItem.name && sf.ingredients === foodItem.ingredients && sf.portionSize === foodItem.portionSize && sf.portionUnit === foodItem.portionUnit)) {
      toast({ title: 'Already Safe', description: `${foodItem.name} (${foodItem.portionSize} ${foodItem.portionUnit}) is already in your safe foods list.` });
      return;
    }

    const newSafeFood: SafeFood = {
      id: `safe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: foodItem.name,
      ingredients: foodItem.ingredients,
      portionSize: foodItem.portionSize,
      portionUnit: foodItem.portionUnit,
      fodmapProfile: foodItem.userFodmapProfile,
      originalAnalysis: foodItem.fodmapData,
    };


    if (authUser && authUser.uid !== 'guest-user') {
        const userDocRef = doc(db, 'users', authUser.uid);
        try {
            const updatedSafeFoodsForState = [...userProfile.safeFoods, newSafeFood];
            setUserProfile(prev => ({ ...prev, safeFoods: updatedSafeFoodsForState }));

            await updateDoc(userDocRef, {
                safeFoods: arrayUnion(newSafeFood)
            });
            toast({ title: 'Marked as Safe!', description: `${foodItem.name} added to your safe foods.`, variant: 'default' });
        } catch (error) {
            console.error("Error saving safe food to Firestore:", error);
            setUserProfile(prev => ({ ...prev, safeFoods: prev.safeFoods.filter(sf => sf.id !== newSafeFood.id) }));
            toast({ title: 'Error Saving Safe Food', description: 'Could not save to cloud. Please try again.', variant: 'destructive' });
        }
    } else {
        const updatedSafeFoods = [...userProfile.safeFoods, newSafeFood];
        setUserProfile(prev => ({ ...prev, safeFoods: updatedSafeFoods }));
        toast({ title: 'Marked as Safe (Locally)', description: `${foodItem.name} added. Login to save permanently.`, variant: 'default' });
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
            if (entryToRemove) addTimelineEntry(entryToRemove); // Re-add to local state if cloud delete fails
            toast({ title: "Error Removing Entry", description: "Could not remove entry from cloud. Removed locally.", variant: "destructive" });
        }
    } else {
        toast({ title: "Entry Removed (Locally)", description: "The timeline entry has been removed locally." });
    }
  };

  const openSymptomDialog = (foodItemIds?: string[]) => {
    setSymptomDialogContext({ foodItemIds });
    setIsSymptomLogDialogOpen(true);
  };

  const fetchAiInsightsInternal = useCallback(async () => {
    setIsLoadingInsights(true);
    try {
      const foodLogForAI: SymptomCorrelationInput['foodLog'] = timelineEntries
        .filter((e): e is LoggedFoodItem => e.entryType === 'food')
        .map(e => ({
          id: e.id,
          name: e.name,
          ingredients: e.ingredients,
          portionSize: e.portionSize,
          portionUnit: e.portionUnit,
          timestamp: e.timestamp instanceof Date ? e.timestamp.toISOString() : e.timestamp,
          overallFodmapRisk: e.fodmapData?.overallRisk,
        }));

      const symptomLogForAI: SymptomCorrelationInput['symptomLog'] = timelineEntries
        .filter((e): e is SymptomLog => e.entryType === 'symptom')
        .map(e => ({
          id: e.id,
          linkedFoodItemIds: e.linkedFoodItemIds,
          symptoms: e.symptoms.map(s => ({id: s.id, name: s.name})),
          severity: e.severity,
          notes: e.notes,
          timestamp: e.timestamp instanceof Date ? e.timestamp.toISOString() : e.timestamp,
        }));

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
         if (errorMessageLower.includes('api key') || errorMessageLower.includes('permission denied') || errorMessageLower.includes('authentication failed') || errorMessageLower.includes('credential')) {
            toastTitle = 'AI Insights Access Issue';
            toastDescription = 'Could not access AI for insights due to an authentication or permission problem. Please check Google Cloud project setup.';
        } else if (errorMessageLower.includes('503') || errorMessageLower.includes('model is overloaded')) {
            toastTitle = 'AI Insights Model Overloaded';
            toastDescription = 'The AI model for insights is temporarily busy. Please try again later.';
        }
      }
      toast({title: toastTitle, description: toastDescription, variant: "destructive", duration: 7000});
      setAiInsights([]);
    } finally {
      setIsLoadingInsights(false);
    }
  }, [timelineEntries, userProfile.safeFoods, toast]);

  const triggerFetchAiInsights = useCallback(() => {
    if (timelineEntries.filter(e => e.entryType === 'food').length < 1 && timelineEntries.filter(e => e.entryType === 'symptom').length < 1) {
      setAiInsights([]);
      toast({title: "No Data for Insights", description: "Please log some food items or symptoms first.", variant: "default"});
      return;
    }
    if (!userProfile.premium && authUser && authUser.uid !== 'guest-user') {
      setShowInterstitialAd(true);
    } else {
      fetchAiInsightsInternal();
    }
  }, [timelineEntries, userProfile.premium, fetchAiInsightsInternal, authUser, toast]);

  useEffect(() => {
    if (timelineEntries.length === 0 && !isDataLoading && authUser) { // Clear insights if timeline is empty for a logged-in user post-load
        setAiInsights([]);
    }
  }, [timelineEntries, isDataLoading, authUser]);

  const handleUpgradeToPremium = async () => {
    if (authUser && authUser.uid !== 'guest-user') {
        const userDocRef = doc(db, 'users', authUser.uid);
        try {
            await updateDoc(userDocRef, { premium: true });
            setUserProfile(prev => ({ ...prev, premium: true }));
            toast({ title: "Upgrade Successful!", description: "You are now a Premium user. Ads have been removed." });
        } catch (error) {
            console.error("Error updating premium status in Firestore:", error);
            toast({ title: "Upgrade Failed", description: "Could not save premium status to cloud. Please try again.", variant: "destructive"});
        }
    } else {
        // For guest or unauthenticated user, only update local state.
        setUserProfile(prev => ({ ...prev, premium: true }));
        toast({ title: "Premium Activated (Locally)", description: "Ads removed for this session. Login to save premium status." });
    }
  };

  const handleInterstitialClosed = (continuedToInsights: boolean) => {
    setShowInterstitialAd(false);
    if (continuedToInsights) {
      fetchAiInsightsInternal();
    }
  };

  const isAnyItemLoadingAi = Object.values(isLoadingAi).some(loading => loading);

  if (authLoading || (isDataLoading && !authUser)) { // Show full page loader if auth is loading, or if data is loading AND user is not yet determined
     return (
      <div className="flex items-center justify-center min-h-[calc(100vh-128px)] bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
         <p className="ml-4 text-lg text-foreground">{authLoading ? "Authenticating..." : "Initializing..."}</p>
      </div>
    );
  }
  
  // If auth is done, but data is still loading for an authenticated user, show a more nuanced loading state
  if (isDataLoading && authUser) {
     return (
      <div className="flex items-center justify-center min-h-[calc(100vh-128px)] bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
         <p className="ml-4 text-lg text-foreground">Loading your data...</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-16 bg-background/80 backdrop-blur-md z-40 py-6 mb-6 shadow-xl rounded-b-2xl"> {/* Navbar height is h-16, so sticky top-16 */}
        <div className="container mx-auto flex flex-col items-center gap-4">
          <Button
            size="lg"
            className="w-72 h-20 text-2xl rounded-full shadow-2xl bg-white text-black hover:bg-gray-200 focus:ring-4 focus:ring-gray-300 flex items-center justify-center"
            onClick={() => setIsAddFoodDialogOpen(true)}
            aria-label="Log Food"
          >
            <PlusCircle className="mr-3 h-8 w-8" /> Tap to Log Food
          </Button>
          <div className="flex flex-wrap justify-center gap-3 mt-3">
            <Button variant="outline" className="border-accent text-accent-foreground hover:bg-accent/20" onClick={() => openSymptomDialog()}>
              <ListChecks className="mr-2 h-5 w-5" /> Log Symptoms
            </Button>
            <Button variant="outline" className="border-accent text-accent-foreground hover:bg-accent/20" onClick={triggerFetchAiInsights} disabled={isLoadingInsights || (showInterstitialAd && authUser && authUser.uid !== 'guest-user' && !userProfile.premium) }>
              {isLoadingInsights ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Brain className="mr-2 h-5 w-5" />}
              Get Insights
            </Button>
          </div>
        </div>
      </header>

      <AddFoodItemDialog
        isOpen={isAddFoodDialogOpen}
        onOpenChange={setIsAddFoodDialogOpen}
        onAddFoodItem={handleAddFoodItem}
      />
      <SymptomLoggingDialog
        isOpen={isSymptomLogDialogOpen}
        onOpenChange={setIsSymptomLogDialogOpen}
        onLogSymptoms={handleLogSymptoms}
        context={symptomDialogContext}
        allSymptoms={COMMON_SYMPTOMS}
      />
      {showInterstitialAd && authUser && authUser.uid !== 'guest-user' && !userProfile.premium && (
        <InterstitialAdPlaceholder
          isOpen={showInterstitialAd}
          onClose={() => handleInterstitialClosed(false)}
          onContinue={() => handleInterstitialClosed(true)}
          adUnitId={interstitialAdUnitId}
        />
      )}

      {isAnyItemLoadingAi && (
        <div className="fixed bottom-4 right-4 bg-accent text-accent-foreground p-3 rounded-lg shadow-lg flex items-center space-x-2 z-50">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>AI is analyzing...</span>
        </div>
      )}

      <main className="flex-grow container mx-auto px-2 sm:px-4 py-2">
        {aiInsights.length > 0 && (
          <Card className="mb-6 bg-card border-border shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-xl sm:text-2xl flex items-center text-foreground">
                <Brain className="mr-3 h-6 w-6 sm:h-7 sm:w-7 text-gray-400" /> AI Insights
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
          {timelineEntries.length === 0 && !isAnyItemLoadingAi && !isDataLoading && (
            <Card className="text-center py-12 bg-card border-border shadow-md">
              <CardContent>
                <Utensils className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold font-headline mb-2 text-foreground">Your Timeline is Empty</h2>
                <p className="text-muted-foreground mb-6">Tap the central button to log your first food item or symptom.</p>
                 {!authUser && <p className="text-muted-foreground">Consider <Link href="/login" className="underline text-primary">logging in</Link> to save your data.</p>}
              </CardContent>
            </Card>
          )}

          {timelineEntries.map(entry => {
            if (entry.entryType === 'food') {
              return (
                <TimelineFoodCard
                  key={entry.id}
                  item={entry}
                  onMarkAsSafe={handleMarkAsSafe}
                  onRemoveItem={() => handleRemoveTimelineEntry(entry.id)}
                  onLogSymptoms={() => openSymptomDialog([entry.id])}
                  isSafeFood={userProfile.safeFoods.some(sf => sf.name === entry.name && sf.ingredients === entry.ingredients && sf.portionSize === entry.portionSize && sf.portionUnit === entry.portionUnit)}
                  isLoadingAi={!!isLoadingAi[entry.id]}
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
              <Activity className="mr-3 h-6 w-6 sm:h-7 sm:w-7 text-gray-400" />
              Your Safe Foods
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userProfile.safeFoods.length === 0 ? (
              <p className="text-muted-foreground">You haven&apos;t marked any foods as safe yet. Log foods and use the "Mark as Safe" button!</p>
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
                        {/* TODO: Add a button to remove safe food from here if needed */}
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
             {authUser && authUser.uid !== 'guest-user' && !userProfile.premium && (
                <div className="mt-6 text-center">
                    <Button onClick={handleUpgradeToPremium} className="bg-gray-200 text-black hover:bg-gray-300">
                        Upgrade to Premium - Remove Ads
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">Current Status: Free User</p>
                </div>
            )}
            {authUser && userProfile.premium && (
                 <p className="text-sm text-center text-green-400 mt-4">Premium User - Ads Removed</p>
            )}
             {!authUser && (
                 <p className="text-sm text-center text-muted-foreground mt-4">
                    <Link href="/login" className="underline text-primary">Login</Link> to save your safe foods and sync across devices.
                </p>
            )}
          </CardContent>
        </Card>
         <div className="py-8 text-center">
            <Info className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
                FODMAPSafe helps you track food and symptoms.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
                This app is not a substitute for professional medical advice.
            </p>
        </div>
      </main>
    </div>
  );
}
