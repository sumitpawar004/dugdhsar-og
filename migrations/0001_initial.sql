-- DUGDHSAR Cold-Chain Dairy Production Schema (Cloudflare D1 SQLite)
-- 3NF Normalized Relational Schema with Indexes, Foreign Keys & Soft Deletes

-- 1. users (Patrons, Dealers, Super Admins)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('customer', 'dealer', 'super_admin')),
  avatar_url TEXT,
  dealer_id TEXT,
  assigned_pincodes_json TEXT, -- JSON array of pincodes, e.g. ["480661"]
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_dealer ON users(dealer_id) WHERE dealer_id IS NOT NULL;

-- 2. products (Vedic Gir Cow Dairy Master)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  hindi_name TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  description TEXT NOT NULL,
  heritage_story TEXT,
  purity_score INTEGER NOT NULL DEFAULT 500,
  is_subscription_eligible INTEGER NOT NULL DEFAULT 1,
  is_published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_slug);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- 3. product_variants (Sizes, SKUs, and Prices in Integer Paise)
CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_label TEXT NOT NULL,
  price_paise INTEGER NOT NULL CHECK(price_paise >= 0),
  compare_at_price_paise INTEGER,
  sku TEXT NOT NULL UNIQUE,
  is_subscription_eligible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);

-- 4. inventory_batches (FEFO Expiry-First Cold-Chain Tracking)
CREATE TABLE IF NOT EXISTS inventory_batches (
  id TEXT PRIMARY KEY,
  batch_number TEXT NOT NULL UNIQUE,
  variant_id TEXT NOT NULL REFERENCES product_variants(id),
  mfg_date TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  initial_quantity INTEGER NOT NULL,
  on_hand_quantity INTEGER NOT NULL CHECK(on_hand_quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK(reserved_quantity >= 0),
  cold_chain_temp_c REAL NOT NULL DEFAULT 3.0,
  is_quarantined INTEGER NOT NULL DEFAULT 0,
  quarantine_reason TEXT,
  status TEXT NOT NULL CHECK(status IN ('active', 'quarantined', 'expired', 'depleted')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_batches_variant_expiry ON inventory_batches(variant_id, expiry_date);
CREATE INDEX IF NOT EXISTS idx_batches_status ON inventory_batches(status);

-- 5. inventory_movements (Immutable Audit of Inventory Draining/Restocking)
CREATE TABLE IF NOT EXISTS inventory_movements (
  id TEXT PRIMARY KEY,
  batch_id TEXT REFERENCES inventory_batches(id),
  variant_id TEXT NOT NULL,
  delta INTEGER NOT NULL,
  movement_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  actor_email TEXT,
  reference_id TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_movements_batch ON inventory_movements(batch_id);

-- 6. orders (Transactions strictly recorded in integer paise)
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  dealer_id TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending', 'confirmed', 'processing', 'dispatched', 'out_for_delivery', 'delivered', 'cancelled', 'returned')),
  subtotal_paise INTEGER NOT NULL,
  tax_paise INTEGER NOT NULL DEFAULT 0,
  shipping_paise INTEGER NOT NULL DEFAULT 0,
  discount_paise INTEGER NOT NULL DEFAULT 0,
  total_paise INTEGER NOT NULL,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cod', 'upi', 'card', 'netbanking', 'razorpay')),
  payment_status TEXT NOT NULL CHECK(payment_status IN ('pending', 'captured', 'due_on_delivery', 'failed', 'refunded')),
  shipping_address_json TEXT NOT NULL,
  delivery_slot TEXT NOT NULL,
  delivery_pincode TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_dealer ON orders(dealer_id, created_at) WHERE dealer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_pincode ON orders(delivery_pincode);

-- 7. order_items (Immutable Price & Product Snapshot)
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id TEXT NOT NULL,
  product_name_snapshot TEXT NOT NULL,
  size_snapshot TEXT NOT NULL,
  price_paise_snapshot INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  total_paise INTEGER NOT NULL,
  image_url_snapshot TEXT
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- 8. subscriptions (Recurring Daily/Alternate Cold-Chain Milk)
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  dealer_id TEXT,
  product_name TEXT NOT NULL,
  variant TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'alternate_days', 'weekly', 'custom', 'weekdays')),
  delivery_slot TEXT NOT NULL,
  delivery_address_json TEXT NOT NULL,
  start_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('active', 'paused', 'cancelled')),
  next_delivery TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_dealer ON subscriptions(dealer_id, status) WHERE dealer_id IS NOT NULL;

-- 9. audit_logs (Immutable Administrative Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details_json TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs(target_type, target_id);

-- 10. idempotency_keys (24-Hour Replay Deduplication)
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT PRIMARY KEY,
  request_hash TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_keys(expires_at);
