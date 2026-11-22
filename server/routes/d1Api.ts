import express, { Request, Response, NextFunction } from 'express';
import { AuthUser, WorkerEnv } from '../types';
import { requireAuth, requireRole } from '../auth';
import { getClientIp } from '../middleware/rateLimit';
import { BadRequestError } from '../errors/AppError';
import {
  requireD1,
  createD1Repo,
  clampPagination,
  updateAddressInD1,
  updateSubscriptionInD1,
  skipSubscriptionDateInD1,
  adminUpdateVariantInD1,
  adminUpdatePlanInD1,
  adminUpsertSiteSettingInD1,
  moderateReviewInD1,
  listEnquiriesInD1,
  updateEnquiryStatusInD1,
  assignDealerPincodesInD1,
  assignDealerCustomerInD1,
  getDealerSummaryInD1,
  getAdminReportsSummaryInD1,
} from '../db';
import { EnquiryStatus, OrderStatus, OrderType, ReviewRow, ReviewStatus } from '../db/types';
import {
  ProfileUpdateSchema,
  AddressCreateSchema,
  AddressUpdateSchema,
  SubscriptionSkipSchema,
  AdminVariantUpdateSchema,
  AdminPlanUpdateSchema,
  AdminSiteSettingUpdateSchema,
  ModerateReviewSchema,
  UpdateEnquirySchema,
  DealerPincodesAssignSchema,
  DealerCustomerAssignSchema,
} from '../schemas';
import {
  getCached,
  setCached,
  invalidateCatalogCache,
  CACHE_KEYS,
} from '../services/cacheService';

const YMD_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const SITE_SETTING_KEY_REGEX = /^[a-z0-9_]{2,64}$/;
const ALLOWED_ORDER_STATUSES = new Set<OrderStatus>([
  'pending',
  'confirmed',
  'processing',
  'dispatched',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
]);
const ALLOWED_ORDER_TYPES = new Set<OrderType>(['one_time', 'subscription_delivery']);
const ALLOWED_ENQUIRY_STATUSES = new Set<EnquiryStatus>(['new', 'in_progress', 'resolved', 'spam']);
const ALLOWED_REVIEW_STATUSES = new Set<ReviewStatus>(['pending', 'approved', 'rejected']);

function parseLimitOffset(req: Request): { limit: number; offset: number } {
  const rawLimit = req.query.limit !== undefined ? Number(req.query.limit) : undefined;
  const rawOffset = req.query.offset !== undefined ? Number(req.query.offset) : undefined;
  return clampPagination(rawLimit, rawOffset);
}

/**
 * Registers all Phase 3 Cloudflare D1 API endpoints onto the Express app.
 * Every authenticated route strictly uses createD1Repo(db).forUser(user)
 * so row-level customer/dealer/manager/super_admin boundaries are enforced in SQL.
 */
