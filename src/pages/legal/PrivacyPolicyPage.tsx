import React from 'react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-[#FAF6EE] p-8 sm:p-12 rounded-2xl border border-[#D8C9AD] shadow-xs">
          <p className="text-xs uppercase tracking-widest text-[#A34F37] font-semibold mb-2">Legal Compliance</p>
          <h1 className="text-3xl font-serif text-[#263D30] font-normal mb-6">Privacy Policy</h1>
          <p className="text-xs text-[#302C26]/70 mb-8">Last Updated: January 1, 2026</p>

          <div className="prose prose-stone text-xs sm:text-sm text-[#302C26]/85 space-y-6 leading-relaxed">
            <h3 className="text-base font-serif font-semibold text-[#263D30]">1. Introduction & Scope</h3>
            <p>
              DUGDHSAR Dairy Private Limited ("DUGDHSAR", "we", "our") respects your personal integrity. 
              This Privacy Policy describes how we collect, store, encrypt, and utilize customer information through our website (dugdhsar.in), 
              customer mobile applications, and door-to-door delivery fulfillment networks.
            </p>

            <h3 className="text-base font-serif font-semibold text-[#263D30]">2. Personal Data We Collect</h3>
            <p>
              We collect customer full names, telephone numbers, delivery postal addresses, apartment numbers, landmarks, pincodes, 
              and payment transaction IDs. We do not store raw credit card numbers or UPI MPINs on our servers; all digital payments are 
              processed through PCI-DSS Level 1 compliant gateway partners.
            </p>

            <h3 className="text-base font-serif font-semibold text-[#263D30]">3. Cold-Chain Dispatch & GPS Tracking</h3>
            <p>
              Your delivery address is shared securely with our refrigerated fleet delivery drivers solely for the purpose of completing 
              your local delivery in Seoni (Morning 05:00 AM – 10:00 AM or Evening 06:00 PM – 10:00 PM). Driver delivery logs are purged 30 days after fulfillment.
            </p>

            <h3 className="text-base font-serif font-semibold text-[#263D30]">4. Data Protection & Grievance Officer</h3>
            <p>
              In accordance with the Information Technology Act 2000 and Digital Personal Data Protection Act 2023, you may request 
              deletion of your account and personal history by emailing support@dugdhsar.in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
