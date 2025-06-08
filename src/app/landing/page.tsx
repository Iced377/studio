
import type { Metadata } from 'next';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Camera, Edit, BarChart2, Brain, Lightbulb, CheckCircle, MessageSquareQuestion, Users, ShieldCheck, PieChart, Activity, Zap } from 'lucide-react'; // Added more icons
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'GutCheck - Track Your Gut, Transform Your Health',
  description: 'Gutcheck helps you identify foods that trigger IBS and optimize your diet effectively. Log meals, get FODMAP feedback, track reactions, and receive AI recommendations.',
  openGraph: {
    title: 'GutCheck - Track Your Gut, Transform Your Health',
    description: 'Identify IBS triggers and optimize your diet with GutCheck.',
    images: [
      {
        url: '/Gutcheck_logo.png', // Assuming you have a logo in public
        width: 512,
        height: 512,
        alt: 'GutCheck Logo',
      },
    ],
  },
};

const featureIcons = {
  "Snap a Photo or Log a Meal": Camera,
  "Get Instant Deep Feedback": Brain,
  "Track Your Reactions": BarChart2,
  "Optimize with AI Recommendations": Lightbulb,
};

const howItWorksTooltips = {
  "Snap a Photo or Log a Meal": "Our AI can understand meal descriptions or analyze photos to identify ingredients.",
  "Get Instant Deep Feedback": "Receive insights on FODMAPs, micronutrients, potential gut impact, and glycemic load specific to your meal and portion.",
  "Track Your Reactions": "Correlate your logged symptoms with your meals to pinpoint personal sensitivities.",
  "Optimize with AI Recommendations": "Get suggestions for food swaps and discover patterns for a healthier gut.",
};

const AccuracyTipIcon = MessageSquareQuestion;

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-headline mb-6 tracking-tight">
            Track your gut. <span className="text-primary">Transform your health.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Gutcheck helps you identify foods that trigger IBS and optimize your diet, effectively.
          </p>
          <div className="mb-10">
            <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
              <Link href="/?openDashboard=true">Get Started Free</Link>
            </Button>
          </div>
          <div className="relative max-w-3xl mx-auto h-64 sm:h-96 bg-muted rounded-lg shadow-2xl overflow-hidden border border-border">
            <Image
              src="https://placehold.co/1200x600.png"
              alt="GutCheck app logging process infographic"
              layout="fill"
              objectFit="cover"
              className="opacity-75"
              data-ai-hint="app interface food logging"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <p className="text-2xl font-semibold text-white">App Logging Infographic Placeholder</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 sm:mb-16 font-headline">How GutCheck Works</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Snap a Photo or Log a Meal", description: "Use your camera or write a short meal description. Gutcheck’s AI analyzes ingredients and serving size." },
              { title: "Get Instant Deep Feedback", description: "Gutcheck uses deep analysis to provide insights about your meals and their impact on your Micronutrients, Guthealth, suger spikes and more — adjusted to your portion." },
              { title: "Track Your Reactions", description: "Log your digestive symptoms and track correlations over time. The app learns what works for you." },
              { title: "Optimize with AI Recommendations", description: "Gutcheck identifies safe swaps, personalized patterns, and meals that support gut-friendly bacteria." },
            ].map((step, index) => {
              const IconComponent = featureIcons[step.title as keyof typeof featureIcons] || CheckCircle;
              const tooltipText = howItWorksTooltips[step.title as keyof typeof howItWorksTooltips] || "Learn more";
              return (
                <Card key={index} className="bg-card border-border shadow-lg hover:shadow-xl transition-shadow text-center p-6 rounded-xl">
                  <CardHeader className="p-0 mb-4 flex flex-col items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-primary/10 text-primary rounded-full p-3 mb-4 inline-flex">
                            <IconComponent className="h-8 w-8" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-popover text-popover-foreground border-border">
                          <p>{tooltipText}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <CardTitle className="text-xl font-semibold font-headline">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 text-muted-foreground">
                    <p>{step.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Accuracy Tips Section */}
      <section className="py-16 sm:py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 font-headline">
            <AccuracyTipIcon className="inline-block h-10 w-10 mr-3 text-primary" /> Want more accurate results?
          </h2>
          <Accordion type="single" collapsible className="w-full max-w-2xl mx-auto bg-card p-4 sm:p-6 rounded-lg shadow-md border border-border">
            {[
              { id: "tip-1", title: "Describe all ingredients", content: "For best FODMAP accuracy, describe all ingredients including sauces and toppings." },
              { id: "tip-2", title: "Use natural language", content: "E.g., ‘Grilled chicken salad with vinaigrette’ works better than just ‘salad’." },
              { id: "tip-3", title: "Specify portion size", content: "Portion size helps the AI adjust its risk estimate. Try adding size units like '1 cup' or '2 slices'." },
              { id: "tip-4", title: "Upload clear photos", content: "Upload photos in good lighting, and ensure full view of your plate." },
              { id: "tip-5", title: "Log consistently", content: "The more you log, the more Gutcheck adapts to your unique responses." },
            ].map((tip, index) => (
              <AccordionItem value={tip.id} key={tip.id} className={index === 0 ? "border-t-0" : ""}>
                <AccordionTrigger className="text-lg font-semibold hover:text-primary text-left">{tip.title}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground pt-2">
                  {tip.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 sm:mb-16 font-headline">Loved by Users</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-card border-border shadow-lg p-6 rounded-xl">
                <CardHeader className="p-0 mb-4">
                  <div className="flex items-center mb-2">
                    <div className="relative w-12 h-12 rounded-full bg-muted mr-3 overflow-hidden">
                       <Image src={`https://placehold.co/100x100.png`} alt={`User ${i}`} layout="fill" objectFit="cover" data-ai-hint="person face" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold font-headline">User Name {i}</CardTitle>
                      <p className="text-sm text-muted-foreground">GutCheck User</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 text-muted-foreground">
                  <p>"This is a placeholder testimonial. GutCheck has really helped me understand my body better. Highly recommend!"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enjoy the Beta Section */}
      <section className="py-16 sm:py-20 text-center bg-primary/10">
        <div className="container mx-auto px-4">
          <ShieldCheck className="h-16 w-16 text-primary mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 font-headline">Enjoy the Beta!</h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-8">
            Thank you for being a part of our beta program. Your insights and experiences are invaluable. Please continue to share your feedback through the widget!
          </p>
          <Button size="lg" variant="default" className="text-lg px-8 py-6 bg-primary hover:bg-primary/80 text-primary-foreground" asChild>
            <Link href="/?openDashboard=true">Go to Dashboard</Link>
          </Button>
        </div>
      </section>

      <footer className="py-8 bg-muted/30 text-center">
        <div className="container mx-auto px-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} GutCheck. All Rights Reserved.</p>
          <p className="mt-1">This app is for informational purposes only and not a substitute for professional medical advice.</p>
          <Link href="/privacy" className="underline hover:text-primary mt-2 inline-block">Privacy Notice</Link>
        </div>
      </footer>
    </main>
  );
}