export function registerD1Routes(app: express.Express): void {
  // =========================================================================
  // 1. CURRENT USER PROFILE (/api/me & /api/profile — Strictly Own Row)
  // =========================================================================
  const handleGetProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const env: WorkerEnv = (req as any).env;
      const user: AuthUser = (req as any).user;
      const db = requireD1(env);
      const profile = await createD1Repo(db).forUser(user).profile.get();
      res.json({ success: true, profile, user: profile });
    } catch (err) {
      next(err);
    }
  };

  const handlePatchProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = ProfileUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: parsed.error.issues[0]?.message || 'Invalid profile update payload',
        });
      }
      const env: WorkerEnv = (req as any).env;
      const user: AuthUser = (req as any).user;
      const db = requireD1(env);
      const scoped = createD1Repo(db).forUser(user);
      await scoped.profile.update(parsed.data);
      const profile = await scoped.profile.get();
      return res.json({ success: true, profile, user: profile });
    } catch (err) {
      return next(err);
    }
  };

  app.get('/api/me', requireAuth, handleGetProfile);
  app.patch('/api/me', requireAuth, handlePatchProfile);
  app.get('/api/profile', requireAuth, handleGetProfile);
  app.patch('/api/profile', requireAuth, handlePatchProfile);

  // =========================================================================
  // 2. ADDRESSES (Strictly User-Scoped CRUD)
  // =========================================================================
  app.get('/api/addresses', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const env: WorkerEnv = (req as any).env;
      const user: AuthUser = (req as any).user;
      const db = requireD1(env);
      const addresses = await createD1Repo(db).forUser(user).addresses.list();
      res.json({ success: true, addresses });
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/addresses/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const env: WorkerEnv = (req as any).env;
      const user: AuthUser = (req as any).user;
      const db = requireD1(env);
      const address = await createD1Repo(db).forUser(user).addresses.getById(req.params.id);
      return res.json({ success: true, address });
    } catch (err) {
      return next(err);
    }
  });

  app.post('/api/addresses', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = AddressCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: parsed.error.issues[0]?.message || 'Invalid address payload',
        });
      }
      const env: WorkerEnv = (req as any).env;
      const user: AuthUser = (req as any).user;
      const db = requireD1(env);
      const address = await createD1Repo(db).forUser(user).addresses.create(parsed.data);
      return res.status(201).json({ success: true, address });
    } catch (err) {
      return next(err);
    }
  });

  app.patch('/api/addresses/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = AddressUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: parsed.error.issues[0]?.message || 'Invalid address update payload',
        });
      }
      const env: WorkerEnv = (req as any).env;
      const user: AuthUser = (req as any).user;
      const db = requireD1(env);
      const address = await updateAddressInD1(db, user, req.params.id, parsed.data);
      return res.json({ success: true, address });
    } catch (err) {
      return next(err);
    }
  });

  app.delete('/api/addresses/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const env: WorkerEnv = (req as any).env;
      const user: AuthUser = (req as any).user;
      const db = requireD1(env);
      await createD1Repo(db).forUser(user).addresses.softDelete(req.params.id);
      return res.json({ success: true, message: 'Address removed successfully.' });
    } catch (err) {
      return next(err);
    }
  });

  // =========================================================================
  // 3. PUBLIC CATALOG READS (5-Min KV Cached — Free-Plan D1 Read Saver)
  // =========================================================================
  app.get('/api/plans', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const env: WorkerEnv = (req as any).env;
      const cached = await getCached<{ success: true; plans: unknown[] }>(CACHE_KEYS.PLANS, env);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }

      const db = requireD1(env);
      const plans = await createD1Repo(db).publicCatalog.listActivePlans();
      const payload = { success: true as const, plans };
      await setCached(CACHE_KEYS.PLANS, payload, env, 300);
      res.setHeader('X-Cache', 'MISS');
      return res.json(payload);
    } catch (err) {
      return next(err);
    }
  });

  app.get('/api/site-settings', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const env: WorkerEnv = (req as any).env;
      const cached = await getCached<{ success: true; settings: Record<string, unknown> }>(
        CACHE_KEYS.SITE_SETTINGS,
        env
      );
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }

      const db = requireD1(env);
      const settings = await createD1Repo(db).publicCatalog.getSiteSettings();
      const payload = { success: true as const, settings };
      await setCached(CACHE_KEYS.SITE_SETTINGS, payload, env, 300);
      res.setHeader('X-Cache', 'MISS');
      return res.json(payload);
    } catch (err) {
      return next(err);
    }
  });

  // =========================================================================
  // 4. SUBSCRIPTION PAUSE / SKIP / RESUME (IST Cut-Off Enforced)
  // =========================================================================
  app.post('/api/subscriptions/:id/pause', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const env: WorkerEnv = (req as any).env;
      const user: AuthUser = (req as any).user;
      const db = requireD1(env);
      const reason = typeof req.body?.reason === 'string' ? req.body.reason.slice(0, 300) : undefined;
      const subscription = await createD1Repo(db)
        .forUser(user)
        .subscriptions.updateStatus(req.params.id, 'paused', reason, getClientIp(req));
      return res.json({ success: true, message: 'Subscription paused.', subscription });
    } catch (err) {
      return next(err);
    }
  });

  app.post('/api/subscriptions/:id/resume', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const env: WorkerEnv = (req as any).env;
      const user: AuthUser = (req as any).user;
      const db = requireD1(env);
      const subscription = await updateSubscriptionInD1(
        db,
        user,
        req.params.id,
        { status: 'active' },
        getClientIp(req)
      );
      return res.json({ success: true, message: 'Subscription resumed.', subscription });
    } catch (err) {
      return next(err);
    }
  });

  app.post('/api/subscriptions/:id/skip', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = SubscriptionSkipSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: parsed.error.issues[0]?.message || 'Valid skipDate (YYYY-MM-DD) is required',
        });
      }
      const env: WorkerEnv = (req as any).env;
      const user: AuthUser = (req as any).user;
      const db = requireD1(env);
      await skipSubscriptionDateInD1(db, user, req.params.id, parsed.data.skipDate, parsed.data.reason);
      return res.json({
        success: true,
        message: `Delivery skipped for ${parsed.data.skipDate}.`,
        skipDate: parsed.data.skipDate,
      });
    } catch (err) {
      return next(err);
    }
  });

  app.delete('/api/subscriptions/:id/skip/:date', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dateParam = req.params.date;
      if (!YMD_REGEX.test(dateParam)) {
        return next(new BadRequestError('Date parameter must be YYYY-MM-DD.'));
      }
      const env: WorkerEnv = (req as any).env;
      const user: AuthUser = (req as any).user;
      const db = requireD1(env);
      await createD1Repo(db).forUser(user).subscriptions.removeSkipDate(req.params.id, dateParam);
      return res.json({
        success: true,
        message: `Skip date ${dateParam} removed.`,
      });
    } catch (err) {
      return next(err);
    }
  });

  // =========================================================================
  // 5. DEALER VIEWS (Strictly Scoped to Dealer's Customers & Territory)
  // =========================================================================
  app.get(
    '/api/dealer/customers',
    requireAuth,
    requireRole(['dealer', 'manager', 'super_admin']),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const env: WorkerEnv = (req as any).env;
        const user: AuthUser = (req as any).user;
        const db = requireD1(env);
        const { limit, offset } = parseLimitOffset(req);
        const data = await createD1Repo(db).forUser(user).dealerCustomers.list({ limit, offset });
        return res.json({ success: true, customers: data.items, limit: data.limit, offset: data.offset });
      } catch (err) {
        return next(err);
      }
    }
  );

  app.get(
    '/api/dealer/deliveries',
    requireAuth,
    requireRole(['dealer', 'manager', 'super_admin']),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const env: WorkerEnv = (req as any).env;
        const user: AuthUser = (req as any).user;
        const db = requireD1(env);
        const { limit, offset } = parseLimitOffset(req);

        const rawDate = typeof req.query.date === 'string' ? req.query.date : undefined;
        if (rawDate && !YMD_REGEX.test(rawDate)) {
          return next(new BadRequestError('Query parameter "date" must be YYYY-MM-DD.'));
        }
        const rawStatus = typeof req.query.status === 'string' ? (req.query.status as OrderStatus) : undefined;
        if (rawStatus && !ALLOWED_ORDER_STATUSES.has(rawStatus)) {
          return next(new BadRequestError('Invalid order status filter.'));
        }
        const rawType = typeof req.query.orderType === 'string' ? (req.query.orderType as OrderType) : undefined;
        if (rawType && !ALLOWED_ORDER_TYPES.has(rawType)) {
          return next(new BadRequestError('Invalid orderType filter.'));
        }

        const data = await createD1Repo(db).forUser(user).orders.list({
          deliveryDate: rawDate,
          status: rawStatus,
          orderType: rawType,
          limit,
          offset,
        });
        return res.json({ success: true, deliveries: data.items, limit: data.limit, offset: data.offset });
      } catch (err) {
        return next(err);
      }
    }
  );

  app.get(
    '/api/dealer/summary',
    requireAuth,
    requireRole(['dealer', 'manager', 'super_admin']),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const env: WorkerEnv = (req as any).env;
        const user: AuthUser = (req as any).user;
        const db = requireD1(env);
        const rawDate = typeof req.query.date === 'string' ? req.query.date : undefined;
        if (rawDate && !YMD_REGEX.test(rawDate)) {
          return next(new BadRequestError('Query parameter "date" must be YYYY-MM-DD.'));
        }
        const summary = await getDealerSummaryInD1(db, user, rawDate);
        return res.json({ success: true, summary });
      } catch (err) {
        return next(err);
      }
    }
  );

  // =========================================================================
  // 6. ADMIN / MANAGER OPERATIONAL VIEWS & WRITES (KV Cache Invalidation)
  // =========================================================================
  app.get(
    '/api/admin/reports/summary',
    requireAuth,
    requireRole(['super_admin', 'manager']),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const env: WorkerEnv = (req as any).env;
        const db = requireD1(env);
        const rawDate = typeof req.query.date === 'string' ? req.query.date : undefined;
        if (rawDate && !YMD_REGEX.test(rawDate)) {
          return next(new BadRequestError('Query parameter "date" must be YYYY-MM-DD.'));
        }
        const summary = await getAdminReportsSummaryInD1(db, rawDate);
        return res.json({ success: true, summary });
      } catch (err) {
        return next(err);
      }
    }
  );

  app.get(
    '/api/admin/enquiries',
    requireAuth,
    requireRole(['super_admin', 'manager']),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const env: WorkerEnv = (req as any).env;
        const db = requireD1(env);
        const { limit, offset } = parseLimitOffset(req);
        const rawStatus = typeof req.query.status === 'string' ? (req.query.status as EnquiryStatus) : undefined;
        if (rawStatus && !ALLOWED_ENQUIRY_STATUSES.has(rawStatus)) {
          return next(new BadRequestError('Invalid enquiry status filter.'));
        }
        const data = await listEnquiriesInD1(db, { status: rawStatus, limit, offset });
        return res.json({ success: true, enquiries: data.items, limit: data.limit, offset: data.offset });
      } catch (err) {
        return next(err);
      }
    }
  );

  app.patch(
    '/api/admin/enquiries/:id',
    requireAuth,
    requireRole(['super_admin', 'manager']),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const parsed = UpdateEnquirySchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            success: false,
            error: parsed.error.issues[0]?.message || 'Invalid enquiry status payload',
          });
        }
        const env: WorkerEnv = (req as any).env;
        const user: AuthUser = (req as any).user;
        const db = requireD1(env);
        await updateEnquiryStatusInD1(db, user, req.params.id, parsed.data.status);
        return res.json({ success: true, message: 'Enquiry status updated.' });
      } catch (err) {
        return next(err);
      }
    }
  );

  app.get(
    '/api/admin/reviews',
    requireAuth,
    requireRole(['super_admin', 'manager']),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const env: WorkerEnv = (req as any).env;
        const db = requireD1(env);
        const { limit, offset } = parseLimitOffset(req);
        const rawStatus = typeof req.query.status === 'string' ? (req.query.status as ReviewStatus) : undefined;
        if (rawStatus && !ALLOWED_REVIEW_STATUSES.has(rawStatus)) {
          return next(new BadRequestError('Invalid review status filter.'));
        }

        const result = rawStatus
          ? await db
              .prepare(
                `SELECT id, product_id, user_id, author_name, author_city, rating,
                        title, comment, verified_purchase, status, created_at, updated_at
                 FROM reviews
                 WHERE status = ?
                 ORDER BY created_at DESC
                 LIMIT ? OFFSET ?`
              )
              .bind(rawStatus, limit, offset)
              .all<ReviewRow>()
          : await db
              .prepare(
                `SELECT id, product_id, user_id, author_name, author_city, rating,
                        title, comment, verified_purchase, status, created_at, updated_at
                 FROM reviews
                 ORDER BY created_at DESC
                 LIMIT ? OFFSET ?`
              )
              .bind(limit, offset)
              .all<ReviewRow>();

        return res.json({ success: true, reviews: result.results || [], limit, offset });
      } catch (err) {
        return next(err);
      }
    }
  );

  app.patch(
    '/api/admin/reviews/:id',
    requireAuth,
    requireRole(['super_admin', 'manager']),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const parsed = ModerateReviewSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            success: false,
            error: parsed.error.issues[0]?.message || 'Invalid review moderation payload',
          });
        }
        const env: WorkerEnv = (req as any).env;
        const user: AuthUser = (req as any).user;
        const db = requireD1(env);
        await moderateReviewInD1(db, user, req.params.id, parsed.data.status, getClientIp(req));
        return res.json({ success: true, message: `Review marked ${parsed.data.status}.` });
      } catch (err) {
        return next(err);
      }
    }
  );

  app.patch(
    '/api/admin/variants/:id',
    requireAuth,
    requireRole(['super_admin', 'manager']),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const parsed = AdminVariantUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            success: false,
            error: parsed.error.issues[0]?.message || 'Invalid variant update payload',
          });
        }
        const env: WorkerEnv = (req as any).env;
        const user: AuthUser = (req as any).user;
        const db = requireD1(env);
        const variant = await adminUpdateVariantInD1(db, user, req.params.id, parsed.data, getClientIp(req));
        await invalidateCatalogCache(env);
        return res.json({ success: true, variant });
      } catch (err) {
        return next(err);
      }
    }
  );

  app.patch(
    '/api/admin/plans/:id',
    requireAuth,
    requireRole(['super_admin', 'manager']),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const parsed = AdminPlanUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            success: false,
            error: parsed.error.issues[0]?.message || 'Invalid plan update payload',
          });
        }
        const env: WorkerEnv = (req as any).env;
        const user: AuthUser = (req as any).user;
        const db = requireD1(env);
        const plan = await adminUpdatePlanInD1(db, user, req.params.id, parsed.data, getClientIp(req));
        await invalidateCatalogCache(env);
        return res.json({ success: true, plan });
      } catch (err) {
        return next(err);
      }
    }
  );

  app.patch(
    '/api/admin/site-settings/:key',
    requireAuth,
    requireRole(['super_admin', 'manager']),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const settingKey = req.params.key;
        if (!SITE_SETTING_KEY_REGEX.test(settingKey)) {
          return next(new BadRequestError('Invalid site setting key format.'));
        }
        const parsed = AdminSiteSettingUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            success: false,
            error: parsed.error.issues[0]?.message || 'Invalid site setting payload',
          });
        }
        const env: WorkerEnv = (req as any).env;
        const user: AuthUser = (req as any).user;
        const db = requireD1(env);
        await adminUpsertSiteSettingInD1(db, user, settingKey, parsed.data.value, getClientIp(req));
        await invalidateCatalogCache(env);
        return res.json({ success: true, key: settingKey, message: 'Site setting updated.' });
      } catch (err) {
        return next(err);
      }
    }
  );

  app.post(
    '/api/admin/dealers/:dealerId/pincodes',
    requireAuth,
    requireRole(['super_admin']),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const parsed = DealerPincodesAssignSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            success: false,
            error: parsed.error.issues[0]?.message || 'Valid array of 6-digit pincodes is required',
          });
        }
        const env: WorkerEnv = (req as any).env;
        const user: AuthUser = (req as any).user;
        const db = requireD1(env);
        await assignDealerPincodesInD1(db, user, req.params.dealerId, parsed.data.pincodes, getClientIp(req));
        return res.json({
          success: true,
          dealerId: req.params.dealerId,
          pincodes: parsed.data.pincodes,
        });
      } catch (err) {
        return next(err);
      }
    }
  );

  app.post(
    '/api/admin/dealers/:dealerId/customers',
    requireAuth,
    requireRole(['super_admin', 'manager']),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const parsed = DealerCustomerAssignSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            success: false,
            error: parsed.error.issues[0]?.message || 'Valid customerId is required',
          });
        }
        const env: WorkerEnv = (req as any).env;
        const user: AuthUser = (req as any).user;
        const db = requireD1(env);
        await assignDealerCustomerInD1(db, user, req.params.dealerId, parsed.data.customerId, getClientIp(req));
        return res.json({
          success: true,
          dealerId: req.params.dealerId,
          customerId: parsed.data.customerId,
        });
      } catch (err) {
        return next(err);
      }
    }
  );
}
