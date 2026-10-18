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

describe('Legal documents', () => {
  const app = createApp(testConfig);

  it('returns privacy policy without authentication', async () => {
    const res = await request(app).get('/api/legal/privacy-policy');
    assert.equal(res.status, 200);
    assert.equal(res.body.document.slug, 'privacy-policy');
    assert.match(res.body.document.content, /Privacy Policy/);
  });

  it('returns terms and conditions without authentication', async () => {
    const res = await request(app).get('/api/legal/terms-and-conditions');
    assert.equal(res.status, 200);
    assert.equal(res.body.document.slug, 'terms-and-conditions');
    assert.match(res.body.document.content, /Terms and Conditions/);
  });

  it('rejects unknown legal slugs', async () => {
    const res = await request(app).get('/api/legal/unknown-doc');
    assert.equal(res.status, 404);
  });
});
