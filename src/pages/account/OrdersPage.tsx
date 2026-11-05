import React from 'react';
import { AccountLayout } from './AccountLayout';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/RouterContext';
import { formatPaise } from '../../types';
import { Package, ArrowRight, Clock, MapPin, Truck } from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const { orders } = useStore();
  const { navigate } = useRouter();

  return (
    <AccountLayout>
      <div className="bg-[#FAF6EE] p-6 sm:p-8 rounded-3xl border border-[#D8C9AD] shadow-xs">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#D8C9AD]">
          <div>
            <h2 className="font-serif text-2xl text-[#263D30] font-semibold">
              Order History ({orders.length})
            </h2>
            <p className="text-xs text-[#302C26]/70">
              Review itemized invoices, track cold-chain deliveries, or cancel active orders.
            </p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#302C26]/70">
            No orders found in your history.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/account/orders/${order.id}`)}
                className="p-5 rounded-2xl border border-[#D8C9AD] hover:border-[#263D30] transition-all cursor-pointer group bg-[#F8F4EC]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-[#D8C9AD]/40">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-[#263D30]">{order.orderNumber}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                      order.status === 'dispatched' ? 'bg-[#263D30]/10 text-[#263D30]' :
                      order.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="text-xs text-[#302C26]/60">
                    Placed: {new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-[#263D30] mb-1">
                      {order.items.map(i => `${i.productNameSnapshot} (${i.sizeSnapshot}) × ${i.quantity}`).join(', ')}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-[#302C26]/70">
                      <span>Slot: {order.deliverySlot}</span>
                      <span>·</span>
                      <span>Payment: {order.paymentMethod.toUpperCase()} ({order.paymentStatus})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-mono font-bold text-base text-[#263D30] tabular-nums block">
                        {formatPaise(order.totalPaise)}
                      </span>
                      <span className="text-[10px] text-[#302C26]/60">Total Paid</span>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-[#FAF6EE] border border-[#D8C9AD] flex items-center justify-center text-[#263D30] group-hover:bg-[#263D30] group-hover:text-[#FAF6EE] transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AccountLayout>
  );
};
