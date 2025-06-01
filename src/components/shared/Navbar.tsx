
'use client';

import Link from 'next/link';
import { LifeBuoy, LogOut, LogIn } from 'lucide-react';
import { useAuthContext } from '@/hooks/use-auth-context';
import { signOutUser } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const APP_VERSION = "v0.1"; // Version stamp

export default function Navbar() {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const error = await signOutUser();
    if (error) {
      toast({ title: 'Logout Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/'); // Redirect to home or login page after logout
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || '';
    return (names[0][0]?.toUpperCase() || '') + (names[names.length - 1][0]?.toUpperCase() || '');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <LifeBuoy className="h-7 w-7 text-primary" /> 
          <span className="font-bold font-headline sm:inline-block text-xl text-foreground">
            FODMAPSafe
          </span>
          <span className="text-xs text-muted-foreground ml-1 mt-1">{APP_VERSION}</span> {/* Version Stamp */}
        </Link>
        
        <div className="flex flex-1 items-center justify-end space-x-4">
          {!loading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-foreground">
                      {user.displayName || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : !loading && !user ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" /> Login
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
