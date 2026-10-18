import dotenv from 'dotenv';
dotenv.config();

import { loadEnvConfig } from './config/env';
import { createApp } from './app';
import { startSyncScheduler } from './jobs/syncScheduler';
import { hasServiceRoleKey, warnIfMissingServiceRoleKey } from './database/supabase';
import { isConfigured as isEncryptionConfigured, warnIfMissingEncryptionKey } from './utils/encryption';
import emailService from './services/emailService';

const config = loadEnvConfig();
if (config.nodeEnv === 'production' && !hasServiceRoleKey()) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY is required when NODE_ENV=production. Add it from Supabase Dashboard → API → service_role.'
  );
}
if (config.nodeEnv === 'production' && !isEncryptionConfigured()) {
  throw new Error(
    'ENCRYPTION_KEY is required when NODE_ENV=production so bank account numbers are encrypted at rest. Generate one with: openssl rand -base64 32'
  );
}
warnIfMissingServiceRoleKey();
warnIfMissingEncryptionKey();
emailService.warnIfNotConfigured();

const app = createApp(config);
const { port } = config;

app.listen(port, () => {
  console.log(`✓ Server running on http://localhost:${port}`);
  console.log(`✓ Health check: http://localhost:${port}/api/health`);
  console.log(`✓ Environment: ${config.nodeEnv}`);
  console.log(
    emailService.isConfigured()
      ? '✓ Email (Resend) enabled'
      : '○ Email (Resend) disabled — set RESEND_API_KEY and EMAIL_FROM'
  );
  startSyncScheduler();
});
