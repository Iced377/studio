
'use server';
/**
 * @fileOverview This file contains the Genkit flow for FODMAP detection in food items, considering portion sizes,
 * and also estimates calorie, macronutrient content, Glycemic Index, Fiber, Micronutrients, Gut Bacteria Impact,
 * Keto Friendliness, and detects common allergens, providing textual summaries.
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
  foodItem: z.string().describe('The name of the food item to analyze. This may include quantities, e.g., "4 eggs and 2 slices of toast".'),
  ingredients: z.string().describe('A comma-separated list of ingredients in the food item.'),
  portionSize: z.string().describe('The size of the portion, e.g., "100", "0.5", "1". This refers to the overall meal portion if foodItem is complex.'),
  portionUnit: z.string().describe('The unit for the portion, e.g., "g", "cup", "medium apple", "meal". This refers to the overall meal portion unit.'),
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
  level: z.enum(['Low', 'Medium', 'High', 'Unknown']).optional().describe("Categorical GI level (Low: <=55, Medium: 56-69, High: >=70, Unknown) based on the GI value and portion.")
}).describe("Information about the food item's estimated Glycemic Index.");

const DietaryFiberInfoSchema = z.object({
  amountGrams: z.number().optional().describe("Estimated total dietary fiber in grams for the given portion."),
  quality: z.enum(['Low', 'Adequate', 'High']).optional().describe("Qualitative assessment of fiber content (Low, Adequate, High) for the portion based on general dietary recommendations (e.g., a few grams is low, 5-7g is adequate, >7g is high for a single item).")
}).describe("Information about the food item's estimated dietary fiber content.");

const MicronutrientDetailSchema = z.object({
  name: z.string().describe("Name of the micronutrient, e.g., 'Iron', 'Vitamin C', 'Calcium', 'Potassium', 'Magnesium', 'Vitamin B12', 'Vitamin D3', 'Omega-3', 'EPA', 'DHA'."),
  amount: z.string().optional().describe("Estimated amount of the micronutrient in the portion, with units (e.g., '10 mg', '90 mcg', '50000 IU'). If the user input specified a quantity (e.g., 'Vitamin D3 50000 IU', 'Omega-3 800mg (480 EPA, 320 DHA)'), YOU MUST use that exact user-provided string or the correctly summed/transcribed value here (e.g., '50000 IU' for D3, or '800 mg' for Omega-3 if it's a sum of EPA/DHA). DO NOT use vague phrases like 'Varies, check label' or 'Varies by dose' if the user provided a specific quantity."),
  dailyValuePercent: z.number().optional().describe("Estimated percentage of Daily Value (%DV) for the micronutrient, if applicable and known for an average adult. If a specific amount was provided by the user (e.g. '50000 IU Vitamin D3') and you cannot confidently convert this to %DV, omit this field or set to null."),
  iconName: z.string().optional().describe("A suggested relevant lucide-react icon name based on the nutrient's primary **supported body part or physiological function**. Examples: 'Bone' for Calcium or Phosphorus, 'Activity' for Magnesium (muscle/nerve function), 'PersonStanding' for Zinc (growth), 'Eye' for Vitamin A, 'ShieldCheck' for Vitamin C & D (immune support), 'Droplet' for Potassium & Sodium (electrolyte balance), 'Wind' for Iron (oxygen transport), 'Brain' for B12 & Iodine, 'Baby' for Folate (development), 'Heart' for Vitamin K (blood clotting). Use generic names like 'Atom' or 'Sparkles' if a specific, intuitive functional icon is not available. If no good icon, omit."),
}).describe("Details for a specific micronutrient.");

const MicronutrientsInfoSchema = z.object({
  notable: z.array(MicronutrientDetailSchema).optional().describe("Up to 3-5 most notable or abundant micronutrients in the food item for the given portion, OR THOSE EXPLICITLY MENTIONED BY THE USER WITH QUANTITIES. User-specified nutrients (like 'D3 50,000 IU') MUST appear here with their user-specified amounts."),
  fullList: z.array(MicronutrientDetailSchema).optional().describe("Optionally, a more comprehensive list of micronutrients if readily available and concise, including any user-specified nutrients. Any user-specified nutrient with a quantity MUST be accurately represented here."),
}).describe("Overview of key micronutrients in the food item.");

const GutBacteriaImpactInfoSchema = z.object({
  sentiment: z.enum(['Positive', 'Negative', 'Neutral', 'Unknown']).optional().describe("Estimated general impact on gut bacteria diversity or balance (Positive, Negative, Neutral, Unknown). Consider prebiotics, probiotics, processed ingredients, etc."),
  reasoning: z.string().optional().describe("Short reasoning for the estimated gut bacteria impact (e.g., 'Contains prebiotic fiber', 'High in processed sugars, may negatively impact diversity', 'Contains probiotics')."),
}).describe("Estimated impact of the food item on gut bacteria.");

const KetoFriendlinessInfoSchema = z.object({
    score: z.enum(['Strict Keto', 'Moderate Keto', 'Low Carb', 'Not Keto-Friendly', 'Unknown']).describe("Assessment of the food's suitability for a ketogenic diet for the given portion."),
    reasoning: z.string().optional().describe("Brief explanation for the keto score (e.g., 'High in net carbs due to X', 'Low carb, suitable for keto in moderation', 'Mainly fats and protein, good for keto')."),
    estimatedNetCarbs: z.number().optional().describe("Optional estimated net carbs in grams for the portion, if calculable (Total Carbs - Fiber).")
}).describe("Information about the food item's keto-friendliness.");

const AISummariesSchema = z.object({
  fodmapSummary: z.string().optional().describe("Optional concise summary of FODMAP analysis if the main `reason` is very detailed. E.g., 'Mainly low FODMAP but watch portion of X'."),
  micronutrientSummary: z.string().optional().describe("Brief (1-2 sentence) textual summary of key micronutrients. E.g., 'Good source of Vitamin C and Iron.' or 'Notable for Calcium content.' If specific user-provided nutrients like '50,000 IU D3' were included, acknowledge these if they are significant (e.g., 'Primarily a high dose Vitamin D3 supplement as specified.')."),
  glycemicIndexSummary: z.string().optional().describe("Brief (1 sentence) textual summary of glycemic impact. E.g., 'Likely has a low glycemic impact based on its ingredients.'"),
  gutImpactSummary: z.string().optional().describe("Optional concise summary of gut bacteria impact if `gutBacteriaImpact.reasoning` is detailed."),
  ketoSummary: z.string().optional().describe("Brief (1-2 sentence) textual summary of keto-friendliness. E.g., 'Appears suitable for a strict keto diet.' or 'Too high in carbs for keto.'"),
}).describe("Additional concise textual summaries for display in an 'AI Notes' section.");

const AnalyzeFoodItemOutputSchema = z.object({
  ingredientFodmapScores: z.array(IngredientScoreSchema).describe('A list of ingredients and their FODMAP scores, adjusted for the overall portion.'),
  overallRisk: FodmapScoreSchema.describe('The overall FODMAP risk level of the food item for the specified portion (Green, Yellow, or Red).'),
  reason: z.string().describe('Explanation of why the food item has the assigned risk level for the given portion. Mention key ingredients and portion impact.'),
  detailedFodmapProfile: DetailedFoodFODMAPProfileSchema.optional().describe("An estimated detailed FODMAP profile for the given portion of the food item."),
  calories: z.number().optional().describe('Estimated total calories for the given portion.'),
  protein: z.number().optional().describe('Estimated total protein in grams for the given portion.'),
  carbs: z.number().optional().describe('Estimated total carbohydrates in grams for the given portion.'),
  fat: z.number().optional().describe('Estimated total fat in grams for the given portion.'),
  glycemicIndexInfo: GlycemicIndexInfoSchema.optional().describe("Glycemic Index information."),
  dietaryFiberInfo: DietaryFiberInfoSchema.optional().describe("Dietary fiber information."),
  micronutrientsInfo: MicronutrientsInfoSchema.optional().describe("Micronutrients overview."),
  gutBacteriaImpact: GutBacteriaImpactInfoSchema.optional().describe("Gut bacteria impact assessment."),
  ketoFriendliness: KetoFriendlinessInfoSchema.optional().describe("Keto-friendliness assessment."), // Added Keto
  detectedAllergens: z.array(z.string()).optional().describe("List of common allergens detected in the ingredients (e.g., Milk, Wheat, Soy). If none, can be empty or omitted."),
  aiSummaries: AISummariesSchema.optional().describe("Concise AI-generated textual summaries for display in notes."),
});
// The AnalyzeFoodItemOutput type is now imported from @/types where it's defined as ExtendedAnalyzeFoodItemOutput


export async function analyzeFoodItem(input: AnalyzeFoodItemInput): Promise<AnalyzeFoodItemOutput> {
  return analyzeFoodItemFlow(input);
}

const analyzeFoodItemPrompt = ai.definePrompt({
  name: 'analyzeFoodItemPrompt',
  input: {schema: AnalyzeFoodItemInputSchema},
  output: {schema: AnalyzeFoodItemOutputSchema}, // This schema now includes the new health indicators, allergens, and AI summaries
  config: {
    temperature: 0.2, // Lower temperature for more deterministic output
  },
  prompt: `You are an expert AI assistant specialized in comprehensive food analysis for individuals with IBS, focusing on portion-specificity.
You will receive a food item, its ingredients, and a portion size. The 'Food Item: {{{foodItem}}}' field may contain specific quantities of items (e.g., "4 eggs", "2 slices of toast"). YOU MUST use these quantities in your analysis.

Your task is to provide:

1.  **FODMAP Analysis (Portion-Specific):**
    *   Analyze each ingredient listed in 'Ingredients: {{{ingredients}}}' for its FODMAP content.
    *   Determine an overall FODMAP risk (Green, Yellow, Red) for the *specified overall portion* ('Portion: {{{portionSize}}} {{{portionUnit}}}').
    *   Provide a detailed explanation for the overall risk in the \`reason\` field.
    *   If possible, estimate a detailed FODMAP profile (fructans, GOS, lactose, excess fructose, sorbitol, mannitol) for the given overall portion.

2.  **Nutritional Estimation (Portion-Specific and Quantity-Aware):**
    *   **Crucially, estimate total calories for the entire meal as described in 'Food Item: {{{foodItem}}}' considering the overall 'Portion: {{{portionSize}}} {{{portionUnit}}}'. If the 'Food Item' field specifies quantities (e.g., "4 eggs", "2 slices toast"), ensure your nutritional estimates reflect those specific quantities for those components within the overall meal.**
    *   Similarly, estimate total macronutrients: protein (g), carbohydrates (g), and fat (g) for the entire specified meal, portion, and taking into account any quantities mentioned in the 'Food Item' field.
    *   When estimating nutrition for a multi-component meal (e.g., '4 eggs and 2 slices of toast'), consider the nutritional contribution of each major component based on the provided ingredients and the quantities mentioned in the 'Food Item' field.

3.  **Glycemic Index (GI) (Portion-Specific):**
    *   Estimate the Glycemic Index (GI) value if commonly known for the item or its main ingredients.
    *   Categorize the GI level (Low, Medium, High, Unknown) based on standard ranges (Low: <=55, Medium: 56-69, High: >=70), considering the portion.

4.  **Dietary Fiber (Portion-Specific):**
    *   Estimate the total dietary fiber in grams.
    *   Provide a qualitative assessment (Low, Adequate, High) of fiber content for the portion. For a single item, <2g might be Low, 2-4g Adequate, >5g High.

5.  **Micronutrients Overview (Portion-Specific and Quantity-Aware):**
    *   **ABSOLUTE CRITICAL INSTRUCTION FOR USER-SPECIFIED NUTRIENTS IN INGREDIENTS LIST:** Your TOP PRIORITY for micronutrients is to IDENTIFY and ACCURATELY RECORD any nutrient explicitly mentioned by the user in 'Ingredients: {{{ingredients}}}' ALONG WITH ITS EXACT QUANTITY (e.g., "Vitamin D3 50,000 IU", "Iron 10mg", "Omega-3 800mg (480 EPA, 320 DHA)").
    *   **IF A USER PROVIDES AN EXACT QUANTITY IN INGREDIENTS (e.g., "D3 50,000 IU", "Omega-3 800mg (480 EPA + 320 DHA)"):**
        *   **YOU MUST USE THE USER'S EXACT PROVIDED QUANTITY STRING** for the 'amount' field in \`MicronutrientDetailSchema\`.
        *   **DO NOT CHANGE OR OVERRIDE THE USER'S STATED AMOUNT** from the ingredients list.
        *   **AVOID VAGUE STATEMENTS:** For these user-specified nutrients with quantities from the ingredients list, you are PROHIBITED from outputting "Varies, check label" or similar for the 'amount' field.
        *   These user-specified nutrients from the ingredients list, with their user-provided amounts, MUST be listed in the 'notable' or 'fullList' arrays.
        *   For these user-specified amounts from ingredients, calculate 'dailyValuePercent' *only if you are extremely confident*. OMIT if unsure.
    *   **NATURALLY OCCURRING MICRONUTRIENTS & QUANTITIES FROM FOOD ITEM NAME:** *After* processing nutrients from the ingredients list, consider the 'Food Item: {{{foodItem}}}' (e.g., "4 eggs", "1 banana"). For common whole foods or distinct components described here, AIM TO PROVIDE A REASONABLE ESTIMATE FOR AT LEAST 2-3 KEY MICRONUTRIENTS present in significant amounts for the described portion and quantities. For example, for "4 eggs", provide key micronutrients for four eggs.
    *   **Icons:** Suggest a relevant lucide-react icon name for \`iconName\` field for each micronutrient, based on its primary **supported body part or physiological function**. Examples: 'Bone' for Calcium, 'Activity' for Magnesium, 'Eye' for Vitamin A, 'ShieldCheck' for Vitamin C/D, 'Wind' for Iron. Use generic names like 'Atom' or 'Sparkles' if a specific functional icon is not available. If no good icon, omit.

6.  **Gut Bacteria Impact (Portion-Specific):**
    *   Estimate the general impact on gut bacteria (Positive, Negative, Neutral, Unknown).
    *   Provide brief reasoning in the \`gutBacteriaImpact.reasoning\` field.

7.  **Keto-Friendliness (Portion-Specific):**
    *   Assess suitability for a ketogenic diet (score: 'Strict Keto', 'Moderate Keto', 'Low Carb', 'Not Keto-Friendly', 'Unknown').
    *   Provide \`ketoFriendliness.reasoning\` and optionally \`ketoFriendliness.estimatedNetCarbs\`.

8.  **Allergen Detection:**
    *   Analyze 'Ingredients: {{{ingredients}}}' for common allergens (Milk, Eggs, Fish, Shellfish, Tree nuts, Peanuts, Wheat, Soy, Sesame).
    *   Populate \`detectedAllergens\` array.

9.  **AI Textual Summaries (\`aiSummaries\` field):**
    *   \`aiSummaries.fodmapSummary\`: (Optional) Concise FODMAP summary if \`reason\` is long.
    *   \`aiSummaries.micronutrientSummary\`: Brief textual summary. Acknowledge user-specified high-dose supplements (from ingredients) or significant natural sources based on the 'Food Item' name.
    *   \`aiSummaries.glycemicIndexSummary\`: Brief textual GI summary.
    *   \`aiSummaries.gutImpactSummary\`: (Optional) Concise gut impact summary if reasoning is long.
    *   \`aiSummaries.ketoSummary\`: Brief textual keto-friendliness summary.

Base your analysis on established FODMAP data, general nutritional databases, and food properties. ALWAYS consider the specified overall portion and any quantities mentioned in the 'Food Item' name.

Food Item: {{{foodItem}}}
Ingredients: {{{ingredients}}}
Portion: {{{portionSize}}} {{{portionUnit}}}

Output a JSON object adhering to the full output schema. If specific data for an optional field is not reasonably estimable, omit that specific sub-field or set to null. Ensure ALL user-specified nutrients with quantities (from ingredients) are accurately reflected, and nutritional estimates (macros, calories, natural micros) correctly account for quantities mentioned in the 'Food Item' field.
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

