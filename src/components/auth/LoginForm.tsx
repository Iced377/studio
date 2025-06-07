
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmail, sendPasswordReset } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { AuthError } from 'firebase/auth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const resetPasswordSchema = z.object({
  resetEmail: z.string().email({ message: 'Please enter a valid email address.' }),
});
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      resetEmail: '',
    },
  });

  const handleEmailLogin = async (data: LoginFormValues) => {
    setLoading(true);
    const result = await signInWithEmail(data.email, data.password);
    if ('user' in result) {
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      router.push('/');
    } else {
      toast({
        title: 'Login Failed',
        description: (result as AuthError).message || 'An unknown error occurred.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const handlePasswordResetRequest = async (data: ResetPasswordFormValues) => {
    setResetLoading(true);
    const error = await sendPasswordReset(data.resetEmail);
    if (error) {
      // Firebase errors (like auth/user-not-found) are caught here
      // We still show a generic message to prevent email enumeration
      toast({
        title: 'Password Reset',
        description: 'If an account with that email exists, a password reset link has been sent.',
        variant: 'default',
      });
    } else {
      toast({
        title: 'Password Reset Email Sent',
        description: 'If an account with that email exists, a password reset link has been sent.',
        variant: 'default',
      });
    }
    setResetLoading(false);
    setIsResetPasswordDialogOpen(false);
    resetPasswordForm.reset();
  };

  return (
    // Removed w-full max-w-md space-y-6 from here, page will control max-width
    <div className="space-y-6"> 
      <form onSubmit={loginForm.handleSubmit(handleEmailLogin)} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...loginForm.register('email')}
            placeholder="you@example.com"
            className="mt-1"
          />
          {loginForm.formState.errors.email && (
            <p className="text-sm text-destructive mt-1">{loginForm.formState.errors.email.message}</p>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <AlertDialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  className="text-sm font-medium text-primary hover:underline"
                  onClick={() => setIsResetPasswordDialogOpen(true)}
                >
                  Forgot Password?
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <form onSubmit={resetPasswordForm.handleSubmit(handlePasswordResetRequest)}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Your Password</AlertDialogTitle>
                    <AlertDialogDescription>
                      Enter the email address associated with your account, and we&apos;ll send you a link to reset your password.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                    <Label htmlFor="resetEmail" className="sr-only">Email for password reset</Label>
                    <Input
                      id="resetEmail"
                      type="email"
                      placeholder="Enter your email"
                      {...resetPasswordForm.register('resetEmail')}
                      className={resetPasswordForm.formState.errors.resetEmail ? "border-destructive" : ""}
                    />
                    {resetPasswordForm.formState.errors.resetEmail && (
                      <p className="text-sm text-destructive mt-1">{resetPasswordForm.formState.errors.resetEmail.message}</p>
                    )}
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel type="button" onClick={() => { setIsResetPasswordDialogOpen(false); resetPasswordForm.reset(); }} disabled={resetLoading}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction type="submit" disabled={resetLoading}>
                      {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send Reset Email
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </form>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <Input
            id="password"
            type="password"
            {...loginForm.register('password')}
            placeholder="••••••••"
            className="mt-1"
          />
          {loginForm.formState.errors.password && (
            <p className="text-sm text-destructive mt-1">{loginForm.formState.errors.password.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
      {/* "Don't have an account?" link moved to page level */}
      {/* Google Sign In button and "Or continue with" also moved to page level */}
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
