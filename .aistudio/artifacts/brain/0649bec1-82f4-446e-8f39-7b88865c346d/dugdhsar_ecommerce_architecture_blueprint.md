# DUGDHSAR — Complete Website + E-Commerce Architecture Blueprint

**Brand:** DUGDHSAR (60 Years Heritage • Tradition • Purity • Goodness)  
**Design Constitution:** Heritage Luxury × Indian Craft × Contemporary Editorial Design  
**Lead Roles:** Lead Software Architect, Senior Full-Stack Engineer, E-Commerce Systems Designer, UI/UX Lead  
**Document Status:** Phase 1 Inspection & Architecture Blueprint (Awaiting Approval to Proceed to Phase 2)

---

## 1. Existing Architecture & Project Inspection Findings

### A. Framework & Build System
- **Runtime & Tooling:** Vite 8.3.0, React 19.0.1, TypeScript 7.0.2, Tailwind CSS v4 (`@tailwindcss/vite`).
- **Additional Libraries:** Motion 12.23.24, Lucide React 0.546.0, Canvas Confetti 1.9.4, Express 4.21.2 & TSX 4.21.0 available for server routes.
- **Development Server:** Runs on port 3000 (`vite --port=3000 --host=0.0.0.0`).

### B. Current Component Inventory & Reusable Assets
- **Authentic Brand Media Assets:**
  - `/public/assets/aistudio/1000095624-clean_337007be.png`: Master square Gir Cow roundel emblem with 60 Years Heritage crest and 7 product badges.
  - `/public/assets/aistudio/1000095662-clean_7d12ecae.png`: Horizontal header brand lockup.
  - `/public/assets/aistudio/1000095664-clean_2425f7fb.png`: Landscape crest emblem.
  - `/public/assets/aistudio/1000095665-clean_9f8d49b7.png`: Seamless diagonal repeating monogram wallpaper.
  - `/public/assets/aistudio/image_fe6cbcdf.png`: Minimalist glass bottle photography asset.
- **Interactive Mechanical Modules:**
  - `Preloader.tsx`: Milk bottle silhouette vertical filling animation with percentage tracker.
  - `Bottle360Viewer.tsx`: Canvas/SVG 360-degree glass bottle drag and rotation physics.
  - `FloatingControls.tsx`: Fixed bottom-left rainbow purity dial and bottom-right WhatsApp hotline.
  - `WhyLoveSection.tsx`: Blue cow silhouette hover animation with dynamic bio-fact callouts.
  - `ProductsSplitSection.tsx`: 5-column vertical colored product showcase with vertical typography.
  - `NutritionMatrixSection.tsx`: Radial nutrient equivalence matrix with top-down milk glass center.
  - `PasteurizationSection.tsx`: Industrial stainless steel dairy schematic with animated piping pulses.

### C. Gaps in Existing Architecture (To Be Solved)
1. **Routing:** Current app lives in a single-page layout with modal drawers. Needs multi-route architecture supporting:
   - 9 Public brand routes
   - 10 Commerce routes
   - 8 Customer account routes
   - 5 Legal routes
   - 17 Protected admin routes
   - 404 Not Found & Route Guards
2. **Design Palette & Typography Upgrade:**
   - Transition from modern blue/gold to the requested **Heritage Luxury Indian Craft** palette:
     - **Heritage Ivory:** `#F3EDE1`
     - **Deep Forest:** `#263D30`
     - **Terracotta:** `#A34F37`
     - **Antique Gold:** `#C2A36C`
     - **Espresso:** `#302C26`
     - **Soft Sand:** `#D8C9AD`
   - Typography setup: **Cormorant Garamond**, **Manrope**, and **Noto Serif Devanagari**.
3. **Data Integrity & Monetary Values:**
   - Transition all monetary calculations from loose floats to **integer paise** (e.g. ₹170.00 = `17000` paise).
   - Server-side price recalculation, stock reservation timeouts (15 minutes), and immutable order item snapshots.
4. **Supabase & Database Architecture:**
   - 24 relational PostgreSQL tables with Row-Level Security (RLS) policies, UUID primary keys, and audit logging.

---

