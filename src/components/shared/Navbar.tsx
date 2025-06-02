
'use client';

import Link from 'next/link';
import { LifeBuoy, LogOut, LogIn, UserCircle, Settings, Zap, Palette, Check, Sun, Moon } from 'lucide-react'; 
import { useAuth } from '@/components/auth/AuthProvider';
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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from '@/contexts/ThemeContext'; 

const APP_NAME = "GutCheck";
const APP_VERSION = "v2.4";

interface NavbarProps {
  onUpgradeClick?: () => void; 
  isPremium?: boolean; 
}

export default function Navbar({ onUpgradeClick, isPremium }: NavbarProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme, isDarkMode, toggleDarkMode } = useTheme();

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-auto flex items-center space-x-2">
          <LifeBuoy className="h-7 w-7 text-primary" /> 
          <span className="font-bold font-headline sm:inline-block text-xl text-foreground">
            {APP_NAME}
          </span>
          <span className="text-xs text-muted-foreground ml-1 mt-1">{APP_VERSION}</span>
        </Link>
        
        <div className="flex items-center space-x-2">
          {!loading && user && onUpgradeClick && !isPremium && (
             <Button onClick={onUpgradeClick} size="sm" variant="outline" className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10">
                <Zap className="mr-2 h-4 w-4" /> Upgrade
            </Button>
          )}
           {!loading && user && isPremium && (
            <span className="text-xs font-medium text-primary border border-primary/50 bg-primary/10 px-2 py-1 rounded-md flex items-center">
                <Zap className="mr-1 h-3 w-3" /> Premium
            </span>
          )}

          <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="h-8 w-8">
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="sr-only">Toggle dark mode</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Palette className="h-5 w-5" />
                <span className="sr-only">Change theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Select Theme</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as 'black' | 'orange' | 'green' | 'red')}>
                <DropdownMenuRadioItem value="black">
                  Black (Default)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="orange">
                  Orange
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="green">
                  Green
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="red">
                  Red
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

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
                <DropdownMenuItem className="cursor-pointer" disabled>
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" disabled>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
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
