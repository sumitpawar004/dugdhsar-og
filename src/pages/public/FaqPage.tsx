import React, { useState } from 'react';
import { useRouter } from '../../router/RouterContext';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
  cat: string;
}

export const FaqPage: React.FC = () => {
  const { navigate } = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      cat: 'milk',
      q: 'What is the physiological difference between A1 and A2 beta-casein?',
      a: 'Indigenous Vedic Bos Indicus cows (such as Gir and Sahiwal) produce 100% A2 beta-casein protein with a proline amino acid at position 67. Western hybrid cows (HF/Jersey) possess a histidine mutation that releases BCM-7 (Beta-Casomorphin-7) during digestion, causing bloating, gut inflammation, and lactose-like intolerance. DUGDHSAR cows are genetically PCR-certified 100% homozygous A2/A2.'
    },
    {
      cat: 'delivery',
      q: 'Why does Dugdhsar deliver exclusively in glass bottles instead of plastic pouches or tetrapak cartons?',
      a: 'Plastic pouches and plastic-lined tetra cartons leach endocrine-disrupting microplastics and bisphenols (BPA/BPS) into the fatty lipids of fresh milk, especially during temperature changes. Our medical-grade, sterile recyclable glass bottles are chemically inert, keep the milk cold longer, preserve the rich cream taste, and are sanitized daily at 120°C in our automated washer.'
    },
    {
      cat: 'delivery',
      q: 'How does the empty glass bottle return cycle work?',
      a: 'Every morning, simply rinse your empty bottle with water and place it outside your door in the insulated Dugdhsar delivery bag. Our delivery partner will collect the empty bottle while placing your fresh morning bottle.'
    },
    {
      cat: 'delivery',
      q: 'What are the delivery hours? What if I need evening delivery in Seoni?',
      a: 'We provide twice-daily doorstep deliveries across Seoni, MP: Morning between 5:00 AM – 10:00 AM and Evening between 6:00 PM – 10:00 PM every day of the week. You can also visit our physical dairy shop on Barghat Road, Seoni.'
    },
    {
      cat: 'subscription',
      q: 'Can I pause or modify my delivery schedule when I travel?',
      a: 'Yes, with complete ease. Through your Customer Account Portal (/account), you can pause deliveries, change quantities, or switch frequencies (Daily, Alternate Days, Weekdays only) anytime before the 8:00 PM cutoff for the next morning.'
    },
    {
      cat: 'ghee',
      q: 'Why is your Bilona Ghee more expensive than standard supermarket ghee?',
      a: 'Commercial supermarket ghee is made from machine-skimmed cream boiled directly in factories. It takes only 10-12 litres of industrial milk to make 1 litre of commercial ghee. DUGDHSAR Bilona Ghee requires 30 litres of certified A2 Gir cow milk because we culture whole milk into curd, hand-churn it with wooden bilonas into Makhan, and slow-simmer it. It is pure medicinal gold rich in natural butyrate.'
    },
    {
      cat: 'quality',
      q: 'How do I verify today’s batch purity report?',
      a: 'Each bottle has a batch code printed on the foil seal. You can enter that code into our Quality Assay prober at /quality to review the full 18-parameter chemical adulteration assay and microbial stability report.'
    }
  ];

  const filtered = activeTab === 'all' ? faqs : faqs.filter(f => f.cat === activeTab);

  return (
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          {/* Breadcrumb */}
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#302C26]/70 mb-4">
            <button 
              onClick={() => navigate('/')}
              className="hover:text-[#A34F37] transition-colors cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <span className="text-[#A34F37] font-bold">Frequently Asked Questions</span>
          </div>
          <p className="text-xs uppercase tracking-[0.25em] text-[#A34F37] font-semibold mb-2">
            Knowledge & Guidance
          </p>
          <h1 className="text-4xl font-serif text-[#263D30] font-normal mb-4">
            Frequently Answered Questions
          </h1>
          <p className="text-sm text-[#302C26]/80 leading-relaxed">
            Everything you need to know about our Vedic Gir cow dairy, morning cold-chain logistics, bottle sanitization, and artisanal craftsmanship.
          </p>
        </div>

        {/* Filter categories */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {[
            { id: 'all', label: 'All Questions' },
            { id: 'milk', label: 'A2 Milk Science' },
            { id: 'delivery', label: 'Cold-Chain & Bottles' },
            { id: 'subscription', label: 'Subscriptions' },
            { id: 'ghee', label: 'Vedic Bilona Ghee' },
            { id: 'quality', label: 'Purity & Testing' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setOpenIndex(null); }}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === tab.id 
                  ? 'bg-[#263D30] text-[#FAF6EE]' 
                  : 'bg-[#FAF6EE] text-[#302C26] border border-[#D8C9AD] hover:bg-[#F8F4EC]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {filtered.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className="bg-[#FAF6EE] rounded-xl border border-[#D8C9AD] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full text-left p-6 flex items-center justify-between gap-4 hover:bg-[#F8F4EC] transition-colors"
                >
                  <span className="font-serif text-lg text-[#263D30] font-semibold">
                    {faq.q}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#F8F4EC] flex items-center justify-center shrink-0 text-[#263D30]">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 pt-2 text-xs sm:text-sm text-[#302C26]/80 leading-relaxed border-t border-[#D8C9AD]/40">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
