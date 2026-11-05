import React from 'react';
import { MapPin, Navigation, Phone, Clock, ExternalLink, ShieldCheck } from 'lucide-react';

export const ShopMapSection: React.FC = () => {
  const shopAddress = '3HP5+948, Barghat Rd, Sanjay Vihar Colony, Sufi Nagar, Seoni, Madhya Pradesh 480661';
  const directionsUrl = 'https://www.google.com/maps/dir/?api=1&destination=3HP5%2B948%2C+Barghat+Rd%2C+Sanjay+Vihar+Colony%2C+Sufi+Nagar%2C+Seoni%2C+Madhya+Pradesh+480661';
  const mapsSearchUrl = 'https://www.google.com/maps/search/?api=1&query=3HP5%2B948%2C+Barghat+Rd%2C+Sanjay+Vihar+Colony%2C+Sufi+Nagar%2C+Seoni%2C+Madhya+Pradesh+480661';

  return (
    <section id="shop-location" className="py-14 sm:py-20 bg-[#F8F4EC] relative border-t border-[#D8C9AD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C2A36C]/20 border border-[#C2A36C]/40 text-[#263D30] text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-[#C2A36C] animate-pulse" />
            <span>Physical Store & Dairy Counter</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-serif text-[#263D30] font-black uppercase tracking-tight">
            Visit DugdhSar Shop in Seoni
          </h2>
          <p className="text-xs sm:text-sm text-[#302C26]/75 mt-1">
            Fresh unadulterated Gir Cow A2 milk bottles, wood-churned Bilona Ghee, curd & fresh paneer available directly at our retail counter.
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
                DUGDHSAR Dairy Counter
              </h3>

              <div className="space-y-4 pt-2 text-xs text-[#FAF6EE]/85">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#C2A36C] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-sans">Official Shop Address</strong>
                    <p className="font-sans leading-relaxed text-[#FAF6EE]/90">
                      3HP5+948, Barghat Rd, Sanjay Vihar Colony, Sufi Nagar, Seoni, Madhya Pradesh 480661
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-[#C2A36C]">
                      Plus Code: 3HP5+948 Seoni
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#C2A36C] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-sans">Counter & Dispatch Hours</strong>
                    <p>Morning: 05:00 AM – 10:00 AM</p>
                    <p>Evening: 06:00 PM – 10:00 PM</p>
                    <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">
                      ✓ Open 7 Days / Complete Week
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#C2A36C] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-sans">Counter Hotline & WhatsApp</strong>
                    <a href="tel:7067672604" className="font-mono font-bold text-white hover:text-[#C2A36C] block text-sm">
                      +91 7067672604
                    </a>
                  </div>
                </div>
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

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={mapsSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 bg-white/10 hover:bg-white/20 text-[#FAF6EE] rounded-xl text-[11px] font-semibold text-center border border-white/20 transition-all flex items-center justify-center gap-1"
                >
                  <span>Open in Maps App</span>
                  <ExternalLink className="w-3 h-3 text-[#C2A36C]" />
                </a>

                <a
                  href="https://wa.me/917067672604?text=Hello%20Dugdhsar%2C%20I%20want%20to%20visit%20your%20dairy%20shop%20at%20Barghat%20Rd%2C%20Seoni."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 bg-emerald-700/80 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-semibold text-center transition-all flex items-center justify-center gap-1"
                >
                  <span>WhatsApp Shop</span>
                </a>
              </div>
            </div>

          </div>

          {/* Right Live Interactive Google Map Frame */}
          <div className="lg:col-span-7 h-[360px] sm:h-[420px] lg:h-auto min-h-[360px] relative bg-[#EBE2D0]">
            <iframe
              title="DUGDHSAR Dairy Physical Shop Location - Barghat Rd, Seoni"
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

        </div>

      </div>
    </section>
  );
};
