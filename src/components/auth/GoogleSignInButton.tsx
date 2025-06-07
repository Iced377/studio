
'use client';

import { useState } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { signInWithGoogle } from '@/lib/firebase/auth';
import { Chrome } from 'lucide-react';
import type { AuthError } from 'firebase/auth';
import { cn } from '@/lib/utils';
// useRouter is no longer needed here for direct redirection on popup success.
// AuthProvider and the auth pages will handle the auth state changes.

interface GoogleSignInButtonProps extends Omit<ButtonProps, 'onClick' | 'disabled' | 'children'> {
  variant?: ButtonProps['variant'] | 'guest';
}

export default function GoogleSignInButton({ variant, className, size, ...props }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // signInWithGoogle will trigger onAuthStateChanged in AuthProvider
      // which updates the global auth state.
      // Auth pages (/login, /signup) will then react to this change and redirect.
      await signInWithGoogle();
      // For popup flow, success is implicitly handled by onAuthStateChanged.
      // For redirect flow, AuthProvider handles the result after page reload.
      // A generic success toast might be too early here, let AuthProvider or pages handle it.
    } catch (error) {
      console.error("Google login error:", error);
      toast({
        title: 'Login failed',
        description: (error as AuthError).message || 'Could not sign in with Google.',
        variant: 'destructive',
      });
    } finally {
      // setLoading(false) might not execute before navigation in redirect flow.
      // AuthProvider manages overall loading state. For popup, this is fine.
      setLoading(false);
    }
  };

  const buttonBaseClasses = variant === 'guest'
    ? "bg-transparent text-white border-white hover:bg-white/10 h-9 px-4" // Guest specific styling
    : "w-full"; // Standard variant takes full width from parent

  return (
    <Button
      variant={variant === 'guest' ? 'outline' : 'outline'}
      size={size} // Apply the size prop
      className={cn(buttonBaseClasses, className)}
      onClick={handleGoogleLogin}
      disabled={loading}
      {...props}
    >
      <Chrome className="mr-2 h-5 w-5" />
      {loading ? 'Signing in...' : 'Sign in with Google'}
    </Button>
  );
}
