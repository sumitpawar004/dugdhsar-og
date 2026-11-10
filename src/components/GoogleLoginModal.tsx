import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useRouter } from '../router/RouterContext';
import { authService, LocalUser } from '../lib/supabase';
import { X, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Mail } from 'lucide-react';

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

  const handleGoogleSubmit = async (selectedEmail?: string, selectedName?: string, forcedRole?: 'customer' | 'admin' | 'manager' | 'dealer') => {
    setIsLoading(true);
    setErrorMessage('');

    const targetEmail = (selectedEmail || gmailInput).trim().toLowerCase();
    
    if (!targetEmail) {
      setErrorMessage('Please enter your Google Gmail address.');
      setIsLoading(false);
      return;
    }

    // Basic email format check
    if (!targetEmail.includes('@') || !targetEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address (e.g. name@gmail.com).');
      setIsLoading(false);
      return;
    }

    const assignedRole = forcedRole || targetRole;
    const name = selectedName || fullNameInput.trim() || targetEmail.split('@')[0].replace(/[._-]/g, ' ');

    try {
      const res = await authService.signInWithGoogle(targetEmail, name, undefined, assignedRole);
      setIsLoading(false);

      if (res.success && res.user) {
        loginUser(res.user);
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
        setErrorMessage(res.error || 'Google login failed. Please try again.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Google authentication error.');
    }
  };

  const GoogleGIcon = () => (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-200 text-neutral-900 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Google Header */}
        <div className="text-center pb-4 border-b border-neutral-100">
          <div className="inline-flex p-3 rounded-2xl bg-neutral-50 border border-neutral-200 mb-2 shadow-2xs">
            <GoogleGIcon />
          </div>
          <h2 className="text-lg font-bold text-neutral-900">
            Sign In with Google
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            to access your isolated <strong className="text-neutral-800 capitalize">{targetRole} Panel</strong> on DugdhSar
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1-Click Fast Account Choices */}
        <div className="mt-4 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block px-1">
            Fast Select Account:
          </span>

          {/* Super Admin Google account option */}
          <button
            type="button"
            onClick={() => handleGoogleSubmit('sumitpawar65005@gmail.com', 'Sumit Pawar', targetRole === 'admin' ? 'admin' : targetRole)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-neutral-50 border border-neutral-200 transition-colors text-left cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-[#124A86] text-white flex items-center justify-center font-bold text-sm shrink-0">
              SP
            </div>
            <div className="flex-1 min-w-0 truncate">
              <div className="text-xs font-bold text-neutral-900 group-hover:text-[#124A86] truncate">
                Sumit Pawar
              </div>
              <div className="text-[11px] text-neutral-500 truncate">
                sumitpawar65005@gmail.com
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
              targetRole === 'admin' 
                ? 'bg-amber-50 text-amber-800 border-amber-200' 
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              {targetRole === 'admin' ? 'Super Admin' : 'Customer'}
            </span>
          </button>

          {targetRole === 'customer' && (
            <button
              type="button"
              onClick={() => handleGoogleSubmit('customer@dugdhsar.in', 'Ramesh Patel', 'customer')}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-neutral-50 border border-neutral-200 transition-colors text-left cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-[#5C922B] text-white flex items-center justify-center font-bold text-sm shrink-0">
                RP
              </div>
              <div className="flex-1 min-w-0 truncate">
                <div className="text-xs font-bold text-neutral-900 group-hover:text-[#5C922B] truncate">
                  Ramesh Patel (Demo Patron)
                </div>
                <div className="text-[11px] text-neutral-500 truncate">
                  customer@dugdhsar.in
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200 shrink-0">
                Customer
              </span>
            </button>
          )}

          {targetRole === 'dealer' && (
            <button
              type="button"
              onClick={() => handleGoogleSubmit('kanha.sweets.dealer@dugdhsar.in', 'Shree Kanha Sweets & Dairy', 'dealer')}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-neutral-50 border border-neutral-200 transition-colors text-left cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-[#A87520] text-white flex items-center justify-center font-bold text-sm shrink-0">
                KS
              </div>
              <div className="flex-1 min-w-0 truncate">
                <div className="text-xs font-bold text-neutral-900 group-hover:text-[#A87520] truncate">
                  Shree Kanha Sweets & Dairy
                </div>
                <div className="text-[11px] text-neutral-500 truncate">
                  kanha.sweets.dealer@dugdhsar.in
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-200 shrink-0">
                Dealer
              </span>
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
            <span className="bg-white px-3 text-neutral-400">Or type your own Gmail</span>
          </div>
        </div>

        {/* Enter Custom Gmail Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGoogleSubmit();
          }}
          className="space-y-3"
        >
          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
              Your Gmail Address:
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={gmailInput}
                onChange={(e) => setGmailInput(e.target.value)}
                placeholder="yourname@gmail.com"
                className="w-full pl-9 pr-3 py-2.5 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:border-[#124A86] text-neutral-900 placeholder-neutral-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
              Your Full Name (Optional):
            </label>
            <input
              type="text"
              value={fullNameInput}
              onChange={(e) => setFullNameInput(e.target.value)}
              placeholder="e.g. Sumit Pawar"
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:border-[#124A86] text-neutral-900 placeholder-neutral-400"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#124A86] hover:bg-[#0e3a68] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{isLoading ? 'Verifying with Google...' : 'Continue with Google Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Privacy Note */}
        <div className="mt-4 pt-3 border-t border-neutral-100 text-center">
          <p className="text-[10px] text-neutral-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Strict data isolation: Each customer account is private & unshared.</span>
          </p>
        </div>

      </div>
    </div>
  );
};
