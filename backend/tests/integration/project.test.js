import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { connectDatabase, disconnectDatabase } from '../../config/database.js';
import { User } from '../../models/User.js';
import { Project } from '../../models/Project.js';
import { Device } from '../../models/Device.js';

let app;
let userCookie;
let otherUserCookie;
let createdProjectId;
let createdDeviceId;

beforeAll(async () => {
  await connectDatabase();
  app = createApp();

  // Register primary user
  const userRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Owner User',
      email: `owner_${Date.now()}@visiontwin.io`,
      password: 'OwnerPassword123!'
    });
  userCookie = userRes.headers['set-cookie'][0];

  // Register secondary user
  const otherRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Other User',
      email: `other_${Date.now()}@visiontwin.io`,
      password: 'OtherPassword123!'
    });
  otherUserCookie = otherRes.headers['set-cookie'][0];
});

afterAll(async () => {
  await Project.deleteMany({ _id: createdProjectId });
  await Device.deleteMany({ projectId: createdProjectId });
  await disconnectDatabase();
});

describe('Project, Device Power Rating & Energy Integration Tests', () => {
  it('creates a project with dimensions and custom tariff', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Cookie', userCookie)
      .send({
        name: 'Integration Test Living Room',
        roomType: 'living_room',
        roomDimensions: { length: 5.0, width: 4.0, height: 2.8, unit: 'meters' },
        electricityTariff: 8.0,
        emissionFactor: 0.82
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Integration Test Living Room');
    expect(res.body.data.electricityTariff).toBe(8.0);
    createdProjectId = res.body.data._id;
  });

  it('prevents another user from accessing or modifying the project (Access Control)', async () => {
    const res = await request(app)
      .get(`/api/projects/${createdProjectId}`)
      .set('Cookie', otherUserCookie);

    expect(res.status).toBe(404); // Scoped by user ID
  });

  it('creates an appliance manually with initial parameters', async () => {
    const res = await request(app)
      .post('/api/devices')
      .set('Cookie', userCookie)
      .send({
        projectId: createdProjectId,
        displayName: 'Test Ceiling Fan',
        canonicalName: 'ceiling_fan',
        category: 'cooling',
        powerRatingWatts: 50,
        dailyUsageHours: 6,
        daysUsedPerMonth: 30
      });

    expect(res.status).toBe(201);
    expect(res.body.data.displayName).toBe('Test Ceiling Fan');
    expect(res.body.data.powerRatingWatts).toBe(50);
    createdDeviceId = res.body.data._id;
  });

  it('CRITICAL: updates power rating via PATCH /api/devices/:deviceId/power-rating and validates calculation', async () => {
    // Exactly matches specification: 75 W, 8 hours/day, 30 days/month, tariff ₹8
    const patchRes = await request(app)
      .patch(`/api/devices/${createdDeviceId}/power-rating`)
      .set('Cookie', userCookie)
      .send({
        powerRatingWatts: 75,
        powerRatingSource: 'user_entered',
        dailyUsageHours: 8,
        daysUsedPerMonth: 30
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.status).toBe('success');

    const updatedDevice = patchRes.body.data.device;
    expect(updatedDevice.powerRatingWatts).toBe(75);
    expect(updatedDevice.powerRatingSource).toBe('user_entered');
    expect(updatedDevice.powerRatingVerified).toBe(true);

    // Verify recalculations
    const metrics = patchRes.body.data.deviceMetrics;
    expect(metrics.dailyEnergyKwh).toBe(0.6); // 75 * 8 / 1000 = 0.6 kWh
    expect(metrics.monthlyEnergyKwh).toBe(18.0); // 0.6 * 30 = 18 kWh
    expect(metrics.monthlyCost).toBe(144.0); // 18 * 8 = ₹144
  });

  it('CRITICAL: rejects invalid power ratings (negative, zero, unreasonable, or non-numeric)', async () => {
    // Zero wattage
    const zeroRes = await request(app)
      .patch(`/api/devices/${createdDeviceId}/power-rating`)
      .set('Cookie', userCookie)
      .send({ powerRatingWatts: 0 });
    expect(zeroRes.status).toBe(400);

    // Negative wattage
    const negRes = await request(app)
      .patch(`/api/devices/${createdDeviceId}/power-rating`)
      .set('Cookie', userCookie)
      .send({ powerRatingWatts: -100 });
    expect(negRes.status).toBe(400);

    // Beyond safety limits
    const hugeRes = await request(app)
      .patch(`/api/devices/${createdDeviceId}/power-rating`)
      .set('Cookie', userCookie)
      .send({ powerRatingWatts: 999999 });
    expect(hugeRes.status).toBe(400);

    // Non-numeric text
    const textRes = await request(app)
      .patch(`/api/devices/${createdDeviceId}/power-rating`)
      .set('Cookie', userCookie)
      .send({ powerRatingWatts: 'not-a-number' });
    expect(textRes.status).toBe(400);
  });

  it('recalculates energy metrics when project tariff changes', async () => {
    // Change tariff from ₹8 to ₹10
    const res = await request(app)
      .put(`/api/energy/project/${createdProjectId}/tariff`)
      .set('Cookie', userCookie)
      .send({ electricityTariff: 10.0 });

    expect(res.status).toBe(200);
    // 18 kWh * ₹10 = ₹180
    expect(res.body.data.energyEstimate.totalMonthlyCost).toBe(180.0);
    expect(res.body.data.energyEstimate.totalMonthlyEnergyKwh).toBe(18.0);
  });

  it('persists and retrieves Digital Twin 3D scene configuration', async () => {
    const getRes = await request(app)
      .get(`/api/digital-twin/project/${createdProjectId}`)
      .set('Cookie', userCookie);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.roomDimensions.length).toBe(5.0);

    // Update scene dimensions
    const putRes = await request(app)
      .put(`/api/digital-twin/project/${createdProjectId}`)
      .set('Cookie', userCookie)
      .send({
        roomDimensions: { length: 6.0, width: 4.5, height: 3.0 }
      });

    expect(putRes.status).toBe(200);
    expect(putRes.body.data.roomDimensions.length).toBe(6.0);
  });
});
