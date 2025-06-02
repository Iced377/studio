
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { signInWithGoogle } from '@/lib/firebase/auth';
import { Chrome } from 'lucide-react'; // Using Chrome icon for Google
import type { UserCredential, AuthError } from 'firebase/auth';

export default function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // signInWithGoogle might navigate away if it uses signInWithRedirect (on mobile)
      // or it might return a UserCredential if it uses signInWithPopup (on desktop)
      const result = await signInWithGoogle();

      // If signInWithPopup was used (desktop) and was successful, result will be UserCredential
      // If signInWithRedirect was used (mobile), this part might not be reached if redirect happens.
      // The redirect result is handled in AuthProvider.
      if (result && (result as UserCredential).user) {
         // This case is primarily for desktop (signInWithPopup)
        toast({ title: 'Login Successful', description: 'Welcome!' });
        // Optionally, redirect here for desktop, or let AuthProvider handle global state.
        // router.push('/');
      }
      // If signInWithRedirect is initiated, the page navigates away, so setLoading(false)
      // might not be called here. This is fine as AuthProvider handles the post-redirect state.
    } catch (error) {
      console.error("Google login error:", error);
      toast({
        title: 'Login failed',
        description: (error as AuthError).message || 'Could not sign in with Google.',
        variant: 'destructive',
      });
      setLoading(false); // Ensure loading is false on error
    }
    // Do not set setLoading(false) here if a redirect might have occurred,
    // as the component instance might be destroyed.
    // It's set to false only in the error case above.
    // If it's a popup that didn't error, it usually means success and navigation/state change will happen.
  };

  return (
    <Button
      variant="outline"
      className="w-full max-w-xs"
      onClick={handleGoogleLogin}
      disabled={loading}
    >
      <Chrome className="mr-2 h-5 w-5" />
      {loading ? 'Signing in...' : 'Sign in with Google'}
    </Button>
  );
}
