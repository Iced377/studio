'use server';

/**
 * @fileOverview This file defines a Genkit flow to determine if a food item is similar to a user's safe foods based on their FODMAP profiles.
 *
 * - isSimilarToSafeFoods - A function that checks if a food item is similar to user-defined safe foods.
 * - FoodSimilarityInput - The input type for the isSimilarToSafeFoods function, including the food item's FODMAP profile and the user's safe food profiles.
 * - FoodSimilarityOutput - The return type for the isSimilarToSafeFoods function, indicating whether the food is similar to safe foods.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FoodFODMAPProfileSchema = z.object({
  fructans: z.number().describe('Fructans content in the food item.'),
  galactans: z.number().describe('Galactans content in the food item.'),
  polyols: z.number().describe('Polyols content in the food item.'),
  lactose: z.number().describe('Lactose content in the food item.'),
  mannitol: z.number().describe('Mannitol content in the food item.'),
  fructose: z.number().describe('Fructose content in the food item.'),
});

export type FoodFODMAPProfile = z.infer<typeof FoodFODMAPProfileSchema>;

const FoodSimilarityInputSchema = z.object({
  foodItemFODMAPProfile: FoodFODMAPProfileSchema.describe('FODMAP profile of the food item to be checked.'),
  userSafeFoodsFODMAPProfiles: z.array(FoodFODMAPProfileSchema).describe('Array of FODMAP profiles of the user-defined safe foods.'),
});

export type FoodSimilarityInput = z.infer<typeof FoodSimilarityInputSchema>;

const FoodSimilarityOutputSchema = z.object({
  isSimilar: z.boolean().describe('Indicates whether the food item is similar to the user-defined safe foods.'),
  similarityReason: z.string().optional().describe('Reasoning behind the similarity assessment, if applicable.'),
});

export type FoodSimilarityOutput = z.infer<typeof FoodSimilarityOutputSchema>;

export async function isSimilarToSafeFoods(input: FoodSimilarityInput): Promise<FoodSimilarityOutput> {
  return foodSimilarityFlow(input);
}

const foodSimilarityPrompt = ai.definePrompt({
  name: 'foodSimilarityPrompt',
  input: {schema: FoodSimilarityInputSchema},
  output: {schema: FoodSimilarityOutputSchema},
  prompt: `You are an AI assistant that determines whether a given food item is similar to a user's safe foods based on their FODMAP profiles.

  Here is the FODMAP profile of the food item to be checked:
  FODMAP Profile: {{JSON.stringify foodItemFODMAPProfile}}

  Here are the FODMAP profiles of the user-defined safe foods:
  Safe Foods Profiles: {{JSON.stringify userSafeFoodsFODMAPProfiles}}

  Analyze the FODMAP profiles and determine if the food item is similar to the user's safe foods. Consider the levels of each FODMAP group (fructans, galactans, polyols, lactose, mannitol, and fructose) and how they compare between the food item and the safe foods.

  Provide a similarity assessment, and set the isSimilar output field appropriately. If isSimilar is true, provide a reason for the similarity in the similarityReason field.
  If the food item has significantly different FODMAP levels compared to the safe foods, then isSimilar should be false.
`,
});

const foodSimilarityFlow = ai.defineFlow(
  {
    name: 'foodSimilarityFlow',
    inputSchema: FoodSimilarityInputSchema,
    outputSchema: FoodSimilarityOutputSchema,
  },
  async input => {
    const {output} = await foodSimilarityPrompt(input);
    return output!;
  }
);
