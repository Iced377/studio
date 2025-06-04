
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LogOut, LogIn, Sun, Moon, BarChart3, UserPlus, User, Atom, CreditCard, ShieldCheck as AdminIcon } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { signOutUser } from '@/lib/firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
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
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { UserProfile } from '@/types';

const APP_NAME = "GutCheck";
export const APP_VERSION = "Beta 3.4";

interface NavbarProps {
  isGuest?: boolean;
  guestButtonScheme?: {
    base: string;
    border: string;
    hover: string;
  };
}

export default function Navbar({ isGuest, guestButtonScheme }: NavbarProps) {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (authUser) {
        try {
          const userProfileDocRef = doc(db, 'users', authUser.uid);
          const userProfileSnap = await getDoc(userProfileDocRef);
          if (userProfileSnap.exists()) {
            const userProfileData = userProfileSnap.data() as UserProfile;
            setIsCurrentUserAdmin(userProfileData.isAdmin === true);
          } else {
            setIsCurrentUserAdmin(false);
          }
        } catch (error) {
          console.error("Error fetching user profile for Navbar:", error);
          setIsCurrentUserAdmin(false);
        }
      } else {
        setIsCurrentUserAdmin(false);
      }
    };
    if (!authLoading) {
      fetchUserProfile();
    }
  }, [authUser, authLoading]);

  const handleSignOut = async () => {
    const error = await signOutUser();
    if (error) {
      toast({ title: 'Logout Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/');
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || '';
    return (names[0][0]?.toUpperCase() || '') + (names[names.length - 1][0]?.toUpperCase() || '');
  };

  const trendsLinkHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname === '/trends') {
      router.push('/?openDashboard=true');
    } else {
      router.push('/trends');
    }
  };
  
  const micronutrientsLinkHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname === '/micronutrients') {
      router.push('/?openDashboard=true');
    } else {
      router.push('/micronutrients');
    }
  };


  const headerBaseClasses = "sticky top-0 z-50 w-full";
  const guestHeaderClasses = "bg-background text-foreground";
  const registeredUserHeaderClasses = cn(
    !isDarkMode ? "bg-muted text-foreground" : "bg-background text-foreground",
    "border-b border-border/50"
  );

  const appNameBaseClasses = "font-bold font-headline sm:inline-block text-xl";

  return (
    <header className={cn(
        headerBaseClasses,
        isGuest ? guestHeaderClasses : registeredUserHeaderClasses
    )}>
      <div className="flex h-16 w-full max-w-screen-2xl items-center justify-between px-4 mx-auto">
        <Link href="/" className="flex items-center space-x-2">
          {!isGuest && ( 
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-foreground bg-black p-1">
              <Image
                src="/Gutcheck_logo.png"
                alt="GutCheck Logo"
                width={28}
                height={28}
                className={cn("object-contain", "filter brightness-0 invert")}
                priority
              />
            </div>
          )}
          {!isGuest && (
            <>
              <span className={cn(appNameBaseClasses, 'text-foreground')}>
                {APP_NAME}
              </span>
              <span className="text-xs text-muted-foreground ml-1 mt-1">{APP_VERSION}</span>
            </>
          )}
        </Link>

        <div className="flex items-center space-x-1 sm:space-x-1.5">
          {isGuest && guestButtonScheme ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <span className="hidden sm:inline text-sm text-foreground font-medium animate-pulse">Unlock your gut's secrets! ✨</span>
              <Button
                onClick={() => router.push('/login')}
                className={cn(
                  "h-9 px-3 sm:px-4 text-white text-xs sm:text-sm",
                  guestButtonScheme.base,
                  guestButtonScheme.border,
                  guestButtonScheme.hover
                )}
              >
                <UserPlus className="mr-1.5 h-4 sm:h-5 w-4 sm:w-5" />
                Sign In / Sign Up
              </Button>
            </div>
          ) : isGuest ? ( 
             <Button
              onClick={() => router.push('/login')}
              variant="default"
              className="h-9 px-4"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Sign In / Sign Up
            </Button>
          ) : (
            <>
              {!authLoading && authUser && (
                <>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                        "h-8 w-8 focus-visible:ring-0 focus-visible:ring-offset-0", 
                        pathname === '/trends' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    )} 
                    aria-label="Trends" 
                    onClick={trendsLinkHandler}
                  >
                    <BarChart3 className="h-5 w-5" />
                  </Button>
                  <Button 
                      variant="ghost" 
                      size="icon" 
                      className={cn(
                        "h-8 w-8 focus-visible:ring-0 focus-visible:ring-offset-0",
                        pathname === '/micronutrients' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      )} 
                      aria-label="Micronutrients Progress"
                      onClick={micronutrientsLinkHandler}
                    >
                      <Atom className="h-5 w-5" />
                  </Button>
                </>
              )}

              <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="h-8 w-8" aria-label="Toggle dark mode">
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {!authLoading && authUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full border-2 border-foreground p-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={authUser.photoURL || undefined} alt={authUser.displayName || 'User'} />
                        <AvatarFallback className="bg-muted text-muted-foreground">
                            {authUser.photoURL ? getInitials(authUser.displayName) : <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-foreground">
                          {authUser.displayName || 'User'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {authUser.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     {isCurrentUserAdmin && (
                       <DropdownMenuItem onClick={() => router.push('/admin/feedback')} className="cursor-pointer">
                        <AdminIcon className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </DropdownMenuItem>
                     )}
                     <DropdownMenuItem onClick={() => router.push('/account/subscription')} className="cursor-pointer">
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>Upgrade to Premium</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
