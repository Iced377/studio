'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { User } from 'firebase/auth';
import {
  onAuthStateChanged,
  getRedirectResult,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [redirectLoading, setRedirectLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter(); 

  useEffect(() => {
    let unsub: ReturnType<typeof onAuthStateChanged>;

    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        return getRedirectResult(auth);
      })
      .then((result) => {
        if (result?.user) {
          setUser(result.user); 
          toast({ title: 'Welcome back!', description: result.user.displayName || 'Successfully signed in.' });
          router.push('/'); // Redirect to home after successful Google redirect
        }
      })
      .catch((error) => {
        console.error('Error during redirect result or persistence setting:', error);
        toast({
          title: 'Sign-in Error',
          description: error.message || 'Could not complete sign-in process.',
          variant: 'destructive',
        });
      })
      .finally(() => {
        setRedirectLoading(false);
      });

    unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser); 
      setAuthLoading(false); 
    });

    return () => {
      if (unsub) {
        unsub();
      }
    };
  }, [toast, router]); 

  const loading = redirectLoading || authLoading;

  const value = useMemo(() => ({ user, loading }), [user, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground">Loading Authentication...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
