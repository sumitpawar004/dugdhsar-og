import React from 'react';
import { useRouter } from '../../router/RouterContext';
import { ShieldCheck, Heart, Award, ArrowRight, Clock, Users, Sun } from 'lucide-react';

export const OurStoryPage: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen">
      {/* Editorial Hero Banner */}
      <section className="relative pt-12 sm:pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-[#D8C9AD]">
        <div className="max-w-5xl mx-auto text-center">
          {/* Breadcrumb */}
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#302C26]/70 mb-4">
            <button 
              onClick={() => navigate('/')}
              className="hover:text-[#A34F37] transition-colors cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <span className="text-[#A34F37] font-bold">Our Story</span>
          </div>
          <p className="text-xs uppercase tracking-[0.25em] text-[#A34F37] font-semibold mb-3">
            Since 1964 · Six Decades of Vedic Stewardship
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#263D30] font-normal tracking-tight mb-6 leading-tight">
            Preserving India’s Sacred Dairy Heritage Through Ahimsa & Purity
          </h1>
          <p className="text-lg text-[#302C26]/80 max-w-3xl mx-auto leading-relaxed">
            In 1964, our founder Pandit Ramswaroop Singhal made a solemn pledge in the fertile meadows of the Braj region: 
            never to subject a mother cow to synthetic hormones, commercial milking machines, or calf separation. 
            Sixty years later, DUGDHSAR remains an unyielding sanctuary for indigenous Vedic Gir cows.
          </p>
        </div>
      </section>

      {/* Heritage Timeline Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="border-t-2 border-[#C2A36C] pt-6">
            <span className="text-3xl font-serif text-[#263D30] font-bold block mb-2">1964</span>
            <h3 className="text-xl font-serif text-[#263D30] font-semibold mb-3">The First Gaushala</h3>
            <p className="text-sm text-[#302C26]/80 leading-relaxed">
              Founded with 12 indigenous Gir cows on ancestral family land. Milk was distributed in brass vessels to neighboring ashrams and families seeking untainted nourishment.
            </p>
          </div>

          <div className="border-t-2 border-[#C2A36C] pt-6">
            <span className="text-3xl font-serif text-[#263D30] font-bold block mb-2">1998</span>
            <h3 className="text-xl font-serif text-[#263D30] font-semibold mb-3">Reviving Bilona Vidhi</h3>
            <p className="text-sm text-[#302C26]/80 leading-relaxed">
              When industrial dairy factories converted to chemical separators, Dugdhsar constructed an authentic Bilona center, maintaining hand-carved wooden churners and earthen curd vats.
            </p>
          </div>

          <div className="border-t-2 border-[#C2A36C] pt-6">
            <span className="text-3xl font-serif text-[#263D30] font-bold block mb-2">2026</span>
            <h3 className="text-xl font-serif text-[#263D30] font-semibold mb-3">Vedic Cold-Chain Pioneer</h3>
            <p className="text-sm text-[#302C26]/80 leading-relaxed">
              Combining 60 years of ethical husbandry with modern laboratory PCR genetic testing and zero-touch glass bottling delivered daily directly to families across Seoni and surrounding areas.
            </p>
          </div>
        </div>
      </section>

      {/* The 4 Ahimsa Pillars */}
      <section className="py-16 bg-[#263D30] text-[#F3EDE1]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs uppercase tracking-[0.2em] text-[#C2A36C] font-semibold mb-2">
              Our Ethical Code
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#F3EDE1]">
              The Dugdhsar Ahimsa Doctrine
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-[#1F2F26] p-6 rounded-xl border border-[#3A5243]">
              <div className="w-10 h-10 rounded-full bg-[#C2A36C]/20 text-[#C2A36C] flex items-center justify-center mb-4">
                <Heart className="w-5 h-5" />
              </div>
              <h4 className="font-serif text-lg text-[#F3EDE1] font-semibold mb-2">Calf Drinks First</h4>
              <p className="text-xs text-[#F3EDE1]/75 leading-relaxed">
                Every newborn calf nurses freely until fully satisfied. Only surplus morning milk is harvested for human consumption.
              </p>
            </div>

            <div className="bg-[#1F2F26] p-6 rounded-xl border border-[#3A5243]">
              <div className="w-10 h-10 rounded-full bg-[#C2A36C]/20 text-[#C2A36C] flex items-center justify-center mb-4">
                <Sun className="w-5 h-5" />
              </div>
              <h4 className="font-serif text-lg text-[#F3EDE1] font-semibold mb-2">Free Forest Grazing</h4>
              <p className="text-xs text-[#F3EDE1]/75 leading-relaxed">
                Our Gir cows wander unrestricted across 250 acres of certified organic pastures, grazing on natural clover, herbs, and neem leaves.
              </p>
            </div>

            <div className="bg-[#1F2F26] p-6 rounded-xl border border-[#3A5243]">
              <div className="w-10 h-10 rounded-full bg-[#C2A36C]/20 text-[#C2A36C] flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-serif text-lg text-[#F3EDE1] font-semibold mb-2">Zero Injections Ever</h4>
              <p className="text-xs text-[#F3EDE1]/75 leading-relaxed">
                Strict ban on oxytocin, recombinant bovine growth hormones (rBST), and preventive synthetic antibiotics.
              </p>
            </div>

            <div className="bg-[#1F2F26] p-6 rounded-xl border border-[#3A5243]">
              <div className="w-10 h-10 rounded-full bg-[#C2A36C]/20 text-[#C2A36C] flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-serif text-lg text-[#F3EDE1] font-semibold mb-2">Retirement with Honor</h4>
              <p className="text-xs text-[#F3EDE1]/75 leading-relaxed">
                Elder cows live their full natural lifespans in comfort at our Shanti Vrindavan sanctuary, receiving daily care and affection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Emblem Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <img 
          src="/assets/aistudio/1000095715-clean_c92aa3a9.png" 
          alt="Dugdhsar 60 Years Heritage Emblem" 
          className="w-48 h-48 mx-auto mb-8 drop-shadow-md rounded-2xl object-contain"
        />
        <h3 className="text-2xl font-serif text-[#263D30] font-semibold mb-4">
          Experience Fresh A2 Gir Cow Milk at Your Doorstep
        </h3>
        <p className="text-sm text-[#302C26]/80 max-w-xl mx-auto mb-8">
          Delivered in sterile reusable glass bottles twice daily across Seoni, MP (5:00 AM – 10:00 AM & 6:00 PM – 10:00 PM) directly from our Vedic gaushala in Sukla, MP.
        </p>
        <button
          onClick={() => navigate('/shop')}
          className="inline-flex items-center gap-2 bg-[#263D30] text-[#F3EDE1] px-8 py-3.5 rounded-lg text-sm font-semibold hover:bg-[#1A2B22] transition-colors"
        >
          <span>Explore Farm Store</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
};
