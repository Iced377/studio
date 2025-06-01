
'use server';
/**
 * @fileOverview This file defines the symptom correlation flow.
 * It analyzes a user's food log and symptom records to identify potential patterns
 * and provide insights about individual sensitivities.
 *
 * - getSymptomCorrelations - Analyzes food and symptom data for correlations.
 * - SymptomCorrelationInput - The input type for the flow.
 * - SymptomCorrelationOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define input structures based on types/index.ts
const LoggedFoodItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  ingredients: z.string(),
  portionSize: z.string(),
  portionUnit: z.string(),
  timestamp: z.string().datetime().describe("ISO 8601 datetime string for when the food was logged."),
  overallFodmapRisk: z.enum(['Green', 'Yellow', 'Red']).optional().describe("Overall FODMAP risk of this item at the logged portion."),
});

const SymptomSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const SymptomLogEntrySchema = z.object({
  id: z.string(),
  linkedFoodItemIds: z.array(z.string()).optional().describe("IDs of food items potentially linked to these symptoms."),
  symptoms: z.array(SymptomSchema),
  severity: z.number().optional().describe("Symptom severity (e.g., 1-5)."),
  notes: z.string().optional(),
  timestamp: z.string().datetime().describe("ISO 8601 datetime string for when symptoms were logged."),
});

// Schema remains internally defined, but not exported as a const
const SymptomCorrelationInputSchema = z.object({
  foodLog: z.array(LoggedFoodItemSchema).describe("A chronological list of the user's logged food items."),
  symptomLog: z.array(SymptomLogEntrySchema).describe("A chronological list of the user's logged symptoms."),
  safeFoods: z.array(z.object({ name: z.string(), portionSize: z.string(), portionUnit: z.string() })).optional().describe("User's marked safe foods with portions."),
});
export type SymptomCorrelationInput = z.infer<typeof SymptomCorrelationInputSchema>;

const InsightSchema = z.object({
  type: z.enum(['potential_trigger', 'potential_safe', 'observation', 'no_clear_pattern']).describe("Type of insight."),
  title: z.string().describe("A concise title for the insight card."),
  description: z.string().describe("Detailed explanation of the insight or pattern found."),
  relatedFoodNames: z.array(z.string()).optional().describe("Names of food items related to this insight."),
  relatedSymptoms: z.array(z.string()).optional().describe("Names of symptoms related to this insight."),
  confidence: z.enum(['low', 'medium', 'high']).optional().describe("Confidence level in this correlation."),
  suggestionToUser: z.string().optional().describe("An actionable suggestion for the user, e.g., 'Consider discussing with your dietitian.' or 'Try logging more consistently.'"),
});

// Schema remains internally defined, but not exported as a const
const SymptomCorrelationOutputSchema = z.object({
  insights: z.array(InsightSchema).describe("A list of insights derived from correlating food and symptom logs. Examples: 'Bloating reported 4 times after eating onion >15g.' or 'You’ve had no symptoms after 3 lentil meals under 30g. Mark as safe?'"),
});
export type SymptomCorrelationOutput = z.infer<typeof SymptomCorrelationOutputSchema>;

export async function getSymptomCorrelations(input: SymptomCorrelationInput): Promise<SymptomCorrelationOutput> {
  // Basic validation: ensure there's enough data to analyze
  if (input.foodLog.length < 3 && input.symptomLog.length < 1) {
    return { insights: [{
        type: 'observation',
        title: 'More Data Needed',
        description: 'Log more meals and symptoms to receive personalized insights.',
        confidence: 'low',
    }] };
  }
  return symptomCorrelationFlow(input);
}

const symptomCorrelationPrompt = ai.definePrompt({
  name: 'symptomCorrelationPrompt',
  input: {schema: SymptomCorrelationInputSchema}, // Uses internal schema
  output: {schema: SymptomCorrelationOutputSchema}, // Uses internal schema
  prompt: `You are an AI assistant helping a user with IBS identify patterns between their food intake and symptoms.
Analyze the provided food log and symptom log. Look for correlations, considering timing, ingredients, portion sizes, and frequency.

User's Food Log (chronological):
{{#each foodLog}}
- Food: {{this.name}} (Portion: {{this.portionSize}} {{this.portionUnit}}, Ingredients: {{this.ingredients}}, Logged: {{this.timestamp}} {{#if this.overallFodmapRisk}}Overall Risk: {{this.overallFodmapRisk}}{{/if}})
{{else}}
(No food items logged for this period)
{{/each}}

User's Symptom Log (chronological):
{{#each symptomLog}}
- Symptoms: {{#each this.symptoms}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}} (Logged: {{this.timestamp}}{{#if this.severity}}, Severity: {{this.severity}}{{/if}}{{#if this.notes}}, Notes: {{this.notes}}{{/if}})
{{else}}
(No symptoms logged for this period)
{{/each}}

{{#if safeFoods.length}}
User's Marked Safe Foods (for reference, these are generally tolerated by the user at these portions):
{{#each safeFoods}}
- {{this.name}} (Portion: {{this.portionSize}} {{this.portionUnit}})
{{/each}}
{{/if}}

Your goal is to generate a few key insights. Examples of insights:
- "Potential Trigger: Bloating was reported 3 out of 4 times within 2-4 hours after consuming meals containing garlic, even in small amounts." (Confidence: medium)
- "Potential Safe Food: You've logged 'Oats with berries' (approx. 1/2 cup oats, 1/4 cup berries) 5 times without reporting subsequent symptoms. Consider marking this as a safe meal." (Confidence: medium)
- "Observation: You frequently report gas after meals with high dairy content like 'Mac and Cheese' and 'Milkshake'." (Confidence: high)
- "No Clear Pattern: There isn't a clear pattern linking specific foods to your reported headaches based on the current logs." (Confidence: low, Suggestion: "Try to log food and symptoms consistently for a week for better insights.")

Prioritize insights with stronger correlations. Consider a typical symptom onset window of 1-4 hours after a meal, but be flexible.
If a food is on the safe list, it's less likely to be a trigger unless consumed in much larger portions than saved.

Generate a list of insights. Each insight should have a 'type', 'title', 'description', 'relatedFoodNames' (if applicable), 'relatedSymptoms' (if applicable), and optional 'confidence' and 'suggestionToUser'.
Focus on 2-3 most relevant insights.
If data is too sparse, generate an 'observation' insight stating more data is needed.
`,
});

const symptomCorrelationFlow = ai.defineFlow(
  {
    name: 'symptomCorrelationFlow',
    inputSchema: SymptomCorrelationInputSchema, // Uses internal schema
    outputSchema: SymptomCorrelationOutputSchema, // Uses internal schema
  },
  async (input: SymptomCorrelationInput): Promise<SymptomCorrelationOutput> => {
    const {output} = await symptomCorrelationPrompt(input);
    return output!;
  }
);

