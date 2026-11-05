import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useRouter } from '../router/RouterContext';
import { formatPaise } from '../types';
import { X, Trash2, ShoppingBag, ArrowRight, Sparkles, ShieldCheck, Tag } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    updateCartQuantity, 
    removeFromCart, 
    cartSubtotalPaise, 
    cartDiscountPaise, 
    deliveryFeePaise, 
    cartTotalPaise,
    appliedCoupon,
    applyCoupon,
    removeCoupon
  } = useStore();

  const { navigate } = useRouter();
  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    const res = applyCoupon(couponCode);
    if (res.success) {
      setCouponMsg({ text: res.message, isError: false });
      setCouponCode('');
    } else {
      setCouponMsg({ text: res.message, isError: true });
    }
  };

  const freeDeliveryThresholdPaise = 25000; // ₹250
  const amountNeededForFree = Math.max(0, freeDeliveryThresholdPaise - cartSubtotalPaise);
  const freeProgress = Math.min(100, (cartSubtotalPaise / freeDeliveryThresholdPaise) * 100);

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-300" 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
        <div className="w-screen max-w-md bg-[#FAF6EE] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300 border-l border-[#D8C9AD]">
          
          {/* Top Header */}
          <div className="p-5 border-b border-[#D8C9AD] flex items-center justify-between bg-[#F8F4EC]">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-[#263D30]" />
              <h3 className="text-base font-serif font-bold text-[#263D30] tracking-tight">
                Your Morning Basket
              </h3>
              <span className="bg-[#263D30] text-[#FAF6EE] text-xs font-mono font-bold px-2 py-0.5 rounded-full">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-[#302C26]/60 hover:text-[#263D30] rounded-full hover:bg-[#F8F4EC] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Meter */}
          <div className="px-5 py-3 bg-[#FAF6EE] border-b border-[#D8C9AD] text-xs">
            {amountNeededForFree > 0 ? (
              <p className="text-[#302C26] font-medium">
                Add <strong>{formatPaise(amountNeededForFree)}</strong> more for <strong>FREE Doorstep Delivery</strong>!
              </p>
            ) : (
              <p className="text-[#263D30] font-bold flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-[#C2A36C]" />
                <span>You’ve unlocked FREE Doorstep Delivery!</span>
              </p>
            )}
            <div className="w-full bg-[#D8C9AD]/50 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-[#C2A36C] h-full transition-all duration-300"
                style={{ width: `${freeProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <ShoppingBag className="w-12 h-12 text-[#D8C9AD] mx-auto" />
                <p className="text-sm font-serif text-[#263D30] font-semibold">Your basket is currently empty</p>
                <p className="text-xs text-[#302C26]/70">Explore pure A2 milk bottles, Bilona Ghee, and fresh curd.</p>
                <button
                  onClick={() => { setIsCartOpen(false); navigate('/shop'); }}
                  className="bg-[#263D30] text-[#FAF6EE] px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#1A2B22]"
                >
                  Explore Store
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div 
                  key={item.variantId}
                  className="flex items-center justify-between p-3.5 bg-[#F8F4EC] rounded-2xl border border-[#D8C9AD]"
                >
                  <img
                    src={item.product.images[0]?.imageUrl || '/assets/aistudio/image_fe6cbcdf.png'}
                    alt={item.product.name}
                    className="w-14 h-14 object-contain rounded-lg p-1 bg-[#FAF6EE] border border-[#D8C9AD]/30"
                  />

                  <div className="flex-1 min-w-0 px-3">
                    <h4 className="text-xs font-serif font-bold text-[#263D30] truncate">
                      {item.product.name}
                    </h4>
                    <span className="text-[11px] text-[#302C26]/60 block">{item.variant.sizeLabel}</span>
                    <span className="text-xs font-mono font-bold text-[#263D30]">
                      {formatPaise(item.variant.pricePaise)}
                    </span>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-[#D8C9AD] rounded-lg bg-[#FAF6EE] overflow-hidden shrink-0">
                    <button
                      onClick={() => updateCartQuantity(item.variantId, item.quantity - 1)}
                      className="px-2 py-1 text-xs font-bold hover:bg-[#F8F4EC]"
                    >
                      -
                    </button>
                    <span className="px-2.5 py-1 text-xs font-mono font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.variantId, item.quantity + 1)}
                      className="px-2 py-1 text-xs font-bold hover:bg-[#F8F4EC]"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.variantId)}
                    className="text-slate-400 hover:text-[#A34F37] p-1.5 ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Totals */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-[#D8C9AD] bg-[#FAF6EE] space-y-3">
              {/* Promo code */}
              {appliedCoupon ? (
                <div className="flex justify-between items-center text-xs p-2 bg-[#E8EFEA] border border-[#263D30]/20 rounded-lg">
                  <span className="font-mono font-bold text-[#263D30]">{appliedCoupon.code} applied</span>
                  <button onClick={removeCoupon} className="text-[#A34F37] font-semibold hover:underline text-[11px]">Remove</button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Coupon (HERITAGE60)"
                    className="flex-1 px-3 py-1.5 text-xs border border-[#D8C9AD] rounded-lg bg-[#F8F4EC] uppercase font-mono text-[#263D30] focus:outline-none focus:border-[#263D30]"
                  />
                  <button
                    type="submit"
                    className="bg-[#263D30] text-[#FAF6EE] px-3.5 py-1.5 text-xs font-semibold rounded-lg hover:bg-[#1A2B22]"
                  >
                    Apply
                  </button>
                </form>
              )}

              {couponMsg && (
                <p className={`text-[11px] ${couponMsg.isError ? 'text-[#A34F37]' : 'text-emerald-700'}`}>
                  {couponMsg.text}
                </p>
              )}

              <div className="space-y-1.5 text-xs pt-2">
                <div className="flex justify-between text-[#302C26]/75">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">{formatPaise(cartSubtotalPaise)}</span>
                </div>
                {cartDiscountPaise > 0 && (
                  <div className="flex justify-between text-[#A34F37] font-semibold">
                    <span>Discount</span>
                    <span className="font-mono tabular-nums">- {formatPaise(cartDiscountPaise)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#302C26]/75">
                  <span>Cold-Chain Delivery</span>
                  <span className="font-mono tabular-nums">{deliveryFeePaise === 0 ? 'Free' : formatPaise(deliveryFeePaise)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#263D30] pt-2 border-t border-[#D8C9AD]">
                  <span>Total Amount</span>
                  <span className="font-mono text-base tabular-nums">{formatPaise(cartTotalPaise)}</span>
                </div>
              </div>

              <button
                onClick={handleProceedToCheckout}
                className="w-full bg-[#A34F37] text-white py-3.5 rounded-xl text-xs font-semibold hover:bg-[#853C26] transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Checkout Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
