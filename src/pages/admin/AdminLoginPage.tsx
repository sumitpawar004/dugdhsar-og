import React, { useState } from 'react';
import { useRouter } from '../../router/RouterContext';
import { ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { GoogleLoginModal } from '../../components/GoogleLoginModal';

export const AdminLoginPage: React.FC = () => {
  const { navigate } = useRouter();
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  return (
    <div className="bg-[#142019] text-[#F3EDE1] min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center font-sans">
      <div className="max-w-lg w-full">
        {/* Header Emblem */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#C2A36C] text-[#263D30] font-serif font-black text-2xl flex items-center justify-center mx-auto shadow-xl mb-4 border border-white/20">
            DS
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C2A36C] block">
            DUGDHSAR Enterprise Security
          </span>
          <h1 className="font-serif text-3xl font-bold text-white mt-1">
            Dairy Operations Admin Console
          </h1>
          <p className="text-xs text-[#F3EDE1]/70 mt-2 max-w-md mx-auto">
            Google-verified administrative access for Seoni processing plant, Cold-Chain logistics &amp; Gaushala operations.
          </p>
        </div>

        {/* Google-Only Admin Sign-In Card */}
        <div className="bg-[#263D30] border-2 border-[#3A5243] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="p-5 rounded-2xl bg-[#1F2F26] border border-[#3A5243] text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/60 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Restricted · Max 3 Enterprise Accounts Limit</span>
            </div>

            <p className="text-xs text-[#F3EDE1]/80 leading-relaxed">
              Only the authorized Primary Admin Google account (1 Admin · 1 Manager · 1 Dealer max) can access Admin Console. Unauthorized logins are blocked.
            </p>

            <button
              type="button"
              onClick={() => setIsGoogleModalOpen(true)}
              className="w-full bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-xs py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-md active:scale-[0.98] cursor-pointer"
            >
              <span className="w-5 h-5 rounded-full bg-[#124A86] text-white font-serif font-black text-[11px] flex items-center justify-center shrink-0">
                G
              </span>
              <span>Sign in with Google (Admin)</span>
              <ArrowRight className="w-4 h-4 text-neutral-700" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-[#C2A36C]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Every session is role-verified and audit logged</span>
            </div>
          </div>

          {/* Separate Portals Switcher */}
          <div className="pt-4 border-t border-[#3A5243] space-y-3">
            <div className="flex items-center justify-between text-[11px] text-[#F3EDE1]/70">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                ← Back to Storefront
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Patron Login →
              </button>
            </div>
            <div className="flex items-center justify-center gap-3 pt-1 text-[11px] flex-wrap">
              <button
                type="button"
                onClick={() => navigate('/manager/login')}
                className="text-[#C2A36C] hover:underline cursor-pointer font-semibold"
              >
                Operations Manager Portal
              </button>
              <span className="text-[#3A5243]">|</span>
              <button
                type="button"
                onClick={() => navigate('/dealer/login')}
                className="text-[#C2A36C] hover:underline cursor-pointer font-semibold"
              >
                B2B Dealer Portal
              </button>
              <span className="text-[#3A5243]">|</span>
              <button
                type="button"
                onClick={() => navigate('/delivery/verify')}
                className="text-emerald-300 hover:underline cursor-pointer font-semibold"
              >
                QR Delivery Scanner
              </button>
            </div>
          </div>
        </div>

        <GoogleLoginModal
          isOpen={isGoogleModalOpen}
          onClose={() => setIsGoogleModalOpen(false)}
          targetRole="admin"
          onSuccessRedirect="/admin/dashboard"
        />
      </div>
    </div>
  );
};
