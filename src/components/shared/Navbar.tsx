
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LogOut, LogIn, Sun, Moon, BarChart3, UserPlus, User, Atom, CreditCard, ShieldCheck as AdminIcon, Lightbulb, X, ScrollText, LayoutGrid, Plus, Home } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { signOutUser } from '@/lib/firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { db } from '@/config/firebase';
import {
  getDoc,
  doc as firestoreDoc,
} from 'firebase/firestore';
import type { UserProfile } from '@/types';

const APP_NAME = "GutCheck";
export const APP_VERSION = "Beta 3.5.3";

interface ReleaseNote {
  version: string;
  date?: string;
  title?: string;
  description: string | string[];
}

const releaseNotesData: ReleaseNote[] = [
  {
    version: "Beta 3.5.3",
    date: "July 30, 2024", // Or a more dynamic way to get current date if needed
    title: "AI Micronutrient Handling Improvements",
    description: [
      "Further refined AI prompt instructions to more accurately process and record user-provided specific micronutrient quantities.",
      "Aimed to prevent the AI from substituting or ignoring explicit dosage information provided by the user.",
    ],
  },
  {
    version: "Beta 3.5.2",
    date: "July 30, 2024",
    title: "Food Card Enhancements & Indicator Reordering",
    description: [
      "Enhanced AI notes in food cards to include summaries for micronutrients and GI.",
      "Added highlighting for common allergens in food cards.",
      "Introduced a new 'Keto Friendliness' indicator badge.",
      "Reordered indicator badges on food cards: Micronutrients, Fiber, GI, Keto Score, FODMAP, Gut Impact, Allergens.",
      "Moved the main FODMAP risk indicator from card header to the content area with other badges.",
    ],
  },
  {
    version: "Beta 3.5.1",
    date: "July 30, 2024",
    title: "Release Notes Feature & Admin Button",
    description: [
      "Made the app version in the navbar clickable.",
      "Clicking the version now displays this release notes dialog.",
      "Added 'Return to Dashboard' button on Admin page.",
      "Updated various UI elements and fixed minor bugs.",
    ],
  },
  {
    version: "Beta 3.5.0",
    date: "July 29, 2024",
    title: "Admin Panel & UI Enhancements",
    description: "Iterative fixes for admin panel permissions. General UI polish.",
  },
  {
    version: "Beta 3.4.0",
    date: "July 28, 2024",
    title: "Rule Refinements",
    description: "Refined Firestore security rules for better access control.",
  },
];


interface NavbarProps {
  isGuest?: boolean;
  guestButtonScheme?: {
    base: string;
    border: string;
    hover: string;
  };
  onMainActionClick?: () => void;
}

