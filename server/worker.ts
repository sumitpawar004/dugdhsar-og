import { httpServerHandler } from "cloudflare:node";
import { env } from "cloudflare:workers";
import express from "express";
import cors from "cors";
import { createAppRouter } from "./app";
import { refreshInstagramToken } from "./instagram";
import { requestIdMiddleware } from "./middleware/requestId";
import { isAllowedOrigin } from "./middleware/csrf";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./logger";
import { healthRouter } from "./routes/health";

const app = express();
app.set("trust proxy", true);

// Allowlisted CORS with credentials support for Cloudflare Workers, Pages & dugdhsar.in
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id", "Idempotency-Key"],
  })
);

// Correlation ID on every incoming request
app.use(requestIdMiddleware);

// Structured HTTP completion logging with PII redaction (API routes only)
app.use((req, res, next) => {
  const isApi = req.url.startsWith("/api") || req.originalUrl?.startsWith("/api");
  if (isApi) {
    res.on("finish", () => {
      logger.logHttp(req, res);
    });
  }
  next();
});

// Capture raw body for webhook HMAC SHA-256 signature verification
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf ? buf.toString() : "";
    },
  })
);

// 1. Health & Readiness probes (/api/health, /api/ready, /api/v1/health, /api/v1/ready)
app.use("/api", healthRouter);
app.use("/api/v1", healthRouter);

// 2. Mount unified Express app using a lazy getter so Worker secrets/env are ONLY read inside request handlers
const appRouter = createAppRouter(() => env as any);
app.use(appRouter);

// 3. Centralized Error Handler (leak-proof client response + full JSON console.error for Observability)
app.use(errorHandler);

// Listen on port 3000 for Cloudflare Node compatibility bridge
app.listen(3000);

const handler = httpServerHandler({ port: 3000 });

export default {
  ...handler,

  // Daily cron: Refresh long-lived Meta/Instagram access token (reads env inside handler, never module scope)
  async scheduled() {
    try {
      const result = await refreshInstagramToken(env as any);
      if (result.success) {
        logger.info("[Instagram Cron] Token successfully refreshed");
      } else {
        logger.warn("[Instagram Cron] Token refresh skipped/failed", {
          message: result.message,
        });
      }
    } catch (err: any) {
      logger.warn("[Instagram Cron] Scheduled refresh exception", {
        error: err?.message || "unknown_error",
      });
    }
  },
};
