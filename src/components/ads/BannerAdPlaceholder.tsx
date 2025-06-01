
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Tv } from 'lucide-react';

export default function BannerAdPlaceholder() {
  return (
    <Card className="w-full h-24 bg-muted/30 border-dashed border-muted-foreground/50 flex items-center justify-center">
      <CardContent className="p-0 flex flex-col items-center text-muted-foreground">
        <Tv className="h-8 w-8 mb-1" />
        <p className="text-sm">Banner Ad Placeholder</p>
        <p className="text-xs">(Actual ad would appear here for free users)</p>
      </CardContent>
    </Card>
  );
}
