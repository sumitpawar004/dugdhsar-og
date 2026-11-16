import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/RouterContext';
import { parseQrPayload } from '../../lib/qrCode';
import { formatPaise } from '../../types';
import {
  QrCode,
  Camera,
  CameraOff,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShieldCheck,
  MapPin,
  Package,
  Clock,
  ArrowLeft,
  UserCheck,
  Sparkles
} from 'lucide-react';

export const DeliveryVerifyPage: React.FC = () => {
  const { searchParams, navigate } = useRouter();
  const { currentUser, verifyDeliveryByQr, getOrderForQrVerify } = useStore();

  const [orderIdInput, setOrderIdInput] = useState(() => searchParams.get('orderId') || '');
  const [tokenInput, setTokenInput] = useState(() => searchParams.get('token') || '');
  const [deliveryDateInput, setDeliveryDateInput] = useState(() => searchParams.get('date') || '');
  const [qrRawText, setQrRawText] = useState('');
  const [partnerName, setPartnerName] = useState(() =>
    currentUser.email ? currentUser.fullName : 'Dugdhsar Cold-Chain Partner'
  );

  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    success: boolean;
    alreadyDelivered?: boolean;
    message: string;
    verifiedAt?: string;
    partner?: string;
  } | null>(null);

  // Camera scanner state
  const [isScanningCamera, setIsScanningCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanRafRef = useRef<number | null>(null);

  // Sync URL query params whenever they change
  useEffect(() => {
    const qOrderId = searchParams.get('orderId');
    const qToken = searchParams.get('token');
    const qDate = searchParams.get('date');
    if (qOrderId) setOrderIdInput(qOrderId);
    if (qToken) setTokenInput(qToken);
    if (qDate) setDeliveryDateInput(qDate);
  }, [searchParams]);

  const stopCamera = useCallback(() => {
    if (scanRafRef.current !== null) {
      cancelAnimationFrame(scanRafRef.current);
      scanRafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanningCamera(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const applyScannedPayload = useCallback((rawText: string) => {
    const parsed = parseQrPayload(rawText);
    if (parsed) {
      setOrderIdInput(parsed.orderId);
      setTokenInput(parsed.token);
      if (parsed.deliveryDate) setDeliveryDateInput(parsed.deliveryDate);
      setQrRawText('');
      setVerifyResult(null);
      return true;
    }
    return false;
  }, []);

  const handleStartCamera = async () => {
    setCameraError(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported in this browser. Paste the QR verification link below instead.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      });
      streamRef.current = stream;
      setIsScanningCamera(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);

      const BarcodeDetectorCtor = (window as any).BarcodeDetector;
      if (!BarcodeDetectorCtor) {
        setCameraError(
          'Live hardware QR decoding is unavailable in this browser. Point your phone native camera at the QR code to open the verification URL automatically, or paste the QR payload below.'
        );
        return;
      }

      const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
      const scanFrame = async () => {
        if (!streamRef.current || !videoRef.current) return;
        try {
          if (videoRef.current.readyState >= 2) {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              const matched = applyScannedPayload(barcodes[0].rawValue);
              if (matched) {
                stopCamera();
                return;
              }
            }
          }
        } catch {
          // ignore frame decode error
        }
        scanRafRef.current = requestAnimationFrame(scanFrame);
      };
      scanRafRef.current = requestAnimationFrame(scanFrame);
    } catch (err: any) {
      setCameraError(err?.message || 'Unable to access camera. Check browser camera permissions.');
      stopCamera();
    }
  };

  const previewMatch = getOrderForQrVerify(orderIdInput.trim(), tokenInput.trim());

  const handleConfirmDelivery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsVerifying(true);
    setVerifyResult(null);

    const res = await verifyDeliveryByQr(orderIdInput, tokenInput, {
      deliveryDate: deliveryDateInput || undefined,
      partnerName: partnerName.trim() || 'Dugdhsar Delivery Partner'
    });

    setIsVerifying(false);
    setVerifyResult({
      success: res.success,
      alreadyDelivered: res.alreadyDelivered,
      message: res.message,
      verifiedAt: res.order?.qrVerifiedAt || res.dailyRecord?.verifiedAt || new Date().toISOString(),
      partner: res.order?.qrVerifiedBy || res.dailyRecord?.verifiedBy || partnerName
    });
  };

  return (
    <div className="bg-[#142019] text-[#F3EDE1] min-h-screen py-10 px-4 sm:px-6 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C2A36C] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to DUGDHSAR</span>
          </button>

          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#263D30] border border-[#3A5243] text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Doorstep QR Handshake</span>
          </span>
        </div>

        {/* Main Card */}
        <div className="bg-[#263D30] border border-[#3A5243] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center border-b border-[#3A5243] pb-5">
            <div className="w-14 h-14 rounded-2xl bg-[#C2A36C] text-[#263D30] flex items-center justify-center mx-auto mb-3 shadow-lg">
              <QrCode className="w-8 h-8" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C2A36C] block">
              DUGDHSAR Cold-Chain Dispatch Verification
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
              Delivery Partner QR Scanner
            </h1>
            <p className="text-xs text-[#F3EDE1]/70 mt-1.5 max-w-md mx-auto">
              Scan the patron&apos;s unique daily delivery QR code at their doorstep to verify arrival and update order status instantly.
            </p>
          </div>

          {/* Live Camera Scanner Controls */}
          <div className="bg-[#1F2F26] rounded-2xl border border-[#3A5243] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#C2A36C]" />
                <span className="text-xs font-bold text-white">Camera QR Scanner</span>
              </div>
              {!isScanningCamera ? (
                <button
                  type="button"
                  onClick={handleStartCamera}
                  className="px-3.5 py-1.5 rounded-xl bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Open Camera Scanner</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-900 hover:bg-rose-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>Stop Camera</span>
                </button>
              )}
            </div>

            {isScanningCamera && (
              <div className="relative rounded-xl overflow-hidden bg-black border border-[#3A5243] aspect-video max-h-64 w-full">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-44 h-44 border-2 border-[#C2A36C] rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
                </div>
              </div>
            )}

            {cameraError && (
              <p className="text-[11px] text-amber-300 bg-amber-950/50 border border-amber-700/60 rounded-xl p-2.5">
                {cameraError}
              </p>
            )}

            {/* Quick Paste QR Link / Payload */}
            <div className="pt-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#F3EDE1]/60 mb-1">
                Or Paste Scanned QR URL / Payload String
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrRawText}
                  onChange={(e) => setQrRawText(e.target.value)}
                  placeholder="https://.../delivery/verify?orderId=...&token=DQR_..."
                  className="flex-1 px-3 py-2 rounded-xl bg-[#142019] border border-[#3A5243] text-xs text-white placeholder-white/30 font-mono focus:outline-none focus:border-[#C2A36C]"
                />
                <button
                  type="button"
                  onClick={() => applyScannedPayload(qrRawText)}
                  className="px-3.5 py-2 rounded-xl bg-[#263D30] hover:bg-[#335140] border border-[#3A5243] text-xs font-bold text-[#C2A36C] cursor-pointer"
                >
                  Decode
                </button>
              </div>
            </div>
          </div>

          {/* Token-Protected Order Preview */}
          {orderIdInput.trim() && (
            <div className="rounded-2xl border border-[#3A5243] bg-[#1F2F26] p-4 space-y-2.5 text-xs">
              {previewMatch && previewMatch.validToken ? (
                previewMatch.type === 'order' && previewMatch.order ? (
                  <>
                    <div className="flex items-center justify-between border-b border-[#3A5243] pb-2">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-[#C2A36C]" />
                        <span className="font-mono font-bold text-white text-sm">
                          {previewMatch.order.orderNumber}
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          previewMatch.order.status === 'delivered'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                            : 'bg-amber-950 text-amber-300 border border-amber-600'
                        }`}
                      >
                        {previewMatch.order.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#F3EDE1]/85">
                      <div>
                        <span className="text-[#C2A36C] font-semibold block">Patron</span>
                        <span>{previewMatch.order.customerName} ({previewMatch.order.customerPhone})</span>
                      </div>
                      <div>
                        <span className="text-[#C2A36C] font-semibold block">Amount & Mode</span>
                        <span className="font-mono">
                          {formatPaise(previewMatch.order.totalPaise)} · {previewMatch.order.paymentMethod.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="text-[11px] text-[#F3EDE1]/75 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#C2A36C] shrink-0 mt-0.5" />
                      <span>
                        {previewMatch.order.deliveryAddress?.flatNo}, {previewMatch.order.deliveryAddress?.apartment},{' '}
                        {previewMatch.order.deliveryAddress?.city} — {previewMatch.order.deliveryPincode}
                      </span>
                    </div>
                  </>
                ) : previewMatch.dailyRecord ? (
                  <>
                    <div className="flex items-center justify-between border-b border-[#3A5243] pb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#C2A36C]" />
                        <span className="font-mono font-bold text-white text-sm">
                          Daily Drop · {previewMatch.dailyRecord.deliveryDate}
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          previewMatch.dailyRecord.status === 'delivered'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                            : 'bg-amber-950 text-amber-300 border border-amber-600'
                        }`}
                      >
                        {previewMatch.dailyRecord.status}
                      </span>
                    </div>
                    {previewMatch.subscription && (
                      <div className="text-[11px] text-[#F3EDE1]/85 space-y-1">
                        <div>
                          <strong className="text-white">{previewMatch.subscription.customerName}</strong> ·{' '}
                          {previewMatch.subscription.productName} ({previewMatch.subscription.quantity} L)
                        </div>
                        <div className="text-[#F3EDE1]/65">{previewMatch.subscription.deliveryAddress}</div>
                      </div>
                    )}
                  </>
                ) : null
              ) : (
                <div className="flex items-center gap-2 text-[11px] text-amber-200/90">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    {previewMatch && !previewMatch.validToken
                      ? 'QR token does not match this order. Customer details stay locked until a valid token is scanned.'
                      : 'Ready to verify against active doorstep order & server dispatch registry.'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Verification Form */}
          <form onSubmit={handleConfirmDelivery} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">
                  Order / Daily Drop ID *
                </label>
                <input
                  type="text"
                  required
                  value={orderIdInput}
                  onChange={(e) => setOrderIdInput(e.target.value)}
                  placeholder="ORD-2026-... or SUB-..."
                  className="w-full px-3 py-2.5 bg-[#142019] border border-[#3A5243] rounded-xl text-white font-mono focus:outline-none focus:border-[#C2A36C]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">
                  Unique QR Security Token *
                </label>
                <input
                  type="text"
                  required
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="DQR_..."
                  className="w-full px-3 py-2.5 bg-[#142019] border border-[#3A5243] rounded-xl text-white font-mono focus:outline-none focus:border-[#C2A36C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#F3EDE1]/80 mb-1">
                Delivery Partner Name
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-[#C2A36C] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder="Delivery partner name"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#142019] border border-[#3A5243] rounded-xl text-white focus:outline-none focus:border-[#C2A36C]"
                />
              </div>
            </div>

            {verifyResult && (
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  verifyResult.success
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-100'
                    : 'bg-rose-950/70 border-rose-500 text-rose-100'
                }`}
              >
                {verifyResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-bold text-sm">
                    {verifyResult.success
                      ? verifyResult.alreadyDelivered
                        ? 'Already Verified'
                        : 'Doorstep Delivery Confirmed!'
                      : 'Verification Rejected'}
                  </div>
                  <p className="text-xs opacity-90">{verifyResult.message}</p>
                  {verifyResult.success && verifyResult.verifiedAt && (
                    <p className="text-[11px] font-mono text-emerald-300 flex items-center gap-1 pt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>
                        Verified at {new Date(verifyResult.verifiedAt).toLocaleString('en-IN')} by {verifyResult.partner}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying || !orderIdInput.trim() || !tokenInput.trim()}
              className="w-full py-3.5 bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Truck className="w-4 h-4" />
              <span>
                {isVerifying
                  ? 'Verifying Doorstep QR Token...'
                  : 'Verify Doorstep Arrival & Mark Delivered'}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
