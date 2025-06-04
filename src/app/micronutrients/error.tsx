
'use client'; 

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/shared/Navbar';
import { AlertTriangle } from 'lucide-react';

export default function MicronutrientsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
        <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
        <h2 className="text-3xl font-semibold mb-4 text-foreground">Oops! Something went wrong.</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          We encountered an error while trying to load your micronutrient data. Please try again.
        </p>
        {error?.message && <p className="text-sm text-destructive mb-4">Error: {error.message}</p>}
        <Button
          onClick={() => reset()}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}
