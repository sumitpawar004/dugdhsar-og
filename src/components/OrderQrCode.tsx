import React, { useEffect, useRef, useState } from 'react';
import { drawQrToCanvas, buildDeliveryVerifyUrl } from '../lib/qrCode';
import { useRouter } from '../router/RouterContext';
import { CheckCircle2, Copy, Check, Download, QrCode, ScanLine } from 'lucide-react';

interface OrderQrCodeProps {
  orderId: string;
  orderNumber?: string;
  qrToken: string;
  deliveryDate?: string;
  status?: string;
  isDelivered?: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  title?: string;
  subtitle?: string;
  sizePx?: number;
  compact?: boolean;
}

export const OrderQrCode: React.FC<OrderQrCodeProps> = ({
  orderId,
  orderNumber,
  qrToken,
  deliveryDate,
  status,
  isDelivered: isDeliveredProp = false,
  verifiedAt,
  verifiedBy,
  title = 'Doorstep Delivery Verification QR',
  subtitle = 'Delivery partner scans this code upon doorstep handover to mark your order Delivered.',
  sizePx = 196,
  compact = false,
}) => {
  const isDelivered = isDeliveredProp || status === 'delivered';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { navigate } = useRouter();
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dugdhsar.in';
  const verifyUrl = buildDeliveryVerifyUrl(origin, orderId, qrToken, deliveryDate);

  useEffect(() => {
    if (canvasRef.current && qrToken) {
      drawQrToCanvas(canvasRef.current, verifyUrl, {
        sizePx,
        darkColor: '#1F3327',
        lightColor: '#FFFFFF',
      });
    }
  }, [verifyUrl, qrToken, sizePx]);

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `DUGDHSAR-QR-${orderNumber || orderId}.png`;
    a.click();
  };

  const openPartnerVerifier = () => {
    const params = new URLSearchParams();
    params.set('orderId', orderId);
    params.set('token', qrToken);
    if (deliveryDate) params.set('date', deliveryDate);
    navigate(`/delivery/verify?${params.toString()}`);
  };

  return (
    <div
      className={`rounded-2xl border-2 transition-colors ${
        isDelivered
          ? 'bg-emerald-50/90 border-emerald-400'
          : 'bg-white border-[#D8C9AD]'
      } ${compact ? 'p-4' : 'p-5 sm:p-6'}`}
    >
      <div className={`flex flex-col ${compact ? 'sm:flex-row' : 'md:flex-row'} items-center gap-5`}>
        {/* Scannable Canvas QR Frame */}
        <div className="shrink-0 bg-white p-3 rounded-2xl border border-[#D8C9AD] shadow-xs flex flex-col items-center">
          <canvas
            ref={canvasRef}
            aria-label={`Delivery QR Code for ${orderNumber || orderId}`}
            className="rounded-lg block"
            style={{ width: sizePx, height: sizePx }}
          />
          <span className="mt-2 font-mono text-[10px] font-bold text-[#263D30] tracking-wider">
            {orderNumber || orderId}
          </span>
        </div>

        {/* Status & Actions */}
        <div className="flex-1 text-center sm:text-left space-y-2.5 min-w-0">
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                isDelivered
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}
            >
              {isDelivered ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Doorstep Verified & Delivered</span>
                </>
              ) : (
                <>
                  <QrCode className="w-3.5 h-3.5 text-amber-800" />
                  <span>Awaiting Doorstep QR Scan</span>
                </>
              )}
            </span>
          </div>

          <h3 className="font-serif text-base sm:text-lg font-bold text-[#263D30]">
            {title}
          </h3>

          <p className="text-xs text-[#302C26]/75 leading-relaxed">
            {subtitle}
          </p>

          {isDelivered && verifiedAt && (
            <div className="p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-300 text-[11px] text-emerald-950 font-medium">
              Verified Delivered at{' '}
              <strong>{new Date(verifiedAt).toLocaleString('en-IN')}</strong>
              {verifiedBy ? ` · Partner: ${verifiedBy}` : ''}
            </div>
          )}

          <div className="text-[10px] font-mono text-[#302C26]/65 bg-[#F8F4EC] px-2.5 py-1.5 rounded-lg border border-[#D8C9AD]/70 truncate">
            QR Token: <strong>{qrToken}</strong>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 bg-[#263D30] hover:bg-[#1A2B22] text-[#FAF6EE] rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#C2A36C]" />
              <span>Save QR</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 bg-[#FAF6EE] hover:bg-[#F3EDE1] text-[#263D30] border border-[#D8C9AD] rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Copied' : 'Copy Verify Link'}</span>
            </button>

            <button
              type="button"
              onClick={openPartnerVerifier}
              className="px-3 py-1.5 bg-[#C2A36C]/25 hover:bg-[#C2A36C]/40 text-[#263D30] border border-[#C2A36C]/60 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ScanLine className="w-3.5 h-3.5 text-[#A34F37]" />
              <span>{isDelivered ? 'View Verification Receipt' : 'Partner QR Verify'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
