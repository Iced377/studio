
'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import Navbar from '@/components/shared/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, CheckCircle, Star } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionPage() {
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

  // Note: In a real app, you'd fetch the user's current subscription status from your backend/Firestore.
  // For this placeholder, we'll just use the 'premium' flag from the client-side userProfile if available,
  // or assume they are on a free plan.
  const isCurrentlyPremium = user?.email === 'testpremium@example.com'; // Placeholder logic

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            {isCurrentlyPremium ? 'Manage Your Subscription' : 'Unlock Premium Features'}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {isCurrentlyPremium 
              ? 'View your current plan details and manage your subscription.'
              : 'Choose a plan that fits your needs and gain access to exclusive insights, unlimited history, and more.'}
          </p>
        </div>

        {isCurrentlyPremium ? (
          <Card className="max-w-md mx-auto bg-card shadow-lg border-primary">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center text-primary">
                <Star className="mr-2 h-6 w-6 fill-yellow-400 text-yellow-500" /> Current Plan: Premium
              </CardTitle>
              <CardDescription className="text-muted-foreground">You have access to all GutCheck features!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p><CheckCircle className="inline-block mr-2 h-5 w-5 text-green-500" /> Unlimited food & symptom logging history.</p>
              <p><CheckCircle className="inline-block mr-2 h-5 w-5 text-green-500" /> Advanced trend analysis.</p>
              <p><CheckCircle className="inline-block mr-2 h-5 w-5 text-green-500" /> Detailed micronutrient tracking.</p>
              <p><CheckCircle className="inline-block mr-2 h-5 w-5 text-green-500" /> Priority AI insights.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full border-accent text-accent-foreground hover:bg-accent/10" disabled>
                Manage Subscription (External Link Placeholder)
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="bg-card shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-foreground">Free Plan</CardTitle>
                <CardDescription className="text-muted-foreground">Basic food logging and insights.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-3xl font-bold text-foreground">$0<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                <p><CheckCircle className="inline-block mr-2 h-5 w-5 text-green-500" /> Log meals with AI analysis</p>
                <p><CheckCircle className="inline-block mr-2 h-5 w-5 text-green-500" /> 2-day data retention for trends</p>
                <p><CheckCircle className="inline-block mr-2 h-5 w-5 text-green-500" /> Basic FODMAP indicators</p>
                 <p className="text-muted-foreground"><Star className="inline-block mr-2 h-5 w-5 text-transparent" /> Limited micronutrient view</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" disabled>
                  Currently Active
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-card shadow-xl border-2 border-primary">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl text-primary">Premium Plan</CardTitle>
                  <span className="text-xs font-semibold bg-primary text-primary-foreground px-2 py-1 rounded-full">POPULAR</span>
                </div>
                <CardDescription className="text-muted-foreground">Unlock the full power of GutCheck.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-3xl font-bold text-primary">$9.99<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                <p><Star className="inline-block mr-2 h-5 w-5 text-yellow-400" /> Unlimited data retention</p>
                <p><Star className="inline-block mr-2 h-5 w-5 text-yellow-400" /> Full trend analysis over time</p>
                <p><Star className="inline-block mr-2 h-5 w-5 text-yellow-400" /> Detailed micronutrient tracking</p>
                <p><Star className="inline-block mr-2 h-5 w-5 text-yellow-400" /> Deeper AI-powered correlations</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled>
                  Upgrade to Premium (Coming Soon)
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
        
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Payments will be processed securely by our partner (e.g., Stripe). We do not store your card details.</p>
          <p>You can cancel your subscription at any time.</p>
          <p className="mt-2">Need help? <Link href="/contact" className="underline hover:text-primary">Contact Support</Link> (Contact page not yet implemented)</p>
        </div>
      </main>
    </div>
  );
}
