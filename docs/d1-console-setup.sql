-- ============================================================================
-- DUGDHSAR — Cloudflare D1 Console All-In-One Idempotent Setup Script
-- ============================================================================
-- HOW TO USE (No Terminal Needed):
--   1. Open Cloudflare Dashboard -> Workers & Pages -> D1 SQL Database
--   2. Select database: dugdhsar-prod (binding: DB)
--   3. Open the "Console" tab
--   4. Copy & paste this ENTIRE file and click "Execute"
--
-- Safe to re-run multiple times: uses CREATE TABLE IF NOT EXISTS,
-- CREATE INDEX IF NOT EXISTS, and INSERT OR IGNORE everywhere.
-- Combines: migrations/0001_init.sql + migrations/0002_seed_products.sql
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ============================================================================
-- PART 1: SCHEMA (migrations/0001_init.sql)
-- ============================================================================

-- 1. users
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

-- 2. dealers
CREATE TABLE IF NOT EXISTS dealers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  business_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 3. dealer_pincodes
CREATE TABLE IF NOT EXISTS dealer_pincodes (
  dealer_id TEXT NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  pincode TEXT NOT NULL CHECK (pincode GLOB '[0-9][0-9][0-9][0-9][0-9][0-9]'),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  PRIMARY KEY (dealer_id, pincode)
);
CREATE INDEX IF NOT EXISTS idx_dealer_pincodes_pincode ON dealer_pincodes(pincode);

