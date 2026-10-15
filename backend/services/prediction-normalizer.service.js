import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  POWER_RATING_SOURCES,
  DEVICE_CATEGORIES,
  FITTING_TYPES,
  SWITCH_STATES
} from '../config/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load shared references
const sharedDir = path.resolve(__dirname, '../../shared');
const deviceLabels = JSON.parse(
  fs.readFileSync(path.join(sharedDir, 'device-labels.json'), 'utf-8')
);
const powerRatings = JSON.parse(
  fs.readFileSync(path.join(sharedDir, 'power-ratings.json'), 'utf-8')
);

export class PredictionNormalizerService {
  /**
   * Normalizes a raw detection label to canonical identifier
   */
  normalizeLabel(rawLabel) {
    if (!rawLabel) return 'generic';
    const clean = String(rawLabel)
      .trim()
      .toLowerCase()
      .replace(/[-_]+/g, ' ');
    return deviceLabels.canonicalMap[clean] || clean.replace(/\s+/g, '_');
  }

  /**
   * Determines if a detection is an electrical fitting (switch/socket) or an appliance
   */
  classifyDetectionType(canonicalName) {
    const fittings = deviceLabels.categories.electrical_fittings.labels;
    const isFitting = fittings.some((f) => canonicalName.includes(f));

    if (isFitting) {
      const fittingType = canonicalName.includes('socket') || canonicalName.includes('outlet')
        ? FITTING_TYPES.SOCKET
        : canonicalName.includes('switch')
        ? FITTING_TYPES.SWITCH
        : FITTING_TYPES.OTHER;

      return {
        isFitting: true,
        category: DEVICE_CATEGORIES.ELECTRICAL_FITTINGS,
        fittingType
      };
    }

    // Match appliance category
    let matchedCategory = DEVICE_CATEGORIES.COOLING;
    for (const [catKey, catVal] of Object.entries(deviceLabels.categories)) {
      if (catKey === 'electrical_fittings') continue;
      if (catVal.labels.includes(canonicalName)) {
        matchedCategory = catKey;
        break;
      }
    }

    return {
      isFitting: false,
      category: matchedCategory,
      fittingType: FITTING_TYPES.OTHER
    };
  }

  /**
   * Resolves reference power rating baseline (used only as initial reference estimate)
   */
  getReferenceRating(canonicalName) {
    const ref = powerRatings.referenceRatings[canonicalName] || powerRatings.referenceRatings.generic;
    return {
      watts: ref.defaultWatts,
      dailyHours: ref.defaultDailyHours,
      daysUsedPerMonth: ref.defaultDaysPerMonth,
      isVariable: !!ref.isVariable,
      notes: ref.notes || ''
    };
  }

  /**
   * Normalizes model detections into standardized VisionTwin device entities
   */
  normalizeDetections(rawSummary, projectId, userId, jobId) {
    const devices = [];

    // Process energy-consuming appliances
    const rawAppliances = rawSummary.appliances_and_devices || [];
    rawAppliances.forEach((item, index) => {
      const canonicalName = this.normalizeLabel(item.class_name);
      const classification = this.classifyDetectionType(canonicalName);
      const refRating = this.getReferenceRating(canonicalName);

      // Nicely format display name
      const formattedTitle = canonicalName
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      const displayName = `${formattedTitle} #${index + 1}`;

      devices.push({
        projectId,
        userId,
        jobId,
        canonicalName,
        displayName,
        category: classification.category,
        detectionConfidence: Number((item.confidence || 0.85).toFixed(3)),
        bbox: item.bbox_xyxy || [],
        firstSeenTimestamp: item.timestamp_seconds || 0,
        isFitting: false,
        fittingType: FITTING_TYPES.OTHER,
        fittingStatus: SWITCH_STATES.UNKNOWN,
        powerRatingWatts: refRating.watts,
        powerRatingSource: POWER_RATING_SOURCES.REFERENCE_ESTIMATE,
        powerRatingVerified: false,
        dailyUsageHours: refRating.dailyHours,
        daysUsedPerMonth: refRating.daysUsedPerMonth,
        isVariablePower: refRating.isVariable,
        notes: refRating.notes,
        position3D: {
          x: ((index % 4) - 1.5) * 1.2,
          y: canonicalName === 'ceiling_fan' ? 2.4 : 0.8,
          z: (Math.floor(index / 4) - 0.5) * 1.5,
          rotationY: 0
        }
      });
    });

    // Process switches (fittings)
    const rawSwitches = rawSummary.switches || [];
    rawSwitches.forEach((item, index) => {
      devices.push({
        projectId,
        userId,
        jobId,
        canonicalName: 'switch',
        displayName: `Wall Switch #${index + 1}`,
        category: DEVICE_CATEGORIES.ELECTRICAL_FITTINGS,
        detectionConfidence: Number((item.confidence || 0.75).toFixed(3)),
        bbox: item.bbox_xyxy || [],
        firstSeenTimestamp: item.timestamp_seconds || 0,
        isFitting: true,
        fittingType: FITTING_TYPES.SWITCH,
        // Status remains unknown unless model explicitly detected state
        fittingStatus: SWITCH_STATES.UNKNOWN,
        powerRatingWatts: 0,
        powerRatingSource: POWER_RATING_SOURCES.UNKNOWN,
        powerRatingVerified: false,
        dailyUsageHours: 0,
        daysUsedPerMonth: 0,
        isVariablePower: false,
        notes: 'Electrical wall switch (passive circuit controller).',
        position3D: {
          x: -2.3,
          y: 1.2,
          z: (index - 0.5) * 0.8,
          rotationY: Math.PI / 2
        }
      });
    });

    // Process sockets (fittings)
    const rawSockets = rawSummary.sockets || [];
    rawSockets.forEach((item, index) => {
      devices.push({
        projectId,
        userId,
        jobId,
        canonicalName: 'socket',
        displayName: `Power Socket #${index + 1}`,
        category: DEVICE_CATEGORIES.ELECTRICAL_FITTINGS,
        detectionConfidence: Number((item.confidence || 0.75).toFixed(3)),
        bbox: item.bbox_xyxy || [],
        firstSeenTimestamp: item.timestamp_seconds || 0,
        isFitting: true,
        fittingType: FITTING_TYPES.SOCKET,
        fittingStatus: SWITCH_STATES.UNKNOWN,
        powerRatingWatts: 0,
        powerRatingSource: POWER_RATING_SOURCES.UNKNOWN,
        powerRatingVerified: false,
        dailyUsageHours: 0,
        daysUsedPerMonth: 0,
        isVariablePower: false,
        notes: 'Electrical wall socket / plug point.',
        position3D: {
          x: 2.3,
          y: 0.4,
          z: (index - 0.5) * 0.8,
          rotationY: -Math.PI / 2
        }
      });
    });

    return devices;
  }
}

export const predictionNormalizer = new PredictionNormalizerService();
