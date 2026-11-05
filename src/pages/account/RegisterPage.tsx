import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/RouterContext';
import { 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Mail, 
  Phone, 
  Lock 
} from 'lucide-react';
import { authService, getSupabaseConfig } from '../../lib/supabase';

export const RegisterPage: React.FC = () => {
  const { switchUserPersona, updateProfile } = useStore();
  const { navigate } = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { isConfigured } = getSupabaseConfig();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const res = await authService.signUp(email, password, fullName, phone);
    setIsLoading(false);

    if (res.success && res.user) {
      switchUserPersona('customer');
      updateProfile({
        fullName,
        email,
        phone
      });
      setSuccessMessage('Account registered successfully with Supabase Auth!');
      setTimeout(() => {
        navigate('/account/daily-milk-tracking');
      }, 1000);
    } else {
      setErrorMessage(res.error || 'Registration failed. Please check your inputs and try again.');
    }
  };

  return (
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-16 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-[#FAF6EE] p-6 sm:p-10 rounded-3xl border border-[#D8C9AD] shadow-md">
          
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#263D30] text-[#FAF6EE] flex items-center justify-center shadow-xs">
              <span className="font-serif font-black text-2xl text-[#C2A36C]">D</span>
            </div>

            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A34F37] bg-[#A34F37]/10 px-2.5 py-0.5 rounded-full border border-[#A34F37]/20">
                Supabase Registration
              </span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                isConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {isConfigured ? 'Supabase Connected' : 'Supabase Ready'}
              </span>
            </div>

            <h1 className="text-2xl font-serif text-[#263D30] font-bold">
              Join DUGDHSAR Community
            </h1>
            <p className="text-xs text-[#302C26]/70 mt-1">
              Register for pure, unadulterated morning glass milk deliveries in Seoni.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Google Quick Sign-Up */}
          <div className="mb-5 space-y-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={async () => {
                setIsLoading(true);
                const res = await authService.signInWithGoogle('customer@dugdhsar.in', 'New Patron');
                setIsLoading(false);
                if (res.success && res.user) {
                  switchUserPersona('customer');
                  updateProfile({
                    fullName: res.user.fullName,
                    email: res.user.email,
                    phone: res.user.phone
                  });
                  navigate('/account/daily-milk-tracking');
                }
              }}
              className="w-full bg-white hover:bg-neutral-50 text-neutral-800 border-2 border-neutral-300 hover:border-neutral-400 py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-3 shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign Up with Google (1-Click)</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#D8C9AD]"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                <span className="bg-[#FAF6EE] px-3 text-[#302C26]/60">Or Register with Email</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-[#302C26] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#A34F37]" />
                <span>Full Name *</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Patel"
                className="w-full px-3 py-2.5 text-xs border border-[#D8C9AD] rounded-xl bg-[#F8F4EC] text-[#302C26] focus:outline-none focus:border-[#263D30]"
              />
            </div>

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
                placeholder="ramesh@example.com"
                className="w-full px-3 py-2.5 text-xs border border-[#D8C9AD] rounded-xl bg-[#F8F4EC] text-[#302C26] focus:outline-none focus:border-[#263D30]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[#302C26] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#A34F37]" />
                <span>WhatsApp Mobile Number *</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="7067672604"
                className="w-full px-3 py-2.5 text-xs border border-[#D8C9AD] rounded-xl bg-[#F8F4EC] text-[#302C26] focus:outline-none focus:border-[#263D30]"
              />
            </div>

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
                placeholder="Minimum 6 characters"
                minLength={6}
                className="w-full px-3 py-2.5 text-xs border border-[#D8C9AD] rounded-xl bg-[#F8F4EC] text-[#302C26] focus:outline-none focus:border-[#263D30]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#263D30] hover:bg-[#1A2B22] text-[#FAF6EE] py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Creating Supabase Account...' : 'Register with Supabase'}</span>
              <ArrowRight className="w-4 h-4 text-[#C2A36C]" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#D8C9AD]/40 text-center text-xs text-[#302C26]/70">
            <span>Already registered? </span>
            <button
              onClick={() => navigate('/account/login')}
              className="text-[#A34F37] font-bold hover:underline cursor-pointer"
            >
              Sign In
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
