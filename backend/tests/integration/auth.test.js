import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { connectDatabase, disconnectDatabase } from '../../config/database.js';
import { User } from '../../models/User.js';

let app;

beforeAll(async () => {
  await connectDatabase();
  app = createApp();
  await User.deleteMany({ email: /test.*@visiontwin\.io/ });
});

afterAll(async () => {
  await User.deleteMany({ email: /test.*@visiontwin\.io/ });
  await disconnectDatabase();
});

describe('Authentication & Access Control Integration Tests', () => {
  const testEmail = `test_${Date.now()}@visiontwin.io`;
  const testPassword = 'SecurePassword123!';
  let sessionCookie;

  it('registers a new user successfully and establishes session', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Engineer',
        email: testEmail,
        password: testPassword
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.user.password).toBeUndefined(); // Password must not be exposed

    // Extract session cookie
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    sessionCookie = cookies[0];
  });

  it('rejects duplicate email registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate Engineer',
        email: testEmail,
        password: 'AnotherPassword123!'
      });

    expect(res.status).toBe(409);
    expect(res.body.status).toBe('fail');
  });

  it('authenticates user login and rejects invalid passwords', async () => {
    // Bad password
    const badRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'WrongPassword' });
    expect(badRes.status).toBe(401);

    // Good password
    const goodRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });
    expect(goodRes.status).toBe(200);
    expect(goodRes.body.data.user.email).toBe(testEmail);
  });

  it('allows access to protected /api/auth/me when authenticated with session', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(testEmail);
  });

  it('rejects access to protected routes without session cookie', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
  });
});
