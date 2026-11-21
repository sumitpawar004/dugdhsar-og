# DUGDHSAR Cloudflare D1 Database Guide (`dugdhsar-prod`)

- **Database Engine:** Cloudflare D1 (SQLite)
- **Database Name:** `dugdhsar-prod`
- **Worker Binding:** `DB`
- **Migrations Folder:** `/migrations` (`0001_init.sql`, `0002_seed_products.sql`)
- **Cloudflare D1 Console Paste File:** `docs/d1-console-setup.sql`

---

## 1. Quick Setup (Cloudflare D1 Console — Bina Terminal Ke)

1. Cloudflare Dashboard kholein → **Storage & Databases → D1 SQL Database**.
2. **`dugdhsar-prod`** database select karein (agar nahi bana hai toh create karein aur Worker Settings me binding name **`DB`** set karein).
3. **Console** tab kholein.
4. `docs/d1-console-setup.sql` ka poora content copy karke paste karein aur **Execute** dabayein.
5. Verify karne ke liye Console me run karein:
   ```sql
   SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name;
   SELECT COUNT(*) AS products_count FROM products;
   SELECT COUNT(*) AS plans_count FROM plans;
   ```
   Aapko **23 tables**, **8 products**, aur **8 default subscription plans** dikhne chahiye.

---

## 2. Core Data Rules & Conventions

| Rule | Convention |
|---|---|
| **Primary Keys** | App me generate hone wale `TEXT` UUIDv7 / ULID (guessable integer IDs nahi). `orders.order_number` alag human-friendly UNIQUE value hai. |
| **Money** | Hamesha `INTEGER` **paise** (`17000` = ₹170.00). Kabhi float/REAL use nahi hota. |
| **Timestamps** | Consistent UTC ISO-8601 `TEXT` (`DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))`). |
| **Delivery Dates** | `'YYYY-MM-DD'` **IST (`Asia/Kolkata`)** format me. |
| **Lat / Lng** | `REAL` 6 decimal places tak (`-90..90` aur `-180..180` CHECK). |
| **Payment Methods** | `orders.payment_method` aur `payments.provider` dono me ek hi list: `'razorpay'`, `'cod'`, `'upi_on_delivery'`. |
| **Foreign Keys** | Har connection/migration me `PRAGMA foreign_keys = ON`. |

---

## 3. Text ER Diagram

```text
users (1) ──┬── (0..1) dealers (1) ──┬── (0..N) dealer_pincodes
            │                        └── (0..N) dealer_customers ── (1) users [customer]
            ├── (0..N) addresses
            ├── (0..N) subscriptions ──┬── (0..N) subscription_pauses
            │       │                  ├── (0..N) subscription_invoices ── (0..N) payments
            │       │                  └── (0..N) orders [subscription_delivery]
            │       └── (N..1) plans ── (N..1) products (1) ── (1..N) product_variants
            ├── (0..N) orders ──┬── (1..N) order_items ── (N..1) product_variants
            │                   ├── (0..N) payments
            │                   └── (0..1) coupon_redemptions ── (N..1) coupons
            ├── (0..N) reviews ── (N..1) products
            ├── (0..N) enquiries [handled_by]
            ├── (0..N) audit_logs
            ├── (0..N) revoked_sessions
            └── (0..N) site_settings [updated_by]

Standalone operational tables:
  webhook_events   (Razorpay webhook deduplication by event_id PK)
  idempotency_keys (Order/payment replay protection by key PK)
```

---

## 4. Table-by-Table Explanation (Simple Hinglish)

1. **`users`** — Saare Google sign-in accounts (`super_admin`, `manager`, `dealer`, `customer`).
   - `super_admin` **sirf** Worker secret `SUPER_ADMIN_EMAILS` se decide hota hai.
   - `manager` aur `dealer` D1 me `super_admin` manage karta hai (`DEALER_EMAILS` sirf first login bootstrap ke liye).
   - **Account Delete & Reactivation:** Delete karne par `name`, `phone`, `email`, `avatar_url` aur `addresses` anonymize ho jate hain, par `orders` aur `payments` legal/accounting record ke liye safe rehte hain. `email_hash` (SHA-256) + `google_sub` ki wajah se same email se dobara login karne par wahi purana `users` row reactivate ho jata hai.
