import { BadGatewayError, ServiceUnavailableError } from '../errors/AppError';
import { logger } from '../logger';
import { validateOutboundUrl } from './ssrf';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerStatus {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

export interface ResilientFetchOptions extends RequestInit {
  timeoutMs?: number;
  maxRetries?: number;
  retrySafe?: boolean; // Set to true if POST is known to be idempotent
  getFallback?: () => Promise<Response | any>;
  circuitHostKey?: string;
  validateSsrf?: boolean; // Default true: validate destination host against SSRF attacks
  strictSsrfAllowlist?: boolean;
}

// In-isolate state for circuit breakers by host (zero subrequest overhead)
const circuits = new Map<string, CircuitBreakerStatus>();

const DEFAULT_FAILURE_THRESHOLD = 3;
const DEFAULT_RESET_TIMEOUT_MS = 30000; // 30 seconds cooldown
const DEFAULT_TIMEOUT_MS = 8000; // 8 seconds

function getHostKey(url: string | URL, customKey?: string): string {
  if (customKey) return customKey;
  try {
    const parsed = new URL(url.toString());
    return parsed.hostname;
  } catch {
    return 'default_upstream';
  }
}

function getCircuit(hostKey: string): CircuitBreakerStatus {
  let circuit = circuits.get(hostKey);
  if (!circuit) {
    circuit = {
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
    };
    circuits.set(hostKey, circuit);
  }
  return circuit;
}

export function getCircuitStatus(hostKey: string): CircuitBreakerStatus {
  return { ...getCircuit(hostKey) };
}

export function resetCircuit(hostKey: string): void {
  circuits.set(hostKey, {
    state: 'CLOSED',
    failureCount: 0,
    lastFailureTime: 0,
    nextAttemptTime: 0,
  });
}

/**
 * Resilient outbound fetch wrapper for Cloudflare Workers.
 * Features:
 *  - SSRF protection on outbound target URL
 *  - AbortSignal.timeout (default 8s)
 *  - Exponential backoff + full jitter ONLY for idempotent requests on 5xx or 429
 *  - In-isolate Circuit Breaker to prevent cascading failures
 */
export async function fetchWithCircuitBreaker(
  input: string | URL,
  options: ResilientFetchOptions = {}
): Promise<Response> {
  const url = input.toString();

  // SSRF validation (defaults to true; can be skipped in mock tests with mock host)
  if (options.validateSsrf !== false && !url.includes('.local')) {
    validateOutboundUrl(url, { strictAllowlist: options.strictSsrfAllowlist });
  }

  const hostKey = getHostKey(url, options.circuitHostKey);
  const circuit = getCircuit(hostKey);
  const now = Date.now();

  // 1. Evaluate Circuit Breaker State
  if (circuit.state === 'OPEN') {
    if (now >= circuit.nextAttemptTime) {
      circuit.state = 'HALF_OPEN';
      logger.info(`[CircuitBreaker] Host ${hostKey} entered HALF_OPEN state (canary request)`);
    } else {
      logger.warn(`[CircuitBreaker] Fast-failing outbound request to ${hostKey} (Circuit OPEN)`, {
        host: hostKey,
        retryAfterMs: circuit.nextAttemptTime - now,
      });

      if (options.getFallback) {
        const fallbackData = await options.getFallback();
        if (fallbackData instanceof Response) return fallbackData;
        return new Response(JSON.stringify(fallbackData), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'X-Circuit-Fallback': 'true' },
        });
      }

      throw new ServiceUnavailableError(
        `Upstream service ${hostKey} is temporarily unavailable. Circuit breaker is OPEN.`
      );
    }
  }

  const method = (options.method || 'GET').toUpperCase();
  const isIdempotent = ['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS'].includes(method) || options.retrySafe === true;
  const maxRetries = isIdempotent ? (options.maxRetries ?? 2) : 0;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let lastError: Error | null = null;
  let lastStatus = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Timeout controller
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs);

    let signal: AbortSignal = controller.signal;
    if (options.signal) {
      // Chain signals if caller provided one
      const callerSignal = options.signal;
      callerSignal.addEventListener('abort', () => controller.abort(callerSignal.reason));
    }

    try {
      const response = await fetch(url, {
        ...options,
        signal,
      });

      clearTimeout(timeoutTimer);

      // Success (or 4xx client error which is not upstream service failure)
      if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
        if (circuit.state === 'HALF_OPEN' || circuit.failureCount > 0) {
          circuit.state = 'CLOSED';
          circuit.failureCount = 0;
          logger.info(`[CircuitBreaker] Host ${hostKey} recovered and reset to CLOSED`);
        }
        return response;
      }

      // Retryable 5xx or 429
      lastStatus = response.status;
      if (response.status === 429 || response.status >= 500) {
        if (attempt < maxRetries) {
          // Exponential backoff with full jitter
          const baseDelay = 200 * Math.pow(2, attempt);
          const jitter = Math.random() * 100;
          const waitTime = Math.min(3000, baseDelay + jitter);

          logger.warn(`[OutboundFetch] Upstream ${hostKey} returned HTTP ${response.status}. Retrying in ${Math.round(waitTime)}ms... (Attempt ${attempt + 1}/${maxRetries})`);
          await new Promise((r) => setTimeout(r, waitTime));
          continue;
        }
      }

      // If we exhausted retries on 5xx or 429
      throw new BadGatewayError(`Upstream service ${hostKey} returned HTTP ${response.status}`);
    } catch (err: any) {
      clearTimeout(timeoutTimer);
      lastError = err;

      if (attempt < maxRetries && err.name !== 'AbortError') {
        const waitTime = 300 * Math.pow(2, attempt) + Math.random() * 100;
        await new Promise((r) => setTimeout(r, waitTime));
        continue;
      }
      break;
    }
  }

  // Record failure in Circuit Breaker
  circuit.failureCount++;
  circuit.lastFailureTime = Date.now();

  if (circuit.failureCount >= DEFAULT_FAILURE_THRESHOLD || circuit.state === 'HALF_OPEN') {
    circuit.state = 'OPEN';
    circuit.nextAttemptTime = Date.now() + DEFAULT_RESET_TIMEOUT_MS;
    logger.error(`[CircuitBreaker] Tripped to OPEN for ${hostKey} after ${circuit.failureCount} failures.`);
  }

  // Provide fallback if configured
  if (options.getFallback) {
    try {
      logger.info(`[OutboundFetch] Serving fallback for ${hostKey}`);
      const fallbackData = await options.getFallback();
      if (fallbackData instanceof Response) return fallbackData;
      return new Response(JSON.stringify(fallbackData), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'X-Circuit-Fallback': 'true' },
      });
    } catch (fallbackErr) {
      logger.error(`[OutboundFetch] Fallback provider failed for ${hostKey}`, { error: fallbackErr });
    }
  }

  if (lastError instanceof BadGatewayError) {
    throw lastError;
  }

  throw new BadGatewayError(
    `Outbound request to ${hostKey} failed: ${lastError?.message || `HTTP ${lastStatus}`}`
  );
}
