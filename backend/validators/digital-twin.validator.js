import { z } from 'zod';

export const updateSceneSchema = z.object({
  roomDimensions: z.object({
    length: z.number().min(1).max(50),
    width: z.number().min(1).max(50),
    height: z.number().min(1).max(15)
  }).optional(),
  roomTheme: z.object({
    wallColor: z.string().optional(),
    floorTexture: z.string().optional(),
    ambientIntensity: z.number().min(0).max(2).optional()
  }).optional(),
  objects: z.array(
    z.object({
      deviceId: z.string().nullable().optional(),
      name: z.string().optional().default('Appliance'),
      canonicalName: z.string().optional(),
      category: z.string().optional(),
      isFitting: z.boolean().optional(),
      position: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number()
      }),
      rotation: z.object({
        x: z.number().optional(),
        y: z.number().optional(),
        z: z.number().optional()
      }).optional(),
      scale: z.object({
        x: z.number().optional(),
        y: z.number().optional(),
        z: z.number().optional()
      }).optional(),
      powerRatingWatts: z.number().optional(),
      energyTier: z.enum(['low', 'medium', 'high', 'fitting']).optional()
    })
  ).optional()
});
