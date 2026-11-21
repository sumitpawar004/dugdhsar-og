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

CREATE TABLE IF NOT EXISTS subscription_pauses (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  skip_date TEXT NOT NULL CHECK (skip_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  reason TEXT,
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE (subscription_id, skip_date)
);

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
