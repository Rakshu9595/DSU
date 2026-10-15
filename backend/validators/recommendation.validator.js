import { z } from 'zod';

export const updateRecommendationSchema = z.object({
  isApplied: z.boolean().optional(),
  isDismissed: z.boolean().optional()
});
