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

export const LoginPage: React.FC = () => {
  const { switchUserPersona, updateProfile } = useStore();
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
      if (res.user.role === 'admin' || email.includes('admin')) {
        switchUserPersona('admin');
        updateProfile({
          fullName: res.user.fullName,
          email: res.user.email,
          phone: res.user.phone
        });
        navigate('/admin');
      } else {
        switchUserPersona('customer');
        updateProfile({
          fullName: res.user.fullName,
          email: res.user.email,
          phone: res.user.phone
        });
        navigate('/account/daily-milk-tracking');
      }
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

  const handleQuickDemo = (role: 'customer' | 'admin') => {
    if (role === 'admin') {
      setEmail('admin@dugdhsar.in');
      setPassword('admin123');
      switchUserPersona('admin');
      navigate('/admin');
    } else {
      setEmail('customer@dugdhsar.in');
      setPassword('password123');
      switchUserPersona('customer');
      navigate('/account/daily-milk-tracking');
    }
  };

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
                User Panel · Supabase Auth
              </span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                isConfigured 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {isConfigured ? 'Supabase Connected' : 'Supabase Ready'}
              </span>
            </div>

            <h1 className="text-2xl font-serif text-[#263D30] font-bold">
              Sign In to DUGDHSAR
            </h1>
            <p className="text-xs text-[#302C26]/70 mt-1">
              Access your daily morning milk deliveries, schedule pause & orders.
            </p>
          </div>

          {/* Quick Demo Persona Shortcuts */}
          <div className="mb-5 p-3 bg-[#F8F4EC] rounded-2xl border border-[#D8C9AD]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A34F37] block mb-2 text-center">
              1-Tap Fast Persona Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('customer')}
                className="py-2 px-3 text-xs font-semibold bg-[#FAF6EE] rounded-xl border border-[#D8C9AD] hover:bg-[#263D30] hover:text-[#FAF6EE] transition-colors cursor-pointer text-center"
              >
                Customer Portal
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="py-2 px-3 text-xs font-semibold bg-[#263D30] text-[#FAF6EE] rounded-xl hover:bg-[#1A2B22] transition-colors cursor-pointer text-center"
              >
                Admin Dispatch
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
      </div>
    </div>
  );
};
