import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app';
import type { EnvConfig } from '../config/env';

const testConfig: EnvConfig = {
  port: 3001,
  frontendUrl: 'http://localhost:3000',
  supabaseUrl: process.env.SUPABASE_URL || 'https://example.supabase.co',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'test-anon-key',
  nodeEnv: 'test',
  trustProxyHops: 1,
};

describe('GET /api/health', () => {
  it('returns minimal public health payload', async () => {
    const app = createApp(testConfig);
    const res = await request(app).get('/api/health');

    assert.ok([200, 503].includes(res.status));
    assert.equal(typeof res.body.status, 'string');
    assert.equal(typeof res.body.timestamp, 'string');
    assert.equal(res.body.port, undefined);
    assert.equal(res.body.checks, undefined);
  });

  it('rejects detailed health without cron secret', async () => {
    const app = createApp(testConfig);
    const res = await request(app).get('/api/health/detailed');

    assert.equal(res.status, 401);
    assert.equal(res.body.error, 'Unauthorized');
  });

  it('returns detailed health payload when cron secret matches', async () => {
    const previous = process.env.SYNC_CRON_SECRET;
    process.env.SYNC_CRON_SECRET = 'test-health-secret';
    try {
      const app = createApp(testConfig);
      const res = await request(app)
        .get('/api/health/detailed')
        .set('x-cron-secret', 'test-health-secret');

      assert.ok([200, 503].includes(res.status));
      assert.equal(Number(res.body.port), testConfig.port);
      assert.equal(typeof res.body.checks, 'object');
      assert.ok('database' in res.body.checks);
    } finally {
      if (previous === undefined) delete process.env.SYNC_CRON_SECRET;
      else process.env.SYNC_CRON_SECRET = previous;
    }
  });
});

describe('404 handler', () => {
  it('returns JSON for unknown routes', async () => {
    const app = createApp(testConfig);
    const res = await request(app).get('/api/unknown-route');

    assert.equal(res.status, 404);
    assert.equal(res.body.error.status, 404);
    assert.equal(res.body.error.code, 'NOT_FOUND');
    assert.equal(res.body.error.message, 'Route not found');
  });
});
