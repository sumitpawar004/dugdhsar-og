# DUGDHSAR Business Continuity & Disaster Recovery (DR) Plan

**Organization**: Dugdhsar Cold-Chain Dairy (Vedic Gir Cow A2 Milk)  
**Location**: Sanjay Vihar Colony, Sufi Nagar, Barghat Rd, Seoni, Madhya Pradesh (480661)  
**Emergency Hotline**: +91 7067672604  
**Primary Architecture**: Cloudflare Worker Edge Monolith + D1 SQLite + Workers KV + Google Sheets Backup  

---

## 1. Objectives & Service Level Indicators

Because Dugdhsar distributes fresh, unpasteurized/unadulterated perishable A2 milk every morning between **5:30 AM and 7:00 AM**, operational downtime directly affects physical doorstep delivery.

| Metric | Target | Rationale |
|---|---|---|
| **RPO (Recovery Point Objective)** | **< 24 Hours** | Maximum loss acceptable is 1 day's delivery sheet, which can be cross-verified from Google Sheets / WhatsApp backup. |
| **RTO (Recovery Time Objective)** | **< 1 Hour** | System must be operational prior to 04:00 AM dispatch preparation in Seoni. |
| **Data Integrity Guarantee** | **100% Zero-Loss** | All order IDs and payments are double-recorded in Cloudflare D1 and Google Sheets. |

---

## 2. Disaster Scenarios & Operational Runbooks

### Scenario A: Accidental D1 Data Drop or Corruption

**Symptom**: Database query failure, missing orders, or corrupted table.  
**Mitigation Mechanism**: Cloudflare D1 Time Travel (Automated 30-Day Continuous Backup).

#### Step-by-Step Recovery Runbook:
1. **Identify the exact point-in-time timestamp (UTC)** prior to the corruption:
   ```bash
   # Review recent audit logs or deployments
   wrangler d1 time-travel info dugdhsar-prod
   ```

2. **Execute D1 Point-in-Time Restore**:
   ```bash
   # Restore database to timestamp before corruption occurred
   wrangler d1 time-travel restore dugdhsar-prod --timestamp="2026-11-11T03:30:00Z"
   ```

3. **Verify Restored Schema & Tables**:
   ```bash
   wrangler d1 execute dugdhsar-prod --command="SELECT count(*) FROM orders;"
   wrangler d1 execute dugdhsar-prod --command="SELECT count(*) FROM inventory_batches;"
   ```

4. **Replay Missing Delta from Google Sheets**:
   If orders were placed between the restore point and the incident, run the reconciliation script to import rows from Google Sheets `Orders` tab.

---

### Scenario B: Cloudflare Workers KV Cache Desynchronization

**Symptom**: Stale product catalog pricing, stuck inventory count, or invalid session tokens.  
**Resolution**: Atomic Edge Cache Purge & Cold Warm-Up.

#### Step-by-Step Runbook:
1. **Purge Catalog and Idempotency KV Keys**:
   ```bash
   # Delete stale catalog cache keys
   wrangler kv:key delete --binding=CACHE "cache:catalog:products"
   wrangler kv:key delete --binding=CACHE "cache:catalog:categories"
   ```

2. **Trigger Edge Warm-Up**:
   ```bash
   curl -I https://dugdhsar.in/api/products
   # Verify response returns X-Cache: MISS on 1st call, then X-Cache: HIT on 2nd call
   curl -I https://dugdhsar.in/api/products
   ```

---

### Scenario C: Google Sheets Outbound Sync Failure

**Symptom**: `502 Bad Gateway` on `/api/sheets/sync` or circuit breaker status tripped to `OPEN`.  
**Automated Protection**:
- Outbound requests are governed by `fetchWithCircuitBreaker`.
- When Google Sheets API fails 3 consecutive times, the circuit trips to `OPEN` for 30 seconds.
- Local orders remain safely committed in Cloudflare D1.

#### Manual Sync Recovery:
1. Once Google Sheets connectivity is restored, trigger batch catch-up:
   ```bash
   curl -X POST https://dugdhsar.in/api/sheets/sync \
     -H "Authorization: Bearer <super_admin_jwt>" \
     -H "Content-Type: application/json" \
     -d '{"type": "orders"}'
   ```
2. Verify updated row count in the Google Sheet.

---

### Scenario D: Total Internet / Cloudflare Regional Outage (Seoni Morning Dispatch)

**Symptom**: Cloudflare CDN outage in Asia region preventing delivery boys from loading the delivery app at 5:00 AM.  
**Fail-Safe Physical Protocol**:
1. At 9:00 PM every evening, the evening cron job automatically syncs the tomorrow morning delivery manifest to the **Google Sheet (offline accessible)**.
2. The Gaushala Manager in Seoni exports/prints the manifest or opens the cached Google Sheets mobile app on Android.
3. Deliveries proceed without disruption using the offline address sheet.
4. Delivery boys record bottle collections and returns physically on route sheets and reconcile at 8:00 AM once network restores.

---

## 3. Disaster Recovery Drill Schedule

| Drill Type | Frequency | Owner | Success Criteria |
|---|---|---|---|
| **D1 Time Travel Test** | Bi-monthly | DevOps Lead | Full test database restore executed in < 15 minutes |
| **Offline Manifest Simulation** | Monthly | Gaushala Manager | 100% morning deliveries completed without active cloud internet |
| **Circuit Breaker Trip Verification** | Quarterly | QA Engineer | Automatic fallback returns valid degradation payload |
