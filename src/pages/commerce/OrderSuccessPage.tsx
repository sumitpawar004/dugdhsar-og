import React, { useEffect, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/RouterContext';
import { formatPaise } from '../../types';
import { 
  CheckCircle2, 
  Truck, 
  ArrowRight, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  MessageCircle, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { getWhatsAppOrderUrl, formatWhatsAppOrderMessage, OFFICIAL_WHATSAPP_NUMBER } from '../../utils/whatsapp';

export const OrderSuccessPage: React.FC = () => {
  const { orders, getOrderById } = useStore();
  const { params, navigate } = useRouter();

  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const orderId = params.id;
  const order = getOrderById(orderId) || orders[0];

  useEffect(() => {
    // Dynamically load and fire celebratory confetti only on mount
    import('canvas-confetti').then(({ default: confetti }) => {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C2A36C', '#263D30', '#A34F37', '#F3EDE1']
      });
    }).catch(() => {});
  }, []);

  if (!order) {
    return (
      <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-24 text-center">
        <h2 className="text-2xl font-serif text-[#263D30] mb-3">Order Not Found</h2>
        <button onClick={() => navigate('/shop')} className="bg-[#263D30] text-[#FAF6EE] px-6 py-2 rounded-lg text-xs cursor-pointer">
          Return to Shop
        </button>
      </div>
    );
  }

  const whatsappUrl = getWhatsAppOrderUrl(order);
  const whatsappText = formatWhatsAppOrderMessage(order);

  const handleCopyDetails = () => {
    navigator.clipboard.writeText(whatsappText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-12 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Main Success Card */}
        <div className="bg-[#FAF6EE] rounded-3xl border border-[#D8C9AD] p-6 sm:p-12 shadow-sm text-center mb-8">
          
          <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <p className="text-xs uppercase tracking-[0.25em] text-[#A34F37] font-semibold mb-1">
            Order Confirmed & Scheduled
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#263D30] font-normal mb-2">
            Gratitude from DUGDHSAR Gaushala
          </h1>
          <p className="text-xs text-[#302C26]/75 mb-6">
            Order Reference: <strong className="text-[#263D30] font-mono">{order.orderNumber}</strong> ({order.id})
          </p>

          {/* Primary WhatsApp Dispatch Notification Banner */}
          <div className="bg-emerald-50/90 border-2 border-[#25D366] rounded-2xl p-4 sm:p-6 mb-8 text-left shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-md">
                  <MessageCircle className="w-6 h-6 fill-white text-[#25D366]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#128C7E]">
                      Official WhatsApp Dispatch
                    </span>
                    <span className="text-[10px] bg-[#25D366] text-white font-mono font-bold px-2 py-0.5 rounded-full">
                      +91 {OFFICIAL_WHATSAPP_NUMBER}
                    </span>
                  </div>
                  <h2 className="font-serif text-base sm:text-lg font-bold text-[#263D30] leading-snug">
                    Complete Order & Customer Details Sent
                  </h2>
                  <p className="text-xs text-[#302C26]/80 mt-1 leading-relaxed">
                    Customer contact, doorstep address in Seoni, items list, and billing total have been generated for direct WhatsApp dispatch confirmation.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 text-center"
                >
                  <MessageCircle className="w-4 h-4 fill-white text-white" />
                  <span>Send on WhatsApp</span>
                </a>

                <button
                  onClick={handleCopyDetails}
                  className="px-4 py-3 bg-white hover:bg-[#FAF6EE] text-[#263D30] border border-[#D8C9AD] font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4 text-[#302C26]/70" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Collapsible WhatsApp Message Preview */}
            <div className="mt-4 pt-3 border-t border-emerald-200/80">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs font-semibold text-emerald-900 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
              >
                <span>{showPreview ? 'Hide WhatsApp Message Details' : 'View Full Details Forwarded to WhatsApp'}</span>
                {showPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showPreview && (
                <div className="mt-3 p-3 bg-white/90 rounded-xl border border-emerald-200 text-xs font-mono text-[#302C26] whitespace-pre-line leading-relaxed max-h-64 overflow-y-auto">
                  {whatsappText}
                </div>
              )}
            </div>
          </div>

          {/* Delivery Promise Strip */}
          <div className="bg-[#F8F4EC] p-5 sm:p-6 rounded-2xl border border-[#D8C9AD] text-left grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#A34F37] shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold text-[#A34F37] uppercase tracking-wider block">
                  Delivery Window
                </span>
                <span className="text-xs font-semibold text-[#263D30]">{order.deliverySlot}</span>
                <p className="text-[11px] text-[#302C26]/70 mt-0.5">{order.estimatedDelivery}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#A34F37] shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold text-[#A34F37] uppercase tracking-wider block">
                  Delivering To
                </span>
                <span className="text-xs font-semibold text-[#263D30]">{order.customerName} ({order.customerPhone})</span>
                <p className="text-[11px] text-[#302C26]/70 mt-0.5 line-clamp-2">
                  {order.deliveryAddress.flatNo}, {order.deliveryAddress.apartment}, {order.deliveryAddress.street ? order.deliveryAddress.street + ', ' : ''}{order.deliveryAddress.city} — {order.deliveryPincode}
                </p>
              </div>
            </div>
          </div>

          {/* Immutable Items Snapshot */}
          <div className="text-left mb-8">
            <h3 className="font-serif text-lg text-[#263D30] font-semibold mb-3">
              Itemized Dairy Receipt
            </h3>
            <div className="border border-[#D8C9AD] rounded-2xl overflow-hidden divide-y divide-[#D8C9AD]/40 text-xs">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={item.imageUrlSnapshot} 
                      alt={item.productNameSnapshot}
                      className="w-12 h-12 object-contain bg-[#F8F4EC] rounded-lg p-1"
                    />
                    <div>
                      <span className="font-semibold text-[#263D30] block">{item.productNameSnapshot}</span>
                      <span className="text-[11px] text-[#302C26]/60">{item.sizeSnapshot} × {item.quantity}</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-sm text-[#263D30] tabular-nums">
                    {formatPaise(item.totalPaise)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 space-y-1.5 text-xs text-right">
              <div className="text-[#302C26]/75">Subtotal: <span className="font-mono tabular-nums">{formatPaise(order.subtotalPaise)}</span></div>
              {order.discountPaise > 0 && (
                <div className="text-emerald-800 font-semibold">Discount: -<span className="font-mono tabular-nums">{formatPaise(order.discountPaise)}</span></div>
              )}
              <div className="text-[#302C26]/75">Cold-Chain Delivery: <span className="font-mono tabular-nums">{order.shippingPaise === 0 ? 'Free' : formatPaise(order.shippingPaise)}</span></div>
              <div className="text-base font-bold text-[#263D30] pt-2 border-t border-[#D8C9AD]">
                Total: <span className="font-mono text-lg tabular-nums">{formatPaise(order.totalPaise)}</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#1EBE5D] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <MessageCircle className="w-4 h-4 fill-white text-white" />
              <span>Contact Dispatch on WhatsApp</span>
            </a>

            <button
              onClick={() => navigate('/account/orders')}
              className="bg-[#F8F4EC] text-[#263D30] border border-[#D8C9AD] hover:bg-[#FAF6EE] px-6 py-3 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              View Order in Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
