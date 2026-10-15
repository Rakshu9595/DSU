import { z } from 'zod';

export const correctLabelSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  canonicalName: z.string().min(1).max(60).optional(),
  category: z.string().optional(),
  isFitting: z.boolean().optional()
});
