import { WorkerEnv } from '../types';
import { BadRequestError, ServiceUnavailableError } from '../errors/AppError';

export interface RazorpayTestCredentials {
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
}

export interface RazorpayRemoteOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
}

function readEnvValue(env: WorkerEnv | undefined, key: string): string {
  const fromWorker = env?.[key];
  if (typeof fromWorker === 'string' && fromWorker.trim().length > 0) {
    return fromWorker.trim();
  }
  if (typeof process !== 'undefined' && process?.env?.[key]) {
    return String(process.env[key]).trim();
  }
  return '';
}

/**
 * Resolves Razorpay credentials strictly inside a request handler (never module scope)
 * and enforces TEST-MODE ONLY (`rzp_test_*`) to prevent accidental live charges.
 */
export function resolveRazorpayTestCredentials(env: WorkerEnv | undefined): RazorpayTestCredentials {
  const keyId = readEnvValue(env, 'RAZORPAY_KEY_ID');
  const keySecret = readEnvValue(env, 'RAZORPAY_KEY_SECRET');
  const webhookSecret = readEnvValue(env, 'RAZORPAY_WEBHOOK_SECRET');

  if (!keyId || !keySecret) {
    throw new ServiceUnavailableError(
      'Razorpay test-mode keys (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are not configured on the server.'
    );
  }

  if (!keyId.startsWith('rzp_test_')) {
    throw new BadRequestError(
      'Only Razorpay TEST-MODE keys (rzp_test_*) are permitted right now. Live keys (rzp_live_*) are blocked for safety.'
    );
  }

  return {
    keyId,
    keySecret,
    webhookSecret: webhookSecret || undefined,
  };
}

export function resolveRazorpayWebhookSecret(env: WorkerEnv | undefined): string {
  const webhookSecret = readEnvValue(env, 'RAZORPAY_WEBHOOK_SECRET');
  if (!webhookSecret) {
    throw new ServiceUnavailableError(
      'RAZORPAY_WEBHOOK_SECRET is not configured on the server.'
    );
  }
  return webhookSecret;
}

/**
 * Pure WebCrypto HMAC-SHA256 hex digest (Cloudflare Workers compatible, zero Node crypto dependency).
 */
export async function computeHmacSha256Hex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Constant-time hex string equality check to prevent HMAC timing side-channel leaks.
 */
export function constantTimeEqualHex(a: string, b: string): boolean {
  const cleanA = a.trim().toLowerCase();
  const cleanB = b.trim().toLowerCase();
  if (cleanA.length === 0 || cleanA.length !== cleanB.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < cleanA.length; i++) {
    diff |= cleanA.charCodeAt(i) ^ cleanB.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Verifies Razorpay Checkout signature: HMAC_SHA256(keySecret, `${orderId}|${paymentId}`).
 */
export async function verifyRazorpayCheckoutSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  providedSignature: string,
  keySecret: string
): Promise<boolean> {
  if (!razorpayOrderId || !razorpayPaymentId || !providedSignature || !keySecret) {
    return false;
  }
  const expected = await computeHmacSha256Hex(keySecret, `${razorpayOrderId}|${razorpayPaymentId}`);
  return constantTimeEqualHex(expected, providedSignature);
}

/**
 * Verifies Razorpay Webhook signature: HMAC_SHA256(webhookSecret, rawBody) === X-Razorpay-Signature.
 */
export async function verifyRazorpayWebhookSignature(
  rawBody: string,
  providedSignature: string | undefined,
  webhookSecret: string
): Promise<boolean> {
  if (!rawBody || !providedSignature || !webhookSecret) {
    return false;
  }
  const expected = await computeHmacSha256Hex(webhookSecret, rawBody);
  return constantTimeEqualHex(expected, providedSignature);
}

/**
 * Creates a real Razorpay Order via Razorpay REST API (`POST /v1/orders`) using Basic Auth.
 * Works natively in Cloudflare Workers using global `fetch` and `btoa`.
 */
export async function createRazorpayRemoteOrder(params: {
  keyId: string;
  keySecret: string;
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayRemoteOrder> {
  if (!Number.isInteger(params.amountPaise) || params.amountPaise < 100) {
    throw new BadRequestError('Razorpay order amount must be at least 100 paise (₹1).');
  }

  const basicAuth = btoa(`${params.keyId}:${params.keySecret}`);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        amount: params.amountPaise,
        currency: params.currency || 'INR',
        receipt: params.receipt.slice(0, 40),
        notes: params.notes || {},
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let reason = `HTTP ${response.status}`;
      try {
        const errJson = (await response.json()) as any;
        if (errJson?.error?.description) {
          reason = String(errJson.error.description);
        }
      } catch {
        // Keep HTTP status fallback
      }
      throw new ServiceUnavailableError(`Razorpay order creation failed: ${reason}`);
    }

    const data = (await response.json()) as RazorpayRemoteOrder;
    if (!data?.id) {
      throw new ServiceUnavailableError('Razorpay returned an invalid order response.');
    }
    return data;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new ServiceUnavailableError('Razorpay API timed out. Please retry shortly.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
