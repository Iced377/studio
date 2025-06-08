
'use server';
/**
 * @fileOverview Identifies food items, ingredients, and estimates portions from an image.
 *
 * - identifyFoodFromImage - Processes an image to identify food details.
 * - IdentifyFoodFromImageInput - Input schema for the flow.
 * - IdentifyFoodFromImageOutput - Output schema for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const IdentifyFoodFromImageInputSchema = z.object({
  imageDataUri: z.string().describe(
    "A photo of a food item or packaging, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  userLocale: z.string().optional().describe("User's locale, e.g., 'en-US', to help with units and food names if possible."),
});
export type IdentifyFoodFromImageInput = z.infer<typeof IdentifyFoodFromImageInputSchema>;

const IdentifyFoodFromImageOutputSchema = z.object({
  identifiedFoodName: z.string().optional().describe('The most likely name of the food item identified from the image. Could be a product name or a dish name. This will be used to populate the "Food Name" field.'),
  identifiedIngredients: z.string().optional().describe('A comma-separated list of ingredients identified or inferred from the image (e.g., from packaging text or visual cues). This will populate the "Ingredients" field. If specific nutrient quantities like "Vitamin D3 50000 IU" are OCRd from a supplement label, they MUST be included here exactly as OCRd.'),
  estimatedPortionSize: z.string().optional().describe('A rough estimate of the portion size number (e.g., "1", "100", "0.5"). This is highly approximate.'),
  estimatedPortionUnit: z.string().optional().describe('A rough estimate of the portion unit (e.g., "serving", "g", "ml", "item"). This is highly approximate.'),
  ocrText: z.string().optional().describe('Any visible text extracted via OCR from the image, for informational purposes or debugging.'),
  recognitionSuccess: z.boolean().describe('Whether the AI was able to confidently identify a food item and its details suitable for form population.'),
  errorMessage: z.string().optional().describe('An error message if identification failed or was problematic.'),
});
export type IdentifyFoodFromImageOutput = z.infer<typeof IdentifyFoodFromImageOutputSchema>;

export async function identifyFoodFromImage(input: IdentifyFoodFromImageInput): Promise<IdentifyFoodFromImageOutput> {
  return identifyFoodFromImageFlow(input);
}

const identifyFoodPrompt = ai.definePrompt({
  name: 'identifyFoodFromImagePrompt',
  input: { schema: IdentifyFoodFromImageInputSchema },
  output: { schema: IdentifyFoodFromImageOutputSchema },
  config: {
    temperature: 0.2, // Set low temperature for consistent identification
  },
  prompt: `You are an expert food identification AI. Analyze the provided image.
User's locale (optional, for context): {{{userLocale}}}
Image: {{media url=imageDataUri}}

Your tasks are:
1.  Identify the primary food item(s) in the image. If it's packaged, try to identify the product name. If it's a dish, identify the dish. Output this as 'identifiedFoodName'.
2.  Extract or infer a comma-separated list of main ingredients.
    *   If it's a packaged item, attempt to OCR the ingredients list.
    *   **CRITICAL FOR SUPPLEMENTS/NUTRITION PANELS:** If the image appears to be a supplement facts panel or nutrition label, and specific nutrient names with their exact quantities (e.g., "Vitamin D3 50000 IU", "Iron 10mg", "Omega-3 800mg (480 EPA, 320 DHA)") are clearly visible and OCR'd, YOU MUST include these exact strings as part of the comma-separated 'identifiedIngredients' output. Do not simplify, generalize, or omit these OCR'd quantities. Prioritize accurate transcription of this data from the image into the 'identifiedIngredients' field. For example, if "Vitamin D3 50,000 IU" is on the label, 'identifiedIngredients' should contain "Vitamin D3 50,000 IU".
    *   If it's a dish, list common ingredients.
    *   Output this as 'identifiedIngredients'.
3.  Provide a very rough estimate for 'estimatedPortionSize' (e.g., "1", "100") and 'estimatedPortionUnit' (e.g., "serving", "g", "piece", "item", "bowl"). This is highly approximate; err on the side of generic units like "serving" or "item" if unsure.
4.  Extract any visible text from the image using OCR and provide it in 'ocrText'.
5.  Set 'recognitionSuccess' to true if you are reasonably confident in the 'identifiedFoodName' and 'identifiedIngredients' such that they can be used to pre-fill a food logging form. Otherwise, set it to false.
6.  If 'recognitionSuccess' is false or there's an issue, provide a brief 'errorMessage'.

Focus on providing practical values for 'identifiedFoodName', 'identifiedIngredients', 'estimatedPortionSize', and 'estimatedPortionUnit' that a user can then confirm or edit.
If the image is unclear, or not food-related, set 'recognitionSuccess' to false and explain in 'errorMessage'.

Example for a picture of a banana:
identifiedFoodName: "Banana"
identifiedIngredients: "Banana"
estimatedPortionSize: "1"
estimatedPortionUnit: "medium"
recognitionSuccess: true

Example for a picture of a can of "Campbell's Chicken Noodle Soup":
identifiedFoodName: "Campbell's Chicken Noodle Soup"
identifiedIngredients: "Chicken stock, enriched egg noodles, chicken meat, water, salt, modified food starch, chicken fat, monosodium glutamate, dehydrated chicken broth, flavoring, beta carotene, dehydrated garlic, dehydrated onions" (or a summarized version if OCR'd)
estimatedPortionSize: "1"
estimatedPortionUnit: "can"
ocrText: "Campbell's Chicken Noodle Soup..."
recognitionSuccess: true

Example for a supplement label showing "Vitamin D3 50,000 IU" and "Calcium 200mg":
identifiedFoodName: "Vitamin Supplement" (or product name if visible)
identifiedIngredients: "Vitamin D3 50,000 IU, Calcium 200mg, other ingredients..." (ensure exact OCR'd quantities are preserved)
estimatedPortionSize: "1"
estimatedPortionUnit: "capsule" (or as seen on label)
ocrText: "Supplement Facts Vitamin D3 50,000 IU Calcium 200mg..."
recognitionSuccess: true

Example for a blurry image:
recognitionSuccess: false
errorMessage: "Image is too blurry to identify food."
`,
});

const identifyFoodFromImageFlow = ai.defineFlow(
  {
    name: 'identifyFoodFromImageFlow',
    inputSchema: IdentifyFoodFromImageInputSchema,
    outputSchema: IdentifyFoodFromImageOutputSchema,
  },
  async (input) => {
    const { output } = await identifyFoodPrompt(input);
    if (!output) {
      return {
        recognitionSuccess: false,
        errorMessage: 'AI processing failed to return an output.',
      };
    }
    return output;
  }
);

