
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LogOut, LogIn, Sun, Moon, BarChart3, UserPlus } from 'lucide-react'; // Added UserPlus
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
// GoogleSignInButton is no longer directly used here for guest, but might be on login page
import { cn } from '@/lib/utils';

const APP_NAME = "GutCheck";
export const APP_VERSION = "v3.0"; // Updated App Version

interface NavbarProps {
  onUpgradeClick?: () => void;
  isPremium?: boolean;
  isGuest?: boolean;
}

export default function Navbar({ onUpgradeClick, isPremium, isGuest }: NavbarProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const handleSignOut = async () => {
    const error = await signOutUser();
    if (error) {
      toast({ title: 'Logout Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/'); // Redirect to home/login after sign out
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || '';
    return (names[0][0]?.toUpperCase() || '') + (names[names.length - 1][0]?.toUpperCase() || '');
  };

  const trendsLinkHandler = (e: React.MouseEvent) => {
    if (pathname === '/trends') {
      e.preventDefault();
      // Potentially refresh or navigate to home if already on trends, or just do nothing.
      // For now, let's simplify and allow re-navigation or just push.
      router.push('/'); // Or conditionally router.refresh() if on /trends
    } else {
      router.push('/trends');
    }
  };

  const headerBaseClasses = "sticky top-0 z-50 w-full";
  const guestHeaderClasses = "bg-calo-green text-white";
  const defaultHeaderClasses = "bg-background text-foreground";

  const logoIconBaseClasses = "h-7 w-7";
  // const guestLogoIconClasses = "text-white"; // Not used if logo is hidden for guest

  const appNameBaseClasses = "font-bold font-headline sm:inline-block text-xl";

  return (
    <header className={cn(headerBaseClasses, isGuest ? guestHeaderClasses : defaultHeaderClasses)}>
      <div className="container flex h-16 max-w-screen-2xl items-center">
        {!isGuest && (
           <Link href="/" className="mr-auto flex items-center space-x-2">
            <Image
              src="/Gutcheck_logo.png"
              alt="GutCheck Logo"
              width={28}
              height={28}
              className={cn(
                "object-contain",
                logoIconBaseClasses,
                isDarkMode && !isGuest ? "" : "filter brightness-0" // Black logo in light mode for default nav
              )}
            />
            <span className={cn(appNameBaseClasses, 'text-foreground')}>
              {APP_NAME}
            </span>
            <span className="text-xs text-muted-foreground ml-1 mt-1">{APP_VERSION}</span>
          </Link>
        )}
        {isGuest && <div className="mr-auto"></div>}


        <div className="flex items-center space-x-1 sm:space-x-1.5">
          {isGuest ? (
            <Button
              variant="outline"
              onClick={() => router.push('/login')}
              className="bg-transparent text-white border-white hover:bg-white/10 h-9 px-4"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Sign In / Sign Up
            </Button>
          ) : (
            <>
              {!loading && user && (
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Trends" onClick={trendsLinkHandler}>
                  <BarChart3 className="h-5 w-5" />
                </Button>
              )}

              <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="h-8 w-8" aria-label="Toggle dark mode">
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

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
                    {/* Placeholder for future items like "Settings" or "Profile" */}
                    {/* <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem> */}
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
