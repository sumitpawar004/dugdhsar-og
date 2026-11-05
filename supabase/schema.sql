-- =========================================================================
-- DUGDHSAR — CANONICAL POSTGRESQL / SUPABASE 32-TABLE RELATIONAL SCHEMA
-- Architecture: Heritage Luxury Vedic A2 Dairy D2C & Local Cold-Chain System
-- All currency columns are BIGINT representing Integer Paise (₹1 = 100 paise)
-- Refer to /supabase/migrations/20261102000000_dugdhsar_comprehensive_schema.sql
-- =========================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'operations', 'admin', 'super_admin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ADDRESSES
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    flat_no TEXT NOT NULL,
    apartment TEXT NOT NULL,
    street TEXT NOT NULL,
    landmark TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode VARCHAR(6) NOT NULL CHECK (pincode ~ '^[1-9][0-9]{5}$'),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    delivery_slot TEXT NOT NULL DEFAULT '5:30 AM - 7:00 AM',
    instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CATEGORIES (6 core categories: Milk, Ghee, Paneer, Curd, Butter, Khoya/Mawa)
CREATE TABLE IF NOT EXISTS public.categories (
    id VARCHAR(50) PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    hindi_name TEXT NOT NULL,
    description TEXT,
    display_order INT NOT NULL DEFAULT 0,
    image_url TEXT,
    is_cold_chain_required BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id VARCHAR(50) PRIMARY KEY,
    name TEXT NOT NULL,
    hindi_name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category_id VARCHAR(50) NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    category_slug TEXT NOT NULL,
    badge TEXT,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00 CHECK (rating >= 1.0 AND rating <= 5.0),
    reviews_count INT NOT NULL DEFAULT 0 CHECK (reviews_count >= 0),
    description TEXT NOT NULL,
    heritage_story TEXT NOT NULL,
    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
    shelf_life TEXT NOT NULL,
    storage_instructions TEXT NOT NULL,
    allergens JSONB NOT NULL DEFAULT '[]'::jsonb,
    purity_score INT NOT NULL DEFAULT 490,
    is_perishable BOOLEAN NOT NULL DEFAULT TRUE,
    storage_temp_min_c NUMERIC(3, 1) DEFAULT 2.0,
    storage_temp_max_c NUMERIC(3, 1) DEFAULT 4.0,
    is_subscription_eligible BOOLEAN NOT NULL DEFAULT TRUE,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    nutritional_highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. PRODUCT_VARIANTS (Priced in integer paise: 17000 = ₹170.00)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku VARCHAR(50) UNIQUE NOT NULL,
    size_label TEXT NOT NULL,
    price_paise BIGINT NOT NULL CHECK (price_paise >= 0),
    compare_at_price_paise BIGINT CHECK (compare_at_price_paise >= 0),
    in_stock BOOLEAN NOT NULL DEFAULT TRUE,
    stock_count INT NOT NULL DEFAULT 0 CHECK (stock_count >= 0),
    is_subscription_eligible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PRODUCT_IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
    id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INT NOT NULL DEFAULT 0
);

-- 7. INVENTORY_BATCHES (FEFO tracking)
CREATE TABLE IF NOT EXISTS public.inventory_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_number VARCHAR(50) UNIQUE NOT NULL,
    variant_id VARCHAR(50) NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    mfg_date TIMESTAMPTZ NOT NULL,
    expiry_date TIMESTAMPTZ NOT NULL,
    initial_quantity INT NOT NULL CHECK (initial_quantity > 0),
    on_hand_quantity INT NOT NULL CHECK (on_hand_quantity >= 0),
    reserved_quantity INT NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    is_quarantined BOOLEAN NOT NULL DEFAULT FALSE,
    quarantine_reason TEXT,
    cold_chain_temp_c NUMERIC(3, 1) DEFAULT 3.0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'quarantined', 'expired', 'depleted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_batch_available_stock CHECK (on_hand_quantity >= reserved_quantity)
);