2. **`dealers`** — Har B2B / territory dealer ka business profile (`user_id` UNIQUE FK).
3. **`dealer_pincodes`** — Dealer ko kaun-kaun se 6-digit pincodes assigned hain (normalized table, JSON array nahi).
4. **`dealer_customers`** — Dealer-to-customer ownership mapping (ek customer ek active dealer ke under).
5. **`addresses`** — Customer ke saved delivery addresses (6-digit pincode + lat/lng + soft delete).
6. **`products`** — 6 approved categories (`milk`, `ghee`, `paneer`, `curd`, `butter`, `khoya-mawa`) ka master catalog. Public read Workers KV me 5 min cache hota hai.
7. **`product_variants`** — Pack sizes (500ml, 1L, 250g, 500g, 1kg), SKU, paise price aur `stock_qty`. Stock deduction atomic `UPDATE ... WHERE id = ? AND stock_qty >= ?` se hota hai.
8. **`plans`** — Admin/Manager editable Cow, Buffalo aur Skimmed milk subscription plans.
9. **`subscriptions`** — Customer ki active/paused/cancelled daily/alternate milk subscription, quantity, slot aur `paid_through_date`.
10. **`subscription_pauses`** — Specific skip dates (`YYYY-MM-DD` IST). `UNIQUE(subscription_id, skip_date)` duplicate skip rokta hai.
11. **`subscription_invoices`** — Weekly ya Monthly subscription billing cycle ka bill. Customer Razorpay se cycle pay karta hai; skip kiye gaye din agle bill me adjust ho jate hain.
12. **`coupons`** — Promo codes (`code = upper(code)`), percentage ya fixed paise discount, min order aur usage limits.
13. **`orders`** — One-time shop orders (`order_type = 'one_time'`) aur daily subscription drops (`order_type = 'subscription_delivery'`) dono yahan rehte hain.
    - Exact total formula CHECK: `total_paise = subtotal_paise + tax_paise + delivery_fee_paise - discount_paise`.
    - `qr_token`: min 128-bit random (32+ hex chars), single-use (`WHERE qr_verified_at IS NULL`), sirf assigned dealer ya admin/manager scan kar sakta hai.
    - Partial unique index `uq_orders_sub_date(subscription_id, delivery_date)` daily cron ko 100% idempotent banata hai.
14. **`order_items`** — Order ke time par product name, size aur unit price ka immutable snapshot (baad me price badalne par purane bill nahi badalte).
15. **`coupon_redemptions`** — Kis user ne kaunsa coupon kis order par use kiya (`per_user_limit` enforce karne ke liye).
16. **`payments`** — Razorpay, COD aur UPI-on-delivery payments + `refunded_amount_paise`. `CHECK (order_id IS NOT NULL OR subscription_id IS NOT NULL)` ensure karta hai ki payment ya toh order ka ho ya subscription ka.
17. **`webhook_events`** — Razorpay webhook `event_id` deduplication table (same webhook 2 baar aaye toh dobara process nahi hoga).
18. **`reviews`** — Product reviews with moderation (`pending` → `approved` / `rejected`).
19. **`enquiries`** — Contact form aur bulk B2B enquiries (`new`, `in_progress`, `resolved`, `spam`).
20. **`audit_logs`** — Sirf important admin, role, inventory aur financial changes ka log (har HTTP request par write nahi hota).
21. **`idempotency_keys`** — Double-click / retry protection for order & payment APIs (expired rows daily cron clean karta hai).
22. **`revoked_sessions`** — Logged-out / force-revoked JWT `jti` blacklist (expired rows daily cron clean karta hai).
23. **`site_settings`** — Admin-editable delivery zones, slots aur store banner JSON config.

---

## 5. Indexes & Exact Queries Served

