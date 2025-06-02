
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/config/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import type { TimelineEntry, LoggedFoodItem, SymptomLog, TimeRange, MacroPoint, CaloriePoint, SafetyPoint, SymptomFrequency } from '@/types';
import { COMMON_SYMPTOMS } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';

import Navbar from '@/components/shared/Navbar';
import TimeRangeToggle from '@/components/trends/TimeRangeToggle';
import DailyMacrosTrendChart from '@/components/trends/DailyMacrosTrendChart';
import DailyCaloriesTrendChart from '@/components/trends/DailyCaloriesTrendChart';
import LoggedSafetyTrendChart from '@/components/trends/LoggedSafetyTrendChart';
import SymptomOccurrenceChart from '@/components/trends/SymptomOccurrenceChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, AlertTriangle, BarChart3 } from 'lucide-react';
import { subDays, subMonths, subYears, formatISO, startOfDay, endOfDay, parseISO } from 'date-fns';

export default function TrendsPage() {
  const { user, loading: authLoading } = useAuth();
  const { theme: currentTheme, isDarkMode } = useTheme();
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('30D');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoadingData(false);
      // Optionally redirect to login or show a message
      return;
    }

    const fetchData = async () => {
      setIsLoadingData(true);
      setError(null);
      try {
        const entriesColRef = collection(db, 'users', user.uid, 'timelineEntries');
        // For "All Time", we don't apply a time filter at the query level
        // For other ranges, we might, but client-side filtering is simpler for now
        const q = query(entriesColRef, orderBy('timestamp', 'desc'));
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
  }, [user, authLoading]);

  const filteredEntries = useMemo(() => {
    if (timelineEntries.length === 0) return [];
    const now = new Date();
    let startDate: Date;

    switch (selectedTimeRange) {
      case '1D':
        startDate = startOfDay(now); // Use startOfDay for 1D
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
        return timelineEntries; // No date filtering for ALL
    }
    
    // For 1D, we also need an end date for precise filtering.
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
     const foodEntries = filteredEntries.filter(e => e.entryType === 'food') as LoggedFoodItem[]; // Exclude manual_macro for safety
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
              <CardContent className="h-[350px] flex items-center justify-center"> {/* Ensure chart has height */}
                 {symptomFrequencyData.length > 0 ? <SymptomOccurrenceChart data={symptomFrequencyData} theme={currentTheme} isDarkMode={isDarkMode} /> : <p className="text-muted-foreground text-center py-8">No symptoms logged for this period.</p>}
              </CardContent>
            </Card>
          </div>
        </main>
      </ScrollArea>
    </div>
  );
}
