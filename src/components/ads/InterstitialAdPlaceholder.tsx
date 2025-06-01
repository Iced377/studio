
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tv2 } from 'lucide-react';

interface InterstitialAdPlaceholderProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void; // Called when user chooses to continue after "ad"
}

export default function InterstitialAdPlaceholder({
  isOpen,
  onClose,
  onContinue,
}: InterstitialAdPlaceholderProps) {
  const handleContinue = () => {
    onContinue();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl flex items-center">
            <Tv2 className="mr-2 h-6 w-6 text-primary" /> Supporting FODMAPSafe
          </DialogTitle>
          <DialogDescription className="text-center py-4">
            This is where an interstitial ad would be displayed for free users.
            <br />
            Thank you for your understanding!
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 text-center bg-muted/30 rounded-md">
            <p className="text-lg font-semibold">Interstitial Ad Placeholder</p>
            <p className="text-sm text-muted-foreground">(Imagine an ad here)</p>
        </div>
        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Skip
          </Button>
          <Button type="button" onClick={handleContinue}>
            Continue to Insights
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
