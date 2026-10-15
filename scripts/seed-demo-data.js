import { connectDatabase, disconnectDatabase } from '../backend/config/database.js';
import { User } from '../backend/models/User.js';
import { UserSettings } from '../backend/models/UserSettings.js';
import { Project } from '../backend/models/Project.js';
import { Device } from '../backend/models/Device.js';
import { DigitalTwinScene } from '../backend/models/DigitalTwinScene.js';
import { energyEstimationService } from '../backend/services/energy-estimation.service.js';
import { scenarioSimulationService } from '../backend/services/scenario-simulation.service.js';
import { recommendationService } from '../backend/services/recommendation.service.js';
import { POWER_RATING_SOURCES, DEVICE_CATEGORIES, FITTING_TYPES, SWITCH_STATES } from '../backend/config/constants.js';

async function seed() {
  console.log('--- Seeding VisionTwin Demo Data ---');
  await connectDatabase();

  // 1. Create Demo User
  let user = await User.findOne({ email: 'demo@visiontwin.io' });
  if (!user) {
    user = await User.create({
      name: 'Piyush Demo',
      email: 'demo@visiontwin.io',
      password: 'Password123!',
      role: 'user'
    });
    await UserSettings.create({ userId: user._id });
    console.log('✅ Created demo user: demo@visiontwin.io / Password123!');
  } else {
    console.log('ℹ️ Demo user exists: demo@visiontwin.io');
  }

  // 2. Create Demo Project
  let project = await Project.findOne({ userId: user._id, name: 'EcoSmart Living Suite' });
  if (project) {
    await Device.deleteMany({ projectId: project._id });
    await DigitalTwinScene.deleteMany({ projectId: project._id });
  } else {
    project = await Project.create({
      userId: user._id,
      name: 'EcoSmart Living Suite',
      description: 'Living room energy optimization digital twin powered by computer vision detection.',
      roomType: 'living_room',
      roomDimensions: {
        length: 5.5,
        width: 4.5,
        height: 2.9,
        unit: 'meters'
      },
      electricityTariff: 8.0,
      emissionFactor: 0.82,
      status: 'optimized'
    });
    console.log('✅ Created project: EcoSmart Living Suite');
  }

  // 3. Create Detected Appliances with user-editable power ratings
  const devicesToCreate = [
    {
      projectId: project._id,
      userId: user._id,
      canonicalName: 'ceiling_fan',
      displayName: 'Ceiling Fan (Main)',
      category: DEVICE_CATEGORIES.COOLING,
      detectionConfidence: 0.94,
      bbox: [120, 45, 380, 220],
      isFitting: false,
      powerRatingWatts: 75,
      powerRatingSource: POWER_RATING_SOURCES.USER_ENTERED,
      powerRatingVerified: true,
      dailyUsageHours: 8,
      daysUsedPerMonth: 30,
      manufacturer: 'Crompton',
      modelNumber: 'Aura 1200mm',
      notes: 'User verified rating from appliance nameplate label.',
      position3D: { x: 0, y: 2.6, z: 0, rotationY: 0 }
    },
    {
      projectId: project._id,
      userId: user._id,
      canonicalName: 'air_conditioner',
      displayName: 'Inverter Split AC (1.5 Ton)',
      category: DEVICE_CATEGORIES.COOLING,
      detectionConfidence: 0.91,
      bbox: [480, 60, 720, 210],
      isFitting: false,
      powerRatingWatts: 1450,
      powerRatingSource: POWER_RATING_SOURCES.USER_ENTERED,
      powerRatingVerified: true,
      dailyUsageHours: 6,
      daysUsedPerMonth: 30,
      isVariablePower: true,
      manufacturer: 'Daikin',
      modelNumber: 'FTKM50',
      notes: 'Rated input power 1450W. Inverter compressor modulates between 350W and 1600W.',
      position3D: { x: 0, y: 2.3, z: -2.1, rotationY: 0 }
    },
    {
      projectId: project._id,
      userId: user._id,
      canonicalName: 'television',
      displayName: 'Smart LED TV 55"',
      category: DEVICE_CATEGORIES.ENTERTAINMENT,
      detectionConfidence: 0.96,
      bbox: [220, 150, 480, 340],
      isFitting: false,
      powerRatingWatts: 110,
      powerRatingSource: POWER_RATING_SOURCES.USER_ENTERED,
      powerRatingVerified: true,
      dailyUsageHours: 5,
      daysUsedPerMonth: 30,
      manufacturer: 'Samsung',
      modelNumber: 'Crystal 4K 55',
      notes: 'Active draw ~105W, standby ~0.5W.',
      position3D: { x: 0, y: 1.2, z: 2.1, rotationY: Math.PI }
    },
    {
      projectId: project._id,
      userId: user._id,
      canonicalName: 'laptop',
      displayName: 'Work Laptop & Dock',
      category: DEVICE_CATEGORIES.COMPUTING,
      detectionConfidence: 0.88,
      bbox: [160, 320, 310, 440],
      isFitting: false,
      powerRatingWatts: 65,
      powerRatingSource: POWER_RATING_SOURCES.USER_ENTERED,
      powerRatingVerified: true,
      dailyUsageHours: 8,
      daysUsedPerMonth: 26,
      manufacturer: 'Dell',
      modelNumber: 'Latitude 7420',
      notes: 'Type-C power delivery adapter rated 65W.',
      position3D: { x: 1.8, y: 0.8, z: 0.5, rotationY: -Math.PI / 4 }
    },
    {
      projectId: project._id,
      userId: user._id,
      canonicalName: 'lamp',
      displayName: 'Desk Lamp (LED)',
      category: DEVICE_CATEGORIES.LIGHTING,
      detectionConfidence: 0.89,
      bbox: [320, 310, 380, 410],
      isFitting: false,
      powerRatingWatts: 12,
      powerRatingSource: POWER_RATING_SOURCES.REFERENCE_ESTIMATE,
      powerRatingVerified: false,
      dailyUsageHours: 6,
      daysUsedPerMonth: 30,
      manufacturer: 'Philips',
      notes: 'Warm white LED desk lamp.',
      position3D: { x: 2.1, y: 0.85, z: 0.3, rotationY: 0 }
    },
    {
      projectId: project._id,
      userId: user._id,
      canonicalName: 'refrigerator',
      displayName: 'Double Door Refrigerator',
      category: DEVICE_CATEGORIES.KITCHEN,
      detectionConfidence: 0.93,
      bbox: [600, 200, 800, 520],
      isFitting: false,
      powerRatingWatts: 160,
      powerRatingSource: POWER_RATING_SOURCES.REFERENCE_ESTIMATE,
      powerRatingVerified: false,
      dailyUsageHours: 24,
      daysUsedPerMonth: 30,
      isVariablePower: true,
      manufacturer: 'LG',
      notes: 'Compressor duty cycle estimated at 40% (effective continuous draw ~64W).',
      position3D: { x: -2.1, y: 0.95, z: -1.2, rotationY: Math.PI / 2 }
    },
    // Electrical Fittings (Passive, non-energy-consuming)
    {
      projectId: project._id,
      userId: user._id,
      canonicalName: 'switch',
      displayName: 'Master Switchboard (4-Gang)',
      category: DEVICE_CATEGORIES.ELECTRICAL_FITTINGS,
      detectionConfidence: 0.82,
      bbox: [40, 180, 80, 240],
      isFitting: true,
      fittingType: FITTING_TYPES.SWITCH,
      fittingStatus: SWITCH_STATES.UNKNOWN, // Status unknown unless proven
      powerRatingWatts: 0,
      powerRatingSource: POWER_RATING_SOURCES.UNKNOWN,
      dailyUsageHours: 0,
      daysUsedPerMonth: 0,
      notes: 'Wall switchboard controlling room lighting circuits.',
      position3D: { x: -2.7, y: 1.2, z: 1.0, rotationY: Math.PI / 2 }
    },
    {
      projectId: project._id,
      userId: user._id,
      canonicalName: 'socket',
      displayName: 'Power Socket 16A (AC Point)',
      category: DEVICE_CATEGORIES.ELECTRICAL_FITTINGS,
      detectionConfidence: 0.85,
      bbox: [520, 280, 560, 330],
      isFitting: true,
      fittingType: FITTING_TYPES.SOCKET,
      fittingStatus: SWITCH_STATES.UNKNOWN,
      powerRatingWatts: 0,
      powerRatingSource: POWER_RATING_SOURCES.UNKNOWN,
      dailyUsageHours: 0,
      daysUsedPerMonth: 0,
      notes: 'Dedicated 16A grounded power outlet for AC.',
      position3D: { x: 0.8, y: 2.1, z: -2.2, rotationY: 0 }
    }
  ];

  const createdDevices = await Device.insertMany(devicesToCreate);
  console.log(`✅ Seeded ${createdDevices.length} devices (6 appliances + 2 electrical fittings).`);

  // 4. Calculate Energy Estimates
  const estimate = await energyEstimationService.recalculateProjectEnergy(project._id);
  console.log(`✅ Calculated Energy Baseline:`);
  console.log(`   - Monthly Energy: ${estimate.totalMonthlyEnergyKwh} kWh`);
  console.log(`   - Monthly Cost: ₹${estimate.totalMonthlyCost}`);
  console.log(`   - Monthly Carbon: ${estimate.totalCarbonEmissionsKg} kg CO2e`);

  // 5. Seed 3D Digital Twin Scene
  const sceneObjects = createdDevices.map((dev) => ({
    deviceId: dev._id,
    name: dev.displayName,
    canonicalName: dev.canonicalName,
    category: dev.category,
    isFitting: dev.isFitting,
    position: dev.position3D,
    rotation: { x: 0, y: dev.position3D.rotationY || 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    powerRatingWatts: dev.powerRatingWatts,
    energyTier: dev.isFitting ? 'fitting' : dev.powerRatingWatts > 1000 ? 'high' : dev.powerRatingWatts > 200 ? 'medium' : 'low'
  }));

  await DigitalTwinScene.create({
    projectId: project._id,
    userId: user._id,
    roomDimensions: project.roomDimensions,
    roomTheme: {
      wallColor: '#eef2f6',
      floorTexture: 'wood',
      ambientIntensity: 0.85
    },
    objects: sceneObjects
  });
  console.log('✅ Seeded Digital Twin 3D room scene with placed objects.');

  // 6. Seed What-If Optimization Scenario
  const fanDev = createdDevices.find((d) => d.canonicalName === 'ceiling_fan');
  const acDev = createdDevices.find((d) => d.canonicalName === 'air_conditioner');

  await scenarioSimulationService.simulateScenario(project._id, user._id, {
    name: 'Proposed Eco-Schedule Optimization',
    description: 'Reduce AC runtime by 2 hours using dawn thermostat auto-cutoff, and optimize ceiling fan schedule.',
    deviceAdjustments: [
      {
        deviceId: acDev._id.toString(),
        proposedDailyHours: 4.0 // reduce from 6 to 4 hours
      },
      {
        deviceId: fanDev._id.toString(),
        proposedDailyHours: 6.0 // reduce from 8 to 6 hours
      }
    ]
  });
  console.log('✅ Seeded What-If Energy Scenario simulation.');

  // 7. Seed Initial Recommendations
  await recommendationService.generateProjectRecommendations(project._id, user._id, [
    'Reduce AC electricity expenditure',
    'Adopt energy-efficient BLDC motors'
  ]);
  console.log('✅ Seeded AI recommendations.');

  console.log('====================================================');
  console.log('🎉 VisionTwin demo dataset successfully populated!');
  console.log('Login credentials:');
  console.log('  Email:    demo@visiontwin.io');
  console.log('  Password: Password123!');
  console.log('====================================================');

  await disconnectDatabase();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
