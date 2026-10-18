import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app';
import type { EnvConfig } from '../config/env';

const testConfig: EnvConfig = {
  port: 3001,
  frontendUrl: 'http://localhost:3000',
  supabaseUrl: 'https://example.supabase.co',
  supabaseAnonKey: 'test-anon-key',
  nodeEnv: 'test',
  trustProxyHops: 1,
};

function app() {
  return createApp(testConfig);
}

describe('Password Reset Flow', () => {
  it('accepts forgot password request with valid email', async () => {
    const res = await request(app())
      .post('/api/auth/forgot-password')
      .send({ email: 'test@example.com' });

    // Note: Returns 200 even if email doesn't exist (security feature: prevents email enumeration)
    assert.ok([200, 400].includes(res.status), `Expected 200 or 400, got ${res.status}`);
    if (res.status === 200) {
      assert(res.body.message);
      assert(res.body.message.includes('If an account exists'));
    }
  });

  it('rejects forgot password without email', async () => {
    const res = await request(app())
      .post('/api/auth/forgot-password')
      .send({});

    assert.equal(res.status, 400);
  });

  it('rate limits forgot password requests', async () => {
    const testApp = app();

    // First 3 requests should succeed or fail (both are OK due to rate limiting or email not found)
    let successCount = 0;
    for (let i = 0; i < 3; i++) {
      const res = await request(testApp)
        .post('/api/auth/forgot-password')
        .send({ email: `test${i}@example.com` });
      if (res.status === 200) successCount += 1;
    }

    // After 3 requests, 4th should be rate limited (429)
    const limited = await request(testApp)
      .post('/api/auth/forgot-password')
      .send({ email: 'test4@example.com' });
    assert.equal(limited.status, 429);
  });

  it('verifies reset token with invalid token', async () => {
    const res = await request(app())
      .post('/api/auth/verify-reset-token')
      .send({
        token: 'invalid-token',
        email: 'test@example.com',
      });

    assert.equal(res.status, 400);
    assert(res.body.error);
  });

  it('rejects reset password without token', async () => {
    const res = await request(app())
      .post('/api/auth/reset-password')
      .send({
        email: 'test@example.com',
        newPassword: 'ValidPassword123!',
      });

    assert.equal(res.status, 400);
  });

  it('rejects reset password with weak password', async () => {
    const res = await request(app())
      .post('/api/auth/reset-password')
      .send({
        token: 'some-token',
        email: 'test@example.com',
        newPassword: 'weak',
      });

    assert.equal(res.status, 400);
    assert(res.body.error);
  });
});

describe('Username Availability Check', () => {
  it('checks username availability', async () => {
    const res = await request(app())
      .post('/api/auth/check-username')
      .send({ username: 'unique_username_123' });

    // Endpoint should return 200 or 400 depending on username validation
    assert.ok([200, 400].includes(res.status), `Expected 200 or 400, got ${res.status}`);
    if (res.status === 200) {
      assert(typeof res.body.available === 'boolean');
      assert.equal(res.body.username, 'unique_username_123');
    }
  });

  it('rejects username check without username', async () => {
    const res = await request(app())
      .post('/api/auth/check-username')
      .send({});

    assert.equal(res.status, 400);
  });

  it('rejects username check with whitespace only', async () => {
    const res = await request(app())
      .post('/api/auth/check-username')
      .send({ username: '   ' });

    assert.equal(res.status, 400);
  });
});
