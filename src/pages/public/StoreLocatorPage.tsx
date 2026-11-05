import React, { useState } from 'react';
import { MapPin, Phone, Clock, Navigation, CheckCircle2, Store } from 'lucide-react';

export const StoreLocatorPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('all');

  const locations = [
    {
      id: 'seoni-shop',
      city: 'seoni',
      tag: 'seoni',
      name: 'DUGDHSAR Dairy (Physical Retail Shop)',
      address: '3HP5+948, Barghat Rd, Sanjay Vihar Colony, Sufi Nagar, Seoni, Madhya Pradesh 480661',
      phone: '+91 7067672604',
      hours: 'Morning: 5:00 AM – 10:00 AM | Evening: 6:00 PM – 10:00 PM (Daily · All 7 Days)',
      type: 'Flagship Retail Store & Fresh Milk Counter',
      mapsQuery: '3HP5+948, Barghat Rd, Sanjay Vihar Colony, Sufi Nagar, Seoni, Madhya Pradesh 480661',
      featured: true
    },
    {
      id: 'sukla-farm',
      city: 'sukla',
      tag: 'farm',
      name: 'DUGDHSAR Gaushala Sanctuary & Farm Hub',
      address: 'WMJJ+X34, Sukla, Madhya Pradesh 480771',
      phone: '+91 7067672604',
      hours: '05:00 AM – 10:00 AM & 06:00 PM – 10:00 PM (Everyday / Complete Week)',
      type: 'Vedic Farm, Sanctuary & Dawn Milking Facility',
      mapsQuery: 'WMJJ+X34, Sukla, Madhya Pradesh 480771',
      featured: true
    }
  ];

  const filtered = activeFilter === 'all' 
    ? locations 
    : locations.filter(l => l.tag === activeFilter || l.city === activeFilter);

  return (
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs uppercase tracking-[0.25em] text-[#A34F37] font-semibold mb-2">
            Physical Presence · Seoni, Madhya Pradesh
          </p>
          <h1 className="text-4xl sm:text-5xl font-serif text-[#263D30] font-normal mb-4">
            Visit DUGDHSAR Physical Locations
          </h1>
          <p className="text-sm text-[#302C26]/80 leading-relaxed">
            Visit our retail dairy counter on Barghat Road, Seoni or our Gaushala sanctuary in Sukla, MP. Taste freshly churned Bilona Makhan, collect farm-fresh glass bottles, or order daily doorstep delivery.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {[
            { id: 'all', label: 'All Locations' },
            { id: 'seoni', label: 'Seoni Retail Store' },
            { id: 'farm', label: 'Sukla Farm & Gaushala' }
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
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-block bg-[#F8F4EC] text-[#A34F37] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border border-[#A34F37]/20">
                    {loc.type}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Open All 7 Days
                  </span>
                </div>

                <h3 className="font-serif text-2xl text-[#263D30] font-bold mb-3">
                  {loc.name}
                </h3>
                
                <div className="space-y-3.5 text-xs text-[#302C26]/85 mb-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#A34F37] shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">{loc.address}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-[#A34F37] shrink-0" />
                    <a href={`tel:${loc.phone}`} className="font-mono font-bold text-[#263D30] hover:text-[#A34F37]">
                      {loc.phone}
                    </a>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-[#A34F37] shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">{loc.hours}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#D8C9AD]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(loc.mapsQuery)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#263D30] hover:text-[#A34F37] transition-colors"
                >
                  <Navigation className="w-4 h-4 text-[#A34F37]" />
                  <span>Get Driving Directions on Google Maps</span>
                </a>

                <a
                  href={`https://wa.me/917067672604?text=Hello%20DUGDHSAR%2C%20I%20want%20to%20visit%20${encodeURIComponent(loc.name)}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-emerald-800 hover:underline"
                >
                  WhatsApp Depot →
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Local Delivery Callout */}
        <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-[#263D30] text-[#FAF6EE] border border-[#C2A36C]/40 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
          <div>
            <h3 className="text-xl font-serif text-[#C2A36C] font-bold">
              Doorstep Delivery Across Seoni, MP
            </h3>
            <p className="text-xs text-[#FAF6EE]/80 mt-1 max-w-xl">
              Fresh unadulterated Gir Cow A2 Milk delivered twice daily: Morning 5:00 AM – 10:00 AM & Evening 6:00 PM – 10:00 PM. Call or WhatsApp <strong>+91 7067672604</strong> to start your daily subscription.
            </p>
          </div>

          <a
            href="tel:7067672604"
            className="bg-[#A34F37] hover:bg-[#853C26] text-[#FAF6EE] px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shrink-0 shadow-sm"
          >
            Call +91 7067672604
          </a>
        </div>

      </div>
    </div>
  );
};
