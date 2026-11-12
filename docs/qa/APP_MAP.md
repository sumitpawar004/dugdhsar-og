# Dugdhsar: Complete Application Map & QA Test Checklist

**Document Version**: 2.0.0  
**Generated**: 2026-11-11  
**Scope**: Full-Stack Dugdhsar Web Platform (React 19 + TypeScript + Node/Express Cloudflare Worker)

---

## 1. Frontend Route Map

| Path | Access / Role | Guard | Page Component | Purpose |
|---|---|---|---|---|
| `/` | Public | None | `HomePage` | Hero, A2 Gir cow Vedic value proposition, Bilona process, subscription modal, Instagram reel feed |
| `/our-story` | Public | None | `OurStoryPage` | Gaushala heritage, Ahimsa milking, Seoni roots |
| `/our-craft` | Public | None | `OurCraftPage` | 5-stage Bilona Vidhi, curdling, churning, simmering |
| `/quality` | Public | None | `QualityPage` | Cold-chain logistics, zero adulteration, lab tests |
| `/journal` | Public | None | `JournalIndexPage` | Vedic wellness articles & milk science |
| `/journal/:slug` | Public | None | `JournalPostPage` | Deep-dive educational journal articles with JSON-LD |
| `/contact` | Public | None | `ContactPage` | Direct phone, WhatsApp, inquiry form with Turnstile |
| `/faq` | Public | None | `FaqPage` | Delivery slots, billing, bottle deposit, pause rules |
| `/store-locator` | Public | None | `StoreLocatorPage` | Seoni offline hub & farm location with GPS pin |
| `/privacy-policy` | Public | None | `PrivacyPolicyPage` | DPDP Act 2023 & GDPR data privacy declaration |
| `/terms-and-conditions` | Public | None | `TermsPage` | Subscription terms, morning delivery schedule |
| `/shipping-policy` | Public | None | `ShippingPolicyPage` | 5:30 AM - 7:00 AM cold-chain delivery slots |
| `/cancellation-refund` | Public | None | `CancellationRefundPage` | Cut-off time (8:00 PM IST) for pause/skip/cancel |
| `/return-policy` | Public | None | `ReturnPolicyPage` | Fresh perishable milk bottle exchange policy |
| `/shop`, `/products` | Public | None | `ShopPage` | Complete catalog of Vedic A2 Gir dairy products |
| `/products/milk` | Public | None | `CollectionPage` | Filtered A2 Whole and Skimmed milk category |
| `/products/ghee` | Public | None | `CollectionPage` | Filtered Vedic Bilona Ghee category |
| `/products/paneer` | Public | None | `CollectionPage` | Filtered Fresh Malai Paneer category |
| `/products/curd` | Public | None | `CollectionPage` | Filtered Clay Pot Dahi category |
| `/products/butter` | Public | None | `CollectionPage` | Filtered White Makhan category |
| `/products/khoya-mawa` | Public | None | `CollectionPage` | Filtered Danedar Mawa category |
| `/products/:slug` | Public | None | `ProductDetailPage` | Product ingredients, nutrition, order/subscribe CTA |
| `/search` | Public | None | `SearchPage` | Search catalog with autocomplete |
| `/cart` | Public | None | `CartPage` | Cart items, bottle deposit calculation, checkout button |
| `/checkout` | Public | None | `CheckoutPage` | Address, delivery slot, payment method (COD/UPI) |
| `/payment/result` | Public | None | `PaymentResultPage` | Gateway response confirmation |
| `/order/success/:id` | Public | None | `OrderSuccessPage` | Order summary, tracking link, WhatsApp notification |
| `/track-order` | Public | None | `TrackOrderPage` | Real-time dispatch & morning route tracking |
| `/wishlist` | Public | None | `WishlistPage` | Saved items |
| `/login`, `/account/login` | Public | None | `LoginPage` | Google SSO button, OTP / magic link |
| `/account/register` | Public | None | `RegisterPage` | Patron sign-up form |
| `/account` | Private | Customer | `AccountOverviewPage` | Subscription status, active orders, wallet |
| `/account/daily-milk-tracking` | Private | Customer | `DailyMilkTrackingPage` | Interactive calendar: Pause, Skip, Extra Milk |
| `/account/orders` | Private | Customer | `OrdersPage` | Historical milk and dairy deliveries |
| `/account/orders/:id` | Private | Customer | `OrderDetailPage` | Detailed invoice, batch number, cold-chain temp |
| `/account/addresses` | Private | Customer | `AddressesPage` | Saved delivery addresses in Seoni |
| `/account/profile` | Private | Customer | `ProfilePage` | Contact details, DPDP export/delete request |
| `/dealer`, `/dealer/*` | Private | Dealer | `DealerPortalPage` | B2B wholesale orders, territory deliveries, route |
| `/manager/login` | Public | None | `ManagerLoginPage` | Operations manager portal sign-in |
| `/manager`, `/manager/*` | Private | Manager / Admin | `ManagerDashboardPage` | Daily dispatch roster, inventory quarantine, batch logs |
| `/admin/login` | Public | None | `AdminLoginPage` | Super admin portal sign-in (2FA TOTP supported) |
| `/admin`, `/admin/*` | Private | Super Admin | `AdminDashboardPage` | Revenue, customers, audit log, feature flags, Sheets sync |

