
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { LoggedFoodItem, SafeFood, UserProfile, TimelineEntry, Symptom, SymptomLog } from '@/types';
import { COMMON_SYMPTOMS } from '@/types';
import { Loader2, Utensils, ShieldCheck, PlusCircle, ListChecks, Brain, Star } from 'lucide-react';
import { analyzeFoodItem, type AnalyzeFoodItemOutput, type FoodFODMAPProfile as DetailedFodmapProfileFromAI } from '@/ai/flows/fodmap-detection';
import { isSimilarToSafeFoods, type FoodFODMAPProfile, type FoodSimilarityOutput } from '@/ai/flows/food-similarity';
import { getSymptomCorrelations, type SymptomCorrelationInput, type SymptomCorrelationOutput } from '@/ai/flows/symptom-correlation-flow';

import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
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


const initialUserProfile: UserProfile = {
  uid: 'local-user',
  email: null,
  displayName: 'Guest User',
  safeFoods: [],
  premium: false, // Initialize as non-premium
};

export default function FoodTimelinePage() {
  const { toast } = useToast();

  const [userProfile, setUserProfile] = useState<UserProfile>(initialUserProfile);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState<Record<string, boolean>>({});
  const [isAddFoodDialogOpen, setIsAddFoodDialogOpen] = useState(false);
  const [isSymptomLogDialogOpen, setIsSymptomLogDialogOpen] = useState(false);
  const [symptomDialogContext, setSymptomDialogContext] = useState<{ foodItemIds?: string[] }>({});
  const [aiInsights, setAiInsights] = useState<SymptomCorrelationOutput['insights']>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [showInterstitialAd, setShowInterstitialAd] = useState(false);

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
    setUserProfile(prev => ({
      ...prev,
      safeFoods: [...prev.safeFoods, newSafeFood],
    }));
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
    if (!userProfile.premium) {
      setShowInterstitialAd(true);
    } else {
      fetchAiInsightsInternal();
    }
  }, [timelineEntries, userProfile.premium, fetchAiInsightsInternal]);


  useEffect(() => {
    if (timelineEntries.length > 0) {
        const foodEntriesCount = timelineEntries.filter(e => e.entryType === 'food').length;
        const symptomEntriesCount = timelineEntries.filter(e => e.entryType === 'symptom').length;
        if (foodEntriesCount > 0 || symptomEntriesCount > 0) {
             // Do not auto-fetch on timeline change anymore, user will click button.
             // triggerFetchAiInsights(); 
        }
    } else {
        setAiInsights([]); 
    }
  }, [timelineEntries]);

  const handleUpgradeToPremium = () => {
    // Simulate IAP
    setUserProfile(prev => ({ ...prev, premium: true }));
    toast({ title: "Upgrade Successful!", description: "You are now a Premium user. Ads have been removed." });
    // TODO: Persist premium status in Firestore once Firebase Auth is re-integrated.
    // e.g., await updateUserProfileInFirestore(userProfile.uid, { premium: true });
  };

  const handleInterstitialClosed = (continuedToInsights: boolean) => {
    setShowInterstitialAd(false);
    if (continuedToInsights) {
      fetchAiInsightsInternal();
    }
  };

  const isAnyItemLoadingAi = Object.values(isLoadingAi).some(loading => loading);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-[calc(var(--navbar-height,64px)+1rem)] bg-background/80 backdrop-blur-md z-40 py-4 mb-4 shadow rounded-b-lg">
        <div className="container mx-auto flex flex-col items-center gap-4">
          <Button 
            size="lg" 
            className="w-full max-w-md h-16 text-xl rounded-full shadow-xl bg-primary hover:bg-primary/90"
            onClick={() => setIsAddFoodDialogOpen(true)}
          >
            <PlusCircle className="mr-3 h-8 w-8" /> Tap to Log Food
          </Button>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => openSymptomDialog()}>
              <ListChecks className="mr-2 h-5 w-5" /> Log Symptoms
            </Button>
            <Button variant="outline" onClick={triggerFetchAiInsights} disabled={isLoadingInsights || showInterstitialAd}>
              {isLoadingInsights ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Brain className="mr-2 h-5 w-5" />}
              Get Insights
            </Button>
             {!userProfile.premium && (
              <Button variant="outline" onClick={handleUpgradeToPremium} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Star className="mr-2 h-5 w-5" /> Upgrade to Premium
              </Button>
            )}
          </div>
           <p className="text-sm text-muted-foreground">
              Status: {userProfile.premium ? <span className="font-semibold text-primary">Premium User</span> : <span className="font-semibold">Free User</span>}
            </p>
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
      {showInterstitialAd && !userProfile.premium && (
        <InterstitialAdPlaceholder
          isOpen={showInterstitialAd}
          onClose={() => handleInterstitialClosed(false)}
          onContinue={() => handleInterstitialClosed(true)}
        />
      )}

      {isAnyItemLoadingAi && (
        <div className="fixed bottom-4 right-4 bg-accent text-accent-foreground p-3 rounded-lg shadow-lg flex items-center space-x-2 z-50">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>AI is analyzing...</span>
        </div>
      )}

      <main className="flex-grow container mx-auto px-4 py-2">
        {aiInsights.length > 0 && (
          <Card className="mb-6 bg-secondary/20 border-primary/30">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center text-primary">
                <Brain className="mr-3 h-7 w-7" /> AI Insights
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
            <Card className="text-center py-12">
              <CardContent>
                <Utensils className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold font-headline mb-2">Your Food Timeline is Empty</h2>
                <p className="text-muted-foreground mb-6">Tap the button above to log your first food item or symptom.</p>
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
        
        {!userProfile.premium && (
          <div className="mt-8">
            <BannerAdPlaceholder />
          </div>
        )}

        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center">
              <ShieldCheck className="mr-3 h-7 w-7 text-primary" />
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
                    <li key={sf.id} className="p-4 border rounded-lg bg-card shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-lg">{sf.name}</p>
                          <p className="text-sm text-muted-foreground">Portion: {sf.portionSize} {sf.portionUnit}</p>
                          <p className="text-xs text-muted-foreground break-all">Ingredients: {sf.ingredients}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
