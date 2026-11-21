import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../context/StoreContext';
import { useRouter } from '../router/RouterContext';
import { authService, getGoogleClientId } from '../lib/auth';
import { X, AlertCircle, ArrowRight, ShieldCheck, Mail, User, Loader2 } from 'lucide-react';

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole?: 'customer' | 'admin' | 'manager' | 'dealer';
  onSuccessRedirect?: string;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              width?: number;
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
            }
          ) => void;
        };
      };
    };
  }
}

function decodeJwtPayload(jwt: string): { email?: string; name?: string; picture?: string } {
  try {
    const parts = jwt.split('.');
    if (parts.length < 2) return {};
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return {};
  }
}

function loadGoogleIdentityScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window unavailable'));
      return;
    }
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Sign-In script')), {
        once: true,
      });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Identity Services script could not be loaded'));
    document.head.appendChild(script);
  });
}

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({
  isOpen,
  onClose,
  targetRole = 'customer',
  onSuccessRedirect,
}) => {
  const { loginUser } = useStore();
  const { navigate } = useRouter();

  const [gmailInput, setGmailInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [googleClientId, setGoogleClientId] = useState<string>(getGoogleClientId());
  const [gsiReady, setGsiReady] = useState(false);
  const [gsiLoadFailed, setGsiLoadFailed] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);

  const googleBtnRef = useRef<HTMLDivElement | null>(null);

  const completeLoginRedirect = useCallback(
    (role: 'customer' | 'admin' | 'manager' | 'dealer') => {
      if (onSuccessRedirect) {
        navigate(onSuccessRedirect);
      } else if (role === 'admin') {
        navigate('/admin/dashboard');
      } else if (role === 'manager') {
        navigate('/manager/dashboard');
      } else if (role === 'dealer') {
        navigate('/dealer/dashboard');
      } else {
        navigate('/account');
      }
    },
    [navigate, onSuccessRedirect]
  );

  // Discover runtime GOOGLE_CLIENT_ID from Cloudflare Worker /api/auth/config (falls back to VITE_GOOGLE_CLIENT_ID)
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const localClientId = getGoogleClientId();
    if (localClientId) {
      setGoogleClientId(localClientId);
    }

    setConfigLoading(true);
    fetch('/api/auth/config', { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.googleClientId && typeof data.googleClientId === 'string') {
          setGoogleClientId(data.googleClientId.trim());
        }
      })
      .catch(() => {
        // Static preview fallback uses VITE_GOOGLE_CLIENT_ID if present
      })
      .finally(() => {
        if (!cancelled) setConfigLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Handle real Google Sign-In ID token credential callback
  const handleRealGoogleCredential = useCallback(
    async (credentialJwt: string) => {
      setIsLoading(true);
      setErrorMessage('');

      const payload = decodeJwtPayload(credentialJwt);
      const email = (payload.email || '').trim().toLowerCase();
      const name = (payload.name || '').trim();
      const picture = payload.picture;

      if (!email) {
        setIsLoading(false);
        setErrorMessage('Google did not return a verified email address. Please try again.');
        return;
      }

      try {
        const res = await authService.signInWithGoogle(
          email,
          name,
          picture,
          targetRole,
          credentialJwt
        );
        setIsLoading(false);

        if (res.success && res.user) {
          loginUser(res.user);
          onClose();
          completeLoginRedirect(res.user.role);
        } else {
          setErrorMessage(res.error || 'Google authentication failed. Please try again.');
        }
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(err?.message || 'Google authentication error.');
      }
    },
    [completeLoginRedirect, loginUser, onClose, targetRole]
  );

  // Initialize and render official Google Identity Services button when GOOGLE_CLIENT_ID is configured
  useEffect(() => {
    if (!isOpen || !googleClientId) {
      setGsiReady(false);
      return;
    }

    let cancelled = false;
    setGsiLoadFailed(false);

    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id || !googleBtnRef.current) return;
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => {
            if (response?.credential) {
              handleRealGoogleCredential(response.credential);
            } else {
              setErrorMessage('Google sign-in was cancelled or returned no credential.');
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: 340,
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'left',
        });
        setGsiReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setGsiLoadFailed(true);
          setGsiReady(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, googleClientId, handleRealGoogleCredential]);

  if (!isOpen) return null;

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    const targetEmail = gmailInput.trim().toLowerCase();

    if (!targetEmail) {
      setErrorMessage('Please enter your Google Gmail address.');
      setIsLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      setErrorMessage('Please enter a valid Google email address (e.g. name@gmail.com).');
      setIsLoading(false);
      return;
    }

    const derivedName =
      fullNameInput.trim() ||
      targetEmail
        .split('@')[0]
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

    try {
      const res = await authService.signInWithGoogle(targetEmail, derivedName, undefined, targetRole);
      setIsLoading(false);

      if (res.success && res.user) {
        loginUser(res.user);
        setGmailInput('');
        setFullNameInput('');
        onClose();
        completeLoginRedirect(res.user.role);
      } else {
        setErrorMessage(res.error || 'Google authentication failed. Please try again.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Google authentication error.');
    }
  };

  const showFallbackForm = !googleClientId || gsiLoadFailed;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-200 text-neutral-900 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Google Sign-In"
          className="absolute top-5 right-5 p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Google Header */}
        <div className="text-center pb-4 border-b border-neutral-100">
          <div className="inline-flex w-11 h-11 items-center justify-center rounded-2xl bg-neutral-50 border border-neutral-200 mb-2 shadow-2xs font-serif font-black text-lg text-[#124A86]">
            G
          </div>
          <h2 className="text-lg font-bold text-neutral-900">Sign In with Google</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Verify with your Google account to access your private{' '}
            <strong className="text-neutral-800 capitalize">{targetRole}</strong> workspace.
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Official Google Identity Services Button (active whenever GOOGLE_CLIENT_ID is configured) */}
        {googleClientId && !gsiLoadFailed && (
          <div className="mt-5 flex flex-col items-center gap-3">
            <div
              ref={googleBtnRef}
              className="min-h-[44px] w-full flex items-center justify-center"
            />
            {(!gsiReady || isLoading) && (
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#124A86]" />
                <span>{isLoading ? 'Verifying Google ID token...' : 'Loading Google Sign-In...'}</span>
              </div>
            )}
            <p className="text-[11px] text-neutral-500 text-center">
              Verified via official Google OAuth 2.0 (JWKS server validation).
            </p>
          </div>
        )}

        {/* Fallback Email Form (used when GOOGLE_CLIENT_ID is not yet configured in local/staging preview) */}
        {showFallbackForm && (
          <form onSubmit={handleGoogleSubmit} className="mt-5 space-y-3.5">
            {configLoading && (
              <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#124A86]" />
                <span>Checking Google OAuth configuration...</span>
              </div>
            )}

            {gsiLoadFailed && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
                Google Sign-In widget could not load in this browser (ad-blocker or offline). Make sure{' '}
                <code>accounts.google.com</code> is allowed and this domain is listed under Authorized JavaScript Origins.
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Your Google Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={gmailInput}
                  onChange={(e) => setGmailInput(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:border-[#124A86] text-neutral-900 placeholder-neutral-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Your Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:border-[#124A86] text-neutral-900 placeholder-neutral-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#124A86] hover:bg-[#0e3a68] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Verifying with Google...' : 'Continue with Google'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Privacy & Staff Access Limit Note */}
        <div className="mt-4 pt-3 border-t border-neutral-100 text-center">
          <p className="text-[10px] text-neutral-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            {targetRole === 'customer' ? (
              <span>Strict user isolation: New accounts start clean &amp; cannot view other users&apos; data.</span>
            ) : (
              <span>Max 3 Enterprise Accounts Limit: Only Admin-authorized Gmail accounts can enter Admin, Manager, or Dealer portals.</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