---

## 2. Backend API Endpoint Map

| Endpoint | Method | Auth Required | Allowed Roles | Request Body / Params | Response |
|---|---|---|---|---|---|
| `/api/health` | GET | None | Public | None | `{ status: 'ok', uptime, timestamp }` |
| `/api/ready` | GET | None | Public | None | `{ status: 'ready', checks: { kv, db } }` |
| `/api/auth/google` | POST | None | Public (Rate Limited) | `{ idToken, role? }` | Set cookies, `{ success: true, user }` |
| `/api/auth/refresh` | POST | Cookie | Authenticated | Cookie `dugdhsar_refresh` | Set new access token cookie |
| `/api/auth/logout` | POST | Cookie/Bearer | Authenticated | None | Clear cookies, revoke token |
| `/api/auth/me` | GET | Cookie/Bearer | Authenticated | None | `{ success: true, user }` |
| `/api/auth/2fa/setup` | POST | Bearer/Cookie | `super_admin` | None | `{ success: true, secret, otpauthUri }` |
| `/api/auth/2fa/verify` | POST | Bearer/Cookie | `super_admin` | `{ code, secret? }` | `{ success: true, message }` |
| `/api/categories` | GET | None | Public | None | Array of product categories |
| `/api/products` | GET | None | Public | Query: `category`, `inStock` | Array of products with batch info |
| `/api/products` | POST | Bearer/Cookie | `super_admin`, `dealer` | Product payload (Zod strict) | Created product object |
| `/api/reviews` | GET | None | Public | Query: `productId` | Array of verified reviews |
| `/api/reviews` | POST | None | Public | Review payload (name, rating, comment) | Created review |
| `/api/inventory/batches` | GET | Bearer/Cookie | `super_admin`, `dealer` | None | Active FEFO inventory batches |
| `/api/inventory/adjust` | POST | Bearer/Cookie | `super_admin` | `{ batchId, deltaQuantity, reason }` | Updated batch |
| `/api/inventory/quarantine` | POST | Bearer/Cookie | `super_admin` | `{ batchId, isQuarantined, reason }` | Quarantine status |
| `/api/delivery/validate-pincode` | POST | None | Public | `{ pincode }` | Serviceable status, delivery slot |
| `/api/delivery/slots` | GET | None | Public | None | Available morning/evening slots |
| `/api/checkout/reserve` | POST | None | Public | `{ variantId, quantity }` | Stock reservation ID |
| `/api/checkout/calculate` | POST | None | Public | `{ items, couponCode? }` | Subtotal, discounts, bottle deposit |
| `/api/checkout/create-order` | POST | Idempotency + RateLimit | Public / Customer | Order details (Zod strict) | `{ success: true, order }` |
| `/api/orders` | GET | Bearer/Cookie | Authenticated (RLS) | None | User's scoped orders |
| `/api/orders/:id` | GET | Bearer/Cookie | Authenticated (RLS) | `id` | Single scoped order (IDOR protected) |
| `/api/orders/:id/status` | POST/PATCH | Bearer/Cookie | `super_admin`, `dealer` | `{ status: 'delivered' \| ... }` | Updated order with audit log |
| `/api/orders/:id` | DELETE | Bearer/Cookie | `super_admin` | `id` | Soft delete (`deleted_at`) |
| `/api/subscriptions` | GET | Bearer/Cookie | Authenticated (RLS) | None | Scoped subscription list |
| `/api/subscriptions/:id` | GET | Bearer/Cookie | Authenticated (RLS) | `id` | Scoped subscription detail |
| `/api/subscriptions/:id/cancel`| POST | Bearer/Cookie | Authenticated (RLS) | None | Cancelled subscription with audit log |
| `/api/subscriptions` | POST | None | Public / Customer | Subscription payload | Created subscription |
| `/api/admin/audit-logs` | GET | Bearer/Cookie | `super_admin` | Query: `limit`, `targetType` | Immutable audit log events |
| `/api/feature-flags` | GET | None | Public | Query: `role` | Enabled feature flags map |
| `/api/admin/feature-flags` | POST | Bearer/Cookie | `super_admin` | `{ flagKey, enabled, ... }` | Updated flag configuration |
| `/api/user/export` | GET | Bearer/Cookie | Authenticated | None | Complete DPDP/GDPR JSON export |
| `/api/user/delete` | POST | Bearer/Cookie | Authenticated | `{ confirmEmail }` | Anonymize/erase user data |
| `/api/contact` | POST | None | Public (Rate Limited) | `{ name, email, phone, message }` | Confirmation |
| `/api/sheets/sync` | POST | Bearer/Cookie | `super_admin`, `dealer` | `{ direction }` | Rows synced to Google Sheets |
| `/api/instagram/feed` | GET | None | Public (Edge Cached) | None | Curated Instagram media posts |
| `/api/instagram/webhook` | GET/POST| None | Meta Webhook Signature | Hub challenge / Event payload | Webhook ack / Cache invalidation |
| `/api/razorpay/create-order`| POST | None | Public | `{ amountPaise, receipt }` | Gateway order ID |
| `/api/razorpay/verify` | POST | None | Public | `{ razorpayOrderId, ... }` | HMAC SHA-256 signature verification |

