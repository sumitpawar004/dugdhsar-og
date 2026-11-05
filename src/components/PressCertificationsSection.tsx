import React, { useState, useEffect } from 'react';
import { Award, ChevronLeft, ChevronRight, ShieldCheck, FileCheck, CheckCircle2 } from 'lucide-react';

interface Certification {
  id: string;
  badge: string;
  title: string;
  authority: string;
  details: string;
  regNumber: string;
}

export const PressCertificationsSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const certifications: Certification[] = [
    {
      id: 'fssai',
      badge: 'Statutory Safety',
      title: 'FSSAI CERTIFIED STATE-OF-THE-ART PROCESSING',
      authority: 'Food Safety and Standards Authority of India',
      details: 'Strict adherence to national dairy sanitation standards. Batch-tested for zero synthetic contaminants, zero heavy metals, and zero artificial homogenization.',
      regNumber: 'FSSAI Food Safety Standard Compliance'
    },
    {
      id: 'purity-assay',
      badge: 'Zero Adulteration',
      title: 'DAILY COMPREHENSIVE CHEMICAL & DNA PURITY ASSAY',
      authority: 'Standard Bio-Chemical Assay & Purity Verification',
      details: 'Daily testing protocol verifying 0.00% detergent, 0.00% starch, 0.00% urea, 0.00% formalin, and 100% pure A2 beta-casein allele confirmation.',
      regNumber: 'Quality Assay Protocol: QAP-A2-100'
    },
    {
      id: 'ahimsa',
      badge: 'Vedic Ethics',
      title: 'CERTIFIED AHIMSA CRUELTY-FREE VEDIC GOSHALA',
      authority: 'Vedic Animal Welfare Trust',
      details: 'Cows are revered as sacred mothers. Calves are nourished first, artificial hormones are prohibited, and aging cattle are sheltered with loving devotion for their full lifespan.',
      regNumber: 'Vedic Ahimsa Charter: AH-1964-GIR'
    },
    {
      id: 'gir-breed',
      badge: 'Indigenous Lineage',
      title: 'AUTHENTIC GIR CATTLE BREED INTEGRITY',
      authority: 'Indigenous Bos Indicus Cattle Conservation Society',
      details: 'Pedigree registry safeguarding authentic Indian Gir cows characterized by their prominent hump, broad forehead, and distinctive soothing surya ketu nadi solar vein.',
      regNumber: 'Gir Heritage Seal: GIR-IND-064'
    },
    {
      id: 'heritage-press',
      badge: '60 Years Legacy',
      title: 'SIX DECADES OF TRUST & NATIONAL ACCLAIM',
      authority: 'National Heritage Food & Dairy Council',
      details: 'From a humble ancestral goshala in 1964 to a vanguard of modern cold-chain bio-purity, DUGDHSAR represents the highest benchmark of Indian dairy honor.',
      regNumber: 'Diamond Jubilee Citation: 1964 - 2026'
    }
  ];

  const handleNext = () => {
    setActiveIndex(prev => (prev + 1) % certifications.length);
  };

  const handlePrev = () => {
    setActiveIndex(prev => (prev - 1 + certifications.length) % certifications.length);
  };

  // Autoplay
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-24 bg-[#263D30] text-[#FAF6EE] relative overflow-hidden border-y border-[#C2A36C]/30">
      {/* Decorative Monogram Repeating Wallpaper */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none bg-repeat bg-[length:350px]"
        style={{ backgroundImage: `url('/assets/aistudio/1000095665-clean_9f8d49b7.png')` }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 bg-[#FAF6EE]/10 px-4 py-1.5 rounded-full text-xs font-bold text-[#C2A36C] mb-3 border border-[#C2A36C]/30">
            <Award className="w-4 h-4 text-[#C2A36C]" />
            <span>National Certifications & Accreditations</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[#FAF6EE]">
            CERTIFIED VEDIC STANDARDS & ACCREDITATIONS
          </h2>

          <p className="text-[#FAF6EE]/80 text-xs sm:text-sm mt-3 leading-relaxed">
            Our commitment to purity is governed by scientific testing, independent biological verification, and ancestral ethical charters.
          </p>
        </div>

        {/* Center-Zoom Carousel */}
        <div className="relative max-w-4xl mx-auto">
          
          <div className="overflow-hidden py-6">
            <div 
              className="flex items-center justify-center transition-all duration-700 ease-out"
            >
              {certifications.map((item, index) => {
                const isActive = index === activeIndex;
                const isAdjacent = Math.abs(index - activeIndex) === 1 || (activeIndex === 0 && index === certifications.length - 1) || (activeIndex === certifications.length - 1 && index === 0);

                if (!isActive && !isAdjacent) return null;

                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveIndex(index)}
                    className={`transition-all duration-500 cursor-pointer px-4 flex-1 ${
                      isActive 
                        ? 'scale-100 opacity-100 z-20 max-w-lg' 
                        : 'scale-85 opacity-40 z-10 hidden sm:block max-w-xs'
                    }`}
                  >
                    <div className={`rounded-3xl p-6 sm:p-8 border text-center transition-all ${
                      isActive 
                        ? 'bg-gradient-to-b from-[#FAF6EE]/15 to-[#FAF6EE]/5 backdrop-blur-md border-[#C2A36C] shadow-2xl' 
                        : 'bg-white/5 border-white/10'
                    }`}>
                      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#C2A36C] text-[#263D30] flex items-center justify-center shadow-lg">
                        <ShieldCheck className="w-8 h-8" />
                      </div>

                      <span className="text-[10px] font-black uppercase tracking-widest text-[#C2A36C] block mb-1">
                        {item.badge}
                      </span>

                      <h3 className="text-base sm:text-lg font-black tracking-wide mb-2 leading-snug text-[#FAF6EE]">
                        {item.title}
                      </h3>

                      <p className="text-xs text-[#FAF6EE]/75 leading-relaxed mb-4">
                        {item.details}
                      </p>

                      <div className="pt-3 border-t border-[#C2A36C]/20 text-[10px] text-[#D8C9AD] font-mono flex items-center justify-center space-x-1">
                        <FileCheck className="w-3.5 h-3.5 text-[#C2A36C]" />
                        <span>{item.regNumber}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Carousel Arrows */}
          <button
            onClick={handlePrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-6 w-11 h-11 rounded-full bg-[#FAF6EE]/20 hover:bg-[#C2A36C] hover:text-[#263D30] text-[#FAF6EE] flex items-center justify-center backdrop-blur-md transition-all shadow-lg z-30"
            title="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-6 w-11 h-11 rounded-full bg-[#FAF6EE]/20 hover:bg-[#C2A36C] hover:text-[#263D30] text-[#FAF6EE] flex items-center justify-center backdrop-blur-md transition-all shadow-lg z-30"
            title="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center space-x-2 mt-6">
            {certifications.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === activeIndex ? 'w-8 bg-[#c89d56]' : 'w-2 bg-white/30'
                }`}
              />
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};
