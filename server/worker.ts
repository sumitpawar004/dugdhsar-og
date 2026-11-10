import { httpServerHandler } from "cloudflare:node";
import { env } from "cloudflare:workers";
import express, { Request, Response } from "express";
import cors from "cors";
import { createAppRouter } from "./app";
import { DUGDHSAR_DEFAULT_FEED } from "./instagram";

const app = express();
app.use(cors());

// Capture raw body for webhook HMAC SHA-256 signature verification
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf ? buf.toString() : '';
  }
}));

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
    fetch(`${IG}/me?fields=username,followers_count,follows_count,media_count,profile_picture_url&access_token=${encodeURIComponent(token)}`),
    fetch(`${IG}/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=12&access_token=${encodeURIComponent(token)}`),
  ]);

  if (!p.ok || !m.ok) {
    throw new Error("instagram_fetch_failed");
  }

  const profile = await p.json();
  const media = (await m.json()).data ?? [];
  return { profile, media, updatedAt: Date.now() };
}

// 1. Instagram Feed Endpoint with 2-Minute KV Caching
app.get("/api/instagram/feed", async (_req: Request, res: Response) => {
  let cached: any = null;
  let stale: string | null = null;

  try {
    if (env.CACHE) {
      cached = await env.CACHE.get("ig_feed", "json");
      stale = await env.CACHE.get("ig_stale");
    }
  } catch (err) {
    console.warn("[Worker] KV read error:", err);
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
    // Verified fallback if Instagram is unreachable
    res.json(DUGDHSAR_DEFAULT_FEED);
  }
});

// 2. Meta Webhook Verification (GET)
app.get("/api/instagram/webhook", (req: Request, res: Response) => {
  if (
    req.query["hub.mode"] === "subscribe" &&
    req.query["hub.verify_token"] === (env.IG_VERIFY_TOKEN || "dugdhsar_ig_verify_token")
  ) {
    return res.status(200).send(String(req.query["hub.challenge"]));
  }
  res.sendStatus(403);
});

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

// 3. Meta Webhook Receiver (POST) - Verifies signature and marks feed stale
app.post("/api/instagram/webhook", async (req: any, res: Response) => {
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
});

// 4. Mount all existing routes (auth, orders, subscriptions, sheets, products, inventory)
app.use(createAppRouter(env));

// Listen on port 3000 for local compatibility and node bridge
const server = app.listen(3000);

const handler = httpServerHandler({ port: 3000 });

export default {
  ...handler,

  // Daily cron: Instagram token refresh (60 din expire hone se pehle)
  async scheduled() {
    try {
      const token = await getToken();
      if (!token) return;
      const r = await fetch(
        `${IG}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`
      );
      if (r.ok) {
        const j: any = await r.json();
        if (j.access_token && env.CACHE) {
          await env.CACHE.put("ig_token", j.access_token);
          console.log("[Instagram Cron] Token successfully refreshed");
        }
      }
    } catch (err: any) {
      console.warn("[Instagram Cron] Scheduled refresh failed:", err.message);
    }
  },
};
