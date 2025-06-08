
import type { Metadata } from 'next';
import LandingPageClientContent from '@/components/landing/LandingPageClientContent'; // Updated import

export const metadata: Metadata = {
  title: 'GutCheck - Track Your Gut, Transform Your Health',
  description: 'Gutcheck helps you identify foods that trigger IBS and optimize your diet effectively. Log meals, get FODMAP feedback, track reactions, and receive AI recommendations.',
  openGraph: {
    title: 'GutCheck - Track Your Gut, Transform Your Health',
    description: 'Identify IBS triggers and optimize your diet with GutCheck.',
    images: [
      {
        url: '/Gutcheck_logo.png', 
        width: 512,
        height: 512,
        alt: 'GutCheck Logo',
      },
    ],
  },
};

// This is the Server Component for the /landing route
export default function LandingPage() {
  return <LandingPageClientContent />;
}
