
'use client'; // Ensure this is at the top

import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation'; // Import useRouter
import LoginForm from '@/components/auth/LoginForm';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { Button } from '@/components/ui/button'; // Import Button
import { Loader2, ArrowLeft } from 'lucide-react'; // Import ArrowLeft

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-full flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md px-4 sm:px-0">
        <Button 
          variant="outline" 
          onClick={() => router.back()} 
          className="mb-6 flex items-center self-start"
          aria-label="Go back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground">
          Welcome to GutCheck
        </h1>
        <p className="mt-2 text-muted-foreground">
          Sign in with your email and password or use Google.
        </p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <LoginForm />
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <div className="mt-6">
              <GoogleSignInButton className="w-full" size="lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
