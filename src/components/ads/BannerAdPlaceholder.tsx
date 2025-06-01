
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Tv } from 'lucide-react';

interface BannerAdPlaceholderProps {
  adUnitId?: string;
}

export default function BannerAdPlaceholder({ adUnitId }: BannerAdPlaceholderProps) {
  const displayAdUnitId = adUnitId && adUnitId !== "YOUR_BANNER_AD_UNIT_ID_HERE" ? adUnitId : "Test Ad Unit / Not Configured";
  return (
    <Card className="w-full h-24 bg-muted/30 border-dashed border-border flex items-center justify-center mt-6">
      <CardContent className="p-0 flex flex-col items-center text-muted-foreground text-center">
        <Tv className="h-8 w-8 mb-1" />
        <p className="text-sm">Banner Ad</p>
        <p className="text-xs">(Unit ID: {displayAdUnitId})</p>
      </CardContent>
    </Card>
  );
}
