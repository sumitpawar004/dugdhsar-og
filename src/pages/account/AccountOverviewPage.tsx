import React from 'react';
import { AccountLayout } from './AccountLayout';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/RouterContext';
import { formatPaise } from '../../types';
import { Package, Sparkles, MapPin, Play, Pause, ArrowRight, Clock, Milk, Calendar, Thermometer, ShoppingBag, Headset, CheckCircle2 } from 'lucide-react';

export const AccountOverviewPage: React.FC = () => {
    const { userSubscriptions: subscriptions, toggleSubscriptionPause, userOrders: orders, userAddresses: addresses, setIsSubscriptionModalOpen } = useStore();
    const { navigate } = useRouter();

    const recentOrder = orders[0];
    const defaultAddress = addresses.find(a => a.isDefault) || addresses[0];
    const activeSub = subscriptions[0];

    return (
      <AccountLayout>
        <div className="space-y-6">
          
          {/* Daily Milk Live Tracking Hero Card */}
          <div className="bg-gradient-to-br from-[#263D30] to-[#1A2B22] text-[#FAF6EE] p-6 sm:p-8 rounded-3xl border border-[#C2A36C]/40 shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#C2A36C]">
                    Today's Live Milk Telemetry · Seoni Dispatch
                  </span>
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF6EE]">
                  Daily Milk Tracking Active
                </h2>
                
                <p className="text-xs text-[#FAF6EE]/80 max-w-lg leading-relaxed">
                  Morning bottle dispatched at 4°C directly from Sukla Sanctuary. Sterile glass seal verified. Track rider, inspect monthly calendar, or pause deliveries with 1 tap.
                </p>

                <div className="flex items-center gap-3 pt-2 text-xs flex-wrap">
                  <span className="bg-[#FAF6EE]/15 px-3 py-1 rounded-lg border border-[#C2A36C]/30 text-[#C2A36C] font-semibold">
                    Slot: {activeSub ? activeSub.deliverySlot : '05:00 AM – 10:00 AM'}
                  </span>
                  <span className="bg-[#FAF6EE]/15 px-3 py-1 rounded-lg border border-white/20 text-[#FAF6EE] font-mono">
                    Qty: {activeSub ? `${activeSub.quantity} Litre(s)` : '1 Litre'}
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-lg font-semibold">
                    Status: {activeSub?.status === 'paused' ? 'Vacation Paused' : 'Dispatched / On Route'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0">
                <button
                  onClick={() => navigate('/account/daily-milk-tracking')}
                  className="px-6 py-3 bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Open Milk Calendar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href="https://wa.me/917067672604?text=Hello%20Dugdhsar%2C%20I%20want%20to%20track%20my%20morning%20milk%20delivery%20in%20Seoni."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-[#FAF6EE] rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 text-center"
                >
                  <span>WhatsApp Rider Helpline</span>
                </a>
              </div>
            </div>
          </div>

          {/* 5 Customer Quick Action Service Cards */}
          <div className="bg-[#FAF6EE] p-6 sm:p-8 rounded-3xl border border-[#D8C9AD] shadow-xs">
            <div className="pb-4 mb-6 border-b border-[#D8C9AD] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#A34F37] block">
                  Quick Access Portal
                </span>
                <h3 className="font-serif text-xl text-[#263D30] font-bold">
                  Your DugdhSar Services
                </h3>
              </div>
              <span className="text-xs text-[#302C26]/70 hidden sm:inline">
                Instant delivery actions & management
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              
              {/* BUTTON 1 – DAILY SUBSCRIPTION */}
              <div 
                onClick={() => setIsSubscriptionModalOpen(true)}
                className="bg-white p-5 rounded-2xl border border-[#D8C9AD] hover:border-[#263D30] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#263D30]/10 text-[#263D30] flex items-center justify-center mb-3 group-hover:bg-[#263D30] group-hover:text-white transition-colors">
                    <Milk className="w-5 h-5" />
                  </div>
                  <h4 className="font-serif font-bold text-sm text-[#263D30] mb-1">
                    Daily Subscription
                  </h4>
                  <p className="text-[11px] text-[#302C26]/75 leading-relaxed">
                    Manage recurring morning milk, quantities, frequency, and pause or resume easily.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#D8C9AD]/50 flex items-center justify-between text-[11px] font-bold text-[#A34F37]">
                  <span>Manage Plan</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* BUTTON 2 – TRACK MY ORDER */}
              <div 
                onClick={() => navigate('/track-order')}
                className="bg-white p-5 rounded-2xl border border-[#D8C9AD] hover:border-[#263D30] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#263D30]/10 text-[#263D30] flex items-center justify-center mb-3 group-hover:bg-[#263D30] group-hover:text-white transition-colors">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h4 className="font-serif font-bold text-sm text-[#263D30] mb-1">
                    Track My Order
                  </h4>
                  <p className="text-[11px] text-[#302C26]/75 leading-relaxed">
                    Check live dispatch status, out-for-delivery updates, cold-chain van, and ETAs.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#D8C9AD]/50 flex items-center justify-between text-[11px] font-bold text-[#A34F37]">
                  <span>Track Van</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* BUTTON 3 – MY ORDERS */}
              <div 
                onClick={() => navigate('/account/orders')}
                className="bg-white p-5 rounded-2xl border border-[#D8C9AD] hover:border-[#263D30] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#263D30]/10 text-[#263D30] flex items-center justify-center mb-3 group-hover:bg-[#263D30] group-hover:text-white transition-colors">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <h4 className="font-serif font-bold text-sm text-[#263D30] mb-1">
                    My Orders
                  </h4>
                  <p className="text-[11px] text-[#302C26]/75 leading-relaxed">
                    View previous & current orders, reorder products, invoices, and payment statuses.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#D8C9AD]/50 flex items-center justify-between text-[11px] font-bold text-[#A34F37]">
                  <span>View Orders</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* BUTTON 4 – HELP & SUPPORT */}
              <a 
                href="https://wa.me/917067672604?text=Hello%20Dugdhsar%20Support%2C%20I%20need%20assistance%20with%20my%20milk%20delivery."
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white p-5 rounded-2xl border border-[#D8C9AD] hover:border-[#263D30] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#263D30]/10 text-[#263D30] flex items-center justify-center mb-3 group-hover:bg-[#263D30] group-hover:text-white transition-colors">
                    <Headset className="w-5 h-5" />
                  </div>
                  <h4 className="font-serif font-bold text-sm text-[#263D30] mb-1">
                    Help & Support
                  </h4>
                  <p className="text-[11px] text-[#302C26]/75 leading-relaxed">
                    Direct WhatsApp customer care (+91 7067672604), FAQ, and delivery complaint desk.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#D8C9AD]/50 flex items-center justify-between text-[11px] font-bold text-[#A34F37]">
                  <span>WhatsApp Care</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>

              {/* BUTTON 5 – MY MILK CALENDAR */}
              <div 
                onClick={() => navigate('/account/daily-milk-tracking')}
                className="bg-gradient-to-br from-[#263D30] to-[#1A2B22] text-[#FAF6EE] p-5 rounded-2xl border-2 border-[#C2A36C] hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#C2A36C] text-[#263D30] flex items-center justify-center mb-3 font-bold">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <h4 className="font-serif font-bold text-sm text-[#FAF6EE]">
                      My Milk Calendar
                    </h4>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-[11px] text-[#FAF6EE]/80 leading-relaxed">
                    Daily tracking calendar, green/red delivery logs, monthly consumption, & dispute desk.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-[11px] font-black text-[#C2A36C]">
                  <span>Open Calendar</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

            </div>
          </div>

          {/* Active Standing Subscriptions */}
          <div className="bg-[#FAF6EE] p-6 sm:p-8 rounded-3xl border border-[#D8C9AD] shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#D8C9AD]">
              <div>
                <h2 className="font-serif text-xl text-[#263D30] font-semibold">
                  Active Subscriptions ({subscriptions.length})
                </h2>
                <p className="text-xs text-[#302C26]/70">
                  Daily farm-fresh doorstep delivery in Seoni: 5:00 AM – 10:00 AM & 6:00 PM – 10:00 PM.
                </p>
              </div>
              <button
                onClick={() => setIsSubscriptionModalOpen(true)}
                className="text-xs font-semibold text-[#A34F37] hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+ Order Morning Bottle</span>
              </button>
            </div>

          <div className="space-y-4">
            {subscriptions.map((sub) => (
              <div 
                key={sub.id}
                className="p-5 rounded-2xl border border-[#D8C9AD] bg-[#F8F4EC] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-serif text-lg font-semibold text-[#263D30]">{sub.productName}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      sub.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {sub.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#302C26]/75">
                    {sub.variant} · {sub.quantity} unit(s) · {sub.frequency} schedule
                  </p>
                  <p className="text-[11px] text-[#A34F37] mt-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Next Drop: <strong>{sub.nextDelivery}</strong></span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSubscriptionPause(sub.id)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#D8C9AD] bg-[#FAF6EE] hover:bg-[#D8C9AD]/30 transition-colors flex items-center gap-1.5"
                  >
                    {sub.status === 'active' ? (
                      <>
                        <Pause className="w-3.5 h-3.5 text-amber-700" />
                        <span>Pause Delivery</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Resume Delivery</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick 2-Column: Recent Order & Default Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {/* Recent Order */}
          <div className="bg-[#FAF6EE] p-6 rounded-3xl border border-[#D8C9AD] shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A34F37] block mb-1">
                Most Recent Order
              </span>
              {recentOrder ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-sm text-[#263D30]">{recentOrder.orderNumber}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                      {recentOrder.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#302C26]/75 mb-2">
                    {recentOrder.items.length} item(s) · {formatPaise(recentOrder.totalPaise)}
                  </p>
                  <p className="text-[11px] text-[#302C26]/60">
                    Slot: {recentOrder.deliverySlot}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[#302C26]/70">No orders placed yet.</p>
              )}
            </div>

            <button
              onClick={() => navigate('/account/orders')}
              className="mt-4 pt-3 border-t border-[#D8C9AD]/40 text-xs font-semibold text-[#263D30] hover:text-[#A34F37] flex items-center justify-between"
            >
              <span>View All Past Orders</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Default Address */}
          <div className="bg-[#FAF6EE] p-6 rounded-3xl border border-[#D8C9AD] shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A34F37] block mb-1">
                Default Morning Address
              </span>
              {defaultAddress ? (
                <div>
                  <span className="font-semibold text-xs text-[#263D30] block mb-1">
                    {defaultAddress.fullName} ({defaultAddress.phone})
                  </span>
                  <p className="text-xs text-[#302C26]/75 leading-relaxed">
                    {defaultAddress.flatNo}, {defaultAddress.apartment}, {defaultAddress.city} — {defaultAddress.pincode}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[#302C26]/70">No address saved.</p>
              )}
            </div>

            <button
              onClick={() => navigate('/account/addresses')}
              className="mt-4 pt-3 border-t border-[#D8C9AD]/40 text-xs font-semibold text-[#263D30] hover:text-[#A34F37] flex items-center justify-between"
            >
              <span>Manage Addresses</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </AccountLayout>
  );
};
