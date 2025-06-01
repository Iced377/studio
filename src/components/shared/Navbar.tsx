'use client';

import Link from 'next/link';
// import { Button } from '@/components/ui/button'; // Not used anymore
import { LifeBuoy } from 'lucide-react'; // Or a more food/scan related icon
// ThemeToggle is removed as dark mode is default

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          {/* Consider a more thematic icon if LifeBuoy isn't fitting */}
          <LifeBuoy className="h-7 w-7 text-primary" /> 
          <span className="font-bold font-headline sm:inline-block text-xl text-foreground">
            FODMAPSafe
          </span>
        </Link>
        
        <div className="flex flex-1 items-center justify-end space-x-2">
          {/* Navbar is simplified, user-specific UI and theme toggle removed for now */}
        </div>
      </div>
    </header>
  );
}
