
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LogOut, LogIn, Sun, Moon, BarChart3, UserPlus, User, Atom, CreditCard, ShieldCheck as AdminIcon, Lightbulb, X, ScrollText, LayoutGrid, Plus, Shield, Menu } from 'lucide-react';
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
export const APP_VERSION = "Beta 3.5.7";

interface ReleaseNote {
  version: string;
  date?: string;
  title?: string;
  description: string | string[];
}

const releaseNotesData: ReleaseNote[] = [
  {
    version: "Beta 3.5.7",
    date: "June 07, 2025",
    title: "UI Refinement & Consistency Pass",
    description: [
      "Implemented a new brand-aligned color scheme (soft blues, pale violet accents) for a more polished and user-friendly interface.",
      "Standardized button styles and sizes across dialogs and authentication forms for improved consistency.",
      "Enhanced Navbar logo display with a consistent themed background and increased size for better visibility.",
      "Refined padding and typography in key components like timeline cards for a cleaner layout.",
      "Removed unused UI elements and ad placeholders from dialogs.",
    ],
  },
  {
    version: "Beta 3.5.6",
    date: "June 07, 2025",
    title: "Enhanced App Aesthetics & Branding",
    description: "Implemented a new color scheme (whites, grays, themed green accent) for a more polished and user-friendly interface. Theme management now focuses on light/dark modes of this new branded look.",
  },
  {
    version: "Beta 3.5.5",
    date: "June 07, 2025",
    title: "Privacy Notice Page",
    description: [
      "Added a new Privacy Notice page accessible from the user dropdown menu.",
      "Updated app version to Beta 3.5.5.",
    ],
  },
  {
    version: "Beta 3.5.4",
    date: "June 06, 2025",
    title: "Improved Supplement Photo ID",
    description: [
      "Enhanced the 'Identify Food by Photo' feature to more accurately capture specific nutrient quantities (e.g., 'Vitamin D3 50,000 IU') when OCR'd from supplement labels.",
      "This ensures precise data from labels is passed to the main food analysis flow.",
    ],
  },
  {
    version: "Beta 3.5.3",
    date: "June 06, 2025",
    title: "AI Micronutrient Handling Improvements",
    description: [
      "Further refined AI prompt instructions to more accurately process and record user-provided specific micronutrient quantities for text-based food logging.",
      "Aimed to prevent the AI from substituting or ignoring explicit dosage information provided by the user.",
    ],
  },
  {
    version: "Beta 3.5.2",
    date: "June 06, 2025",
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
    date: "June 06, 2025",
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
    date: "June 05, 2024",
    title: "Admin Panel & UI Enhancements",
    description: "Iterative fixes for admin panel permissions. General UI polish.",
  },
  {
    version: "Beta 3.4.0",
    date: "June 04, 2024",
    title: "Rule Refinements",
    description: "Refined Firestore security rules for better access control.",
  },
];


interface NavbarProps {
  isGuest?: boolean;
  onMainActionClick?: () => void;
  onOpenDashboardClick?: () => void;
}

const LOCALSTORAGE_LAST_SEEN_VERSION_KEY = 'lastSeenAppVersion';

