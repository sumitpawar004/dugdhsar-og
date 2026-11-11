# DUGDHSAR Cost Monitoring & Free-Plan Discipline

**Target**: **$0.00 / month (Zero Infrastructure Cost)** indefinitely on the Cloudflare Free Plan.

---

## 1. Cloudflare Free Tier Quotas & Budget Allocation

| Service | Free Tier Limit | Dugdhsar Actual Usage | Strategy to Stay Free |
|---|---|---|---|
| **Worker Invocations** | 100,000 requests / day | ~3,500 requests / day | Public pages served as pre-built static HTML (`./dist/*.html`). Worker is invoked ONLY for `/api/*`. |
| **Worker CPU Time** | 50 ms / request | ~4.5 ms / request | Build-time prerendering; zero server-side rendering on public routes; fast isolate execution. |
| **Workers KV Reads** | 100,000 reads / day | ~2,000 reads / day | 5-minute memory caching in isolates before querying KV. |
| **Workers KV Writes** | 1,000 writes / day | ~50 writes / day | Writes only on catalog changes, inventory adjustments, and lockout records. |
| **D1 Database Reads** | 5,000,000 rows / day | ~25,000 rows / day | Filtered indexes on `(customer_id, created_at)` and `(variant_id, expiry_date)`. |
| **D1 Database Writes** | 100,000 rows / day | ~150 rows / day | Batch commits and atomic order creations. |
| **Static Bandwidth** | **Unlimited Free** | 100% Free | All hero images, webfonts, CSS, and JS served from Cloudflare Global CDN edge without worker invocations. |

---

## 2. Notification Thresholds & Alarms

Configure in Cloudflare Dashboard (`Notifications > Add`):
1. **Worker Request Quota Alarm**:
   - Trigger at **80,000 requests / day** (80% of free quota).
   - Recipient: `admin@dugdhsar.in` & SMS.
2. **Workers KV Write Alert**:
   - Trigger at **800 writes / day** (80% of free limit).
3. **Billing Lock**:
   - Do NOT attach a credit card unless explicitly approved. If daily free limits are exhausted, Worker automatically degrades to static-only mode while keeping orders queued.
