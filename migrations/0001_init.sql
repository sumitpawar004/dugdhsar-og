-- ============================================================================
-- DUGDHSAR Production Database Schema — Migration 0001
-- Target: Cloudflare D1 (SQLite) | Database: dugdhsar-prod | Binding: DB
-- Conventions:
--   * IDs: TEXT UUIDv7 / ULID generated in app (order_number is separate)
--   * Money: INTEGER paise (e.g. 17000 = Rs 170.00), never floats
--   * Timestamps: UTC ISO-8601 TEXT via strftime('%Y-%m-%dT%H:%M:%SZ','now')
--   * Delivery Dates: 'YYYY-MM-DD' in IST (Asia/Kolkata)
--   * Coordinates: REAL rounded to 6 decimals
--   * Idempotent: Safe to re-run in Cloudflare D1 Console
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- 1. users (Customers, Dealers, Managers, Super Admins)
--    * super_admin is determined ONLY by SUPER_ADMIN_EMAILS Worker secret.
--    * manager & dealer accounts are managed in D1 by super_admin.
--    * On account deletion, PII is anonymized while email_hash + google_sub
--      allow re-signup with the same email to reactivate the existing row.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  google_sub TEXT UNIQUE,
  email TEXT NOT NULL UNIQUE CHECK (email = lower(email)),
  email_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT CHECK (
    phone IS NULL
    OR phone GLOB '[6-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'
    OR phone GLOB '+91[6-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'
  ),
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('super_admin', 'manager', 'dealer', 'customer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  deleted_at TEXT
);

-- ----------------------------------------------------------------------------
-- 2. dealers (B2B / Territory Distribution Partners)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dealers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  business_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- ----------------------------------------------------------------------------
-- 3. dealer_pincodes (Normalized dealer serviceable pincode mapping)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dealer_pincodes (
  dealer_id TEXT NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  pincode TEXT NOT NULL CHECK (pincode GLOB '[0-9][0-9][0-9][0-9][0-9][0-9]'),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  PRIMARY KEY (dealer_id, pincode)
);
CREATE INDEX IF NOT EXISTS idx_dealer_pincodes_pincode ON dealer_pincodes(pincode);

