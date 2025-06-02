
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ThemeProvider } from '@/contexts/ThemeContext'; // Added ThemeProvider

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'GutCheck', // Updated App Name
  description: 'Your AI companion for managing IBS through smart food logging.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark"> {/* Default dark class, theme-specific classes added by ThemeProvider */}
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} font-body antialiased min-h-screen flex flex-col bg-background text-foreground`}>
        <AuthProvider>
          <ThemeProvider> {/* Wrapped with ThemeProvider */}
            {/* Navbar is now rendered within page.tsx or PremiumDashboardSheet */}
            <main className="flex-grow container mx-auto px-0 sm:px-4 py-0 sm:py-8"> {/* Adjusted padding for full-width premium */}
              {children}
            </main>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
