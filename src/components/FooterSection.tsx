import React from 'react';
import { useRouter } from '../router/RouterContext';
import { siteConfig, isPlaceholderValue } from '../config/site';
import { PhoneCall, MapPin, Mail, ShieldCheck } from 'lucide-react';

export const FooterSection: React.FC = () => {
  const { navigate } = useRouter();

  const handleLinkClick = (path: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    navigate(path);
  };

  const phoneIsPlaceholder = isPlaceholderValue(siteConfig.contact.phone);
  const emailIsPlaceholder = isPlaceholderValue(siteConfig.contact.email);
  const whatsappIsPlaceholder = isPlaceholderValue(siteConfig.contact.whatsapp);
  const cleanPhoneHref = siteConfig.contact.phone.replace(/[^+\d]/g, '');
  const cleanWhatsappHref = siteConfig.contact.whatsapp.replace(/\D/g, '');
  const currentYear = new Date().getFullYear();

  return (
    <footer
      id="footer-section"
      className="bg-[#263D30] text-[#F3EDE1] pt-14 pb-12 border-t border-[#3A5243] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start pb-10 border-b border-[#3A5243]">
          {/* Column 1: Business Identity & Contact Details */}
          <div className="md:col-span-5 space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#C2A36C]">
                {siteConfig.tagline}
              </p>
              <h2 className="text-lg font-serif font-bold text-white tracking-wide mt-1">
                {siteConfig.name}
              </h2>
              <p className="text-xs text-[#F3EDE1]/75 mt-0.5">
                Legal Entity: {siteConfig.legalName}
              </p>
            </div>

            <div className="space-y-2 text-xs text-[#F3EDE1]/90">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#C2A36C] shrink-0 mt-0.5" />
                <span>{siteConfig.location.fullAddress}</span>
              </div>

              <div className="flex items-center gap-2 font-mono">
                <PhoneCall className="w-4 h-4 text-[#C2A36C] shrink-0" />
                {phoneIsPlaceholder ? (
                  <span>{siteConfig.contact.phoneFormatted}</span>
                ) : (
                  <a
                    href={`tel:${cleanPhoneHref}`}
                    className="hover:text-[#C2A36C] transition-colors"
                  >
                    {siteConfig.contact.phoneFormatted}
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#C2A36C] shrink-0" />
                {emailIsPlaceholder ? (
                  <span>{siteConfig.contact.email}</span>
                ) : (
                  <a
                    href={`mailto:${siteConfig.contact.email}`}
                    className="hover:text-[#C2A36C] transition-colors"
                  >
                    {siteConfig.contact.email}
                  </a>
                )}
              </div>
            </div>

            <p className="text-xs text-[#F3EDE1]/75 leading-relaxed max-w-md">
              Local A2 milk and dairy delivery across {siteConfig.business.deliveryArea}. Morning
              window: <strong>{siteConfig.business.morningHours}</strong>; Evening window:{' '}
              <strong>{siteConfig.business.eveningHours}</strong>.
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-4 text-xs font-semibold">
              <a
                href="/store-locator"
                onClick={handleLinkClick('/store-locator')}
                className="text-[#C2A36C] hover:underline"
              >
                Delivery Zones & Store Info →
              </a>

              {!whatsappIsPlaceholder && (
                <a
                  href={`https://wa.me/${cleanWhatsappHref}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-300 hover:underline"
                >
                  WhatsApp Support
                </a>
              )}
            </div>
          </div>

          {/* Column 2: FSSAI Registration & Quick Navigation */}
          <div className="md:col-span-3 space-y-4 text-xs text-[#F3EDE1]/85">
            <div className="p-3 rounded-xl bg-[#1F2F26] border border-[#3A5243] space-y-1.5">
              <div className="flex items-center gap-2 text-[#C2A36C] font-semibold">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Food Safety Registration</span>
              </div>
              <p className="text-[11px] font-mono text-[#FAF6EE]">
                FSSAI License No.: {siteConfig.business.fssaiLicense}
              </p>
            </div>

            <nav aria-label="Quick links" className="flex flex-col space-y-1.5 font-medium">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#C2A36C] mb-1">
                Explore
              </p>
              <a
                href="/"
                onClick={handleLinkClick('/')}
                className="hover:text-[#C2A36C] transition-colors"
              >
                Home
              </a>
              <a
                href="/products"
                onClick={handleLinkClick('/products')}
                className="hover:text-[#C2A36C] transition-colors"
              >
                Products & Subscriptions
              </a>
              <a
                href="/faq"
                onClick={handleLinkClick('/faq')}
                className="hover:text-[#C2A36C] transition-colors"
              >
                FAQ
              </a>
              <a
                href="/contact"
                onClick={handleLinkClick('/contact')}
                className="hover:text-[#C2A36C] transition-colors"
              >
                Contact Us
              </a>
            </nav>
          </div>

          {/* Column 3: Legal & Policy Links (Real crawlable <a> tags) */}
          <div className="md:col-span-4 flex flex-col justify-between items-start md:items-end space-y-4">
            <nav
              aria-label="Legal and policy links"
              className="flex flex-col md:text-right space-y-2 text-xs font-semibold text-[#F3EDE1]/90"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#C2A36C] mb-0.5">
                Policies & Legal
              </p>
              <a
                href="/privacy-policy"
                onClick={handleLinkClick('/privacy-policy')}
                className="hover:text-[#C2A36C] transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/terms-and-conditions"
                onClick={handleLinkClick('/terms-and-conditions')}
                className="hover:text-[#C2A36C] transition-colors"
              >
                Terms & Conditions
              </a>
              <a
                href="/cancellation-refund"
                onClick={handleLinkClick('/cancellation-refund')}
                className="hover:text-[#C2A36C] transition-colors"
              >
                Cancellation & Refund Policy
              </a>
              <a
                href="/shipping-policy"
                onClick={handleLinkClick('/shipping-policy')}
                className="hover:text-[#C2A36C] transition-colors"
              >
                Shipping & Delivery Policy
              </a>
              <a
                href="/return-policy"
                onClick={handleLinkClick('/return-policy')}
                className="hover:text-[#C2A36C] transition-colors"
              >
                Bottle Return Policy
              </a>
              <div className="pt-2 border-t border-[#3A5243]/70 flex flex-col space-y-1.5">
                <a
                  href="/dealer/login"
                  onClick={handleLinkClick('/dealer/login')}
                  className="text-[#C2A36C] hover:underline"
                >
                  B2B Dealer Portal →
                </a>
                <a
                  href="/admin/login"
                  onClick={handleLinkClick('/admin/login')}
                  className="text-[#F3EDE1]/65 hover:text-white transition-colors"
                >
                  Staff Admin Login
                </a>
              </div>
            </nav>

            <div className="flex items-center space-x-2 pt-2">
              <div className="text-right">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#C2A36C] block">
                  Seoni, Madhya Pradesh
                </span>
                <span className="text-sm font-serif font-bold text-white tracking-wider block">
                  {siteConfig.name}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full border border-[#3A5243] p-0.5 bg-[#1F2F26]">
                <img
                  src="/assets/aistudio/1000095715-clean_c92aa3a9.png"
                  alt={siteConfig.name}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-[#F3EDE1]/65">
          <p>
            © {currentYear} {siteConfig.name} ({siteConfig.legalName}). All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="/privacy-policy"
              onClick={handleLinkClick('/privacy-policy')}
              className="hover:text-[#C2A36C] underline"
            >
              Privacy Policy
            </a>
            <a
              href="/terms-and-conditions"
              onClick={handleLinkClick('/terms-and-conditions')}
              className="hover:text-[#C2A36C] underline"
            >
              Terms & Conditions
            </a>
            <a
              href="/cancellation-refund"
              onClick={handleLinkClick('/cancellation-refund')}
              className="hover:text-[#C2A36C] underline"
            >
              Cancellation & Refund
            </a>
            <a
              href="/shipping-policy"
              onClick={handleLinkClick('/shipping-policy')}
              className="hover:text-[#C2A36C] underline"
            >
              Shipping Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
