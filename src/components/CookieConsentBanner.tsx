import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie, X, Settings2 } from 'lucide-react';
import { getStoredConsent, updateConsent, ConsentPreferences } from '../lib/analytics';

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(true);
  const [marketingAllowed, setMarketingAllowed] = useState(false);

  useEffect(() => {
    // Check if user already submitted consent preferences
    const stored = getStoredConsent();
    if (!stored) {
      // Delay showing by 1.2s to prevent initial paint layout shift and let LCP settle
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!isVisible) return null;

  const handleAcceptAll = () => {
    updateConsent({ analytics: true, marketing: true });
    setIsVisible(false);
  };

  const handleEssentialOnly = () => {
    updateConsent({ analytics: false, marketing: false });
    setIsVisible(false);
  };

  const handleSaveCustom = () => {
    updateConsent({ analytics: analyticsAllowed, marketing: marketingAllowed });
    setIsVisible(false);
  };

  return (
    <div
      role="region"
      aria-label="Cookie and Privacy Consent"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 bg-stone-900/95 text-stone-100 p-5 rounded-2xl shadow-2xl backdrop-blur-md border border-stone-800 text-sm animate-fade-in"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-emerald-950/60 text-emerald-400 rounded-xl border border-emerald-800/40 shrink-0 mt-0.5">
          <Cookie className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-stone-100">
              Privacy & Cookie Choices
            </h3>
            <button
              onClick={handleEssentialOnly}
              className="text-stone-400 hover:text-stone-200 p-1"
              aria-label="Dismiss and keep essential only"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="mt-1.5 text-xs text-stone-300 leading-relaxed">
            Dugdhsar uses essential cookies for secure login and cart persistence. We optionally collect anonymized performance telemetry to improve delivery times in Seoni.
          </p>

          {showDetails && (
            <div className="mt-3 pt-3 border-t border-stone-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-stone-200">Strictly Necessary</span>
                  <p className="text-[11px] text-stone-400">Authentication, cart, cold-chain safety</p>
                </div>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                  Always Active
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-stone-200">Analytics & Performance</span>
                  <p className="text-[11px] text-stone-400">Anonymized page load speed & Core Web Vitals</p>
                </div>
                <input
                  type="checkbox"
                  checked={analyticsAllowed}
                  onChange={(e) => setAnalyticsAllowed(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 bg-stone-800 border-stone-700 w-4 h-4 cursor-pointer"
                  aria-label="Allow Analytics cookies"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-stone-200">Marketing & Personalization</span>
                  <p className="text-[11px] text-stone-400">Offer recommendations & seasonal farm updates</p>
                </div>
                <input
                  type="checkbox"
                  checked={marketingAllowed}
                  onChange={(e) => setMarketingAllowed(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 bg-stone-800 border-stone-700 w-4 h-4 cursor-pointer"
                  aria-label="Allow Marketing cookies"
                />
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {!showDetails ? (
              <>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs transition shadow-sm"
                >
                  Accept All
                </button>
                <button
                  type="button"
                  onClick={handleEssentialOnly}
                  className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium rounded-lg text-xs transition border border-stone-700"
                >
                  Essential Only
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetails(true)}
                  className="px-2 py-1.5 text-stone-400 hover:text-stone-200 text-xs flex items-center gap-1 underline underline-offset-2"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  Customize
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs transition shadow-sm"
                >
                  Save Preferences
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetails(false)}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs transition border border-stone-700"
                >
                  Back
                </button>
              </>
            )}
          </div>

          <div className="mt-2.5 text-[11px] text-stone-400">
            Learn more in our{' '}
            <a
              href="/privacy-policy"
              className="text-emerald-400 hover:underline"
            >
              Privacy Policy
            </a>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
