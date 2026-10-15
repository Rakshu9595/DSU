import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { connectDatabase, disconnectDatabase } from '../../config/database.js';
import { modelApiClient } from '../../services/model-api-client.service.js';

let app;
let userCookie;

beforeAll(async () => {
  await connectDatabase();
  app = createApp();

  const userRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Analysis Test User',
      email: `analysis_${Date.now()}@visiontwin.io`,
      password: 'Password123!'
    });
  userCookie = userRes.headers['set-cookie'][0];
});

afterAll(async () => {
  await disconnectDatabase();
});

describe('Analysis & Model Integration Tests', () => {
  it('checks model server health via API client', async () => {
    const health = await modelApiClient.checkHealth();
    expect(health).toHaveProperty('isOnline');
    if (health.isOnline) {
      expect(health.status).toBe('ok');
      expect(health.models_loaded).toBe(true);
    }
  });

  it('exposes GET /api/analysis/health endpoint to frontend', async () => {
    const res = await request(app)
      .get('/api/analysis/health')
      .set('Cookie', userCookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('isOnline');
  });
});
