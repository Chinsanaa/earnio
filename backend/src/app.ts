import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import sponsorshipRoutes from './routes/sponsorships';
import walletRoutes from './routes/wallet';
import sponsorRoutes from './routes/sponsor';
import platformRoutes from './routes/platforms';
import notificationRoutes from './routes/notifications';
import syncRoutes from './routes/sync';
import legalRoutes from './routes/legal';
import { getHealthStatus, getPublicHealthStatus } from './routes/health';
import type { EnvConfig } from './config/env';
import { AppError } from './utils/AppError';
import { notFoundBody } from './utils/httpErrors';
import {
  globalRateLimiter,
  jsonBodyParser,
  mutationRateLimiter,
  securityHeaders,
} from './middleware/security';
import { secureCompareStrings } from './utils/secureCompare';

export function createApp(config: EnvConfig): express.Application {
  const app = express();

  // Number of proxies in front of the API. 1 = the host's load balancer
  // (Render). Set TRUST_PROXY_HOPS=2 when the frontend also proxies /api/* to
  // this server (Vercel rewrite) so rate limits key on the visitor's IP.
  app.set('trust proxy', config.trustProxyHops);
  app.use(securityHeaders);
  app.use(
    cors({
      origin: config.frontendUrl,
      credentials: true,
    })
  );
  app.use(jsonBodyParser);
  app.use(cookieParser());
  app.use('/api', globalRateLimiter);

  app.get('/api/health', async (_req, res) => {
    const health = await getPublicHealthStatus();
    res.status(health.status === 'ok' ? 200 : 503).json(health);
  });

  app.get('/api/health/detailed', async (req, res) => {
    const secret = process.env.SYNC_CRON_SECRET;
    const header = req.headers['x-cron-secret'];
    if (
      !secret ||
      typeof header !== 'string' ||
      !secureCompareStrings(header, secret)
    ) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const health = await getHealthStatus(config.port);
    res.status(health.status === 'ok' ? 200 : 503).json(health);
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/sponsorships', mutationRateLimiter, sponsorshipRoutes);
  app.use('/api/wallet', mutationRateLimiter, walletRoutes);
  app.use('/api/sponsor', mutationRateLimiter, sponsorRoutes);
  app.use('/api/platforms', mutationRateLimiter, platformRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/sync', syncRoutes);
  app.use('/api/legal', legalRoutes);

  app.use((_req, res) => {
    res.status(404).json(notFoundBody());
  });

  app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (
      err &&
      typeof err === 'object' &&
      'type' in err &&
      (err as { type?: string }).type === 'entity.too.large'
    ) {
      res.status(413).json({ error: 'Request payload too large' });
      return;
    }
    next(err);
  });

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: { status: err.statusCode, message: err.message, code: err.code },
      });
      return;
    }
    console.error('Error:', err);
    res.status(500).json({
      error: { status: 500, message: 'Something went wrong. Please try again.' },
    });
  });

  return app;
}
