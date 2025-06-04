
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Brain, Pencil, CalendarDays, Camera } from 'lucide-react'; // Added Camera
import { format } from 'date-fns';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface LogPreviousMealDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onDateSelect: (date?: Date) => void;
  onLogMethodSelect: (method: 'AI' | 'Manual' | 'Photo') => void; // Added 'Photo'
  currentSelectedDate?: Date;
}

export default function LogPreviousMealDialog({
  isOpen,
  onOpenChange,
  onDateSelect,
  onLogMethodSelect,
  currentSelectedDate,
}: LogPreviousMealDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(currentSelectedDate || new Date());
  const { isDarkMode } = useTheme();

  const handleDateSelect = (date?: Date) => {
    setSelectedDate(date);
    onDateSelect(date); 
  };

  const handleLogWithAI = () => {
    if (!selectedDate) {
        alert("Please select a date first.");
        return;
    }
    onLogMethodSelect('AI');
    onOpenChange(false); 
  };

  const handleLogManually = () => {
     if (!selectedDate) {
        alert("Please select a date first.");
        return;
    }
    onLogMethodSelect('Manual');
    onOpenChange(false); 
  };

  const handleLogWithPhoto = () => {
    if (!selectedDate) {
        alert("Please select a date first.");
        return;
    }
    onLogMethodSelect('Photo');
    onOpenChange(false); 
  };
  
  const today = new Date();

  const cancelClasses = !isDarkMode 
    ? "bg-red-200 border-red-300 text-red-700 hover:bg-red-300 hover:border-red-400 w-full sm:w-auto" 
    : "border-accent text-accent-foreground hover:bg-accent/20 w-full sm:w-auto";


  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if(!open) onDateSelect(undefined); 
        onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl flex items-center text-foreground">
            <CalendarDays className="mr-2 h-6 w-6 text-gray-400" /> Log a Previous Meal
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            First, select the date the meal was consumed. Then choose how you want to log it.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 flex flex-col items-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            className="rounded-md border border-input"
            disabled={(date) => date > today || date < new Date("2000-01-01")}
            initialFocus
          />
           {selectedDate && (
            <p className="mt-3 text-sm text-foreground">
              Selected date: <span className="font-semibold">{format(selectedDate, "PPP")}</span>
            </p>
          )}
        </div>

        <DialogFooter className="pt-2 flex-col sm:flex-row sm:justify-between gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" className={cn(cancelClasses, "order-last sm:order-first")}>
              Cancel
            </Button>
          </DialogClose>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={handleLogWithAI} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/80" disabled={!selectedDate}>
              <Brain className="mr-2 h-5 w-5" /> AI (Text)
            </Button>
             <Button onClick={handleLogWithPhoto} className="w-full sm:w-auto bg-primary/80 text-primary-foreground hover:bg-primary/70" disabled={!selectedDate}>
              <Camera className="mr-2 h-5 w-5" /> AI (Photo)
            </Button>
            <Button onClick={handleLogManually} className="w-full sm:w-auto bg-secondary text-secondary-foreground hover:bg-secondary/80" disabled={!selectedDate}>
              <Pencil className="mr-2 h-5 w-5" /> Manual
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

