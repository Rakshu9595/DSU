import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../../models/User.js';
import { UserSettings } from '../../models/UserSettings.js';
import { Project } from '../../models/Project.js';
import { Device } from '../../models/Device.js';
import { DeviceObservation } from '../../models/DeviceObservation.js';
import { Prediction } from '../../models/Prediction.js';
import { DigitalTwinScene } from '../../models/DigitalTwinScene.js';
import { EnergyEstimate } from '../../models/EnergyEstimate.js';
import { EnergyScenario } from '../../models/EnergyScenario.js';
import { Recommendation } from '../../models/Recommendation.js';
import { Report } from '../../models/Report.js';
import { VideoAsset } from '../../models/VideoAsset.js';
import { AnalysisJob } from '../../models/AnalysisJob.js';
import { AuditLog } from '../../models/AuditLog.js';
import { POWER_RATING_SOURCES, DEVICE_CATEGORIES, FITTING_TYPES } from '../../config/constants.js';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create({
    binary: { version: '6.0.14' }
  });
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

describe('ODM Validation & Schema Integrity Test Suite', () => {
  let testUser;
  let testProject;

  // 1. User Model
  describe('User ODM', () => {
    it('creates a user, lowercases email, and hashes password', async () => {
      testUser = await User.create({
        name: 'ODM Tester',
        email: 'TEST.USER@VISIONTWIN.IO',
        password: 'SecurePassword123!'
      });

      expect(testUser.email).toBe('test.user@visiontwin.io');
      expect(testUser.password).not.toBe('SecurePassword123!');
      expect(testUser.password.startsWith('$2')).toBe(true);

      const isMatch = await testUser.comparePassword('SecurePassword123!');
      expect(isMatch).toBe(true);

      const isWrong = await testUser.comparePassword('WrongPassword');
      expect(isWrong).toBe(false);
    });

    it('rejects duplicate email insertion', async () => {
      await expect(
        User.create({
          name: 'Duplicate Tester',
          email: 'test.user@visiontwin.io',
          password: 'AnotherPassword123!'
        })
      ).rejects.toThrow();
    });

    it('rejects invalid email formats', async () => {
      await expect(
        User.create({
          name: 'Invalid Email User',
          email: 'not-an-email',
          password: 'Password123!'
        })
      ).rejects.toThrow();
    });
  });

  // 2. UserSettings Model
  describe('UserSettings ODM', () => {
    it('applies default tariff and emission factor', async () => {
      const settings = await UserSettings.create({
        userId: testUser._id
      });
      expect(settings.defaultTariff).toBe(8.0);
      expect(settings.defaultEmissionFactor).toBe(0.82);
      expect(settings.currencySymbol).toBe('₹');
    });
  });

  // 3. Project Model
  describe('Project ODM', () => {
    it('creates a project with defaults, bounds, and virtual tariff getter/setter', async () => {
      testProject = await Project.create({
        userId: testUser._id,
        name: 'Living Room Twin',
        roomType: 'living_room',
        roomDimensions: { length: 6.0, width: 4.5, height: 3.0 }
      });

      expect(testProject.name).toBe('Living Room Twin');
      expect(testProject.electricityTariff).toBe(8.0);
      expect(testProject.electricityTariffPerKwh).toBe(8.0); // virtual getter
      expect(testProject.emissionFactor).toBe(0.82);
      expect(testProject.status).toBe('draft');

      // Test virtual setter
      testProject.electricityTariffPerKwh = 10.5;
      expect(testProject.electricityTariff).toBe(10.5);
    });

    it('rejects invalid roomType enum', async () => {
      await expect(
        Project.create({
          userId: testUser._id,
          name: 'Invalid Room Project',
          roomType: 'outer_space'
        })
      ).rejects.toThrow();
    });
  });

  // 4. Device Model (Crucial Power Rating ODM Logic)
  describe('Device ODM', () => {
    it('creates an active appliance with user_entered power rating and inherits project tariff when null', async () => {
      const fan = await Device.create({
        projectId: testProject._id,
        userId: testUser._id,
        canonicalName: 'ceiling_fan',
        displayName: 'Master Bedroom Ceiling Fan',
        category: DEVICE_CATEGORIES.COOLING,
        powerRatingWatts: 75,
        powerRatingSource: POWER_RATING_SOURCES.USER_ENTERED,
        powerRatingVerified: true,
        dailyUsageHours: 8,
        daysUsedPerMonth: 30,
        electricityTariffPerKwh: null // Inherits from project
      });

      expect(fan.powerRatingWatts).toBe(75);
      expect(fan.powerRatingSource).toBe('user_entered');
      expect(fan.powerRatingVerified).toBe(true);
      expect(fan.isFitting).toBe(false);
      expect(fan.electricityTariffPerKwh).toBeNull();
    });

    it('creates a passive electrical fitting with 0 Watts without validation error', async () => {
      const sw = await Device.create({
        projectId: testProject._id,
        userId: testUser._id,
        canonicalName: 'switch',
        displayName: 'Gang 2 Light Switch',
        category: DEVICE_CATEGORIES.ELECTRICAL_FITTINGS,
        isFitting: true,
        fittingType: FITTING_TYPES.SWITCH,
        powerRatingWatts: 0,
        dailyUsageHours: 0,
        daysUsedPerMonth: 0
      });

      expect(sw.isFitting).toBe(true);
      expect(sw.powerRatingWatts).toBe(0);
      expect(sw.dailyUsageHours).toBe(0);
    });

    it('rejects negative power ratings', async () => {
      await expect(
        Device.create({
          projectId: testProject._id,
          userId: testUser._id,
          canonicalName: 'heater',
          displayName: 'Faulty Heater',
          powerRatingWatts: -100
        })
      ).rejects.toThrow();
    });

    it('rejects power ratings exceeding safety limit (25,000 W)', async () => {
      await expect(
        Device.create({
          projectId: testProject._id,
          userId: testUser._id,
          canonicalName: 'generator',
          displayName: 'Nuclear Reactor',
          powerRatingWatts: 99999
        })
      ).rejects.toThrow();
    });

    it('validates across all extended device categories (cooking, heating, cleaning, refrigeration)', async () => {
      const fridge = await Device.create({
        projectId: testProject._id,
        userId: testUser._id,
        canonicalName: 'refrigerator',
        displayName: 'Kitchen Inverter Fridge',
        category: DEVICE_CATEGORIES.REFRIGERATION,
        powerRatingWatts: 180
      });
      expect(fridge.category).toBe('refrigeration');

      const microwave = await Device.create({
        projectId: testProject._id,
        userId: testUser._id,
        canonicalName: 'microwave',
        displayName: 'Kitchen Microwave',
        category: DEVICE_CATEGORIES.COOKING,
        powerRatingWatts: 1200
      });
      expect(microwave.category).toBe('cooking');
    });
  });

  // 5. DigitalTwinScene Model
  describe('DigitalTwinScene ODM', () => {
    it('creates and updates a 3D scene with subdocument objects with and without names', async () => {
      const scene = await DigitalTwinScene.create({
        projectId: testProject._id,
        userId: testUser._id,
        roomDimensions: { length: 6.0, width: 4.5, height: 3.0 },
        objects: [
          {
            name: 'Ceiling Fan',
            canonicalName: 'ceiling_fan',
            position: { x: 0, y: 2.8, z: 0 },
            powerRatingWatts: 75,
            energyTier: 'low'
          },
          {
            // Omitted name should receive default 'Appliance'
            canonicalName: 'television',
            position: { x: 2, y: 1.2, z: -2 },
            powerRatingWatts: 110,
            energyTier: 'low'
          }
        ]
      });

      expect(scene.objects.length).toBe(2);
      expect(scene.objects[0].name).toBe('Ceiling Fan');
      expect(scene.objects[1].name).toBe('Appliance');
    });

    it('enforces unique scene per project', async () => {
      await expect(
        DigitalTwinScene.create({
          projectId: testProject._id,
          userId: testUser._id
        })
      ).rejects.toThrow();
    });
  });

  // 6. EnergyEstimate Model
  describe('EnergyEstimate ODM', () => {
    it('persists energy calculations with breakdown subdocuments', async () => {
      const estimate = await EnergyEstimate.create({
        projectId: testProject._id,
        totalAppliancesCount: 2,
        totalDailyEnergyKwh: 3.2,
        totalMonthlyEnergyKwh: 96.0,
        totalMonthlyCost: 768.0,
        totalCarbonEmissionsKg: 78.72,
        tariffApplied: 8.0,
        deviceBreakdown: [
          {
            name: 'Ceiling Fan',
            category: 'cooling',
            powerRatingWatts: 75,
            dailyUsageHours: 8,
            daysUsedPerMonth: 30,
            dailyEnergyKwh: 0.6,
            monthlyEnergyKwh: 18.0,
            monthlyCost: 144.0,
            percentOfTotalEnergy: 18.75
          }
        ]
      });

      expect(estimate.totalMonthlyCost).toBe(768.0);
      expect(estimate.deviceBreakdown.length).toBe(1);
      expect(estimate.deviceBreakdown[0].monthlyCost).toBe(144.0);
    });
  });

  // 7. EnergyScenario Model
  describe('EnergyScenario ODM', () => {
    it('persists scenario comparisons with baseline and potential savings', async () => {
      const dev = await Device.findOne({ projectId: testProject._id, isFitting: false });

      const scenario = await EnergyScenario.create({
        projectId: testProject._id,
        userId: testUser._id,
        name: 'Eco 6-Hour Schedule',
        baselineMetrics: {
          monthlyEnergyKwh: 96.0,
          monthlyCost: 768.0,
          carbonEmissionsKg: 78.72
        },
        scenarioMetrics: {
          monthlyEnergyKwh: 72.0,
          monthlyCost: 576.0,
          carbonEmissionsKg: 59.04
        },
        potentialSavings: {
          energySavingsKwh: 24.0,
          costSavings: 192.0,
          percentSavings: 25.0,
          carbonSavingsKg: 19.68
        },
        deviceAdjustments: [
          {
            deviceId: dev._id,
            deviceName: dev.displayName,
            powerRatingWatts: dev.powerRatingWatts,
            baselineDailyHours: 8,
            proposedDailyHours: 6,
            baselineDaysPerMonth: 30,
            proposedDaysPerMonth: 30,
            baselineMonthlyKwh: 18.0,
            proposedMonthlyKwh: 13.5,
            monthlySavingsKwh: 4.5,
            monthlySavingsCost: 36.0
          }
        ]
      });

      expect(scenario.name).toBe('Eco 6-Hour Schedule');
      expect(scenario.potentialSavings.costSavings).toBe(192.0);
      expect(scenario.deviceAdjustments[0].monthlySavingsCost).toBe(36.0);
    });
  });

  // 8. Recommendation Model
  describe('Recommendation ODM', () => {
    it('creates grounded recommendations with priority enum and actionable steps', async () => {
      const rec = await Recommendation.create({
        projectId: testProject._id,
        userId: testUser._id,
        title: 'Optimize Ceiling Fan Sleep Schedule',
        description: 'Using fan sleep timers during cooler night hours reduces consumption.',
        category: 'operating_hours',
        priority: 'medium',
        estimatedPotentialSavingsKwh: 4.5,
        estimatedCostSavings: 36.0,
        actionableSteps: ['Turn off fan 2 hours before dawn', 'Ensure blade balance'],
        supportingEvidence: 'Calculated from 75W rating and 8h baseline.'
      });

      expect(rec.priority).toBe('medium');
      expect(rec.actionableSteps.length).toBe(2);
      expect(rec.estimatedCostSavings).toBe(36.0);
    });

    it('rejects invalid priority enum', async () => {
      await expect(
        Recommendation.create({
          projectId: testProject._id,
          userId: testUser._id,
          title: 'Invalid Priority',
          description: 'Test',
          priority: 'critical_emergency',
          supportingEvidence: 'Test'
        })
      ).rejects.toThrow();
    });
  });

  // 9. Report Model
  describe('Report ODM', () => {
    it('creates report record with virtual fileSizeBytes support', async () => {
      const rep = await Report.create({
        projectId: testProject._id,
        userId: testUser._id,
        reportType: 'pdf',
        title: 'Energy Audit Report',
        filename: 'audit-test.pdf',
        filePath: '/tmp/audit-test.pdf',
        fileSize: 4096
      });

      expect(rep.fileSize).toBe(4096);
      expect(rep.fileSizeBytes).toBe(4096); // virtual getter
      expect(rep.reportType).toBe('pdf');
    });

    it('rejects invalid reportType', async () => {
      await expect(
        Report.create({
          projectId: testProject._id,
          userId: testUser._id,
          reportType: 'docx', // only 'pdf' or 'csv' allowed
          title: 'Invalid Format',
          filename: 'test.docx',
          filePath: '/tmp/test.docx'
        })
      ).rejects.toThrow();
    });
  });

  // 10. AuditLog Model
  describe('AuditLog ODM', () => {
    it('stores audit events with polymorphic details', async () => {
      const log = await AuditLog.create({
        userId: testUser._id,
        projectId: testProject._id,
        action: 'UPDATE_POWER_RATING',
        resource: 'Device',
        resourceId: 'test-device-123',
        details: { oldWatts: 35, newWatts: 75, source: 'user_entered' }
      });

      expect(log.action).toBe('UPDATE_POWER_RATING');
      expect(log.details.newWatts).toBe(75);
    });
  });
});
