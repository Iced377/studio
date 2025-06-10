"use client";

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollText, Brain, BarChart2, Lightbulb, HelpCircle, ShieldCheck, MessageSquare, Heart, Lock, Network, FileLock2, Smartphone, DatabaseZap, Shield } from 'lucide-react'; // Changed JournalText to ScrollText
import Link from 'next/link';

const featureIcons: Record<string, React.ElementType> = {
  "Snap a Photo or Log a Meal": ScrollText, // Changed from JournalText
  "Get Instant Deep Feedback": Brain,
  "Track Your Reactions": BarChart2,
  "Optimize with AI Recommendations": Lightbulb,
};

const howItWorksTooltips: Record<string, string> = {
  "Snap a Photo or Log a Meal": "Our AI can understand meal descriptions or analyze photos to identify ingredients.",
  "Get Instant Deep Feedback": "Receive insights on FODMAPs, micronutrients, potential gut impact, and glycemic load specific to your meal and portion.",
  "Track Your Reactions": "Correlate your logged symptoms with your meals to pinpoint personal sensitivities.",
  "Optimize with AI Recommendations": "Get suggestions for food swaps and discover patterns for a healthier gut.",
};

const AccuracyTipIcon = HelpCircle;

interface LandingPageClientContentProps {
  heroActionContent?: React.ReactNode;
  showHeroCTAButton?: boolean;
  betaUserMessage?: React.ReactNode;
  finalCTAMessage?: React.ReactNode;
}

