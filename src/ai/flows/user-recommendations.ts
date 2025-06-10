
'use server';

/**
 * @fileOverview This file defines the user recommendations flow, which generates helpful tips and insights for the user.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input schema: Expanded to include more user-specific context
const UserRecommendationInputSchema = z.object({
  userId: z.string().optional().describe("User ID for potential future personalization."),
  requestType: z.enum(['general_wellness', 'diet_tip', 'activity_nudge', 'mindfulness_reminder']).optional().describe("The type of recommendation requested, to ensure variety."),
  recentFoodLogSummary: z.string().optional().describe("A brief summary of recently logged food items, e.g., 'Logged 3 meals, 1 high FODMAP.' or 'User has logged several items today.'"),
  recentSymptomSummary: z.string().optional().describe("A brief summary of recently logged symptoms, e.g., 'Reported bloating twice recently.' or 'No symptoms reported today.'"),
  // userGoals: z.string().optional().describe("User's stated health or dietary goals, if any."), // Example for future expansion
});
export type UserRecommendationInput = z.infer<typeof UserRecommendationInputSchema>;

// Output schema: A single string with the recommendation.
const UserRecommendationOutputSchema = z.object({
  recommendationText: z.string().describe('A short, actionable, and insightful recommendation or tip for the user.'),
});
export type UserRecommendationOutput = z.infer<typeof UserRecommendationOutputSchema>;

const defaultErrorOutput: UserRecommendationOutput = {
  recommendationText: "Could not generate a recommendation at this time. Keep logging to get personalized tips!",
};

export async function getUserRecommendation(input: UserRecommendationInput): Promise<UserRecommendationOutput> {
  return userRecommendationFlow(input);
}

const userRecommendationPrompt = ai.definePrompt({
  name: 'userRecommendationPrompt',
  input: { schema: UserRecommendationInputSchema },
  output: { schema: UserRecommendationOutputSchema },
  prompt: `Generate a short, friendly, and actionable recommendation or tip for a user focused on their well-being (1-2 sentences).

Context available (use if relevant to make the tip more specific):
{{#if userId}}User ID: {{{userId}}} (for your reference, do not include in output){{/if}}
{{#if recentFoodLogSummary}}Recent food activity: {{{recentFoodLogSummary}}}{{/if}}
{{#if recentSymptomSummary}}Recent symptoms: {{{recentSymptomSummary}}}{{/if}}
{{#if requestType}}Requested tip type: {{{requestType}}}{{/if}}

Instructions:
1. If 'recentFoodLogSummary' or 'recentSymptomSummary' are provided, try to make your tip subtly relevant to this information, especially if it aligns with the 'requestType'.
   - Example with context: If 'recentFoodLogSummary' mentions "high sugar snack" and 'requestType' is 'diet_tip', suggest a healthier alternative like, "For a more sustained energy boost than a sugary snack, how about some fruit and nuts?"
   - Example with context: If 'recentSymptomSummary' mentions "bloating", and 'requestType' is 'general_wellness', you might suggest, "Feeling bloated? Sometimes, slowing down your eating pace can make a difference."
2. If 'requestType' is provided, prioritize a tip related to that category:
   - 'general_wellness': Tip about hydration, sleep, stress, general healthy habits. Example: "A good night's sleep is cornerstone to well-being. Aim for 7-8 hours tonight!"
   - 'diet_tip': Practical diet/nutrition advice. Example: "Adding a variety of colorful vegetables to your meals can boost your nutrient intake."
   - 'activity_nudge': Encourage physical activity. Example: "Even a quick 10-minute walk can improve your mood and energy levels. Fancy one today?"
   - 'mindfulness_reminder': Simple mindfulness or stress-relief. Example: "Feeling overwhelmed? Take 60 seconds to just focus on your breath; it can help re-center you."
3. If no specific context or 'requestType' strongly guides the tip, provide a generally useful wellness tip. Example: "Drinking enough water throughout the day is key for energy and digestion."
4. Ensure the tip is positive, encouraging, and directly actionable by the user. Avoid being preachy.

Output only the recommendation text itself.`, 
});

const userRecommendationFlow = ai.defineFlow(
  {
    name: 'userRecommendationFlow',
    inputSchema: UserRecommendationInputSchema,
    outputSchema: UserRecommendationOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await userRecommendationPrompt(input);
      if (!output || !output.recommendationText) {
        console.warn('[UserRecommendationFlow] AI prompt returned no or invalid output. Falling back to default error response.');
        return defaultErrorOutput;
      }
      return output!;
    } catch (error: any) {
      console.error('[UserRecommendationFlow] Error during AI processing:', error);
      return {
        ...defaultErrorOutput,
        recommendationText: `Could not generate a recommendation: ${error.message || 'Unknown error'}. Keep logging for future tips!`,
      };
    }
  }
);
