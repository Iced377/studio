
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/config/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore'; // Added doc, getDoc
import type { TimelineEntry, LoggedFoodItem, SymptomLog, TimeRange, MacroPoint, CaloriePoint, SafetyPoint, SymptomFrequency, MicronutrientDetail, MicronutrientAchievement, UserProfile } from '@/types';
import { COMMON_SYMPTOMS } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast'; 
import Link from 'next/link';

import Navbar from '@/components/shared/Navbar';
import TimeRangeToggle from '@/components/trends/TimeRangeToggle';
import DailyMacrosTrendChart from '@/components/trends/DailyMacrosTrendChart';
import DailyCaloriesTrendChart from '@/components/trends/DailyCaloriesTrendChart';
import LoggedSafetyTrendChart from '@/components/trends/LoggedSafetyTrendChart';
import SymptomOccurrenceChart from '@/components/trends/SymptomOccurrenceChart';
import MicronutrientAchievementList from '@/components/trends/MicronutrientAchievementList'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, AlertTriangle, BarChart3, Award } from 'lucide-react'; 
import { subDays, subMonths, subYears, formatISO, startOfDay, endOfDay, parseISO } from 'date-fns';

// --- TEMPORARY FEATURE UNLOCK FLAG ---
// Set to true to give all users full feature access (e.g., no data retention limits for trends).
// Set to false to revert to normal premium/free tier logic.
const TEMPORARILY_UNLOCK_ALL_FEATURES = true;
// --- END TEMPORARY FEATURE UNLOCK FLAG ---

