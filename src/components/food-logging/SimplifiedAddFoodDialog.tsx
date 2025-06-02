
'use client';

import { useState, useEffect } from 'react'; // Added useEffect
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sprout, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const simplifiedFoodLogSchema = z.object({
  mealDescription: z.string().min(10, { message: 'Please describe your meal in more detail (at least 10 characters).' }),
});

type SimplifiedFoodLogFormValues = z.infer<typeof simplifiedFoodLogSchema>;

interface SimplifiedAddFoodDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmitDescription: (description: string) => Promise<void>; // Renamed prop
  isGuestView?: boolean;
  isEditing?: boolean; // New prop for edit mode
  initialValues?: { mealDescription: string }; // New prop for prefilling
}

export default function SimplifiedAddFoodDialog({ 
  isOpen, 
  onOpenChange, 
  onSubmitDescription, 
  isGuestView = false,
  isEditing = false,
  initialValues 
}: SimplifiedAddFoodDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<SimplifiedFoodLogFormValues>({
    resolver: zodResolver(simplifiedFoodLogSchema),
    defaultValues: initialValues || {
      mealDescription: '',
    },
  });

  useEffect(() => {
    if (isEditing && initialValues) {
      form.reset({ mealDescription: initialValues.mealDescription });
    } else if (!isEditing) {
      form.reset({ mealDescription: '' }); // Reset if opening for new entry
    }
  }, [isOpen, isEditing, initialValues, form]);


  const handleSubmit = async (data: SimplifiedFoodLogFormValues) => {
    setIsLoading(true);
    try {
      await onSubmitDescription(data.mealDescription);
      if (!isEditing) form.reset(); // Only reset if not editing, or handled by onOpenChange(false)
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error processing meal description:", error);
      toast({ 
        title: `Error ${isEditing ? 'Updating' : 'Processing'} Meal`, 
        description: error.message || `Could not ${isEditing ? 'update' : 'process'} your meal description with AI.`, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const dialogContentClasses = cn(
    "sm:max-w-lg",
    isGuestView ? "bg-calo-green text-white border-white/20" : "bg-card text-card-foreground border-border"
  );

  const titleClasses = cn(
    "font-headline text-xl flex items-center",
    isGuestView ? "text-white" : "text-foreground"
  );

  const descriptionClasses = cn(
    isGuestView ? "text-white/80" : "text-muted-foreground"
  );

  const sproutIconClasses = cn(
    "mr-2 h-6 w-6",
    isGuestView ? "text-white/80" : "text-gray-400"
  );
  
  const sproutSubmitIconClasses = cn(
    "mr-2 h-5 w-5",
    isGuestView ? "" : "" 
  );


  const textAreaClasses = cn(
    "mt-1 text-base min-h-[120px]",
    isGuestView 
      ? "bg-white/10 text-white placeholder:text-white/60 border-white/30 focus:ring-white/50 focus:border-white/50" 
      : "bg-input text-foreground placeholder:text-muted-foreground border-input focus:ring-ring focus:border-ring"
  );

  const cancelButtonClasses = cn(
    isGuestView 
      ? "border-white/50 text-white hover:bg-white/10" 
      : "border-accent text-accent-foreground hover:bg-accent/20" 
  );

  const submitButtonClasses = cn(
    isGuestView 
      ? "bg-white text-calo-green hover:bg-gray-100" 
      : "bg-primary text-primary-foreground hover:bg-primary/80"
  );
  
  const labelClasses = cn(
    "text-sm font-medium sr-only", 
    isGuestView ? "text-white/90" : "text-foreground" 
  );

  const dialogTitleText = isGuestView 
    ? "What did you eat?" 
    : (isEditing ? "Edit Meal Description" : "Log Food with AI");
  
  const submitButtonText = isLoading 
    ? (isEditing ? 'Updating...' : 'Analyzing...')
    : (isGuestView ? 'Check Meal' : (isEditing ? 'Update Meal' : 'Analyze Meal'));


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={dialogContentClasses}>
        <DialogHeader>
          <DialogTitle className={titleClasses}>
            <Sprout className={sproutIconClasses} /> {dialogTitleText}
          </DialogTitle>
          <DialogDescription className={descriptionClasses}>
            {isGuestView 
              ? "Tell us what you ate, including ingredients and their approximate portion sizes." 
              : (isEditing 
                  ? "Update the description of your meal. The AI will re-analyze it."
                  : "Describe your meal in natural language, and our AI will help break it down.")
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
          <div>
            <Label htmlFor="mealDescription" className={labelClasses}>Meal Description</Label>
            <Textarea
              id="mealDescription"
              {...form.register('mealDescription')}
              placeholder={isGuestView ? 'e.g., "A small glass of low-fat milk with 50g of Weetabix, and a handful of blueberries"' : 'e.g., "Large bowl of spaghetti bolognese with garlic bread and a side salad."'}
              className={textAreaClasses}
              rows={5}
            />
            {form.formState.errors.mealDescription && (
              <p className={cn("text-xs mt-1", isGuestView ? "text-red-300" : "text-destructive")}>{form.formState.errors.mealDescription.message}</p>
            )}
          </div>
          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className={cancelButtonClasses} disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className={submitButtonClasses} disabled={isLoading}>
              {isLoading ? <Loader2 className={cn("animate-spin h-5 w-5 mr-2", isGuestView ? "text-calo-green" : "text-primary-foreground" )} /> : <Sprout className={sproutSubmitIconClasses} />}
              {submitButtonText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
