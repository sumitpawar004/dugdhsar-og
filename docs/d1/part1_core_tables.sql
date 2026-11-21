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

CREATE TABLE IF NOT EXISTS dealers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  business_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS dealer_pincodes (
  dealer_id TEXT NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  pincode TEXT NOT NULL CHECK (pincode GLOB '[0-9][0-9][0-9][0-9][0-9][0-9]'),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  PRIMARY KEY (dealer_id, pincode)
);
CREATE INDEX IF NOT EXISTS idx_dealer_pincodes_pincode ON dealer_pincodes(pincode);

CREATE TABLE IF NOT EXISTS dealer_customers (
  id TEXT PRIMARY KEY,
  dealer_id TEXT NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  assigned_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_dealer_customers_dealer ON dealer_customers(dealer_id);

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
