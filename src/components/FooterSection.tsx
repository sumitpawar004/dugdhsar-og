import React from 'react';
import { useRouter } from '../router/RouterContext';
import { PhoneCall, MapPin, Mail, Clock, ShieldCheck, Heart } from 'lucide-react';

export const FooterSection: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <footer id="footer-section" className="bg-[#263D30] text-[#F3EDE1] pt-16 pb-12 border-t border-[#3A5243] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Split */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start pb-12 border-b border-[#3A5243]">
          
          {/* Left Block: Delivery Hotline & Hours */}
          <div className="md:col-span-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#C2A36C]">
              Fresh Cold-Chain Home Delivery · Seoni, MP
            </h4>

            <div className="space-y-1 text-base font-bold text-white font-mono">
              <div>
                <a href="tel:7067672604" className="hover:text-[#C2A36C] transition-colors flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-[#C2A36C]" />
                  <span>+91 7067672604</span>
                </a>
              </div>
              <div className="text-xs font-normal text-[#F3EDE1]/85 flex items-center gap-2 pt-0.5">
                <Mail className="w-3.5 h-3.5 text-[#C2A36C]" />
                <a href="mailto:support@dugdhsar.in" className="hover:text-white transition-colors">
                  support@dugdhsar.in
                </a>
              </div>
            </div>

            <p className="text-xs text-[#F3EDE1]/75 leading-relaxed max-w-sm">
              Twice daily cold-chain dispatch across Seoni, MP: Morning <strong>05:00 AM – 10:00 AM</strong> & Evening <strong>06:00 PM – 10:00 PM</strong>. Pure unadulterated Gir cow A2 milk delivered every day of the week.
            </p>

            {/* Quick links to stores */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={() => navigate('/store-locator')}
                className="text-xs font-semibold text-[#C2A36C] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Visit Seoni Dairy Store & Farm</span>
                <span>→</span>
              </button>

              <a
                href="https://wa.me/917067672604?text=Hello%20DUGDHSAR%2C%20I%20would%20like%20to%20order%20farm%20fresh%20A2%20milk%20in%20Seoni."
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-emerald-400 hover:underline"
              >
                WhatsApp Order (+91 7067672604)
              </a>
            </div>
          </div>

          {/* Center Block: FSSAI badge & Farm Location */}
          <div className="md:col-span-3 space-y-3 text-xs text-[#F3EDE1]/80">
            {/* FSSAI Official Badge */}
            <div className="flex items-center space-x-2.5">
              <span className="px-2.5 py-1 bg-[#1F2F26] border border-[#3A5243] font-bold text-white text-[11px] tracking-wider uppercase rounded shadow-xs">
                fssai
              </span>
              <span className="text-[10px] font-mono text-[#C2A36C] font-semibold">
                Food Safety Assayed · Pure A2 Dairy
              </span>
            </div>

            <div>
              <strong className="block text-[#FAF6EE] text-xs mb-0.5">Physical Shop (Seoni):</strong>
              <a 
                href="https://www.google.com/maps/dir/?api=1&destination=22.085917,79.55775"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] leading-relaxed text-[#F3EDE1]/75 hover:text-[#C2A36C] transition-colors block"
                title="Get driving directions to 22°05'09.3&quot;N 79°33'27.9&quot;E on Google Maps"
              >
                DUGDHSAR Dairy, Barghat Rd, Sanjay Vihar Colony, Sufi Nagar, Seoni, MP 480661 (GPS: 22°05'09.3"N 79°33'27.9"E) ↗
              </a>
            </div>

            <div className="pt-1">
              <strong className="block text-[#FAF6EE] text-xs mb-0.5">Gaushala Farm Sanctuary:</strong>
              <p className="text-[11px] leading-relaxed text-[#F3EDE1]/75">
                WMJJ+X34, Sukla, Madhya Pradesh 480771
              </p>
            </div>

            <p className="text-[10px] text-[#F3EDE1]/50 pt-2 border-t border-[#3A5243]/60">
              © 1964 - 2026 DUGDHSAR. All rights reserved. Complete Week: 5 AM–10 AM & 6 PM–10 PM.
            </p>
          </div>

          {/* Right Block: Direct Legal & Policy Nav Links */}
          <div className="md:col-span-4 flex flex-col justify-between items-start md:items-end space-y-4">
            
            <div className="flex flex-col md:text-right space-y-1.5 text-xs font-semibold text-[#F3EDE1]/85">
              <button onClick={() => navigate('/privacy-policy')} className="hover:text-[#C2A36C] text-left md:text-right transition-colors cursor-pointer">
                Privacy Policy
              </button>
              <button onClick={() => navigate('/terms-and-conditions')} className="hover:text-[#C2A36C] text-left md:text-right transition-colors cursor-pointer">
                Terms of Use
              </button>
              <button onClick={() => navigate('/shipping-policy')} className="hover:text-[#C2A36C] text-left md:text-right transition-colors cursor-pointer">
                Cold-Chain Shipping Policy
              </button>
              <button onClick={() => navigate('/cancellation-refund')} className="hover:text-[#C2A36C] text-left md:text-right transition-colors cursor-pointer">
                Cancellation & Refund
              </button>
              <button onClick={() => navigate('/return-policy')} className="hover:text-[#C2A36C] text-left md:text-right transition-colors cursor-pointer">
                Return & Replacement
              </button>
              <button onClick={() => navigate('/faq')} className="hover:text-[#C2A36C] text-left md:text-right transition-colors cursor-pointer">
                FAQ & Bottle Returns
              </button>
              <button onClick={() => navigate('/contact')} className="hover:text-[#C2A36C] text-left md:text-right transition-colors cursor-pointer">
                Contact & Farm Tours
              </button>
              <button onClick={() => navigate('/dealer/login')} className="hover:text-[#C2A36C] text-left md:text-right transition-colors cursor-pointer text-[#C2A36C] font-bold">
                B2B Dealer Portal →
              </button>
              <button onClick={() => navigate('/admin/login')} className="hover:text-white text-left md:text-right transition-colors cursor-pointer text-[#F3EDE1]/60">
                Staff Admin Login
              </button>
            </div>

            {/* Logo Lockup */}
            <div className="flex items-center space-x-2 pt-2">
              <div className="text-right">
                <span className="text-[8px] font-bold uppercase tracking-widest text-[#C2A36C] block">
                  HOUSE OF VEDIC HERITAGE
                </span>
                <span className="text-sm font-serif font-bold text-white tracking-wider block">
                  DUGDHSAR
                </span>
              </div>
              <div className="w-10 h-10 rounded-full border border-[#3A5243] p-0.5 bg-[#1F2F26]">
                <img
                  src="/assets/aistudio/1000095715-clean_c92aa3a9.png"
                  alt="DUGDHSAR"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

          </div>

        </div>

      </div>
    </footer>
  );
};
