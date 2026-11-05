import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/RouterContext';
import { formatPaise, Address } from '../../types';
import { getWhatsAppOrderUrl } from '../../utils/whatsapp';
import { 
  ShieldCheck, 
  MapPin, 
  CreditCard, 
  QrCode, 
  Banknote, 
  Check, 
  ArrowLeft, 
  ArrowRight,
  Plus,
  Truck,
  MessageCircle
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { 
    cart, 
    addresses, 
    addAddress, 
    cartSubtotalPaise, 
    cartDiscountPaise, 
    deliveryFeePaise, 
    cartTotalPaise,
    appliedCoupon,
    createOrder,
    activeDeliveryZone,
    selectedDeliverySlot
  } = useStore();

  const { navigate } = useRouter();

  // Active address selection
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    addresses[0]?.id || ''
  );

  // New address form toggle
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddr, setNewAddr] = useState({
    fullName: '',
    phone: '',
    flatNo: '',
    apartment: '',
    street: '',
    landmark: 'Barghat Road',
    city: 'Seoni',
    state: 'Madhya Pradesh',
    pincode: '480661',
    isDefault: true,
    deliverySlot: '5:00 AM - 10:00 AM',
    instructions: 'Leave cold milk bag on doorstep hook'
  });

  // Payment method selection
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cod' | 'netbanking'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  if (cart.length === 0) {
    return (
      <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-24 text-center">
        <h2 className="text-2xl font-serif text-[#263D30] mb-3">No items in your basket to checkout</h2>
        <p className="text-xs text-[#302C26]/70 mb-6">Please add items from the farm catalog first.</p>
        <button
          onClick={() => navigate('/shop')}
          className="bg-[#263D30] text-[#FAF6EE] px-6 py-2.5 rounded-xl text-xs font-semibold"
        >
          Explore Shop
        </button>
      </div>
    );
  }

  const selectedAddress = addresses.find(a => a.id === selectedAddressId) || addresses[0];

  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.fullName || !newAddr.phone || !newAddr.flatNo || !newAddr.pincode) return;

    const created = addAddress(newAddr);
    setSelectedAddressId(created.id);
    setShowNewAddressForm(false);
  };

  const handlePlaceOrder = () => {
    if (!selectedAddress) {
      alert('Please specify or select a delivery address');
      return;
    }

    setIsProcessing(true);

    // Simulate payment transaction & create order with immutable snapshot
    setTimeout(() => {
      const placedOrder = createOrder({
        address: selectedAddress,
        paymentMethod,
        notes: orderNotes
      });

      // Automatically construct and open WhatsApp with complete customer & order details
      try {
        const whatsappUrl = getWhatsAppOrderUrl(placedOrder);
        window.open(whatsappUrl, '_blank');
      } catch (err) {
        console.warn('WhatsApp window open notice', err);
      }

      setIsProcessing(false);
      navigate(`/order/success/${placedOrder.id}`);
    }, 900);
  };

  return (
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Navigation Breadcrumb */}
        <button 
          onClick={() => navigate('/cart')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#A34F37] hover:text-[#263D30] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Basket</span>
        </button>

        <h1 className="text-3xl font-serif text-[#263D30] font-normal mb-8">
          Cold-Chain Secure Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left: Step 1 (Address) & Step 2 (Payment) (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Step 1: Delivery Address */}
            <div className="bg-[#FAF6EE] p-6 sm:p-8 rounded-3xl border border-[#D8C9AD] shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#D8C9AD]">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#263D30] text-[#FAF6EE] flex items-center justify-center font-bold text-xs">
                    1
                  </span>
                  <h2 className="font-serif text-xl text-[#263D30] font-semibold">
                    Delivery Address & Slot
                  </h2>
                </div>

                <button
                  onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                  className="text-xs font-semibold text-[#A34F37] hover:text-[#263D30] flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showNewAddressForm ? 'Cancel' : 'Add New Address'}</span>
                </button>
              </div>

              {/* New Address Form */}
              {showNewAddressForm && (
                <form onSubmit={handleAddNewAddress} className="mb-6 p-5 bg-[#F8F4EC] rounded-2xl border border-[#D8C9AD] space-y-4">
                  <h3 className="text-xs font-bold text-[#263D30] uppercase tracking-wider">
                    Add Doorstep Delivery Address
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Full Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={newAddr.fullName}
                        onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-lg bg-[#FAF6EE] text-[#302C26]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Phone *</label>
                      <input 
                        type="tel" 
                        required 
                        value={newAddr.phone}
                        onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                        placeholder="7067672604"
                        className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-lg bg-[#FAF6EE] text-[#302C26]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Flat / House No *</label>
                      <input 
                        type="text" 
                        required 
                        value={newAddr.flatNo}
                        onChange={(e) => setNewAddr({ ...newAddr, flatNo: e.target.value })}
                        placeholder="House 42, Ground Floor"
                        className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-lg bg-[#FAF6EE] text-[#302C26]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Colony / Area *</label>
                      <input 
                        type="text" 
                        required 
                        value={newAddr.apartment}
                        onChange={(e) => setNewAddr({ ...newAddr, apartment: e.target.value })}
                        placeholder="Barghat Road, Sufi Nagar"
                        className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-lg bg-[#FAF6EE] text-[#302C26]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium mb-1">City *</label>
                      <input 
                        type="text" 
                        required 
                        value={newAddr.city}
                        onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-lg bg-[#FAF6EE] text-[#302C26]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1">State *</label>
                      <input 
                        type="text" 
                        required 
                        value={newAddr.state}
                        onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-lg bg-[#FAF6EE] text-[#302C26]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Pincode *</label>
                      <input 
                        type="text" 
                        required 
                        value={newAddr.pincode}
                        onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                        placeholder="122002"
                        className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-lg bg-[#FAF6EE] text-[#302C26] font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="bg-[#263D30] text-[#FAF6EE] px-5 py-2 text-xs font-semibold rounded-lg hover:bg-[#1A2B22]"
                  >
                    Save & Use Address
                  </button>
                </form>
              )}

              {/* Existing Saved Addresses */}
              <div className="space-y-3">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div 
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-2 border-[#263D30] bg-[#FAF6EE]' 
                          : 'border-[#D8C9AD] hover:bg-[#D8C9AD]/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-[#263D30] text-sm">{addr.fullName}</span>
                            <span className="text-[11px] text-[#302C26]/60 font-mono">{addr.phone}</span>
                            {addr.isDefault && (
                              <span className="text-[10px] bg-[#C2A36C]/20 text-[#302C26] font-semibold px-2 py-0.5 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-[#302C26]/80 leading-relaxed">
                            {addr.flatNo}, {addr.apartment}, {addr.street}, {addr.city} — {addr.pincode}
                          </p>
                          {addr.instructions && (
                            <p className="text-[11px] text-[#A34F37] mt-1 italic">
                              Instructions: {addr.instructions}
                            </p>
                          )}
                        </div>

                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-[#263D30] bg-[#263D30] text-[#FAF6EE]' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Delivery Window summary */}
              <div className="mt-4 p-3 bg-[#F8F4EC] rounded-xl text-xs text-[#263D30] flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#A34F37]" />
                <span>Selected Window: <strong>{selectedDeliverySlot}</strong></span>
              </div>
            </div>

            {/* Step 2: Payment Method */}
            <div className="bg-[#FAF6EE] p-6 sm:p-8 rounded-3xl border border-[#D8C9AD] shadow-xs">
              <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-[#D8C9AD]">
                <span className="w-7 h-7 rounded-full bg-[#263D30] text-[#FAF6EE] flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <h2 className="font-serif text-xl text-[#263D30] font-semibold">
                  Payment Method
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {[
                  { id: 'upi', label: 'Instant UPI / QR Code', icon: QrCode, desc: 'Google Pay, PhonePe, Paytm' },
                  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard, desc: 'Visa, Mastercard, RuPay' },
                  { id: 'cod', label: 'Cash on Delivery (COD)', icon: Banknote, desc: 'Pay at morning doorstep' },
                  { id: 'netbanking', label: 'Net Banking', icon: ShieldCheck, desc: 'All Major Indian Banks' }
                ].map((m) => {
                  const Icon = m.icon;
                  const isSel = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        isSel 
                          ? 'border-2 border-[#263D30] bg-[#FAF6EE]' 
                          : 'border-[#D8C9AD] hover:bg-[#D8C9AD]/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${isSel ? 'text-[#A34F37]' : 'text-[#302C26]/60'}`} />
                        <span className="font-semibold text-xs text-[#263D30]">{m.label}</span>
                      </div>
                      <p className="text-[11px] text-[#302C26]/60">{m.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* UPI Simulated QR view */}
              {paymentMethod === 'upi' && (
                <div className="p-4 bg-[#F8F4EC] rounded-xl border border-[#D8C9AD] flex items-center gap-4 text-xs">
                  <div className="w-16 h-16 bg-[#FAF6EE] p-1 rounded-lg border border-[#D8C9AD] flex items-center justify-center shrink-0">
                    <QrCode className="w-14 h-14 text-[#263D30]" />
                  </div>
                  <div>
                    <span className="font-bold text-[#263D30] block">VPA: dugdhsar.vedic@icici</span>
                    <p className="text-[#302C26]/70 text-[11px] mt-0.5">
                      Upon clicking Place Order, the transaction will be verified automatically via the mock gateway signature.
                    </p>
                  </div>
                </div>
              )}

              {/* Order Notes */}
              <div className="mt-4">
                <label className="block text-xs font-semibold text-[#302C26] mb-1">
                  Delivery Notes / Gate Code (Optional)
                </label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Ring bell once, gate code 4022"
                  className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-lg bg-[#FAF6EE] text-[#302C26]"
                />
              </div>
            </div>
          </div>

          {/* Right: Order Snapshot (5 cols) */}
          <div className="lg:col-span-5 bg-[#FAF6EE] p-8 rounded-3xl border border-[#D8C9AD] shadow-sm space-y-6">
            <h2 className="font-serif text-2xl text-[#263D30] font-semibold border-b border-[#D8C9AD] pb-4">
              Order Review
            </h2>

            {/* Itemized Line Items */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.variantId} className="flex items-center justify-between text-xs py-1.5 border-b border-[#D8C9AD]/40 last:border-0">
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="font-medium text-[#263D30] block truncate">{item.product.name}</span>
                    <span className="text-[11px] text-[#302C26]/60">{item.variant.sizeLabel} × {item.quantity}</span>
                  </div>
                  <span className="font-mono font-bold text-[#263D30] tabular-nums shrink-0">
                    {formatPaise(item.variant.pricePaise * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations strictly in Integer Paise */}
            <div className="space-y-2.5 text-xs pt-4 border-t border-[#D8C9AD]">
              <div className="flex justify-between">
                <span className="text-[#302C26]/75">Subtotal</span>
                <span className="font-mono font-semibold tabular-nums">{formatPaise(cartSubtotalPaise)}</span>
              </div>

              {cartDiscountPaise > 0 && (
                <div className="flex justify-between text-emerald-800 font-semibold">
                  <span>Voucher ({appliedCoupon?.code})</span>
                  <span className="font-mono tabular-nums">- {formatPaise(cartDiscountPaise)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-[#302C26]/75">Cold-Chain Delivery</span>
                <span className="font-mono font-semibold tabular-nums">
                  {deliveryFeePaise === 0 ? 'Free' : formatPaise(deliveryFeePaise)}
                </span>
              </div>

              <div className="flex justify-between text-base font-bold text-[#263D30] pt-4 border-t border-[#D8C9AD]">
                <span>Payable Amount</span>
                <span className="font-mono text-xl tabular-nums">{formatPaise(cartTotalPaise)}</span>
              </div>
            </div>

            {/* WhatsApp Integration Notice */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950">
              <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <strong className="block text-emerald-900 font-semibold mb-0.5">Direct WhatsApp Order Sync:</strong>
                <span>Order details and customer delivery address will automatically forward to Official WhatsApp (+91 7067672604) for doorstep dispatch.</span>
              </div>
            </div>

            {/* Submit CTA */}
            <button
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-white py-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 active:scale-[0.99] disabled:opacity-50"
            >
              {isProcessing ? (
                <span>Generating Order & Opening WhatsApp...</span>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 fill-white text-white" />
                  <span>Confirm Order & Send to WhatsApp · {formatPaise(cartTotalPaise)}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-[11px] text-[#302C26]/70 flex items-center justify-center gap-1.5 pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Immutable Snapshot Stored in Relational Engine · Seoni Cold-Chain</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