---

## 3. External Integrations Matrix

1. **Google Identity SSO (`jose` JWT verification)**:
   - Target: `https://accounts.google.com` (verified against `GOOGLE_CLIENT_ID`).
   - Role Resolution: Matches email against `ADMIN_EMAILS`, `DEALER_EMAILS`, fallback to `customer`.
2. **Google Sheets REST API (Two-way sync)**:
   - Target: `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}`.
   - Auth: Google Service Account JWT bearer assertion.
   - Protection: Cell formula injection sanitizer (prefixes `= + - @` with `'`).
3. **Instagram Graph API**:
   - Target: `https://graph.instagram.com/me/media`.
   - Caching: Workers KV (`CACHE` namespace, 3600s TTL) with circuit breaker fallback.
4. **Geolocation / Maps**:
   - Location: Sufi Nagar, Barghat Road, Seoni, MP 480661.
   - GPS Coordinates: Latitude `22.085917`, Longitude `79.557750`.
   - Radius validation: 15 km delivery perimeter centered in Seoni.
5. **Turnstile / Anti-Bot**:
   - Public endpoint protection on auth, checkout, and contact routes.

---

## 4. Critical User Journeys (QA Verification Checklist)

- **Journey 1: Patron Sign-In / Google SSO**:
  - Sign in with Google -> verify token -> receive HttpOnly session cookie -> redirected to `/account/daily-milk-tracking`.
- **Journey 2: Morning Subscription Setup**:
  - Select Milk variant (1L/2L) -> Select frequency (Daily/Alternate Days) -> Select 5:30 AM slot -> Place subscription.
- **Journey 3: Delivery Calendar Pause / Skip**:
  - Open Calendar -> Click upcoming date (e.g. tomorrow) -> Toggle "Skip Delivery" before 8:00 PM IST cut-off -> Balance auto-adjusted.
- **Journey 4: Instant Retail Order**:
  - Add Vedic Ghee to cart -> Calculate with bottle return discount -> Checkout with COD -> Confirm order -> View Invoice with FEFO Batch.
- **Journey 5: Dealer Territory Dispatch**:
  - Dealer logs in -> Scoped to pincode `480661` -> View daily morning milk roster -> Mark delivery "Delivered" -> Audit log generated.
- **Journey 6: Super Admin Governance**:
  - Super admin logs in -> Verify 2FA TOTP -> View cross-dealer revenue -> Trigger Google Sheets sync -> Quarantine spoiled milk batch.
- **Journey 7: DPDP Privacy Compliance**:
  - Patron visits `/account/profile` -> Clicks "Export My Data" -> Instant download of all orders, subscriptions, and profile data in machine-readable JSON.

---

## 5. Codebase Health & Unused Code Audit

- **Unreachable code**: None in active router; fallback 404 handles unknown paths.
- **Duplicated types**: Consolidated into `src/types/index.ts` and `server/types.ts`.
- **Secrets check**: Clean. All secrets injected via Cloudflare Workers environment or `.dev.vars`.
