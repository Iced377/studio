
'use server';
/**
 * @fileOverview This file defines the Personalized Dietitian AI flow.
 * It takes a user's question and their health data (food logs, symptoms, profile)
 * to provide a deep, personalized dietary insight, acting like a personal dietitian.
 *
 * - getPersonalizedDietitianInsight - Main function to call the flow.
 * - PersonalizedDietitianInput - Input type for the flow.
 * - PersonalizedDietitianOutput - Output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { LoggedFoodItem, SymptomLog, UserProfile } from '@/types';

// Schemas for LoggedFoodItem and SymptomLog to be used within the input
const FoodItemSchemaForAI = z.object({
  name: z.string(),
  originalName: z.string().optional(),
  ingredients: z.string(),
  portionSize: z.string(),
  portionUnit: z.string(),
  timestamp: z.string().datetime().describe("ISO 8601 datetime string for when the food was logged."),
  overallFodmapRisk: z.enum(['Green', 'Yellow', 'Red']).optional(),
  calories: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
  userFeedback: z.enum(['safe', 'unsafe']).optional().nullable(),
  sourceDescription: z.string().optional().describe("Original user text input for AI-logged meals."),
});

const SymptomForAI = z.object({
  name: z.string(),
});

const SymptomLogEntrySchemaForAI = z.object({
  symptoms: z.array(SymptomForAI),
  severity: z.number().optional(),
  notes: z.string().optional(),
  timestamp: z.string().datetime().describe("ISO 8601 datetime string for when symptoms were logged."),
  linkedFoodItemIds: z.array(z.string()).optional(),
});

const UserProfileSchemaForAI = z.object({
  displayName: z.string().optional().nullable(),
  safeFoods: z.array(z.object({
    name: z.string(),
    portionSize: z.string(),
    portionUnit: z.string(),
  })).optional(),
  premium: z.boolean().optional(),
}).optional();


const PersonalizedDietitianInputSchema = z.object({
  userQuestion: z.string().describe("The user's specific question about their diet, health, or well-being."),
  foodLog: z.array(FoodItemSchemaForAI).describe("A chronological list of the user's logged food items (e.g., last 30-90 days)."),
  symptomLog: z.array(SymptomLogEntrySchemaForAI).describe("A chronological list of the user's logged symptoms (e.g., last 30-90 days)."),
  userProfile: UserProfileSchemaForAI.describe("Basic user profile information, including any marked safe foods."),
});
export type PersonalizedDietitianInput = z.infer<typeof PersonalizedDietitianInputSchema>;

const PersonalizedDietitianOutputSchema = z.object({
  aiResponse: z.string().describe("The AI dietitian's comprehensive and personalized response to the user's question, based on the provided data. This should be insightful and actionable, formatted clearly (e.g., using markdown for lists or emphasis if appropriate, but will be rendered as a string)."),
});
export type PersonalizedDietitianOutput = z.infer<typeof PersonalizedDietitianOutputSchema>;

export async function getPersonalizedDietitianInsight(input: PersonalizedDietitianInput): Promise<PersonalizedDietitianOutput> {
  return personalizedDietitianFlow(input);
}

const personalizedDietitianPrompt = ai.definePrompt({
  name: 'personalizedDietitianPrompt',
  input: { schema: PersonalizedDietitianInputSchema },
  output: { schema: PersonalizedDietitianOutputSchema },
  prompt: `You are an expert AI Dietitian and Wellness Coach. Your goal is to provide highly personalized, deep insights and actionable advice based on the user's question and their provided data.

User's Question:
"{{{userQuestion}}}"

User's Profile Information (if available):
{{#if userProfile}}
Display Name: {{#if userProfile.displayName}}{{userProfile.displayName}}{{else}}N/A{{/if}}
Premium User: {{#if userProfile.premium}}Yes{{else}}No{{/if}}
Marked Safe Foods (name, portion):
{{#if userProfile.safeFoods}}
  {{#each userProfile.safeFoods}}
  - {{this.name}} ({{this.portionSize}} {{this.portionUnit}})
  {{/each}}
{{else}}
(No specific safe foods marked by user)
{{/if}}
{{else}}
(No user profile information provided)
{{/if}}

User's Recent Food Log (chronological):
{{#each foodLog}}
- Meal: {{this.name}} (Portion: {{this.portionSize}} {{this.portionUnit}}, Ingredients: {{this.ingredients}})
  Logged: {{this.timestamp}}
  {{#if this.sourceDescription}}Original Description: "{{this.sourceDescription}}"{{/if}}
  FODMAP Risk: {{#if this.overallFodmapRisk}}{{this.overallFodmapRisk}}{{else}}N/A{{/if}}
  Nutrition (Approx.): Calories: {{#if this.calories}}{{this.calories}}{{else}}N/A{{/if}}, Protein: {{#if this.protein}}{{this.protein}}{{else}}N/A{{/if}}g, Carbs: {{#if this.carbs}}{{this.carbs}}{{else}}N/A{{/if}}g, Fat: {{#if this.fat}}{{this.fat}}{{else}}N/A{{/if}}g
  User Feedback: {{#if this.userFeedback}}{{this.userFeedback}}{{else}}None{{/if}}
{{else}}
(No food items logged recently or provided for analysis)
{{/each}}

User's Recent Symptom Log (chronological):
{{#each symptomLog}}
- Symptoms: {{#each this.symptoms}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}}
  Logged: {{this.timestamp}}
  Severity: {{#if this.severity}}{{this.severity}}{{else}}N/A{{/if}}
  {{#if this.notes}}Notes: "{{this.notes}}"{{/if}}
  {{#if this.linkedFoodItemIds}}Linked to {{this.linkedFoodItemIds.length}} food(s).{{/if}}
{{else}}
(No symptoms logged recently or provided for analysis)
{{/each}}

INSTRUCTIONS:
1.  Carefully analyze the user's question in the context of ALL provided data (profile, food log, symptom log).
2.  Provide a comprehensive, empathetic, and insightful response. Act like a knowledgeable and caring personal dietitian.
3.  If the question relates to potential food triggers, try to identify patterns between food intake and symptoms. Consider timing, ingredients, FODMAP levels, and user feedback on foods.
4.  If the question is about improving diet, suggest specific, actionable changes based on their logs.
5.  If the question is about general well-being, connect it to their dietary habits if possible.
6.  If data is insufficient to answer thoroughly, state that, but still provide the best possible general advice or suggest what data would be helpful.
7.  Structure your response clearly. Use paragraphs. If suggesting multiple points, consider using bullet points (markdown-style like * or -) for readability.
8.  Be highly personalized. Refer to specific foods they've eaten or symptoms they've logged if relevant.
9.  Maintain a supportive and encouraging tone. Avoid making definitive medical diagnoses; frame suggestions as possibilities to explore or discuss with a healthcare professional if appropriate.
10. Do NOT just repeat the input data. Synthesize it to form new insights. Your response should be formatted in plain text or simple Markdown suitable for direct display to the user.
11. Ensure the output is a single string for the 'aiResponse' field within a JSON object. Your final output MUST be a JSON object with a single key "aiResponse". The value of "aiResponse" should be your detailed, personalized insight as a string. For example:
{
  "aiResponse": "Your detailed insight here..."
}

Provide your detailed, personalized insight below:
`,
});

const personalizedDietitianFlow = ai.defineFlow(
  {
    name: 'personalizedDietitianFlow',
    inputSchema: PersonalizedDietitianInputSchema,
    outputSchema: PersonalizedDietitianOutputSchema,
  },
  async (input) => {
    try {
      const transformedInput = {
          ...input,
          foodLog: input.foodLog.map(item => ({
              ...item,
              timestamp: typeof item.timestamp === 'string' ? item.timestamp : new Date(item.timestamp).toISOString(),
          })),
          symptomLog: input.symptomLog.map(item => ({
              ...item,
              timestamp: typeof item.timestamp === 'string' ? item.timestamp : new Date(item.timestamp).toISOString(),
          })),
      };

      const { output } = await personalizedDietitianPrompt(transformedInput);
      if (!output || !output.aiResponse) {
        return { aiResponse: "I apologize, the AI dietitian couldn't generate a specific response at this time. This might be due to a temporary issue or the nature of the query. Please try rephrasing or check back later." };
      }
      return output;
    } catch (error: any) {
      console.error('[PersonalizedDietitianFlow] Error during AI processing:', error);
      return { 
        aiResponse: `An error occurred while consulting the AI dietitian: ${error.message || 'Unknown AI error'}. Please try again later. If the issue persists, ensure your API key for the AI service is correctly configured.` 
      };
    }
  }
);
