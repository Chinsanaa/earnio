import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app';
import type { EnvConfig } from '../config/env';
import { secureCompareStrings } from '../utils/secureCompare';

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

describe('secureCompareStrings', () => {
  it('matches equal strings', () => {
    assert.equal(secureCompareStrings('secret-value', 'secret-value'), true);
  });

  it('rejects different strings', () => {
    assert.equal(secureCompareStrings('secret-value', 'secret-valuex'), false);
  });
});

describe('Security middleware', () => {
  it('returns security headers from helmet', async () => {
    const res = await request(app()).get('/api/health');
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
  });

  it('rejects oversized JSON payloads', async () => {
    const res = await request(app())
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send(`{"email":"a@b.com","password":"${'x'.repeat(200_000)}"}`);

    assert.equal(res.status, 413);
  });
});

describe('Wallet validation', () => {
  it('rejects unauthenticated payout requests', async () => {
    const res = await request(app())
      .post('/api/wallet/payouts')
      .send({ amountMnt: 50000, bankAccountId: '00000000-0000-4000-8000-000000000000' });

    assert.equal(res.status, 401);
  });
});
