import React, { useState } from 'react';
import { MapPin, Phone, Clock, Navigation } from 'lucide-react';
import { siteConfig } from '../../config/site';
import {
  GAUSHALA_FARM_LOCATION,
  getCleanTelHref,
  getCleanWhatsappDigits,
  getShopCoordinatesLabel,
  getShopDirectionsUrl,
  getShopMapEmbedUrl,
  hasText,
} from '../../config/siteHelpers';

interface StoreLocationItem {
  id: string;
  city: string;
  tag: 'seoni' | 'farm';
  name: string;
  address: string;
  coordinatesLabel?: string;
  pinBadge?: string;
  phone: string;
  hours: string;
  type: string;
  directionsUrl: string;
  featured: boolean;
}

export const StoreLocatorPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('all');

  const coordsLabel = getShopCoordinatesLabel();
  const shopDirectionsUrl = getShopDirectionsUrl();
  const shopEmbedUrl = getShopMapEmbedUrl(17);
  const telHref = getCleanTelHref();
  const whatsappDigits = getCleanWhatsappDigits();
  const phoneDisplay = siteConfig.contact.phoneFormatted;
  const showPhone = hasText(phoneDisplay);
  const hoursSummary = `Morning: ${siteConfig.business.morningHours} | Evening: ${siteConfig.business.eveningHours} (Daily · All 7 Days)`;

  const locations: StoreLocationItem[] = [
    {
      id: 'seoni-shop',
      city: 'seoni',
      tag: 'seoni',
      name: `${siteConfig.name} Dairy (Physical Retail Shop — ${siteConfig.location.city})`,
      address: siteConfig.location.fullAddress,
      coordinatesLabel: siteConfig.location.coordinatesDms
        ? `${siteConfig.location.coordinatesDms} (${coordsLabel})`
        : coordsLabel,
      pinBadge: 'Exact Shop Pin',
      phone: phoneDisplay,
      hours: hoursSummary,
      type: 'Flagship Retail Store & Fresh Milk Counter',
      directionsUrl: shopDirectionsUrl,
      featured: true,
    },
    {
      id: GAUSHALA_FARM_LOCATION.id,
      city: 'sukla',
      tag: 'farm',
      name: GAUSHALA_FARM_LOCATION.name,
      address: GAUSHALA_FARM_LOCATION.address,
      coordinatesLabel: `Plus Code: ${GAUSHALA_FARM_LOCATION.plusCode} (Sukla Farm — separate from Seoni Shop)`,
      pinBadge: 'Farm / Gaushala',
      phone: phoneDisplay,
      hours: hoursSummary,
      type: GAUSHALA_FARM_LOCATION.type,
      directionsUrl: GAUSHALA_FARM_LOCATION.directionsUrl,
      featured: true,
    },
  ];

  const filtered =
    activeFilter === 'all'
      ? locations
      : locations.filter((l) => l.tag === activeFilter || l.city === activeFilter);

  return (
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs uppercase tracking-[0.25em] text-[#A34F37] font-semibold mb-2">
            Physical Presence · {siteConfig.business.deliveryArea}
          </p>
          <h1 className="text-4xl sm:text-5xl font-serif text-[#263D30] font-normal mb-4">
            Visit {siteConfig.name} Physical Locations
          </h1>
          <p className="text-sm text-[#302C26]/80 leading-relaxed">
            Visit our retail dairy counter in {siteConfig.location.city} or our separate Gaushala sanctuary &amp; farm in Sukla, MP. Taste freshly churned Bilona Makhan, collect farm-fresh glass bottles, or order daily doorstep delivery.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {[
            { id: 'all', label: 'All Locations' },
            { id: 'seoni', label: 'Seoni Retail Shop' },
            { id: 'farm', label: 'Sukla Farm & Gaushala (Separate)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-[#263D30] text-[#FAF6EE] shadow-sm'
                  : 'bg-[#FAF6EE] text-[#302C26] border border-[#D8C9AD] hover:bg-[#F8F4EC]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Locations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((loc) => (
            <div
              key={loc.id}
              className="bg-[#FAF6EE] p-6 sm:p-8 rounded-2xl border-2 border-[#D8C9AD] hover:border-[#263D30] transition-all shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-block bg-[#F8F4EC] text-[#A34F37] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border border-[#A34F37]/20">
                    {loc.type}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                    Open All 7 Days
                  </span>
                </div>

                <h3 className="font-serif text-2xl text-[#263D30] font-bold mb-3">
                  {loc.name}
                </h3>

                <div className="space-y-3.5 text-xs text-[#302C26]/85 mb-6">
                  {hasText(loc.address) && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-[#A34F37] shrink-0 mt-0.5" />
                      <span className="font-medium leading-relaxed">{loc.address}</span>
                    </div>
                  )}

                  {showPhone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-[#A34F37] shrink-0" />
                      {telHref ? (
                        <a
                          href={`tel:${telHref}`}
                          className="font-mono font-bold text-[#263D30] hover:text-[#A34F37]"
                        >
                          {loc.phone}
                        </a>
                      ) : (
                        <span className="font-mono font-bold text-[#263D30]">{loc.phone}</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-[#A34F37] shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">{loc.hours}</span>
                  </div>

                  {loc.coordinatesLabel && (
                    <div className="flex items-center gap-2.5 bg-[#263D30]/5 px-3 py-2 rounded-xl border border-[#263D30]/15">
                      <Navigation className="w-3.5 h-3.5 text-[#263D30] shrink-0" />
                      <div className="flex flex-wrap items-center justify-between w-full gap-2">
                        <span className="font-mono text-[11px] font-bold text-[#263D30]">
                          {loc.coordinatesLabel}
                        </span>
                        {loc.pinBadge && (
                          <span className="text-[10px] uppercase font-bold text-[#A34F37] bg-[#A34F37]/10 px-2 py-0.5 rounded">
                            {loc.pinBadge}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[#D8C9AD]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <a
                  href={loc.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#263D30] hover:text-[#A34F37] transition-colors"
                >
                  <Navigation className="w-4 h-4 text-[#A34F37]" />
                  <span>Get Driving Directions on Google Maps</span>
                </a>

                {whatsappDigits && (
                  <a
                    href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
                      `Hello ${siteConfig.name}, I want to visit ${loc.name}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-emerald-800 hover:underline"
                  >
                    WhatsApp Depot →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Google Map Embed (Pinned strictly to siteConfig.location lat/lng) */}
        <div className="mt-12 bg-[#FAF6EE] p-6 sm:p-8 rounded-2xl border-2 border-[#D8C9AD] shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#A34F37] tracking-wider">
                Live Geolocation &amp; Driving Map · Seoni Retail Shop
              </span>
              <h2 className="text-xl sm:text-2xl font-serif text-[#263D30] font-bold">
                {siteConfig.name} Retail Shop Exact Location
              </h2>
              <p className="text-xs text-[#302C26]/75 mt-0.5 font-mono">
                GPS: {coordsLabel}
                {hasText(siteConfig.location.fullAddress) ? ` · ${siteConfig.location.fullAddress}` : ''}
              </p>
            </div>
            <a
              href={shopDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#263D30] hover:bg-[#1a2b22] text-[#FAF6EE] text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-xs shrink-0"
            >
              <Navigation className="w-3.5 h-3.5 text-[#C2A36C]" />
              <span>Navigate in Google Maps</span>
            </a>
          </div>

          <div className="w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-[#D8C9AD]">
            <iframe
              title={`${siteConfig.name} Dairy Exact Location Pin`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={shopEmbedUrl}
            />
          </div>
        </div>

        {/* Local Delivery Callout */}
        <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-[#263D30] text-[#FAF6EE] border border-[#C2A36C]/40 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
          <div>
            <h3 className="text-xl font-serif text-[#C2A36C] font-bold">
              Doorstep Delivery Across {siteConfig.business.deliveryArea}
            </h3>
            <p className="text-xs text-[#FAF6EE]/80 mt-1 max-w-xl">
              Fresh unadulterated Gir Cow A2 Milk delivered twice daily: Morning{' '}
              {siteConfig.business.morningHours} &amp; Evening {siteConfig.business.eveningHours}.
              {showPhone ? (
                <>
                  {' '}
                  Call or WhatsApp <strong>{phoneDisplay}</strong> to start your daily subscription.
                </>
              ) : null}
            </p>
          </div>

          {showPhone && telHref && (
            <a
              href={`tel:${telHref}`}
              className="bg-[#A34F37] hover:bg-[#853C26] text-[#FAF6EE] px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shrink-0 shadow-sm"
            >
              Call {phoneDisplay}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
