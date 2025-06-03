
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { signUpWithEmail } from '@/lib/firebase/auth'; // signInWithGoogle removed
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { AuthError } from 'firebase/auth';
// import { Chrome } from 'lucide-react'; // Chrome icon removed

const signUpSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUpForm() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleEmailSignUp = async (data: SignUpFormValues) => {
    setLoading(true);
    const result = await signUpWithEmail(data.email, data.password);
    if ('user' in result) {
      toast({ title: 'Sign Up Successful', description: 'Welcome to GutCheck!' });
      router.push('/');
    } else {
      toast({
        title: 'Sign Up Failed',
        description: (result as AuthError).message || 'An unknown error occurred.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };
  
  // handleGoogleSignUp function removed

  return (
    <div className="w-full max-w-md space-y-6">
      <form onSubmit={form.handleSubmit(handleEmailSignUp)} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...form.register('email')}
            placeholder="you@example.com"
            className="mt-1"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            {...form.register('password')}
            placeholder="••••••••"
            className="mt-1"
          />
          {form.formState.errors.password && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.password.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            {...form.register('confirmPassword')}
            placeholder="••••••••"
            className="mt-1"
          />
          {form.formState.errors.confirmPassword && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.confirmPassword.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing up...' : 'Sign Up'}
        </Button>
      </form>
      {/* "Or continue with" divider and Google signup button removed */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}
