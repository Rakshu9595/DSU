import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { connectDatabase, disconnectDatabase } from '../../config/database.js';
import { Project } from '../../models/Project.js';
import { Device } from '../../models/Device.js';

let app;
let userCookie;
let testProjectId;

beforeAll(async () => {
  await connectDatabase();
  app = createApp();

  const userRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Report Test User',
      email: `report_${Date.now()}@visiontwin.io`,
      password: 'Password123!'
    });
  userCookie = userRes.headers['set-cookie'][0];

  const projRes = await request(app)
    .post('/api/projects')
    .set('Cookie', userCookie)
    .send({
      name: 'Report Test Project',
      roomType: 'office',
      electricityTariff: 8.0
    });
  testProjectId = projRes.body.data._id;

  // Add sample appliance
  await request(app)
    .post('/api/devices')
    .set('Cookie', userCookie)
    .send({
      projectId: testProjectId,
      displayName: 'Office Computer',
      canonicalName: 'desktop_computer',
      category: 'computing',
      powerRatingWatts: 200,
      dailyUsageHours: 8,
      daysUsedPerMonth: 22
    });
});

afterAll(async () => {
  await Project.deleteMany({ _id: testProjectId });
  await Device.deleteMany({ projectId: testProjectId });
  await disconnectDatabase();
});

describe('Report Generation Integration Tests', () => {
  it('generates a PDF report document', async () => {
    const res = await request(app)
      .post(`/api/reports/project/${testProjectId}/generate`)
      .set('Cookie', userCookie)
      .send({ reportType: 'pdf' });

    expect(res.status).toBe(201);
    expect(res.body.data.reportType).toBe('pdf');
    expect(res.body.data.filename).toContain('.pdf');
  });

  it('generates a CSV report document', async () => {
    const res = await request(app)
      .post(`/api/reports/project/${testProjectId}/generate`)
      .set('Cookie', userCookie)
      .send({ reportType: 'csv' });

    expect(res.status).toBe(201);
    expect(res.body.data.reportType).toBe('csv');
    expect(res.body.data.filename).toContain('.csv');
  });
});
