
'use client';

import { useState } from 'react';
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
import { Edit } from 'lucide-react'; // Using Edit icon
import { useToast } from '@/hooks/use-toast';
import type { LoggedFoodItem } from '@/types';

const manualMacroSchema = z.object({
  calories: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)), 
    z.number().min(0, "Calories must be positive").optional()
  ),
  protein: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0, "Protein must be positive").optional()
  ),
  carbs: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0, "Carbs must be positive").optional()
  ),
  fat: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0, "Fat must be positive").optional()
  ),
  entryName: z.string().min(1, "Entry name is required").default("Manual Macro Adjustment")
});

export type ManualMacroFormValues = z.infer<typeof manualMacroSchema>;

interface AddManualMacroEntryDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddEntry: (entryData: Omit<LoggedFoodItem, 'id' | 'timestamp' | 'entryType' | 'ingredients' | 'portionSize' | 'portionUnit' | 'fodmapData' | 'isSimilarToSafe' | 'userFodmapProfile' | 'sourceDescription' | 'userFeedback'> & { entryType: 'manual_macro' | 'food' } ) => Promise<void>;
  initialValues?: Partial<ManualMacroFormValues>; // For editing existing entries if needed later
}

export default function AddManualMacroEntryDialog({ isOpen, onOpenChange, onAddEntry, initialValues }: AddManualMacroEntryDialogProps) {
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

  const handleSubmit = async (data: ManualMacroFormValues) => {
    setIsLoading(true);
    try {
      const entryData = {
        name: data.entryName || "Manual Macro Adjustment",
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        // Fields not relevant for manual macro entry but required by LoggedFoodItem for food type:
        ingredients: "Manual entry", 
        portionSize: "1",
        portionUnit: "serving",
        entryType: 'manual_macro' as 'manual_macro', // Explicitly type
      };
      await onAddEntry(entryData);
      form.reset({ entryName: "Manual Macro Adjustment", calories: undefined, protein: undefined, carbs: undefined, fat: undefined });
      onOpenChange(false);
      toast({ title: 'Macros Updated', description: 'Manual macro entry logged successfully.' });
    } catch (error) {
      console.error("Error adding manual macro entry:", error);
      toast({ title: 'Error', description: 'Could not log manual macro entry.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  
  // useEffect to reset form when initialValues change (e.g. for editing)
  // React.useEffect(() => {
  //   if (initialValues) {
  //     form.reset(initialValues);
  //   } else {
  //     form.reset({ calories: 0, protein: 0, carbs: 0, fat: 0, entryName: "Manual Macro Adjustment"});
  //   }
  // }, [initialValues, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl flex items-center text-foreground">
            <Edit className="mr-2 h-5 w-5 text-gray-400" /> Edit Daily Macros
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Manually log or adjust your macro totals for the day. This will be added as a separate entry.
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
              <Input id="calories" type="number" {...form.register('calories')} placeholder="e.g., 500" className="mt-1 bg-input" />
              {form.formState.errors.calories && <p className="text-xs text-destructive mt-1">{form.formState.errors.calories.message}</p>}
            </div>
            <div>
              <Label htmlFor="protein">Protein (g)</Label>
              <Input id="protein" type="number" {...form.register('protein')} placeholder="e.g., 30" className="mt-1 bg-input" />
              {form.formState.errors.protein && <p className="text-xs text-destructive mt-1">{form.formState.errors.protein.message}</p>}
            </div>
            <div>
              <Label htmlFor="carbs">Carbohydrates (g)</Label>
              <Input id="carbs" type="number" {...form.register('carbs')} placeholder="e.g., 50" className="mt-1 bg-input" />
              {form.formState.errors.carbs && <p className="text-xs text-destructive mt-1">{form.formState.errors.carbs.message}</p>}
            </div>
            <div>
              <Label htmlFor="fat">Fat (g)</Label>
              <Input id="fat" type="number" {...form.register('fat')} placeholder="e.g., 20" className="mt-1 bg-input" />
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
              {isLoading ? 'Saving...' : 'Save Macros'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
