import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { connectDatabase, disconnectDatabase } from '../../config/database.js';

let app;
let userCookie;

beforeAll(async () => {
  await connectDatabase();
  app = createApp();

  const userRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Upload Test User',
      email: `upload_${Date.now()}@visiontwin.io`,
      password: 'Password123!'
    });
  userCookie = userRes.headers['set-cookie'][0];
});

afterAll(async () => {
  await disconnectDatabase();
});

describe('Video Upload & Validation Tests', () => {
  it('rejects uploads without a file', async () => {
    const res = await request(app)
      .post('/api/upload')
      .set('Cookie', userCookie)
      .send({ projectId: 'dummy_id' });

    expect(res.status).toBe(400);
  });

  it('rejects uploads of unsupported file extensions (e.g. .txt or .exe)', async () => {
    const res = await request(app)
      .post('/api/upload')
      .set('Cookie', userCookie)
      .attach('video', Buffer.from('dummy file content'), 'malicious.exe')
      .field('projectId', 'dummy_id');

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Unsupported video format');
  });
});
