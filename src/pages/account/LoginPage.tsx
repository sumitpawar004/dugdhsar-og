import React, { useState } from 'react';
import { useRouter } from '../../router/RouterContext';
import { ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { GoogleLoginModal } from '../../components/GoogleLoginModal';

export const LoginPage: React.FC = () => {
  const { navigate } = useRouter();
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  return (
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-16 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-[#FAF6EE] p-6 sm:p-10 rounded-3xl border border-[#D8C9AD] shadow-md relative overflow-hidden">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#263D30] text-[#FAF6EE] flex items-center justify-center shadow-xs">
              <span className="font-serif font-black text-2xl text-[#C2A36C]">D</span>
            </div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Google Sign-In Only · Private Data</span>
              </span>
            </div>

            <h1 className="text-2xl font-serif text-[#263D30] font-bold">
              Sign In to DUGDHSAR
            </h1>
            <p className="text-xs text-[#302C26]/70 mt-1">
              Sign in with your Google account to manage your daily milk deliveries, doorstep QR codes, and orders.
            </p>
          </div>

          {/* Primary Google Sign-In CTA */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              className="w-full bg-white hover:bg-neutral-50 text-neutral-900 border-2 border-[#263D30] py-3.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-3 shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <span className="w-6 h-6 rounded-full bg-[#124A86] text-white font-serif font-black text-xs flex items-center justify-center shrink-0">
                G
              </span>
              <span>Sign In with Google</span>
              <ArrowRight className="w-4 h-4 text-[#263D30]" />
            </button>

            <div className="p-3.5 bg-[#F8F4EC] rounded-2xl border border-[#D8C9AD] space-y-1.5 text-[11px] text-[#302C26]/80">
              <div className="flex items-center gap-1.5 font-semibold text-[#263D30]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Every Google account gets a clean, isolated workspace</span>
              </div>
              <p className="text-[10px] text-[#302C26]/65 pl-5">
                No shared demo data. Your orders, milk calendar & addresses remain strictly private to your Google login.
              </p>
            </div>
          </div>

          {/* New User link */}
          <div className="pt-4 border-t border-[#D8C9AD]/40 text-center text-xs text-[#302C26]/75">
            <span>New customer in Seoni? </span>
            <button
              type="button"
              onClick={() => navigate('/account/register')}
              className="text-[#A34F37] font-bold hover:underline cursor-pointer"
            >
              Create Account with Google
            </button>
          </div>

          {/* Staff & Enterprise Portals */}
          <div className="mt-5 pt-4 border-t border-[#D8C9AD]/50">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#302C26]/60 block text-center mb-2.5">
              Staff &amp; Delivery Partner Portals
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => navigate('/manager/login')}
                className="p-2.5 bg-[#FAF6EE] hover:bg-[#F3EDE1] rounded-xl border border-[#D8C9AD] text-center transition-all cursor-pointer"
              >
                <div className="text-[11px] font-bold text-[#263D30]">Manager</div>
                <div className="text-[9px] text-[#302C26]/60">Operations</div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/login')}
                className="p-2.5 bg-[#FAF6EE] hover:bg-[#F3EDE1] rounded-xl border border-[#D8C9AD] text-center transition-all cursor-pointer"
              >
                <div className="text-[11px] font-bold text-[#A34F37]">Admin</div>
                <div className="text-[9px] text-[#302C26]/60">Console</div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/dealer/login')}
                className="p-2.5 bg-[#FAF6EE] hover:bg-[#F3EDE1] rounded-xl border border-[#D8C9AD] text-center transition-all cursor-pointer"
              >
                <div className="text-[11px] font-bold text-[#9A7434]">Dealer</div>
                <div className="text-[9px] text-[#302C26]/60">B2B Supply</div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/delivery/verify')}
                className="p-2.5 bg-[#FAF6EE] hover:bg-[#F3EDE1] rounded-xl border border-[#D8C9AD] text-center transition-all cursor-pointer"
              >
                <div className="text-[11px] font-bold text-emerald-800">QR Verify</div>
                <div className="text-[9px] text-[#302C26]/60">Delivery</div>
              </button>
            </div>
          </div>
        </div>

        {/* Google Account Modal */}
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
