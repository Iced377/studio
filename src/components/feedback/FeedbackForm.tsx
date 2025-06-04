
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Send } from 'lucide-react';

const feedbackSchema = z.object({
  feedbackText: z.string().min(10, { message: 'Please provide at least 10 characters of feedback.' }).max(2000, {message: "Feedback is too long (max 2000 characters)."}),
  category: z.string().optional(),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

interface FeedbackFormProps {
  onSubmit: (data: FeedbackFormValues) => void;
  isSubmitting: boolean;
}

const feedbackCategories = [
  { value: 'bug', label: 'Bug Report' },
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'confusing_ui', label: 'Confusing UI' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'positive_praise', label: 'Positive Praise' },
  { value: 'other', label: 'Other' },
];

export default function FeedbackForm({ onSubmit, isSubmitting }: FeedbackFormProps) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      feedbackText: '',
      category: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
      <div>
        <Label htmlFor="feedbackText" className="text-foreground">Your Feedback</Label>
        <Textarea
          id="feedbackText"
          {...register('feedbackText')}
          placeholder="Describe your experience or suggestion here..."
          className="mt-1 min-h-[120px] bg-input text-foreground placeholder:text-muted-foreground"
          disabled={isSubmitting}
        />
        {errors.feedbackText && (
          <p className="text-sm text-destructive mt-1">{errors.feedbackText.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="category" className="text-foreground">Category (Optional)</Label>
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
              <SelectTrigger id="category" className="mt-1 bg-input text-foreground">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground">
                {feedbackCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        Send Feedback
      </Button>
    </form>
  );
}
