import { z } from 'zod';
import { SAFETY_LIMITS } from '../config/constants.js';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(120),
  description: z.string().max(500).optional().default(''),
  roomType: z.enum([
    'living_room',
    'bedroom',
    'kitchen',
    'office',
    'server_room',
    'commercial',
    'other'
  ]).optional().default('living_room'),
  roomDimensions: z.object({
    length: z.number().min(1).max(50).optional().default(5.0),
    width: z.number().min(1).max(50).optional().default(4.0),
    height: z.number().min(1).max(15).optional().default(2.8),
    unit: z.string().optional().default('meters')
  }).optional().default({ length: 5.0, width: 4.0, height: 2.8, unit: 'meters' }),
  electricityTariff: z.number()
    .min(SAFETY_LIMITS.MIN_TARIFF, `Tariff must be at least ${SAFETY_LIMITS.MIN_TARIFF}`)
    .max(SAFETY_LIMITS.MAX_TARIFF, `Tariff cannot exceed ${SAFETY_LIMITS.MAX_TARIFF}`)
    .optional().default(8.0),
  electricityTariffPerKwh: z.number()
    .min(SAFETY_LIMITS.MIN_TARIFF, `Tariff must be at least ${SAFETY_LIMITS.MIN_TARIFF}`)
    .max(SAFETY_LIMITS.MAX_TARIFF, `Tariff cannot exceed ${SAFETY_LIMITS.MAX_TARIFF}`)
    .optional(),
  emissionFactor: z.number().min(0.01).max(5.0).optional().default(0.82)
});

export const updateProjectSchema = createProjectSchema.partial();
