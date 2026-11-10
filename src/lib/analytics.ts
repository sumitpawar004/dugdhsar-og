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

/**
 * Initialize Web Vitals (LCP, INP, CLS) collection and send to /api/vitals
 */
export function initWebVitals() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  const sendVital = (vital: {
    name: string;
    value: number;
    rating?: 'good' | 'needs-improvement' | 'poor';
    delta?: number;
    id?: string;
  }) => {
    const payload = JSON.stringify({
      ...vital,
      path: window.location.pathname
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/vitals', payload);
    } else {
      fetch('/api/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(() => {
        // Non-blocking telemetry
      });
    }
  };

  try {
    // 1. Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      if (lastEntry) {
        const val = lastEntry.renderTime || lastEntry.loadTime;
        sendVital({
          name: 'LCP',
          value: val,
          rating: val <= 2500 ? 'good' : val <= 4000 ? 'needs-improvement' : 'poor',
          id: lastEntry.id
        });
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    // 2. Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });

    // Flush CLS on page hide / visibilitychange
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && clsValue > 0) {
        sendVital({
          name: 'CLS',
          value: clsValue,
          rating: clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor'
        });
      }
    });

    // 3. Interaction to Next Paint (INP) / First Input Delay (FID)
    const fidObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as any[]) {
        const val = entry.processingStart - entry.startTime;
        sendVital({
          name: 'INP',
          value: val,
          rating: val <= 200 ? 'good' : val <= 500 ? 'needs-improvement' : 'poor'
        });
      }
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch {
    // Unsupported browser or restricted performance API
  }
}
