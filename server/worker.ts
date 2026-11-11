import { httpServerHandler } from "cloudflare:node";
import { env } from "cloudflare:workers";
import express, { Request, Response } from "express";
import cors from "cors";
import { createAppRouter } from "./app";
import { DUGDHSAR_DEFAULT_FEED } from "./instagram";
import { fetchWithCircuitBreaker } from "./lib/fetchWithCircuitBreaker";
import { requestIdMiddleware } from "./middleware/requestId";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./logger";
import { validateEnv } from "./env";
import { healthRouter } from "./routes/health";

const app = express();
app.use(cors());

// Correlation ID on every incoming request
app.use(requestIdMiddleware);

// Structured HTTP completion logging with PII redaction (API routes only)
app.use((req, res, next) => {
  const isApi = req.url.startsWith('/api') || req.originalUrl?.startsWith('/api');
  if (isApi) {
    res.on("finish", () => {
      logger.logHttp(req, res);
    });
  }
  next();
});

// Capture raw body for webhook HMAC SHA-256 signature verification
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf ? buf.toString() : '';
  }
}));

// Validate environment on startup/first load
try {
  validateEnv(env);
} catch (envErr: any) {
  logger.error("[Worker Startup] Environment configuration warning", { error: envErr.message });
}

const IG = "https://graph.instagram.com";
const FRESH_MS = 2 * 60 * 1000;

async function getToken(): Promise<string> {
  const kvToken = env.CACHE ? await env.CACHE.get("ig_token") : null;
  return kvToken || env.IG_ACCESS_TOKEN || "";
}

async function fetchFeed() {
  const token = await getToken();
  if (!token) {
    // If no token is configured yet, serve verified default feed
    return DUGDHSAR_DEFAULT_FEED;
  }

  const [p, m] = await Promise.all([
    fetchWithCircuitBreaker(
      `${IG}/me?fields=username,followers_count,follows_count,media_count,profile_picture_url&access_token=${encodeURIComponent(token)}`,
      { timeoutMs: 8000 }
    ),
    fetchWithCircuitBreaker(
      `${IG}/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=12&access_token=${encodeURIComponent(token)}`,
      { timeoutMs: 8000 }
    ),
  ]);

  if (!p.ok || !m.ok) {
    throw new Error("instagram_fetch_failed");
  }

  const profile = await p.json();
  const media = (await m.json()).data ?? [];
  return { profile, media, updatedAt: Date.now() };
}

// 1. Health & Readiness probes (/api/health, /api/ready, /api/v1/health, /api/v1/ready)
app.use("/api", healthRouter);
app.use("/api/v1", healthRouter);

// 2. Instagram Feed Endpoint with 2-Minute KV Caching (supports both /api and /api/v1)
const handleInstagramFeed = async (_req: Request, res: Response) => {
  let cached: any = null;
  let stale: string | null = null;

  try {
    if (env.CACHE) {
      cached = await env.CACHE.get("ig_feed", "json");
      stale = await env.CACHE.get("ig_stale");
    }
  } catch (err) {
    logger.warn("[Worker] KV read error", { error: err });
  }

  if (cached && !stale && Date.now() - (cached.updatedAt || 0) < FRESH_MS) {
    return res.json(cached);
  }

  try {
    const fresh = await fetchFeed();
    if (env.CACHE) {
      await env.CACHE.put("ig_feed", JSON.stringify(fresh));
      await env.CACHE.delete("ig_stale");
    }
    res.json(fresh);
  } catch {
    if (cached) return res.json(cached); // Purana data dikha do
    res.json(DUGDHSAR_DEFAULT_FEED);
  }
};

app.get("/api/instagram/feed", handleInstagramFeed);
app.get("/api/v1/instagram/feed", handleInstagramFeed);

// 3. Meta Webhook Verification (GET)
const handleWebhookGet = (req: Request, res: Response) => {
  if (
    req.query["hub.mode"] === "subscribe" &&
    req.query["hub.verify_token"] === (env.IG_VERIFY_TOKEN || "dugdhsar_ig_verify_token")
  ) {
    return res.status(200).send(String(req.query["hub.challenge"]));
  }
  res.sendStatus(403);
};

app.get("/api/instagram/webhook", handleWebhookGet);
app.get("/api/v1/instagram/webhook", handleWebhookGet);

// Helper: Verify X-Hub-Signature-256 with WebCrypto HMAC SHA-256
async function verifyHubSignature(signatureHeader: string | undefined, rawBody: string, appSecret: string): Promise<boolean> {
  if (!signatureHeader || !appSecret) return false;
  const parts = signatureHeader.split("=");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "sha256") return false;
  const expectedHash = parts[1].toLowerCase();

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(appSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
    const computedHash = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return computedHash === expectedHash;
  } catch {
    return false;
  }
}

// 4. Meta Webhook Receiver (POST) - Verifies signature and marks feed stale
const handleWebhookPost = async (req: any, res: Response) => {
  const signature = req.headers["x-hub-signature-256"] as string | undefined;
  const rawBody = req.rawBody || JSON.stringify(req.body);
  const appSecret = env.IG_APP_SECRET;

  if (appSecret) {
    const isValid = await verifyHubSignature(signature, rawBody, appSecret);
    if (!isValid) {
      return res.status(401).json({ error: "invalid_signature" });
    }
  }

  // Valid event: set ig_stale in KV so next visitor request fetches fresh data
  if (env.CACHE) {
    await env.CACHE.put("ig_stale", "1", { expirationTtl: 3600 });
  }

  res.sendStatus(200);
};

app.post("/api/instagram/webhook", handleWebhookPost);
app.post("/api/v1/instagram/webhook", handleWebhookPost);

// 5. Mount all existing routes (auth, orders, subscriptions, sheets, products, inventory)
const appRouter = createAppRouter(env);
app.use(appRouter);

// 6. Centralized Error Handler (leak-proof, formatted JSON responses)
app.use(errorHandler);

// Listen on port 3000 for local compatibility and node bridge
app.listen(3000);

const handler = httpServerHandler({ port: 3000 });

export default {
  ...handler,

  // Daily cron: Instagram token refresh (60 din expire hone se pehle)
  async scheduled() {
    try {
      const token = await getToken();
      if (!token) return;
      const r = await fetchWithCircuitBreaker(
        `${IG}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`,
        { timeoutMs: 8000, retrySafe: true }
      );
      if (r.ok) {
        const j: any = await r.json();
        if (j.access_token && env.CACHE) {
          await env.CACHE.put("ig_token", j.access_token);
          logger.info("[Instagram Cron] Token successfully refreshed");
        }
      }
    } catch (err: any) {
      logger.warn("[Instagram Cron] Scheduled refresh failed", { error: err.message });
    }
  },
};
