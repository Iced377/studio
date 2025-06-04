
'use server';
/**
 * @fileOverview This file contains the Genkit flow for FODMAP detection in food items, considering portion sizes,
 * and also estimates calorie, macronutrient content, Glycemic Index, Fiber, Micronutrients, and Gut Bacteria Impact.
 *
 * - analyzeFoodItem - Analyzes a food item for FODMAPs and various health indicators.
 * - AnalyzeFoodItemInput - The input type for the analyzeFoodItem function.
 * - AnalyzeFoodItemOutput - The return type for the analyzeFoodItem function. (Now ExtendedAnalyzeFoodItemOutput from types)
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ExtendedAnalyzeFoodItemOutput as AnalyzeFoodItemOutput } from '@/types'; // Import the extended type

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

// New schemas for additional health indicators
const GlycemicIndexInfoSchema = z.object({
  value: z.number().optional().describe("Estimated Glycemic Index (GI) value of the food item per serving. Provide if known from common food databases."),
  level: z.enum(['Low', 'Medium', 'High']).optional().describe("Categorical GI level (Low: <=55, Medium: 56-69, High: >=70) based on the GI value and portion.")
}).describe("Information about the food item's estimated Glycemic Index.");

const DietaryFiberInfoSchema = z.object({
  amountGrams: z.number().optional().describe("Estimated total dietary fiber in grams for the given portion."),
  quality: z.enum(['Low', 'Adequate', 'High']).optional().describe("Qualitative assessment of fiber content (Low, Adequate, High) for the portion based on general dietary recommendations (e.g., a few grams is low, 5-7g is adequate, >7g is high for a single item).")
}).describe("Information about the food item's estimated dietary fiber content.");

const MicronutrientDetailSchema = z.object({
  name: z.string().describe("Name of the micronutrient, e.g., 'Iron', 'Vitamin C', 'Calcium', 'Potassium', 'Magnesium', 'Vitamin B12'."),
  amount: z.string().optional().describe("Estimated amount of the micronutrient in the portion, with units (e.g., '10 mg', '90 mcg')."),
  dailyValuePercent: z.number().optional().describe("Estimated percentage of Daily Value (%DV) for the micronutrient, if applicable and known for an average adult."),
  iconName: z.string().optional().describe("A suggested relevant lucide-react icon name based on the nutrient's primary **supported body part or physiological function**. Examples: 'Bone' for Calcium or Phosphorus, 'Activity' for Magnesium (muscle/nerve function), 'PersonStanding' for Zinc (growth), 'Eye' for Vitamin A, 'ShieldCheck' for Vitamin C & D (immune support), 'Droplet' for Potassium & Sodium (electrolyte balance), 'Wind' for Iron (oxygen transport), 'Brain' for B12 & Iodine, 'Baby' for Folate (development), 'Heart' for Vitamin K (blood clotting). Use generic names like 'Atom' or 'Sparkles' if a specific, intuitive functional icon is not available. If no good icon, omit."),
}).describe("Details for a specific micronutrient.");

const MicronutrientsInfoSchema = z.object({
  notable: z.array(MicronutrientDetailSchema).optional().describe("Up to 3 most notable or abundant micronutrients in the food item for the given portion, or those particularly relevant (e.g., iron in red meat)."),
  fullList: z.array(MicronutrientDetailSchema).optional().describe("Optionally, a more comprehensive list of micronutrients if readily available and concise."),
}).describe("Overview of key micronutrients in the food item.");

const GutBacteriaImpactInfoSchema = z.object({
  sentiment: z.enum(['Positive', 'Negative', 'Neutral', 'Unknown']).optional().describe("Estimated general impact on gut bacteria diversity or balance (Positive, Negative, Neutral, Unknown). Consider prebiotics, probiotics, processed ingredients, etc."),
  reasoning: z.string().optional().describe("Short reasoning for the estimated gut bacteria impact (e.g., 'Contains prebiotic fiber', 'High in processed sugars, may negatively impact diversity', 'Contains probiotics')."),
}).describe("Estimated impact of the food item on gut bacteria.");

const AnalyzeFoodItemOutputSchema = z.object({
  ingredientFodmapScores: z.array(IngredientScoreSchema).describe('A list of ingredients and their FODMAP scores, adjusted for the overall portion.'),
  overallRisk: FodmapScoreSchema.describe('The overall FODMAP risk level of the food item for the specified portion (Green, Yellow, or Red).'),
  reason: z.string().describe('Explanation of why the food item has the assigned risk level for the given portion. Mention key ingredients and portion impact.'),
  detailedFodmapProfile: DetailedFoodFODMAPProfileSchema.optional().describe("An estimated detailed FODMAP profile for the given portion of the food item."),
  calories: z.number().optional().describe('Estimated total calories for the given portion.'),
  protein: z.number().optional().describe('Estimated total protein in grams for the given portion.'),
  carbs: z.number().optional().describe('Estimated total carbohydrates in grams for the given portion.'),
  fat: z.number().optional().describe('Estimated total fat in grams for the given portion.'),
  // Adding new health indicator fields
  glycemicIndexInfo: GlycemicIndexInfoSchema.optional().describe("Glycemic Index information."),
  dietaryFiberInfo: DietaryFiberInfoSchema.optional().describe("Dietary fiber information."),
  micronutrientsInfo: MicronutrientsInfoSchema.optional().describe("Micronutrients overview."),
  gutBacteriaImpact: GutBacteriaImpactInfoSchema.optional().describe("Gut bacteria impact assessment."),
});
// The AnalyzeFoodItemOutput type is now imported from @/types where it's defined as ExtendedAnalyzeFoodItemOutput


export async function analyzeFoodItem(input: AnalyzeFoodItemInput): Promise<AnalyzeFoodItemOutput> {
  return analyzeFoodItemFlow(input);
}

const analyzeFoodItemPrompt = ai.definePrompt({
  name: 'analyzeFoodItemPrompt',
  input: {schema: AnalyzeFoodItemInputSchema},
  output: {schema: AnalyzeFoodItemOutputSchema}, // This schema now includes the new health indicators
  prompt: `You are an expert AI assistant specialized in comprehensive food analysis for individuals with IBS, focusing on portion-specificity.
You will receive a food item, its ingredients, and a portion size. Your task is to provide:

1.  **FODMAP Analysis (Portion-Specific):**
    *   Analyze each ingredient for its FODMAP content.
    *   Determine an overall FODMAP risk (Green, Yellow, Red) for the *specified portion*.
    *   Provide a detailed explanation for the overall risk.
    *   If possible, estimate a detailed FODMAP profile (fructans, GOS, lactose, excess fructose, sorbitol, mannitol) for the given portion.

2.  **Nutritional Estimation (Portion-Specific):**
    *   Estimate total calories.
    *   Estimate total macronutrients: protein (g), carbohydrates (g), and fat (g).

3.  **Glycemic Index (GI) (Portion-Specific):**
    *   Estimate the Glycemic Index (GI) value if commonly known for the item or its main ingredients.
    *   Categorize the GI level (Low, Medium, High) based on standard ranges (Low: <=55, Medium: 56-69, High: >=70), considering the portion. If GI value is not available, level may also be "Unknown".

4.  **Dietary Fiber (Portion-Specific):**
    *   Estimate the total dietary fiber in grams.
    *   Provide a qualitative assessment (Low, Adequate, High) of fiber content for the portion. For a single item, <2g might be Low, 2-4g Adequate, >5g High.

5.  **Micronutrients Overview (Portion-Specific):**
    *   Identify up to 3 notable micronutrients (e.g., Iron, Vitamin C, Calcium, Potassium, B12).
    *   For each, provide estimated amount with units and %DV if readily available.
    *   Suggest a relevant lucide-react icon name for \`iconName\` field, based on the nutrient's primary **supported body part or physiological function**. Examples: 'Bone' for Calcium or Phosphorus, 'Activity' for Magnesium (muscle/nerve function), 'PersonStanding' for Zinc (growth), 'Eye' for Vitamin A, 'ShieldCheck' for Vitamin C & D (immune support), 'Droplet' for Potassium & Sodium (electrolyte balance), 'Wind' for Iron (oxygen transport), 'Brain' for B12 & Iodine, 'Baby' for Folate (development), 'Heart' for Vitamin K (blood clotting). Use generic names like 'Atom' or 'Sparkles' if a specific, intuitive functional icon is not available. If no good icon, omit.

6.  **Gut Bacteria Impact (Portion-Specific):**
    *   Estimate the general impact on gut bacteria (Positive, Negative, Neutral, Unknown).
    *   Provide brief reasoning (e.g., "Contains prebiotic fiber like inulin", "High in saturated fat, potentially negative for diversity", "Probiotic content from yogurt").

Base your analysis on established FODMAP data (like Monash University's guidelines), general nutritional databases, and common knowledge about food properties. ALWAYS consider the specified portion size.

Food Item: {{{foodItem}}}
Ingredients: {{{ingredients}}}
Portion: {{{portionSize}}} {{{portionUnit}}}

Output a JSON object adhering to the full output schema including all FODMAP details, nutritional estimates, glycemicIndexInfo, dietaryFiberInfo, micronutrientsInfo, and gutBacteriaImpact.
If specific data for an optional field (e.g., a specific micronutrient amount, GI value) is not reasonably estimable or widely available, omit that specific sub-field or set to null, but try to provide the higher-level object if some information can be given (e.g., gutImpact.sentiment = 'Unknown'). For micronutrients, if none are particularly "notable", the 'notable' array can be empty or omitted.
`,
});

const analyzeFoodItemFlow = ai.defineFlow(
  {
    name: 'analyzeFoodItemFlow',
    inputSchema: AnalyzeFoodItemInputSchema,
    outputSchema: AnalyzeFoodItemOutputSchema, // Ensure this matches the extended schema for the prompt
  },
  async input => {
    const {output} = await analyzeFoodItemPrompt(input);
    return output! as AnalyzeFoodItemOutput; // Cast to the extended type
  }
);

// Ensure the detailed profile type is exported if it's used elsewhere, though now the main output is extended.
// The ExtendedAnalyzeFoodItemOutput from @/types is the primary export type for this flow's result.
export type { FoodFODMAPProfile as DetailedFodmapProfileFromAI };
