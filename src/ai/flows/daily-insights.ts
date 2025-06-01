'use server';

/**
 * @fileOverview This file defines the daily insights flow, which analyzes a user's food log and symptoms to provide personalized insights.
 *
 * - getDailyInsights - A function that retrieves daily insights based on user data.
 * - DailyInsightsInput - The input type for the getDailyInsights function.
 * - DailyInsightsOutput - The return type for the getDailyInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DailyInsightsInputSchema = z.object({
  foodLog: z
    .string()
    .describe(
      'A string containing a list of food items the user has logged for the day.'
    ),
  symptoms: z
    .string()
    .describe(
      'A string containing a list of symptoms the user has experienced during the day.'
    ),
});
export type DailyInsightsInput = z.infer<typeof DailyInsightsInputSchema>;

const DailyInsightsOutputSchema = z.object({
  insights: z
    .string()
    .describe(
      'A string containing insights about the user food log and symptoms, such as potential trigger foods or high-risk meals.'
    ),
});
export type DailyInsightsOutput = z.infer<typeof DailyInsightsOutputSchema>;

export async function getDailyInsights(input: DailyInsightsInput): Promise<DailyInsightsOutput> {
  return dailyInsightsFlow(input);
}

const dailyInsightsPrompt = ai.definePrompt({
  name: 'dailyInsightsPrompt',
  input: {schema: DailyInsightsInputSchema},
  output: {schema: DailyInsightsOutputSchema},
  prompt: `Analyze the following food log and symptoms to provide personalized insights to the user.

Food Log: {{{foodLog}}}
Symptoms: {{{symptoms}}}

Provide insights such as potential trigger foods or high-risk meals, like "You had 3 high-risk meals today" or "Garlic appears to trigger symptoms."`,
});

const dailyInsightsFlow = ai.defineFlow(
  {
    name: 'dailyInsightsFlow',
    inputSchema: DailyInsightsInputSchema,
    outputSchema: DailyInsightsOutputSchema,
  },
  async input => {
    const {output} = await dailyInsightsPrompt(input);
    return output!;
  }
);
