import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/RouterContext';
import { 
  Briefcase, 
  Lock, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  RefreshCw, 
  Package, 
  FileText, 
  Truck,
  Sparkles,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { GoogleLoginModal } from '../../components/GoogleLoginModal';

export const ManagerLoginPage: React.FC = () => {
  const { loginUser, recordAuditLog } = useStore();
  const { navigate } = useRouter();

  const [email, setEmail] = useState('manager@dugdhsar.in');
  const [password, setPassword] = useState('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  const handleManagerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorNotice('Please provide your Manager email.');
      return;
    }

    loginUser({
      id: 'usr_manager_harish',
      email: email.trim().toLowerCase(),
      fullName: 'Harish Verma (Operations Manager)',
      phone: '+91 7067672604',
      role: 'manager',
      createdAt: '2026-01-01',
      authProvider: 'password'
    });

    recordAuditLog('MANAGER_LOGIN_SUCCESS', 'AUTH_SESSION', email, {
      role: 'manager',
      loginTimestamp: new Date().toISOString()
    });

    navigate('/manager/dashboard');
  };

  const GoogleGIcon = () => (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );

  return (
    <div className="bg-[#12231A] text-[#F3EDE1] min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center font-sans">
      <div className="max-w-xl w-full">
        
        {/* Header Emblem */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#C2A36C] text-[#12231A] font-serif font-black text-2xl flex items-center justify-center mx-auto shadow-xl mb-4 border border-white/20">
            <Briefcase className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C2A36C] block">
            DUGDHSAR PLANT MANAGEMENT
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
            Operations Manager Portal
          </h1>
          <p className="text-xs text-[#F3EDE1]/70 mt-2 max-w-md mx-auto">
            Dedicated portal for Dairy Operations Managers. Full control over product photos & prices, customer subscriptions, delivery vans, and Google Data Sheets sync.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#1D3527] border-2 border-[#3A5243] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* GOOGLE SIGN IN BUTTON */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C2A36C] block">
              Direct Google Manager Login
            </span>
            <p className="text-xs text-[#F3EDE1]/75">
              Sign in with your authorized manager Google Workspace / Gmail account:
            </p>
            <button
              type="button"
              onClick={() => setIsGoogleModalOpen(true)}
              className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-[#1F2F26] rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 shadow-md cursor-pointer transition-transform active:scale-98"
            >
              <GoogleGIcon />
              <span>Sign in with Google as Operations Manager</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#3A5243] w-full" />
            <span className="bg-[#1D3527] px-3 text-[10px] uppercase font-mono text-[#F3EDE1]/50 tracking-wider">
              Or Manager Credentials
            </span>
            <div className="border-t border-[#3A5243] w-full" />
          </div>

          {errorNotice && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs">
              {errorNotice}
            </div>
          )}

          <form onSubmit={handleManagerLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Manager Official Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#14261C] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">Access Security Code / PIN</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#14261C] border border-[#3A5243] rounded-xl text-white outline-none focus:border-[#C2A36C]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#C2A36C] hover:bg-[#b0915a] text-[#12231A] font-serif font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
            >
              <span>Access Manager Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Manager 1-Click Button */}
          <div className="pt-2 border-t border-[#3A5243]/60 flex items-center justify-between text-xs">
            <span className="text-[#F3EDE1]/60">Evaluation mode:</span>
            <button
              type="button"
              onClick={() => {
                setEmail('manager@dugdhsar.in');
                loginUser({
                  id: 'usr_manager_harish',
                  email: 'manager@dugdhsar.in',
                  fullName: 'Harish Verma (Operations Manager)',
                  phone: '+91 7067672604',
                  role: 'manager',
                  createdAt: '2026-01-01',
                  authProvider: 'password'
                });
                navigate('/manager/dashboard');
              }}
              className="text-[#C2A36C] hover:underline font-bold"
            >
              1-Tap Demo Manager Login →
            </button>
          </div>
        </div>

        {/* Portal Switcher Footer Links */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-[#F3EDE1]/60">
          <button 
            type="button"
            onClick={() => navigate('/login')}
            className="hover:text-white underline cursor-pointer"
          >
            ← Customer / Patron Login
          </button>
          <span>•</span>
          <button 
            type="button"
            onClick={() => navigate('/admin/login')}
            className="hover:text-white underline cursor-pointer"
          >
            Super Admin Portal Login →
          </button>
          <span>•</span>
          <button 
            type="button"
            onClick={() => navigate('/dealer/login')}
            className="hover:text-white underline cursor-pointer"
          >
            B2B Dealer Portal →
          </button>
        </div>

      </div>

      <GoogleLoginModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        targetRole="manager"
        onSuccessRedirect="/manager/dashboard"
      />
    </div>
  );
};
