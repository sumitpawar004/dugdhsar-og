import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  ShieldCheck, 
  Sparkles, 
  MessageCircle, 
  ChevronRight,
  ArrowRight,
  Info
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useRouter } from '../router/RouterContext';

export const MorningSubscriptionModal: React.FC = () => {
  const { 
    isSubscriptionModalOpen, 
    setIsSubscriptionModalOpen, 
    addSubscription, 
    addAddress,
    currentUser 
  } = useStore();
  const { navigate } = useRouter();

  // Milk Type & Plan Selection State
  const [milkType, setMilkType] = useState<'cow' | 'buffalo'>('cow');

  // Cow milk package presets
  const cowPackages = [
    { id: 'wm-1l', label: '1 Litre Glass Bottle', price: 170, volume: '1 Litre', popular: true },
    { id: 'wm-combo-2l', label: '2 Litres Family Pack', price: 330, volume: '2 Litres', popular: false },
    { id: 'wm-500ml', label: '500 ml Glass Bottle', price: 95, volume: '500 ml', popular: false },
  ];

  // Buffalo milk package presets
  const buffaloPackages = [
    { id: 'bm-1l', label: '1 Litre Glass Bottle', price: 190, volume: '1 Litre', popular: true },
    { id: 'bm-combo-2l', label: '2 Litres Family Pack', price: 370, volume: '2 Litres', popular: false },
    { id: 'bm-500ml', label: '500 ml Glass Bottle', price: 105, volume: '500 ml', popular: false },
  ];

  const [selectedVariant, setSelectedVariant] = useState<{
    id: string;
    label: string;
    price: number;
    volume: string;
  }>({
    id: 'wm-1l',
    label: '1 Litre Glass Bottle',
    price: 170,
    volume: '1 Litre'
  });

  const handleMilkTypeChange = (type: 'cow' | 'buffalo') => {
    setMilkType(type);
    if (type === 'cow') {
      setSelectedVariant(cowPackages[0]);
    } else {
      setSelectedVariant(buffaloPackages[0]);
    }
  };

  const [quantity, setQuantity] = useState(1);
  const [frequency, setFrequency] = useState<'daily' | 'alternate' | 'weekdays'>('daily');
  const [deliverySlot, setDeliverySlot] = useState<'5:00 AM - 10:00 AM' | '6:00 PM - 10:00 PM'>('5:00 AM - 10:00 AM');
  
  // Tomorrow's date formatted as YYYY-MM-DD
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultStartDate = tomorrow.toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(defaultStartDate);

  // Customer Contact & Delivery Details
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [flatNo, setFlatNo] = useState('');
  const [colony, setColony] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Seoni');
  const [pincode, setPincode] = useState('480661');
  const [deliveryNotes, setDeliveryNotes] = useState('Leave in doorstep milk bag / Ring bell at dawn');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');

  if (!isSubscriptionModalOpen) return null;

  const handleClose = () => {
    setIsSubscriptionModalOpen(false);
    setIsSuccess(false);
  };

  const handleSubscribeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const fullAddress = `${flatNo ? flatNo + ', ' : ''}${colony ? colony + ', ' : ''}${landmark ? 'Near ' + landmark + ', ' : ''}${city} — ${pincode}`;
    const frequencyLabel = 
      frequency === 'daily' ? 'Daily (Every Morning)' :
      frequency === 'alternate' ? 'Alternate Days' : 'Weekdays (Mon – Fri)';

    const productName = milkType === 'buffalo'
      ? 'DUGDHSAR Pure Desi Murrah Buffalo Whole Milk'
      : 'DUGDHSAR Fresh A2 Desi Cow Whole Milk';

    // 1. Add subscription in store & persist
    const newSub = addSubscription({
      productName,
      variant: selectedVariant.label,
      milkType,
      pricePerUnit: selectedVariant.price,
      pricePaise: selectedVariant.price * 100,
      quantity,
      frequency,
      deliverySlot,
      customerName: fullName,
      customerPhone: phone,
      deliveryAddress: fullAddress,
      notes: deliveryNotes,
      startDate,
      status: 'active',
      nextDelivery: `Tomorrow, ${deliverySlot}`
    });

    // 2. Save address for user
    try {
      addAddress({
        fullName,
        phone,
        flatNo: flatNo || 'Doorstep',
        apartment: colony || 'Seoni Residence',
        street: landmark || 'Barghat Road Area',
        city,
        state: 'Madhya Pradesh',
        pincode,
        isDefault: true,
        deliverySlot,
        instructions: deliveryNotes
      });
    } catch {
      // safe fallback
    }

    // 3. Construct clean, rich WhatsApp text
    const message = 
`🥛 *NEW DUGDHSAR MORNING BOTTLE SUBSCRIPTION*
━━━━━━━━━━━━━━━━━━━━
👤 *Customer Name:* ${fullName}
📱 *Phone / WhatsApp:* ${phone}
📍 *Delivery Address:* ${fullAddress}
📝 *Drop Notes:* ${deliveryNotes}

📦 *Subscription Plan:*
• *Milk Type:* ${milkType === 'buffalo' ? '🐃 Pure Desi Murrah Buffalo Milk (7.5% Fat)' : '🐄 Fresh A2 Gir Cow Milk (Vedic A2)'}
• *Product:* ${productName}
• *Size / Quantity:* ${quantity} x ${selectedVariant.label}
• *Rate:* ₹${selectedVariant.price} / bottle
• *Schedule:* ${frequencyLabel}
• *Delivery Slot:* ${deliverySlot}
• *Starting Date:* ${startDate}
• *Daily Approx:* ₹${selectedVariant.price * quantity} / day (Flexible billing)

🛵 *Dispatch Route:* Direct from DUGDHSAR Sanctuary to Doorstep in Seoni, MP.
━━━━━━━━━━━━━━━━━━━━
_Namaste Dugdhsar Team, please confirm my morning milk bottle subscription and assign our delivery agent._`;

    const encoded = encodeURIComponent(message);
    const targetUrl = `https://wa.me/917067672604?text=${encoded}`;
    setWhatsappUrl(targetUrl);

    // Open WhatsApp in new tab / app
    try {
      window.open(targetUrl, '_blank');
    } catch {
      // fallback
    }

    setIsSubmitting(false);
    setIsSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-[#FAF6EE] text-[#302C26] w-full max-w-2xl max-h-[92vh] rounded-3xl shadow-2xl border border-[#D8C9AD] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#263D30] text-[#FAF6EE] px-6 py-4 flex items-center justify-between border-b border-[#C2A36C]/40 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#C2A36C]/20 border border-[#C2A36C] flex items-center justify-center text-[#C2A36C]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C2A36C]">
                  Direct Cold-Chain Subscription
                </span>
                <span className="text-[9px] bg-[#C2A36C] text-[#263D30] font-bold px-2 py-0.5 rounded-full">
                  Seoni, MP
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-[#FAF6EE] leading-tight">
                Order Morning Bottle
              </h2>
            </div>
          </div>

          <button 
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#FAF6EE] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {isSuccess ? (
            /* Success View */
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full mx-auto flex items-center justify-center shadow-inner">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <h3 className="text-2xl font-serif font-bold text-[#263D30] mb-1">
                  Subscription Activated!
                </h3>
                <p className="text-xs sm:text-sm text-[#302C26]/80 max-w-md mx-auto">
                  Your daily morning milk bottle subscription is saved in your account and your request has been forwarded to 
                  <strong className="text-[#263D30]"> Dugdhsar's Official WhatsApp (+91 7067672604)</strong>.
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-[#F8F4EC] p-4 rounded-2xl border border-[#D8C9AD] text-left max-w-md mx-auto text-xs space-y-2">
                <div className="flex justify-between border-b border-[#D8C9AD] pb-2 font-semibold text-[#263D30]">
                  <span>Item:</span>
                  <span>{quantity}x {selectedVariant.label}</span>
                </div>
                <div className="flex justify-between border-b border-[#D8C9AD] pb-2">
                  <span className="text-[#302C26]/70">Schedule:</span>
                  <span className="font-medium text-[#263D30]">
                    {frequency === 'daily' ? 'Daily Morning Delivery' : frequency === 'alternate' ? 'Alternate Days' : 'Weekdays (Mon-Fri)'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#D8C9AD] pb-2">
                  <span className="text-[#302C26]/70">Delivery Window:</span>
                  <span className="font-medium text-[#263D30]">{deliverySlot}</span>
                </div>
                <div className="flex justify-between border-b border-[#D8C9AD] pb-2">
                  <span className="text-[#302C26]/70">Starts On:</span>
                  <span className="font-medium text-[#263D30]">{startDate}</span>
                </div>
                <div className="flex justify-between pt-1 font-bold text-[#A34F37]">
                  <span>Daily Amount:</span>
                  <span>₹{selectedVariant.price * quantity} / day</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-full font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition-transform active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Open WhatsApp Conversation</span>
                </a>

                <button
                  onClick={() => {
                    handleClose();
                    navigate('/account');
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#263D30] hover:bg-[#1A2B22] text-[#FAF6EE] rounded-full font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <span>View in My Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Form View */
            <form onSubmit={handleSubscribeSubmit} className="space-y-6">
              
              {/* Informational Banner */}
              <div className="p-3 bg-[#C2A36C]/15 border border-[#C2A36C]/40 rounded-2xl flex items-start gap-2.5 text-xs text-[#263D30]">
                <Info className="w-4 h-4 text-[#A34F37] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Zero hassle morning delivery:</strong> Freshly harvested unpasteurized / gentle vat-pasteurized A2 Gir cow milk sealed in sterile glass bottles delivered straight to your doorstep before 10:00 AM across Seoni. Pause anytime with 1 tap.
                </div>
              </div>

              {/* Section 0: Select Milk Type (Cow vs Buffalo) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#263D30] mb-2.5">
                  1. Choose Milk Type / दूध का प्रकार चुनें
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => handleMilkTypeChange('cow')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all relative ${
                      milkType === 'cow'
                        ? 'border-[#263D30] bg-[#263D30]/10 ring-2 ring-[#263D30]/30 shadow-xs'
                        : 'border-[#D8C9AD] hover:border-[#263D30]/40 bg-[#FAF6EE]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-[#263D30] flex items-center gap-1.5">
                        <span>🐄</span>
                        <span>A2 Desi Gir Cow Milk</span>
                      </span>
                      <span className="font-bold text-xs text-[#A34F37] bg-[#A34F37]/10 px-2 py-0.5 rounded-md">
                        ₹170 / L
                      </span>
                    </div>
                    <p className="text-[11px] text-[#302C26]/70 leading-snug">
                      100% Vedic Gir Cow A2 Beta-Casein · 4.8% Natural Fat · Gentle Vat Pasteurized or Raw.
                    </p>
                  </div>

                  <div
                    onClick={() => handleMilkTypeChange('buffalo')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all relative ${
                      milkType === 'buffalo'
                        ? 'border-[#263D30] bg-[#263D30]/10 ring-2 ring-[#263D30]/30 shadow-xs'
                        : 'border-[#D8C9AD] hover:border-[#263D30]/40 bg-[#FAF6EE]'
                    }`}
                  >
                    <span className="absolute -top-2.5 right-3 bg-[#A34F37] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      7.5% Fat Rich
                    </span>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-[#263D30] flex items-center gap-1.5">
                        <span>🐃</span>
                        <span>Pure Desi Murrah Buffalo Milk</span>
                      </span>
                      <span className="font-bold text-xs text-[#A34F37] bg-[#A34F37]/10 px-2 py-0.5 rounded-md">
                        ₹190 / L
                      </span>
                    </div>
                    <p className="text-[11px] text-[#302C26]/70 leading-snug">
                      Pure Murrah breed · 7.5% High Cream Fat · Extra thick clotted malai & dense body.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 1: Choose Size & Plan */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#263D30] mb-2.5">
                  2. Select Bottle Size ({milkType === 'buffalo' ? 'Buffalo Milk' : 'A2 Cow Milk'})
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(milkType === 'buffalo' ? buffaloPackages : cowPackages).map((pkg) => {
                    const isSelected = selectedVariant.id === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedVariant(pkg)}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all relative ${
                          isSelected 
                            ? 'border-[#263D30] bg-[#263D30]/5 shadow-xs' 
                            : 'border-[#D8C9AD] hover:border-[#263D30]/40 bg-[#FAF6EE]'
                        }`}
                      >
                        {pkg.popular && (
                          <span className="absolute -top-2.5 right-3 bg-[#A34F37] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Most Popular
                          </span>
                        )}
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-[#263D30]">{pkg.volume}</span>
                          <span className="font-bold text-sm text-[#A34F37]">₹{pkg.price}</span>
                        </div>
                        <p className="text-[11px] text-[#302C26]/70 leading-tight">
                          {pkg.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Frequency & Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Frequency */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#263D30] mb-2">
                    2. Delivery Frequency
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { id: 'daily', label: 'Daily' },
                      { id: 'alternate', label: 'Alternate' },
                      { id: 'weekdays', label: 'Mon – Fri' },
                    ].map((f) => {
                      const isSel = frequency === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFrequency(f.id as any)}
                          className={`py-2 px-1 text-center rounded-xl border text-xs font-semibold transition-all ${
                            isSel 
                              ? 'bg-[#263D30] text-[#FAF6EE] border-[#263D30]' 
                              : 'bg-[#FAF6EE] text-[#302C26] border-[#D8C9AD] hover:bg-[#F8F4EC]'
                          }`}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Delivery Slot */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#263D30] mb-2">
                    3. Delivery Slot
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: '5:00 AM - 10:00 AM', label: 'Morning (5–10 AM)' },
                      { id: '6:00 PM - 10:00 PM', label: 'Evening (6–10 PM)' },
                    ].map((s) => {
                      const isSel = deliverySlot === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setDeliverySlot(s.id as any)}
                          className={`py-2 px-1 text-center rounded-xl border text-[11px] font-semibold transition-all ${
                            isSel 
                              ? 'bg-[#263D30] text-[#FAF6EE] border-[#263D30]' 
                              : 'bg-[#FAF6EE] text-[#302C26] border-[#D8C9AD] hover:bg-[#F8F4EC]'
                          }`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Start Date & Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#263D30] mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#A34F37]" />
                    <span>Subscription Start Date</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    min={defaultStartDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-xl bg-[#F8F4EC] text-[#263D30] font-mono focus:outline-none focus:border-[#263D30]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#263D30] mb-1.5">
                    Bottles Per Day
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-[#D8C9AD] rounded-xl bg-[#F8F4EC] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-1.5 font-bold hover:bg-[#D8C9AD]/40 text-[#263D30]"
                      >
                        -
                      </button>
                      <span className="px-4 py-1.5 font-bold text-xs text-[#263D30]">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-3 py-1.5 font-bold hover:bg-[#D8C9AD]/40 text-[#263D30]"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-[#302C26]/70">
                      Total: ₹{selectedVariant.price * quantity} / day
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Customer Contact & Delivery Address in Seoni */}
              <div className="pt-2 border-t border-[#D8C9AD] space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#263D30] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#A34F37]" />
                  <span>Your Delivery & Contact Details</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#302C26] mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#302C26]/40" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full pl-8 pr-3 py-2 text-xs border border-[#D8C9AD] rounded-xl bg-[#F8F4EC] text-[#263D30] focus:outline-none focus:border-[#263D30]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#302C26] mb-1">
                      WhatsApp / Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#302C26]/40" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 7067672604"
                        className="w-full pl-8 pr-3 py-2 text-xs border border-[#D8C9AD] rounded-xl bg-[#F8F4EC] text-[#263D30] font-mono focus:outline-none focus:border-[#263D30]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#302C26] mb-1">
                      House / Flat / Building No *
                    </label>
                    <input
                      type="text"
                      required
                      value={flatNo}
                      onChange={(e) => setFlatNo(e.target.value)}
                      placeholder="e.g. House 42, Ground Floor"
                      className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-xl bg-[#F8F4EC] text-[#263D30] focus:outline-none focus:border-[#263D30]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#302C26] mb-1">
                      Street / Colony / Area *
                    </label>
                    <input
                      type="text"
                      required
                      value={colony}
                      onChange={(e) => setColony(e.target.value)}
                      placeholder="e.g. Barghat Road, Sufi Nagar"
                      className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-xl bg-[#F8F4EC] text-[#263D30] focus:outline-none focus:border-[#263D30]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-[#302C26] mb-1">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Near Durga Mandir"
                      className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-xl bg-[#F8F4EC] text-[#263D30] focus:outline-none focus:border-[#263D30]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#302C26] mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-xl bg-[#F8F4EC] text-[#263D30] focus:outline-none focus:border-[#263D30]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#302C26] mb-1">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      required
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-xl bg-[#F8F4EC] text-[#263D30] font-mono focus:outline-none focus:border-[#263D30]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#302C26] mb-1">
                    Special Doorstep Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="e.g. Leave in morning delivery bag, ring bell once"
                    className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-xl bg-[#F8F4EC] text-[#263D30] focus:outline-none focus:border-[#263D30]"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2.5 shadow-lg shadow-[#25D366]/20 transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  <MessageCircle className="w-5 h-5 fill-white text-white" />
                  <span>
                    {isSubmitting ? 'Registering...' : 'Start Subscription & Send Details on WhatsApp'}
                  </span>
                </button>

                <p className="text-[11px] text-center text-[#302C26]/60 mt-2">
                  No payment needed now. Your morning subscription is confirmed directly with our dispatch manager on WhatsApp (+91 7067672604).
                </p>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
};
