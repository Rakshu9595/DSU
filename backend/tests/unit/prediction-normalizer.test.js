import { describe, it, expect } from 'vitest';
import { predictionNormalizer } from '../../services/prediction-normalizer.service.js';
import { DEVICE_CATEGORIES, FITTING_TYPES, POWER_RATING_SOURCES, SWITCH_STATES } from '../../config/constants.js';

describe('Prediction Normalizer Service', () => {
  it('normalizes label variations to canonical names', () => {
    expect(predictionNormalizer.normalizeLabel('Ceiling Fan')).toBe('ceiling_fan');
    expect(predictionNormalizer.normalizeLabel('air-conditioner')).toBe('air_conditioner');
    expect(predictionNormalizer.normalizeLabel('fridge')).toBe('refrigerator');
    expect(predictionNormalizer.normalizeLabel('TV')).toBe('television');
  });

  it('correctly classifies electrical fittings separate from energy-consuming appliances', () => {
    const switchClass = predictionNormalizer.classifyDetectionType('switch');
    expect(switchClass.isFitting).toBe(true);
    expect(switchClass.fittingType).toBe(FITTING_TYPES.SWITCH);
    expect(switchClass.category).toBe(DEVICE_CATEGORIES.ELECTRICAL_FITTINGS);

    const socketClass = predictionNormalizer.classifyDetectionType('socket');
    expect(socketClass.isFitting).toBe(true);
    expect(socketClass.fittingType).toBe(FITTING_TYPES.SOCKET);

    const fanClass = predictionNormalizer.classifyDetectionType('ceiling_fan');
    expect(fanClass.isFitting).toBe(false);
    expect(fanClass.category).toBe(DEVICE_CATEGORIES.COOLING);
  });

  it('normalizes model summary into separate appliance and fitting records with reference ratings and unknown switch states', () => {
    const mockSummary = {
      appliances_and_devices: [
        { class_name: 'ceiling fan', confidence: 0.92, bbox_xyxy: [100, 100, 300, 300], timestamp_seconds: 1.0 }
      ],
      switches: [
        { class_name: 'switch', confidence: 0.85, bbox_xyxy: [50, 50, 80, 80], timestamp_seconds: 1.0 }
      ],
      sockets: [
        { class_name: 'socket', confidence: 0.88, bbox_xyxy: [90, 90, 120, 120], timestamp_seconds: 1.0 }
      ]
    };

    const normalized = predictionNormalizer.normalizeDetections(
      mockSummary,
      'proj_123',
      'user_123',
      'job_123'
    );

    expect(normalized).toHaveLength(3);

    const fan = normalized.find((d) => d.canonicalName === 'ceiling_fan');
    expect(fan).toBeDefined();
    expect(fan.isFitting).toBe(false);
    expect(fan.powerRatingWatts).toBe(75);
    expect(fan.powerRatingSource).toBe(POWER_RATING_SOURCES.REFERENCE_ESTIMATE);
    expect(fan.powerRatingVerified).toBe(false);

    const sw = normalized.find((d) => d.canonicalName === 'switch');
    expect(sw).toBeDefined();
    expect(sw.isFitting).toBe(true);
    expect(sw.powerRatingWatts).toBe(0);
    // Switch state must remain UNKNOWN unless proven
    expect(sw.fittingStatus).toBe(SWITCH_STATES.UNKNOWN);
  });
});