const DataSecuritySection = () => (
  <section className="py-16 sm:py-20 bg-muted/50">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 sm:mb-16 font-headline">
        <Shield className="inline-block h-10 w-10 mr-3 text-primary" /> Your Data Security is Our Priority
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          {
            title: "Latest reCAPTCHA v3",
            description: "We use Google's advanced reCAPTCHA to protect our app from spam and abuse without interrupting your experience.",
            Icon: ShieldCheck,
          },
          {
            title: "Google Authentication",
            description: "Secure user management powered by Google's robust authentication system, ensuring your account access is safe.",
            Icon: Lock,
          },
          {
            title: "SSL/TLS Encryption",
            description: "All data transmitted between your device and our servers is encrypted using industry-standard SSL/TLS protocols.",
            Icon: Lock,
          },
          {
            title: "Firebase App Check",
            description: "App Check helps protect our backend resources from abuse by ensuring requests originate from your authentic app instances.",
            Icon: ShieldCheck, 
          },
          {
            title: "Premium & Secure DNS",
            description: "Utilizing premium DNS services with enhanced security features like DDoS protection and DNSSEC for resilient and secure access.",
            Icon: Network,
          },
          {
            title: "Firestore Security Rules",
            description: "Robust server-side rules strictly control data access, ensuring you can only access your own information.",
            Icon: FileLock2,
          },
           {
            title: "Principle of Least Privilege",
            description: "Our systems are designed to ensure components only have access to the resources necessary for their function.",
            Icon: DatabaseZap, 
          },
           {
            title: "Secure Cloud Infrastructure",
            description: "Leveraging Google Cloud Platform's secure and reliable infrastructure for hosting and data storage.",
            Icon: Shield, 
          },
        ].map((feature, index) => (
          <Card
            key={index}
            className="bg-card border-border shadow-lg hover:shadow-xl transition-shadow text-center p-6 rounded-xl card-reveal-animation"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader className="p-0 mb-4 flex flex-col items-center">
              <div className="bg-primary/10 text-primary rounded-full p-3 mb-4 inline-flex">
                <feature.Icon className="h-8 w-8" />
              </div>
              <CardTitle className="text-xl font-semibold font-headline">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 text-muted-foreground">
              <p>{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-center text-muted-foreground mt-12">
        We are committed to employing robust security measures to safeguard your information and provide a trustworthy platform.
      </p>
    </div>
  </section>
);


export default function LandingPageClientContent({
  heroActionContent,
  showHeroCTAButton = true,
  betaUserMessage,
  finalCTAMessage,
}: LandingPageClientContentProps) {
  const placeholderFeedback = [
    {
      id: 1,
      text: "The AI food analysis is surprisingly detailed! It's helping me understand portion sizes better.",
      source: "Beta User A",
    },
    {
      id: 2,
      text: "Being able to quickly log symptoms and see potential links to my meals is a game-changer.",
      source: "Beta User B",
    },
    {
      id: 3,
      text: "I appreciate the accuracy tips. Still learning, but this app makes it much easier than trying to guess everything.",
      source: "Beta User C",
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-headline mb-6 tracking-tight">
            Track your gut. <span className="text-primary">Transform your health.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Gutcheck helps you identify foods that trigger IBS and optimize your diet, effectively.
          </p>
          {betaUserMessage && (
            <div className="mt-6">
              {betaUserMessage}
            </div>
          )}
          {heroActionContent && (
            <div className="flex justify-center"> {/* Ensure buttons are centered */}
              {heroActionContent}
            </div>
          )}
          {showHeroCTAButton && (
            <div className="mt-8 mb-10">
              <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                <Link href="/signup">Get Started Free</Link>
              </Button>
            </div>
          )}
          {/*
          <div className="relative max-w-3xl mx-auto h-64 sm:h-96 bg-muted rounded-lg shadow-2xl overflow-hidden border border-border">
            <Image
              src="https://placehold.co/1200x600.png"
              alt="GutCheck app logging process infographic"
              layout="fill"
              objectFit="cover"
              className="opacity-75"
              data-ai-hint="app logging infographic"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <p className="text-2xl font-semibold text-white">App Logging Infographic Placeholder</p>
            </div>
          </div>
          */}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 sm:mb-16 font-headline">How GutCheck Works</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Snap a Photo or Log a Meal", description: "Use your camera or write a short meal description. Gutcheck’s AI analyzes ingredients and serving size." },
              { title: "Get Instant Deep Feedback", description: "Gutcheck uses deep analysis to provide insights about your meals and their impact on your Micronutrients, Guthealth, sugar spikes and more — adjusted to your portion." },
              { title: "Track Your Reactions", description: "Log your digestive symptoms and track correlations over time. The app learns what works for you." },
              { title: "Optimize with AI Recommendations", description: "Gutcheck identifies safe swaps, personalized patterns, and meals that support gut-friendly bacteria." },
            ].map((step, index) => {
              const IconComponent = featureIcons[step.title] || ShieldCheck;
              const tooltipText = howItWorksTooltips[step.title] || "Learn more about this feature.";
              return (
                <Card
                  key={index}
                  className="bg-card border-border shadow-lg hover:shadow-xl transition-shadow text-center p-6 rounded-xl card-reveal-animation"
                  style={{ animationDelay: `${index * 0.15}s` }} // Staggered delay
                >
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

      {/* Feedback Section */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 sm:mb-16 font-headline">Beta Users are Already providing feedback</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {placeholderFeedback.map((feedback) => (
              <Card key={feedback.id} className="bg-card border-border shadow-lg p-6 rounded-xl flex flex-col">
                <CardHeader className="p-0 mb-4">
                  <div className="flex items-center mb-2">
                    <div className="bg-primary/10 text-primary rounded-full p-2 mr-3">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 text-muted-foreground flex-grow">
                  <p>"{feedback.text}"</p>
                </CardContent>
                 <CardFooter className="p-0 pt-4">
                    <p className="text-sm font-medium text-muted-foreground">{feedback.source}</p>
                  </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Data Security Section */}
      <DataSecuritySection />

      {/* Final CTA Section - Conditional Rendering */}
      {finalCTAMessage ? (
        <section className="py-16 sm:py-20 text-center bg-background"> {/* Using background for guest CTA */}
          {finalCTAMessage}
        </section>
      ) : (
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
      )}

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
