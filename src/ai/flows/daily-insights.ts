
'use server';

/**
 * @fileOverview This file defines the daily insights flow, which analyzes a user's food log, symptoms, and micronutrient intake to provide personalized insights.
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
  micronutrientSummary: z
    .string()
    .optional()
    .describe(
      'A string summarizing the user\'s micronutrient intake for the day (e.g., "High in Vitamin C, low in Iron. Adequate Vitamin D.").'
    ),
});
export type DailyInsightsInput = z.infer<typeof DailyInsightsInputSchema>;

const DailyInsightsOutputSchema = z.object({
  triggerInsights: z
    .string()
    .describe(
      'Insights about potential trigger foods or high-risk meals based on food log and symptoms.'
    ),
  micronutrientFeedback: z
    .string()
    .optional()
    .describe(
      'Feedback on the user\'s micronutrient intake, highlighting areas of concern or sufficiency.'
    ),
  overallSummary: z
    .string()
    .describe(
      'A general (overall) view or summary of the user\'s logged day, considering food, symptoms, and micronutrients.'
    ),
});
export type DailyInsightsOutput = z.infer<typeof DailyInsightsOutputSchema>;

const defaultErrorOutput: DailyInsightsOutput = {
  triggerInsights: 'Could not determine trigger insights due to an analysis error.',
  micronutrientFeedback: 'Micronutrient feedback unavailable due to an analysis error.',
  overallSummary: 'Could not determine overall summary due to an analysis error.',
};

export async function getDailyInsights(input: DailyInsightsInput): Promise<DailyInsightsOutput> {
  return dailyInsightsFlow(input);
}

const dailyInsightsPrompt = ai.definePrompt({
  name: 'dailyInsightsPrompt',
  input: {schema: DailyInsightsInputSchema},
  output: {schema: DailyInsightsOutputSchema},
  prompt: `Analyze the following food log, symptoms, and micronutrient summary to provide personalized insights to the user.

Food Log: {{{foodLog}}}
Symptoms: {{{symptoms}}}
{{#if micronutrientSummary}}
Micronutrient Summary: {{{micronutrientSummary}}}
{{/if}}

Provide the following insights:
1.  **Trigger Insights**: Identify potential trigger foods or high-risk meals (e.g., "You had 3 high-risk meals today" or "Garlic appears to trigger symptoms.").
2.  **Micronutrient Feedback**: Based on the micronutrient summary, provide feedback (e.g., "Your Vitamin C intake was good, but you might need more Iron."). If no summary is provided, state that micronutrient feedback is unavailable.
3.  **Overall Summary**: Give a brief, general overview of the day, considering all provided information.

Respond in a structured format. For example:
Trigger Insights: Your analysis here.
Micronutrient Feedback: Your analysis here.
Overall Summary: Your analysis here.
`,
});

const dailyInsightsFlow = ai.defineFlow(
  {
    name: 'dailyInsightsFlow',
    inputSchema: DailyInsightsInputSchema,
    outputSchema: DailyInsightsOutputSchema,
  },
  async input => {
    try {
      const {output} = await dailyInsightsPrompt(input);
      // The prompt is asking for a specific string format, but the output schema is an object.
      // We need to parse the AI's string output into the object structure.
      // This is a simplification; a more robust solution would involve the AI generating JSON directly
      // or more sophisticated parsing.
      if (!output) {
        console.warn('[DailyInsightsFlow] AI prompt returned no output. Falling back to default error response.');
        return defaultErrorOutput;
      }
      
      if (output && typeof output.triggerInsights === 'string' && typeof output.overallSummary === 'string') {
        // This case implies the AI might be directly returning the object structure, which is ideal.
        return output as DailyInsightsOutput;
      }

      // Fallback parsing if the output is a single string as per the prompt's example response.
      // This is a naive parsing approach and might need refinement.
      const insightsString = (output as any)?.insights || (output as any)?.toString() || "";
      const triggerMatch = insightsString.match(/Trigger Insights: (.*?)(Micronutrient Feedback:|Overall Summary:|$)/s);
      const micronutrientMatch = insightsString.match(/Micronutrient Feedback: (.*?)(Overall Summary:|$)/s);
      const overallMatch = insightsString.match(/Overall Summary: (.*)/s);

      return {
        triggerInsights: triggerMatch ? triggerMatch[1].trim() : 'Could not determine trigger insights.',
        micronutrientFeedback: micronutrientMatch ? micronutrientMatch[1].trim() : (input.micronutrientSummary ? 'Could not parse micronutrient feedback.' : 'Micronutrient feedback not available.'),
        overallSummary: overallMatch ? overallMatch[1].trim() : 'Could not determine overall summary.',
      };
    } catch (error: any) {
      console.error('[DailyInsightsFlow] Error during AI processing:', error);
      return {
        ...defaultErrorOutput,
        overallSummary: `Error during daily insights analysis: ${error.message || 'Unknown error'}.`,
      };
    }
  }
);