## 2. Proposed Architecture & System Design

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DUGDHSAR STOREFRONT                             │
│       (Heritage Luxury × Indian Craft × Contemporary Editorial)        │
├────────────────────────────────────────────────────────────────────────┤
│ Public Brand Routes  │ Commerce Routes      │ Customer Account Routes  │
│ - /                  │ - /shop              │ - /account/login         │
│ - /our-story         │ - /collections/:slug │ - /account/register      │
│ - /our-craft         │ - /products/:slug    │ - /account/profile       │
│ - /quality           │ - /search            │ - /account/addresses     │
│ - /journal (/:slug)  │ - /cart, /checkout   │ - /account/orders (/:id) │
│ - /contact, /faq     │ - /order/success/:id │ - /account/wishlist      │
│ - /store-locator     │ - /track-order       │                          │
├──────────────────────┴──────────────────────┴──────────────────────────┤
│             PROTECTED ADMIN OPERATIONS DASHBOARD (/admin)              │
│ Overview • Products • Categories • Inventory • Orders • Customers      │
│ Payments • Refunds • Discounts • Delivery • Content • Audit Logs       │
├────────────────────────────────────────────────────────────────────────┤
│                     CORE TRANSACTION ENGINE                            │
│ Cart Validation ➔ Server Price Recalculation ➔ Stock Reservation (15m) │
│ ➔ Pincode Verification ➔ Payment Signature ➔ Order Snapshot Creation   │
├────────────────────────────────────────────────────────────────────────┤
│                  PERSISTENCE & SUPABASE LAYER                          │
│ 24 Relational Tables (Integer Paise, Foreign Keys, RLS Security Rules) │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema Specification (24 Relational Tables)

All monetary columns are strictly typed as `BIGINT` in **integer paise** (1 INR = 100 paise).