| Index | Table(Columns) | Query It Serves |
|---|---|---|
| `idx_dealer_pincodes_pincode` | `dealer_pincodes(pincode)` | Checkout/subscription par pincode se assigned dealer lookup |
| `idx_dealer_customers_dealer` | `dealer_customers(dealer_id)` | Dealer portal me apne customers ki list |
| `idx_addresses_user` | `addresses(user_id) WHERE deleted_at IS NULL` | Customer ke saved active addresses |
| `idx_products_cat_active` | `products(category, is_active, display_order)` | Public shop category filter (KV miss par) |
| `idx_variants_product` | `product_variants(product_id, is_active)` | Product ke variants load karna |
| `idx_plans_active` | `plans(is_active, milk_type)` | Active milk plans list |
| `idx_subs_user_status` | `subscriptions(user_id, status)` | Customer apni subscriptions dekhega |
| `idx_subs_dealer_status` | `subscriptions(dealer_id, status)` | Dealer apni territory ki subscriptions dekhega |
| `idx_subs_next_delivery` | `subscriptions(status, next_delivery_date)` | Evening cron kal ki due subscriptions fetch karega |
| `idx_sub_invoices_user_status` | `subscription_invoices(user_id, status)` | Customer/Admin due & paid subscription bills |
| `uq_orders_sub_date` | `orders(subscription_id, delivery_date) WHERE subscription_id IS NOT NULL` | Evening cron idempotency guard |
| `idx_orders_user_created` | `orders(user_id, created_at DESC)` | Customer paginated order history |
| `idx_orders_dealer_date` | `orders(dealer_id, delivery_date, status)` | Dealer aaj/kal ki delivery sheet |
| `idx_orders_status_date` | `orders(status, delivery_date)` | Admin/Manager operations filter |
| `idx_order_items_order` | `order_items(order_id)` | Order detail items join |
| `idx_coupon_redemptions_user` | `coupon_redemptions(coupon_id, user_id)` | Per-user coupon limit check |
| `idx_payments_order` | `payments(order_id, status) WHERE order_id IS NOT NULL` | Order payment lookup & atomic capture |
| `idx_payments_sub` | `payments(subscription_id, status) WHERE subscription_id IS NOT NULL` | Subscription billing history |
| `idx_reviews_product_status` | `reviews(product_id, status, created_at DESC)` | Approved product reviews & admin moderation |
| `idx_enquiries_status` | `enquiries(status, created_at DESC)` | Admin enquiry inbox |
| `idx_audit_created` | `audit_logs(created_at DESC)` | Admin paginated audit log viewer |

*(No extra secondary indexes on `users(role)`, `idempotency_keys(expires_at)`, or `revoked_sessions(expires_at)` — writes bachane ke liye expired cleanup daily cron scan se hoga.)*

---

## 6. Evening Cron Handler Design (Cloudflare Free Plan Safe — Phase 3 Implementation)

Cloudflare Workers Free Plan par per invocation **~50 D1 queries** aur strict CPU budget hota hai. Isliye:

- **Schedule:** Evening **6:00 PM IST** = **`30 12 * * *`** UTC (alag cron trigger; **Instagram token refresh cron completely separate** rahega).
- **Kya Karega:**
  1. Kal ki IST date (`tomorrowIst`) compute karega.
  2. Active subscriptions jinka `next_delivery_date <= tomorrowIst` hai unko **~50 rows ke small pages/batches** me fetch karega (skip dates `subscription_pauses` exclude karke).
  3. Har batch ke liye `env.DB.batch([...])` use karke ek single D1 round-trip me:
     - `INSERT OR IGNORE INTO orders` (`order_type = 'subscription_delivery'`, `uq_orders_sub_date` idempotent guard ke saath)
     - `INSERT INTO order_items` (milk item snapshot)
     - `UPDATE subscriptions SET next_delivery_date = ...`
  4. Agar 500 subscribers hain, toh 10 batches × 1 `db.batch()` = sirf **~12–15 D1 queries** (well below 50-query limit!) aur **~6,800 rows written** (sirf ~6.8% of 100k/day limit).
  5. End me `DELETE FROM idempotency_keys WHERE expires_at < ?` aur `DELETE FROM revoked_sessions WHERE expires_at < ?` se expired rows clean karega.

---

## 7. Future Migration Roadmap (`0003`)

- **`migrations/0003_inventory_batches.sql`** (future): Cold-chain `inventory_batches`, FEFO expiry tracking, daily purity sensor reports, aur checkout stock reservations tab add honge jab scale ki zarurat hogi. Abhi `product_variants.stock_qty` par atomic conditional updates fast aur free-plan friendly hain.
