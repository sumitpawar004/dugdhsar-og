import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/RouterContext';
import { 
  ShieldCheck, 
  User, 
  ArrowRight, 
  Lock, 
  Mail, 
  Key, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Settings, 
  ExternalLink 
} from 'lucide-react';
import { 
  authService, 
  getSupabaseConfig, 
  saveSupabaseConfig 
} from '../../lib/supabase';
import { GoogleLoginModal } from '../../components/GoogleLoginModal';

export const LoginPage: React.FC = () => {
  const { switchUserPersona, updateProfile, loginUser } = useStore();
  const { navigate } = useRouter();

  const [email, setEmail] = useState('customer@dugdhsar.in');
  const [password, setPassword] = useState('password123');
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Supabase config modal / drawer toggle
  const [showConfig, setShowConfig] = useState(false);
  const { url: currentUrl, key: currentKey, isConfigured } = getSupabaseConfig();
  const [customUrl, setCustomUrl] = useState(currentUrl);
  const [customKey, setCustomKey] = useState(currentKey);
  const [configSaved, setConfigSaved] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setInfoMessage('');

    if (authMode === 'otp') {
      const res = await authService.signInWithOtp(email);
      setIsLoading(false);
      if (res.success) {
        setInfoMessage(res.message);
      } else {
        setErrorMessage(res.error || 'Failed to send OTP link');
      }
      return;
    }

    const res = await authService.signInWithPassword(email, password);
    setIsLoading(false);

    if (res.success && res.user) {
      loginUser({
        ...res.user,
        role: 'customer'
      });
      navigate('/account/daily-milk-tracking');
    } else {
      setErrorMessage(res.error || 'Invalid credentials. Please verify your email and password.');
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(customUrl, customKey);
    setConfigSaved(true);
    setTimeout(() => {
      setConfigSaved(false);
      setShowConfig(false);
    }, 1500);
  };

  const handleQuickCustomerDemo = () => {
    setEmail('customer@dugdhsar.in');
    setPassword('password123');
    loginUser({
      id: 'usr-customer-1',
      email: 'customer@dugdhsar.in',
      fullName: 'Ananya Sharma (Vedic Patron)',
      phone: '+91 7067672604',
      role: 'customer',
      createdAt: '2026-01-01',
      authProvider: 'password'
    });
    navigate('/account/daily-milk-tracking');
  };

  // Google Login handling
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleCustomEmail, setGoogleCustomEmail] = useState('sumitpawar65005@gmail.com');

  const handleGoogleLogin = async (selectedEmail?: string, selectedName?: string) => {
    setIsLoading(true);
    setErrorMessage('');
    setInfoMessage('');

    const targetEmail = selectedEmail || googleCustomEmail || 'sumitpawar65005@gmail.com';
    const targetName = selectedName || (targetEmail.includes('sumit') ? 'Sumit Pawar' : targetEmail.split('@')[0]);

    // Force role: customer for user portal login
    const res = await authService.signInWithGoogle(targetEmail, targetName, undefined, 'customer');
    setIsLoading(false);

    if (res.success && res.user) {
      loginUser({
        ...res.user,
        role: 'customer'
      });
      navigate('/account/daily-milk-tracking');
    } else {
      setErrorMessage(res.error || 'Google login failed. Please try again.');
    }
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
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-16 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        
        <div className="bg-[#FAF6EE] p-6 sm:p-10 rounded-3xl border border-[#D8C9AD] shadow-md relative overflow-hidden">
          
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#263D30] text-[#FAF6EE] flex items-center justify-center shadow-xs">
              <span className="font-serif font-black text-2xl text-[#C2A36C]">D</span>
            </div>

            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A34F37] bg-[#A34F37]/10 px-2.5 py-0.5 rounded-full border border-[#A34F37]/20">
                User Panel · Supabase & Google Auth
              </span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                isConfigured 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {isConfigured ? 'Supabase Connected' : 'Google & Supabase Live'}
              </span>
            </div>

            <h1 className="text-2xl font-serif text-[#263D30] font-bold">
              Sign In to DUGDHSAR
            </h1>
            <p className="text-xs text-[#302C26]/70 mt-1">
              Access your daily morning milk deliveries, schedule pause & orders.
            </p>
          </div>

          {/* PRIMARY: Sign In with Google Button */}
          <div className="mb-5 space-y-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleGoogleLogin('sumitpawar65005@gmail.com', 'Sumit Pawar')}
              className="w-full bg-white hover:bg-neutral-50 text-neutral-800 border-2 border-neutral-300 hover:border-neutral-400 py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-3 shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <GoogleGIcon />
              <span>Continue with Google</span>
              <span className="text-[10px] text-neutral-500 font-normal">sumitpawar65005@gmail.com</span>
            </button>

            {/* Google Account Selector Trigger */}
            <div className="flex items-center justify-between text-[11px] px-1 text-neutral-600">
              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                className="text-[#263D30] hover:text-[#C2A36C] font-semibold underline cursor-pointer"
              >
                Choose another Google account
              </button>
              <span className="text-[10px] text-neutral-400 font-medium">1-Click Fast Sign In</span>
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#D8C9AD]"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-[#FAF6EE] px-3 text-[#302C26]/60">Or Sign in with Email / Supabase</span>
            </div>
          </div>

          {/* 1-Tap Patron Demo Access */}
          <div className="mb-5 p-3 bg-[#F8F4EC] rounded-2xl border border-[#D8C9AD]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#263D30] block">
                  Quick Patron Access
                </span>
                <span className="text-[11px] text-[#302C26]/70">Demo customer with Seoni milk deliveries</span>
              </div>
              <button
                type="button"
                onClick={handleQuickCustomerDemo}
                className="py-1.5 px-3 text-xs font-bold bg-[#263D30] text-[#FAF6EE] hover:bg-[#1A2B22] rounded-xl transition-colors cursor-pointer"
              >
                1-Tap Patron Login
              </button>
            </div>
          </div>

          {/* Alert messages */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Auth Mode Toggle */}
          <div className="flex border border-[#D8C9AD] rounded-xl overflow-hidden mb-4 p-0.5 bg-[#F8F4EC]">
            <button
              type="button"
              onClick={() => setAuthMode('password')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                authMode === 'password' ? 'bg-[#263D30] text-[#FAF6EE]' : 'text-[#302C26]/70 hover:text-[#263D30]'
              }`}
            >
              Password Login
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('otp')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                authMode === 'otp' ? 'bg-[#263D30] text-[#FAF6EE]' : 'text-[#302C26]/70 hover:text-[#263D30]'
              }`}
            >
              OTP / Magic Link
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-[#302C26] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#A34F37]" />
                <span>Email Address *</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@dugdhsar.in"
                className="w-full px-3 py-2.5 text-xs border border-[#D8C9AD] rounded-xl bg-[#F8F4EC] text-[#302C26] focus:outline-none focus:border-[#263D30]"
              />
            </div>

            {authMode === 'password' && (
              <div>
                <label className="block text-xs font-semibold mb-1 text-[#302C26] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#A34F37]" />
                  <span>Password *</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 text-xs border border-[#D8C9AD] rounded-xl bg-[#F8F4EC] text-[#302C26] focus:outline-none focus:border-[#263D30]"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#263D30] hover:bg-[#1A2B22] text-[#FAF6EE] py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Verifying with Supabase...' : authMode === 'otp' ? 'Send OTP Login Link' : 'Sign In with Supabase'}</span>
              <ArrowRight className="w-4 h-4 text-[#C2A36C]" />
            </button>
          </form>

          {/* Registration link */}
          <div className="mt-5 pt-4 border-t border-[#D8C9AD]/40 text-center text-xs text-[#302C26]/75">
            <span>New customer in Seoni? </span>
            <button
              onClick={() => navigate('/account/register')}
              className="text-[#A34F37] font-bold hover:underline cursor-pointer"
            >
              Create Account
            </button>
          </div>

          {/* Separate Portals Direct Switcher */}
          <div className="mt-5 pt-4 border-t border-[#D8C9AD]/50">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#302C26]/60 block text-center mb-2.5">
              Looking for Staff & Enterprise Portals?
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => navigate('/manager/login')}
                className="p-2.5 bg-[#FAF6EE] hover:bg-[#F3EDE1] rounded-xl border border-[#D8C9AD] text-center transition-all group cursor-pointer"
              >
                <div className="text-sm mb-1 group-hover:scale-110 transition-transform">📋</div>
                <div className="text-[11px] font-bold text-[#263D30]">Manager</div>
                <div className="text-[9px] text-[#302C26]/60">Operations</div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/login')}
                className="p-2.5 bg-[#FAF6EE] hover:bg-[#F3EDE1] rounded-xl border border-[#D8C9AD] text-center transition-all group cursor-pointer"
              >
                <div className="text-sm mb-1 group-hover:scale-110 transition-transform">🛡️</div>
                <div className="text-[11px] font-bold text-[#A34F37]">Admin</div>
                <div className="text-[9px] text-[#302C26]/60">Super Console</div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/dealer/login')}
                className="p-2.5 bg-[#FAF6EE] hover:bg-[#F3EDE1] rounded-xl border border-[#D8C9AD] text-center transition-all group cursor-pointer"
              >
                <div className="text-sm mb-1 group-hover:scale-110 transition-transform">🏢</div>
                <div className="text-[11px] font-bold text-[#C2A36C]">Dealer</div>
                <div className="text-[9px] text-[#302C26]/60">B2B Wholesale</div>
              </button>
            </div>
          </div>

          {/* Supabase Project Configuration Toggle */}
          <div className="mt-4 pt-3 border-t border-[#D8C9AD]/40 text-center">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="text-[11px] text-[#302C26]/60 hover:text-[#263D30] flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{showConfig ? 'Hide Supabase Keys' : 'Connect Your Own Supabase Project Keys'}</span>
            </button>

            {showConfig && (
              <form onSubmit={handleSaveConfig} className="mt-3 p-3 bg-white rounded-xl border border-[#D8C9AD] text-left space-y-2.5">
                <span className="text-[10px] font-bold uppercase text-[#263D30] block">
                  Supabase Project Settings
                </span>
                <div>
                  <label className="block text-[10px] text-[#302C26]/70 mb-0.5">Project URL</label>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://your-id.supabase.co"
                    className="w-full px-2.5 py-1.5 text-xs border border-[#D8C9AD] rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#302C26]/70 mb-0.5">Anon Public Key</label>
                  <input
                    type="password"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR..."
                    className="w-full px-2.5 py-1.5 text-xs border border-[#D8C9AD] rounded-lg font-mono"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[9px] text-emerald-800 font-semibold">
                    {configSaved ? 'Saved & Activated!' : 'Saved in browser session'}
                  </span>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-[#263D30] text-[#FAF6EE] rounded-lg text-xs font-semibold"
                  >
                    Save Keys
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>

        {/* Google Account Selector Modal */}
        <GoogleLoginModal 
          isOpen={showGoogleModal} 
          onClose={() => setShowGoogleModal(false)} 
          targetRole="customer" 
          onSuccessRedirect="/account/daily-milk-tracking" 
        />

      </div>
    </div>
  );
};
