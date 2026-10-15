import { z } from 'zod';
import {
  POWER_RATING_SOURCES,
  DEVICE_CATEGORIES,
  FITTING_TYPES,
  SWITCH_STATES,
  SAFETY_LIMITS
} from '../config/constants.js';

export const updatePowerRatingSchema = z.object({
  powerRatingWatts: z
    .number({ invalid_type_error: 'Power rating must be a valid number' })
    .min(SAFETY_LIMITS.MIN_POWER_WATTS, `Power rating must be at least ${SAFETY_LIMITS.MIN_POWER_WATTS}W`)
    .max(SAFETY_LIMITS.MAX_POWER_WATTS, `Power rating cannot exceed ${SAFETY_LIMITS.MAX_POWER_WATTS}W`),
  powerRatingSource: z
    .enum([
      POWER_RATING_SOURCES.USER_ENTERED,
      POWER_RATING_SOURCES.MANUFACTURER_SPECIFICATION,
      POWER_RATING_SOURCES.REFERENCE_ESTIMATE,
      POWER_RATING_SOURCES.UNKNOWN
    ])
    .optional()
    .default(POWER_RATING_SOURCES.USER_ENTERED),
  powerRatingVerified: z.boolean().optional(),
  dailyUsageHours: z
    .number()
    .min(SAFETY_LIMITS.MIN_DAILY_HOURS, `Daily usage must be at least ${SAFETY_LIMITS.MIN_DAILY_HOURS} hours`)
    .max(SAFETY_LIMITS.MAX_DAILY_HOURS, `Daily usage cannot exceed ${SAFETY_LIMITS.MAX_DAILY_HOURS} hours`)
    .optional(),
  daysUsedPerMonth: z
    .number()
    .int()
    .min(SAFETY_LIMITS.MIN_DAYS_PER_MONTH)
    .max(SAFETY_LIMITS.MAX_DAYS_PER_MONTH)
    .optional(),
  electricityTariffPerKwh: z
    .number()
    .min(SAFETY_LIMITS.MIN_TARIFF)
    .max(SAFETY_LIMITS.MAX_TARIFF)
    .nullable()
    .optional(),
  manufacturer: z.string().max(80).optional(),
  modelNumber: z.string().max(80).optional(),
  notes: z.string().max(300).optional()
});

export const createManualDeviceSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  displayName: z.string().min(1, 'Device name is required').max(100),
  canonicalName: z.string().min(1, 'Type is required').max(60),
  category: z.enum(Object.values(DEVICE_CATEGORIES)).default(DEVICE_CATEGORIES.COOLING),
  isFitting: z.boolean().default(false),
  fittingType: z.enum(Object.values(FITTING_TYPES)).default(FITTING_TYPES.OTHER),
  fittingStatus: z.enum(Object.values(SWITCH_STATES)).default(SWITCH_STATES.UNKNOWN),
  powerRatingWatts: z
    .number()
    .min(0, 'Power rating cannot be negative')
    .max(SAFETY_LIMITS.MAX_POWER_WATTS)
    .default(75),
  powerRatingSource: z
    .enum(Object.values(POWER_RATING_SOURCES))
    .default(POWER_RATING_SOURCES.USER_ENTERED),
  dailyUsageHours: z
    .number()
    .min(0, 'Daily usage cannot be negative')
    .max(SAFETY_LIMITS.MAX_DAILY_HOURS)
    .default(4),
  daysUsedPerMonth: z
    .number()
    .int()
    .min(SAFETY_LIMITS.MIN_DAYS_PER_MONTH)
    .max(SAFETY_LIMITS.MAX_DAYS_PER_MONTH)
    .default(30),
  electricityTariffPerKwh: z.number().nullable().optional(),
  manufacturer: z.string().optional().default(''),
  modelNumber: z.string().optional().default(''),
  notes: z.string().optional().default('')
});

export const updateDeviceSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  canonicalName: z.string().min(1).max(60).optional(),
  category: z.enum(Object.values(DEVICE_CATEGORIES)).optional(),
  powerRatingWatts: z
    .number()
    .min(SAFETY_LIMITS.MIN_POWER_WATTS)
    .max(SAFETY_LIMITS.MAX_POWER_WATTS)
    .optional(),
  powerRatingSource: z.enum(Object.values(POWER_RATING_SOURCES)).optional(),
  powerRatingVerified: z.boolean().optional(),
  dailyUsageHours: z
    .number()
    .min(SAFETY_LIMITS.MIN_DAILY_HOURS)
    .max(SAFETY_LIMITS.MAX_DAILY_HOURS)
    .optional(),
  daysUsedPerMonth: z
    .number()
    .int()
    .min(SAFETY_LIMITS.MIN_DAYS_PER_MONTH)
    .max(SAFETY_LIMITS.MAX_DAYS_PER_MONTH)
    .optional(),
  electricityTariffPerKwh: z.number().nullable().optional(),
  manufacturer: z.string().optional(),
  modelNumber: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional()
});