1. `profiles`: Customer and admin user profiles (id, email, full_name, phone, role, created_at).
2. `addresses`: Customer delivery address book (id, user_id, address_line1, landmark, city, pincode, is_default, delivery_slot).
3. `categories`: Dairy and pantry categories (id, name, slug, hindi_name, description, display_order).
4. `products`: Core product master (id, name, hindi_name, slug, category_id, description, heritage_story, shelf_life, storage_instructions, allergens, is_published, created_at).
5. `product_variants`: Pack sizes and pricing in integer paise (id, product_id, sku, size_label, price_paise, compare_at_price_paise, is_subscription_eligible, barcode).
6. `product_images`: Curated imagery & gallery assets (id, product_id, image_url, alt_text, sort_order).
7. `inventory`: Real-time stock counts (id, variant_id, current_stock, reserved_stock, low_stock_threshold).
8. `inventory_movements`: Stock audit trail (id, variant_id, delta, movement_type ['restock', 'order_deduction', 'reservation_release', 'waste'], reason, reference_id, created_at).
9. `inventory_reservations`: Cart/checkout locks (id, variant_id, quantity, expires_at, status ['active', 'converted', 'expired'], session_id).
10. `carts`: Active customer baskets (id, user_id, session_token, updated_at).
11. `cart_items`: Normalized cart line items (id, cart_id, variant_id, quantity, is_subscription, frequency).
12. `orders`: Primary purchase records (id, order_number, user_id, status ['pending', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled'], total_amount_paise, subtotal_paise, tax_paise, shipping_paise, discount_paise, delivery_pincode, delivery_slot, created_at).
13. `order_items`: Immutable price snapshots (id, order_id, variant_id, product_name_snapshot, size_snapshot, price_paise_snapshot, quantity, total_paise).
14. `payments`: Payment gateway transaction logs (id, order_id, payment_method ['upi', 'card', 'netbanking', 'cod'], gateway_order_id, gateway_payment_id, signature, status ['pending', 'captured', 'failed', 'refunded'], amount_paise, idempotency_key).
15. `refunds`: Refund tracking (id, payment_id, amount_paise, reason, status, processed_at).
16. `coupons`: Promotional discount rules (id, code, discount_type ['percentage', 'fixed_amount'], value, min_order_amount_paise, max_discount_paise, starts_at, expires_at, usage_limit).
17. `coupon_redemptions`: Customer coupon tracking (id, coupon_id, user_id, order_id, redeemed_at).
18. `delivery_zones`: Serviceable territory rules (id, zone_name, pincode, min_order_paise, delivery_fee_paise, is_cold_chain_active).
19. `delivery_slots`: Morning and evening dispatch slots (id, slot_name, start_time, end_time, cutoff_time, max_capacity).
20. `wishlists`: Saved customer items (id, user_id, product_id, created_at).
21. `reviews`: Verified purchase customer reviews (id, product_id, user_id, rating, title, comment, is_verified, is_approved).
22. `enquiries`: Contact and wholesale B2B requests (id, name, email, phone, subject, message, status ['new', 'in_progress', 'resolved']).
23. `journal_posts`: Editorial storytelling articles (id, title, slug, excerpt, content, cover_image, author, published_at).
24. `audit_logs`: Immutable security log for admin operations (id, admin_user_id, action, resource_type, resource_id, metadata, ip_address, created_at).

---

## 4. Controlled 10-Phase Implementation Roadmap

- **Phase 1: Project Inspection & Architecture Blueprint** *(Current turn — Completed)*
- **Phase 2: Design System & Responsive Frontend Foundation**
  - Install Google Fonts: *Cormorant Garamond*, *Manrope*, *Noto Serif Devanagari*.
  - Configure Heritage Luxury design tokens in Tailwind: `#F3EDE1`, `#263D30`, `#A34F37`, `#C2A36C`, `#302C26`, `#D8C9AD`.
  - Build universal client-side Router supporting all 49 requested route patterns with route guards.
- **Phase 3: Public Brand Storytelling Routes**
  - Implement `/our-story`, `/our-craft`, `/quality` (with lab assay report), `/journal` & `/journal/:slug`, `/contact`, `/faq`, `/store-locator`.
  - Implement legal compliance pages: `/privacy-policy`, `/terms-and-conditions`, `/shipping-policy`, `/cancellation-refund`, `/return-policy`.
- **Phase 4: Product Catalogue, Collections & Search**
  - Routes: `/shop`, `/collections/:slug`, `/products/:slug`, `/search`.
  - Rich product details: Ingredients, Nutrition tables, Storage, Shelf life, Allergen badges, Pack variants.
- **Phase 5: Customer Account, Wishlist & Normalized Cart**
  - Routes: `/account/login`, `/account/register`, `/account`, `/account/profile`, `/account/addresses`, `/account/orders`, `/account/orders/:id`, `/account/wishlist`.
  - Customer login with demo personas, persistent address management, and one-tap reordering.
- **Phase 6: Database & Backend Architecture**
  - Seed complete 24-table database schema with mock & Supabase-compatible PostgreSQL models.
  - Integer paise data structures and immutable order item snapshots.
- **Phase 7: Secure Checkout, Server-Side Pricing & Payment Flow**
  - Routes: `/checkout`, `/payment/result`, `/order/success/:id`, `/track-order`.
  - Server-side price recalculation, stock reservation locks, UPI QR / Card / COD payment simulation, and signature verification.
- **Phase 8: Protected Operations Admin Dashboard**
  - Route: `/admin` and all 17 sub-modules:
    - Products, Categories, Inventory, Orders, Customers, Payments, Discounts, Delivery, Content, Journal, Enquiries, Reviews, Reports, Settings, Users, Audit Logs.
- **Phase 9: Delivery Zone Rules, Cold-Chain Constraints & Notifications**
  - Pincode eligibility validation (Delhi NCR, Mumbai, Bangalore, Pune), morning dispatch slot cutoff rules.
- **Phase 10: Performance, Security, Accessibility & QA Certification**
  - Full automated audit covering WCAG 2.1 AA accessibility, CLS/LCP metrics, zero broken links, and production build verification.

---

## 5. Risks, Dependencies & Mitigation Strategy

1. **State Persistence vs Backend Sync:**
   - *Risk:* Transitioning from simple local state to enterprise e-commerce requires dual-mode support (pure client sandbox + optional real Supabase connection).
   - *Mitigation:* The data store will provide an integrated in-memory transactional database engine that adheres strictly to PostgreSQL relational constraints and integer paise, with seamless fallback if external Supabase credentials are not injected.
2. **Stock Reservation & Cart Expiry:**
   - *Risk:* Customers holding milk bottles in cart without completing checkout could exhaust inventory.
   - *Mitigation:* Implement 15-minute reservation timer (`inventory_reservations`) that automatically releases stock back to available pool.
3. **Monetary Rounding Errors:**
   - *Risk:* Floating-point math causing ₹0.01 discrepancies in tax and discounts.
   - *Mitigation:* All calculations use integer paise with explicit integer division (`Math.round` / `Math.floor`) before display formatting.

---

## Approval Request

Phase 1 (Inspection & Blueprint) is complete. Please review this architectural blueprint and click **Proceed** or confirm approval so we can begin **Phase 2 (Design System & Universal Multi-Route Architecture)**.
