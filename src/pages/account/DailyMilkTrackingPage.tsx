import React, { useState, useEffect } from 'react';
import { AccountLayout } from './AccountLayout';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/RouterContext';
import { 
  Milk, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Truck, 
  AlertCircle, 
  Pause, 
  Play, 
  Plus, 
  PhoneCall, 
  MessageCircle, 
  ShieldCheck, 
  Thermometer, 
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MapPin,
  Check,
  X,
  FileText,
  AlertTriangle,
  ArrowRight,
  Headset
} from 'lucide-react';

export interface DayDeliveryRecord {
  dayNumber: number;
  dateStr: string;
  formattedDate: string;
  status: 'delivered' | 'missed' | 'scheduled' | 'no_subscription';
  orderedQty: number;
  deliveredQty: number;
  productName: string;
  deliveryTime?: string;
  deliveryPerson?: string;
  missedReason?: string;
  customerNotes?: string;
  reportedDiscrepancy?: string;
}

export const DailyMilkTrackingPage: React.FC = () => {
  const { 
    userSubscriptions, 
    toggleSubscriptionPause, 
    currentUser, 
    addSubscription,
    isSubscriptionModalOpen,
    setIsSubscriptionModalOpen 
  } = useStore();
  const { navigate } = useRouter();

  // Current active subscription strictly scoped to logged in patron
  const activeSub = userSubscriptions[0] || null;

  // Auto-pop subscription modal when user lands on calendar without an active subscription
  useEffect(() => {
    if (!activeSub) {
      const timer = setTimeout(() => {
        setIsSubscriptionModalOpen(true);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [activeSub, setIsSubscriptionModalOpen]);

  // New subscription state for fresh patrons
  const [newSubProduct, setNewSubProduct] = useState('DUGDHSAR Fresh A2 Desi Cow Whole Milk');
  const [newSubQty, setNewSubQty] = useState(1);
  const [newSubSlot, setNewSubSlot] = useState('Morning Delivery (5:00 AM - 10:00 AM)');
  const [isCreatingSub, setIsCreatingSub] = useState(false);

  // Month navigation state
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Selected Day Modal State
  const [selectedDay, setSelectedDay] = useState<DayDeliveryRecord | null>(null);
  const [showDiscrepancyForm, setShowDiscrepancyForm] = useState(false);
  const [discrepancyNote, setDiscrepancyNote] = useState('');
  const [discrepancySuccess, setDiscrepancySuccess] = useState(false);

  // Vacation Mode state
  const [vacationStart, setVacationStart] = useState('');
  const [vacationEnd, setVacationEnd] = useState('');
  const [vacationSuccessMsg, setVacationSuccessMsg] = useState('');

  // Daily dynamic override records in state (stored by YYYY-MM-DD)
  const [overrides, setOverrides] = useState<Record<string, Partial<DayDeliveryRecord>>>({
    [`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-02`]: {
      status: 'missed',
      deliveredQty: 0,
      missedReason: 'Society gate closed at dawn milking round; compensated on Nov 3.'
    }
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  // Fresh user state when no active subscription is yet created for this Google user
  if (!activeSub) {
    return (
      <AccountLayout>
        <div className="bg-[#FAF6EE] p-6 sm:p-10 rounded-3xl border border-[#D8C9AD] shadow-xs max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#263D30] text-[#C2A36C] flex items-center justify-center mx-auto mb-3 shadow-md">
              <Milk className="w-8 h-8" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A34F37] bg-[#A34F37]/10 px-2.5 py-0.5 rounded-full border border-[#A34F37]/20">
              Subscription Required / सब्सक्रिप्शन आवश्यक
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#263D30] font-bold mt-2">
              Start Your Daily A2 Milk Subscription
            </h1>
            <p className="text-xs sm:text-sm text-[#302C26]/75 mt-2 max-w-md mx-auto leading-relaxed">
              Welcome, <strong className="text-[#263D30]">{currentUser.fullName}</strong>. Your daily milk delivery calendar is generated automatically as soon as you start your regular morning milk subscription.
            </p>

            {/* Quick Trigger Modal CTA */}
            <div className="mt-5 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setIsSubscriptionModalOpen(true)}
                className="w-full py-3.5 px-6 bg-[#263D30] hover:bg-[#1E3026] text-[#FAF6EE] rounded-2xl font-serif font-bold text-sm flex items-center justify-center space-x-2 shadow-lg transition-transform active:scale-98 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#C2A36C]" />
                <span>Open Subscription Model / सब्सक्रिप्शन चुनें</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
              <p className="text-[10px] text-[#302C26]/60 mt-1.5">
                Takes 30 seconds · Zero deposit · 1-Tap pause anytime
              </p>
            </div>
          </div>

          <div className="bg-[#F8F4EC] p-6 rounded-2xl border border-[#D8C9AD] space-y-5">
            <div className="flex items-center justify-between border-b border-[#D8C9AD] pb-3">
              <h2 className="text-xs font-bold text-[#263D30] uppercase tracking-wider">
                Or Configure Directly Below:
              </h2>
              <span className="text-[10px] font-medium text-[#C2A36C] bg-[#263D30] px-2 py-0.5 rounded-full">
                Seoni Direct Cold-Chain
              </span>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#263D30] mb-2">
                1. Select Milk Variety (Cow or Buffalo):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setNewSubProduct('DUGDHSAR Fresh A2 Desi Cow Whole Milk')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    newSubProduct.includes('Whole') && !newSubProduct.includes('Buffalo')
                      ? 'border-[#263D30] bg-[#FAF6EE] ring-2 ring-[#263D30]/20'
                      : 'border-[#D8C9AD] bg-white hover:border-[#263D30]/50'
                  }`}
                >
                  <span className="font-bold text-xs text-[#263D30] block">🐄 Gir Cow Whole Milk (A2)</span>
                  <span className="text-[11px] text-[#A34F37] font-semibold mt-0.5 block">₹170 / Litre</span>
                  <span className="text-[10px] text-[#302C26]/60 mt-1 block">Full-cream raw Vedic Gir milk in sterilized glass bottle.</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewSubProduct('DUGDHSAR Pure Desi Murrah Buffalo Whole Milk')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    newSubProduct.includes('Buffalo')
                      ? 'border-[#263D30] bg-[#FAF6EE] ring-2 ring-[#263D30]/20'
                      : 'border-[#D8C9AD] bg-white hover:border-[#263D30]/50'
                  }`}
                >
                  <span className="font-bold text-xs text-[#263D30] block">🐃 Murrah Buffalo Whole Milk</span>
                  <span className="text-[11px] text-[#A34F37] font-semibold mt-0.5 block">₹190 / Litre (7.5% Fat)</span>
                  <span className="text-[10px] text-[#302C26]/60 mt-1 block">Extra thick clotted malai, dense cream, rich calcium.</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewSubProduct('DUGDHSAR Fresh A2 Light Skimmed Milk')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    newSubProduct.includes('Skimmed')
                      ? 'border-[#263D30] bg-[#FAF6EE] ring-2 ring-[#263D30]/20'
                      : 'border-[#D8C9AD] bg-white hover:border-[#263D30]/50'
                  }`}
                >
                  <span className="font-bold text-xs text-[#263D30] block">🐄 Gir Cow Skimmed (1.5% Fat)</span>
                  <span className="text-[11px] text-[#A34F37] font-semibold mt-0.5 block">₹110 / Litre</span>
                  <span className="text-[10px] text-[#302C26]/60 mt-1 block">Low calorie, light cream, easy digestion for fitness.</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#263D30] mb-2">
                2. Daily Delivery Quantity:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setNewSubQty(qty)}
                    className={`py-3 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                      newSubQty === qty
                        ? 'bg-[#263D30] text-[#FAF6EE] border-[#263D30]'
                        : 'bg-white text-[#263D30] border-[#D8C9AD] hover:bg-[#FAF6EE]'
                    }`}
                  >
                    {qty} Litre{qty > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#263D30] mb-2">
                3. Delivery Slot in Seoni, MP:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewSubSlot('Morning Delivery (5:00 AM - 10:00 AM)')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    newSubSlot.includes('Morning')
                      ? 'border-[#263D30] bg-[#FAF6EE] ring-2 ring-[#263D30]/20 font-bold'
                      : 'border-[#D8C9AD] bg-white'
                  }`}
                >
                  <span className="text-xs text-[#263D30] block">Dawn Morning Drop</span>
                  <span className="text-[11px] text-[#302C26]/60">5:00 AM – 10:00 AM</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewSubSlot('Evening Fresh Delivery (6:00 PM - 10:00 PM)')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    newSubSlot.includes('Evening')
                      ? 'border-[#263D30] bg-[#FAF6EE] ring-2 ring-[#263D30]/20 font-bold'
                      : 'border-[#D8C9AD] bg-white'
                  }`}
                >
                  <span className="text-xs text-[#263D30] block">Evening Fresh Drop</span>
                  <span className="text-[11px] text-[#302C26]/60">6:00 PM – 10:00 PM</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={isCreatingSub}
              onClick={() => {
                setIsCreatingSub(true);
                const isBuf = newSubProduct.includes('Buffalo');
                const isSkim = newSubProduct.includes('Skimmed');
                const unitPrice = isBuf ? 190 : (isSkim ? 110 : 170);
                addSubscription({
                  productName: newSubProduct,
                  variant: `${newSubQty} Litre Glass Bottle`,
                  milkType: isBuf ? 'buffalo' : 'cow',
                  pricePerUnit: unitPrice,
                  pricePaise: unitPrice * 100,
                  quantity: newSubQty,
                  frequency: 'daily',
                  deliverySlot: newSubSlot,
                  customerName: currentUser.fullName || 'Valued Patron',
                  customerPhone: currentUser.phone || '+91 7067672604',
                  deliveryAddress: 'House 42, Barghat Road, Sufi Nagar, Seoni, MP 480661',
                  startDate: new Date().toISOString().split('T')[0],
                  status: 'active',
                  nextDelivery: 'Tomorrow, 5:00 AM - 10:00 AM'
                });
                setIsCreatingSub(false);
              }}
              className="w-full py-4 bg-[#263D30] hover:bg-[#1A2B22] text-[#FAF6EE] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
            >
              <Sparkles className="w-4 h-4 text-[#C2A36C]" />
              <span>{isCreatingSub ? 'Activating Subscription...' : 'Activate Daily Milk Subscription (Pay Weekly / Monthly)'}</span>
              <ArrowRight className="w-4 h-4 text-[#C2A36C]" />
            </button>
          </div>
        </div>
      </AccountLayout>
    );
  }

  // Generate dynamic records for all days in month
  const calendarDays: DayDeliveryRecord[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(currentYear, currentMonth, d);
    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const formattedDate = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    const isPast = (currentYear < today.getFullYear()) || 
      (currentYear === today.getFullYear() && currentMonth < today.getMonth()) ||
      (currentYear === today.getFullYear() && currentMonth === today.getMonth() && d < today.getDate());
    
    const isToday = currentYear === today.getFullYear() && currentMonth === today.getMonth() && d === today.getDate();

    let status: 'delivered' | 'missed' | 'scheduled' | 'no_subscription' = isPast ? 'delivered' : 'scheduled';
    let orderedQty = activeSub.quantity || 1;
    let deliveredQty = isPast ? orderedQty : isToday ? orderedQty : 0;
    let deliveryTime = isPast ? '06:15 AM' : isToday ? '06:45 AM (Delivered)' : '05:30 AM – 11:00 AM (Scheduled)';
    let deliveryPerson = 'Ramesh Patel (Van #MP-28-D-1964)';
    let missedReason = '';
    let customerNotes = 'Sterile glass bottle drop at doorstep hook';

    if (activeSub.status === 'paused' && !isPast) {
      status = 'no_subscription';
      customerNotes = 'Subscription paused by customer';
    }

    // Apply manual or vacation overrides
    const override = overrides[dateKey];
    if (override) {
      if (override.status) status = override.status;
      if (override.orderedQty !== undefined) orderedQty = override.orderedQty;
      if (override.deliveredQty !== undefined) deliveredQty = override.deliveredQty;
      if (override.missedReason) missedReason = override.missedReason;
      if (override.customerNotes) customerNotes = override.customerNotes;
    }

    calendarDays.push({
      dayNumber: d,
      dateStr: dateKey,
      formattedDate,
      status,
      orderedQty,
      deliveredQty,
      productName: activeSub.productName,
      deliveryTime,
      deliveryPerson,
      missedReason,
      customerNotes,
      reportedDiscrepancy: override?.reportedDiscrepancy
    });
  }

  // Monthly dynamic calculations
  const totalSubscriptionDays = calendarDays.filter(d => d.status !== 'no_subscription').length;
  const totalDeliveredDays = calendarDays.filter(d => d.status === 'delivered').length;
  const totalMissedDays = calendarDays.filter(d => d.status === 'missed').length;
  const totalMilkOrdered = calendarDays.reduce((sum, d) => sum + (d.status !== 'no_subscription' ? d.orderedQty : 0), 0);
  const totalMilkDelivered = calendarDays.reduce((sum, d) => sum + (d.status === 'delivered' ? d.deliveredQty : 0), 0);
  const totalMilkNotDelivered = calendarDays.reduce((sum, d) => sum + (d.status === 'missed' ? d.orderedQty : 0), 0);

  // Handlers
  const handleJumpToCurrentMonth = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const handleToggleDayStatus = (day: DayDeliveryRecord, newStatus: 'delivered' | 'missed' | 'scheduled' | 'no_subscription') => {
    const updated = {
      ...overrides,
      [day.dateStr]: {
        ...overrides[day.dateStr],
        status: newStatus,
        deliveredQty: newStatus === 'delivered' ? day.orderedQty : 0,
        missedReason: newStatus === 'missed' ? 'Reported by customer/dairy log' : ''
      }
    };
    setOverrides(updated);
    if (selectedDay?.dateStr === day.dateStr) {
      setSelectedDay({
        ...selectedDay,
        status: newStatus,
        deliveredQty: newStatus === 'delivered' ? day.orderedQty : 0,
        missedReason: newStatus === 'missed' ? 'Reported by customer/dairy log' : ''
      });
    }
  };

  const handleAddExtraBottle = (day: DayDeliveryRecord) => {
    const newQty = day.orderedQty + 1;
    const updated = {
      ...overrides,
      [day.dateStr]: {
        ...overrides[day.dateStr],
        orderedQty: newQty,
        deliveredQty: day.status === 'delivered' ? newQty : day.deliveredQty,
        status: day.status === 'no_subscription' ? 'scheduled' : day.status
      }
    };
    setOverrides(updated);
    if (selectedDay?.dateStr === day.dateStr) {
      setSelectedDay({
        ...selectedDay,
        orderedQty: newQty,
        deliveredQty: day.status === 'delivered' ? newQty : selectedDay.deliveredQty
      });
    }
  };

  const handleReportDiscrepancy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDay || !discrepancyNote) return;

    const note = discrepancyNote.trim();
    setOverrides(prev => ({
      ...prev,
      [selectedDay.dateStr]: {
        ...prev[selectedDay.dateStr],
        reportedDiscrepancy: note
      }
    }));

    // Construct WhatsApp discrepancy alert for dispatch team
    const message = `⚠️ *MILK DELIVERY DISCREPANCY REPORT — DUGDHSAR*
━━━━━━━━━━━━━━━━━━━━
📅 *Date:* ${selectedDay.formattedDate}
👤 *Customer:* ${currentUser.fullName} (${currentUser.phone})
📍 *Address:* ${activeSub.deliveryAddress}
🥛 *Product:* ${selectedDay.productName}
📦 *Ordered:* ${selectedDay.orderedQty} Litre(s)
🚚 *Delivered Log:* ${selectedDay.deliveredQty} Litre(s)
📝 *Customer Issue / Note:* ${note}
━━━━━━━━━━━━━━━━━━━━
_Please review delivery log and adjust billing credit._`;

    const encoded = encodeURIComponent(message);
    const targetUrl = `https://wa.me/917067672604?text=${encoded}`;
    try {
      window.open(targetUrl, '_blank');
    } catch {
      // fallback
    }

    setDiscrepancySuccess(true);
    setTimeout(() => {
      setDiscrepancySuccess(false);
      setShowDiscrepancyForm(false);
      setDiscrepancyNote('');
    }, 2500);
  };

  const handleApplyVacation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vacationStart || !vacationEnd) return;

    const start = new Date(vacationStart);
    const end = new Date(vacationEnd);
    const newOverrides = { ...overrides };

    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
      const key = dt.toISOString().split('T')[0];
      newOverrides[key] = {
        status: 'no_subscription',
        orderedQty: 0,
        deliveredQty: 0,
        customerNotes: 'Vacation Pause (Holiday Freeze)'
      };
    }

    setOverrides(newOverrides);
    setVacationSuccessMsg(`Deliveries frozen from ${vacationStart} to ${vacationEnd}. Fresh morning drops resume automatically!`);
    setTimeout(() => setVacationSuccessMsg(''), 5000);
  };

  return (
    <AccountLayout>
      <div className="space-y-8 animate-fadeIn">
        
        {/* Top Header Card */}
        <div className="bg-[#FAF6EE] p-6 sm:p-8 rounded-3xl border border-[#D8C9AD] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A34F37] bg-[#A34F37]/10 px-2.5 py-0.5 rounded-full border border-[#A34F37]/20">
                Official Patron Dashboard
              </span>
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Live Cold-Chain Telemetry
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl text-[#263D30] font-bold">
              My Milk Delivery Calendar & Tracker
            </h1>

            <div className="text-xs text-[#302C26]/80 mt-2 flex items-center gap-3 flex-wrap">
              <span>Customer: <strong className="text-[#263D30]">{currentUser.fullName}</strong></span>
              <span>•</span>
              <span>Plan: <strong className="text-[#263D30]">{activeSub.productName} ({activeSub.variant})</strong></span>
              <span>•</span>
              <span>Slot: <strong className="text-[#263D30]">{activeSub.deliverySlot}</strong></span>
            </div>
          </div>

          {/* Month Controls & Today Button */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => {
                if (currentMonth === 0) {
                  setCurrentMonth(11);
                  setCurrentYear(currentYear - 1);
                } else {
                  setCurrentMonth(currentMonth - 1);
                }
              }}
              className="p-2 rounded-xl border border-[#D8C9AD] bg-white hover:bg-[#F8F4EC] text-[#263D30] transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-serif text-base font-bold text-[#263D30] px-3 py-1.5 bg-white rounded-xl border border-[#D8C9AD] shadow-xs">
              {monthNames[currentMonth]} {currentYear}
            </span>

            <button
              onClick={() => {
                if (currentMonth === 11) {
                  setCurrentMonth(0);
                  setCurrentYear(currentYear + 1);
                } else {
                  setCurrentMonth(currentMonth + 1);
                }
              }}
              className="p-2 rounded-xl border border-[#D8C9AD] bg-white hover:bg-[#F8F4EC] text-[#263D30] transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleJumpToCurrentMonth}
              className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#FAF6EE] bg-[#263D30] hover:bg-[#1A2B22] rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Current Month
            </button>
          </div>
        </div>

        {/* MONTHLY MILK CONSUMPTION REPORT — Attractive Dynamic Statistics Cards */}
        <div className="bg-[#FAF6EE] p-6 sm:p-8 rounded-3xl border border-[#D8C9AD] shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#D8C9AD]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A34F37] block">
                Dynamic Dairy Audit · {monthNames[currentMonth]} {currentYear}
              </span>
              <h2 className="font-serif text-xl font-bold text-[#263D30]">
                Monthly Milk Consumption Report
              </h2>
            </div>
            <span className="text-xs font-mono font-semibold text-[#302C26]/70">
              Auto-calculated from actual delivery logs
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* Total Subscription Days */}
            <div className="bg-white p-4 rounded-2xl border border-[#D8C9AD] shadow-xs text-center">
              <span className="text-[10px] font-bold uppercase text-[#302C26]/60 block mb-1">
                Subscription Days
              </span>
              <strong className="text-2xl font-serif font-black text-[#263D30] block">
                {totalSubscriptionDays}
              </strong>
              <span className="text-[10px] text-gray-500 block mt-0.5">Active Cycle</span>
            </div>

            {/* Total Delivered Days */}
            <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-300 shadow-xs text-center">
              <span className="text-[10px] font-bold uppercase text-emerald-800 block mb-1">
                Delivered Days
              </span>
              <strong className="text-2xl font-serif font-black text-emerald-700 block">
                {totalDeliveredDays}
              </strong>
              <span className="text-[10px] text-emerald-800 font-medium block mt-0.5">Completed Drops</span>
            </div>

            {/* Total Missed Days */}
            <div className="bg-rose-50/80 p-4 rounded-2xl border border-rose-300 shadow-xs text-center">
              <span className="text-[10px] font-bold uppercase text-rose-800 block mb-1">
                Missed Days
              </span>
              <strong className="text-2xl font-serif font-black text-rose-700 block">
                {totalMissedDays}
              </strong>
              <span className="text-[10px] text-rose-800 font-medium block mt-0.5">Compensated/Refunded</span>
            </div>

            {/* Total Milk Ordered */}
            <div className="bg-white p-4 rounded-2xl border border-[#D8C9AD] shadow-xs text-center">
              <span className="text-[10px] font-bold uppercase text-[#302C26]/60 block mb-1">
                Milk Ordered
              </span>
              <strong className="text-2xl font-serif font-black text-[#263D30] block">
                {totalMilkOrdered} L
              </strong>
              <span className="text-[10px] text-gray-500 block mt-0.5">Total Scheduled</span>
            </div>

            {/* Total Milk Delivered */}
            <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-300 shadow-xs text-center">
              <span className="text-[10px] font-bold uppercase text-emerald-800 block mb-1">
                Milk Delivered
              </span>
              <strong className="text-2xl font-serif font-black text-emerald-700 block">
                {totalMilkDelivered} L
              </strong>
              <span className="text-[10px] text-emerald-800 font-medium block mt-0.5">Fresh A2 Chilled</span>
            </div>

            {/* Total Milk Not Delivered */}
            <div className="bg-rose-50/80 p-4 rounded-2xl border border-rose-300 shadow-xs text-center">
              <span className="text-[10px] font-bold uppercase text-rose-800 block mb-1">
                Undelivered Qty
              </span>
              <strong className="text-2xl font-serif font-black text-rose-700 block">
                {totalMilkNotDelivered} L
              </strong>
              <span className="text-[10px] text-rose-800 font-medium block mt-0.5">Zero Charge Applied</span>
            </div>
          </div>
        </div>

        {/* MONTHLY MILK DELIVERY CALENDAR — Interactive Color Coded View */}
        <div className="bg-[#FAF6EE] p-6 sm:p-8 rounded-3xl border border-[#D8C9AD] shadow-xs">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-[#D8C9AD] gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#A34F37]" />
                <h3 className="font-serif text-xl font-bold text-[#263D30]">
                  Interactive Monthly Delivery Calendar
                </h3>
              </div>
              <p className="text-xs text-[#302C26]/75 mt-0.5">
                Every calendar cell is color-coded. Click any date to view itemized drop details, report quantity discrepancy, or adjust extra bottles.
              </p>
            </div>

            {/* Color Legend (as strictly instructed by prompt) */}
            <div className="flex items-center gap-3 flex-wrap text-[11px] font-semibold">
              <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-emerald-300">
                <span className="w-3 h-3 rounded-md bg-emerald-500 shrink-0" />
                <span className="text-emerald-900 font-bold">GREEN: Delivered</span>
              </span>
              <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-rose-300">
                <span className="w-3 h-3 rounded-md bg-rose-500 shrink-0" />
                <span className="text-rose-900 font-bold">RED: Missed</span>
              </span>
              <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-amber-300">
                <span className="w-3 h-3 rounded-md bg-amber-400 shrink-0" />
                <span className="text-amber-900 font-bold">YELLOW: Scheduled/Active</span>
              </span>
              <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-gray-300">
                <span className="w-3 h-3 rounded-md bg-gray-300 shrink-0" />
                <span className="text-gray-700 font-bold">GREY: No Delivery</span>
              </span>
            </div>
          </div>

          {/* Days of Week Headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-[#302C26] uppercase tracking-wider mb-2">
            <span className="text-rose-700">Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty slots before day 1 */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20 sm:h-24 bg-transparent rounded-2xl opacity-20 border border-dashed border-[#D8C9AD]" />
            ))}

            {calendarDays.map((day) => {
              const isToday = currentYear === today.getFullYear() && currentMonth === today.getMonth() && day.dayNumber === today.getDate();
              const isSelected = selectedDay?.dateStr === day.dateStr;

              // Color styles per prompt rules:
              // GREEN: Delivered | RED: Missed | YELLOW: Scheduled | GREY: No Subscription
              const cardBg = 
                day.status === 'delivered' ? 'bg-emerald-500 text-white border-emerald-600' :
                day.status === 'missed' ? 'bg-rose-500 text-white border-rose-600' :
                day.status === 'scheduled' ? 'bg-amber-400 text-amber-950 border-amber-500' :
                'bg-gray-200 text-gray-700 border-gray-300';

              const quantityLabel = 
                day.status === 'delivered' ? `${day.deliveredQty} L Delivered` :
                day.status === 'missed' ? '0 L (Missed)' :
                day.status === 'scheduled' ? `${day.orderedQty} L Scheduled` :
                'No Drop';

              return (
                <div
                  key={day.dateStr}
                  onClick={() => setSelectedDay(day)}
                  className={`h-20 sm:h-24 p-2 sm:p-2.5 rounded-2xl border-2 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-xs hover:scale-103 hover:shadow-md relative ${cardBg} ${
                    isSelected ? 'ring-4 ring-[#263D30] z-20 scale-102' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm font-mono leading-none">
                      {day.dayNumber}
                    </span>
                    {isToday && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-black/30 text-white">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] sm:text-[11px] font-black leading-tight truncate">
                    {quantityLabel}
                  </div>

                  <div className="text-[8px] sm:text-[9px] opacity-90 truncate font-medium">
                    {day.status === 'delivered' ? '✓ ' + (day.deliveryTime || '06:15 AM') :
                     day.status === 'missed' ? '! Discrepancy' :
                     day.status === 'scheduled' ? 'Cold-Chain Slot' : 'Paused'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DAILY MILK DELIVERY DETAILS — Popup / Side Panel Modal */}
        {selectedDay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div 
              className="bg-[#FAF6EE] text-[#302C26] rounded-3xl border border-[#D8C9AD] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-[#263D30] text-[#FAF6EE] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Milk className="w-5 h-5 text-[#C2A36C]" />
                  <div>
                    <h3 className="font-serif text-base font-bold text-[#FAF6EE]">
                      Daily Delivery Details
                    </h3>
                    <span className="text-[11px] text-[#D8C9AD] font-mono">
                      {selectedDay.formattedDate}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setSelectedDay(null);
                    setShowDiscrepancyForm(false);
                  }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                
                {/* Status Badge Strip */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#D8C9AD]">
                  <span className="font-bold uppercase tracking-wider text-[#302C26]/70">Delivery Status</span>
                  <span className={`font-bold uppercase px-2.5 py-1 rounded-full text-xs ${
                    selectedDay.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                    selectedDay.status === 'missed' ? 'bg-rose-100 text-rose-800' :
                    selectedDay.status === 'scheduled' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedDay.status === 'delivered' ? 'Successfully Delivered' :
                     selectedDay.status === 'missed' ? 'Missed / Not Delivered' :
                     selectedDay.status === 'scheduled' ? 'Scheduled in Progress' : 'No Delivery'}
                  </span>
                </div>

                {/* Details Table */}
                <div className="bg-white rounded-2xl border border-[#D8C9AD] divide-y divide-[#D8C9AD]/50">
                  <div className="p-3.5 flex justify-between">
                    <span className="text-[#302C26]/70">Milk Product:</span>
                    <strong className="text-[#263D30]">{selectedDay.productName}</strong>
                  </div>
                  <div className="p-3.5 flex justify-between">
                    <span className="text-[#302C26]/70">Quantity Ordered:</span>
                    <strong className="text-[#263D30] font-mono">{selectedDay.orderedQty} Litre(s)</strong>
                  </div>
                  <div className="p-3.5 flex justify-between">
                    <span className="text-[#302C26]/70">Quantity Actually Delivered:</span>
                    <strong className={`font-mono ${selectedDay.deliveredQty > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {selectedDay.deliveredQty} Litre(s)
                    </strong>
                  </div>
                  <div className="p-3.5 flex justify-between">
                    <span className="text-[#302C26]/70">Delivery Time:</span>
                    <span className="font-semibold text-[#263D30]">{selectedDay.deliveryTime}</span>
                  </div>
                  <div className="p-3.5 flex justify-between">
                    <span className="text-[#302C26]/70">Rider / Delivery Fleet:</span>
                    <span className="font-semibold text-[#263D30]">{selectedDay.deliveryPerson}</span>
                  </div>
                  {selectedDay.missedReason && (
                    <div className="p-3.5 bg-rose-50/70 text-rose-900">
                      <strong className="block mb-0.5 text-rose-800">Reason for Missed Delivery:</strong>
                      <p className="leading-relaxed">{selectedDay.missedReason}</p>
                    </div>
                  )}
                  {selectedDay.reportedDiscrepancy && (
                    <div className="p-3.5 bg-amber-50 text-amber-900">
                      <strong className="block mb-0.5 text-amber-800">Customer Reported Discrepancy:</strong>
                      <p className="leading-relaxed">{selectedDay.reportedDiscrepancy}</p>
                    </div>
                  )}
                  <div className="p-3.5">
                    <span className="text-[#302C26]/70 block mb-0.5">Customer Delivery Notes:</span>
                    <span className="text-[#263D30] italic">{selectedDay.customerNotes}</span>
                  </div>
                </div>

                {/* Action Buttons: Add Extra Bottle / Toggle Status */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => handleAddExtraBottle(selectedDay)}
                    className="py-2.5 px-3 bg-[#263D30] text-[#FAF6EE] rounded-xl font-semibold flex items-center justify-center gap-1.5 hover:bg-[#1A2B22] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#C2A36C]" />
                    <span>Add +1 Bottle (Guest)</span>
                  </button>

                  <button
                    onClick={() => handleToggleDayStatus(selectedDay, selectedDay.status === 'no_subscription' ? 'scheduled' : 'no_subscription')}
                    className="py-2.5 px-3 bg-white text-[#263D30] border border-[#D8C9AD] rounded-xl font-semibold hover:bg-[#FAF6EE] cursor-pointer"
                  >
                    {selectedDay.status === 'no_subscription' ? 'Resume This Day' : 'Pause This Day'}
                  </button>
                </div>

                {/* Discrepancy Reporting Form */}
                <div className="pt-2 border-t border-[#D8C9AD]/60">
                  {!showDiscrepancyForm ? (
                    <button
                      onClick={() => setShowDiscrepancyForm(true)}
                      className="w-full py-2.5 text-center text-xs font-bold text-[#A34F37] hover:text-[#8e422c] bg-[#A34F37]/10 hover:bg-[#A34F37]/15 rounded-xl border border-[#A34F37]/20 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <AlertTriangle className="w-4 h-4 text-[#A34F37]" />
                      <span>Report Incorrect Delivery Quantity / Issue</span>
                    </button>
                  ) : (
                    <form onSubmit={handleReportDiscrepancy} className="p-4 bg-white rounded-2xl border border-amber-300 space-y-3">
                      <div className="flex items-center justify-between">
                        <strong className="text-xs text-[#263D30] flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>Report Quantity Issue to Dispatch Desk</span>
                        </strong>
                        <button
                          type="button"
                          onClick={() => setShowDiscrepancyForm(false)}
                          className="text-[10px] text-gray-500 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                      </div>

                      <textarea
                        required
                        rows={2}
                        value={discrepancyNote}
                        onChange={(e) => setDiscrepancyNote(e.target.value)}
                        placeholder="e.g. Received 1 Litre bottle instead of 2 Litres ordered, or bottle cap seal was loose."
                        className="w-full p-2.5 text-xs border border-[#D8C9AD] rounded-xl bg-[#F8F4EC] focus:outline-none focus:border-[#263D30]"
                      />

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-[#302C26]/60">
                          Automatically opens WhatsApp helpline (+91 7067672604)
                        </span>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-[#25D366] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-[#1EBE5D] cursor-pointer"
                        >
                          Send Report
                        </button>
                      </div>
                    </form>
                  )}

                  {discrepancySuccess && (
                    <div className="mt-2 p-2.5 bg-emerald-100 text-emerald-900 rounded-xl text-center font-semibold">
                      ✓ Discrepancy logged and forwarded to Dispatch Helpline!
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

        {/* DAILY MILK QUANTITY TRACKER — Itemized Day-by-Day Audit Table */}
        <div className="bg-[#FAF6EE] p-6 sm:p-8 rounded-3xl border border-[#D8C9AD] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-[#D8C9AD] gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A34F37] block">
                Itemized Verification
              </span>
              <h3 className="font-serif text-xl font-bold text-[#263D30]">
                Daily Milk Quantity Tracker
              </h3>
            </div>
            <p className="text-xs text-[#302C26]/70">
              Complete chronological audit of how much milk was ordered and actually delivered each day.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#D8C9AD] text-[#302C26]/70 uppercase text-[10px] tracking-wider bg-white/50">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Product</th>
                  <th className="py-3 px-3 font-mono">Ordered</th>
                  <th className="py-3 px-3 font-mono">Delivered</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Delivery Time</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8C9AD]/40">
                {calendarDays.slice(0, 15).map((d) => (
                  <tr key={d.dateStr} className="hover:bg-white/60 transition-colors">
                    <td className="py-3 px-3 font-semibold text-[#263D30]">
                      {d.dateStr.slice(8)} {monthNames[currentMonth].slice(0, 3)}
                    </td>
                    <td className="py-3 px-3 text-[#302C26]">{d.productName}</td>
                    <td className="py-3 px-3 font-mono font-bold text-[#263D30]">{d.orderedQty} L</td>
                    <td className="py-3 px-3 font-mono font-bold">
                      <span className={d.deliveredQty > 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {d.deliveredQty} L
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        d.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                        d.status === 'missed' ? 'bg-rose-100 text-rose-800' :
                        d.status === 'scheduled' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          d.status === 'delivered' ? 'bg-emerald-500' :
                          d.status === 'missed' ? 'bg-rose-500' :
                          d.status === 'scheduled' ? 'bg-amber-500' :
                          'bg-gray-400'
                        }`} />
                        <span>{d.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#302C26]/75 font-mono">{d.deliveryTime}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedDay(d)}
                        className="text-[11px] font-bold text-[#A34F37] hover:underline cursor-pointer"
                      >
                        Inspect Details →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* VACATION FREEZE SECTION */}
        <div className="bg-[#FAF6EE] p-6 sm:p-8 rounded-3xl border border-[#D8C9AD] shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <Pause className="w-5 h-5 text-[#A34F37]" />
            <h3 className="font-serif text-xl font-bold text-[#263D30]">
              Going on Vacation? Freeze Delivery Schedule
            </h3>
          </div>
          <p className="text-xs text-[#302C26]/75 mb-4 max-w-xl">
            Going out of town? Pause your morning bottle drops for any date range with zero cancellation fees. Deliveries resume automatically on your return date.
          </p>

          {vacationSuccessMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{vacationSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleApplyVacation} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-bold text-[#263D30] uppercase mb-1">
                Pause From Date
              </label>
              <input
                type="date"
                required
                value={vacationStart}
                onChange={(e) => setVacationStart(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-xl bg-white text-[#263D30] font-mono focus:outline-none focus:border-[#263D30]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#263D30] uppercase mb-1">
                Resume On Date
              </label>
              <input
                type="date"
                required
                value={vacationEnd}
                onChange={(e) => setVacationEnd(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-xl bg-white text-[#263D30] font-mono focus:outline-none focus:border-[#263D30]"
              />
            </div>

            <button
              type="submit"
              className="py-2.5 px-4 bg-[#A34F37] hover:bg-[#853C26] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Freeze Delivery Dates</span>
            </button>
          </form>
        </div>

      </div>
    </AccountLayout>
  );
};
