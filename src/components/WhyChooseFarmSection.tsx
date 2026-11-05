import React from 'react';
import { useRouter } from '../router/RouterContext';
import { Sunrise, ShieldCheck, Heart, Users, CheckCircle2, ArrowRight } from 'lucide-react';

interface ValuePillar {
  id: string;
  badge: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  detail: string;
}

export const WhyChooseFarmSection: React.FC = () => {
  const { navigate } = useRouter();

  const pillars: ValuePillar[] = [
    {
      id: 'farm-fresh',
      badge: 'Dawn Cold-Chain',
      title: 'Farm Fresh, Every Morning',
      description: 'Milk sourced & delivered daily within 4 hours of dawn milking, strictly maintained between 2°C – 4°C.',
      icon: <Sunrise className="w-6 h-6 text-[#A34F37]" />,
      detail: 'Delivered before 11:00 AM'
    },
    {
      id: '100-natural',
      badge: 'Zero Adulteration',
      title: '100% Natural',
      description: 'No preservatives. No hormones. Strictly zero oxytocin, antibiotics, or synthetic emulsifiers.',
      icon: <ShieldCheck className="w-6 h-6 text-[#263D30]" />,
      detail: '18-Point Purity Tested'
    },
    {
      id: 'a2-desi-breeds',
      badge: 'Vedic Lineage',
      title: 'A2 Desi Breeds',
      description: 'Traditional Indian cows. Certified 100% homozygous A2/A2 indigenous Gir & Sahiwal breeds grazing open Braj pastures.',
      icon: <Heart className="w-6 h-6 text-[#C2A36C]" />,
      detail: 'Free Forest Grazing'
    },
    {
      id: 'trusted-families',
      badge: 'Community Trust',
      title: 'Trusted by Families',
      description: 'Cherished daily by over 10,000+ conscious households for our sterile glass bottle hygiene and uncompromising Vedic integrity.',
      icon: <Users className="w-6 h-6 text-[#263D30]" />,
      detail: '60 Years Heritage'
    }
  ];

  return (
    <section id="why-choose-farm" className="py-24 bg-[#F8F4EC] relative overflow-hidden border-t border-[#D8C9AD]">
      
      {/* Soft Background Accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#D8C9AD]/20 rounded-full filter blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#C2A36C]/10 rounded-full filter blur-3xl pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs uppercase tracking-[0.25em] text-[#A34F37] font-bold mb-2">
            Purity · Tradition · Ahimsa
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#263D30] font-normal tracking-tight mb-4">
            Why Choose Vrindavan Farm?
          </h2>
          <p className="text-sm sm:text-base text-[#302C26]/80 leading-relaxed max-w-2xl mx-auto">
            Situated in the sacred Braj corridor, our heritage gaushala upholds the eternal Vedic covenant of non-violence, ethical animal husbandry, and direct doorstep transparency.
          </p>
        </div>

        {/* 4 Value Pillar Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, idx) => (
            <div
              key={pillar.id}
              className="bg-[#FAF6EE] rounded-2xl border border-[#D8C9AD] hover:border-[#263D30] p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group"
            >
              <div>
                {/* Header Icon + Numbering */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#F8F4EC] border border-[#D8C9AD] flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                    {pillar.icon}
                  </div>
                  <span className="font-serif text-2xl font-bold text-[#D8C9AD] group-hover:text-[#C2A36C] transition-colors">
                    0{idx + 1}
                  </span>
                </div>

                {/* Micro Tag */}
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#A34F37] bg-[#A34F37]/10 px-2.5 py-1 rounded mb-3 border border-[#A34F37]/20">
                  {pillar.badge}
                </span>

                {/* Title */}
                <h3 className="font-serif text-xl font-bold text-[#263D30] mb-2 leading-snug">
                  {pillar.title}
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-sm text-[#302C26]/75 leading-relaxed">
                  {pillar.description}
                </p>
              </div>

              {/* Bottom Feature Pill */}
              <div className="mt-6 pt-4 border-t border-[#D8C9AD]/50 flex items-center gap-1.5 text-xs font-semibold text-[#263D30]">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{pillar.detail}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Assurance Strip */}
        <div className="mt-14 p-6 sm:p-8 rounded-2xl bg-[#263D30] text-[#FAF6EE] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-[#C2A36C]/40">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-full bg-[#C2A36C] text-[#263D30] flex items-center justify-center font-serif font-black text-xl shrink-0">
              60
            </div>
            <div>
              <strong className="block text-sm sm:text-base font-serif text-[#FAF6EE]">
                Six Decades of Uncompromised Vedic Stewardship
              </strong>
              <p className="text-xs text-[#FAF6EE]/80 mt-0.5">
                Experience the golden difference of raw, pure-bred Gir cow A2 milk delivered in sterilized glass bottles.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/shop')}
            className="bg-[#A34F37] hover:bg-[#853C26] text-[#FAF6EE] px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shrink-0 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <span>Order Fresh Morning Milk</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
