import React from 'react';
import { useRouter } from '../../router/RouterContext';
import { Flame, Droplets, Sparkles, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

export const OurCraftPage: React.FC = () => {
  const { navigate } = useRouter();

  const bilonaSteps = [
    {
      num: '01',
      title: 'Purna Dugdha (Pure Milking)',
      desc: 'Morning unpasteurized milk from pure-bred A2 Gir cows, rich in natural beta-carotene from pasture feeding.'
    },
    {
      num: '02',
      title: 'Mandagni Paka (Slow Clay Boil)',
      desc: 'Boiled gently in traditional brass cauldrons over slow cow-dung and neem embers to preserve micronutrients.'
    },
    {
      num: '03',
      title: 'Dahi Nirmana (Curd Culturing)',
      desc: 'Cooled naturally to room temperature and inoculated with heirloom starter culture in porous clay pots for 14 hours.'
    },
    {
      num: '04',
      title: 'Vedic Manthana (Wooden Churning)',
      desc: 'Bi-directional churning with fluted wooden bilona rods at sunrise until golden makkhan rises to the crest.'
    },
    {
      num: '05',
      title: 'Ghrita Shodhana (Clarification)',
      desc: 'Makhan simmered on low flame into granular, aromatic, amber-gold ghee. Filtered through fine muslin cloth.'
    }
  ];

  return (
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen">
      {/* Hero */}
      <section className="pt-20 pb-20 px-4 sm:px-6 lg:px-8 border-b border-[#D8C9AD]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-[#A34F37] font-semibold mb-3">
            Handcrafted Traditional Vidhi
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#263D30] font-normal tracking-tight mb-6 leading-tight">
            The Lost Art of Vedic Dairy Craftsmanship
          </h1>
          <p className="text-lg text-[#302C26]/80 max-w-2xl mx-auto leading-relaxed">
            Where modern industrial dairy factories use centrifugal force and chemical solvents to extract speed, 
            we rely on wooden bilonas, terracotta vats, and centuries of sacred patience.
          </p>
        </div>
      </section>

      {/* 5-Step Bilona Visual Breakdown */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-serif text-[#263D30] font-semibold mb-3">
            The 5-Stage Vedic Bilona Vidhi
          </h2>
          <p className="text-sm text-[#302C26]/75">
            It requires 30 litres of certified Gir cow milk to yield a single litre of authentic DUGDHSAR Bilona Ghee.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {bilonaSteps.map((step) => (
            <div key={step.num} className="bg-[#FAF6EE] p-6 rounded-xl border border-[#D8C9AD] flex flex-col justify-between">
              <div>
                <span className="text-3xl font-serif text-[#C2A36C] font-bold block mb-3">
                  {step.num}
                </span>
                <h3 className="font-serif text-lg text-[#263D30] font-semibold mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-[#302C26]/75 leading-relaxed">
                  {step.desc}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#F3EDE1] flex items-center gap-1.5 text-[11px] font-medium text-[#A34F37]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero Factory Shortcuts</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison: Industrial Cream Ghee vs Vedic Bilona Ghee */}
      <section className="py-16 bg-[#263D30] text-[#F3EDE1]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-serif text-center mb-12 text-[#F3EDE1]">
            Commercial Butterfat vs Sacred Vedic Bilona
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#1F2F26] p-8 rounded-xl border border-[#3A5243]">
              <span className="text-xs uppercase tracking-widest text-red-300 font-semibold block mb-2">
                95% Commercial Market Ghee
              </span>
              <h3 className="text-xl font-serif text-white mb-4">Direct Cream Industrial Method</h3>
              <ul className="space-y-3 text-xs text-[#F3EDE1]/75">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>Milk is mechanically skimmed to extract raw, unfermented cream.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>Directly boiled in high-pressure steam boilers without probiotic fermentation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>Lacks short-chain fatty acids (butyrate) and granular danedar crystalline texture.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>Often packed in plastic pouches with preservative traces.</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#1A2820] p-8 rounded-xl border-2 border-[#C2A36C]">
              <span className="text-xs uppercase tracking-widest text-[#C2A36C] font-semibold block mb-2">
                The DUGDHSAR Standard
              </span>
              <h3 className="text-xl font-serif text-[#C2A36C] mb-4">Vedic Cultured Bilona Method</h3>
              <ul className="space-y-3 text-xs text-[#F3EDE1]/90">
                <li className="flex items-start gap-2">
                  <span className="text-[#C2A36C] font-bold">✓</span>
                  <span>Prepared exclusively from whole milk converted into live probiotic curd.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C2A36C] font-bold">✓</span>
                  <span>Hand-churned with two-way wooden bilona rod just like Vedic tradition.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C2A36C] font-bold">✓</span>
                  <span>Rich in gut-healing butyric acid, fat-soluble vitamins A, D, E, K2, and natural omega-3.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C2A36C] font-bold">✓</span>
                  <span>Hand-poured into heavy, light-protected amber glass jars.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center max-w-3xl mx-auto px-4">
        <h3 className="text-2xl font-serif text-[#263D30] font-semibold mb-4">
          Taste the Golden Nectar of Authentic Bilona
        </h3>
        <p className="text-sm text-[#302C26]/80 mb-6">
          Limited daily small-batch production. Shipped in airtight glass jars across India.
        </p>
        <button
          onClick={() => navigate('/products/vedic-bilona-cow-ghee')}
          className="bg-[#A34F37] text-white px-8 py-3.5 rounded-lg text-sm font-semibold hover:bg-[#853C26] transition-colors inline-flex items-center gap-2"
        >
          <span>Order Vedic Bilona Ghee</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
};
