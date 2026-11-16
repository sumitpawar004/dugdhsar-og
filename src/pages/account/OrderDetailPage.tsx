import React, { useState } from 'react';
import { AccountLayout } from './AccountLayout';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/RouterContext';
import { formatPaise } from '../../types';
import { ArrowLeft, Truck } from 'lucide-react';
import { MessageCircle } from 'lucide-react';
import { getWhatsAppOrderUrl } from '../../utils/whatsapp';
import { OrderQrCode } from '../../components/OrderQrCode';

export const OrderDetailPage: React.FC = () => {
  const { cancelOrder, getOrderById, currentUser } = useStore();
  const { params, navigate } = useRouter();

  const orderId = params.id;
  const targetOrder = getOrderById(orderId);

  // Strict ownership check: Only allow customer who owns the order or an Admin
  const isAuthorized = targetOrder && (
    currentUser.role === 'admin' ||
    targetOrder.userId === currentUser.id ||
    (Boolean(currentUser.email) && targetOrder.customerEmail?.toLowerCase() === currentUser.email.toLowerCase())
  );

  const order = isAuthorized ? targetOrder : null;

  const [cancelStatus, setCancelStatus] = useState<string | null>(null);

  if (!order) {
    return (
      <AccountLayout>
        <div className="bg-[#FAF6EE] p-12 text-center rounded-3xl border border-[#D8C9AD]">
          <h2 className="text-xl font-serif text-[#263D30] mb-2">Order Not Found</h2>
          <p className="text-xs text-[#302C26]/70 mb-4">
            This order ID is either invalid or belongs to another patron account.
          </p>
          <button 
            onClick={() => navigate('/account/orders')} 
            className="px-4 py-2 bg-[#263D30] text-[#FAF6EE] rounded-xl text-xs font-semibold hover:bg-[#1A2B22] cursor-pointer"
          >
            ← Back to Your Orders
          </button>
        </div>
      </AccountLayout>
    );
  }

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel this order?')) {
      const res = cancelOrder(order.id, 'Customer cancelled from portal');
      setCancelStatus(res.message);
    }
  };

  return (
    <AccountLayout>
      <div className="bg-[#FAF6EE] p-6 sm:p-8 rounded-3xl border border-[#D8C9AD] shadow-xs space-y-6">
        
        {/* Back and Title */}
        <div className="flex items-center justify-between pb-4 border-b border-[#D8C9AD]">
          <button 
            onClick={() => navigate('/account/orders')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A34F37] hover:text-[#263D30]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Orders</span>
          </button>

          <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
            order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
            order.status === 'dispatched' ? 'bg-[#263D30]/10 text-[#263D30]' :
            order.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
            'bg-amber-100 text-amber-800'
          }`}>
            {order.status}
          </span>
        </div>

        {/* Order Meta Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F8F4EC] p-5 rounded-2xl border border-[#D8C9AD]">
          <div>
            <h1 className="font-serif text-2xl text-[#263D30] font-semibold">
              Order {order.orderNumber}
            </h1>
            <p className="text-xs text-[#302C26]/70 mt-0.5">
              Reference ID: <span className="font-mono">{order.id}</span> · Placed on {new Date(order.createdAt).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={getWhatsAppOrderUrl(order)}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#1EBE5D] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <MessageCircle className="w-4 h-4 fill-white text-white" />
              <span>Send / Track on WhatsApp</span>
            </a>

            <button
              onClick={() => navigate('/track-order')}
              className="bg-[#263D30] text-[#FAF6EE] px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#1A2B22] flex items-center gap-1.5"
            >
              <Truck className="w-4 h-4" />
              <span>Track Delivery</span>
            </button>
          </div>
        </div>

        {cancelStatus && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl">
            {cancelStatus}
          </div>
        )}

        {/* Delivery Address & Slot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-[#D8C9AD] bg-[#F8F4EC]">
            <span className="font-bold text-[#A34F37] uppercase tracking-wider block mb-1">
              Delivery Address
            </span>
            <span className="font-semibold text-[#263D30] block">{order.customerName} ({order.customerPhone})</span>
            <p className="text-[#302C26]/75 mt-0.5">
              {order.deliveryAddress.flatNo}, {order.deliveryAddress.apartment}, {order.deliveryAddress.street}, {order.deliveryAddress.city} — {order.deliveryPincode}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[#D8C9AD] bg-[#F8F4EC]">
            <span className="font-bold text-[#A34F37] uppercase tracking-wider block mb-1">
              Dispatch Window & Payment
            </span>
            <span className="font-semibold text-[#263D30] block">{order.deliverySlot}</span>
            <p className="text-[#302C26]/75 mt-0.5">
              Method: <strong>{order.paymentMethod.toUpperCase()}</strong> · Status: <strong>{order.paymentStatus}</strong>
            </p>
          </div>
        </div>

        {/* Doorstep Delivery QR Code */}
        {order.qrToken && (
          <OrderQrCode
            orderId={order.id}
            orderNumber={order.orderNumber}
            qrToken={order.qrToken}
            status={order.status}
            verifiedAt={order.qrVerifiedAt}
            verifiedBy={order.qrVerifiedBy}
          />
        )}

        {/* Itemized Snapshot Table */}
        <div>
          <h3 className="font-serif text-lg text-[#263D30] font-semibold mb-3">
            Purchased Line Items
          </h3>
          <div className="border border-[#D8C9AD] rounded-2xl overflow-hidden divide-y divide-[#D8C9AD]/40 text-xs">
            {order.items.map((item, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img 
                    src={item.imageUrlSnapshot} 
                    alt={item.productNameSnapshot}
                    className="w-12 h-12 object-contain bg-[#FAF6EE] rounded-lg p-1"
                  />
                  <div>
                    <span className="font-semibold text-[#263D30] block">{item.productNameSnapshot}</span>
                    <span className="text-[11px] text-[#302C26]/60">{item.sizeSnapshot} × {item.quantity}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-[#263D30] tabular-nums block">
                    {formatPaise(item.totalPaise)}
                  </span>
                  <span className="text-[10px] text-[#302C26]/50">
                    {formatPaise(item.pricePaiseSnapshot)} each
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calculations Breakdown strictly in Integer Paise */}
        <div className="pt-4 border-t border-[#D8C9AD] space-y-2 text-xs max-w-xs ml-auto">
          <div className="flex justify-between">
            <span className="text-[#302C26]/70">Subtotal</span>
            <span className="font-mono tabular-nums">{formatPaise(order.subtotalPaise)}</span>
          </div>
          {order.discountPaise > 0 && (
            <div className="flex justify-between text-emerald-800 font-semibold">
              <span>Promotional Discount</span>
              <span className="font-mono tabular-nums">- {formatPaise(order.discountPaise)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[#302C26]/70">Cold-Chain Delivery</span>
            <span className="font-mono tabular-nums">{order.shippingPaise === 0 ? 'Free' : formatPaise(order.shippingPaise)}</span>
          </div>
          <div className="flex justify-between font-bold text-[#263D30] text-sm pt-2 border-t border-[#D8C9AD]">
            <span>Total Amount</span>
            <span className="font-mono text-base tabular-nums">{formatPaise(order.totalPaise)}</span>
          </div>
        </div>

        {/* Cancellation CTA */}
        {order.status !== 'delivered' && order.status !== 'cancelled' && (
          <div className="pt-4 border-t border-[#D8C9AD] flex justify-end">
            <button
              onClick={handleCancel}
              className="text-xs text-rose-700 hover:text-rose-900 font-semibold border border-rose-300 hover:bg-rose-50 px-4 py-2 rounded-xl transition-colors"
            >
              Cancel Order
            </button>
          </div>
        )}
      </div>
    </AccountLayout>
  );
};