CREATE INDEX IF NOT EXISTS idx_batches_fefo ON public.inventory_batches (variant_id, expiry_date ASC) 
WHERE is_quarantined = FALSE AND status = 'active' AND (on_hand_quantity - reserved_quantity) > 0;

-- 8. INVENTORY_MOVEMENTS
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES public.inventory_batches(id) ON DELETE SET NULL,
    variant_id VARCHAR(50) NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    delta INT NOT NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('production_in', 'order_reservation', 'order_fulfillment', 'manual_adjustment', 'spoilage_waste', 'quarantine_hold', 'reservation_release')),
    reason TEXT NOT NULL,
    actor_email TEXT,
    reference_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. INVENTORY_RESERVATIONS
CREATE TABLE IF NOT EXISTS public.inventory_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.inventory_batches(id) ON DELETE CASCADE,
    variant_id VARCHAR(50) NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'converted', 'released', 'expired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. CARTS
CREATE TABLE IF NOT EXISTS public.carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    session_token TEXT UNIQUE NOT NULL,
    delivery_pincode VARCHAR(6),
    coupon_code TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. CART_ITEMS
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    variant_id VARCHAR(50) NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    is_subscription BOOLEAN NOT NULL DEFAULT FALSE,
    subscription_frequency TEXT CHECK (subscription_frequency IN ('daily', 'alternate', 'weekly', 'weekdays')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled', 'returned')),
    subtotal_paise BIGINT NOT NULL CHECK (subtotal_paise >= 0),
    tax_paise BIGINT NOT NULL DEFAULT 0 CHECK (tax_paise >= 0),
    shipping_paise BIGINT NOT NULL DEFAULT 0 CHECK (shipping_paise >= 0),
    discount_paise BIGINT NOT NULL DEFAULT 0 CHECK (discount_paise >= 0),
    total_paise BIGINT NOT NULL CHECK (total_paise >= 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('razorpay', 'cod', 'upi', 'card', 'netbanking')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'captured', 'failed', 'refunded', 'due_on_delivery')),
    delivery_address JSONB NOT NULL,
    delivery_slot TEXT NOT NULL,
    delivery_pincode VARCHAR(6) NOT NULL CHECK (delivery_pincode ~ '^[1-9][0-9]{5}$'),
    requires_cold_chain BOOLEAN NOT NULL DEFAULT TRUE,
    estimated_delivery_date DATE,
    actual_delivery_time TIMESTAMPTZ,
    tracking_number TEXT,
    cancellation_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. ORDER_ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    variant_id VARCHAR(50) NOT NULL,
    batch_id UUID REFERENCES public.inventory_batches(id) ON DELETE SET NULL,
    product_name_snapshot TEXT NOT NULL,
    size_snapshot TEXT NOT NULL,
    price_paise_snapshot BIGINT NOT NULL CHECK (price_paise_snapshot >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    total_paise BIGINT NOT NULL CHECK (total_paise >= 0),
    image_url_snapshot TEXT,
    is_perishable BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. ORDER_STATUS_EVENTS
CREATE TABLE IF NOT EXISTS public.order_status_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    notes TEXT,
    actor TEXT NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('razorpay', 'cod', 'upi', 'card')),
    gateway_order_id TEXT,
    gateway_payment_id TEXT,
    signature TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'captured', 'failed', 'refunded', 'due_on_delivery', 'reconciled')),
    amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    idempotency_key TEXT UNIQUE NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. REFUNDS
