
import { config } from 'dotenv';
config();

import '@/ai/flows/food-similarity.ts';
import '@/ai/flows/fodmap-detection.ts';
import '@/ai/flows/symptom-correlation-flow.ts';
import '@/ai/flows/process-meal-description-flow.ts';
import '@/ai/flows/identify-food-from-image-flow.ts';
import '@/ai/flows/process-feedback-flow.ts';
import '@/ai/flows/personalized-dietitian-flow.ts'; // Added new dietitian flow
import '@/ai/flows/user-recommendations.ts'; // Keep for now if used by other parts or for simple tips
import '@/ai/flows/daily-insights.ts'; // Keep for now, might be used for daily summary features
