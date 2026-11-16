import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/RouterContext';
import { formatPaise } from '../../types';
import { 
  Building2, 
  Package, 
  ShoppingCart, 
  Boxes, 
  FileText, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Truck, 
  ArrowRight, 
  Download, 
  ShieldCheck, 
  Plus, 
  LogOut,
  UserCheck
} from 'lucide-react';
import { GoogleLoginModal } from '../../components/GoogleLoginModal';
import { isEmailAuthorizedForPortal } from '../../lib/auth';

export const DealerPortalPage: React.FC = () => {
  const { path, navigate } = useRouter();
  const { currentUser, logoutUser, recordAuditLog } = useStore();

  const subRoute = path.split('/')[2] || 'dashboard';

  // Dealer authentication state: strictly authorized Dealer or Owner Admin (max 3-account registry)
  const isAuthorizedDealer =
    (currentUser.role === 'dealer' || currentUser.role === 'admin') &&
    Boolean(currentUser.email) &&
    isEmailAuthorizedForPortal(currentUser.email, 'dealer');
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const dealerName = isAuthorizedDealer ? currentUser.fullName : 'Authorized Dealer Partner';
  const dealerEmail = isAuthorizedDealer ? currentUser.email : '';
  const dealerTier = 'Partner · Seoni Region';

  // Wholesale inventory catalog for B2B Dealers
  const wholesaleProducts = [
    {
      id: 'bulk-whole-milk',
      name: 'A2 Desi Gir Cow Whole Milk (50L Bulk Crate)',
      spec: '50 Glass Bottles (1L each) in Insulated Cold Crate',
      mrpPaise: 850000, // ₹8,500
      wholesalePaise: 700000, // ₹7,000 (₹1,500 margin)
      marginPaise: 150000,
      stockCrates: 42,
      moq: '2 Crates'
    },
    {
      id: 'bulk-bilona-ghee',
      name: 'Vedic Traditional Bilona Cow Ghee (15kg Commercial Tin)',
      spec: 'Hand-churned wooden bilona ghee in food-grade sealed tin',
      mrpPaise: 3597000, // ₹35,970
      wholesalePaise: 2950000, // ₹29,500 (₹6,470 margin)
      marginPaise: 647000,
      stockCrates: 18,
      moq: '1 Tin'
    },
    {
      id: 'bulk-malai-paneer',
      name: 'Fresh A2 Malai Paneer (10kg Vacuum Block)',
      spec: 'Low-moisture, high protein block for sweet makers & hotels',
      mrpPaise: 800000, // ₹8,000
      wholesalePaise: 640000, // ₹6,400 (₹1,600 margin)
      marginPaise: 160000,
      stockCrates: 25,
      moq: '2 Blocks'
    },
    {
      id: 'bulk-danedar-khoya',
      name: 'Pure Vedic Danedar Mawa / Khoya (10kg Block)',
      spec: 'Slow-simmered pure Gir cow khoya for traditional mithai',
      mrpPaise: 600000, // ₹6,000
      wholesalePaise: 480000, // ₹4,800 (₹1,200 margin)
      marginPaise: 120000,
      stockCrates: 14,
      moq: '1 Block'
    }
  ];

  // Dealer Orders state (starts clean per dealer session)
  const [dealerOrders, setDealerOrders] = useState<Array<{
    id: string;
    date: string;
    items: string;
    totalPaise: number;
    status: string;
    challanNo: string;
    vehicleNo: string;
  }>>([]);

  const [orderNotice, setOrderNotice] = useState<string | null>(null);

  const handlePlaceWholesaleOrder = (prodName: string, wholesalePaise: number) => {
    const newOrd = {
      id: `WHL-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      items: `1x ${prodName}`,
      totalPaise: wholesalePaise,
      status: 'Confirmed (Scheduled for Dawn Cold-Chain)',
      challanNo: `CH-SEONI-${Math.floor(1000 + Math.random() * 9000)}`,
      vehicleNo: 'Insulated Cold-Chain Van'
    };

    setDealerOrders(prev => [newOrd, ...prev]);
    recordAuditLog('DEALER_WHOLESALE_ORDER', 'DEALER_PORTAL', newOrd.id, {
      dealerEmail,
      dealerName,
      items: newOrd.items,
      totalPaise: newOrd.totalPaise
    });

    setOrderNotice(`Wholesale Order ${newOrd.id} booked successfully!`);
    setTimeout(() => setOrderNotice(null), 4000);
  };

  // Login View if requested or if unauthorized
  if (subRoute === 'login' || !isAuthorizedDealer) {
    return (
      <div className="bg-[#142019] text-[#F3EDE1] min-h-screen py-16 px-4 flex flex-col justify-center items-center font-sans">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#C2A36C] text-[#263D30] font-serif font-black text-2xl flex items-center justify-center mx-auto shadow-xl mb-3">
              <Building2 className="w-8 h-8 text-[#263D30]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C2A36C] block">
              DUGDHSAR Enterprise B2B Network
            </span>
            <h1 className="font-serif text-3xl font-bold text-white mt-1">
              Authorized Dealer Portal
            </h1>
            <p className="text-xs text-[#F3EDE1]/70 mt-1.5">
              Wholesale milk crates, commercial bilona ghee tins & institutional supply dispatch.
            </p>
          </div>

          <div className="bg-[#263D30] border border-[#3A5243] rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
            {/* GOOGLE SIGN IN FOR DEALERS */}
            <div className="p-4 bg-[#1F2F26] border border-[#3A5243] rounded-2xl text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/60 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Restricted · Max 3 Enterprise Accounts Limit</span>
              </div>
              <p className="text-xs text-[#F3EDE1]/80">
                Sign in with your Admin-authorized Google account to access B2B wholesale supply. Unauthorized emails are blocked.
              </p>
              <button
                type="button"
                onClick={() => setIsGoogleModalOpen(true)}
                className="w-full py-3.5 bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-xs rounded-xl flex items-center justify-center gap-3 transition-all shadow-md active:scale-98 cursor-pointer"
              >
                <span className="w-5 h-5 rounded-full bg-[#124A86] text-white font-serif font-black text-[11px] flex items-center justify-center shrink-0">
                  G
                </span>
                <span>Continue with Google (Dealer)</span>
                <ArrowRight className="w-4 h-4 text-neutral-700" />
              </button>
            </div>

            <div className="pt-2 border-t border-[#3A5243] text-center text-xs text-[#F3EDE1]/60 space-y-2">
              <p>
                New dealer registration? Call Central Dispatch: <strong className="text-white">+91 7067672604</strong>
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-[#C2A36C] hover:underline font-semibold cursor-pointer"
              >
                ← Back to Patron Google Login
              </button>
            </div>
          </div>
        </div>

        <GoogleLoginModal
          isOpen={isGoogleModalOpen}
          onClose={() => setIsGoogleModalOpen(false)}
          targetRole="dealer"
          onSuccessRedirect="/dealer/dashboard"
        />
      </div>
    );
  }

  return (
    <div className="bg-[#142019] text-[#F3EDE1] min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Dealer Header */}
        <div className="bg-[#263D30] border border-[#3A5243] p-6 rounded-3xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#C2A36C] text-[#263D30] flex items-center justify-center font-bold">
              <Building2 className="w-6 h-6 text-[#263D30]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-white">
                  {dealerName}
                </h1>
                <span className="bg-[#C2A36C]/20 border border-[#C2A36C]/50 text-[#C2A36C] text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                  {dealerTier}
                </span>
              </div>
              <p className="text-xs text-[#F3EDE1]/70">
                {dealerEmail} · Verified B2B Partner Account
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="px-3.5 py-1.5 rounded-xl bg-[#1F2F26] text-white border border-[#3A5243] text-xs font-semibold hover:bg-[#2A4033] transition-colors cursor-pointer"
              >
                Admin Console
              </button>
            )}
            <button
              onClick={() => {
                logoutUser();
                navigate('/dealer/login');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-rose-950/40 text-rose-300 border border-rose-800 text-xs font-semibold hover:bg-rose-900/40 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Dealer Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-[#3A5243]">
          {[
            { id: 'dashboard', label: 'Dealer Overview', icon: TrendingUp },
            { id: 'orders', label: 'Wholesale Orders & Booking', icon: ShoppingCart },
            { id: 'inventory', label: 'Depot Stock & Cold-Chain', icon: Boxes },
            { id: 'reports', label: 'GST Statements & Invoices', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = subRoute === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(`/dealer/${tab.id}`)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isCurrent
                    ? 'bg-[#C2A36C] text-[#263D30] shadow-md'
                    : 'bg-[#263D30] text-[#F3EDE1]/80 hover:bg-[#1F2F26] hover:text-white border border-[#3A5243]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {orderNotice && (
          <div className="mb-6 p-4 bg-emerald-950/60 border border-emerald-500 rounded-2xl text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{orderNotice}</span>
          </div>
        )}

        {/* Sub-Route Views */}
        
        {/* 1. DASHBOARD */}
        {subRoute === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-[#263D30] p-5 rounded-2xl border border-[#3A5243]">
                <span className="text-[10px] uppercase font-bold text-[#C2A36C] block mb-1">Monthly Crate Quota</span>
                <span className="text-2xl font-bold font-mono text-white">450 / 500 Crates</span>
                <p className="text-[10px] text-emerald-400 mt-1">90% Fulfilled on time</p>
              </div>

              <div className="bg-[#263D30] p-5 rounded-2xl border border-[#3A5243]">
                <span className="text-[10px] uppercase font-bold text-[#C2A36C] block mb-1">Available Credit Line</span>
                <span className="text-2xl font-bold font-mono text-white">₹3,84,500</span>
                <p className="text-[10px] text-[#F3EDE1]/70 mt-1">Net-15 Days Settlement</p>
              </div>

              <div className="bg-[#263D30] p-5 rounded-2xl border border-[#3A5243]">
                <span className="text-[10px] uppercase font-bold text-[#C2A36C] block mb-1">Next Dawn Dispatch</span>
                <span className="text-2xl font-bold font-mono text-white">Tomorrow 05:30 AM</span>
                <p className="text-[10px] text-emerald-400 mt-1">Cold Van #MP-28-D-1964</p>
              </div>

              <div className="bg-[#263D30] p-5 rounded-2xl border border-[#3A5243]">
                <span className="text-[10px] uppercase font-bold text-[#C2A36C] block mb-1">Gross Margin Earned</span>
                <span className="text-2xl font-bold font-mono text-white">₹1,42,800</span>
                <p className="text-[10px] text-emerald-400 mt-1">+22% over last month</p>
              </div>
            </div>

            {/* Quick Crate Reorder Strip */}
            <div className="bg-[#263D30] p-6 rounded-2xl border border-[#3A5243]">
              <h3 className="font-serif text-lg font-bold text-white mb-4">
                Popular Wholesale SKUs (1-Tap Fast Crate Booking)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {wholesaleProducts.map((p) => (
                  <div key={p.id} className="p-4 bg-[#1F2F26] rounded-xl border border-[#3A5243] flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <strong className="text-xs font-bold text-white">{p.name}</strong>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 shrink-0">
                          Margin: {formatPaise(p.marginPaise)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#F3EDE1]/70 mt-1">{p.spec}</p>
                      <div className="flex items-center gap-3 mt-3 text-xs">
                        <span className="text-[#F3EDE1]/80">Wholesale: <strong className="text-[#C2A36C] font-mono">{formatPaise(p.wholesalePaise)}</strong></span>
                        <span className="text-[#F3EDE1]/50 line-through text-[11px]">MRP: {formatPaise(p.mrpPaise)}</span>
                        <span className="text-[10px] text-emerald-300 ml-auto">Stock: {p.stockCrates}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePlaceWholesaleOrder(p.name, p.wholesalePaise)}
                      className="mt-3.5 w-full py-2 bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] font-black text-xs uppercase tracking-wider rounded-lg transition-all active:scale-95 cursor-pointer"
                    >
                      Book 1 Wholesale Unit ({formatPaise(p.wholesalePaise)})
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. WHOLESALE ORDERS */}
        {subRoute === 'orders' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-white">
                Wholesale Crate Orders & Dispatch Status
              </h2>
              <span className="text-xs text-[#C2A36C]">Showing {dealerOrders.length} B2B orders</span>
            </div>

            <div className="bg-[#263D30] rounded-2xl border border-[#3A5243] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1F2F26] text-[#C2A36C] uppercase text-[10px] tracking-wider border-b border-[#3A5243]">
                    <tr>
                      <th className="p-3.5">Order ID</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Wholesale Items</th>
                      <th className="p-3.5">Challan / Vehicle</th>
                      <th className="p-3.5">Invoice Amount</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3A5243]">
                    {dealerOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-[#1F2F26]/50">
                        <td className="p-3.5 font-mono font-bold text-white">{o.id}</td>
                        <td className="p-3.5 text-[#F3EDE1]/80">{o.date}</td>
                        <td className="p-3.5 font-semibold text-white">{o.items}</td>
                        <td className="p-3.5 font-mono text-[11px] text-[#C2A36C]">
                          {o.challanNo} · {o.vehicleNo}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-emerald-400">
                          {formatPaise(o.totalPaise)}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/70 border border-emerald-600 text-emerald-300">
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. INVENTORY */}
        {subRoute === 'inventory' && (
          <div className="space-y-6">
            <h2 className="font-serif text-xl font-bold text-white">
              Live Cold-Hub Depot Inventory (Seoni Depot & Sukla Hub)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wholesaleProducts.map((p) => (
                <div key={p.id} className="p-5 bg-[#263D30] rounded-2xl border border-[#3A5243] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-base font-bold text-white">{p.name}</h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-400 font-bold">
                      Available Stock: {p.stockCrates}
                    </span>
                  </div>
                  <p className="text-xs text-[#F3EDE1]/70">{p.spec}</p>
                  <div className="p-3 bg-[#1F2F26] rounded-xl text-xs space-y-1 text-[#F3EDE1]/80">
                    <div className="flex justify-between">
                      <span>Cold Vault Temp:</span>
                      <strong className="text-emerald-400 font-mono">3.4°C (Normal)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Next Milking Batch Arrival:</span>
                      <strong className="text-[#C2A36C]">Tomorrow 04:30 AM</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Minimum Order Qty (MOQ):</span>
                      <strong className="text-white">{p.moq}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. REPORTS */}
        {subRoute === 'reports' && (
          <div className="space-y-6">
            <h2 className="font-serif text-xl font-bold text-white">
              Financial Statements, GST & Supply Challans
            </h2>
            <div className="bg-[#263D30] p-6 rounded-2xl border border-[#3A5243] space-y-4">
              {[
                { title: 'February 2026 Monthly GST Supply Statement (GSTR-1 Ready)', size: '2.4 MB', date: '01 Mar 2026' },
                { title: 'Tax Invoice & Delivery Challan Bundle (MP-28 Fleet)', size: '1.8 MB', date: '04 Mar 2026' },
                { title: 'Dealer Volume Incentive & Margin Reconciliation', size: '940 KB', date: '28 Feb 2026' }
              ].map((doc, i) => (
                <div key={i} className="p-4 bg-[#1F2F26] rounded-xl border border-[#3A5243] flex items-center justify-between gap-4">
                  <div>
                    <strong className="text-xs font-bold text-white block">{doc.title}</strong>
                    <span className="text-[10px] text-[#F3EDE1]/60">{doc.date} · {doc.size} · Digitally Signed (FSSAI/GSTIN Verified)</span>
                  </div>
                  <button
                    onClick={() => setOrderNotice(`Preparing ${doc.title} statement download...`)}
                    className="px-3 py-1.5 bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
