import React from 'react';
import { useStore } from '../context/StoreContext';
import { useRouter } from '../router/RouterContext';
import { X, User, ShieldCheck, LogOut, Package, Repeat } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthOpen, setIsAuthOpen, currentUser, switchUserPersona, orders, subscriptions } = useStore();
  const { navigate } = useRouter();

  if (!isAuthOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#FAF6EE] rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-[#D8C9AD] flex flex-col my-8">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#263D30] text-[#FAF6EE] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-[#C2A36C]" />
            <h3 className="text-sm font-serif font-bold uppercase tracking-wider">
              DUGDHSAR Patron Account
            </h3>
          </div>

          <button
            onClick={() => setIsAuthOpen(false)}
            className="p-1.5 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          <div className="flex items-center space-x-3.5 pb-4 border-b border-[#D8C9AD]/50">
            <div className="w-14 h-14 rounded-2xl bg-[#263D30] text-[#FAF6EE] font-serif font-bold text-xl flex items-center justify-center shadow-md">
              {currentUser.fullName.charAt(0)}
            </div>
            <div>
              <h4 className="text-base font-serif font-bold text-[#263D30]">{currentUser.fullName}</h4>
              <p className="text-xs text-[#302C26]/70">{currentUser.email}</p>
              <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded mt-1 ${
                currentUser.role === 'admin' ? 'bg-[#C2A36C]/20 text-[#302C26] font-mono border border-[#C2A36C]/40' : 'bg-[#263D30]/10 text-[#263D30]'
              }`}>
                {currentUser.role === 'admin' ? 'Master Admin' : 'Vedic Dairy Patron'}
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-[#F8F4EC] p-3 rounded-2xl border border-[#D8C9AD]">
              <div className="flex items-center space-x-1.5 text-[#302C26]/60 mb-1">
                <Repeat className="w-3.5 h-3.5 text-[#C2A36C]" />
                <span className="font-semibold">Active Subs</span>
              </div>
              <strong className="text-lg font-bold text-[#263D30] font-mono">{subscriptions.length}</strong>
              <span className="text-[10px] text-[#263D30] block mt-0.5">Morning 05:30 AM</span>
            </div>

            <div className="bg-[#F8F4EC] p-3 rounded-2xl border border-[#D8C9AD]">
              <div className="flex items-center space-x-1.5 text-[#302C26]/60 mb-1">
                <Package className="w-3.5 h-3.5 text-[#263D30]" />
                <span className="font-semibold">Orders Logged</span>
              </div>
              <strong className="text-lg font-bold text-[#263D30] font-mono">{orders.length}</strong>
              <span className="text-[10px] text-[#302C26]/60 block mt-0.5">Cold Chain Tracked</span>
            </div>
          </div>

          {/* Action Navigation */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                setIsAuthOpen(false);
                navigate('/account/daily-milk-tracking');
              }}
              className="w-full py-3 bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Daily Milk Delivery Tracking</span>
              <span className="text-[9px] bg-[#263D30] text-[#FAF6EE] px-1.5 py-0.5 rounded-full">Live</span>
            </button>

            <button
              onClick={() => {
                setIsAuthOpen(false);
                navigate(currentUser.role === 'admin' ? '/admin' : '/account');
              }}
              className="w-full py-2.5 bg-[#263D30] text-[#FAF6EE] font-semibold text-xs rounded-xl hover:bg-[#1A2B22] transition-colors cursor-pointer"
            >
              Open Full {currentUser.role === 'admin' ? 'Admin Operations' : 'Account Dashboard'}
            </button>

            <button
              onClick={() => {
                setIsAuthOpen(false);
                navigate('/account/login');
              }}
              className="w-full py-2 bg-white text-[#263D30] border border-[#D8C9AD] hover:bg-[#FAF6EE] font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Supabase Auth Account Switch
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