-- ----------------------------------------------------------------------------
-- 4. dealer_customers (Dealer-to-Customer Ownership Mapping)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dealer_customers (
  id TEXT PRIMARY KEY,
  dealer_id TEXT NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  assigned_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_dealer_customers_dealer ON dealer_customers(dealer_id);

-- ----------------------------------------------------------------------------
-- 5. addresses (Customer Delivery Addresses with Lat/Lng)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  recipient_name TEXT NOT NULL,
  phone TEXT CHECK (
    phone IS NULL
    OR phone GLOB '[6-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'
    OR phone GLOB '+91[6-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'
  ),
  line1 TEXT NOT NULL,
  line2 TEXT,
  landmark TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Madhya Pradesh',
  pincode TEXT NOT NULL CHECK (pincode GLOB '[0-9][0-9][0-9][0-9][0-9][0-9]'),
  lat REAL CHECK (lat IS NULL OR (lat >= -90.0 AND lat <= 90.0)),
  lng REAL CHECK (lng IS NULL OR (lng >= -180.0 AND lng <= 180.0)),
  is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id) WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 6. products (Master Dairy Catalog — 6 Approved Categories)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  hindi_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('milk', 'ghee', 'paneer', 'curd', 'butter', 'khoya-mawa')),
  description TEXT NOT NULL,
  heritage_story TEXT,
  badge TEXT,
  image_url TEXT NOT NULL,
  shelf_life TEXT,
  purity_score INTEGER NOT NULL DEFAULT 495 CHECK (purity_score BETWEEN 0 AND 500),
  is_subscription_eligible INTEGER NOT NULL DEFAULT 0 CHECK (is_subscription_eligible IN (0, 1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_products_cat_active ON products(category, is_active, display_order);

-- ----------------------------------------------------------------------------
-- 7. product_variants (Pack Sizes, SKUs, Paise Pricing & Atomic Stock)
--    Note: Cold-chain batches & stock reservations planned for migration 0003.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  size_label TEXT NOT NULL,
  unit_ml_or_g INTEGER NOT NULL CHECK (unit_ml_or_g > 0),
  price_paise INTEGER NOT NULL CHECK (price_paise >= 0),
  compare_at_price_paise INTEGER CHECK (compare_at_price_paise IS NULL OR compare_at_price_paise >= price_paise),
  stock_qty INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  is_subscription_eligible INTEGER NOT NULL DEFAULT 0 CHECK (is_subscription_eligible IN (0, 1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id, is_active);

-- ----------------------------------------------------------------------------
-- 8. plans (Milk & Dairy Subscription Plans — Admin/Manager Editable)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id TEXT NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  milk_type TEXT NOT NULL CHECK (milk_type IN ('cow', 'buffalo', 'skimmed', 'dairy')),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'alternate_days', 'weekdays', 'weekly')),
  price_paise INTEGER NOT NULL CHECK (price_paise >= 0),
  billing_cycle TEXT NOT NULL DEFAULT 'prepaid_monthly' CHECK (
    billing_cycle IN ('prepaid_weekly', 'prepaid_monthly', 'postpaid_monthly')
  ),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_plans_active ON plans(is_active, milk_type);

-- ----------------------------------------------------------------------------
-- 9. subscriptions (Recurring Daily / Alternate Milk Deliveries)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  dealer_id TEXT REFERENCES dealers(id) ON DELETE SET NULL,
  address_id TEXT NOT NULL REFERENCES addresses(id) ON DELETE RESTRICT,
  plan_id TEXT REFERENCES plans(id) ON DELETE SET NULL,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id TEXT NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'alternate_days', 'weekdays', 'weekly')),
  delivery_slot TEXT NOT NULL DEFAULT 'morning' CHECK (delivery_slot IN ('morning', 'evening')),
  unit_price_paise INTEGER NOT NULL CHECK (unit_price_paise >= 0),
  billing_cycle TEXT NOT NULL DEFAULT 'prepaid_monthly' CHECK (
    billing_cycle IN ('prepaid_weekly', 'prepaid_monthly', 'postpaid_monthly')
  ),
  paid_through_date TEXT CHECK (
    paid_through_date IS NULL OR paid_through_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
  ),
  start_date TEXT NOT NULL CHECK (start_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  next_delivery_date TEXT NOT NULL CHECK (next_delivery_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_subs_user_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subs_dealer_status ON subscriptions(dealer_id, status);
CREATE INDEX IF NOT EXISTS idx_subs_next_delivery ON subscriptions(status, next_delivery_date);

-- ----------------------------------------------------------------------------
-- 10. subscription_pauses (Individual Skip Dates in IST YYYY-MM-DD)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_pauses (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  skip_date TEXT NOT NULL CHECK (skip_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  reason TEXT,
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE (subscription_id, skip_date)
);

-- ----------------------------------------------------------------------------
-- 11. subscription_invoices (Weekly / Monthly Prepaid & Postpaid Billing Cycles)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE RESTRICT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  period_start TEXT NOT NULL CHECK (period_start GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  period_end TEXT NOT NULL CHECK (period_end GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  scheduled_deliveries INTEGER NOT NULL CHECK (scheduled_deliveries >= 0),
  skipped_deliveries INTEGER NOT NULL DEFAULT 0 CHECK (skipped_deliveries >= 0),
  amount_paise INTEGER NOT NULL CHECK (amount_paise >= 0),
  status TEXT NOT NULL DEFAULT 'due' CHECK (status IN ('draft', 'due', 'paid', 'partially_refunded', 'void')),
  due_date TEXT NOT NULL CHECK (due_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE (subscription_id, period_start, period_end)
);
CREATE INDEX IF NOT EXISTS idx_sub_invoices_user_status ON subscription_invoices(user_id, status);

-- ----------------------------------------------------------------------------
-- 12. coupons (Promotional Discount Codes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE CHECK (code = upper(code)),
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount')),
  value INTEGER NOT NULL CHECK (value > 0),
  min_order_paise INTEGER NOT NULL DEFAULT 0 CHECK (min_order_paise >= 0),
  max_discount_paise INTEGER CHECK (max_discount_paise IS NULL OR max_discount_paise >= 0),
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  per_user_limit INTEGER NOT NULL DEFAULT 1 CHECK (per_user_limit > 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  valid_from TEXT NOT NULL,
  valid_to TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- ----------------------------------------------------------------------------
-- 13. orders (One-Time Purchases + Daily Subscription Deliveries + Doorstep QR)
--     * order_number: human-friendly unique reference
--     * qr_token: >= 128-bit random (min 32 hex chars), single-use via
--       atomic UPDATE ... WHERE qr_token = ? AND qr_verified_at IS NULL
--     * Partial UNIQUE (subscription_id, delivery_date) makes evening cron idempotent
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  order_type TEXT NOT NULL DEFAULT 'one_time' CHECK (order_type IN ('one_time', 'subscription_delivery')),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  dealer_id TEXT REFERENCES dealers(id) ON DELETE SET NULL,
  subscription_id TEXT REFERENCES subscriptions(id) ON DELETE SET NULL,
  address_id TEXT REFERENCES addresses(id) ON DELETE SET NULL,
  coupon_id TEXT REFERENCES coupons(id) ON DELETE SET NULL,
  shipping_address_json TEXT NOT NULL,
  delivery_pincode TEXT NOT NULL CHECK (delivery_pincode GLOB '[0-9][0-9][0-9][0-9][0-9][0-9]'),
  delivery_date TEXT NOT NULL CHECK (delivery_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  delivery_slot TEXT NOT NULL DEFAULT 'morning' CHECK (delivery_slot IN ('morning', 'evening')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'processing', 'dispatched', 'out_for_delivery', 'delivered', 'cancelled', 'returned')
  ),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('razorpay', 'cod', 'upi_on_delivery')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    payment_status IN ('pending', 'paid', 'due_on_delivery', 'failed', 'refunded')
  ),
  subtotal_paise INTEGER NOT NULL CHECK (subtotal_paise >= 0),
  tax_paise INTEGER NOT NULL DEFAULT 0 CHECK (tax_paise >= 0),
  delivery_fee_paise INTEGER NOT NULL DEFAULT 0 CHECK (delivery_fee_paise >= 0),
  discount_paise INTEGER NOT NULL DEFAULT 0 CHECK (discount_paise >= 0),
  total_paise INTEGER NOT NULL CHECK (
    total_paise >= 0
    AND total_paise = subtotal_paise + tax_paise + delivery_fee_paise - discount_paise
  ),
  qr_token TEXT UNIQUE CHECK (qr_token IS NULL OR length(qr_token) >= 32),
  qr_verified_at TEXT,
  qr_verified_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  deleted_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_sub_date ON orders(subscription_id, delivery_date) WHERE subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_dealer_date ON orders(dealer_id, delivery_date, status);
CREATE INDEX IF NOT EXISTS idx_orders_status_date ON orders(status, delivery_date);

-- ----------------------------------------------------------------------------
-- 14. order_items (Immutable Product & Price Snapshot at Purchase Time)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id TEXT NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  product_name_snapshot TEXT NOT NULL,
  size_snapshot TEXT NOT NULL,
  unit_price_paise INTEGER NOT NULL CHECK (unit_price_paise >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_paise INTEGER NOT NULL CHECK (total_paise = unit_price_paise * quantity)
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ----------------------------------------------------------------------------
-- 15. coupon_redemptions (Per-User Coupon Usage Tracking)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id TEXT PRIMARY KEY,
  coupon_id TEXT NOT NULL REFERENCES coupons(id) ON DELETE RESTRICT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  order_id TEXT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  discount_paise INTEGER NOT NULL CHECK (discount_paise >= 0),
  redeemed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user ON coupon_redemptions(coupon_id, user_id);

-- ----------------------------------------------------------------------------
-- 16. payments (Razorpay / COD / UPI-on-Delivery Payment & Refund Ledger)
--     * Supports both one-time orders AND subscription billing payments.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES orders(id) ON DELETE RESTRICT,
  subscription_id TEXT REFERENCES subscriptions(id) ON DELETE RESTRICT,
  subscription_invoice_id TEXT REFERENCES subscription_invoices(id) ON DELETE RESTRICT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL CHECK (provider IN ('razorpay', 'cod', 'upi_on_delivery')),
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'created' CHECK (
    status IN ('created', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded')
  ),
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  refunded_amount_paise INTEGER NOT NULL DEFAULT 0 CHECK (
    refunded_amount_paise >= 0 AND refunded_amount_paise <= amount_paise
  ),
  currency TEXT NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  signature_verified INTEGER NOT NULL DEFAULT 0 CHECK (signature_verified IN (0, 1)),
  error_code TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  CHECK (order_id IS NOT NULL OR subscription_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id, status) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_sub ON payments(subscription_id, status) WHERE subscription_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 17. webhook_events (Razorpay Webhook Event Deduplication)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS webhook_events (
  event_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('razorpay')),
  event_type TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  processed_at TEXT
);

-- ----------------------------------------------------------------------------
-- 18. reviews (Customer Product Reviews with Moderation Workflow)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_city TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT NOT NULL,
  comment TEXT NOT NULL,
  verified_purchase INTEGER NOT NULL DEFAULT 0 CHECK (verified_purchase IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_reviews_product_status ON reviews(product_id, status, created_at DESC);

-- ----------------------------------------------------------------------------
-- 19. enquiries (Contact Form & Bulk B2B Leads)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enquiries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL CHECK (email = lower(email)),
  phone TEXT CHECK (
    phone IS NULL
    OR phone GLOB '[6-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'
    OR phone GLOB '+91[6-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'
  ),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'spam')),
  handled_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status, created_at DESC);

-- ----------------------------------------------------------------------------
-- 20. audit_logs (Important Admin / Financial / Security Events ONLY)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details_json TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- ----------------------------------------------------------------------------
-- 21. idempotency_keys (Race-Safe Replay Deduplication; cleaned by daily cron)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  route TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  expires_at TEXT NOT NULL
);

-- ----------------------------------------------------------------------------
-- 22. revoked_sessions (JWT JTI Blacklist; cleaned by daily cron)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS revoked_sessions (
  jti TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  revoked_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  expires_at TEXT NOT NULL
);

-- ----------------------------------------------------------------------------
-- 23. site_settings (Admin-Editable Site Settings & Delivery Zones Config)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
