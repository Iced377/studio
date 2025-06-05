
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LogOut, LogIn, Sun, Moon, BarChart3, UserPlus, User, Atom, CreditCard, ShieldCheck as AdminIcon, Lightbulb, X } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { signOutUser } from '@/lib/firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef, useCallback } from 'react';
import { db } from '@/config/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  doc as firestoreDoc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import type { UserProfile, AIInsight, UserRecommendationInput } from '@/types'; 
import { getUserRecommendation } from '@/ai/flows/user-recommendations';
import AISpeechBubble from '@/components/ai/AISpeechBubble';


const APP_NAME = "GutCheck";
export const APP_VERSION = "Beta 3.5";
const MAX_UNREAD_INSIGHTS_TO_FETCH = 5;
const MIN_INSIGHTS_IN_QUEUE_BEFORE_GENERATING = 1; // Generate if only 0 or 1 unread left
const INSIGHT_GENERATION_COUNT = 2; // Generate 2 new insights if needed
const BUBBLE_DISPLAY_DURATION = 5000; // 5 seconds

interface NavbarProps {
  isGuest?: boolean;
  guestButtonScheme?: {
    base: string;
    border: string;
    hover: string;
  };
}

export default function Navbar({ isGuest, guestButtonScheme }: NavbarProps) {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);

  const [aiInsightsQueue, setAiInsightsQueue] = useState<AIInsight[]>([]);
  const [currentAiInsight, setCurrentAiInsight] = useState<AIInsight | null>(null);
  const [showAiInsightBubble, setShowAiInsightBubble] = useState(false);
  const aiInsightDismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const aiInsightIconRef = useRef<HTMLButtonElement>(null);
  const [isAiInsightLoading, setIsAiInsightLoading] = useState(false);
  const processingInsightIdRef = useRef<string | null>(null);


  useEffect(() => {
    const fetchUserProfile = async () => {
      if (authUser) {
        try {
          const userProfileRef = firestoreDoc(db, 'users', authUser.uid);
          const userProfileSnap = await getDoc(userProfileRef);
          if (userProfileSnap.exists()) {
            const userProfileData = userProfileSnap.data() as UserProfile;
            setIsCurrentUserAdmin(userProfileData.isAdmin === true);
          } else {
            setIsCurrentUserAdmin(false);
          }
        } catch (error) {
          console.error("Error fetching user profile for Navbar:", error);
          setIsCurrentUserAdmin(false);
        }
      } else {
        setIsCurrentUserAdmin(false);
      }
    };
    if (!authLoading) {
      fetchUserProfile();
    }
  }, [authUser, authLoading]);


  const markInsightAsRead = useCallback(async (insightId: string) => {
    if (!authUser || !insightId) return;
    try {
      const insightDocRef = firestoreDoc(db, 'users', authUser.uid, 'aiInsights', insightId);
      await updateDoc(insightDocRef, { read: true });
    } catch (error) {
      console.error('Error marking insight as read:', error);
    }
  }, [authUser]);

  const showNextAiInsight = useCallback(() => {
    if (aiInsightDismissTimerRef.current) {
      clearTimeout(aiInsightDismissTimerRef.current);
      aiInsightDismissTimerRef.current = null;
    }
    setShowAiInsightBubble(false);
    setCurrentAiInsight(null);

    setAiInsightsQueue(prevQueue => {
      const nextUnreadIndex = prevQueue.findIndex(insight => !insight.read && insight.id !== processingInsightIdRef.current);
      if (nextUnreadIndex !== -1) {
        const insightToShow = prevQueue[nextUnreadIndex];
        setCurrentAiInsight(insightToShow);
        setShowAiInsightBubble(true);
        processingInsightIdRef.current = insightToShow.id;

        aiInsightDismissTimerRef.current = setTimeout(() => {
          handleDismissAiInsight(false, insightToShow.id);
        }, BUBBLE_DISPLAY_DURATION);
        
        // Optimistically mark as read in local queue to prevent re-showing immediately
        const updatedQueue = prevQueue.map(i => i.id === insightToShow.id ? {...i, read: true} : i);
        return updatedQueue.filter(i => i.id !== insightToShow.id); // Remove shown insight from queue
      }
      processingInsightIdRef.current = null;
      return prevQueue.filter(i => !i.read); // Keep only actually unread items if nothing was shown
    });
  }, [markInsightAsRead]); // Added markInsightAsRead as dependency

  const handleDismissAiInsight = useCallback((isUserDismissal: boolean, insightIdToDismiss?: string) => {
    const insightId = insightIdToDismiss || currentAiInsight?.id;
    if (aiInsightDismissTimerRef.current) {
      clearTimeout(aiInsightDismissTimerRef.current);
      aiInsightDismissTimerRef.current = null;
    }
    setShowAiInsightBubble(false);
    
    if (insightId) {
      markInsightAsRead(insightId);
      // Update local queue: remove the dismissed insight or ensure it's marked read
       setAiInsightsQueue(prevQueue => prevQueue.filter(i => i.id !== insightId));
    }
    
    setCurrentAiInsight(null);
    processingInsightIdRef.current = null;

    // Attempt to show the next insight only if dismissed by timer or if user dismissed AND there are more.
    // This short delay helps prevent rapid-fire bubbles if there's a quick succession of events.
    setTimeout(() => {
        if (aiInsightsQueue.some(i => !i.read && i.id !== insightId)) {
             showNextAiInsight();
        } else {
            // If no more insights in the immediate queue, try to fetch/generate more
            fetchAndQueueInsights();
        }
    }, 500);
  }, [currentAiInsight, markInsightAsRead, showNextAiInsight, aiInsightsQueue]);


  const generateAndStoreNewInsight = useCallback(async (requestType?: UserRecommendationInput['requestType']) => {
    if (!authUser || isAiInsightLoading) return null;
    setIsAiInsightLoading(true);
    try {
      const aiInput: UserRecommendationInput = { 
        userId: authUser.uid, 
        requestType,
        recentFoodLogSummary: undefined, 
        recentSymptomSummary: undefined,
      };
      const result = await getUserRecommendation(aiInput);
      if (result && result.recommendationText) {
        const insightsColRef = collection(db, 'users', authUser.uid, 'aiInsights');
        const newInsightDocRef = await addDoc(insightsColRef, {
          text: result.recommendationText,
          timestamp: serverTimestamp(),
          read: false,
        });
        const newInsight: AIInsight = {
            id: newInsightDocRef.id,
            text: result.recommendationText,
            timestamp: new Date(), 
            read: false,
        };
        setAiInsightsQueue(prev => [...prev, newInsight].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
        return newInsight;
      }
    } catch (error) {
      console.error('Error generating or storing AI insight:', error);
    } finally {
      setIsAiInsightLoading(false);
    }
    return null;
  }, [authUser, isAiInsightLoading]);


  const fetchAndQueueInsights = useCallback(async () => {
    if (!authUser || isAiInsightLoading) return;
    
    const unreadInCurrentQueue = aiInsightsQueue.filter(i => !i.read).length;
    if (unreadInCurrentQueue > 0 && !currentAiInsight) { // If queue has items and nothing showing, try to show one
        showNextAiInsight();
        return; // Don't fetch/generate if we can just show from existing queue
    }
    if (isAiInsightLoading) return; // Double check loading state

    setIsAiInsightLoading(true);
    let fetchedInsights: AIInsight[] = [];
    try {
      const insightsColRef = collection(db, 'users', authUser.uid, 'aiInsights');
      const q = query(
        insightsColRef,
        where('read', '==', false),
        orderBy('timestamp', 'asc'), 
        limit(MAX_UNREAD_INSIGHTS_TO_FETCH)
      );
      const querySnapshot = await getDocs(q);
      fetchedInsights = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<AIInsight, 'id' | 'timestamp'>),
        timestamp: (docSnap.data().timestamp as Timestamp)?.toDate() || new Date(),
      }));
      
      setAiInsightsQueue(prev => {
        const existingIds = new Set(prev.map(i => i.id));
        const newUnreadInsights = fetchedInsights.filter(fi => !existingIds.has(fi.id));
        const combined = [...prev, ...newUnreadInsights];
        return combined
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .filter((insight, index, self) => index === self.findIndex((t) => t.id === insight.id)); // Deduplicate
      });

    } catch (error) {
      console.error('Error fetching AI insights:', error);
    }
    
    // After fetching, check if we need to generate more
    const currentTotalUnread = aiInsightsQueue.filter(i => !i.read).length + fetchedInsights.filter(i => !i.read && !aiInsightsQueue.find(q => q.id === i.id)).length;

    if (currentTotalUnread < MIN_INSIGHTS_IN_QUEUE_BEFORE_GENERATING) {
      const types: UserRecommendationInput['requestType'][] = ['general_wellness', 'diet_tip', 'activity_nudge', 'mindfulness_reminder'];
      for (let i = 0; i < INSIGHT_GENERATION_COUNT; i++) {
        // await so they are added to queue one by one, for showNextAiInsight to potentially pick up
        await generateAndStoreNewInsight(types[i % types.length]); 
      }
    }
    
    setIsAiInsightLoading(false);
    // If no bubble is currently shown, try to show one from the newly populated queue
    if (!currentAiInsight && !showAiInsightBubble) {
        showNextAiInsight();
    }

  }, [authUser, isAiInsightLoading, aiInsightsQueue, generateAndStoreNewInsight, showNextAiInsight, currentAiInsight, showAiInsightBubble]);


  useEffect(() => {
    if (authUser && !authLoading && !isGuest) {
        // Initial fetch and potentially show first insight
        if (aiInsightsQueue.filter(i => !i.read).length < MIN_INSIGHTS_IN_QUEUE_BEFORE_GENERATING && !currentAiInsight && !showAiInsightBubble) {
             fetchAndQueueInsights();
        }
    } else if (!authUser) {
        // Clear queue and bubble if user logs out
        setAiInsightsQueue([]);
        setCurrentAiInsight(null);
        setShowAiInsightBubble(false);
        if(aiInsightDismissTimerRef.current) clearTimeout(aiInsightDismissTimerRef.current);
    }
  }, [authUser, authLoading, isGuest, fetchAndQueueInsights, currentAiInsight, showAiInsightBubble]);


  const handleSignOut = async () => {
    const error = await signOutUser();
    if (error) {
      toast({ title: 'Logout Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/'); // Redirect to home which will show guest page
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || '';
    return (names[0][0]?.toUpperCase() || '') + (names[names.length - 1][0]?.toUpperCase() || '');
  };

  const trendsLinkHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(pathname === '/trends' ? '/?openDashboard=true' : '/trends');
  };
  
  const micronutrientsLinkHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(pathname === '/micronutrients' ? '/?openDashboard=true' : '/micronutrients');
  };

  const aiInsightsLinkHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(pathname === '/ai-insights' ? '/?openDashboard=true' : '/ai-insights');
     if (showAiInsightBubble && currentAiInsight) { // If a bubble is showing, dismiss it when navigating to the page
      handleDismissAiInsight(true, currentAiInsight.id);
    }
  };

  const headerBaseClasses = "sticky top-0 z-50 w-full";
  const guestHeaderClasses = "bg-background text-foreground";
  const registeredUserHeaderClasses = cn(
    !isDarkMode ? "bg-muted text-foreground" : "bg-background text-foreground",
    "border-b border-border/50"
  );
  const appNameBaseClasses = "font-bold font-headline sm:inline-block text-xl";

  return (
    <header className={cn(headerBaseClasses, isGuest ? guestHeaderClasses : registeredUserHeaderClasses)}>
      <div className="flex h-16 w-full max-w-screen-2xl items-center justify-between px-4 mx-auto">
        <Link href="/" className="flex items-center space-x-2">
          {!isGuest && (
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-foreground bg-black p-1">
              <Image src="/Gutcheck_logo.png" alt="GutCheck Logo" width={28} height={28} className={cn("object-contain", "filter brightness-0 invert")} priority />
            </div>
          )}
          {!isGuest && (
            <>
              <span className={cn(appNameBaseClasses, 'text-foreground')}>{APP_NAME}</span>
              <span className="text-xs text-muted-foreground ml-1 mt-1">{APP_VERSION}</span>
            </>
          )}
        </Link>

        <div className="flex items-center space-x-1 sm:space-x-1.5">
          {isGuest ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              {guestButtonScheme ? <span className="hidden sm:inline text-sm text-foreground font-medium animate-pulse">Unlock your gut's secrets! ✨</span> : null}
              <Button
                onClick={() => router.push('/login')}
                className={cn(
                  "h-9 px-3 sm:px-4 text-xs sm:text-sm",
                  guestButtonScheme ? `${guestButtonScheme.base} ${guestButtonScheme.border} ${guestButtonScheme.hover} text-white` : ''
                )}
                variant={guestButtonScheme ? 'default' : 'default'} 
              >
                <UserPlus className="mr-1.5 h-4 sm:h-5 w-4 sm:w-5" />
                Sign In / Sign Up
              </Button>
            </div>
          ) : (
            <>
              {!authLoading && authUser && (
                <>
                  <Button variant="ghost" size="icon" className={cn("h-8 w-8 focus-visible:ring-0 focus-visible:ring-offset-0", pathname === '/trends' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50')} aria-label="Trends" onClick={trendsLinkHandler}>
                    <BarChart3 className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className={cn("h-8 w-8 focus-visible:ring-0 focus-visible:ring-offset-0", pathname === '/micronutrients' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50')} aria-label="Micronutrients Progress" onClick={micronutrientsLinkHandler}>
                    <Atom className="h-5 w-5" />
                  </Button>
                  
                  <div className="relative">
                    <Button 
                      ref={aiInsightIconRef}
                      variant="ghost" 
                      size="icon" 
                      className={cn("h-8 w-8 focus-visible:ring-0 focus-visible:ring-offset-0", pathname === '/ai-insights' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50')} 
                      aria-label="AI Insights" 
                      onClick={aiInsightsLinkHandler}
                    >
                      <Lightbulb className="h-5 w-5" />
                    </Button>
                     {showAiInsightBubble && currentAiInsight && aiInsightIconRef.current && (
                        <AISpeechBubble
                        insightText={currentAiInsight.text}
                        onDismiss={() => handleDismissAiInsight(true, currentAiInsight.id)}
                        position="bottom"
                        className="left-1/2 -translate-x-1/2" // Center under the icon
                        />
                    )}
                  </div>
                </>
              )}

              <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="h-8 w-8" aria-label="Toggle dark mode">
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {!authLoading && authUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full border-2 border-foreground p-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={authUser.photoURL || undefined} alt={authUser.displayName || 'User'} />
                        <AvatarFallback className="bg-muted text-muted-foreground">
                            {authUser.photoURL ? getInitials(authUser.displayName) : <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-foreground">{authUser.displayName || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">{authUser.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     {isCurrentUserAdmin && (
                       <DropdownMenuItem onClick={() => router.push('/admin/feedback')} className="cursor-pointer">
                        <AdminIcon className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </DropdownMenuItem>
                     )}
                     <DropdownMenuItem onClick={() => router.push('/account/subscription')} className="cursor-pointer">
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>Upgrade to Premium</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </>
          )}
        </div>
      </div>
    </header>
  );
}

