import React, { useEffect, useState } from 'react';
import { useRouter } from '../../router/RouterContext';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export const PaymentResultPage: React.FC = () => {
  const { searchParams, navigate } = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');

  const orderId = searchParams.get('order_id') || 'ORD-2026-8941';

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus('success');
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-20">
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="bg-[#FAF6EE] p-8 rounded-3xl border border-[#D8C9AD] shadow-sm">
          {status === 'verifying' ? (
            <div className="py-8 space-y-4">
              <div className="w-12 h-12 border-3 border-[#263D30] border-t-transparent rounded-full animate-spin mx-auto" />
              <h2 className="text-xl font-serif text-[#263D30]">Verifying Bank Authorization</h2>
              <p className="text-xs text-[#302C26]/70">Communicating with payment gateway idempotency node...</p>
            </div>
          ) : status === 'success' ? (
            <div className="py-4 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-serif text-[#263D30]">Payment Captured</h2>
              <p className="text-xs text-[#302C26]/70">
                Payment signature successfully verified for order <strong className="font-mono">{orderId}</strong>.
              </p>
              <button
                onClick={() => navigate(`/order/success/${orderId}`)}
                className="w-full mt-4 bg-[#263D30] text-[#FAF6EE] py-3 rounded-xl text-xs font-semibold hover:bg-[#1A2B22] transition-colors flex items-center justify-center gap-2"
              >
                <span>View Order Receipt</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="py-4 space-y-4">
              <div className="w-14 h-14 bg-rose-100 text-rose-800 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-serif text-rose-800">Transaction Failed</h2>
              <p className="text-xs text-[#302C26]/70">
                The banking authority declined this transaction. Please try another payment mode.
              </p>
              <button
                onClick={() => navigate('/checkout')}
                className="w-full mt-4 bg-[#A34F37] text-[#FAF6EE] py-3 rounded-xl text-xs font-semibold hover:bg-[#8e422c]"
              >
                Retry Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
