
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { LoggedFoodItem, UserProfile, TimelineEntry, Symptom, SymptomLog } from '@/types';
import { COMMON_SYMPTOMS } from '@/types';
import { Loader2, Utensils, PlusCircle, ListChecks, Brain, Activity, Info } from 'lucide-react';
import { analyzeFoodItem, type AnalyzeFoodItemOutput, type FoodFODMAPProfile as DetailedFodmapProfileFromAI } from '@/ai/flows/fodmap-detection';
import { isSimilarToSafeFoods, type FoodFODMAPProfile, type FoodSimilarityOutput } from '@/ai/flows/food-similarity';
import { getSymptomCorrelations, type SymptomCorrelationInput, type SymptomCorrelationOutput } from '@/ai/flows/symptom-correlation-flow';

import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/hooks/use-auth-context'; // Import useAuthContext
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
  const { user: authUser, loading: authLoading } = useAuthContext(); // Get auth user

  const [userProfile, setUserProfile] = useState<UserProfile>(initialGuestProfile);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState<Record<string, boolean>>({});
  const [isAddFoodDialogOpen, setIsAddFoodDialogOpen] = useState(false);
  const [isSymptomLogDialogOpen, setIsSymptomLogDialogOpen] = useState(false);
  const [symptomDialogContext, setSymptomDialogContext] = useState<{ foodItemIds?: string[] }>({});
  const [aiInsights, setAiInsights] = useState<SymptomCorrelationOutput['insights']>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [showInterstitialAd, setShowInterstitialAd] = useState(false);

  const bannerAdUnitId = process.env.NEXT_PUBLIC_BANNER_AD_UNIT_ID;
  const interstitialAdUnitId = process.env.NEXT_PUBLIC_INTERSTITIAL_AD_UNIT_ID;

  // Effect to update userProfile when authUser changes
  useEffect(() => {
    if (!authLoading) {
      if (authUser) {
        // TODO: Load user-specific data (safeFoods, premium status) from Firestore here
        setUserProfile({
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName,
          safeFoods: [], // Placeholder, should be loaded from Firestore
          premium: false, // Placeholder, should be loaded from Firestore
        });
        // Clear timeline if user changes, or load user-specific timeline
        setTimelineEntries([]); 
        setAiInsights([]);
      } else {
        setUserProfile(initialGuestProfile);
        setTimelineEntries([]);
        setAiInsights([]);
      }
    }
  }, [authUser, authLoading]);


  const addTimelineEntry = (entry: TimelineEntry) => {
    setTimelineEntries(prevEntries => [...prevEntries, entry].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  const handleAddFoodItem = async (
    foodItemData: Omit<LoggedFoodItem, 'id' | 'timestamp' | 'entryType'>
  ) => {
    const newItemId = `food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setIsLoadingAi(prev => ({ ...prev, [newItemId]: true }));

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
      
      const newFoodItem: LoggedFoodItem = {
        ...foodItemData,
        id: newItemId,
        timestamp: new Date(),
        fodmapData: fodmapAnalysis,
        isSimilarToSafe: similarityOutput?.isSimilar,
        userFodmapProfile: itemFodmapProfileForSimilarity,
        entryType: 'food',
      };
      addTimelineEntry(newFoodItem);
      toast({ title: "Food Logged", description: `${newFoodItem.name} added to your timeline.` });

    } catch (error: any) {
      console.error('AI analysis or food logging failed:', error);
      let toastTitle = 'Error Logging Food';
      let toastDescription = 'Could not fully process food item. It has been added with available data.';

       if (error?.message && typeof error.message === 'string') {
        if (error.message.includes('503') || error.message.toLowerCase().includes('model is overloaded')) {
          toastTitle = 'AI Model Overloaded';
          toastDescription = 'The AI model is temporarily busy. Food added without full AI analysis. Please try editing or re-analyzing later.';
        } else if (error.message.includes('400') || error.message.toLowerCase().includes('schema')) {
          toastTitle = 'AI Analysis Input Error';
          toastDescription = 'There was an issue with the data sent for AI analysis. Food added without AI insights.';
        }
      }
      toast({ title: toastTitle, description: toastDescription, variant: 'destructive' });
      
      const newFoodItem: LoggedFoodItem = { 
        ...foodItemData,
        id: newItemId,
        timestamp: new Date(),
        entryType: 'food',
      };
      addTimelineEntry(newFoodItem);
    } finally {
      setIsLoadingAi(prev => ({ ...prev, [newItemId]: false }));
      setIsAddFoodDialogOpen(false);
    }
  };

  const handleLogSymptoms = (symptoms: Symptom[], notes?: string, severity?: number, linkedFoodItemIds?: string[]) => {
    const newSymptomLog: SymptomLog = {
      id: `sym-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      symptoms,
      notes,
      severity,
      linkedFoodItemIds,
      timestamp: new Date(),
      entryType: 'symptom',
    };
    addTimelineEntry(newSymptomLog);
    toast({ title: "Symptoms Logged", description: "Your symptoms have been added to the timeline." });
    setIsSymptomLogDialogOpen(false);
  };

  const handleMarkAsSafe = (foodItem: LoggedFoodItem) => {
     if (!foodItem.fodmapData || !foodItem.userFodmapProfile) {
      toast({ title: 'Cannot Mark as Safe', description: 'Detailed FODMAP profile is missing for this item.', variant: 'destructive'});
      return;
    }
    if (userProfile.safeFoods.some(sf => sf.name === foodItem.name && sf.ingredients === foodItem.ingredients && sf.portionSize === foodItem.portionSize && sf.portionUnit === foodItem.portionUnit)) {
      toast({ title: 'Already Safe', description: `${foodItem.name} (${foodItem.portionSize} ${foodItem.portionUnit}) is already in your safe foods list.` });
      return;
    }

    const newSafeFood: SafeFood = {
      id: `safe-${Date.now()}`, 
      name: foodItem.name,
      ingredients: foodItem.ingredients,
      portionSize: foodItem.portionSize,
      portionUnit: foodItem.portionUnit,
      fodmapProfile: foodItem.userFodmapProfile, 
      originalAnalysis: foodItem.fodmapData,
    };
    setUserProfile(prev => {
        const updatedProfile = {
         ...prev,
          safeFoods: [...prev.safeFoods, newSafeFood],
        };
        // TODO: If authUser exists, save updatedProfile.safeFoods to Firestore for authUser.uid
        return updatedProfile;
    });
    toast({ title: 'Marked as Safe!', description: `${foodItem.name} (${foodItem.portionSize} ${foodItem.portionUnit}) added to your safe foods.`, variant: 'default' });
  };

  const handleRemoveTimelineEntry = (entryId: string) => {
    setTimelineEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
    setIsLoadingAi(prev => {
      const newState = {...prev};
      delete newState[entryId];
      return newState;
    });
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
          timestamp: e.timestamp.toISOString(),
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
          timestamp: e.timestamp.toISOString(),
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
    } catch (error) {
      console.error("Failed to fetch AI insights:", error);
      toast({title: "Error Fetching Insights", description: "Could not retrieve AI-powered insights at this time.", variant: "destructive"});
      setAiInsights([]);
    } finally {
      setIsLoadingInsights(false);
    }
  }, [timelineEntries, userProfile.safeFoods, toast]);

  const triggerFetchAiInsights = useCallback(() => {
    if (timelineEntries.filter(e => e.entryType === 'food').length < 1 && timelineEntries.filter(e => e.entryType === 'symptom').length < 1) {
      setAiInsights([]);
      return;
    }
    if (!userProfile.premium && authUser) { // Only show ad if logged in and not premium
      setShowInterstitialAd(true);
    } else {
      fetchAiInsightsInternal();
    }
  }, [timelineEntries, userProfile.premium, fetchAiInsightsInternal, authUser]);

  useEffect(() => {
    if (timelineEntries.length === 0) {
        setAiInsights([]); 
    }
  }, [timelineEntries]);

  const handleUpgradeToPremium = () => {
    setUserProfile(prev => {
        const updatedProfile = { ...prev, premium: true };
        // TODO: If authUser exists, save updatedProfile.premium to Firestore for authUser.uid
        if (authUser) {
            console.log(`Simulating saving premium status for user ${authUser.uid} to Firestore.`);
        }
        return updatedProfile;
    });
    toast({ title: "Upgrade Successful!", description: "You are now a Premium user. Ads have been removed." });
  };

  const handleInterstitialClosed = (continuedToInsights: boolean) => {
    setShowInterstitialAd(false);
    if (continuedToInsights) {
      fetchAiInsightsInternal();
    }
  };

  const isAnyItemLoadingAi = Object.values(isLoadingAi).some(loading => loading);

  if (authLoading) {
     return (
      <div className="flex items-center justify-center min-h-[calc(100vh-128px)] bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-[calc(var(--navbar-height,64px)+0.5rem)] bg-background/80 backdrop-blur-md z-40 py-6 mb-6 shadow-xl rounded-b-2xl">
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
            <Button variant="outline" className="border-accent text-accent-foreground hover:bg-accent/20" onClick={triggerFetchAiInsights} disabled={isLoadingInsights || (showInterstitialAd && authUser && !userProfile.premium) }>
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
      {showInterstitialAd && authUser && !userProfile.premium && (
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
          {timelineEntries.length === 0 && !isAnyItemLoadingAi && (
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
        
        {authUser && !userProfile.premium && (
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
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
             {authUser && !userProfile.premium && (
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
