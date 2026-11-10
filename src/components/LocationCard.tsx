import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Phone, 
  ExternalLink, 
  Copy, 
  Check, 
  Compass, 
  Store,
  Sparkles
} from 'lucide-react';

export interface LocationCardProps {
  className?: string;
  variant?: 'card' | 'compact' | 'banner';
  showHours?: boolean;
  showPhone?: boolean;
  showMapEmbed?: boolean;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  className = '',
  variant = 'card',
  showHours = true,
  showPhone = true,
  showMapEmbed = false
}) => {
  const [copied, setCopied] = useState(false);

  const shopName = 'DUGDHSAR Physical Retail Dairy Counter';
  const streetAddress = 'Barghat Rd, Sanjay Vihar Colony, Sufi Nagar';
  const cityStateZip = 'Seoni, Madhya Pradesh 480661';
  const fullAddress = '3HP5+948, Barghat Rd, Sanjay Vihar Colony, Sufi Nagar, Seoni, Madhya Pradesh 480661';
  const plusCode = '3HP5+948, Seoni, MP';
  const phone = '+91 7067672604';

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`;
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  const handleCopyAddress = (e: React.MouseEvent) => {
    e.preventDefault();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(fullAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`bg-[#263D30] text-[#FAF6EE] p-5 rounded-2xl border border-[#D8C9AD]/40 shadow-md ${className}`}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C2A36C] text-[#263D30] flex items-center justify-center shrink-0 shadow-xs">
            <Store className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C2A36C]">
                Sanjay Vihar Colony · Seoni
              </span>
            </div>
            <h4 className="font-serif font-bold text-sm text-white truncate">
              {shopName}
            </h4>
            <p className="text-xs text-[#FAF6EE]/80 mt-1 leading-snug">
              {streetAddress}, {cityStateZip}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/15 flex items-center gap-2">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 px-3 bg-[#C2A36C] hover:bg-[#d8b87d] text-[#263D30] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5 fill-[#263D30]" />
            <span>Get Directions</span>
          </a>
          <button
            type="button"
            onClick={handleCopyAddress}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-[#FAF6EE] border border-white/20 rounded-xl transition-colors cursor-pointer"
            title="Copy Address"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#FAF6EE] rounded-3xl border-2 border-[#D8C9AD] shadow-md overflow-hidden ${className}`}>
      {/* Top Banner / Badge */}
      <div className="bg-[#263D30] px-6 py-4 text-[#FAF6EE] flex flex-wrap items-center justify-between gap-3 border-b border-[#3A5243]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#C2A36C] text-[#263D30] flex items-center justify-center shrink-0 shadow-xs">
            <MapPin className="w-5 h-5 text-[#263D30]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#C2A36C]">
                Official Retail Store
              </span>
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-white leading-tight">
              Physical Shop Location
            </h3>
          </div>
        </div>

        <span className="text-[11px] font-mono font-semibold bg-[#1F2F26] text-[#C2A36C] px-3 py-1 rounded-full border border-[#3A5243]">
          Plus Code: {plusCode}
        </span>
      </div>

      {/* Main Body */}
      <div className="p-6 sm:p-7 space-y-5">
        {/* Address Card Block */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D8C9AD] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A34F37] block">
              Store Address
            </span>
            <p className="font-serif text-base sm:text-lg font-bold text-[#263D30] leading-snug">
              {streetAddress}
            </p>
            <p className="text-xs text-[#302C26]/80 font-medium">
              {cityStateZip} (Plus Code: {plusCode})
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyAddress}
            className="px-3 py-1.5 bg-[#FAF6EE] hover:bg-[#F3EDE1] text-[#263D30] border border-[#D8C9AD] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            title="Copy address to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#A34F37]" />
                <span>Copy Address</span>
              </>
            )}
          </button>
        </div>

        {/* Operating Hours & Hotline Grid */}
        {(showHours || showPhone) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            {showHours && (
              <div className="bg-[#F8F4EC] p-3.5 rounded-xl border border-[#D8C9AD]/70 flex items-start gap-3">
                <Clock className="w-4 h-4 text-[#C2A36C] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#263D30] block text-xs font-bold">Counter Timings</strong>
                  <p className="text-[#302C26]/80 text-[11px] mt-0.5">
                    Morning: <strong>5:00 AM – 10:00 AM</strong>
                  </p>
                  <p className="text-[#302C26]/80 text-[11px]">
                    Evening: <strong>6:00 PM – 10:00 PM</strong>
                  </p>
                  <span className="inline-block mt-1 text-[10px] text-emerald-800 font-bold bg-emerald-100/70 px-2 py-0.2 rounded">
                    Open All 7 Days
                  </span>
                </div>
              </div>
            )}

            {showPhone && (
              <div className="bg-[#F8F4EC] p-3.5 rounded-xl border border-[#D8C9AD]/70 flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#C2A36C] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#263D30] block text-xs font-bold">Direct Store Care & WhatsApp</strong>
                  <a
                    href="tel:7067672604"
                    className="font-mono font-bold text-[#A34F37] hover:text-[#853C26] text-sm block mt-0.5"
                  >
                    {phone}
                  </a>
                  <a
                    href={`https://wa.me/917067672604?text=${encodeURIComponent('Hello DugdhSar, I am navigating to your shop at Sanjay Vihar Colony, Seoni.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-emerald-800 font-semibold hover:underline block mt-0.5"
                  >
                    Chat on WhatsApp →
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Optional Map Iframe Embed */}
        {showMapEmbed && (
          <div className="w-full h-64 sm:h-72 rounded-2xl overflow-hidden border border-[#D8C9AD] relative bg-[#EBE2D0]">
            <iframe
              title="DUGDHSAR Physical Shop Location Seoni MP"
              src="https://maps.google.com/maps?q=3HP5%2B948%2C%20Barghat%20Rd%2C%20Sanjay%20Vihar%20Colony%2C%20Sufi%20Nagar%2C%20Seoni%2C%20Madhya%20Pradesh%20480661&t=&z=16&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />
          </div>
        )}

        {/* HIGH-CONTRAST ACTION ROW */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          {/* HIGH-CONTRAST 'Get Directions' Button */}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:flex-1 py-3.5 px-6 bg-[#C2A36C] hover:bg-[#d4b476] text-[#1F3327] font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer border-2 border-[#A87520]/40 group"
          >
            <Navigation className="w-4 h-4 fill-[#1F3327] text-[#1F3327] group-hover:rotate-12 transition-transform" />
            <span>Get Directions in Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-75" />
          </a>

          {/* Secondary Maps App Button */}
          <a
            href={mapsSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto py-3.5 px-5 bg-[#263D30] hover:bg-[#1A2B22] text-[#FAF6EE] font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border border-[#C2A36C]/30 shrink-0"
          >
            <Compass className="w-4 h-4 text-[#C2A36C]" />
            <span>Open Maps App</span>
          </a>
        </div>
      </div>
    </div>
  );
};
