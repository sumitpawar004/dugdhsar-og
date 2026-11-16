import React, { useState } from 'react';
import { useRouter } from '../../router/RouterContext';
import { Briefcase, ArrowRight, ShieldCheck } from 'lucide-react';
import { GoogleLoginModal } from '../../components/GoogleLoginModal';

export const ManagerLoginPage: React.FC = () => {
  const { navigate } = useRouter();
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  return (
    <div className="bg-[#12231A] text-[#F3EDE1] min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center font-sans">
      <div className="max-w-lg w-full">
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
            Google-verified access for Dairy Operations Managers to manage product catalogs, milk subscriptions, delivery vans, and Google Sheets sync.
          </p>
        </div>

        {/* Google-Only Manager Login Card */}
        <div className="bg-[#1D3527] border-2 border-[#3A5243] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="p-5 rounded-2xl bg-[#14261C] border border-[#3A5243] text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/60 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Restricted · Max 3 Enterprise Accounts Limit</span>
            </div>
            <p className="text-xs text-[#F3EDE1]/75">
              Sign in with your Admin-authorized Google account (1 Admin · 1 Manager · 1 Dealer max). Unauthorized accounts are blocked:
            </p>
            <button
              type="button"
              onClick={() => setIsGoogleModalOpen(true)}
              className="w-full py-3.5 px-4 bg-white hover:bg-gray-100 text-[#1F2F26] rounded-xl font-bold text-xs flex items-center justify-center gap-3 shadow-md cursor-pointer transition-transform active:scale-98"
            >
              <span className="w-5 h-5 rounded-full bg-[#124A86] text-white font-serif font-black text-[11px] flex items-center justify-center shrink-0">
                G
              </span>
              <span>Sign in with Google as Operations Manager</span>
              <ArrowRight className="w-4 h-4 text-[#1F2F26]" />
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
            Admin Portal →
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
