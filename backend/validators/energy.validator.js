import { z } from 'zod';
import { SAFETY_LIMITS } from '../config/constants.js';

export const updateTariffSchema = z.object({
  electricityTariff: z
    .number()
    .min(SAFETY_LIMITS.MIN_TARIFF, `Tariff must be at least ${SAFETY_LIMITS.MIN_TARIFF}`)
    .max(SAFETY_LIMITS.MAX_TARIFF, `Tariff cannot exceed ${SAFETY_LIMITS.MAX_TARIFF}`),
  emissionFactor: z.number().min(0.01).max(5.0).optional()
});
