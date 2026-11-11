# DUGDHSAR Production Alerting Protocol

This guide outlines automated notification channels, alert triggers, severity levels, and escalation contacts.

---

## 1. Alert Rules & Triggers

| Rule Name | Condition | Severity | Notification Channel | Action Required |
|---|---|---|---|---|
| **High Worker Error Rate** | Error rate > 1.0% in 5 min window | P1 (Critical) | Email + WhatsApp webhook | Check `server/errorTracker.ts` logs, run `wrangler tail` |
| **5xx Spike Alarm** | > 10 HTTP 500/502 errors in 1 min | P1 (Critical) | SMS + Email | Verify D1 database connectivity and circuit breaker status |
| **Worker CPU Spike** | CPU execution time > 35 ms | P2 (High) | Email | Identify heavy JSON serialization or slow regex matching |
| **Free Quota Exhaustion Warning** | Daily requests > 80,000 | P2 (High) | Email | Investigate potential scraping or DDoS attack; tighten rate limiting |
| **External Outbound Circuit Tripped** | Circuit Breaker trips to `OPEN` | P3 (Medium) | Worker log warning | Sheets API or Meta Graph API temporary fail-safe triggered |

---

## 2. Cloudflare Notification Center Setup

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Navigate to **Manage Account > Notifications > Add Notification**.
3. Select **Workers** and configure:
   - **Worker High Error Rate Alert** -> Select worker `dugdhsar` -> Destination: `admin@dugdhsar.in`.
   - **Worker Subrequest Error Alert** -> Select worker `dugdhsar`.
4. Add Webhook destination for operational WhatsApp bridge (`https://api.whatsapp.com/...`).
