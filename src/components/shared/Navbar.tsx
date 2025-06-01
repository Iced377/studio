'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LifeBuoy } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <LifeBuoy className="h-6 w-6 text-primary" /> {/* Placeholder icon */}
          <span className="font-bold font-headline sm:inline-block text-xl">
            FODMAPSafe
          </span>
        </Link>
        
        <div className="flex flex-1 items-center justify-end space-x-4">
          <ThemeToggle />
          {/* User-specific UI removed */}
        </div>
      </div>
    </header>
  );
}
