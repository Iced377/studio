
'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import Navbar from '@/components/shared/Navbar';
import MicronutrientProgressDisplay from '@/components/shared/MicronutrientProgressDisplay';
import { Loader2, AlertTriangle, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function MicronutrientsPage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-foreground">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-semibold mb-2 text-foreground">Access Denied</h2>
          <p className="text-muted-foreground">Please log in to view your micronutrient progress.</p>
           <div className="mt-8">
            <Button asChild variant="outline">
              <Link href="/?openDashboard=true">
                <Home className="mr-2 h-4 w-4" /> Return to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Daily Micronutrient Tracker</h1>
        <MicronutrientProgressDisplay userId={user.uid} />
        <div className="mt-12 text-center">
          <Button asChild variant="outline">
            <Link href="/?openDashboard=true">
              <Home className="mr-2 h-4 w-4" /> Return to Dashboard
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
