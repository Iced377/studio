
'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AISpeechBubbleProps {
  insightText: string;
  onDismiss: () => void;
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
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
        // Positioning relative to the parent (which should be position: relative)
        {
          'bottom-full mb-2': position === 'top', // Bubble above, tail points down
          'top-full mt-2': position === 'bottom', // Bubble below, tail points up
          'right-full mr-2': position === 'left', // Bubble to the left, tail points right
          'left-full ml-2': position === 'right', // Bubble to the right, tail points left
        },
        className // Allows for additional centering like 'left-1/2 -translate-x-1/2'
      )}
    >
      <CardContent className="relative p-3">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
          onClick={onDismiss}
          aria-label="Dismiss insight"
        >
          <X className="h-4 w-4" />
        </Button>
        <p className="text-sm pr-6">{insightText}</p>
      </CardContent>
      {/* Speech bubble tail */}
      <div
        className={cn(
          'absolute w-3 h-3 bg-primary transform rotate-45',
          { // Tail positioning based on bubble's position relative to anchor
            'bottom-[-6px] left-1/2 -translate-x-1/2': position === 'top', // Tail at bottom center of bubble
            'top-[-6px] left-1/2 -translate-x-1/2': position === 'bottom', // Tail at top center of bubble
            'right-[-6px] top-1/2 -translate-y-1/2': position === 'left', // Tail at right center of bubble
            'left-[-6px] top-1/2 -translate-y-1/2': position === 'right', // Tail at left center of bubble
          }
        )}
      />
    </Card>
  );
}

