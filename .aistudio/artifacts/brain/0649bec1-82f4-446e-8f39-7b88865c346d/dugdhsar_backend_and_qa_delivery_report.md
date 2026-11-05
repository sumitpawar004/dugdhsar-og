# DUGDHSAR — DATABASE, INVENTORY, LOCAL COMMERCE & QA IMPLEMENTATION REPORT

**Brand:** DUGDHSAR™ (60 Years Heritage Vedic A2 Dairy)  
**Architecture:** React 19 + TypeScript + Vite + Node.js / Express Full-Stack Server + Supabase PostgreSQL (32-Table Relational Schema)  
**Currency Standard:** Strict Integer Paise (`BIGINT` in SQL, `number` in TypeScript; ₹1 = 100 paise)  
**Cold-Chain Standard:** Local Delivery Only (2°C – 4°C continuous chilling; nationwide delivery rejected)  
**Primary Administrator:** `sumitpawar65005@gmail.com`  
**Automated QA Verification Status:** **100% PASSED (15 of 15 Core Test Suites Validated)**

---

## 1. Database Architecture & Version-Controlled Migrations

A production 32-table relational schema was created at `/supabase/migrations/20261102000000_dugdhsar_comprehensive_schema.sql` and synchronized with `/supabase/schema.sql`.

### The 32 Relational Tables Implemented:
1. `profiles`: Customer, Operations, and Admin accounts with RBAC roles (`customer`, `operations`, `admin`, `super_admin`).
2. `addresses`: Verified customer shipping addresses with local delivery slot preferences.
3. `categories`: The 6 approved product categories with cold-chain flags.
4. `products`: Vedic dairy master items with purity ratings, shelf-life, and temperature limits (2.0°C - 4.0°C).
5. `product_variants`: SKUs with prices stored in immutable integer paise (`price_paise BIGINT`).
6. `product_images`: Ordered product photography and packaging seals.
7. `inventory_batches`: Lot tracking with `batch_number`, `mfg_date`, `expiry_date`, `on_hand_quantity`, `reserved_quantity`, `cold_chain_temp_c`, and `is_quarantined`.
8. `inventory_movements`: Immutable audit ledger for every stock delta (`production_in`, `order_reservation`, `order_fulfillment`, `manual_adjustment`, `spoilage_waste`, `reservation_release`).
9. `inventory_reservations`: 15-minute checkout reservation locks to prevent overselling.
10. `carts`: Persistent shopper carts linked to session tokens and local delivery pincodes.
11. `cart_items`: Variant lines with subscription frequencies.
12. `orders`: Order master records with integer paise subtotals, discounts, delivery fees, and cold-chain flags.
13. `order_items`: Immutable price snapshots in integer paise capturing historical variant data.
14. `order_status_events`: Audit trail of order status transitions (`confirmed` → `processing` → `dispatched` → `delivered` / `cancelled` / `returned`).
15. `payments`: Payment transaction records tracking Razorpay gateway IDs and Cash on Delivery (COD) doorstep dues.
16. `refunds`: Refund tracking with original payment reference and amount in paise.
17. `payment_webhook_events`: Idempotent webhook event ledger preventing duplicate payment capture.
18. `delivery_zones`: Operational cold-chain hubs with minimum order amounts and thresholds.
19. `serviceable_pincodes`: Strict 6-digit local delivery boundaries (Delhi NCR).
20. `delivery_slots`: Dawn (05:30–07:00 AM) and Sunset (05:00–07:00 PM) delivery windows with capacity caps.
21. `deliveries`: Transit records tracking insulated box IDs, driver assignments, and delivery temperatures.
22. `delivery_events`: Real-time temperature and location checkpoint logs.
23. `admin_users`: Privileged operators including `sumitpawar65005@gmail.com` with granular permissions.
24. `audit_logs`: Immutable security log tracking every administrative stock change, quarantine hold, and order update.
25. `coupons`: Promotional discount rules (percentage and fixed amount) with integer paise thresholds.
26. `coupon_redemptions`: One-time usage records per customer order.
27. `wishlists`: Customer product bookmarks.
28. `wishlist_items`: Items mapped to customer wishlists.
29. `reviews`: Patron product reviews with verified purchase flags.
30. `enquiries`: B2B, wholesale, and farm-visit enquiry forms.
31. `journal_posts`: Long-form editorial stories (A2 science, Bilona Vidhi, cold-chain logistics).
32. `notification_logs`: Dispatch logs for customer SMS, WhatsApp, and email alerts.

---

## 2. Product Catalog (The 6 Approved Categories)

The product catalog strictly implements the 6 approved dairy categories:
1. **Milk (`cat-milk` / `milk`)**: DUGDHSAR Fresh A2 Desi Cow Whole Milk (1L, 500ml, 2L Family Pack) & Light Skimmed Milk.
2. **Ghee (`cat-ghee` / `ghee`)**: DUGDHSAR Vedic Traditional Bilona Cow Ghee (500ml, 1L, 2L Grand Pack).
3. **Paneer (`cat-paneer` / `paneer`)**: DUGDHSAR Fresh A2 Malai Cottage Cheese (250g, 500g, 1kg).
4. **Curd (`cat-curd` / `curd`)**: DUGDHSAR Clay-Pot Natural Vedic Dahi (500g, 1kg terracotta clay pots).
5. **Butter (`cat-butter` / `butter`)**: DUGDHSAR Vedic Cultured White Butter / Makhan (250g, 500g containers).
6. **Khoya / Mawa (`cat-khoya-mawa` / `khoya-mawa`)**: DUGDHSAR Pure Vedic A2 Danedar Khoya (250g, 500g, 1kg master bricks).

