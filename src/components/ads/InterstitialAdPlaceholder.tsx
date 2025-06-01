
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
  onContinue: () => void;
  adUnitId?: string;
  actionName?: string; // To customize the continue button
}

export default function InterstitialAdPlaceholder({
  isOpen,
  onClose,
  onContinue,
  adUnitId,
  actionName = "Action"
}: InterstitialAdPlaceholderProps) {
  const handleContinue = () => {
    onContinue();
  };
  const displayAdUnitId = adUnitId && adUnitId !== "YOUR_INTERSTITIAL_AD_UNIT_ID_HERE" ? adUnitId : "Test Ad Unit / Not Configured";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl flex items-center text-foreground">
            <Tv2 className="mr-2 h-6 w-6 text-gray-400" /> Supporting FODMAPSafe
          </DialogTitle>
          <DialogDescription className="text-center py-4 text-muted-foreground">
            This is where an interstitial ad (Unit ID: {displayAdUnitId}) would be displayed for free users.
            <br />
            Thank you for your understanding!
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 text-center bg-muted/30 rounded-md">
            <p className="text-lg font-semibold text-foreground">Interstitial Ad Placeholder</p>
            <p className="text-sm text-muted-foreground">(Imagine an ad here)</p>
        </div>
        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" className="border-accent text-accent-foreground hover:bg-accent/20" onClick={onClose}>
            Skip
          </Button>
          <Button type="button" className="bg-primary text-primary-foreground hover:bg-primary/80" onClick={handleContinue}>
            Continue to {actionName}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
