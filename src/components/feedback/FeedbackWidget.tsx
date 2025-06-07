
'use client';

import { useState } from 'react';
import { MessageSquarePlus, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import FeedbackForm from './FeedbackForm';
import type { FeedbackSubmission, FeedbackSubmissionCreate } from '@/types/index';
import { useAuth } from '@/components/auth/AuthProvider';
import { usePathname } from 'next/navigation';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { processFeedback, type ProcessedFeedbackOutput } from '@/ai/flows/process-feedback-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();
  const { toast } = useToast();

  const handleSubmitFeedback = async (data: { feedbackText: string; category?: string }) => {
    setIsSubmitting(true);
    setSubmissionSuccess(false);

    try {
      let aiAnalysis: ProcessedFeedbackOutput | undefined = undefined;
      try {
        aiAnalysis = await processFeedback({
          feedbackText: data.feedbackText,
          category: data.category,
          userId: user?.uid,
          route: pathname,
        });
      } catch (aiError) {
        console.error("AI feedback processing error:", aiError);
        toast({
          title: "AI Analysis Skipped",
          description: "Could not analyze feedback with AI, but your feedback will still be submitted.",
          variant: "default",
        });
      }

      const feedbackData: FeedbackSubmissionCreate = {
        userId: user?.uid || 'anonymous',
        timestamp: Timestamp.now(),
        feedbackText: data.feedbackText,
        category: data.category || 'Not specified',
        route: pathname,
        status: 'new',
        aiAnalysis: aiAnalysis || null,
      };

      await addDoc(collection(db, 'feedbackSubmissions'), feedbackData);

      setSubmissionSuccess(true);
      toast({
        title: "Feedback Sent!",
        description: "Thank you for your valuable input.",
      });
      setTimeout(() => {
        setIsOpen(false);
        setSubmissionSuccess(false);
      }, 2000);

    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Submission Error",
        description: "Could not submit your feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <Button
        variant="default" // Will use primary color from theme
        size="lg"
        className={cn(
          "fixed bottom-6 left-6 rounded-full shadow-xl h-16 w-16 p-0 z-50",
          "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary focus:ring-offset-2", // Uses theme colors
          "animate-custom-feedback-bounce"
        )}
        onClick={() => setIsOpen(true)}
        aria-label="Open feedback dialog"
      >
        <MessageSquarePlus className="h-7 w-7" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">Share Your Feedback</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Tell us what’s working, what’s not, or what you'd love to see improved.
              You can describe bugs, missing features, or confusing elements.
            </DialogDescription>
          </DialogHeader>

          {submissionSuccess ? (
            <div className="py-10 flex flex-col items-center justify-center text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-foreground">Thank You!</h3>
              <p className="text-muted-foreground">Your feedback has been received.</p>
            </div>
          ) : (
            <FeedbackForm onSubmit={handleSubmitFeedback} isSubmitting={isSubmitting} />
          )}

          {!submissionSuccess && (
            <DialogFooter className="mt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogClose>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
