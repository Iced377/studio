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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { LoggedFoodItem } from '@/types';
import { Sprout, Search, Mic, ScanBarcode, Camera } from 'lucide-react'; // Added Mic, ScanBarcode, Camera
import { useToast } from '@/hooks/use-toast';

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
      await onAddFoodItem({ // Pass data without id, timestamp, mealType as per Omit
        name: data.name,
        ingredients: data.ingredients,
        portionSize: data.portionSize,
        portionUnit: data.portionUnit,
      });
      // Toast is handled by the parent page.tsx after successful addition
      form.reset();
      onOpenChange(false); // Close dialog on success
    } catch (error) {
      console.error("Error adding food item from dialog:", error);
      toast({ title: 'Error', description: 'Could not add food item. Please check console.', variant: 'destructive' });
      // Dialog remains open for user to correct or cancel
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl flex items-center">
            <Sprout className="mr-2 h-6 w-6 text-primary" /> Log Food Item
          </DialogTitle>
          <DialogDescription>
            Add a new food item to your timeline. Provide details below or use other methods (coming soon).
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="manual" className="w-full pt-2">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="manual" className="flex-col h-16"><Sprout className="mb-1 h-5 w-5" />Manual</TabsTrigger>
            <TabsTrigger value="voice" disabled className="flex-col h-16"><Mic className="mb-1 h-5 w-5" />Voice (Soon)</TabsTrigger>
            <TabsTrigger value="barcode" disabled className="flex-col h-16"><ScanBarcode className="mb-1 h-5 w-5" />Barcode (Soon)</TabsTrigger>
            <TabsTrigger value="photo" disabled className="flex-col h-16"><Camera className="mb-1 h-5 w-5" />Photo (Soon)</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="pt-4">
            <form onSubmit={form.handleSubmit(handleManualSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">Food Name</Label>
                <Input id="name" {...form.register('name')} placeholder="e.g., Chicken Salad Sandwich" className="mt-1" />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="portionSize" className="text-sm font-medium">Portion Size</Label>
                  <Input id="portionSize" {...form.register('portionSize')} placeholder="e.g., 1, 0.5, 100" className="mt-1" />
                  {form.formState.errors.portionSize && (
                    <p className="text-xs text-destructive mt-1">{form.formState.errors.portionSize.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="portionUnit" className="text-sm font-medium">Portion Unit</Label>
                  <Input id="portionUnit" {...form.register('portionUnit')} placeholder="e.g., slice, cup, g, piece" className="mt-1" />
                  {form.formState.errors.portionUnit && (
                    <p className="text-xs text-destructive mt-1">{form.formState.errors.portionUnit.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="ingredients" className="text-sm font-medium">Ingredients (comma-separated)</Label>
                <Textarea
                  id="ingredients"
                  {...form.register('ingredients')}
                  placeholder="e.g., chicken, lettuce, tomato, mayonnaise, wheat bread, garlic powder"
                  className="mt-1"
                  rows={3}
                />
                {form.formState.errors.ingredients && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.ingredients.message}</p>
                )}
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add to Timeline'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {[ "voice", "barcode", "photo"].map(tabValue => (
            <TabsContent key={tabValue} value={tabValue}>
              <div className="py-12 text-center">
                {tabValue === "voice" && <Mic className="mx-auto h-12 w-12 text-muted-foreground mb-4" />}
                {tabValue === "barcode" && <ScanBarcode className="mx-auto h-12 w-12 text-muted-foreground mb-4" />}
                {tabValue === "photo" && <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-4" />}
                <p className="text-muted-foreground capitalized">{tabValue} input is coming soon!</p>
                <p className="text-xs text-muted-foreground mt-1">This feature will allow for even quicker food logging.</p>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
