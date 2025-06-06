
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import Navbar from '@/components/shared/Navbar';
import { Loader2, Brain, Sparkles, ThumbsDown, Home } from 'lucide-react'; 
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { LoggedFoodItem, SymptomLog, UserProfile } from '@/types'; 
import { getPersonalizedDietitianInsight, type PersonalizedDietitianInput } from '@/ai/flows/personalized-dietitian-flow';
import { db } from '@/config/firebase';
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  Timestamp,
  getDoc,
  limit,
  where,
} from 'firebase/firestore'; 
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const TEMPORARILY_UNLOCK_ALL_FEATURES = true; // Kept true as per previous state
const DATA_FETCH_LIMIT_DAYS = 90;
const PREDEFINED_QUESTION = "What do you think about my food today so far and what would you recommend for the rest of today?";

export default function AIInsightsPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [currentAIResponse, setCurrentAIResponse] = useState<string | null>(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentAIResponse, scrollToBottom]);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      setError("Please log in to use the AI Dietitian.");
      return;
    }

    const fetchUserProfileData = async () => {
      setError(null);
      try {
        const userDocRef = doc(db, 'users', authUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data() as UserProfile);
        } else {
           setUserProfile({ uid: authUser.uid, email: authUser.email, displayName: authUser.displayName, safeFoods: [], premium: false });
        }
      } catch (err: any) {
        console.error("Error fetching user profile:", err);
        setError("Could not load your user profile. Please try again later.");
      }
    };

    fetchUserProfileData();
  }, [authUser, authLoading]);

  const handleQuestionSubmit = async () => {
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
        // Removed upgrade prompt toast
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
        userQuestion: PREDEFINED_QUESTION,
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
      setError("Sorry, I couldn't generate an insight. Please try again or rephrase.");
      setCurrentAIResponse(null);
    } finally {
      setIsGeneratingInsight(false);
    }
  };


  const handleDiscardInsight = () => {
    setCurrentAIResponse(null);
    toast({ title: "Insight Discarded", description: "The AI response has been cleared." });
  };


  if (authLoading) { 
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
           <div className="mt-8">
            <Button asChild variant="outline">
              <Link href="/?openDashboard=true">
                <Home className="mr-2 h-4 w-4" /> Return to Dashboard
              </Link>
            </Button>
          </div>
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
            {currentAIResponse && !isGeneratingInsight && (
              <Card className="bg-green-500/10 border-green-500/30 shadow-lg">
                <CardHeader className="pb-2 pt-3 px-4">
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

        <div className="p-4 border-t border-border bg-background space-y-3">
          <Button
            onClick={handleQuestionSubmit}
            disabled={isGeneratingInsight}
            className="w-full h-auto px-4 py-3 bg-primary text-primary-foreground hover:bg-primary/90 text-base"
            size="lg"
          >
            <Brain className="h-5 w-5 mr-2" />
            Get Today&apos;s Analysis & Recommendations
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/?openDashboard=true">
              <Home className="mr-2 h-4 w-4" /> Return to Dashboard
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

    
