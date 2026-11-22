import express, { Request, Response, NextFunction } from 'express';
import { AuthUser, WorkerEnv } from '../types';
import { requireAuth } from '../auth';
import { getClientIp, orderRateLimiter } from '../middleware/rateLimit';
import { idempotencyMiddleware } from '../middleware/idempotency';
import { requireD1, createD1Repo, clampPagination } from '../db';
import {
  createRazorpayOrderInD1,
  verifyRazorpayPaymentInD1,
  processRazorpayWebhookInD1,
} from '../db/paymentRepo';
import { RazorpayCreateOrderSchema, RazorpayVerifyPaymentSchema } from '../schemas';

/**
 * Registers Phase 4 Razorpay Test-Mode Payment & Webhook API routes.
 * - Strictly test-mode (`rzp_test_*`)
 * - Server-authoritative amounts from D1 (client NEVER supplies amountPaise)
 * - WebCrypto constant-time HMAC-SHA256 verification
 * - Idempotent webhook deduplication via `webhook_events`
 */
export function registerRazorpayRoutes(app: express.Express): void {
  // Public safe config check (NEVER leaks keySecret or webhookSecret)
  app.get('/api/razorpay/config', (req: Request, res: Response) => {
    const env: WorkerEnv = (req as any).env;
    const keyId =
      (typeof env?.RAZORPAY_KEY_ID === 'string' && env.RAZORPAY_KEY_ID.trim()) ||
      (typeof process !== 'undefined' && process?.env?.RAZORPAY_KEY_ID
        ? process.env.RAZORPAY_KEY_ID.trim()
        : '');
    const keySecretConfigured = Boolean(
      (typeof env?.RAZORPAY_KEY_SECRET === 'string' && env.RAZORPAY_KEY_SECRET.trim()) ||
        (typeof process !== 'undefined' && process?.env?.RAZORPAY_KEY_SECRET)
    );
    const isTestModeKey = keyId.startsWith('rzp_test_');

    res.json({
      success: true,
      configured: Boolean(isTestModeKey && keySecretConfigured),
      mode: 'test',
      keyId: isTestModeKey ? keyId : null,
      liveKeysBlocked: Boolean(keyId && !isTestModeKey),
    });
  });

  // List authenticated user's payment ledger (role-scoped via D1 repo)
  app.get('/api/payments', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const env: WorkerEnv = (req as any).env;
      const user: AuthUser = (req as any).user;
      const db = requireD1(env);
      const { limit, offset } = clampPagination(
        req.query.limit ? Number(req.query.limit) : undefined,
        req.query.offset ? Number(req.query.offset) : undefined
      );
      const orderId = typeof req.query.orderId === 'string' ? req.query.orderId : undefined;
      const subscriptionId = typeof req.query.subscriptionId === 'string' ? req.query.subscriptionId : undefined;

      const data = await createD1Repo(db).forUser(user).payments.list({
        orderId,
        subscriptionId,
        limit,
        offset,
      });

      return res.json({
        success: true,
        payments: data.items,
        limit: data.limit,
        offset: data.offset,
      });
    } catch (err) {
      return next(err);
    }
  });

  // Step 1: Create Razorpay Test-Mode Order from D1 Order or Subscription Invoice
  app.post(
    '/api/razorpay/create-order',
    requireAuth,
    orderRateLimiter,
    idempotencyMiddleware(),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const parsed = RazorpayCreateOrderSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            success: false,
            error: parsed.error.issues[0]?.message || 'Provide either orderId or subscriptionInvoiceId.',
          });
        }

        const env: WorkerEnv = (req as any).env;
        const user: AuthUser = (req as any).user;
        const db = requireD1(env);

        const result = await createRazorpayOrderInD1(db, env, user, parsed.data, getClientIp(req));
        return res.status(result.reused ? 200 : 201).json({
          success: true,
          ...result,
          orderId: result.razorpayOrderId,
        });
      } catch (err) {
        return next(err);
      }
    }
  );

  // Step 2: Verify Razorpay Checkout Signature (WebCrypto constant-time HMAC-SHA256)
  app.post(
    '/api/razorpay/verify',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const parsed = RazorpayVerifyPaymentSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            success: false,
            error: parsed.error.issues[0]?.message || 'Missing Razorpay verification parameters.',
          });
        }

        const env: WorkerEnv = (req as any).env;
        const user: AuthUser = (req as any).user;
        const db = requireD1(env);

        const result = await verifyRazorpayPaymentInD1(db, env, user, parsed.data, getClientIp(req));
        return res.json({
          success: true,
          ...result,
          message: result.alreadyCaptured
            ? 'Payment was already verified and settled.'
            : 'Razorpay payment signature verified and settled.',
        });
      } catch (err) {
        return next(err);
      }
    }
  );

  // Step 3: Server-to-Server Razorpay Webhook (Raw Body HMAC-SHA256 + webhook_events dedupe)
  app.post('/api/razorpay/webhook', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const env: WorkerEnv = (req as any).env;
      const db = requireD1(env);

      const rawBody =
        typeof (req as any).rawBody === 'string' && (req as any).rawBody.length > 0
          ? (req as any).rawBody
          : JSON.stringify(req.body ?? {});

      const signatureHeader = req.headers['x-razorpay-signature'] as string | undefined;
      const eventIdHeader = req.headers['x-razorpay-event-id'] as string | undefined;

      const result = await processRazorpayWebhookInD1(
        db,
        env,
        {
          rawBody,
          signatureHeader,
          eventIdHeader,
          payload: req.body,
        },
        getClientIp(req)
      );

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (err) {
      return next(err);
    }
  });
}
