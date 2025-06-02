
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Loader2 } from 'lucide-react'; // Added Loader2
import { useToast } from '@/hooks/use-toast';
import type { LoggedFoodItem } from '@/types';

const manualMacroSchema = z.object({
  calories: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)), 
    z.number().min(0, "Calories must be positive").optional()
  ),
  protein: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number().min(0, "Protein must be positive").optional()
  ),
  carbs: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number().min(0, "Carbs must be positive").optional()
  ),
  fat: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number().min(0, "Fat must be positive").optional()
  ),
  entryName: z.string().min(1, "Entry name is required").default("Manual Macro Adjustment")
});

export type ManualMacroFormValues = z.infer<typeof manualMacroSchema>;

interface AddManualMacroEntryDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmitEntry: (entryData: Omit<LoggedFoodItem, 'id' | 'timestamp' | 'entryType' | 'ingredients' | 'portionSize' | 'portionUnit' | 'fodmapData' | 'isSimilarToSafe' | 'userFodmapProfile' | 'sourceDescription' | 'userFeedback'> & { entryType: 'manual_macro' | 'food' } ) => Promise<void>; // Renamed prop
  initialValues?: Partial<ManualMacroFormValues>; 
  isEditing?: boolean; // New prop
}

export default function AddManualMacroEntryDialog({ 
  isOpen, 
  onOpenChange, 
  onSubmitEntry, 
  initialValues,
  isEditing = false 
}: AddManualMacroEntryDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ManualMacroFormValues>({
    resolver: zodResolver(manualMacroSchema),
    defaultValues: initialValues || {
      calories: undefined,
      protein: undefined,
      carbs: undefined,
      fat: undefined,
      entryName: "Manual Macro Adjustment",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialValues) {
        form.reset(initialValues);
      } else if (!isEditing) {
        form.reset({ calories: undefined, protein: undefined, carbs: undefined, fat: undefined, entryName: "Manual Macro Adjustment" });
      }
    }
  }, [isOpen, isEditing, initialValues, form]);


  const handleSubmit = async (data: ManualMacroFormValues) => {
    setIsLoading(true);
    try {
      const entryData = {
        name: data.entryName || "Manual Macro Adjustment",
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        ingredients: "Manual entry", 
        portionSize: "1",
        portionUnit: "serving",
        entryType: 'manual_macro' as 'manual_macro',
      };
      await onSubmitEntry(entryData);
      if (!isEditing) form.reset({ entryName: "Manual Macro Adjustment", calories: undefined, protein: undefined, carbs: undefined, fat: undefined });
      onOpenChange(false);
      toast({ title: `Macros ${isEditing ? 'Updated' : 'Logged'}`, description: `Manual macro entry ${isEditing ? 'updated' : 'logged'} successfully.` });
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} manual macro entry:`, error);
      toast({ title: 'Error', description: `Could not ${isEditing ? 'update' : 'log'} manual macro entry.`, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const dialogTitleText = isEditing ? "Edit Manual Macros" : "Log Daily Macros";
  const submitButtonText = isLoading 
    ? (isEditing ? 'Updating...' : 'Saving...')
    : (isEditing ? 'Update Macros' : 'Save Macros');


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl flex items-center text-foreground">
            <Edit className="mr-2 h-5 w-5 text-gray-400" /> {dialogTitleText}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing ? "Update the values for this manual macro entry." : "Manually log or adjust your macro totals for the day. This will be added as a separate entry."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
          <div>
            <Label htmlFor="entryName">Entry Name</Label>
            <Input id="entryName" {...form.register('entryName')} className="mt-1 bg-input" />
            {form.formState.errors.entryName && <p className="text-xs text-destructive mt-1">{form.formState.errors.entryName.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="calories">Calories (kcal)</Label>
              <Input id="calories" type="number" step="any" {...form.register('calories')} placeholder="e.g., 500" className="mt-1 bg-input" />
              {form.formState.errors.calories && <p className="text-xs text-destructive mt-1">{form.formState.errors.calories.message}</p>}
            </div>
            <div>
              <Label htmlFor="protein">Protein (g)</Label>
              <Input id="protein" type="number" step="any" {...form.register('protein')} placeholder="e.g., 30" className="mt-1 bg-input" />
              {form.formState.errors.protein && <p className="text-xs text-destructive mt-1">{form.formState.errors.protein.message}</p>}
            </div>
            <div>
              <Label htmlFor="carbs">Carbohydrates (g)</Label>
              <Input id="carbs" type="number" step="any" {...form.register('carbs')} placeholder="e.g., 50" className="mt-1 bg-input" />
              {form.formState.errors.carbs && <p className="text-xs text-destructive mt-1">{form.formState.errors.carbs.message}</p>}
            </div>
            <div>
              <Label htmlFor="fat">Fat (g)</Label>
              <Input id="fat" type="number" step="any" {...form.register('fat')} placeholder="e.g., 20" className="mt-1 bg-input" />
              {form.formState.errors.fat && <p className="text-xs text-destructive mt-1">{form.formState.errors.fat.message}</p>}
            </div>
          </div>
          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="border-accent text-accent-foreground hover:bg-accent/20" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/80" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              {submitButtonText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
