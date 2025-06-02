
'use client';

import { useState } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button'; // Import ButtonProps
import { useToast } from '@/hooks/use-toast';
import { signInWithGoogle } from '@/lib/firebase/auth';
import { Chrome } from 'lucide-react'; 
import type { UserCredential, AuthError } from 'firebase/auth';
import { cn } from '@/lib/utils';

interface GoogleSignInButtonProps extends Omit<ButtonProps, 'onClick' | 'disabled' | 'children'> {
  variant?: ButtonProps['variant'] | 'guest'; // Allow 'guest' as a special variant
}

export default function GoogleSignInButton({ variant, className, ...props }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result && (result as UserCredential).user && variant !== 'guest') { // Only toast if not guest variant (handled by AuthProvider)
        toast({ title: 'Login Successful', description: 'Welcome!' });
      }
    } catch (error) {
      console.error("Google login error:", error);
      toast({
        title: 'Login failed',
        description: (error as AuthError).message || 'Could not sign in with Google.',
        variant: 'destructive',
      });
      setLoading(false); 
    }
    // setLoading(false) is tricky with redirects; AuthProvider handles loading state.
  };

  const buttonClasses = variant === 'guest' 
    ? "bg-transparent text-white border-white hover:bg-white/10 h-9 px-4" 
    : "w-full max-w-xs";

  return (
    <Button
      variant={variant === 'guest' ? 'outline' : 'outline'} // Shadcn variant
      className={cn(buttonClasses, className)}
      onClick={handleGoogleLogin}
      disabled={loading}
      {...props}
    >
      <Chrome className="mr-2 h-5 w-5" />
      {loading ? 'Signing in...' : 'Sign in with Google'}
    </Button>
  );
}
