import { z } from 'zod';
import { SAFETY_LIMITS } from '../config/constants.js';

export const createScenarioSchema = z.object({
  name: z.string().min(1, 'Scenario name is required').max(100),
  description: z.string().max(300).optional().default(''),
  deviceAdjustments: z.array(
    z.object({
      deviceId: z.string().min(1, 'Device ID is required'),
      proposedDailyHours: z
        .number()
        .min(SAFETY_LIMITS.MIN_DAILY_HOURS)
        .max(SAFETY_LIMITS.MAX_DAILY_HOURS)
        .optional(),
      proposedDaysPerMonth: z
        .number()
        .int()
        .min(SAFETY_LIMITS.MIN_DAYS_PER_MONTH)
        .max(SAFETY_LIMITS.MAX_DAYS_PER_MONTH)
        .optional(),
      proposedWatts: z
        .number()
        .min(SAFETY_LIMITS.MIN_POWER_WATTS)
        .max(SAFETY_LIMITS.MAX_POWER_WATTS)
        .optional()
    })
  ).min(1, 'At least one device adjustment is required')
});
