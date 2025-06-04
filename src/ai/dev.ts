
import { config } from 'dotenv';
config();

import '@/ai/flows/food-similarity.ts';
import '@/ai/flows/fodmap-detection.ts';
import '@/ai/flows/symptom-correlation-flow.ts';
import '@/ai/flows/process-meal-description-flow.ts';
import '@/ai/flows/identify-food-from-image-flow.ts'; // Added new flow for image identification
