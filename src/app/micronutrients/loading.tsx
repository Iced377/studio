
'use client';
import { Loader2 } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';

export default function MicronutrientsLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <div className="flex-grow flex items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-xl text-foreground">Loading Micronutrients...</p>
      </div>
    </div>
  );
}
