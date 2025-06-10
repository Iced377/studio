
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Cookie } from 'lucide-react';
import { cn } from '@/lib/utils';

const LOCALSTORAGE_KEY = 'gutcheck-cookie-consent';

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consentStatus = localStorage.getItem(LOCALSTORAGE_KEY);
    if (consentStatus !== 'accepted') {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(LOCALSTORAGE_KEY, 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <Alert className={cn(
        "bg-card text-card-foreground border-border shadow-xl max-w-3xl mx-auto",
        "flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4"
      )}>
        <Cookie className="h-6 w-6 text-primary hidden sm:block flex-shrink-0 mt-1 sm:mt-0" />
        <div className="flex-grow">
          <AlertTitle className="font-semibold text-foreground">We Value Your Privacy</AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground">
            We use cookies to enhance your experience, analyze site traffic, and for basic app functionality. By continuing to use this site, you consent to our use of cookies.
            See our <Link href="/privacy" className="underline hover:text-primary">Privacy Policy</Link> for more details.
          </AlertDescription>
        </div>
        <Button 
          onClick={handleAccept} 
          className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
          size="sm"
        >
          Accept Cookies
        </Button>
      </Alert>
    </div>
  );
}
