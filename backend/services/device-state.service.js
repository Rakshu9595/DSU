import { SWITCH_STATES } from '../config/constants.js';

export class DeviceStateService {
  /**
   * Evaluates switch or socket state strictly without assuming energized circuit or running load
   */
  evaluateFittingState(rawClassName, modelConfidence) {
    const normalized = String(rawClassName || '').toLowerCase();

    // Only conclude ON or OFF if class name explicitly contains state from a trained classifier
    if (normalized.includes('_on') || normalized.includes('state_on')) {
      return {
        state: SWITCH_STATES.ON,
        isVerified: modelConfidence > 0.8,
        disclaimer: 'Switch rocker orientation detected as ON; does not prove current draw.'
      };
    }

    if (normalized.includes('_off') || normalized.includes('state_off')) {
      return {
        state: SWITCH_STATES.OFF,
        isVerified: modelConfidence > 0.8,
        disclaimer: 'Switch rocker orientation detected as OFF.'
      };
    }

    // Default: Must remain UNKNOWN
    return {
      state: SWITCH_STATES.UNKNOWN,
      isVerified: false,
      disclaimer: 'State not verified. Object detection confirms presence of fitting only.'
    };
  }
}

export const deviceStateService = new DeviceStateService();
