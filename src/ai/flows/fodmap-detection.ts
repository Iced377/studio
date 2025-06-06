'use server';
/**
 * @fileOverview This file contains the Genkit flow for FODMAP detection in food items, considering portion sizes.
 *
 * - analyzeFoodItem - Analyzes a food item and calculates a FODMAP score for each ingredient, factoring in portion size.
 * - AnalyzeFoodItemInput - The input type for the analyzeFoodItem function.
 * - AnalyzeFoodItemOutput - The return type for the analyzeFoodItem function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
// Assuming FoodFODMAPProfile schema is defined in food-similarity or a shared types file
// For now, let's define it here if it's specific to the AI's detailed output
// This will be the detailed numeric profile.
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
});
export type AnalyzeFoodItemOutput = z.infer<typeof AnalyzeFoodItemOutputSchema>;


export async function analyzeFoodItem(input: AnalyzeFoodItemInput): Promise<AnalyzeFoodItemOutput> {
  return analyzeFoodItemFlow(input);
}

const analyzeFoodItemPrompt = ai.definePrompt({
  name: 'analyzeFoodItemPrompt',
  input: {schema: AnalyzeFoodItemInputSchema},
  output: {schema: AnalyzeFoodItemOutputSchema},
  prompt: `You are an expert AI assistant specialized in FODMAP analysis for individuals with IBS. Your analysis MUST be portion-specific.
You will receive a food item, its ingredients, and a portion size. Your task is:
1.  Analyze each ingredient for its FODMAP content.
2.  Determine an overall FODMAP risk (Green, Yellow, Red) for the *specified portion* of the food item.
3.  Provide a detailed explanation for the overall risk, highlighting impactful ingredients and how portion size affects the rating.
4.  If possible, estimate a detailed FODMAP profile (fructans, GOS, lactose, excess fructose, sorbitol, mannitol) for the given portion.

Base your analysis on established FODMAP data (conceptually, like Monash University's guidelines).

Scoring Guide (Portion-Specific):
*   Green: Low FODMAP content *at the specified portion*. Generally well-tolerated.
*   Yellow: Moderate FODMAP content *at the specified portion*. May trigger symptoms in sensitive individuals.
*   Red: High FODMAP content *at thespecified portion*. Likely to trigger symptoms.

Example:
- Food: Apple, Portion: 1/2 medium -> Expected: Green (if applicable for 1/2 apple)
- Food: Apple, Portion: 1 whole medium -> Expected: Red (if applicable for 1 whole apple)
- Food: Garlic Bread, Ingredients: Bread, Butter, Garlic, Portion: 1 slice -> Expected: Red (due to garlic/fructans in bread)

Food Item: {{{foodItem}}}
Ingredients: {{{ingredients}}}
Portion: {{{portionSize}}} {{{portionUnit}}}

Output a JSON object. For 'ingredientFodmapScores', list each ingredient with its score ('Green', 'Yellow', 'Red') relative to its likely presence in the given portion and a brief reason if Yellow or Red.
For 'overallRisk', provide the Green/Yellow/Red rating for the whole item *at the specified portion*.
For 'reason', explain the overallRisk, focusing on key ingredients and portion impact.
For 'detailedFodmapProfile', provide estimated numeric values for each FODMAP subgroup if possible.
If an ingredient list is very generic (e.g., "pasta sauce"), make reasonable assumptions about common high/low FODMAP components or state the limitation.
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
