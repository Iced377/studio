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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { LoggedFoodItem, MealType } from '@/types';
import { PlusCircle, Search, Sprout } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const manualEntrySchema = z.object({
  name: z.string().min(1, { message: 'Food name is required' }),
  ingredients: z.string().min(1, { message: 'Ingredients are required (comma-separated)' }),
});

type ManualEntryFormValues = z.infer<typeof manualEntrySchema>;

interface AddFoodItemDialogProps {
  mealType: MealType;
  onAddFoodItem: (foodItem: Omit<LoggedFoodItem, 'id' | 'timestamp' | 'mealType'>) => Promise<void>; // Modified to Omit
}

export default function AddFoodItemDialog({ mealType, onAddFoodItem }: AddFoodItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ManualEntryFormValues>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: {
      name: '',
      ingredients: '',
    },
  });

  const handleManualSubmit = async (data: ManualEntryFormValues) => {
    setIsLoading(true);
    try {
      await onAddFoodItem({
        name: data.name,
        ingredients: data.ingredients,
      });
      toast({ title: 'Food Item Added', description: `${data.name} added to ${mealType}.` });
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Error adding food item:", error);
      toast({ title: 'Error', description: 'Could not add food item.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full mt-2">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Food
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl">Add Food to {mealType}</DialogTitle>
          <DialogDescription>
            Log a new food item. You can enter details manually or search (search coming soon).
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual"><Sprout className="mr-2 h-4 w-4" />Manual Entry</TabsTrigger>
            <TabsTrigger value="search" disabled><Search className="mr-2 h-4 w-4" />Search (Soon)</TabsTrigger>
          </TabsList>
          <TabsContent value="manual" className="pt-4">
            <form onSubmit={form.handleSubmit(handleManualSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">Food Name</Label>
                <Input id="name" {...form.register('name')} placeholder="e.g., Chicken Salad" className="mt-1" />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="ingredients" className="text-sm font-medium">Ingredients (comma-separated)</Label>
                <Textarea
                  id="ingredients"
                  {...form.register('ingredients')}
                  placeholder="e.g., chicken, lettuce, tomato, mayonnaise, garlic powder"
                  className="mt-1"
                  rows={3}
                />
                {form.formState.errors.ingredients && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.ingredients.message}</p>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Food Item'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          <TabsContent value="search">
            <div className="py-8 text-center">
              <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Food search functionality is coming soon!</p>
              <p className="text-xs text-muted-foreground mt-1">You'll be able to search extensive food databases.</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
