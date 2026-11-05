import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/RouterContext';
import { Mail, Phone, MapPin, Send, CheckCircle2, Clock, Navigation } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { submitEnquiry } = useStore();
  const { navigate } = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    enquiryType: 'general' as 'general' | 'wholesale' | 'farm_visit' | 'quality_assay',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    submitEnquiry(formData);
    setIsSubmitted(true);
    setFormData({
      name: '',
      email: '',
      phone: '',
      enquiryType: 'general',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-12 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          {/* Breadcrumb */}
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#302C26]/70 mb-4">
            <button 
              onClick={() => navigate('/')}
              className="hover:text-[#A34F37] transition-colors cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <span className="text-[#A34F37] font-bold">Contact Us</span>
          </div>
          <p className="text-xs uppercase tracking-[0.25em] text-[#A34F37] font-semibold mb-2">
            Get In Touch
          </p>
          <h1 className="text-4xl font-serif text-[#263D30] font-normal mb-4">
            Contact DUGDHSAR Heritage Gaushala
          </h1>
          <p className="text-sm text-[#302C26]/80 leading-relaxed">
            Whether inquiring about daily milk delivery subscriptions, wholesale Bilona Ghee institutional orders, or scheduling an Ahimsa farm sanctuary tour.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Details Card */}
          <div className="bg-[#263D30] text-[#F3EDE1] p-8 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-serif text-[#C2A36C] mb-6">Contact & Locations</h3>
              
              <div className="space-y-6 text-xs text-[#F3EDE1]/85">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#C2A36C] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block text-sm">Physical Retail Shop (Seoni)</strong>
                    <p>DUGDHSAR Dairy, 3HP5+948, Barghat Rd, Sanjay Vihar Colony, Sufi Nagar, Seoni, Madhya Pradesh 480661</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#C2A36C] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block text-sm">Vedic Gaushala Sanctuary (Farm)</strong>
                    <p>WMJJ+X34, Sukla, Madhya Pradesh 480771</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#C2A36C] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block text-sm">Customer Care & Official WhatsApp</strong>
                    <a href="tel:7067672604" className="font-mono font-bold text-white hover:text-[#C2A36C] block">
                      +91 7067672604
                    </a>
                    <span className="text-[11px] text-[#C2A36C]">(Open Complete Week · Mon–Sun)</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#C2A36C] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block text-sm">Official Electronic Mail</strong>
                    <a href="mailto:support@dugdhsar.in" className="hover:text-white">
                      support@dugdhsar.in
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#C2A36C] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block text-sm">Daily Store & Delivery Hours</strong>
                    <p>Morning: 5:00 AM – 10:00 AM</p>
                    <p>Evening: 6:00 PM – 10:00 PM</p>
                    <p className="text-[11px] text-[#C2A36C]">Complete week / Every day</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#3A5243] flex items-center gap-2 text-[11px] text-[#F3EDE1]/75">
              <span className="px-2 py-0.5 bg-[#1F2F26] border border-[#3A5243] text-white font-bold text-[10px] rounded uppercase">fssai</span>
              <span>FSSAI Assayed Food Safety & Purity Standards.</span>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2 bg-[#FAF6EE] p-8 sm:p-10 rounded-2xl border border-[#D8C9AD] shadow-sm">
            {isSubmitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-serif text-[#263D30]">Enquiry Received with Gratitude</h3>
                <p className="text-sm text-[#302C26]/75 max-w-md mx-auto">
                  Our dairy concierge team has recorded your enquiry into our central system. A representative will reach out via WhatsApp or phone within 4 business hours.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="mt-4 bg-[#263D30] text-[#F3EDE1] px-6 py-2.5 rounded-lg text-xs font-semibold hover:bg-[#1A2B22] transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="text-xl font-serif text-[#263D30] font-semibold mb-2">Send an Official Message</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#302C26] mb-1">Your Full Name *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Yashodhara Roy"
                      className="w-full px-3.5 py-2.5 text-xs border border-[#D8C9AD] rounded-lg bg-[#F8F4EC] text-[#263D30] focus:outline-none focus:border-[#263D30]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#302C26] mb-1">Email Address *</label>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. yashodhara@example.com"
                      className="w-full px-3.5 py-2.5 text-xs border border-[#D8C9AD] rounded-lg bg-[#F8F4EC] text-[#263D30] focus:outline-none focus:border-[#263D30]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#302C26] mb-1">Phone Number (with WhatsApp)</label>
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 text-xs border border-[#D8C9AD] rounded-lg bg-[#F8F4EC] text-[#263D30] focus:outline-none focus:border-[#263D30]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#302C26] mb-1">Enquiry Purpose</label>
                    <select 
                      value={formData.enquiryType}
                      onChange={(e) => setFormData({ ...formData, enquiryType: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 text-xs border border-[#D8C9AD] rounded-lg bg-[#F8F4EC] text-[#263D30] focus:outline-none focus:border-[#263D30]"
                    >
                      <option value="general">Daily Home Delivery & Subscription</option>
                      <option value="wholesale">Institutional / B2B Ghee Bulk Supply</option>
                      <option value="farm_visit">Weekend Ahimsa Farm Sanctuary Tour</option>
                      <option value="quality_assay">Quality & Purity Inquiry</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#302C26] mb-1">Subject</label>
                  <input 
                    type="text" 
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Brief description of your query"
                    className="w-full px-3.5 py-2.5 text-xs border border-[#D8C9AD] rounded-lg bg-[#F8F4EC] text-[#263D30] focus:outline-none focus:border-[#263D30]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#302C26] mb-1">Message *</label>
                  <textarea 
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Please specify delivery locality/pincode or order requirements..."
                    className="w-full px-3.5 py-2.5 text-xs border border-[#D8C9AD] rounded-lg bg-[#F8F4EC] text-[#263D30] focus:outline-none focus:border-[#263D30]"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[#A34F37] text-white py-3 rounded-lg text-xs font-semibold hover:bg-[#853C26] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Official Enquiry</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Physical Shop Interactive Map & Direct Navigation Section */}
        <div className="mt-12 sm:mt-16 bg-[#FAF6EE] rounded-3xl border-2 border-[#D8C9AD] overflow-hidden shadow-sm">
          <div className="p-6 sm:p-8 bg-[#263D30] text-[#FAF6EE] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C2A36C] animate-pulse" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#C2A36C]">
                  Direct Shop Navigation · Seoni, MP
                </span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-white">
                Visit Our Physical Retail Dairy Counter
              </h2>
              <p className="text-xs text-[#FAF6EE]/80 mt-1 max-w-xl">
                3HP5+948, Barghat Rd, Sanjay Vihar Colony, Sufi Nagar, Seoni, Madhya Pradesh 480661 · Morning: 5–10 AM & Evening: 6–10 PM
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=3HP5%2B948%2C+Barghat+Rd%2C+Sanjay+Vihar+Colony%2C+Sufi+Nagar%2C+Seoni%2C+Madhya+Pradesh+480661"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-initial px-5 py-3 bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4 fill-[#263D30]" />
                <span>Get Driving Directions</span>
              </a>

              <a
                href="https://www.google.com/maps/search/?api=1&query=3HP5%2B948%2C+Barghat+Rd%2C+Sanjay+Vihar+Colony%2C+Sufi+Nagar%2C+Seoni%2C+Madhya+Pradesh+480661"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-initial px-4 py-3 bg-white/10 hover:bg-white/20 text-[#FAF6EE] border border-white/20 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <span>Open in Google Maps App</span>
              </a>
            </div>
          </div>

          {/* Embedded Google Map Iframe */}
          <div className="w-full h-80 sm:h-96 relative bg-[#EBE2D0]">
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

          {/* Quick Guidance Bar */}
          <div className="p-4 sm:p-5 bg-[#FAF6EE] border-t border-[#D8C9AD] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#302C26]">
            <div className="flex items-center gap-2 text-center sm:text-left">
              <span className="font-bold text-[#A34F37]">Plus Code:</span>
              <span className="font-mono font-semibold bg-[#F8F4EC] px-2.5 py-1 rounded border border-[#D8C9AD]">
                3HP5+948, Seoni, Madhya Pradesh
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <a href="tel:7067672604" className="text-[#263D30] hover:text-[#A34F37] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#C2A36C]" />
                <span>Call Shop: +91 7067672604</span>
              </a>
              <span className="text-[#D8C9AD]">|</span>
              <span className="text-emerald-800 font-bold">Open Everyday</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
