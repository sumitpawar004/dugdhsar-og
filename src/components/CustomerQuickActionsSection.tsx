import React from 'react';
import { useStore } from '../context/StoreContext';
import { useRouter } from '../router/RouterContext';
import { 
  Calendar, 
  MapPin, 
  ShoppingBag, 
  Headset, 
  Milk, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  ShieldCheck,
  Truck
} from 'lucide-react';

export const CustomerQuickActionsSection: React.FC = () => {
  const { setIsSubscriptionModalOpen } = useStore();
  const { navigate } = useRouter();

  return (
    <section className="py-14 sm:py-20 bg-[#F8F4EC] border-b border-[#D8C9AD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#263D30]/10 text-[#263D30] text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-[#A34F37]" />
            <span>Dedicated Patron Services</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl text-[#263D30] font-bold tracking-tight">
            YOUR DUGDHSAR ACCOUNT
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#302C26]/75 leading-relaxed">
            Manage your daily morning A2 bottle, track live cold-chain logistics, inspect monthly delivery calendars, and connect directly with dairy support.
          </p>
        </div>

        {/* 5 Prominent Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          
          {/* BUTTON 1 – DAILY SUBSCRIPTION */}
          <div 
            onClick={() => setIsSubscriptionModalOpen(true)}
            className="bg-[#FAF6EE] rounded-3xl p-6 border border-[#D8C9AD] hover:border-[#263D30] hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer group hover:-translate-y-1"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#263D30] text-[#FAF6EE] flex items-center justify-center mb-4 shadow-xs group-hover:scale-105 transition-transform">
                <Milk className="w-6 h-6 text-[#C2A36C]" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A34F37] block mb-1">
                Button 01
              </span>
              <h3 className="font-serif text-lg font-bold text-[#263D30] mb-2">
                Daily Subscription
              </h3>
              <p className="text-xs text-[#302C26]/75 mb-4 leading-relaxed">
                Manage your daily milk and dairy subscription delivered before dawn.
              </p>

              <ul className="space-y-1.5 text-[11px] text-[#302C26]/80 border-t border-[#D8C9AD]/50 pt-3">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Select milk & dairy items</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Choose daily bottle qty</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Flexible delivery schedule</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>1-Tap pause or resume</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-3 border-t border-[#D8C9AD]/60 flex items-center justify-between text-xs font-bold text-[#263D30] group-hover:text-[#A34F37] transition-colors">
              <span>Start Subscription</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* BUTTON 2 – TRACK MY ORDER */}
          <div 
            onClick={() => navigate('/track-order')}
            className="bg-[#FAF6EE] rounded-3xl p-6 border border-[#D8C9AD] hover:border-[#263D30] hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer group hover:-translate-y-1"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#263D30] text-[#FAF6EE] flex items-center justify-center mb-4 shadow-xs group-hover:scale-105 transition-transform">
                <MapPin className="w-6 h-6 text-[#C2A36C]" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A34F37] block mb-1">
                Button 02
              </span>
              <h3 className="font-serif text-lg font-bold text-[#263D30] mb-2">
                Track My Order
              </h3>
              <p className="text-xs text-[#302C26]/75 mb-4 leading-relaxed">
                Live cold-chain dispatch and route status across Seoni city routes.
              </p>

              <ul className="space-y-1.5 text-[11px] text-[#302C26]/80 border-t border-[#D8C9AD]/50 pt-3">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Enter order ID / Mobile</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Live order confirmation</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Out-for-delivery status</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Estimated delivery time</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-3 border-t border-[#D8C9AD]/60 flex items-center justify-between text-xs font-bold text-[#263D30] group-hover:text-[#A34F37] transition-colors">
              <span>Track Cold-Chain</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* BUTTON 3 – MY ORDERS */}
          <div 
            onClick={() => navigate('/account/orders')}
            className="bg-[#FAF6EE] rounded-3xl p-6 border border-[#D8C9AD] hover:border-[#263D30] hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer group hover:-translate-y-1"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#263D30] text-[#FAF6EE] flex items-center justify-center mb-4 shadow-xs group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-6 h-6 text-[#C2A36C]" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A34F37] block mb-1">
                Button 03
              </span>
              <h3 className="font-serif text-lg font-bold text-[#263D30] mb-2">
                My Orders
              </h3>
              <p className="text-xs text-[#302C26]/75 mb-4 leading-relaxed">
                Review all previous orders, invoices, and reorder favourite dairy staples.
              </p>

              <ul className="space-y-1.5 text-[11px] text-[#302C26]/80 border-t border-[#D8C9AD]/50 pt-3">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Past & ongoing orders</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Instant 1-click reorder</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>View payment receipt</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Download GST invoices</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-3 border-t border-[#D8C9AD]/60 flex items-center justify-between text-xs font-bold text-[#263D30] group-hover:text-[#A34F37] transition-colors">
              <span>View Past Orders</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* BUTTON 4 – HELP & SUPPORT */}
          <a 
            href="https://wa.me/917067672604?text=Hello%20Dugdhsar%2C%20I%20have%20a%20question%20regarding%20my%20milk%20delivery%20in%20Seoni."
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#FAF6EE] rounded-3xl p-6 border border-[#D8C9AD] hover:border-[#263D30] hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer group hover:-translate-y-1"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#263D30] text-[#FAF6EE] flex items-center justify-center mb-4 shadow-xs group-hover:scale-105 transition-transform">
                <Headset className="w-6 h-6 text-[#C2A36C]" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A34F37] block mb-1">
                Button 04
              </span>
              <h3 className="font-serif text-lg font-bold text-[#263D30] mb-2">
                Help & Support
              </h3>
              <p className="text-xs text-[#302C26]/75 mb-4 leading-relaxed">
                Dedicated WhatsApp dispatch support (+91 7067672604) and customer desk.
              </p>

              <ul className="space-y-1.5 text-[11px] text-[#302C26]/80 border-t border-[#D8C9AD]/50 pt-3">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Instant WhatsApp chat</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Direct phone line support</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Frequently asked questions</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Complaint & bottle issues</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-3 border-t border-[#D8C9AD]/60 flex items-center justify-between text-xs font-bold text-[#263D30] group-hover:text-[#A34F37] transition-colors">
              <span>Open Help Desk</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>

          {/* BUTTON 5 – MY MILK CALENDAR */}
          <div 
            onClick={() => navigate('/account/daily-milk-tracking')}
            className="bg-gradient-to-br from-[#263D30] to-[#1A2B22] text-[#FAF6EE] rounded-3xl p-6 border-2 border-[#C2A36C] hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer group hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#C2A36C] text-[#263D30] flex items-center justify-center mb-4 shadow-md font-bold group-hover:scale-105 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#C2A36C]">
                  Featured Service
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#FAF6EE] mb-2">
                My Milk Calendar
              </h3>
              <p className="text-xs text-[#FAF6EE]/80 mb-4 leading-relaxed">
                Color-coded daily delivery tracker, consumption metrics & dispute reporting.
              </p>

              <ul className="space-y-1.5 text-[11px] text-[#FAF6EE]/90 border-t border-white/20 pt-3">
                <li className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span>Green: Delivered drops</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                  <span>Red: Missed deliveries</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span>Yellow: Scheduled drops</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
                  <span>Report wrong quantity</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-black text-[#C2A36C] group-hover:text-white transition-colors relative z-10">
              <span>Open Milk Calendar</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
