import React from 'react';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/RouterContext';
import {
  User,
  MapPin,
  Package,
  Heart,
  Sparkles,
  LogOut,
  ShieldCheck,
  ArrowRight,
  Milk
} from 'lucide-react';

export const AccountLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logoutUser } = useStore();
  const { path, navigate } = useRouter();

  const navItems = [
    { label: 'Overview', href: '/account', icon: Sparkles },
    { label: 'My Milk Calendar', href: '/account/daily-milk-tracking', icon: Milk, isLive: true },
    { label: 'Order History', href: '/account/orders', icon: Package },
    { label: 'Delivery Addresses', href: '/account/addresses', icon: MapPin },
    { label: 'Saved Wishlist', href: '/account/wishlist', icon: Heart },
    { label: 'Profile & Security', href: '/account/profile', icon: User }
  ];

  return (
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* User Greeting Bar */}
        <div className="bg-[#FAF6EE] p-6 rounded-2xl border border-[#D8C9AD] mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#263D30] text-[#FAF6EE] font-serif font-bold text-xl flex items-center justify-center shrink-0">
              {currentUser.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-serif text-2xl text-[#263D30] font-semibold truncate">
                  {currentUser.fullName}
                </h1>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#C2A36C]/20 text-[#263D30]">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-[#302C26]/70 truncate">
                {currentUser.email}
                {currentUser.phone ? ` · ${currentUser.phone}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Private Google Session</span>
            </span>
          </div>
        </div>

        {/* Portal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Sidebar Menu (3 cols) */}
          <div className="md:col-span-3 bg-[#FAF6EE] p-3 rounded-2xl border border-[#D8C9AD] shadow-xs space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = path === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#263D30] text-[#FAF6EE]'
                      : 'text-[#302C26] hover:bg-[#D8C9AD]/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.isLive && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500 text-white animate-pulse">
                      Live
                    </span>
                  )}
                </button>
              );
            })}

            {currentUser.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#A34F37] hover:bg-[#F8F4EC] transition-colors text-left mt-2 pt-2 border-t border-[#D8C9AD]/40 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Console</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => {
                logoutUser();
                navigate('/account/login');
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-800 hover:bg-rose-50 transition-colors text-left mt-2 pt-2 border-t border-[#D8C9AD]/40 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-700" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Main Workspace (9 cols) */}
          <div className="md:col-span-9">{children}</div>
        </div>
      </div>
    </div>
  );
};
