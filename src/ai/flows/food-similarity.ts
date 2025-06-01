
'use server';

/**
 * @fileOverview This file defines a Genkit flow to determine if a food item (with its portion) is similar to a user's safe foods (with their portions) based on their FODMAP profiles.
 *
 * - isSimilarToSafeFoods - A function that checks if a food item is similar to user-defined safe foods.
 * - FoodSimilarityInput - The input type for the isSimilarToSafeFoods function.
 * - FoodSimilarityOutput - The return type for the isSimilarToSafeFoods function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { FoodFODMAPProfile as DetailedFodmapProfileFromAI } from './fodmap-detection'; // Use the detailed one from fodmap-detection

// This schema represents the FODMAP profile used for comparison.
// It should align with what `fodmap-detection` can output in `detailedFodmapProfile`.
const FoodFODMAPProfileSchema = z.object({
  fructans: z.number().optional().describe('Estimated Fructans content.'),
  galactans: z.number().optional().describe('Estimated Galactans (GOS) content.'),
  polyolsSorbitol: z.number().optional().describe('Estimated Sorbitol content.'),
  polyolsMannitol: z.number().optional().describe('Estimated Mannitol content.'),
  lactose: z.number().optional().describe('Estimated Lactose content.'),
  fructose: z.number().optional().describe('Estimated excess Fructose content.'),
  totalOligos: z.number().optional().describe('Total Oligosaccharides (Fructans + GOS).'),
  totalPolyols: z.number().optional().describe('Total Polyols (Sorbitol + Mannitol).'),
}).describe("A detailed, estimated FODMAP profile for a specific food item and portion.");

export type FoodFODMAPProfile = z.infer<typeof FoodFODMAPProfileSchema>;

// This is the schema for the main flow input. fodmapProfile is an object.
const FoodItemWithPortionProfileSchema = z.object({
  name: z.string().describe("Name of the food item."),
  portionSize: z.string().describe("Portion size (e.g., '100', '1/2')."),
  portionUnit: z.string().describe("Portion unit (e.g., 'g', 'cup')."),
  fodmapProfile: FoodFODMAPProfileSchema.describe('Detailed FODMAP profile of the food item for the specified portion.'),
});

const FoodSimilarityInputSchema = z.object({
  currentFoodItem: FoodItemWithPortionProfileSchema.describe('The food item (with portion and FODMAP profile) to be checked.'),
  userSafeFoodItems: z.array(FoodItemWithPortionProfileSchema).describe('Array of user-defined safe food items, each including its name, saved portion, and FODMAP profile for that portion.'),
});

export type FoodSimilarityInput = z.infer<typeof FoodSimilarityInputSchema>;

// This is the schema for the prompt's input. fodmapProfile is a JSON string.
const PromptInputSchema = z.object({
  currentFoodItem: z.object({
    name: z.string(),
    portionSize: z.string(),
    portionUnit: z.string(),
    fodmapProfile: z.string().describe('JSON string of the detailed FODMAP profile.'),
  }),
  userSafeFoodItems: z.array(z.object({
    name: z.string(),
    portionSize: z.string(),
    portionUnit: z.string(),
    fodmapProfile: z.string().describe('JSON string of the detailed FODMAP profile.'),
  })),
});


const FoodSimilarityOutputSchema = z.object({
  isSimilar: z.boolean().describe('Indicates whether the current food item is similar to any of the user-defined safe foods, considering both FODMAP profile and portion context.'),
  similarityReason: z.string().optional().describe('Reasoning behind the similarity assessment. If similar, mention which safe food it resembles and why (e.g., "Similar to your safe intake of 1/2 cup rice due to low overall FODMAPs and comparable portion.").'),
});

export type FoodSimilarityOutput = z.infer<typeof FoodSimilarityOutputSchema>;

export async function isSimilarToSafeFoods(input: FoodSimilarityInput): Promise<FoodSimilarityOutput> {
  if (!input.userSafeFoodItems || input.userSafeFoodItems.length === 0) {
    return { isSimilar: false, similarityReason: "No safe foods defined by the user to compare against." };
  }
  return foodSimilarityFlow(input);
}

const foodSimilarityPrompt = ai.definePrompt({
  name: 'foodSimilarityPrompt',
  input: {schema: PromptInputSchema}, // Use the schema with stringified profiles
  output: {schema: FoodSimilarityOutputSchema},
  prompt: `You are an AI assistant that determines whether a given food item (with its specific portion) is similar to any of a user's "safe" foods (each with their specific saved portion and FODMAP profile).

  Current Food Item to Check:
  Name: {{{currentFoodItem.name}}}
  Portion: {{{currentFoodItem.portionSize}}} {{{currentFoodItem.portionUnit}}}
  FODMAP Profile (estimated for this portion, as JSON string): {{{currentFoodItem.fodmapProfile}}}

  User's Safe Foods (with their saved "safe" portions and profiles, as JSON strings):
  {{#each userSafeFoodItems}}
  - Name: {{{this.name}}}, Portion: {{{this.portionSize}}} {{{this.portionUnit}}}, FODMAP Profile: {{{this.fodmapProfile}}}
  {{/each}}

  Analyze the FODMAP profiles (provided as JSON strings) AND the portion contexts.
  A food is "similar" if its FODMAP profile at the given portion is comparable to the FODMAP profile of one of the user's safe foods *at its saved safe portion*.
  Consider if the types and levels of FODMAPs (fructans, GOS, lactose, excess fructose, sorbitol, mannitol) in the current item are low AND align with at least one safe food's profile.
  Minor variations in portion might be acceptable if the FODMAP load remains similar and low.
  For example, if a user marked "1/2 cup cooked rice" as safe (very low FODMAP), then "3/4 cup cooked rice" might also be considered similar if it remains very low FODMAP. However, if "1 slice of wheat bread" (moderate fructans) is safe, "2 slices of wheat bread" might become high fructan and thus not similar.

  Set \`isSimilar\` to true if the current food item, at its specified portion, closely matches the safety profile of any of the user's safe foods at their specified portions.
  If \`isSimilar\` is true, \`similarityReason\` should explain which safe food it's similar to and why (e.g., "Similar to your safe portion of oats because both are low in oligos and polyols at these amounts.").
  If not similar, \`isSimilar\` should be false.
`,
});

const foodSimilarityFlow = ai.defineFlow(
  {
    name: 'foodSimilarityFlow',
    inputSchema: FoodSimilarityInputSchema, // Original schema for the flow's external contract
    outputSchema: FoodSimilarityOutputSchema,
  },
  async (input: FoodSimilarityInput): Promise<FoodSimilarityOutput> => { // Typed with original input
    // Transform input for the prompt: stringify FODMAP profiles
    const promptInputData = {
      currentFoodItem: {
        ...input.currentFoodItem,
        fodmapProfile: JSON.stringify(input.currentFoodItem.fodmapProfile),
      },
      userSafeFoodItems: input.userSafeFoodItems.map(item => ({
        ...item,
        fodmapProfile: JSON.stringify(item.fodmapProfile),
      })),
    };

    const {output} = await foodSimilarityPrompt(promptInputData); // Pass transformed input to the prompt
    return output!;
  }
);

// Export the detailed profile type for use in fodmap-detection or other places
export type { DetailedFodmapProfileFromAI };