-- 4. dealer_customers
CREATE TABLE IF NOT EXISTS dealer_customers (
  id TEXT PRIMARY KEY,
  dealer_id TEXT NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  assigned_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_dealer_customers_dealer ON dealer_customers(dealer_id);

-- 5. addresses
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

-- 6. products
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

-- 7. product_variants
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

-- 8. plans
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

-- 9. subscriptions
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

-- 10. subscription_pauses
CREATE TABLE IF NOT EXISTS subscription_pauses (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  skip_date TEXT NOT NULL CHECK (skip_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  reason TEXT,
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE (subscription_id, skip_date)
);

-- 11. subscription_invoices
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

-- 12. coupons
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

-- 13. orders
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

-- 14. order_items
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

-- 15. coupon_redemptions
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id TEXT PRIMARY KEY,
  coupon_id TEXT NOT NULL REFERENCES coupons(id) ON DELETE RESTRICT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  order_id TEXT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  discount_paise INTEGER NOT NULL CHECK (discount_paise >= 0),
  redeemed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user ON coupon_redemptions(coupon_id, user_id);

-- 16. payments
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

-- 17. webhook_events
CREATE TABLE IF NOT EXISTS webhook_events (
  event_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('razorpay')),
  event_type TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  processed_at TEXT
);

-- 18. reviews
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

-- 19. enquiries
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

-- 20. audit_logs
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

-- 21. idempotency_keys
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

-- 22. revoked_sessions
CREATE TABLE IF NOT EXISTS revoked_sessions (
  jti TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  revoked_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  expires_at TEXT NOT NULL
);

-- 23. site_settings
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- ============================================================================
-- PART 2: SEED DATA (migrations/0002_seed_products.sql)
-- Catalog, default plans & default site settings ONLY (NO fake user data)
-- ============================================================================

INSERT OR IGNORE INTO products (
  id, slug, name, hindi_name, category, description, heritage_story, badge,
  image_url, shelf_life, purity_score, is_subscription_eligible, is_active, display_order
) VALUES
  (
    'dug-whole-milk',
    'a2-desi-cow-whole-milk',
    'DUGDHSAR Fresh A2 Desi Cow Whole Milk',
    'शुद्ध देशी गौ दुग्ध',
    'milk',
    'Farm-fresh raw & gentle low-temp vat-pasteurized A2 milk from indigenous Gir cows. Bottled pure in sterile recyclable glass bottles within 3 hours of milking.',
    'Produced exclusively from free-grazing Vedic Gir cows roaming organic pastures in Seoni district.',
    'Morning Milking Best Seller',
    '/assets/aistudio/image_fe6cbcdf.png',
    '3 Days under continuous 2°C - 4°C refrigeration',
    488, 1, 1, 1
  ),
  (
    'dug-skimmed-milk',
    'a2-light-skimmed-milk',
    'DUGDHSAR Fresh A2 Light Skimmed Milk',
    'देशी गौ टोंड दुग्ध',
    'milk',
    'Light, crisp, and easily digestible A2 milk with natural fats gently separated through physical centrifugal spin without any chemical thickeners.',
    'Ideal for weight management, morning tea, and individuals seeking low-fat A2 dairy.',
    'Low Calorie & Heart Friendly',
    '/assets/aistudio/image_fe6cbcdf.png',
    '3 Days under 2°C - 4°C refrigeration',
    492, 1, 1, 2
  ),
  (
    'dug-buffalo-milk',
    'pure-desi-buffalo-milk',
    'DUGDHSAR Pure Desi Murrah Buffalo Whole Milk',
    'शुद्ध देशी मुर्राह भैंस का ताज़ा दूध',
    'milk',
    'Farm-fresh unadulterated pure Murrah buffalo whole milk delivered in sterilized glass bottles. Naturally thick with rich clotted malai and high calcium.',
    'Sourced from free-ranging indigenous Murrah buffaloes raised with green fodder and ethical care in Seoni.',
    'Rich & Creamy 7.5% Fat',
    '/assets/aistudio/image_fe6cbcdf.png',
    '3 Days under continuous 2°C - 4°C refrigeration',
    494, 1, 1, 3
  ),
  (
    'dug-bilona-ghee',
    'vedic-bilona-cow-ghee',
    'DUGDHSAR Vedic Traditional Bilona Cow Ghee',
    'वैदिक बिलोना देशी गौ घृत',
    'ghee',
    'Handcrafted following ancient 5-stage Vedic Vidhi: whole A2 milk boiled on slow fire, set into curd, hand-churned in wooden bilona to yield Makhan, then simmered into golden danedar ghee.',
    'Rich in golden beta-carotene from indigenous Gir cow grass feeding, with authentic nutty aroma and granular texture.',
    'Curd-Churned Vedic Bilona',
    '/assets/aistudio/1000095624-clean_337007be.png',
    '12 Months at room temperature in airtight glass jar',
    497, 0, 1, 4
  ),
  (
    'dug-malai-paneer',
    'a2-malai-cottage-cheese-paneer',
    'DUGDHSAR Fresh A2 Malai Cottage Cheese (Paneer)',
    'शुद्ध देशी मलाई पनीर',
    'paneer',
    'Ultra-soft, velvety fresh paneer made by naturally curdling morning Gir cow milk with pure lemon extract and whey. Squeezed gently in clean muslin cloth without starch or additives.',
    'Prepared in limited small batches every dawn so every cube stays pillowy soft.',
    'Soft & Melt-In-Mouth',
    '/assets/aistudio/1000095664-clean_2425f7fb.png',
    '4 Days under 2°C - 4°C refrigeration in brine water',
    494, 1, 1, 5
  ),
  (
    'dug-probiotic-curd',
    'clay-pot-natural-vedic-dahi-curd',
    'DUGDHSAR Clay-Pot Natural Vedic Dahi (Curd)',
    'पारंपरिक मटका दही',
    'curd',
    'Thick, luscious dahi set slowly in unglazed terracotta clay pots that naturally breathe and absorb excess whey. Cultured using heirloom indigenous starter curd rich in live probiotics.',
    'Earthen pot setting imparts a gentle earthy fragrance and naturally sweet thickness.',
    'Traditional Clay Matka Set',
    '/assets/aistudio/1000095624-clean_337007be.png',
    '5 Days under 4°C refrigeration',
    496, 1, 1, 6
  ),
  (
    'dug-white-butter',
    'vedic-cultured-white-butter-makhan',
    'DUGDHSAR Vedic Cultured White Butter (Makhan)',
    'ताज़ा सफेद मक्खन',
    'butter',
    'Fresh unsalted white butter churned gently every morning from cultured A2 malai. Creamy, cooling, and packed with delicate natural pasture aroma.',
    'Traditional hand-churned unsalted white makhan with zero artificial yellow dyes.',
    'Hand-Churned Makhan',
    '/assets/aistudio/1000095664-clean_2425f7fb.png',
    '10 Days refrigerated, 30 days frozen',
    493, 1, 1, 7
  ),
  (
    'dug-vedic-khoya',
    'pure-vedic-a2-danedar-khoya-mawa',
    'DUGDHSAR Pure Vedic A2 Danedar Khoya (Mawa)',
    'शुद्ध देशी गौ खोया मावा',
    'khoya-mawa',
    'Authentic A2 Gir cow milk khoya made by continuous slow evaporation of pure whole milk in heavy iron kadhais. Free from synthetic fat, starch, or bleaching agents.',
    'Essential for sacred festival sweets, gujiyas, pedas, and gulab jamuns.',
    'Slow Iron-Kadhai Simmered',
    '/assets/aistudio/1000095665-clean_9f8d49b7.png',
    '7 Days refrigerated at 2°C - 4°C, 30 days frozen',
    497, 0, 1, 8
  );

INSERT OR IGNORE INTO product_variants (
  id, product_id, sku, size_label, unit_ml_or_g, price_paise, compare_at_price_paise,
  stock_qty, is_subscription_eligible, is_active
) VALUES
  ('wm-1l', 'dug-whole-milk', 'DUG-MILK-1L', '1 Litre Glass Bottle', 1000, 17000, 19000, 150, 1, 1),
  ('wm-500ml', 'dug-whole-milk', 'DUG-MILK-500M', '500 ml Glass Bottle', 500, 9500, 10500, 90, 1, 1),
  ('wm-combo-2l', 'dug-whole-milk', 'DUG-MILK-2L-PK', 'Family Pack (2 x 1L Bottles)', 2000, 33000, 38000, 60, 1, 1),
  ('sm-1l', 'dug-skimmed-milk', 'DUG-SKIM-1L', '1 Litre Glass Bottle', 1000, 11000, 12500, 85, 1, 1),
  ('sm-500ml', 'dug-skimmed-milk', 'DUG-SKIM-500M', '500 ml Glass Bottle', 500, 6500, 7500, 50, 1, 1),
  ('bm-1l', 'dug-buffalo-milk', 'DUG-BUF-1L', '1 Litre Glass Bottle', 1000, 19000, 21000, 120, 1, 1),
  ('bm-500ml', 'dug-buffalo-milk', 'DUG-BUF-500M', '500 ml Glass Bottle', 500, 10500, 11500, 70, 1, 1),
  ('bm-combo-2l', 'dug-buffalo-milk', 'DUG-BUF-2L-PK', 'Family Pack (2 x 1L Bottles)', 2000, 37000, 42000, 45, 1, 1),
  ('bg-500ml', 'dug-bilona-ghee', 'DUG-GHEE-500M', '500 ml Heritage Glass Jar', 500, 119900, 135000, 120, 0, 1),
  ('bg-1l', 'dug-bilona-ghee', 'DUG-GHEE-1L', '1 Litre Heritage Glass Jar', 1000, 239800, 270000, 80, 0, 1),
  ('bg-combo-2l', 'dug-bilona-ghee', 'DUG-GHEE-2L-PK', 'Grand Pack (2 x 1L Jars)', 2000, 460000, 540000, 30, 0, 1),
  ('mp-250g', 'dug-malai-paneer', 'DUG-PAN-250G', '250 grams Vacuum Pouch', 250, 16000, 18000, 110, 1, 1),
  ('mp-500g', 'dug-malai-paneer', 'DUG-PAN-500G', '500 grams Vacuum Pouch', 500, 31000, 35000, 75, 1, 1),
  ('mp-1kg', 'dug-malai-paneer', 'DUG-PAN-1KG', '1 Kilogram Master Block', 1000, 60000, 70000, 40, 1, 1),
  ('cd-500g', 'dug-probiotic-curd', 'DUG-CURD-500G', '500g Terracotta Clay Pot', 500, 11000, 12500, 95, 1, 1),
  ('cd-1kg', 'dug-probiotic-curd', 'DUG-CURD-1KG', '1 Kilogram Master Clay Pot', 1000, 21000, 24000, 60, 1, 1),
  ('wb-250g', 'dug-white-butter', 'DUG-MAKH-250G', '250g Fresh Container', 250, 22000, 25000, 70, 1, 1),
  ('wb-500g', 'dug-white-butter', 'DUG-MAKH-500G', '500g Fresh Container', 500, 42000, 48000, 45, 1, 1),
  ('kh-250g', 'dug-vedic-khoya', 'DUG-KHOY-250G', '250g Vacuum Seal', 250, 24000, 27500, 55, 0, 1),
  ('kh-500g', 'dug-vedic-khoya', 'DUG-KHOY-500G', '500g Vacuum Seal', 500, 46000, 52000, 40, 0, 1),
  ('kh-1kg', 'dug-vedic-khoya', 'DUG-KHOY-1KG', '1 Kilogram Master Brick', 1000, 90000, 102000, 25, 0, 1);

INSERT OR IGNORE INTO plans (
  id, code, name, product_id, variant_id, milk_type, frequency, price_paise, billing_cycle, is_active
) VALUES
  ('plan-cow-daily-1l', 'COW_DAILY_1L', 'Gir Cow A2 Milk — Daily 1L (Monthly Prepaid)', 'dug-whole-milk', 'wm-1l', 'cow', 'daily', 17000, 'prepaid_monthly', 1),
  ('plan-cow-daily-500ml', 'COW_DAILY_500ML', 'Gir Cow A2 Milk — Daily 500ml (Monthly Prepaid)', 'dug-whole-milk', 'wm-500ml', 'cow', 'daily', 9500, 'prepaid_monthly', 1),
  ('plan-cow-alt-1l', 'COW_ALT_1L', 'Gir Cow A2 Milk — Alternate Days 1L (Monthly Prepaid)', 'dug-whole-milk', 'wm-1l', 'cow', 'alternate_days', 17000, 'prepaid_monthly', 1),
  ('plan-cow-weekly-1l', 'COW_WEEKLY_1L', 'Gir Cow A2 Milk — Daily 1L (Weekly Prepaid)', 'dug-whole-milk', 'wm-1l', 'cow', 'daily', 17000, 'prepaid_weekly', 1),
  ('plan-buf-daily-1l', 'BUF_DAILY_1L', 'Murrah Buffalo Milk — Daily 1L (Monthly Prepaid)', 'dug-buffalo-milk', 'bm-1l', 'buffalo', 'daily', 19000, 'prepaid_monthly', 1),
  ('plan-buf-daily-500ml', 'BUF_DAILY_500ML', 'Murrah Buffalo Milk — Daily 500ml (Monthly Prepaid)', 'dug-buffalo-milk', 'bm-500ml', 'buffalo', 'daily', 10500, 'prepaid_monthly', 1),
  ('plan-buf-alt-1l', 'BUF_ALT_1L', 'Murrah Buffalo Milk — Alternate Days 1L (Monthly Prepaid)', 'dug-buffalo-milk', 'bm-1l', 'buffalo', 'alternate_days', 19000, 'prepaid_monthly', 1),
  ('plan-skim-daily-1l', 'SKIM_DAILY_1L', 'A2 Light Skimmed Milk — Daily 1L (Monthly Prepaid)', 'dug-skimmed-milk', 'sm-1l', 'skimmed', 'daily', 11000, 'prepaid_monthly', 1);

INSERT OR IGNORE INTO site_settings (key, value_json) VALUES
  (
    'delivery_zones',
    '[{"id":"dz-seoni-central","zoneName":"Seoni Town & Barghat Road Cold Hub","city":"Seoni","state":"Madhya Pradesh","pincodes":["480661"],"minOrderPaise":15000,"deliveryFeePaise":0,"freeDeliveryThresholdPaise":25000,"isActive":true},{"id":"dz-sukla-pastures","zoneName":"Sukla Gaushala & Environs Hub","city":"Sukla","state":"Madhya Pradesh","pincodes":["480771"],"minOrderPaise":15000,"deliveryFeePaise":0,"freeDeliveryThresholdPaise":25000,"isActive":true}]'
  ),
  (
    'delivery_slots',
    '[{"id":"morning","slotName":"Morning Delivery (5:00 AM - 10:00 AM)","cutoffIst":"21:00","isActive":true},{"id":"evening","slotName":"Evening Fresh Delivery (6:00 PM - 10:00 PM)","cutoffIst":"16:00","isActive":true}]'
  ),
  (
    'store_banner',
    '{"enabled":true,"text":"Pure Vedic A2 Gir Cow & Murrah Buffalo Dairy — Twice Daily Cold-Chain Delivery in Seoni, MP"}'
  );