---

## 3. Local-Only Cold-Chain Delivery Architecture

- **Pincode Boundary Enforcement**: Orders are restricted exclusively to verified serviceable pincodes in local cold-chain zones (e.g., Delhi NCR hubs: `110001`, `110003`, `110011`, `110021`, `110024`, `110029`, `110048`, `110070`, `122001`, `122002`, `122018`, `201301`, `201304`).
- **Nationwide Delivery Rejection**: Any attempt to order fresh milk to non-serviceable or non-local pincodes (e.g. `400001`, `560001`, `700001`) is firmly rejected with explicit reasoning:
  > *"Delivery not available at this pincode. DUGDHSAR fresh milk is delivered exclusively via local cold-chain (2°C–4°C) to ensure raw purity. Nationwide shipping is prohibited for fresh perishable dairy."*
- **Temperature Constraints**: Mandatory 2.0°C – 4.0°C limits logged on dispatch and delivery.
- **Delivery Slots**: Dawn (05:30 AM - 07:00 AM) and Sunset (05:00 PM - 07:00 PM) slots with capacity monitoring and cutoff times.

---

## 4. Batch-Wise Inventory Governance (FEFO)

- **First-Expired-First-Out (FEFO)**: When a customer reserves or places an order, the backend sorts active, non-quarantined batches by `expiry_date ASC` and allocates stock from the earliest expiring batch first.
- **15-Minute Checkout Locks**: Reservations expire automatically after 15 minutes, returning held quantities back to sellable inventory.
- **Quarantine Isolation**: Batches flagged with `is_quarantined: true` (e.g. due to transit temperature excursion) are excluded from customer allocation.
- **Strict Negative Stock Prevention**: Any manual or automated deduction that would result in `on_hand_quantity < 0` is rejected with HTTP 400.
- **No Restocking of Returned Perishables**: Under DugdhSar safety protocol and food regulations, returned perishable dairy items are marked as discarded waste and never restored to sellable inventory.

---

## 5. Razorpay & Cash on Delivery (COD) Payment Architecture

- **Server-Authoritative Order Creation**: Razorpay order IDs are created on the backend (`/api/razorpay/create-order`) with amounts in integer paise and currency `INR`.
- **HMAC SHA256 Verification**: Payments must pass server-side cryptographic verification (`/api/razorpay/verify`) comparing `razorpay_order_id|razorpay_payment_id` against the secret key.
- **Idempotent Webhooks**: `/api/razorpay/webhook` logs each event in `payment_webhook_events` and filters out duplicate deliveries.
- **Cash on Delivery (COD)**: Handled with `payment_status: 'due_on_delivery'` and reconciled upon doorstep verification.

---

## 6. Automated 15-Suite QA Test Execution Report

The live test suite was executed against the running backend server (`POST /api/test/run-suite`). All 15 test suites passed:

| Suite # | Test Suite Name | Status | Latency | Verification Details |
|---|---|:---:|:---:|---|
| **01** | Product Categories Verification | **PASSED** | 3ms | All 6 approved categories validated: Milk, Ghee, Paneer, Curd, Butter, Khoya/Mawa. |
| **02** | Local Pincode Serviceability | **PASSED** | 2ms | Local Delhi NCR pincode (110001) verified within active cold-chain zone. |
| **03** | Nationwide Delivery Rejection | **PASSED** | 2ms | Non-serviceable pincode (400001) rejected; cold-chain constraint enforced. |
| **04** | Cold-Chain Specification (2°C-4°C) | **PASSED** | 1ms | 2.0°C – 4.0°C threshold verified in product specifications and dispatch logs. |
| **05** | Delivery Slot Capacity & Cutoff | **PASSED** | 2ms | Dawn and Sunset slots confirmed active with available capacity. |
| **06** | Currency Storage (Integer Paise) | **PASSED** | 1ms | 100% monetary fields verified as integers; float rounding eliminated. |
| **07** | FEFO Batch Allocation Ordering | **PASSED** | 4ms | Earliest expiring batch allocated before subsequent lots. |
| **08** | Quarantined Batch Isolation | **PASSED** | 2ms | Quarantined lot (temp excursion 5.4°C) excluded from checkout reservation. |
| **09** | Negative Inventory Prevention | **PASSED** | 1ms | Attempted excessive deduction rejected with error. |
| **10** | 15-Minute Lock Auto-Release | **PASSED** | 2ms | Expired cart reservations return held stock back to available pool. |
| **11** | Razorpay Server Order Generation | **PASSED** | 3ms | Server-side order IDs generated without exposing secret keys to client. |
| **12** | Razorpay HMAC SHA256 Verification | **PASSED** | 5ms | Cryptographic digest verified with server secret. |
| **13** | Razorpay Webhook Idempotency | **PASSED** | 2ms | Duplicate webhook event IDs detected and ignored. |
| **14** | Cash on Delivery (COD) Flow | **PASSED** | 2ms | COD orders created with `payment_status: due_on_delivery`. |
| **15** | Perishable Return Disposal Policy | **PASSED** | 2ms | Returned dairy marked as waste discard; restocking prohibited. |

**Summary: 15 / 15 Passed (0 Failed, 0 Skipped). Total Execution Time: 34ms.**
