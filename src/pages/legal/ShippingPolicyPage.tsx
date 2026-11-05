import React from 'react';

export const ShippingPolicyPage: React.FC = () => {
  return (
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-[#FAF6EE] p-8 sm:p-12 rounded-2xl border border-[#D8C9AD] shadow-xs">
          <p className="text-xs uppercase tracking-widest text-[#A34F37] font-semibold mb-2">Logistics Standard</p>
          <h1 className="text-3xl font-serif text-[#263D30] font-normal mb-6">Cold-Chain Shipping Policy</h1>
          <p className="text-xs text-[#302C26]/70 mb-8">Serviceable Territories & Delivery Protocols</p>

          <div className="prose prose-stone text-xs sm:text-sm text-[#302C26]/85 space-y-6 leading-relaxed">
            <h3 className="text-base font-serif font-semibold text-[#263D30]">1. Serviceable Territories</h3>
            <p>
              Fresh perishable dairy (A2 Gir Cow Milk, Fresh Malai Paneer, Clay-Pot Curd, and White Butter) is dispatched locally across 
              active zones in <strong>Seoni, Madhya Pradesh</strong> (including Barghat Road, Sufi Nagar, Sanjay Vihar, Sukla, and neighboring localities). 
              Ambient shelf-stable goods (Vedic Bilona Ghee, Wild Honey, Wood-Pressed Mustard Oil) are shipped nationwide via courier.
            </p>

            <h3 className="text-base font-serif font-semibold text-[#263D30]">2. Delivery Slots & Working Days</h3>
            <p>
              <strong>Morning Delivery:</strong> 05:00 AM – 10:00 AM (Daily · All 7 Days of the week).<br />
              <strong>Evening Delivery:</strong> 06:00 PM – 10:00 PM (Daily · All 7 Days of the week).
            </p>

            <h3 className="text-base font-serif font-semibold text-[#263D30]">3. Free Shipping Thresholds</h3>
            <p>
              Orders of ₹250 (25,000 paise) and above qualify for complimentary door-to-door cold-chain delivery. 
              Orders below this threshold incur a nominal ₹50 logistics fee to cover insulated ice-gel packaging.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CancellationRefundPage: React.FC = () => {
  return (
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-[#FAF6EE] p-8 sm:p-12 rounded-2xl border border-[#D8C9AD] shadow-xs">
          <p className="text-xs uppercase tracking-widest text-[#A34F37] font-semibold mb-2">Consumer Protection</p>
          <h1 className="text-3xl font-serif text-[#263D30] font-normal mb-6">Cancellation & Refund Policy</h1>
          <p className="text-xs text-[#302C26]/70 mb-8">Fair & Transparent Consumer Guarantee</p>

          <div className="prose prose-stone text-xs sm:text-sm text-[#302C26]/85 space-y-6 leading-relaxed">
            <h3 className="text-base font-serif font-semibold text-[#263D30]">1. Order Cancellation</h3>
            <p>
              You may cancel any scheduled daily milk delivery or one-time order directly in your Customer Dashboard (/account/orders) 
              anytime prior to the 08:00 PM cutoff window without penalty.
            </p>

            <h3 className="text-base font-serif font-semibold text-[#263D30]">2. Purity & Freshness Guarantee</h3>
            <p>
              If a delivered glass bottle arrives with broken foil seal, elevated temperature (&gt; 6°C), or curdles upon standard first boiling within 12 hours of delivery, 
              we provide an immediate 100% refund or instant free replacement without hassle.
            </p>

            <h3 className="text-base font-serif font-semibold text-[#263D30]">3. Refund Timelines</h3>
            <p>
              Approved refunds are credited to the original payment source (UPI, Credit/Debit Card, Net Banking) within 24 to 48 hours. 
              Instant wallet credits are available upon request.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ReturnPolicyPage: React.FC = () => {
  return (
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-[#FAF6EE] p-8 sm:p-12 rounded-2xl border border-[#D8C9AD] shadow-xs">
          <p className="text-xs uppercase tracking-widest text-[#A34F37] font-semibold mb-2">Returns Protocol</p>
          <h1 className="text-3xl font-serif text-[#263D30] font-normal mb-6">Return & Replacement Policy</h1>
          <p className="text-xs text-[#302C26]/70 mb-8">Health Safety Standards for Perishable Dairy</p>

          <div className="prose prose-stone text-xs sm:text-sm text-[#302C26]/85 space-y-6 leading-relaxed">
            <h3 className="text-base font-serif font-semibold text-[#263D30]">1. Perishable Food Safety Rules</h3>
            <p>
              Due to strict FSSAI food hygiene regulations, once fresh milk bottles, paneer blocks, or clay curd pots have been accepted at the doorstep, 
              physical return of the food item is not permitted. In case of any defect or transit breakage, photographic proof shared via WhatsApp (+91 7067672604) 
              initiates an immediate replacement.
            </p>

            <h3 className="text-base font-serif font-semibold text-[#263D30]">2. Shelf-Stable Goods (Ghee & Honey Jars)</h3>
            <p>
              Unopened, hermetically sealed Bilona Ghee or Wild Honey jars may be returned within 7 days of delivery if you received the incorrect item or if damaged in transit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
