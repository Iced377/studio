'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { signInWithGoogle } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import type { AuthError } from 'firebase/auth';
import { Chrome } from 'lucide-react'; // Using Chrome icon for Google

export default function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await signInWithGoogle();
    if ('user' in result) {
      toast({ title: 'Login Successful', description: 'Welcome!' });
      router.push('/'); // Redirect to home page after successful login
    } else {
      toast({
        title: 'Google Login Failed',
        description: (result as AuthError).message || 'Could not sign in with Google.',
        variant: 'destructive',
      });
    }
    setLoading(false);
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