export default function Navbar({ isGuest, onMainActionClick, onOpenDashboardClick }: NavbarProps) {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const [isReleaseNotesOpen, setIsReleaseNotesOpen] = useState(false);
  const [showNewReleaseIndicator, setShowNewReleaseIndicator] = useState(false);

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lastSeenVersion = localStorage.getItem(LOCALSTORAGE_LAST_SEEN_VERSION_KEY);
      if (lastSeenVersion !== APP_VERSION) {
        setShowNewReleaseIndicator(true);
      }
    }
  }, []);


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

  const handleReleaseNotesToggle = (open: boolean) => {
    if (open) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCALSTORAGE_LAST_SEEN_VERSION_KEY, APP_VERSION);
      }
      setShowNewReleaseIndicator(false);
    }
    setIsReleaseNotesOpen(open);
  };

  const headerBaseClasses = "sticky top-0 z-50 w-full";
  const headerClasses = cn(
    headerBaseClasses,
    "bg-card text-card-foreground border-b border-border"
  );
  const appNameBaseClasses = "font-bold font-headline text-xl";

  return (
    <header className={headerClasses}>
      <div className={cn("flex h-16 w-full items-center justify-between", "px-2 sm:px-4")}>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-full border-2 p-1", "bg-primary border-primary")}>
              <Image src="/Gutcheck_logo.png" alt="GutCheck Logo" width={39} height={39} className={cn("object-contain", isGuest ? "" : "filter brightness-0 invert" )} priority />
            </div>
            <span className={cn(appNameBaseClasses, 'text-current', 'hidden sm:inline-block')}>{APP_NAME}</span>
          </Link>
          {!isGuest && (
            <Dialog open={isReleaseNotesOpen} onOpenChange={handleReleaseNotesToggle}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn("text-xs p-1 h-auto ml-0 mt-1 rounded-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 relative", "text-primary underline underline-offset-2 hover:text-primary/90")}
                  aria-label={`App Version ${APP_VERSION}, click for release notes`}
                >
                  {APP_VERSION}
                  {showNewReleaseIndicator && (
                    <span
                      className="absolute top-0.5 right-0.5 block h-2 w-2 rounded-full bg-red-500 border border-background"
                      aria-hidden="true"
                    />
                  )}
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


        <div className={cn("flex items-center", "space-x-0.5 sm:space-x-1")}>
          {isGuest ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
               <span className="hidden sm:inline text-sm text-foreground font-medium">Ready to track?</span>
              <Button
                onClick={() => router.push('/login')}
                className={cn(
                  "h-9 px-3 sm:px-4 text-xs sm:text-sm",
                  "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                variant={'default'}
              >
                <UserPlus className="mr-1.5 h-4 sm:h-5 w-4 sm:w-5" />
                Sign In / Up
              </Button>
            </div>
          ) : (
            <>
              {!authLoading && authUser && onMainActionClick && (
                <Button variant="ghost" size="icon" className={cn("h-8 w-8 focus-visible:ring-0 focus-visible:ring-offset-0 text-primary hover:text-primary/90 hover:bg-primary/10")} aria-label="Add Entry" onClick={onMainActionClick}>
                  <Plus className="h-6 w-6" strokeWidth={3} />
                </Button>
              )}

              <div className="hidden md:flex items-center space-x-0.5 sm:space-x-1">
                {!authLoading && authUser && (
                  <>
                    {onOpenDashboardClick && (
                      <Button variant="ghost" size="icon" className={cn("h-8 w-8 focus-visible:ring-0 focus-visible:ring-offset-0 text-current hover:text-current/80 hover:bg-current/10")} aria-label="Open Dashboard" onClick={onOpenDashboardClick}>
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
                  </>
                )}

                <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="h-8 w-8 text-current hover:text-current/80 hover:bg-current/10" aria-label="Toggle dark mode">
                  {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>

                {!authLoading && authUser && (
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
                      <DropdownMenuItem onClick={() => router.push('/privacy')} className="cursor-pointer">
                         <Shield className="mr-2 h-4 w-4" />
                         <span>Privacy Notice</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {!authLoading && authUser && (
                <div className="md:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-current hover:text-current/80 hover:bg-current/10" aria-label="Open menu">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={authUser.photoURL || undefined} alt={authUser.displayName || 'User'} />
                              <AvatarFallback className="bg-muted text-muted-foreground">
                                {authUser.photoURL ? getInitials(authUser.displayName) : <User className="h-4 w-4" />}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium leading-none text-foreground">{authUser.displayName || 'User'}</p>
                              <p className="text-xs leading-none text-muted-foreground">{authUser.email}</p>
                            </div>
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {onOpenDashboardClick && (
                        <DropdownMenuItem onClick={onOpenDashboardClick} className="cursor-pointer">
                          <LayoutGrid className="mr-2 h-4 w-4" />
                          <span>Dashboard</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={trendsLinkHandler} className="cursor-pointer">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        <span>Trends</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={micronutrientsLinkHandler} className="cursor-pointer">
                        <Atom className="mr-2 h-4 w-4" />
                        <span>Micronutrients</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={aiInsightsLinkHandler} className="cursor-pointer">
                        <Lightbulb className="mr-2 h-4 w-4" />
                        <span>AI Insights</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={toggleDarkMode} className="cursor-pointer">
                        {isDarkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                        <span>Toggle Theme</span>
                      </DropdownMenuItem>
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
                       <DropdownMenuItem onClick={() => router.push('/privacy')} className="cursor-pointer">
                         <Shield className="mr-2 h-4 w-4" />
                         <span>Privacy Notice</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
