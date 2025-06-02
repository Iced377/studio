
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sprout, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const simplifiedFoodLogSchema = z.object({
  mealDescription: z.string().min(10, { message: 'Please describe your meal in more detail (at least 10 characters).' }),
});

type SimplifiedFoodLogFormValues = z.infer<typeof simplifiedFoodLogSchema>;

interface SimplifiedAddFoodDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onProcessDescription: (description: string) => Promise<void>;
}

export default function SimplifiedAddFoodDialog({ isOpen, onOpenChange, onProcessDescription }: SimplifiedAddFoodDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<SimplifiedFoodLogFormValues>({
    resolver: zodResolver(simplifiedFoodLogSchema),
    defaultValues: {
      mealDescription: '',
    },
  });

  const handleSubmit = async (data: SimplifiedFoodLogFormValues) => {
    setIsLoading(true);
    try {
      await onProcessDescription(data.mealDescription);
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error processing meal description:", error);
      toast({ 
        title: 'Error Processing Meal', 
        description: error.message || 'Could not process your meal description with AI.', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-calo-green text-white border-white/20">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl flex items-center text-white">
            <Sprout className="mr-2 h-6 w-6 text-white/80" /> What did you eat?
          </DialogTitle>
          <DialogDescription className="text-white/80">
            Tell us what you ate, including ingredients and their approximate portion sizes.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
          <div>
            <Label htmlFor="mealDescription" className="text-sm font-medium text-white/90 sr-only">Meal Description</Label>
            <Textarea
              id="mealDescription"
              {...form.register('mealDescription')}
              placeholder='e.g., "A small glass of low-fat milk with 50g of Weetabix, and a handful of blueberries"'
              className="mt-1 bg-white/10 text-white placeholder:text-white/60 text-base min-h-[120px] border-white/30 focus:ring-white/50 focus:border-white/50"
              rows={5}
            />
            {form.formState.errors.mealDescription && (
              <p className="text-xs text-red-300 mt-1">{form.formState.errors.mealDescription.message}</p>
            )}
          </div>
          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="border-white/50 text-white hover:bg-white/10" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="bg-white text-calo-green hover:bg-gray-100" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Sprout className="mr-2 h-5 w-5" />}
              {isLoading ? 'Analyzing...' : 'Check Meal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
