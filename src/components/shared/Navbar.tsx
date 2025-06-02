
'use client';

import Link from 'next/link';
import { LogOut, LogIn, Sun, Moon, BarChart3, SmilePlus } from 'lucide-react'; // Added SmilePlus, removed LifeBuoy
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
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { cn } from '@/lib/utils';

const APP_NAME = "GutCheck";
export const APP_VERSION = "v2.7";

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
    if (pathname === '/trends') {
      e.preventDefault();
      router.push('/'); 
    } else {
       router.push('/trends');
    }
  };


  const headerBaseClasses = "sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-background/60";
  const guestHeaderClasses = "bg-calo-green border-white/20 text-white"; 
  const defaultHeaderClasses = "border-border/40 bg-background/95 text-foreground";

  const logoIconBaseClasses = "h-7 w-7";
  const guestLogoIconClasses = "text-white";
  const defaultLogoIconClasses = "text-primary";

  const appNameBaseClasses = "font-bold font-headline sm:inline-block text-xl";

  return (
    <header className={cn(headerBaseClasses, isGuest ? guestHeaderClasses : defaultHeaderClasses)}>
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-auto flex items-center space-x-2">
          {/* 
            Placeholder App Logo: 
            Replace this SmilePlus icon with your actual logo.
            Consider creating an SVG component for your logo or using next/image.
            Example with next/image (if logo.png is in public folder):
            import Image from 'next/image';
            <Image src="/logo.png" alt="GutCheck Logo" width={28} height={28} className={cn(logoIconBaseClasses, isGuest ? guestLogoIconClasses : defaultLogoIconClasses)} />
          */}
          <SmilePlus className={cn(logoIconBaseClasses, isGuest ? guestLogoIconClasses : defaultLogoIconClasses)} />
          <span className={cn(appNameBaseClasses, isGuest ? 'text-white' : 'text-foreground')}>
            {APP_NAME}
          </span>
          {!isGuest && <span className="text-xs text-muted-foreground ml-1 mt-1">{APP_VERSION}</span>}
        </Link>

        <div className="flex items-center space-x-1 sm:space-x-1.5">
          {isGuest ? (
            <GoogleSignInButton variant="guest" />
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
