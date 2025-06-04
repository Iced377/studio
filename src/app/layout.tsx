
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ThemeProvider } from '@/contexts/ThemeContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002'),
  title: 'GutCheck',
  description: 'Your Ai companion for easy food logging and meaningful insights.',
  openGraph: {
    title: 'GutCheck',
    description: 'Your Ai companion for easy food logging and meaningful insights.',
    images: [
      {
        url: '/Gutcheck_logo.png',
        width: 512,
        height: 512,
        alt: 'GutCheck Logo',
      },
    ],
    type: 'website',
  },
  icons: {
    icon: '/Gutcheck_logo.png',
    shortcut: '/Gutcheck_logo.png',
    apple: '/Gutcheck_logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8897507841347789"
     crossOrigin="anonymous"></script>
      </head>
      <body className={`${inter.variable} font-body antialiased min-h-screen flex flex-col bg-background text-foreground`}>
        <AuthProvider>
          <ThemeProvider>
            {/* Navbar is now rendered within page.tsx or PremiumDashboardSheet */}
            <main className="flex-grow container mx-auto px-0 sm:px-4 py-0"> {/* Adjusted padding for full-width premium and screen fit */}
              {children}
            </main>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
