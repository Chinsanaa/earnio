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

describe('Protected routes', () => {
  it('rejects unauthenticated dashboard access', async () => {
    const res = await request(app()).get('/api/dashboard/summary');
    assert.equal(res.status, 401);
  });

  it('rejects unauthenticated wallet summary', async () => {
    const res = await request(app()).get('/api/wallet/summary');
    assert.equal(res.status, 401);
  });

  it('rejects unauthenticated sponsor dashboard', async () => {
    const res = await request(app()).get('/api/sponsor/dashboard');
    assert.equal(res.status, 401);
  });

  it('rejects unauthenticated sponsorships list', async () => {
    const res = await request(app()).get('/api/sponsorships');
    assert.equal(res.status, 401);
  });

  it('rejects unauthenticated sponsorship application alias route', async () => {
    const res = await request(app())
      .post('/api/sponsorships/apply')
      .send({ sponsorshipId: 'demo', responseText: 'Interested' });
    assert.equal(res.status, 401);
  });

  it('rejects unauthenticated notifications', async () => {
    const res = await request(app()).get('/api/notifications');
    assert.equal(res.status, 401);
  });

  it('rejects unauthenticated account deletion', async () => {
    const res = await request(app())
      .delete('/api/auth/account')
      .send({ password: 'wrong-password' });
    assert.equal(res.status, 401);
  });

  it('rejects OAuth session without tokens', async () => {
    const res = await request(app()).post('/api/auth/oauth/session').send({});
    assert.equal(res.status, 400);
  });

  it('rejects unauthenticated send-verification-email', async () => {
    const res = await request(app())
      .post('/api/auth/send-verification-email')
      .send({ userId: 'someone', email: 'attacker@example.com' });
    assert.equal(res.status, 401);
  });

  it('rejects unauthenticated verify-email', async () => {
    const res = await request(app())
      .post('/api/auth/verify-email')
      .send({ userId: 'someone', code: '123456' });
    assert.equal(res.status, 401);
  });

  it('rejects unauthenticated resend-verification-email', async () => {
    const res = await request(app())
      .post('/api/auth/resend-verification-email')
      .send({ userId: 'someone' });
    assert.equal(res.status, 401);
  });

  it('answers refresh without a cookie with 204, not an error', async () => {
    const res = await request(app()).post('/api/auth/refresh').send({});
    assert.equal(res.status, 204);
  });

  it('rate limits repeated refresh attempts', async () => {
    const testApp = app();

    // One request was already spent by the previous test (shared limiter).
    for (let i = 0; i < 29; i += 1) {
      const res = await request(testApp).post('/api/auth/refresh').send({});
      assert.equal(res.status, 204);
    }

    const limited = await request(testApp).post('/api/auth/refresh').send({});
    assert.equal(limited.status, 429);
    assert.equal(limited.body.error, 'Too many auth attempts. Please try again later.');
  });
});

describe('Sync cron', () => {
  it('rejects cron without secret header', async () => {
    const res = await request(app()).post('/api/sync/cron');
    assert.equal(res.status, 401);
  });
});
