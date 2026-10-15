import { Device } from '../models/Device.js';
import { Project } from '../models/Project.js';
import { DigitalTwinScene } from '../models/DigitalTwinScene.js';
import { energyEstimationService } from './energy-estimation.service.js';
import { predictionNormalizer } from './prediction-normalizer.service.js';
import { POWER_RATING_SOURCES, SAFETY_LIMITS } from '../config/constants.js';
import { AppError } from '../utils/app-error.js';
import { computeDeviceEnergyMetrics } from '../utils/energy-math.js';

export class DeviceService {
  /**
   * Updates an appliance's electrical power rating and recalculates project energy
   */
  async updatePowerRating(deviceId, ratingData, userId) {
    const device = await Device.findById(deviceId);
    if (!device) {
      throw new AppError('Device not found', 404);
    }

    // Verify project exists
    const project = await Project.findById(device.projectId);
    if (!project) {
      throw new AppError('Associated project not found', 404);
    }

    // Validate power rating
    const watts = Number(ratingData.powerRatingWatts);
    if (isNaN(watts) || !isFinite(watts)) {
      throw new AppError('Power rating must be a finite positive number', 400);
    }
    if (watts < SAFETY_LIMITS.MIN_POWER_WATTS || watts > SAFETY_LIMITS.MAX_POWER_WATTS) {
      throw new AppError(
        `Power rating must be between ${SAFETY_LIMITS.MIN_POWER_WATTS}W and ${SAFETY_LIMITS.MAX_POWER_WATTS}W`,
        400
      );
    }

    // Apply rating updates
    device.powerRatingWatts = watts;
    device.powerRatingSource = ratingData.powerRatingSource || POWER_RATING_SOURCES.USER_ENTERED;
    device.powerRatingVerified = ratingData.powerRatingVerified !== undefined
      ? ratingData.powerRatingVerified
      : true;
    device.ratingUpdatedAt = new Date();
    device.ratingUpdatedBy = userId;

    if (ratingData.dailyUsageHours !== undefined) {
      device.dailyUsageHours = Number(ratingData.dailyUsageHours);
    }
    if (ratingData.daysUsedPerMonth !== undefined) {
      device.daysUsedPerMonth = Number(ratingData.daysUsedPerMonth);
    }
    if (ratingData.electricityTariffPerKwh !== undefined) {
      device.electricityTariffPerKwh = ratingData.electricityTariffPerKwh;
    }
    if (ratingData.manufacturer !== undefined) {
      device.manufacturer = ratingData.manufacturer;
    }
    if (ratingData.modelNumber !== undefined) {
      device.modelNumber = ratingData.modelNumber;
    }
    if (ratingData.notes !== undefined) {
      device.notes = ratingData.notes;
    }

    await device.save();

    // Recalculate project energy estimates
    const updatedEstimate = await energyEstimationService.recalculateProjectEnergy(device.projectId);

    // Sync Digital Twin scene device power and energy tier
    const scene = await DigitalTwinScene.findOne({ projectId: device.projectId });
    if (scene) {
      const sceneObj = scene.objects.find((o) => o.deviceId?.toString() === deviceId.toString());
      if (sceneObj) {
        sceneObj.powerRatingWatts = watts;
        sceneObj.energyTier = watts > 1000 ? 'high' : watts > 200 ? 'medium' : 'low';
        await scene.save();
      }
    }

    // Compute device specific metrics
    const deviceMetrics = computeDeviceEnergyMetrics(
      device,
      project.electricityTariff,
      project.emissionFactor
    );

    return {
      device,
      deviceMetrics,
      energySummary: updatedEstimate
    };
  }

