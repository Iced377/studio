
'use client';

import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tv } from 'lucide-react';

interface BannerAdPlaceholderProps {
  adClientId?: string; // e.g., "ca-pub-XXXXXXXXXXXXXXXX"
  adSlotId?: string;   // e.g., "YYYYYYYYYY"
  className?: string;
  style?: React.CSSProperties;
}

export default function BannerAdPlaceholder({
  adClientId,
  adSlotId,
  className,
  style = { display: 'block' } // Default AdSense style
}: BannerAdPlaceholderProps) {
  const isConfigured = adClientId && adClientId !== "YOUR_CA_PUB_ID_HERE" &&
                       adSlotId && adSlotId !== "YOUR_AD_SLOT_ID_HERE" && 
                       !adClientId.includes("YOUR_") && !adSlotId.includes("YOUR_");


  useEffect(() => {
    if (isConfigured) {
      try {
        if (window.adsbygoogle) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } else {
            console.warn("AdSense script (adsbygoogle.js) not loaded yet. Ad will not display for slot:", adSlotId);
        }
      } catch (e) {
        console.error('Error pushing AdSense ad:', e);
      }
    }
  }, [isConfigured, adSlotId]); // Re-run if configured status changes (though unlikely after initial load) or slotId changes

  if (isConfigured) {
    return (
      <div className={className} style={{marginTop: '24px'}}>
        <ins
          className="adsbygoogle"
          style={style}
          data-ad-client={adClientId}
          data-ad-slot={adSlotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
      </div>
    );
  }

  // Fallback to placeholder
  const displayAdSlotId = adSlotId && !adSlotId.includes("YOUR_") ? adSlotId : "Test Ad Slot / Not Configured";
  const displayAdClientId = adClientId && !adClientId.includes("YOUR_") ? adClientId : "Test Ad Client / Not Configured";

  return (
    <Card className={cn("w-full h-24 bg-muted/30 border-dashed border-border flex items-center justify-center mt-6", className)}>
      <CardContent className="p-0 flex flex-col items-center text-muted-foreground text-center">
        <Tv className="h-8 w-8 mb-1" />
        <p className="text-sm">Banner Ad Placeholder</p>
        <p className="text-xs">(Client: {displayAdClientId})</p>
        <p className="text-xs">(Slot: {displayAdSlotId})</p>
      </CardContent>
    </Card>
  );
}

// Helper for cn if not globally available in this component
const cn = (...inputs: Array<string | undefined | null | Record<string, boolean>>) => {
  return inputs.filter(Boolean).join(' ');
};
