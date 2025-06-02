
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sprout, Loader2 } from 'lucide-react';

interface GuestLogFoodDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (description: string) => void;
}

export default function GuestLogFoodDialog({ isOpen, onOpenChange, onSubmit }: GuestLogFoodDialogProps) {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    if (description.trim().length < 3) {
        // Basic validation, can be enhanced
        alert("Please describe your meal a bit more.");
        return;
    }
    setIsLoading(true);
    // Simulate a small delay for UX
    setTimeout(() => {
      onSubmit(description);
      setDescription('');
      setIsLoading(false);
      onOpenChange(false);
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white text-gray-800 border-gray-300">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl flex items-center text-calo-green">
            <Sprout className="mr-2 h-6 w-6" /> What did you eat?
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Briefly describe your meal. This will be noted locally.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 pt-2">
          <div>
            <Label htmlFor="guestMealDescription" className="text-sm font-medium text-gray-700 sr-only">
              Meal Description
            </Label>
            <Textarea
              id="guestMealDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='e.g., "A bowl of cereal with milk and banana"'
              className="mt-1 bg-gray-50 text-gray-900 placeholder:text-gray-500 text-base min-h-[100px] border-gray-300 focus:ring-calo-green focus:border-calo-green"
              rows={4}
            />
          </div>
          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="border-calo-green text-calo-green hover:bg-green-50" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleSubmit} className="bg-calo-green text-white hover:bg-green-700" disabled={isLoading || description.trim().length < 3}>
              {isLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Sprout className="mr-2 h-5 w-5" />}
              {isLoading ? 'Noting...' : 'Note Meal'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

    