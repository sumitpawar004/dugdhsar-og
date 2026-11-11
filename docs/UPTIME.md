# DUGDHSAR External Uptime Monitoring Guide

To ensure continuous availability without incurring costs, Dugdhsar uses an external synthetic monitoring service (e.g. UptimeRobot or BetterStack free tier).

---

## 1. Monitor Specifications

- **Monitoring URL**: `https://dugdhsar.in/api/health`
- **Method**: `GET`
- **Check Interval**: Every 5 minutes (Free Tier)
- **Expected Status Code**: `200 OK`
- **Expected Response Keyword**: `"status":"ok"`
- **Timeout**: 10 seconds

---

## 2. Setup Instructions (UptimeRobot Free)

1. Sign up or log into [UptimeRobot](https://uptimerobot.com).
2. Click **+ Add New Monitor**.
3. Configure the monitor:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: Dugdhsar Edge Health Probe
   - **URL (or IP)**: `https://dugdhsar.in/api/health`
   - **Monitoring Interval**: 5 minutes
   - **Monitor Timeout**: 10 seconds
   - **Alert Contacts**: `admin@dugdhsar.in` and operations phone SMS.
4. Click **Create Monitor**.

---

## 3. Incident Escalation
If UptimeRobot triggers a **DOWN** alert:
1. Verify with manual curl: `curl -I https://dugdhsar.in/api/health`
2. Check Cloudflare status page: `https://www.cloudflarestatus.com`
3. Inspect live worker logs: `wrangler tail --env production`
4. If an unrecoverable edge failure occurred, follow `docs/DR.md` instant rollback procedures.
