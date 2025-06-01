import { config } from 'dotenv';
config();

import '@/ai/flows/food-similarity.ts';
import '@/ai/flows/fodmap-detection.ts';
import '@/ai/flows/symptom-correlation-flow.ts'; // Changed from daily-insights
