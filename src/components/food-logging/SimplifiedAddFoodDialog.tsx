
'use client';

import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sprout, Loader2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const simplifiedFoodLogSchema = z.object({
  mealDescription: z.string().min(10, { message: 'Please describe your meal in more detail (at least 10 characters).' }),
  calories: z.preprocess(
    (val) => (val === "" || val === undefined || val === null || Number.isNaN(parseFloat(String(val))) ? undefined : parseFloat(String(val))),
    z.number().min(0, "Calories must be positive").optional()
  ),
  protein: z.preprocess(
    (val) => (val === "" || val === undefined || val === null || Number.isNaN(parseFloat(String(val))) ? undefined : parseFloat(String(val))),
    z.number().min(0, "Protein must be positive").optional()
  ),
  carbs: z.preprocess(
    (val) => (val === "" || val === undefined || val === null || Number.isNaN(parseFloat(String(val))) ? undefined : parseFloat(String(val))),
    z.number().min(0, "Carbs must be positive").optional()
  ),
  fat: z.preprocess(
    (val) => (val === "" || val === undefined || val === null || Number.isNaN(parseFloat(String(val))) ? undefined : parseFloat(String(val))),
    z.number().min(0, "Fat must be positive").optional()
  ),
});

export type SimplifiedFoodLogFormValues = z.infer<typeof simplifiedFoodLogSchema>;

interface SimplifiedAddFoodDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmitLog: (data: SimplifiedFoodLogFormValues) => Promise<void>;
  isGuestView?: boolean;
  isEditing?: boolean;
  initialValues?: Partial<SimplifiedFoodLogFormValues>;
}

export default function SimplifiedAddFoodDialog({
  isOpen,
  onOpenChange,
  onSubmitLog,
  isGuestView = false,
  isEditing = false,
  initialValues
}: SimplifiedAddFoodDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<SimplifiedFoodLogFormValues>({
    resolver: zodResolver(simplifiedFoodLogSchema),
    defaultValues: {
      mealDescription: '',
      calories: undefined,
      protein: undefined,
      carbs: undefined,
      fat: undefined,
      ...(initialValues || {}),
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialValues) {
        form.reset({
          mealDescription: initialValues.mealDescription || '',
          calories: initialValues.calories,
          protein: initialValues.protein,
          carbs: initialValues.carbs,
          fat: initialValues.fat,
        });
      } else if (!isEditing) {
        form.reset({ mealDescription: '', calories: undefined, protein: undefined, carbs: undefined, fat: undefined });
      }
    }
  }, [isOpen, isEditing, initialValues, form]);


  const handleSubmit = async (data: SimplifiedFoodLogFormValues) => {
    setIsLoading(true);
    try {
      await onSubmitLog(data);
      if (!isEditing) form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error processing/updating meal description:", error);
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
    "mt-1 text-base min-h-[100px]", // Reduced min-height
    isGuestView
      ? "bg-white/10 text-white placeholder:text-white/60 border-white/30 focus:ring-white/50 focus:border-white/50"
      : "bg-input text-foreground placeholder:text-muted-foreground border-input focus:ring-ring focus:border-ring"
  );
  
  const inputClasses = cn(
    "mt-1",
    isGuestView
      ? "bg-white/10 text-white placeholder:text-white/60 border-white/30 focus:ring-white/50 focus:border-white/50"
      : "bg-input text-foreground placeholder:text-muted-foreground"
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
    "text-sm font-medium",
    isGuestView ? "text-white/90" : "text-foreground"
  );

  const dialogTitleText = isGuestView
    ? "What did you eat?"
    : (isEditing ? "Edit Meal Details" : "Log Food with AI");

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
                  ? "Update the description and/or nutritional info for your meal."
                  : "Describe your meal in natural language. Our AI will estimate nutritional info, which you can then refine.")
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2 max-h-[60vh] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="mealDescription" className={labelClasses}>Meal Description</Label>
            <Textarea
              id="mealDescription"
              {...form.register('mealDescription')}
              placeholder={isGuestView ? 'e.g., "A small glass of low-fat milk with 50g of Weetabix, and a handful of blueberries"' : 'e.g., "Large bowl of spaghetti bolognese with garlic bread and a side salad."'}
              className={textAreaClasses}
              rows={isEditing ? 3 : 4} // Slightly smaller if editing to make space for macros
            />
            {form.formState.errors.mealDescription && (
              <p className={cn("text-xs mt-1", isGuestView ? "text-red-300" : "text-destructive")}>{form.formState.errors.mealDescription.message}</p>
            )}
          </div>

          {isEditing && !isGuestView && (
            <div className="space-y-3 pt-3 border-t border-border/50 mt-3">
              <Label className={cn(labelClasses, "flex items-center")}>
                <Edit className="w-4 h-4 mr-2 text-muted-foreground" />
                Manually Adjust Nutritional Info (Optional)
              </Label>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <Label htmlFor="calories" className={cn(labelClasses, "text-xs")}>Calories (kcal)</Label>
                  <Input id="calories" type="number" step="any" {...form.register('calories')} placeholder="e.g., 500" className={cn(inputClasses, "h-9 text-sm")} />
                  {form.formState.errors.calories && <p className={cn("text-xs text-destructive mt-1")}>{form.formState.errors.calories.message}</p>}
                </div>
                <div>
                  <Label htmlFor="protein" className={cn(labelClasses, "text-xs")}>Protein (g)</Label>
                  <Input id="protein" type="number" step="any" {...form.register('protein')} placeholder="e.g., 30" className={cn(inputClasses, "h-9 text-sm")} />
                  {form.formState.errors.protein && <p className={cn("text-xs text-destructive mt-1")}>{form.formState.errors.protein.message}</p>}
                </div>
                <div>
                  <Label htmlFor="carbs" className={cn(labelClasses, "text-xs")}>Carbs (g)</Label>
                  <Input id="carbs" type="number" step="any" {...form.register('carbs')} placeholder="e.g., 50" className={cn(inputClasses, "h-9 text-sm")} />
                  {form.formState.errors.carbs && <p className={cn("text-xs text-destructive mt-1")}>{form.formState.errors.carbs.message}</p>}
                </div>
                <div>
                  <Label htmlFor="fat" className={cn(labelClasses, "text-xs")}>Fat (g)</Label>
                  <Input id="fat" type="number" step="any" {...form.register('fat')} placeholder="e.g., 20" className={cn(inputClasses, "h-9 text-sm")} />
                  {form.formState.errors.fat && <p className={cn("text-xs text-destructive mt-1")}>{form.formState.errors.fat.message}</p>}
                </div>
              </div>
               <p className="text-xs text-muted-foreground mt-1">If you provide values here, they will override AI estimates for this entry.</p>
            </div>
          )}

          <DialogFooter className="pt-4 sticky bottom-0 bg-inherit">
            <DialogClose asChild>
              <Button type="button" variant="outline" className={cancelButtonClasses} disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className={submitButtonClasses} disabled={isLoading || (form.formState.isSubmitting || !form.formState.isValid && form.formState.isSubmitted) }>
              {isLoading ? <Loader2 className={cn("animate-spin h-5 w-5 mr-2", isGuestView ? "text-calo-green" : "text-primary-foreground" )} /> : <Sprout className={sproutSubmitIconClasses} />}
              {submitButtonText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
