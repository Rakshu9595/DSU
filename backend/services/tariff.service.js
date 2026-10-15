import { Project } from '../models/Project.js';
import { UserSettings } from '../models/UserSettings.js';
import { DEFAULT_TARIFF_INR } from '../config/constants.js';

export class TariffService {
  /**
   * Resolves the effective electricity tariff for a project
   * Precedence: Device-level override -> Project-level tariff -> User settings default -> Global default (₹8/kWh)
   */
  async resolveEffectiveTariff(projectId, deviceTariffOverride = null, userId = null) {
    if (deviceTariffOverride && Number(deviceTariffOverride) > 0) {
      return {
        tariff: Number(deviceTariffOverride),
        source: 'device_override'
      };
    }

    if (projectId) {
      const project = await Project.findById(projectId);
      if (project && project.electricityTariff) {
        return {
          tariff: project.electricityTariff,
          source: 'project_configuration'
        };
      }
    }

    if (userId) {
      const settings = await UserSettings.findOne({ userId });
      if (settings && settings.defaultTariff) {
        return {
          tariff: settings.defaultTariff,
          source: 'user_settings'
        };
      }
    }

    return {
      tariff: DEFAULT_TARIFF_INR,
      source: 'global_default'
    };
  }
}

export const tariffService = new TariffService();