export default function Navbar({ isGuest, guestButtonScheme, onMainActionClick }: NavbarProps) {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const [isReleaseNotesOpen, setIsReleaseNotesOpen] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (authUser) {
        try {
          const userProfileRef = firestoreDoc(db, 'users', authUser.uid);
          const userProfileSnap = await getDoc(userProfileRef);
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
    router.push(pathname === '/trends' ? '/?openDashboard=true' : '/trends');
  };
  
  const micronutrientsLinkHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(pathname === '/micronutrients' ? '/?openDashboard=true' : '/micronutrients');
  };

  const aiInsightsLinkHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(pathname === '/ai-insights' ? '/?openDashboard=true' : '/ai-insights');
  };

  const headerBaseClasses = "sticky top-0 z-50 w-full";
  const guestHeaderClasses = "bg-background text-foreground";
  const registeredUserHeaderClasses = cn(
    "bg-secondary text-secondary-foreground", // For light mode
    "dark:bg-card dark:text-card-foreground",    // For dark mode
    "border-b border-border/50"
  );
  const appNameBaseClasses = "font-bold font-headline text-xl";

  return (
    <header className={cn(headerBaseClasses, isGuest ? guestHeaderClasses : registeredUserHeaderClasses)}>
      <div className="flex h-16 w-full items-center justify-between px-4">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            {!isGuest && (
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-full border-2 p-1", "border-current bg-current")}>
                <Image src="/Gutcheck_logo.png" alt="GutCheck Logo" width={28} height={28} className={cn("object-contain", "filter brightness-0 invert" )} priority />
              </div>
            )}
            {!isGuest && (
              <>
                <span className={cn(appNameBaseClasses, 'text-current hidden sm:inline-block')}>{APP_NAME}</span>
              </>
            )}
          </Link>
          {!isGuest && (
            <Dialog open={isReleaseNotesOpen} onOpenChange={setIsReleaseNotesOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-xs text-muted-foreground hover:text-primary hover:underline underline-offset-2 p-1 h-auto ml-0 mt-1 rounded-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1"
                  aria-label={`App Version ${APP_VERSION}, click for release notes`}
                >
                  {APP_VERSION}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="font-headline text-xl flex items-center">
                     <ScrollText className="mr-2 h-5 w-5" /> Release Notes
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-2 -mr-2 py-2">
                  <div className="space-y-4">
                    {releaseNotesData.map((release, index) => (
                      <div key={index} className="pb-3 border-b border-border last:border-b-0">
                        <h3 className="text-md font-semibold text-foreground">
                          Version {release.version}
                          {release.date && <span className="text-xs text-muted-foreground ml-2 font-normal">- {release.date}</span>}
                        </h3>
                        {release.title && <p className="text-sm font-medium text-primary mt-0.5">{release.title}</p>}
                        {Array.isArray(release.description) ? (
                          <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-0.5">
                            {release.description.map((note, noteIndex) => (
                              <li key={noteIndex}>{note}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">{release.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <DialogFooter className="sm:justify-start mt-2">
                  <DialogClose asChild>
                    <Button type="button" variant="secondary" className="w-full sm:w-auto">
                      Close
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>


        <div className="flex items-center space-x-1 sm:space-x-1.5">
          {isGuest ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              {guestButtonScheme ? <span className="hidden sm:inline text-sm text-foreground font-medium animate-pulse">Unlock your gut's secrets! ✨</span> : null}
              <Button
                onClick={() => router.push('/login')}
                className={cn(
                  "h-9 px-3 sm:px-4 text-xs sm:text-sm",
                  guestButtonScheme ? `${guestButtonScheme.base} ${guestButtonScheme.border} ${guestButtonScheme.hover} text-white` : ''
                )}
                variant={guestButtonScheme ? 'default' : 'default'}
              >
                <UserPlus className="mr-1.5 h-4 sm:h-5 w-4 sm:w-5" />
                Sign In / Sign Up
              </Button>
            </div>
          ) : (
            <>
              {!authLoading && authUser && (
                <div className="flex items-center space-x-1.5">
                  {onMainActionClick && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 focus-visible:ring-0 focus-visible:ring-offset-0 text-current hover:text-current/80 hover:bg-current/10" aria-label="Add Entry" onClick={onMainActionClick}>
                      <Plus className="h-5 w-5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className={cn("h-8 w-8 focus-visible:ring-0 focus-visible:ring-offset-0", pathname === '/' ? 'bg-primary/10 text-primary' : 'text-current hover:text-current/80 hover:bg-current/10')} aria-label="Home" onClick={() => router.push('/')}>
                    <Home className="h-5 w-5" />
                  </Button>
                  {onMainActionClick && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 focus-visible:ring-0 focus-visible:ring-offset-0 text-current hover:text-current/80 hover:bg-current/10" aria-label="Open Actions Menu" onClick={onMainActionClick}>
                      <LayoutGrid className="h-5 w-5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className={cn("h-8 w-8 focus-visible:ring-0 focus-visible:ring-offset-0", pathname === '/trends' ? 'bg-primary/10 text-primary' : 'text-current hover:text-current/80 hover:bg-current/10')} aria-label="Trends" onClick={trendsLinkHandler}>
                    <BarChart3 className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className={cn("h-8 w-8 focus-visible:ring-0 focus-visible:ring-offset-0", pathname === '/micronutrients' ? 'bg-primary/10 text-primary' : 'text-current hover:text-current/80 hover:bg-current/10')} aria-label="Micronutrients Progress" onClick={micronutrientsLinkHandler}>
                    <Atom className="h-5 w-5" />
                  </Button>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("h-8 w-8 focus-visible:ring-0 focus-visible:ring-offset-0", pathname === '/ai-insights' ? 'bg-primary/10 text-primary' : 'text-current hover:text-current/80 hover:bg-current/10')}
                      aria-label="AI Insights"
                      onClick={aiInsightsLinkHandler}
                    >
                      <Lightbulb className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}

              <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="h-8 w-8 text-current hover:text-current/80 hover:bg-current/10" aria-label="Toggle dark mode">
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {!authLoading && authUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full border-2 border-current p-0">
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
                        <p className="text-sm font-medium leading-none text-foreground">{authUser.displayName || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">{authUser.email}</p>
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
                       <span>Subscription</span>
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
    
