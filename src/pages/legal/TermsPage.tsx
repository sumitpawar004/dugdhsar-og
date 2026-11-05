import React from 'react';

export const TermsPage: React.FC = () => {
  return (
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-[#FAF6EE] p-8 sm:p-12 rounded-2xl border border-[#D8C9AD] shadow-xs">
          <p className="text-xs uppercase tracking-widest text-[#A34F37] font-semibold mb-2">Legal Terms</p>
          <h1 className="text-3xl font-serif text-[#263D30] font-normal mb-6">Terms & Conditions</h1>
          <p className="text-xs text-[#302C26]/70 mb-8">Effective Date: January 1, 2026</p>

          <div className="prose prose-stone text-xs sm:text-sm text-[#302C26]/85 space-y-6 leading-relaxed">
            <h3 className="text-base font-serif font-semibold text-[#263D30]">1. Contract of Sale</h3>
            <p>
              By accessing DUGDHSAR website or placing a subscription/one-time purchase order, you agree to be bound by these Terms of Service. 
              Orders placed before 8:00 PM are scheduled for dispatch the following dawn (5:30 AM – 7:00 AM).
            </p>

            <h3 className="text-base font-serif font-semibold text-[#263D30]">2. Glass Bottle Deposit & Ahimsa Stewardship</h3>
            <p>
              Our fresh milk is provided in reusable glass bottles. Subscribers agree to rinse and return empty bottles in the designated 
              insulated doorstep bag. Unreturned or broken bottles may incur a nominal replacement fee of ₹40 per bottle.
            </p>

            <h3 className="text-base font-serif font-semibold text-[#263D30]">3. Perishable Good Storage Responsibility</h3>
            <p>
              DUGDHSAR delivers farm-fresh, unadulterated milk and cottage cheese at 2°C – 4°C. Customers must retrieve bottles from their 
              doorstep before 07:30 AM and immediately store in home refrigeration below 4°C.
            </p>

            <h3 className="text-base font-serif font-semibold text-[#263D30]">4. Intellectual Property</h3>
            <p>
              The DUGDHSAR trademark, Gir Cow roundel emblem, Bilona Vidhi documentation, and editorial photographs are protected under 
              the Copyright Act of India.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
