
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { LoggedFoodItem } from '@/types';
import { Sprout, Loader2 } from 'lucide-react'; 
import { useToast } from '@/hooks/use-toast';
import BannerAdPlaceholder from '@/components/ads/BannerAdPlaceholder';
import { useTheme } from '@/contexts/ThemeContext'; 
import { cn } from '@/lib/utils';

const manualEntrySchema = z.object({
  name: z.string().min(1, { message: 'Food name is required' }),
  ingredients: z.string().min(1, { message: 'Ingredients are required (comma-separated)' }),
  portionSize: z.string().min(1, { message: 'Portion size is required (e.g., 1, 0.5, 100)'}),
  portionUnit: z.string().min(1, { message: 'Portion unit is required (e.g., slice, cup, g)'}),
});

export type ManualEntryFormValues = z.infer<typeof manualEntrySchema>;

interface AddFoodItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmitFoodItem: (foodItemData: Omit<LoggedFoodItem, 'id' | 'timestamp' | 'entryType'>) => Promise<void>; 
  isEditing?: boolean; 
  initialValues?: Partial<ManualEntryFormValues>; 
}

export default function AddFoodItemDialog({ 
  isOpen, 
  onOpenChange, 
  onSubmitFoodItem,
  isEditing = false,
  initialValues
}: AddFoodItemDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isDarkMode } = useTheme();

  const form = useForm<ManualEntryFormValues>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: initialValues || {
      name: '',
      ingredients: '',
      portionSize: '',
      portionUnit: '',
    },
  });

  useEffect(() => {
    if (isEditing && initialValues) {
      form.reset(initialValues);
    } else if (!isEditing) {
      form.reset({ name: '', ingredients: '', portionSize: '', portionUnit: '' });
    }
  }, [isOpen, isEditing, initialValues, form]);

  const handleFormSubmit = async (data: ManualEntryFormValues) => {
    setIsLoading(true);
    try {
      await onSubmitFoodItem({
        name: data.name,
        ingredients: data.ingredients,
        portionSize: data.portionSize,
        portionUnit: data.portionUnit,
      });
      if (!isEditing) form.reset();
      onOpenChange(false); 
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} food item from dialog:`, error);
      toast({ title: 'Error', description: `Could not ${isEditing ? 'update' : 'add'} food item.`, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const dialogTitleText = isEditing ? "Edit Food Item" : "Log Food Item";
  const submitButtonText = isLoading 
    ? (isEditing ? 'Updating...' : 'Adding...') 
    : (isEditing ? 'Update Food Item' : 'Add to Timeline');

  const cancelClasses = !isDarkMode 
    ? "bg-red-200 border-red-300 text-red-700 hover:bg-red-300 hover:border-red-400" 
    : "border-accent text-accent-foreground hover:bg-accent/20";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl flex items-center text-foreground">
            <Sprout className="mr-2 h-6 w-6 text-gray-400" /> {dialogTitleText}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing ? "Update the details of this food item." : "Add a new food item to your timeline."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4">
          <BannerAdPlaceholder />
        </div>
        
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 pt-2">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-foreground">Food Name</Label>
            <Input id="name" {...form.register('name')} placeholder="e.g., Chicken Salad Sandwich" className="mt-1 bg-input text-foreground placeholder:text-muted-foreground" />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="portionSize" className="text-sm font-medium text-foreground">Portion Size</Label>
              <Input id="portionSize" {...form.register('portionSize')} placeholder="e.g., 1, 0.5, 100" className="mt-1 bg-input text-foreground placeholder:text-muted-foreground" />
              {form.formState.errors.portionSize && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.portionSize.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="portionUnit" className="text-sm font-medium text-foreground">Portion Unit</Label>
              <Input id="portionUnit" {...form.register('portionUnit')} placeholder="e.g., slice, cup, g" className="mt-1 bg-input text-foreground placeholder:text-muted-foreground" />
              {form.formState.errors.portionUnit && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.portionUnit.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="ingredients" className="text-sm font-medium text-foreground">Ingredients (comma-separated)</Label>
            <Textarea
              id="ingredients"
              {...form.register('ingredients')}
              placeholder="e.g., chicken, lettuce, tomato, mayonnaise, wheat bread"
              className="mt-1 bg-input text-foreground placeholder:text-muted-foreground"
              rows={3}
            />
            {form.formState.errors.ingredients && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.ingredients.message}</p>
            )}
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" className={cancelClasses} onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
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
