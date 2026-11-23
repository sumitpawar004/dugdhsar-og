import React from 'react';
import { MapPin, Navigation, Phone, Clock, ExternalLink } from 'lucide-react';
import { siteConfig } from '../config/site';
import {
  getCleanTelHref,
  getCleanWhatsappDigits,
  getShopCoordinatesLabel,
  getShopDirectionsUrl,
  getShopMapEmbedUrl,
  getShopMapsSearchUrl,
  hasRealValue,
  hasText,
} from '../config/siteHelpers';

export const ShopMapSection: React.FC = () => {
  const directionsUrl = getShopDirectionsUrl();
  const mapsSearchUrl = getShopMapsSearchUrl();
  const embedUrl = getShopMapEmbedUrl(17);
  const coordsLabel = getShopCoordinatesLabel();
  const showAddress = hasText(siteConfig.location.fullAddress);
  const showPlusCode = hasRealValue(siteConfig.location.plusCode);
  const showPhone = hasText(siteConfig.contact.phoneFormatted);
  const telHref = getCleanTelHref();
  const whatsappDigits = getCleanWhatsappDigits();

  return (
    <section id="shop-location" className="py-14 sm:py-20 bg-[#F8F4EC] relative border-t border-[#D8C9AD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C2A36C]/20 border border-[#C2A36C]/40 text-[#263D30] text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-[#C2A36C] animate-pulse" />
            <span>Physical Store &amp; Dairy Counter</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-serif text-[#263D30] font-black uppercase tracking-tight">
            Visit {siteConfig.name} Shop in {siteConfig.location.city}
          </h2>
          <p className="text-xs sm:text-sm text-[#302C26]/75 mt-1">
            Fresh unadulterated Gir Cow A2 milk bottles, wood-churned Bilona Ghee, curd &amp; fresh paneer available directly at our retail counter.
          </p>
        </div>

        {/* Map & Direction Split Card */}
        <div className="bg-[#FAF6EE] rounded-3xl border-2 border-[#D8C9AD] shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Details Panel */}
          <div className="lg:col-span-5 p-6 sm:p-8 bg-[#263D30] text-[#FAF6EE] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C2A36C] block">
                Flagship Dairy Store
              </span>
              <h3 className="text-2xl font-serif font-bold text-white leading-tight">
                {siteConfig.name} Dairy Counter
              </h3>

              <div className="space-y-4 pt-2 text-xs text-[#FAF6EE]/85">
                {showAddress && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#C2A36C] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-sans">Official Shop Address</strong>
                      <p className="font-sans leading-relaxed text-[#FAF6EE]/90">
                        {siteConfig.location.fullAddress}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-[#C2A36C]">
                        GPS: {coordsLabel}
                        {showPlusCode ? ` · ${siteConfig.location.plusCode}` : ''}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#C2A36C] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-sans">Counter &amp; Dispatch Hours</strong>
                    {hasText(siteConfig.business.morningHours) && (
                      <p>Morning: {siteConfig.business.morningHours}</p>
                    )}
                    {hasText(siteConfig.business.eveningHours) && (
                      <p>Evening: {siteConfig.business.eveningHours}</p>
                    )}
                    <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">
                      ✓ Open 7 Days / Complete Week
                    </span>
                  </div>
                </div>

                {showPhone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-[#C2A36C] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-sans">Counter Hotline &amp; WhatsApp</strong>
                      {telHref ? (
                        <a
                          href={`tel:${telHref}`}
                          className="font-mono font-bold text-white hover:text-[#C2A36C] block text-sm"
                        >
                          {siteConfig.contact.phoneFormatted}
                        </a>
                      ) : (
                        <span className="font-mono font-bold text-white block text-sm">
                          {siteConfig.contact.phoneFormatted}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Direct CTAs */}
            <div className="pt-4 border-t border-white/15 space-y-2.5">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                <Navigation className="w-4 h-4" />
                <span>Get Driving Directions on Google Maps</span>
              </a>

              <div className={`grid ${whatsappDigits ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                <a
                  href={mapsSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 bg-white/10 hover:bg-white/20 text-[#FAF6EE] rounded-xl text-[11px] font-semibold text-center border border-white/20 transition-all flex items-center justify-center gap-1"
                >
                  <span>Open in Maps App</span>
                  <ExternalLink className="w-3 h-3 text-[#C2A36C]" />
                </a>

                {whatsappDigits && (
                  <a
                    href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
                      `Hello ${siteConfig.name}, I want to visit your dairy shop in ${siteConfig.location.city}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 bg-emerald-700/80 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-semibold text-center transition-all flex items-center justify-center gap-1"
                  >
                    <span>WhatsApp Shop</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right Live Interactive Google Map Frame (pinned strictly to siteConfig.location lat/lng) */}
          <div className="lg:col-span-7 h-[360px] sm:h-[420px] lg:h-auto min-h-[360px] relative bg-[#EBE2D0]">
            <iframe
              title={`${siteConfig.name} Dairy Physical Shop Location - ${siteConfig.location.city}`}
              src={embedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
