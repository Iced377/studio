'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AISpeechBubbleProps {
  insightText: string;
  onDismiss: () => void;
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right'; // To control tail direction
}

export default function AISpeechBubble({
  insightText,
  onDismiss,
  className,
  position = 'bottom',
}: AISpeechBubbleProps) {
  return (
    <Card
      className={cn(
        'absolute z-50 w-64 shadow-xl rounded-lg bg-primary text-primary-foreground',
        // Adjust position based on where it's anchored in the Navbar
        // These are examples, actual positioning will be managed by the parent
        {
          'bottom-full mb-2': position === 'top',
          'top-full mt-2': position === 'bottom',
          'right-full mr-2': position === 'left',
          'left-full ml-2': position === 'right',
        },
        className
      )}
    >
      <CardContent className="relative p-3">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 h-6 w-6 text-primary-foreground hover:bg-primary/80"
          onClick={onDismiss}
          aria-label="Dismiss insight"
        >
          <X className="h-4 w-4" />
        </Button>
        <p className="text-sm pr-6">{insightText}</p>
      </CardContent>
      {/* Speech bubble tail - basic example, can be improved with ::before/::after pseudo-elements and more complex CSS */}
      <div
        className={cn(
          'absolute w-3 h-3 bg-primary transform rotate-45',
          {
            'bottom-[-6px] left-1/2 -translate-x-1/2': position === 'top',
            'top-[-6px] left-1/2 -translate-x-1/2': position === 'bottom',
            'right-[-6px] top-1/2 -translate-y-1/2': position === 'left',
            'left-[-6px] top-1/2 -translate-y-1/2': position === 'right',
          }
        )}
      />
    </Card>
  );
}