  /**
   * Resets device power rating to initial reference estimate
   */
  async resetPowerRating(deviceId, userId) {
    const device = await Device.findById(deviceId);
    if (!device) {
      throw new AppError('Device not found', 404);
    }

    const ref = predictionNormalizer.getReferenceRating(device.canonicalName);
    device.powerRatingWatts = ref.watts;
    device.powerRatingSource = POWER_RATING_SOURCES.REFERENCE_ESTIMATE;
    device.powerRatingVerified = false;
    device.ratingUpdatedAt = new Date();
    device.ratingUpdatedBy = userId;
    device.dailyUsageHours = ref.dailyHours;
    device.daysUsedPerMonth = ref.daysUsedPerMonth;

    await device.save();

    const updatedEstimate = await energyEstimationService.recalculateProjectEnergy(device.projectId);

    return {
      device,
      energySummary: updatedEstimate
    };
  }

  /**
   * Retrieves devices with search, category filtering, and fitting flags
   */
  async getDevices(projectId, query = {}) {
    const filter = { projectId, isActive: true };

    if (query.category) {
      filter.category = query.category;
    }
    if (query.isFitting !== undefined) {
      filter.isFitting = query.isFitting === 'true' || query.isFitting === true;
    }
    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [{ displayName: regex }, { canonicalName: regex }, { manufacturer: regex }];
    }

    return Device.find(filter).sort({ isFitting: 1, createdAt: 1 });
  }

  /**
   * Retrieves a single device by ID
   */
  async getDeviceById(deviceId) {
    const device = await Device.findById(deviceId);
    if (!device) {
      throw new AppError('Device not found', 404);
    }
    return device;
  }

  /**
   * Creates a manual device
   */
  async createManualDevice(data, userId) {
    const project = await Project.findById(data.projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const classification = predictionNormalizer.classifyDetectionType(data.canonicalName);

    const device = await Device.create({
      ...data,
      userId,
      isFitting: classification.isFitting,
      fittingType: classification.fittingType,
      category: data.category || classification.category,
      powerRatingSource: POWER_RATING_SOURCES.USER_ENTERED,
      powerRatingVerified: true,
      ratingUpdatedAt: new Date(),
      ratingUpdatedBy: userId
    });

    // Update Project and Scene
    await energyEstimationService.recalculateProjectEnergy(data.projectId);

    return device;
  }

  /**
   * Updates general device attributes
   */
  async updateDevice(deviceId, data, userId) {
    const device = await Device.findById(deviceId);
    if (!device) {
      throw new AppError('Device not found', 404);
    }

    const allowedFields = [
      'displayName',
      'category',
      'powerRatingWatts',
      'powerRatingSource',
      'powerRatingVerified',
      'dailyUsageHours',
      'daysUsedPerMonth',
      'electricityTariffPerKwh',
      'manufacturer',
      'modelNumber',
      'notes',
      'position3D',
      'fittingStatus'
    ];

    let powerChanged = false;
    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        if (field === 'powerRatingWatts' || field === 'dailyUsageHours' || field === 'daysUsedPerMonth') {
          powerChanged = true;
        }
        device[field] = data[field];
      }
    });

    if (powerChanged) {
      device.ratingUpdatedAt = new Date();
      device.ratingUpdatedBy = userId;
    }

    await device.save();

    if (powerChanged) {
      await energyEstimationService.recalculateProjectEnergy(device.projectId);
    }

    return device;
  }

  /**
   * Soft deletes / removes a false detection
   */
  async deleteDevice(deviceId) {
    const device = await Device.findById(deviceId);
    if (!device) {
      throw new AppError('Device not found', 404);
    }

    device.isActive = false;
    await device.save();

    // Recalculate energy
    await energyEstimationService.recalculateProjectEnergy(device.projectId);

    // Remove from 3D scene if present
    const scene = await DigitalTwinScene.findOne({ projectId: device.projectId });
    if (scene) {
      scene.objects = scene.objects.filter((o) => o.deviceId?.toString() !== deviceId.toString());
      await scene.save();
    }

    return { message: 'Device removed successfully' };
  }
}

export const deviceService = new DeviceService();
