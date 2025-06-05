
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import Navbar from '@/components/shared/Navbar';
import { Loader2, MessageSquareText, Trash2, ThumbsUp, ThumbsDown, Brain, Sparkles, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Textarea removed as it's no longer used for free-form questions
import { ScrollArea } from '@/components/ui/scroll-area';
import type { KeptAIInsight, KeptAIInsightFirestore, LoggedFoodItem, SymptomLog, UserProfile, TimelineEntry } from '@/types';
import { getPersonalizedDietitianInsight, type PersonalizedDietitianInput } from '@/ai/flows/personalized-dietitian-flow';
import { db } from '@/config/firebase';
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  Timestamp,
  getDoc,
  limit,
  where,
} from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// --- TEMPORARY FEATURE UNLOCK FLAG --- (align with page.tsx)
const TEMPORARILY_UNLOCK_ALL_FEATURES = true;
// --- END TEMPORARY FEATURE UNLOCK FLAG ---

const DATA_FETCH_LIMIT_DAYS = 90; // Fetch last 90 days of data for AI context
const PREDEFINED_QUESTION = "What do you think about my food today so far and what would you recommend for the rest of today?";

export default function AIInsightsPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // userQuestion state is removed
  const [currentAIResponse, setCurrentAIResponse] = useState<string | null>(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [keptInsights, setKeptInsights] = useState<KeptAIInsight[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentAIResponse, keptInsights, scrollToBottom]);

  // Fetch user profile and kept insights
  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      setIsLoadingHistory(false);
      setError("Please log in to use the AI Dietitian and view your insights history.");
      return;
    }

    const fetchInitialData = async () => {
      setIsLoadingHistory(true);
      setError(null);
      try {
        // Fetch user profile
        const userDocRef = doc(db, 'users', authUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data() as UserProfile);
        } else {
           setUserProfile({ uid: authUser.uid, email: authUser.email, displayName: authUser.displayName, safeFoods: [], premium: false });
        }

        const insightsColRef = collection(db, 'users', authUser.uid, 'keptAiInsights');
        const q = query(insightsColRef, orderBy('timestamp', 'desc'));
        
        const querySnapshot = await getDocs(q);
        const fetchedInsights: KeptAIInsight[] = querySnapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            userQuestion: data.userQuestion,
            aiResponse: data.aiResponse,
            timestamp: (data.timestamp as Timestamp)?.toDate() || new Date(),
          } as KeptAIInsight;
        });
        setKeptInsights(fetchedInsights);
      } catch (err: any) {
        console.error("Error fetching AI insights history or user profile:", err);
        setError("Could not load your AI insights. Please try again later.");
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchInitialData();
  }, [authUser, authLoading]);

  const handleQuestionSubmit = async () => {
    // No longer relies on userQuestion state
    if (!authUser) return;

    setIsGeneratingInsight(true);
    setCurrentAIResponse(null);
    setError(null);

    try {
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - DATA_FETCH_LIMIT_DAYS);
      
      const timelineEntriesColRef = collection(db, 'users', authUser.uid, 'timelineEntries');
      
      let foodLogQuery;
      let symptomLogQuery;

      const isPremium = userProfile?.premium || TEMPORARILY_UNLOCK_ALL_FEATURES;

      if (isPremium) {
         foodLogQuery = query(timelineEntriesColRef, where('entryType', 'in', ['food', 'manual_macro']), where('timestamp', '>=', Timestamp.fromDate(startDate)), orderBy('timestamp', 'desc'));
         symptomLogQuery = query(timelineEntriesColRef, where('entryType', '==', 'symptom'), where('timestamp', '>=', Timestamp.fromDate(startDate)), orderBy('timestamp', 'desc'));
      } else {
        const freeUserStartDate = new Date(now);
        freeUserStartDate.setDate(now.getDate() - 7);
        foodLogQuery = query(timelineEntriesColRef, where('entryType', 'in', ['food', 'manual_macro']), where('timestamp', '>=', Timestamp.fromDate(freeUserStartDate)), orderBy('timestamp', 'desc'), limit(50));
        symptomLogQuery = query(timelineEntriesColRef, where('entryType', '==', 'symptom'), where('timestamp', '>=', Timestamp.fromDate(freeUserStartDate)), orderBy('timestamp', 'desc'), limit(20));
         toast({
          title: "Contextual Data Notice",
          description: "As a free user, AI insights are based on a limited recent history. Upgrade for deeper analysis.",
          duration: 7000,
        });
      }

      const [foodLogSnapshot, symptomLogSnapshot] = await Promise.all([
        getDocs(foodLogQuery),
        getDocs(symptomLogQuery)
      ]);

      const foodLogData: LoggedFoodItem[] = foodLogSnapshot.docs.map(d => ({...d.data(), id: d.id, timestamp: (d.data().timestamp as Timestamp).toDate() } as LoggedFoodItem));
      const symptomLogData: SymptomLog[] = symptomLogSnapshot.docs.map(d => ({...d.data(), id: d.id, timestamp: (d.data().timestamp as Timestamp).toDate() } as SymptomLog));
      
      const processedFoodLog = foodLogData.map(item => ({
          name: item.name,
          originalName: item.originalName,
          ingredients: item.ingredients,
          portionSize: item.portionSize,
          portionUnit: item.portionUnit,
          timestamp: item.timestamp.toISOString(),
          overallFodmapRisk: item.fodmapData?.overallRisk,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          userFeedback: item.userFeedback,
          sourceDescription: item.sourceDescription
      }));

      const processedSymptomLog = symptomLogData.map(symptomEntry => {
          let finalLinkedIds: string[] = [];
          const rawLinkedIds = symptomEntry.linkedFoodItemIds;

          if (Array.isArray(rawLinkedIds)) {
              finalLinkedIds = rawLinkedIds.filter(id => typeof id === 'string' && id.trim().length > 0);
          } else if (typeof rawLinkedIds === 'string' && rawLinkedIds.trim().length > 0) {
              finalLinkedIds = [rawLinkedIds.trim()];
          } else if (Array.isArray(rawLinkedIds) && rawLinkedIds.every(id => typeof id === 'string' && id.trim().length > 0)) {
            finalLinkedIds = rawLinkedIds;
          }

          return {
              symptoms: symptomEntry.symptoms.map(s => ({ name: s.name })),
              severity: symptomEntry.severity,
              notes: symptomEntry.notes,
              timestamp: symptomEntry.timestamp.toISOString(),
              linkedFoodItemIds: finalLinkedIds,
          };
      });
      
      const aiInput: PersonalizedDietitianInput = {
        userQuestion: PREDEFINED_QUESTION, // Use predefined question
        foodLog: processedFoodLog,
        symptomLog: processedSymptomLog,
        userProfile: userProfile ? {
            displayName: userProfile.displayName,
            safeFoods: userProfile.safeFoods.map(sf => ({ name: sf.name, portionSize: sf.portionSize, portionUnit: sf.portionUnit })),
            premium: userProfile.premium
        } : undefined,
      };

      const result = await getPersonalizedDietitianInsight(aiInput);
      setCurrentAIResponse(result.aiResponse);

    } catch (err: any) {
      console.error("Error getting AI insight:", err);
      setError("Sorry, I couldn't generate an insight for that question. Please try again or rephrase.");
      setCurrentAIResponse(null);
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  const handleKeepInsight = async () => {
    if (!currentAIResponse || !authUser) return;

    const insightToSave: KeptAIInsightFirestore = {
      userQuestion: PREDEFINED_QUESTION, // Save predefined question
      aiResponse: currentAIResponse,
      timestamp: Timestamp.now(),
    };

    try {
      const docRef = await addDoc(collection(db, 'users', authUser.uid, 'keptAiInsights'), insightToSave);
      setKeptInsights(prev => [{ ...insightToSave, id: docRef.id, timestamp: new Date() }, ...prev]);
      setCurrentAIResponse(null);
      // setUserQuestion(''); // No longer needed
      toast({ title: "Insight Saved!", description: "This insight is now in your history." });
    } catch (err) {
      console.error("Error saving insight:", err);
      toast({ title: "Save Error", description: "Could not save this insight.", variant: "destructive" });
    }
  };

  const handleDiscardInsight = () => {
    setCurrentAIResponse(null);
  };

  const handleDeleteInsight = async (insightId: string) => {
    if (!authUser) return;
    try {
      await deleteDoc(doc(db, 'users', authUser.uid, 'keptAiInsights', insightId));
      setKeptInsights(prev => prev.filter(insight => insight.id !== insightId));
      toast({ title: "Insight Deleted", description: "The insight has been removed from your history." });
    } catch (err) {
      console.error("Error deleting insight:", err);
      toast({ title: "Delete Error", description: "Could not delete this insight.", variant: "destructive" });
    }
  };


  if (authLoading || isLoadingHistory) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-foreground">Loading AI Dietitian...</p>
        </div>
      </div>
    );
  }

  if (error && !isGeneratingInsight) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
          <Brain className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-semibold mb-2 text-foreground">Insights Unavailable</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-background">
      <Navbar />
      <main className="flex-1 flex flex-col overflow-hidden container mx-auto px-0 sm:px-4 py-0">
        <div className="p-4 border-b border-border text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center justify-center">
            <Sparkles className="mr-2 h-7 w-7 text-primary" /> Your Personal AI Dietitian
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1 max-w-2xl mx-auto">
            Get personalized insights based on your logged data by asking: <br/>
            <em className="text-primary/90">&quot;{PREDEFINED_QUESTION}&quot;</em>
          </p>
        </div>

        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-6">
            {keptInsights.map((insight) => (
              <Card key={insight.id} className="bg-card shadow-md border-border">
                <CardHeader className="pb-2 pt-3 px-4">
                  <p className="text-sm font-semibold text-primary flex items-center">
                    <MessageSquareText className="h-4 w-4 mr-2 opacity-80" /> You asked:
                  </p>
                  <p className="text-foreground whitespace-pre-wrap">{insight.userQuestion}</p>
                </CardHeader>
                <CardContent className="px-4 py-2">
                  <p className="text-sm font-semibold text-green-500 flex items-center">
                     <Sparkles className="h-4 w-4 mr-2 opacity-80" /> AI Dietitian replied:
                  </p>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                    <ReactMarkdown>{insight.aiResponse}</ReactMarkdown>
                  </div>
                </CardContent>
                <CardFooter className="px-4 pb-3 pt-2 flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    Saved {formatDistanceToNow(new Date(insight.timestamp), { addSuffix: true })}
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteInsight(insight.id)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}

            {currentAIResponse && !isGeneratingInsight && (
              <Card className="bg-green-500/10 border-green-500/30 shadow-lg">
                <CardHeader className="pb-2 pt-3 px-4">
                   <p className="text-sm font-semibold text-primary flex items-center">
                    <MessageSquareText className="h-4 w-4 mr-2 opacity-80" /> You asked:
                  </p>
                  <p className="text-foreground whitespace-pre-wrap">{PREDEFINED_QUESTION}</p>
                </CardHeader>
                <CardContent className="px-4 py-2">
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 opacity-80" /> AI Dietitian replied:
                  </p>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                    <ReactMarkdown>{currentAIResponse}</ReactMarkdown>
                  </div>
                </CardContent>
                <CardFooter className="px-4 pb-3 pt-2 flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleDiscardInsight} className="text-sm">
                    <ThumbsDown className="h-4 w-4 mr-1.5" /> Discard
                  </Button>
                  <Button onClick={handleKeepInsight} className="text-sm bg-primary hover:bg-primary/90 text-primary-foreground">
                    <ThumbsUp className="h-4 w-4 mr-1.5" /> Keep Insight
                  </Button>
                </CardFooter>
              </Card>
            )}
             {isGeneratingInsight && (
              <div className="flex items-center justify-center p-6 bg-muted/50 rounded-md">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-3" />
                <p className="text-foreground">Your AI Dietitian is analyzing your day...</p>
              </div>
            )}
            {error && isGeneratingInsight && (
                <p className="text-destructive text-sm text-center p-2">{error}</p>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border bg-background">
          <Button
            onClick={handleQuestionSubmit}
            disabled={isGeneratingInsight}
            className="w-full h-auto px-4 py-3 bg-primary text-primary-foreground hover:bg-primary/90 text-base"
            size="lg"
          >
            <Brain className="h-5 w-5 mr-2" />
            Get Today&apos;s Analysis & Recommendations
          </Button>
        </div>
      </main>
    </div>
  );
}