export default function TrendsPage() {
  const { user, loading: authLoading } = useAuth();
  const { theme: currentTheme, isDarkMode } = useTheme();
  const { toast } = useToast(); 
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); 
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('30D');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoadingData(false);
      return;
    }

    const fetchData = async () => {
      setIsLoadingData(true);
      setError(null);
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        let isPremium = false;
        if (userDocSnap.exists()) {
          const profileData = userDocSnap.data() as UserProfile;
          setUserProfile(profileData);
          isPremium = profileData.premium || false;
        } else {
          setUserProfile({ uid: user.uid, email: user.email, displayName: user.displayName, safeFoods: [], premium: false });
        }

        const entriesColRef = collection(db, 'users', user.uid, 'timelineEntries');
        let q;

        if (TEMPORARILY_UNLOCK_ALL_FEATURES || isPremium) {
          q = query(entriesColRef, orderBy('timestamp', 'desc'));
        } else {
          const twoDaysAgo = new Date();
          twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
          q = query(entriesColRef, orderBy('timestamp', 'desc'), where('timestamp', '>=', Timestamp.fromDate(twoDaysAgo)));
          if (!TEMPORARILY_UNLOCK_ALL_FEATURES && pathname === '/trends') { 
             toast({ title: "Data Retention Notice", description: "As a free user, your trends are based on the last 2 days of data. Upgrade for full history.", variant: "default", duration: 10000 });
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
      } catch (err: any) {
        console.error("Error fetching timeline data for trends:", err);
        setError("Could not load your data for trend analysis. Please try again later.");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [user, authLoading, toast]); 

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';


  const filteredEntries = useMemo(() => {
    if (timelineEntries.length === 0) return [];

    const now = new Date();
    let startDate: Date;

    switch (selectedTimeRange) {
      case '1D':
        startDate = startOfDay(now);
        break;
      case '7D':
        startDate = subDays(now, 7);
        break;
      case '30D':
        startDate = subDays(now, 30);
        break;
      case '90D':
        startDate = subDays(now, 90);
        break;
      case '1Y':
        startDate = subYears(now, 1);
        break;
      case 'ALL':
      default:
        return timelineEntries; 
    }
    
    const endDate = selectedTimeRange === '1D' ? endOfDay(now) : now;

    return timelineEntries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }, [timelineEntries, selectedTimeRange]);


  const aggregateDataByDay = <T extends {calories?: number; protein?: number; carbs?: number; fat?: number; userFeedback?: 'safe' | 'unsafe' | null}>(
    entries: (LoggedFoodItem & T)[],
    mapper: (date: string, itemsOnDate: (LoggedFoodItem & T)[]) => any
  ) => {
    const groupedByDay: Record<string, (LoggedFoodItem & T)[]> = {};
    entries.forEach(entry => {
      if (entry.entryType === 'food' || entry.entryType === 'manual_macro') {
        const dayKey = formatISO(new Date(entry.timestamp), { representation: 'date' });
        if (!groupedByDay[dayKey]) {
          groupedByDay[dayKey] = [];
        }
        groupedByDay[dayKey].push(entry);
      }
    });

    const sortedDays = Object.keys(groupedByDay).sort((a, b) => parseISO(a).getTime() - parseISO(b).getTime());
    return sortedDays.map(dayKey => mapper(dayKey, groupedByDay[dayKey]));
  };
  
  const macroData = useMemo<MacroPoint[]>(() => {
    const foodEntries = filteredEntries.filter(e => e.entryType === 'food' || e.entryType === 'manual_macro') as LoggedFoodItem[];
    return aggregateDataByDay(foodEntries, (date, items) => ({
      date,
      protein: items.reduce((sum, item) => sum + (item.protein || 0), 0),
      carbs: items.reduce((sum, item) => sum + (item.carbs || 0), 0),
      fat: items.reduce((sum, item) => sum + (item.fat || 0), 0),
    }));
  }, [filteredEntries]);

  const calorieData = useMemo<CaloriePoint[]>(() => {
    const foodEntries = filteredEntries.filter(e => e.entryType === 'food' || e.entryType === 'manual_macro') as LoggedFoodItem[];
    return aggregateDataByDay(foodEntries, (date, items) => ({
      date,
      calories: items.reduce((sum, item) => sum + (item.calories || 0), 0),
    }));
  }, [filteredEntries]);

  const safetyData = useMemo<SafetyPoint[]>(() => {
     const foodEntries = filteredEntries.filter(e => e.entryType === 'food') as LoggedFoodItem[];
    return aggregateDataByDay(foodEntries, (date, items) => ({
      date,
      safe: items.filter(item => item.userFeedback === 'safe').length,
      unsafe: items.filter(item => item.userFeedback === 'unsafe').length,
      notMarked: items.filter(item => item.userFeedback === null || item.userFeedback === undefined).length,
    }));
  }, [filteredEntries]);

  const symptomFrequencyData = useMemo<SymptomFrequency[]>(() => {
    const symptomLogs = filteredEntries.filter(e => e.entryType === 'symptom') as SymptomLog[];
    const frequencyMap: Record<string, number> = {};
    symptomLogs.forEach(log => {
      log.symptoms.forEach(symptom => {
        frequencyMap[symptom.name] = (frequencyMap[symptom.name] || 0) + 1;
      });
    });
    return Object.entries(frequencyMap).map(([name, value]) => ({ name, value }));
  }, [filteredEntries]);

  const micronutrientAchievementData = useMemo<MicronutrientAchievement[]>(() => {
    const foodEntries = filteredEntries.filter(e => e.entryType === 'food' || e.entryType === 'manual_macro') as LoggedFoodItem[];
    const dailyMicronutrientTotals: Record<string, Record<string, { dv: number, iconName?: string }>> = {}; 

    foodEntries.forEach(entry => {
      const dayKey = formatISO(new Date(entry.timestamp), { representation: 'date' });
      if (!dailyMicronutrientTotals[dayKey]) {
        dailyMicronutrientTotals[dayKey] = {};
      }

      const microsInfo = entry.fodmapData?.micronutrientsInfo;
      if (microsInfo) {
        const allMicros: MicronutrientDetail[] = [];
        if (microsInfo.notable) allMicros.push(...microsInfo.notable);
        if (microsInfo.fullList) allMicros.push(...microsInfo.fullList);
        
        allMicros.forEach(micro => {
          if (micro.dailyValuePercent !== undefined) {
            if (!dailyMicronutrientTotals[dayKey][micro.name]) {
              dailyMicronutrientTotals[dayKey][micro.name] = { dv: 0, iconName: micro.iconName };
            }
            dailyMicronutrientTotals[dayKey][micro.name].dv += micro.dailyValuePercent;
            if (micro.iconName && !dailyMicronutrientTotals[dayKey][micro.name].iconName) {
               dailyMicronutrientTotals[dayKey][micro.name].iconName = micro.iconName;
            }
          }
        });
      }
    });

    const achievementCounts: Record<string, { achievedDays: number, iconName?: string }> = {};
    Object.values(dailyMicronutrientTotals).forEach(dayData => {
      Object.entries(dayData).forEach(([nutrientName, data]) => {
        if (data.dv >= 100) {
          if (!achievementCounts[nutrientName]) {
            achievementCounts[nutrientName] = { achievedDays: 0, iconName: data.iconName };
          }
          achievementCounts[nutrientName].achievedDays += 1;
          if (data.iconName && !achievementCounts[nutrientName].iconName) {
            achievementCounts[nutrientName].iconName = data.iconName;
          }
        }
      });
    });

    return Object.entries(achievementCounts)
      .map(([name, data]) => ({ name, achievedDays: data.achievedDays, iconName: data.iconName }))
      .sort((a, b) => b.achievedDays - a.achievedDays);
  }, [filteredEntries]);


  if (authLoading || isLoadingData) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-foreground">Loading trends...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
       <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-foreground">Access Denied</h2>
            <p className="text-muted-foreground">Please log in to view your trends.</p>
        </div>
      </div>
    );
  }
  
  if (error) {
     return (
       <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-foreground">Error Loading Trends</h2>
            <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }
  
   if (timelineEntries.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow container mx-auto px-4 py-8 text-center">
          <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold mb-2 text-foreground">Trends Dashboard</h1>
          <p className="text-muted-foreground">
            Not enough data yet. Start logging your meals and symptoms to see your trends over time!
            {!userProfile?.premium && !TEMPORARILY_UNLOCK_ALL_FEATURES && " (Free users: trends based on last 2 days of data)"}
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <ScrollArea className="flex-grow">
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6 text-foreground">Trends Dashboard</h1>
          <div className="mb-8">
            <TimeRangeToggle selectedRange={selectedTimeRange} onRangeChange={setSelectedTimeRange} />
          </div>
           {!userProfile?.premium && !TEMPORARILY_UNLOCK_ALL_FEATURES && (
                <p className="text-sm text-center text-muted-foreground mb-6">
                Free users: Trends are based on data from the last 2 days. <Link href="/account/subscription" className="underline text-primary">Upgrade</Link> for full historical data. (Note: Subscription page not implemented)
                </p>
            )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card shadow-lg border-border">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">Daily Calorie Intake</CardTitle>
              </CardHeader>
              <CardContent>
                {calorieData.length > 0 ? <DailyCaloriesTrendChart data={calorieData} theme={currentTheme} isDarkMode={isDarkMode} /> : <p className="text-muted-foreground text-center py-8">No calorie data for this period.</p>}
              </CardContent>
            </Card>

            <Card className="bg-card shadow-lg border-border">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">Daily Macronutrient Trends</CardTitle>
              </CardHeader>
              <CardContent>
                 {macroData.length > 0 ? <DailyMacrosTrendChart data={macroData} theme={currentTheme} isDarkMode={isDarkMode} /> : <p className="text-muted-foreground text-center py-8">No macronutrient data for this period.</p>}
              </CardContent>
            </Card>

            <Card className="bg-card shadow-lg border-border">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">Food Safety Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                {safetyData.length > 0 ? <LoggedSafetyTrendChart data={safetyData} theme={currentTheme} isDarkMode={isDarkMode} /> : <p className="text-muted-foreground text-center py-8">No food safety feedback logged for this period.</p>}
              </CardContent>
            </Card>

            <Card className="bg-card shadow-lg border-border">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">Symptom Occurrence</CardTitle>
              </CardHeader>
              <CardContent className="h-[350px] flex items-center justify-center">
                 {symptomFrequencyData.length > 0 ? <SymptomOccurrenceChart data={symptomFrequencyData} theme={currentTheme} isDarkMode={isDarkMode} /> : <p className="text-muted-foreground text-center py-8">No symptoms logged for this period.</p>}
              </CardContent>
            </Card>
            
            <Card className="bg-card shadow-lg border-border lg:col-span-2"> 
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground flex items-center">
                  <Award className="mr-2 h-6 w-6 text-yellow-500" /> Micronutrient Target Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MicronutrientAchievementList data={micronutrientAchievementData} />
              </CardContent>
            </Card>

          </div>
        </main>
      </ScrollArea>
    </div>
  );
}

// Helper to get pathname for toast display logic, ensure it's only client-side
const getPathname = () => {
  if (typeof window !== "undefined") {
    return window.location.pathname;
  }
  return "";
};

