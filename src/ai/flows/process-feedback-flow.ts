
'use server';
/**
 * @fileOverview Processes user feedback to categorize, summarize, and assess it.
 *
 * - processFeedback - Analyzes user-submitted feedback.
 * - ProcessFeedbackInput - Input schema for the flow.
 * - ProcessedFeedbackOutput - Output schema for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProcessFeedbackInputSchema = z.object({
  feedbackText: z.string().describe('The raw text content of the user feedback.'),
  category: z.string().optional().describe('User-selected category (e.g., "bug", "suggestion").'),
  userId: z.string().optional().describe('ID of the user submitting the feedback, if available.'),
  route: z.string().optional().describe('The page/route from which the feedback was submitted.'),
});
export type ProcessFeedbackInput = z.infer<typeof ProcessFeedbackInputSchema>;

const AISuggestedCategorySchema = z.enum([
  'UI Bug',
  'Functional Bug',
  'UX Friction',
  'Performance Issue',
  'Feature Request',
  'Positive Praise',
  'Documentation/Help',
  'Security Concern',
  'Other Technical Issue',
  'General Comment',
  'Billing/Subscription',
]);

const FeasibilitySchema = z.enum(['Easy', 'Moderate', 'Hard', 'Unknown']);
const ValiditySchema = z.enum(['High', 'Medium', 'Low', 'Unclear']);
const RecommendedActionSchema = z.enum([
  'Log Bug Ticket',
  'Add to Feature Roadmap',
  'Discuss with UX Team',
  'Monitor for Similar Reports',
  'Requires Clarification from User',
  'Acknowledge & Thank User',
  'No Action Needed (Low Priority/Invalid)',
  'Investigate Technical Issue',
  'Review Documentation',
]);

const ProcessedFeedbackOutputSchema = z.object({
  aiSuggestedCategory: AISuggestedCategorySchema.describe('AI-determined category for the feedback.'),
  summaryTitle: z.string().describe('A concise summary or title for the feedback (max 10 words).'),
  detailedSummary: z.string().optional().describe('A slightly more detailed summary of the core issue or suggestion.'),
  sentiment: z.enum(['Positive', 'Negative', 'Neutral', 'Mixed']).describe('Overall sentiment of the feedback.'),
  feasibility: FeasibilitySchema.describe('Estimated feasibility of addressing/implementing the feedback.'),
  validity: ValiditySchema.describe('Assessment of how well-described, relevant, and actionable the feedback is.'),
  recommendedNextAction: RecommendedActionSchema.describe('Suggested next step for the team based on the feedback.'),
  keywords: z.array(z.string()).optional().describe('Relevant keywords extracted from the feedback.'),
  isBug: z.boolean().optional().describe("True if the feedback clearly describes a software bug."),
  isFeatureRequest: z.boolean().optional().describe("True if the feedback clearly requests a new feature or enhancement."),
});
export type ProcessedFeedbackOutput = z.infer<typeof ProcessedFeedbackOutputSchema>;

export async function processFeedback(input: ProcessFeedbackInput): Promise<ProcessedFeedbackOutput> {
  return processFeedbackFlow(input);
}

const processFeedbackGenkitPrompt = ai.definePrompt({
  name: 'processFeedbackPrompt',
  input: { schema: ProcessFeedbackInputSchema },
  output: { schema: ProcessedFeedbackOutputSchema },
  prompt: `You are an expert AI assistant for analyzing user feedback for a web application.
User ID: {{userId}}
Route Submitted From: {{route}}
User-Selected Category: {{category}}
Feedback Text:
"""
{{{feedbackText}}}
"""

Analyze the feedback and provide the following:
1.  **aiSuggestedCategory**: Classify the feedback into one of the predefined categories. Prioritize user's category if provided and sensible, otherwise determine the best fit.
2.  **summaryTitle**: Create a very short, descriptive title (max 10 words) that captures the essence of the feedback.
3.  **detailedSummary**: (Optional) Briefly summarize the main points or the core issue/request.
4.  **sentiment**: Determine the overall sentiment: Positive, Negative, Neutral, or Mixed.
5.  **feasibility**: Estimate the development effort or complexity: Easy, Moderate, Hard, or Unknown.
6.  **validity**: Assess how clear, relevant, and actionable the feedback is: High, Medium, Low, or Unclear.
7.  **recommendedNextAction**: Suggest a concrete next step for the product team.
8.  **keywords**: (Optional) Extract a few relevant keywords.
9.  **isBug**: Set to true if the feedback clearly describes a software bug or malfunction.
10. **isFeatureRequest**: Set to true if the feedback clearly requests a new feature or an enhancement to an existing one.

Focus on providing actionable insights for the development team.
If the feedback is very vague, reflect that in validity and recommended action (e.g., "Requires Clarification").
If the feedback is praise, the action should be to "Acknowledge & Thank User".
Output a JSON object adhering to the ProcessedFeedbackOutput schema.
`,
});

const processFeedbackFlow = ai.defineFlow(
  {
    name: 'processFeedbackFlow',
    inputSchema: ProcessFeedbackInputSchema,
    outputSchema: ProcessedFeedbackOutputSchema,
  },
  async (input) => {
    const { output } = await processFeedbackGenkitPrompt(input);
    if (!output) {
      throw new Error("AI failed to process feedback and provide structured output.");
    }
    return output;
  }
);
