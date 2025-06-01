
'use server';
/**
 * @fileOverview This file contains the Genkit flow for FODMAP detection in food items, considering portion sizes,
 * and also estimates calorie and macronutrient content.
 *
 * - analyzeFoodItem - Analyzes a food item for FODMAPs and nutritional info.
 * - AnalyzeFoodItemInput - The input type for the analyzeFoodItem function.
 * - AnalyzeFoodItemOutput - The return type for the analyzeFoodItem function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetailedFoodFODMAPProfileSchema = z.object({
  fructans: z.number().optional().describe('Estimated Fructans content in the given portion (e.g., in grams or a relative scale 0-10).'),
  galactans: z.number().optional().describe('Estimated Galactans (GOS) content in the given portion.'),
  polyolsSorbitol: z.number().optional().describe('Estimated Sorbitol content in the given portion.'),
  polyolsMannitol: z.number().optional().describe('Estimated Mannitol content in the given portion.'),
  lactose: z.number().optional().describe('Estimated Lactose content in the given portion.'),
  fructose: z.number().optional().describe('Estimated excess Fructose content in the given portion.'),
  totalOligos: z.number().optional().describe('Total Oligosaccharides (Fructans + GOS).'),
  totalPolyols: z.number().optional().describe('Total Polyols (Sorbitol + Mannitol).'),
}).describe("A detailed, estimated FODMAP profile for the specified food item and portion. Values represent amounts or relative levels. This profile should be based on reliable data sources if possible, considering the portion size.");

export type FoodFODMAPProfile = z.infer<typeof DetailedFoodFODMAPProfileSchema>;


const AnalyzeFoodItemInputSchema = z.object({
  foodItem: z.string().describe('The name of the food item to analyze.'),
  ingredients: z.string().describe('A comma-separated list of ingredients in the food item.'),
  portionSize: z.string().describe('The size of the portion, e.g., "100", "0.5", "1".'),
  portionUnit: z.string().describe('The unit for the portion, e.g., "g", "cup", "medium apple".'),
});
export type AnalyzeFoodItemInput = z.infer<typeof AnalyzeFoodItemInputSchema>;

const FodmapScoreSchema = z.enum(['Green', 'Yellow', 'Red']);
export type FodmapScore = z.infer<typeof FodmapScoreSchema>;

const IngredientScoreSchema = z.object({
  ingredient: z.string().describe("The name of the ingredient."),
  score: FodmapScoreSchema.describe("The FODMAP score for this ingredient (Green, Yellow, or Red) considering its likely amount in the overall portion."),
  reason: z.string().optional().describe("Brief reason for the ingredient's score, especially if Yellow or Red.")
});

const AnalyzeFoodItemOutputSchema = z.object({
  ingredientFodmapScores: z.array(IngredientScoreSchema).describe('A list of ingredients and their FODMAP scores, adjusted for the overall portion.'),
  overallRisk: FodmapScoreSchema.describe('The overall FODMAP risk level of the food item for the specified portion (Green, Yellow, or Red).'),
  reason: z.string().describe('Explanation of why the food item has the assigned risk level for the given portion. Mention key ingredients and portion impact.'),
  detailedFodmapProfile: DetailedFoodFODMAPProfileSchema.optional().describe("An estimated detailed FODMAP profile for the given portion of the food item."),
  calories: z.number().optional().describe('Estimated total calories for the given portion.'),
  protein: z.number().optional().describe('Estimated total protein in grams for the given portion.'),
  carbs: z.number().optional().describe('Estimated total carbohydrates in grams for the given portion.'),
  fat: z.number().optional().describe('Estimated total fat in grams for the given portion.'),
});
export type AnalyzeFoodItemOutput = z.infer<typeof AnalyzeFoodItemOutputSchema>;


export async function analyzeFoodItem(input: AnalyzeFoodItemInput): Promise<AnalyzeFoodItemOutput> {
  return analyzeFoodItemFlow(input);
}

const analyzeFoodItemPrompt = ai.definePrompt({
  name: 'analyzeFoodItemPrompt',
  input: {schema: AnalyzeFoodItemInputSchema},
  output: {schema: AnalyzeFoodItemOutputSchema},
  prompt: `You are an expert AI assistant specialized in FODMAP analysis and nutritional estimation for individuals with IBS. Your analysis MUST be portion-specific.
You will receive a food item, its ingredients, and a portion size. Your task is:
1.  Analyze each ingredient for its FODMAP content.
2.  Determine an overall FODMAP risk (Green, Yellow, Red) for the *specified portion* of the food item.
3.  Provide a detailed explanation for the overall risk, highlighting impactful ingredients and how portion size affects the rating.
4.  If possible, estimate a detailed FODMAP profile (fructans, GOS, lactose, excess fructose, sorbitol, mannitol) for the given portion.
5.  Estimate the total calories for the specified portion of the food item.
6.  Estimate the total macronutrients for the specified portion: protein (in grams), carbohydrates (in grams), and fat (in grams).

Base your analysis on established FODMAP data (conceptually, like Monash University's guidelines) and general nutritional databases.

Scoring Guide (Portion-Specific):
*   Green: Low FODMAP content *at the specified portion*. Generally well-tolerated.
*   Yellow: Moderate FODMAP content *at the specified portion*. May trigger symptoms in sensitive individuals.
*   Red: High FODMAP content *at the specified portion*. Likely to trigger symptoms.

Example:
- Food: Apple, Portion: 1/2 medium -> Expected FODMAP: Green (if applicable for 1/2 apple), Calories: ~45, P: ~0g, C: ~12g, F: ~0g
- Food: Apple, Portion: 1 whole medium -> Expected FODMAP: Red (if applicable for 1 whole apple), Calories: ~90, P: ~0.5g, C: ~24g, F: ~0.3g
- Food: Garlic Bread, Ingredients: Bread, Butter, Garlic, Portion: 1 slice -> Expected FODMAP: Red (due to garlic/fructans in bread), Calories: ~150, P: ~4g, C: ~20g, F: ~6g

Food Item: {{{foodItem}}}
Ingredients: {{{ingredients}}}
Portion: {{{portionSize}}} {{{portionUnit}}}

Output a JSON object.
For 'ingredientFodmapScores', list each ingredient with its score ('Green', 'Yellow', 'Red') relative to its likely presence in the given portion and a brief reason if Yellow or Red.
For 'overallRisk', provide the Green/Yellow/Red rating for the whole item *at the specified portion*.
For 'reason', explain the overallRisk, focusing on key ingredients and portion impact.
For 'detailedFodmapProfile', provide estimated numeric values for each FODMAP subgroup if possible.
For 'calories', provide an estimated integer value for total calories.
For 'protein', 'carbs', 'fat', provide estimated numeric values in grams.
If an ingredient list is very generic (e.g., "pasta sauce"), make reasonable assumptions about common high/low FODMAP components and nutritional values, or state the limitation in the 'reason' field.
If an estimation for a nutritional value is not possible, omit the field or set it to null.
`,
});

const analyzeFoodItemFlow = ai.defineFlow(
  {
    name: 'analyzeFoodItemFlow',
    inputSchema: AnalyzeFoodItemInputSchema,
    outputSchema: AnalyzeFoodItemOutputSchema,
  },
  async input => {
    const {output} = await analyzeFoodItemPrompt(input);
    return output!;
  }
);

