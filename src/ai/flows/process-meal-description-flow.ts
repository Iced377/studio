
'use server';
/**
 * @fileOverview Processes a natural language meal description to extract structured food information
 * and generate a witty name. This flow is intended to be called before `analyzeFoodItem`.
 *
 * - processMealDescription - Processes the meal description.
 * - ProcessMealDescriptionInput - Input schema for the flow.
 * - ProcessMealDescriptionOutput - Output schema for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProcessMealDescriptionInputSchema = z.object({
  mealDescription: z.string().describe('A natural language description of the meal, including ingredients and their approximate portion sizes. Example: "A large bowl of oatmeal made with 1/2 cup of rolled oats, 1 cup of water, a handful of blueberries, and a drizzle of honey."'),
  // timeOfDay: z.string().optional().describe("Optional: The time of day the meal was consumed (e.g., 'morning', 'late night'). This can help with the witty name generation."),
  // userHistorySummary: z.string().optional().describe("Optional: A brief summary of the user's recent logging habits or preferences, for context in witty name generation."),
});
export type ProcessMealDescriptionInput = z.infer<typeof ProcessMealDescriptionInputSchema>;

const ProcessMealDescriptionOutputSchema = z.object({
  wittyName: z.string().describe('A witty, cheeky, or descriptive name for the meal, generated based on the input. Examples: "That Massive Bowl of Greek Purity", "The Huge Mofo Chicken Wrap of Destiny", "The Midnight Mistake", "Crisp Sadness".'),
  primaryFoodItemForAnalysis: z.string().describe('The main identified food item or concept from the description, suitable as a "name" for a subsequent FODMAP analysis (e.g., "Oatmeal with blueberries"). This should be a relatively concise and factual summary of the meal.'),
  consolidatedIngredients: z.string().describe('A comma-separated list of all significant ingredients identified in the meal description (e.g., "rolled oats, water, blueberries, honey").'),
  estimatedPortionSize: z.string().describe('An estimated single, representative portion size number for the entire described meal (e.g., "1", "1.5", "200"). This is an approximation for overall analysis.'),
  estimatedPortionUnit: z.string().describe('The unit for the estimated portion size (e.g., "serving", "bowl", "plate", "g", "ml"). This accompanies the estimatedPortionSize.'),
});
export type ProcessMealDescriptionOutput = z.infer<typeof ProcessMealDescriptionOutputSchema>;

export async function processMealDescription(input: ProcessMealDescriptionInput): Promise<ProcessMealDescriptionOutput> {
  return processMealDescriptionFlow(input);
}

const processMealDescriptionGenkitPrompt = ai.definePrompt({
  name: 'processMealDescriptionPrompt',
  input: { schema: ProcessMealDescriptionInputSchema },
  output: { schema: ProcessMealDescriptionOutputSchema },
  config: {
    temperature: 0.5, // Increased temperature for better witty name generation
  },
  prompt: `You are an expert food analyst and a witty meal namer.
Given a meal description, your tasks are to:
1.  Generate a **witty, cheeky, or uniquely descriptive name** for the meal. Consider the ingredients, implied context (like portion size suggesting a large meal or a snack), and aim for a fun, memorable, or slightly edgy tone. Examples of witty names:
    *   "Greek Salad, large" -> "That Massive Bowl of Greek Purity"
    *   "Chicken Burrito, XL" -> "The Huge Mofo Chicken Wrap of Destiny"
    *   "Fries + Ice Cream, late night" -> "The Midnight Mistake"
    *   "Just lettuce" -> "Crisp Sadness"
    *   "Oatmeal with 1/2 cup oats, 1 cup water, blueberries, honey" -> "Berry-Good Morning Fuel" or "Oatally Delicious Start"
2.  Identify a concise, factual **primary food item name** that summarizes the meal for a follow-up FODMAP/nutritional analysis. This should be what the meal IS, not the witty name. (e.g., "Oatmeal with blueberries and honey", "Chicken and Rice Bowl").
3.  Create a **consolidated, comma-separated list of all significant ingredients** mentioned. (e.g., "rolled oats, water, blueberries, honey, chicken, rice, soy sauce").
4.  Estimate a single, representative **overall portion size (numeric value)** for the entire meal described.
5.  Estimate a single, representative **overall portion unit** for the entire meal described (e.g., "serving", "bowl", "g", "ml", "plate").

The user described their meal as:
"{{{mealDescription}}}"

Focus on extracting the core components for the factual fields and be creative with the witty name.
For 'primaryFoodItemForAnalysis', be descriptive but not overly long. It's the "common name" for the meal.
For 'consolidatedIngredients', list distinct ingredients.
For 'estimatedPortionSize' and 'estimatedPortionUnit', provide a sensible overall estimate for the entire meal content described.
`,
});


const processMealDescriptionFlow = ai.defineFlow(
  {
    name: 'processMealDescriptionFlow',
    inputSchema: ProcessMealDescriptionInputSchema,
    outputSchema: ProcessMealDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await processMealDescriptionGenkitPrompt(input);
    if (!output) {
      throw new Error("AI failed to process meal description and provide structured output.");
    }
    return output;
  }
);

