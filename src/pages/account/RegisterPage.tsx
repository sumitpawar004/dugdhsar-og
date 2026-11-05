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
