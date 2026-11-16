import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useRouter } from '../router/RouterContext';
import { authService } from '../lib/auth';
import { X, AlertCircle, ArrowRight, ShieldCheck, Mail, User } from 'lucide-react';

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole?: 'customer' | 'admin' | 'manager' | 'dealer';
  onSuccessRedirect?: string;
}

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({
  isOpen,
  onClose,
  targetRole = 'customer',
  onSuccessRedirect
}) => {
  const { loginUser } = useStore();
  const { navigate } = useRouter();

  const [gmailInput, setGmailInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

        if (onSuccessRedirect) {
          navigate(onSuccessRedirect);
        } else if (res.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (res.user.role === 'manager') {
          navigate('/manager/dashboard');
        } else if (res.user.role === 'dealer') {
          navigate('/dealer/dashboard');
        } else {
          navigate('/account');
        }
      } else {
        setErrorMessage(res.error || 'Google authentication failed. Please try again.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Google authentication error.');
    }
  };

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
            Enter your personal Google account to access your private{' '}
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

        {/* Fresh Google Account Form */}
        <form onSubmit={handleGoogleSubmit} className="mt-5 space-y-3.5">
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
