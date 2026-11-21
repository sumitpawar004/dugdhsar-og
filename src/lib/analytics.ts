/**
 * DUGDHSAR Analytics & Privacy Consent Manager
 * 
 * - Privacy-first & Google Consent Mode v2 compliant
 * - Cookie-free Cloudflare Web Analytics beacon & event tracker
 * - Core Web Vitals (LCP, INP, CLS) telemetry via /api/vitals
 * - Lightweight, free-plan friendly, and SSR safe
 */

export interface ConsentPreferences {
  necessary: true; // Always required for security & authentication
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

const CONSENT_STORAGE_KEY = 'dugdhsar_consent_preferences_v1';

// Default consent state (strict privacy by default)
const DEFAULT_CONSENT: ConsentPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  timestamp: ''
};

/**
 * Get stored consent preferences or null if not yet answered
 */
export function getStoredConsent(): ConsentPreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Update consent preferences and dispatch to Google Consent Mode v2 & window dataLayer
 */
export function updateConsent(prefs: Partial<ConsentPreferences>): ConsentPreferences {
  if (typeof window === 'undefined') return { ...DEFAULT_CONSENT, ...prefs, timestamp: new Date().toISOString() };

  const current = getStoredConsent() || DEFAULT_CONSENT;
  const updated: ConsentPreferences = {
    ...current,
    ...prefs,
    necessary: true,
    timestamp: new Date().toISOString()
  };

  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }

  // Google Consent Mode v2 update
  if (typeof (window as any).gtag === 'function') {
    (window as any).gtag('consent', 'update', {
      analytics_storage: updated.analytics ? 'granted' : 'denied',
      ad_storage: updated.marketing ? 'granted' : 'denied',
      ad_user_data: updated.marketing ? 'granted' : 'denied',
      ad_personalization: updated.marketing ? 'granted' : 'denied'
    });
  }

  // Dispatch custom event for UI reactivity
  window.dispatchEvent(new CustomEvent('dugdhsar:consent-updated', { detail: updated }));

  return updated;
}

/**
 * Custom Event Tracking
 */
export type AnalyticsEventName =
  | 'page_view'
  | 'plan_viewed'
  | 'subscribe_started'
  | 'order_placed'
  | 'login_success'
  | 'contact_submitted'
  | 'phone_click'
  | 'whatsapp_click'
  | 'instagram_click'
  | 'review_submitted'
  | 'pincode_checked';

export function trackEvent(name: AnalyticsEventName, properties: Record<string, any> = {}) {
  if (typeof window === 'undefined') return;

  const payload = {
    event: name,
    properties: {
      ...properties,
      path: window.location.pathname,
      timestamp: new Date().toISOString()
    }
  };

  // 1. DataLayer for GTM / Google tag if present
  if (Array.isArray((window as any).dataLayer)) {
    (window as any).dataLayer.push(payload);
  }

  // 2. Local console in dev mode
  if (import.meta.env?.DEV) {
    console.log(`[Analytics Event] ${name}:`, properties);
  }
}

let webVitalsInitialized = false;

/**
 * Initialize Web Vitals (LCP, INP, CLS) collection and send to /api/vitals
 * - Skips entirely outside production
 * - Samples 10% of page loads
 * - Sends at most once per metric (LCP, INP, CLS) per page view
 */
export function initWebVitals() {
  if (webVitalsInitialized) return;
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  // Skip entirely when ENVIRONMENT !== "production" (dev / localhost)
  const metaEnv = (import.meta as any).env || {};
  const explicitEnv = metaEnv.VITE_ENVIRONMENT;
  const isLocalHost =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isProduction = explicitEnv
    ? explicitEnv === 'production'
    : Boolean(metaEnv.PROD) && !isLocalHost;

  if (!isProduction) return;

  webVitalsInitialized = true;

  // 10% client-side sampling to protect Cloudflare Free plan quotas
  if (Math.random() >= 0.1) return;

  const sentMetrics = new Set<string>();
  const pagePath = window.location.pathname || '/';
  const navEntry = performance.getEntriesByType?.('navigation')?.[0] as
    | PerformanceNavigationTiming
    | undefined;
  const navigationType = navEntry?.type || 'navigate';

  const sendVitalOnce = (vital: {
    name: 'LCP' | 'INP' | 'CLS';
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    delta?: number;
    id?: string;
  }) => {
    if (!Number.isFinite(vital.value) || vital.value < 0) return;
    const dedupeKey = `${pagePath}:${vital.name}`;
    if (sentMetrics.has(dedupeKey)) return;
    sentMetrics.add(dedupeKey);

    const payload = JSON.stringify({
      name: vital.name,
      value: Number(vital.value.toFixed(4)),
      rating: vital.rating,
      delta: typeof vital.delta === 'number' && Number.isFinite(vital.delta) ? Number(vital.delta.toFixed(4)) : Number(vital.value.toFixed(4)),
      id: vital.id || `v1-${Date.now()}-${vital.name}`,
      navigationType,
      path: pagePath,
    });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/vitals', blob);
    } else {
      fetch('/api/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {
        // Non-blocking telemetry
      });
    }
  };

  try {
    // 1. Largest Contentful Paint (LCP) — buffer latest value and send once on page hide
    let latestLcp: { value: number; id?: string } | null = null;
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      if (lastEntry) {
        const val = lastEntry.renderTime || lastEntry.loadTime || lastEntry.startTime;
        if (typeof val === 'number' && val > 0) {
          latestLcp = { value: val, id: lastEntry.id || undefined };
        }
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    // 2. Cumulative Layout Shift (CLS) — accumulate and send once on page hide
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as any[]) {
        if (!entry.hadRecentInput && typeof entry.value === 'number') {
          clsValue += entry.value;
        }
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });

    // 3. Interaction to Next Paint (INP) — track worst interaction latency and send once on page hide
    let maxInp = 0;
    let inpObserver: PerformanceObserver | null = null;
    try {
      inpObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries() as any[]) {
          if (entry.interactionId && typeof entry.duration === 'number' && entry.duration > maxInp) {
            maxInp = entry.duration;
          }
        }
      });
      inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 40 } as any);
    } catch {
      try {
        inpObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries() as any[]) {
            const val = entry.processingStart - entry.startTime;
            if (typeof val === 'number' && val > maxInp) {
              maxInp = val;
            }
          }
        });
        inpObserver.observe({ type: 'first-input', buffered: true });
      } catch {
        inpObserver = null;
      }
    }

    const flushMetricsOnce = () => {
      if (latestLcp) {
        const val = latestLcp.value;
        sendVitalOnce({
          name: 'LCP',
          value: val,
          rating: val <= 2500 ? 'good' : val <= 4000 ? 'needs-improvement' : 'poor',
          id: latestLcp.id,
        });
        lcpObserver.disconnect();
      }

      if (clsValue >= 0) {
        sendVitalOnce({
          name: 'CLS',
          value: clsValue,
          rating: clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor',
        });
        clsObserver.disconnect();
      }

      if (maxInp > 0) {
        sendVitalOnce({
          name: 'INP',
          value: maxInp,
          rating: maxInp <= 200 ? 'good' : maxInp <= 500 ? 'needs-improvement' : 'poor',
        });
        inpObserver?.disconnect();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushMetricsOnce();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', flushMetricsOnce, { once: true });
  } catch {
    // Unsupported browser or restricted performance API
  }
}