CREATE TABLE IF NOT EXISTS public.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    gateway_refund_id TEXT,
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'processed', 'failed')),
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. PAYMENT_WEBHOOK_EVENTS
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT UNIQUE NOT NULL,
    gateway TEXT NOT NULL DEFAULT 'razorpay',
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('pending', 'processed', 'duplicate', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. DELIVERY_ZONES
CREATE TABLE IF NOT EXISTS public.delivery_zones (
    id VARCHAR(50) PRIMARY KEY,
    zone_name TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    hub_address TEXT NOT NULL,
    min_order_paise BIGINT NOT NULL DEFAULT 25000,
    delivery_fee_paise BIGINT NOT NULL DEFAULT 5000,
    free_delivery_threshold_paise BIGINT NOT NULL DEFAULT 50000,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. SERVICEABLE_PINCODES
CREATE TABLE IF NOT EXISTS public.serviceable_pincodes (
    pincode VARCHAR(6) PRIMARY KEY CHECK (pincode ~ '^[1-9][0-9]{5}$'),
    zone_id VARCHAR(50) NOT NULL REFERENCES public.delivery_zones(id) ON DELETE CASCADE,
    locality_name TEXT NOT NULL,
    city TEXT NOT NULL,
    is_cold_chain_active BOOLEAN NOT NULL DEFAULT TRUE,
    estimated_delivery_hours INT NOT NULL DEFAULT 4,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. DELIVERY_SLOTS
CREATE TABLE IF NOT EXISTS public.delivery_slots (
    id VARCHAR(50) PRIMARY KEY,
    slot_name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    cutoff_time TEXT NOT NULL,
    max_capacity INT NOT NULL DEFAULT 150,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. DELIVERIES
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    slot_id VARCHAR(50) NOT NULL REFERENCES public.delivery_slots(id) ON DELETE RESTRICT,
    pincode VARCHAR(6) NOT NULL REFERENCES public.serviceable_pincodes(pincode) ON DELETE RESTRICT,
    delivery_date DATE NOT NULL,
    driver_name TEXT,
    driver_phone TEXT,
    vehicle_number TEXT,
    insulated_box_id TEXT,
    dispatch_temp_c NUMERIC(3, 1),
    arrival_temp_c NUMERIC(3, 1),
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('pending', 'assigned', 'out_for_delivery', 'delivered', 'failed', 'cold_chain_breach')),
    delivered_at TIMESTAMPTZ,
    recipient_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. DELIVERY_EVENTS
CREATE TABLE IF NOT EXISTS public.delivery_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    recorded_temp_c NUMERIC(3, 1),
    notes TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 23. ADMIN_USERS
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'inventory_manager', 'delivery_lead')),
    permissions JSONB NOT NULL DEFAULT '["manage_inventory", "manage_orders", "view_reports", "manage_batches"]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 24. AUDIT_LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 25. COUPONS
CREATE TABLE IF NOT EXISTS public.coupons (
    id VARCHAR(50) PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    value INT NOT NULL CHECK (value > 0),
    min_order_amount_paise BIGINT NOT NULL DEFAULT 0 CHECK (min_order_amount_paise >= 0),
    max_discount_paise BIGINT CHECK (max_discount_paise >= 0),
    starts_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    usage_limit INT NOT NULL DEFAULT 1000,
    used_count INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 26. COUPON_REDEMPTIONS
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id VARCHAR(50) NOT NULL REFERENCES public.coupons(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    discount_paise BIGINT NOT NULL CHECK (discount_paise >= 0),
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 27. WISHLISTS
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 28. WISHLIST_ITEMS
CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(wishlist_id, product_id)
);

-- 29. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_city TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT NOT NULL,
    comment TEXT NOT NULL,
    verified_purchase BOOLEAN NOT NULL DEFAULT TRUE,
    is_approved BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 30. ENQUIRIES
CREATE TABLE IF NOT EXISTS public.enquiries (
    id VARCHAR(50) PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    enquiry_type TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 31. JOURNAL_POSTS
CREATE TABLE IF NOT EXISTS public.journal_posts (
    id VARCHAR(50) PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    author TEXT NOT NULL,
    author_role TEXT NOT NULL,
    read_time TEXT NOT NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tags JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 32. NOTIFICATION_LOGS
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_identifier TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'whatsapp')),
    template_name TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('queued', 'sent', 'failed')),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
