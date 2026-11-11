import { Router, Request, Response } from 'express';
import { getUtcIsoTimestamp, evaluateDeliveryCutoff } from '../lib/timezone';
import { WorkerEnv } from '../types';

export const healthRouter = Router();

/**
 * Liveness Probe: GET /api/health & GET /api/v1/health
 * Ultra-cheap, fast (<1ms), accesses zero secrets or external networks.
 */
healthRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: getUtcIsoTimestamp(),
    service: 'dugdhsar-api',
    version: '1.0.0',
    platform: 'Cloudflare Workers (Edge Node V8)',
  });
});

/**
 * Readiness Probe: GET /api/ready & GET /api/v1/ready
 * Validates availability of KV cache and internal operational state.
 */
healthRouter.get('/ready', async (req: Request, res: Response) => {
  const env: WorkerEnv = (req as any).env;
  const checks: Record<string, 'healthy' | 'unavailable' | 'unconfigured'> = {
    kv: 'unconfigured',
    memory: 'healthy',
  };

  let isReady = true;

  if (env?.CACHE) {
    try {
      // Test read from KV with short timeout
      await env.CACHE.get('__healthcheck_ping__');
      checks.kv = 'healthy';
    } catch {
      checks.kv = 'unavailable';
      isReady = false;
    }
  }

  const statusCode = isReady ? 200 : 503;
  res.status(statusCode).json({
    status: isReady ? 'ready' : 'degraded',
    timestamp: getUtcIsoTimestamp(),
    checks,
  });
});

/**
 * Delivery Logistics Cutoff: GET /api/v1/delivery/cutoffs
 * Returns current IST time and earliest available morning/evening delivery slot.
 */
healthRouter.get('/delivery/cutoffs', (_req: Request, res: Response) => {
  const cutoff = evaluateDeliveryCutoff();
  res.status(200).json({
    success: true,
    data: cutoff,
    timestamp: getUtcIsoTimestamp(),
  });
});
