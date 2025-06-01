
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { LoggedFoodItem } from '@/types';
import { Sprout } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BannerAdPlaceholder from '@/components/ads/BannerAdPlaceholder'; // Import the ad placeholder

const manualEntrySchema = z.object({
  name: z.string().min(1, { message: 'Food name is required' }),
  ingredients: z.string().min(1, { message: 'Ingredients are required (comma-separated)' }),
  portionSize: z.string().min(1, { message: 'Portion size is required (e.g., 1, 0.5, 100)'}),
  portionUnit: z.string().min(1, { message: 'Portion unit is required (e.g., slice, cup, g)'}),
});

type ManualEntryFormValues = z.infer<typeof manualEntrySchema>;

interface AddFoodItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddFoodItem: (foodItemData: Omit<LoggedFoodItem, 'id' | 'timestamp' | 'entryType'>) => Promise<void>;
}

export default function AddFoodItemDialog({ isOpen, onOpenChange, onAddFoodItem }: AddFoodItemDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ManualEntryFormValues>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: {
      name: '',
      ingredients: '',
      portionSize: '',
      portionUnit: '',
    },
  });

  const handleManualSubmit = async (data: ManualEntryFormValues) => {
    setIsLoading(true);
    try {
      await onAddFoodItem({
        name: data.name,
        ingredients: data.ingredients,
        portionSize: data.portionSize,
        portionUnit: data.portionUnit,
      });
      form.reset();
      onOpenChange(false); 
    } catch (error) {
      console.error("Error adding food item from dialog:", error);
      toast({ title: 'Error', description: 'Could not add food item.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl flex items-center text-foreground">
            <Sprout className="mr-2 h-6 w-6 text-gray-400" /> Log Food Item
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add a new food item to your timeline.
          </DialogDescription>
        </DialogHeader>
        
        {/* Ad Placeholder added here */}
        <div className="my-4">
          <BannerAdPlaceholder />
        </div>
        
        {/* Manual Entry Form directly */}
        <form onSubmit={form.handleSubmit(handleManualSubmit)} className="space-y-4 pt-2">
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
            <Button type="button" variant="outline" className="border-accent text-accent-foreground hover:bg-accent/20" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/80" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add to Timeline'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
