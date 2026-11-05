import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/RouterContext';
import { formatPaise } from '../../types';
import { Trash2, ShoppingBag, ArrowRight, Tag, ShieldCheck, Check, AlertCircle } from 'lucide-react';

export const CartPage: React.FC = () => {
  const { 
    cart, 
    updateCartQuantity, 
    removeFromCart, 
    clearCart,
    cartSubtotalPaise, 
    cartDiscountPaise, 
    deliveryFeePaise, 
    cartTotalPaise,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    activeDeliveryZone,
    selectedDeliverySlot,
    setSelectedDeliverySlot
  } = useStore();

  const { navigate } = useRouter();
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    const res = applyCoupon(couponInput);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponError(null);
      setCouponInput('');
    }
  };

  return (
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-[#D8C9AD]">
          <h1 className="text-3xl font-serif text-[#263D30] font-normal">
            Your Dairy Basket ({cart.reduce((a, b) => a + b.quantity, 0)} Items)
          </h1>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-[#A34F37] hover:underline"
            >
              Clear Basket
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="py-24 text-center bg-[#FAF6EE] rounded-3xl border border-[#D8C9AD]">
            <ShoppingBag className="w-12 h-12 text-[#D8C9AD] mx-auto mb-4" />
            <h2 className="text-2xl font-serif text-[#263D30] mb-2">Your basket is currently empty</h2>
            <p className="text-xs text-[#302C26]/70 max-w-sm mx-auto mb-6">
              Add fresh Gir cow A2 milk bottles, curd, or Bilona Ghee to schedule your morning delivery.
            </p>
            <button
              onClick={() => navigate('/shop')}
              className="bg-[#263D30] text-[#FAF6EE] px-6 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#1A2B22] transition-colors"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left: Cart Line Items (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {cart.map((item) => (
                <div 
                  key={item.variantId}
                  className="bg-[#FAF6EE] p-5 rounded-2xl border border-[#D8C9AD] flex items-center justify-between gap-4 shadow-xs"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 bg-[#F8F4EC] rounded-xl p-2 shrink-0 flex items-center justify-center">
                    <img 
                      src={item.product.images[0]?.imageUrl || '/assets/aistudio/image_fe6cbcdf.png'} 
                      alt={item.product.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-base text-[#263D30] font-semibold truncate">
                      {item.product.name}
                    </h3>
                    <p className="text-xs text-[#302C26]/70 mb-1">
                      {item.variant.sizeLabel}
                    </p>

                    {item.isSubscription && (
                      <span className="inline-block text-[10px] font-semibold text-[#A34F37] uppercase tracking-wide bg-[#F8F4EC] px-2 py-0.5 rounded">
                        Daily Subscription ({item.subscriptionFrequency})
                      </span>
                    )}

                    <div className="text-xs font-mono font-bold text-[#263D30] mt-1 tabular-nums">
                      {formatPaise(item.variant.pricePaise)} each
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-[#D8C9AD] rounded-lg bg-[#FAF6EE] overflow-hidden">
                    <button
                      onClick={() => updateCartQuantity(item.variantId, item.quantity - 1)}
                      className="px-2.5 py-1 text-xs font-bold hover:bg-[#F8F4EC]"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-xs font-mono font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.variantId, item.quantity + 1)}
                      className="px-2.5 py-1 text-xs font-bold hover:bg-[#F8F4EC]"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal & Delete */}
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-sm text-[#263D30] tabular-nums">
                      {formatPaise(item.variant.pricePaise * item.quantity)}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.variantId)}
                      className="text-slate-400 hover:text-rose-600 p-1 mt-1"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Delivery Slot Selection */}
              <div className="bg-[#FAF6EE] p-5 rounded-2xl border border-[#D8C9AD] space-y-3">
                <span className="text-xs font-bold text-[#263D30] uppercase tracking-wider block">
                  Select Preferred Dispatch Window
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Morning Delivery (05:30 AM - 11:00 AM)',
                    'Sunset Fresh Dispatch (05:00 PM - 07:00 PM)'
                  ].map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedDeliverySlot(slot)}
                      className={`p-3 text-left text-xs rounded-xl border transition-colors ${
                        selectedDeliverySlot === slot
                          ? 'bg-[#263D30] text-[#FAF6EE] border-[#263D30]'
                          : 'bg-[#F8F4EC] text-[#302C26] border-[#D8C9AD] hover:bg-[#D8C9AD]/30'
                      }`}
                    >
                      <div className="font-semibold">{slot.split(' (')[0]}</div>
                      <div className="text-[11px] opacity-75">{slot.split(' (')[1]?.replace(')', '')}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Order Summary & Coupon (5 cols) */}
            <div className="lg:col-span-5 bg-[#FAF6EE] p-8 rounded-3xl border border-[#D8C9AD] shadow-sm space-y-6">
              <h2 className="font-serif text-2xl text-[#263D30] font-semibold border-b border-[#D8C9AD] pb-4">
                Order Summary
              </h2>

              {/* Coupon Form */}
              <div>
                <label className="block text-xs font-semibold text-[#302C26] uppercase tracking-wider mb-2">
                  Promotional Voucher / Coupon
                </label>
                {appliedCoupon ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-emerald-800">{appliedCoupon.code}</span>
                      <span className="text-emerald-700 block text-[11px]">
                        Saved {formatPaise(cartDiscountPaise)} on this order
                      </span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-xs text-rose-600 hover:underline font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value); setCouponError(null); }}
                      placeholder="e.g. HERITAGE60"
                      className="flex-1 px-3 py-2 text-xs border border-[#D8C9AD] rounded-lg font-mono uppercase bg-[#F8F4EC] text-[#263D30] focus:outline-none focus:border-[#263D30]"
                    />
                    <button
                      type="submit"
                      className="bg-[#263D30] text-[#FAF6EE] px-4 py-2 text-xs font-semibold rounded-lg hover:bg-[#1A2B22] transition-colors"
                    >
                      Apply
                    </button>
                  </form>
                )}

                {couponError && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{couponError}</span>
                  </p>
                )}

                {!appliedCoupon && (
                  <div className="mt-2 text-[11px] text-[#302C26]/60 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-[#A34F37]" />
                    <span>Try code <strong>HERITAGE60</strong> for 15% off above ₹300</span>
                  </div>
                )}
              </div>

              {/* Monetary Breakdown strictly in Integer Paise */}
              <div className="space-y-3 text-xs pt-4 border-t border-[#D8C9AD]">
                <div className="flex justify-between">
                  <span className="text-[#302C26]/75">Subtotal</span>
                  <span className="font-mono font-semibold tabular-nums">{formatPaise(cartSubtotalPaise)}</span>
                </div>

                {cartDiscountPaise > 0 && (
                  <div className="flex justify-between text-emerald-800 font-semibold">
                    <span>Promotional Discount</span>
                    <span className="font-mono tabular-nums">- {formatPaise(cartDiscountPaise)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-[#302C26]/75">Cold-Chain Delivery (2°C - 4°C)</span>
                  <span className="font-mono font-semibold tabular-nums">
                    {deliveryFeePaise === 0 ? (
                      <span className="text-emerald-800 uppercase font-bold text-[11px]">Free Dawn Delivery</span>
                    ) : (
                      formatPaise(deliveryFeePaise)
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-base font-bold text-[#263D30] pt-4 border-t border-[#D8C9AD]">
                  <span>Total Amount</span>
                  <span className="font-mono text-xl tabular-nums">{formatPaise(cartTotalPaise)}</span>
                </div>
                <p className="text-[10px] text-[#302C26]/60">
                  Inclusive of all taxes (5% GST). Bottles provided in recyclable glass deposit crates.
                </p>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-[#A34F37] text-[#FAF6EE] py-4 rounded-xl text-xs font-semibold hover:bg-[#8e422c] transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Proceed to Secure Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-[11px] text-[#302C26]/70 flex items-center justify-center gap-1.5 pt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>15-Minute Inventory Lock Active · Zero Plastic Delivery</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
