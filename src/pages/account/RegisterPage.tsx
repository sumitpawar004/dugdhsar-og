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
  ShieldCheck
} from 'lucide-react';
import { authService } from '../../lib/auth';

export const RegisterPage: React.FC = () => {
  const { loginUser } = useStore();
  const { navigate } = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleGoogleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();

    if (!cleanName || !cleanEmail || !cleanPhone) {
      setErrorMessage('Please enter your name, Google email address, and WhatsApp mobile number.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Please enter a valid Google email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const res = await authService.signInWithGoogle(cleanEmail, cleanName, undefined, 'customer');
    setIsLoading(false);

    if (res.success && res.user) {
      loginUser({
        ...res.user,
        fullName: cleanName,
        phone: cleanPhone,
        role: 'customer'
      });
      setSuccessMessage('Google account linked! Opening your private patron workspace...');
      setTimeout(() => {
        navigate('/account/daily-milk-tracking');
      }, 600);
    } else {
      setErrorMessage(res.error || 'Google registration failed. Please check your inputs and try again.');
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

            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Google Account Onboarding</span>
              </span>
            </div>

            <h1 className="text-2xl font-serif text-[#263D30] font-bold">
              Join DUGDHSAR Community
            </h1>
            <p className="text-xs text-[#302C26]/70 mt-1">
              Create your private Google-authenticated patron account for pure morning glass milk deliveries.
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

          <form onSubmit={handleGoogleRegister} className="space-y-4">
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
                placeholder="Enter your full name"
                className="w-full px-3 py-2.5 text-xs border border-[#D8C9AD] rounded-xl bg-[#F8F4EC] text-[#302C26] focus:outline-none focus:border-[#263D30]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[#302C26] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#A34F37]" />
                <span>Google Email Address *</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@gmail.com"
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
                placeholder="+91 9XXXXXXXXX"
                className="w-full px-3 py-2.5 text-xs border border-[#D8C9AD] rounded-xl bg-[#F8F4EC] text-[#302C26] focus:outline-none focus:border-[#263D30]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#263D30] hover:bg-[#1A2B22] text-[#FAF6EE] py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <span className="w-5 h-5 rounded-full bg-white text-[#124A86] font-serif font-black text-[11px] flex items-center justify-center shrink-0">
                G
              </span>
              <span>{isLoading ? 'Connecting Google Account...' : 'Create Account with Google'}</span>
              <ArrowRight className="w-4 h-4 text-[#C2A36C]" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#D8C9AD]/40 text-center text-xs text-[#302C26]/70">
            <span>Already have a Google account here? </span>
            <button
              type="button"
              onClick={() => navigate('/account/login')}
              className="text-[#A34F37] font-bold hover:underline cursor-pointer"
            >
              Sign In with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
