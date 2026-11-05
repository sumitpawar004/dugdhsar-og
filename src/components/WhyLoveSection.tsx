import React, { useState } from 'react';
import { Bottle360Viewer } from './Bottle360Viewer';
import { 
  Sparkles, 
  Dna, 
  Sun, 
  Brain, 
  Milk, 
  ShieldPlus, 
  Heart, 
  Smile,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface BenefitItem {
  id: string;
  title: string;
  shortLabel: string;
  biomarker: string;
  metricBadge: string;
  icon: React.ReactNode;
  positionClass: string;
  clinicalText: string;
}

export const WhyLoveSection: React.FC = () => {
  const [activeId, setActiveId] = useState<string>('high-nutrition');

  const benefits: BenefitItem[] = [
    {
      id: 'high-nutrition',
      title: 'HIGH NUTRITIONAL VALUE',
      shortLabel: 'High Nutrition',
      biomarker: 'Complete A2 Proteins & Native Enzymes',
      metricBadge: '100% Bioavailable',
      icon: <Dna className="w-5 h-5 sm:w-6 sm:h-6" />,
      positionClass: 'top-8 left-8 sm:left-24',
      clinicalText: 'Loaded with complete essential amino acids, native lactoferrin, and unheated digestive enzymes that fuel cellular recovery and natural energy.'
    },
    {
      id: 'vitamin-d',
      title: 'MORE VITAMIN D',
      shortLabel: 'More Vitamin D',
      biomarker: 'Solar Cholecalciferol D3',
      metricBadge: 'Maximum Absorption',
      icon: <Sun className="w-5 h-5 sm:w-6 sm:h-6" />,
      positionClass: 'top-28 left-12 sm:left-36',
      clinicalText: 'Pasture-grazing indigenous Gir cows naturally synthesize bio-identical Vitamin D3 under sunlight, vastly enhancing bone density and dental calcium retention.'
    },
    {
      id: 'brain-power',
      title: 'INCREASES BRAIN POWER',
      shortLabel: 'Brain Power',
      biomarker: 'Cerebrosides & Natural Choline',
      metricBadge: 'Cognitive Vitality',
      icon: <Brain className="w-5 h-5 sm:w-6 sm:h-6" />,
      positionClass: 'top-16 right-12 sm:right-36',
      clinicalText: 'Natural sphingolipids and omega-3 precursors nourish the neural myelin sheath, supporting memory consolidation, focus, and brain plasticity.'
    },
    {
      id: 'pure-honest',
      title: 'PURE & HONEST MILK WITH NO ADDITIVES',
      shortLabel: 'Pure & Honest',
      biomarker: 'Zero Hormones · Zero Injections',
      metricBadge: '100% Raw Chilled',
      icon: <Milk className="w-5 h-5 sm:w-6 sm:h-6" />,
      positionClass: 'top-44 right-8 sm:right-28',
      clinicalText: 'Strictly zero oxytocin, zero recombinant bovine growth hormones (rBST), and zero preventive antibiotics. Pure whole milk untouched by human hands.'
    },
    {
      id: 'clean-cholesterol',
      title: 'CLEAN CHOLESTEROL (GOOD HDL)',
      shortLabel: 'Clean Cholesterol',
      biomarker: 'Conjugated Linoleic Acid (CLA)',
      metricBadge: 'Cardio Protective',
      icon: <Heart className="w-5 h-5 sm:w-6 sm:h-6" />,
      positionClass: 'bottom-28 left-10 sm:left-28',
      clinicalText: 'Naturally rich in conjugated linoleic acid (CLA) and beneficial short-chain fatty acids that actively support healthy HDL cholesterol and vascular elasticity.'
    },
    {
      id: 'immunity',
      title: 'HELPS BUILD IMMUNITY',
      shortLabel: 'Builds Immunity',
      biomarker: 'Bioactive Immunoglobulins (IgG)',
      metricBadge: 'Immuno-Defensive',
      icon: <ShieldPlus className="w-5 h-5 sm:w-6 sm:h-6" />,
      positionClass: 'bottom-28 right-10 sm:right-28',
      clinicalText: 'Natural concentrations of active immunoglobulins and antibacterial proline peptides bolster the mucosal gut barrier against oxidative stress.'
    },
    {
      id: 'easy-digest',
      title: 'EASY TO DIGEST (A2 BETA-CASEIN)',
      shortLabel: 'Easy to Digest',
      biomarker: 'Proline-67 Amino Bond',
      metricBadge: 'Zero BCM-7 Inflammation',
      icon: <Smile className="w-5 h-5 sm:w-6 sm:h-6" />,
      positionClass: 'bottom-8 left-24 sm:left-44',
      clinicalText: 'Features the sacred proline amino acid at position 67, preventing release of inflammatory peptide BCM-7 and eliminating bloating or lactose discomfort.'
    }
  ];

  const activeIndex = benefits.findIndex(b => b.id === activeId);
  const activeBenefit = benefits[activeIndex] || benefits[0];

  return (
    <section id="why-love" className="min-h-screen py-20 bg-[#F8F4EC] relative flex flex-col items-center justify-center overflow-hidden">
      
      {/* Editorial Section Headline */}
      <div className="text-center mb-8 px-4 relative z-20">
        <p className="text-xs uppercase tracking-[0.25em] text-[#A34F37] font-semibold mb-2">
          Clinical Advantages · Vedic Bio-Science
        </p>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#263D30] tracking-wider uppercase font-sans">
          WHY LOVE DUGDHSAR?
        </h2>
        <p className="text-xs text-[#302C26]/75 uppercase tracking-widest mt-1 max-w-lg mx-auto">
          Hover over or tap any biological benefit below to inspect clinical advantages
        </p>
      </div>

      {/* Main Interactive Stage with Central Bottle */}
      <div className="relative w-full max-w-5xl h-[420px] md:h-[560px] lg:h-[620px] flex items-center justify-center">
        
        {/* Soft Radial Ambient Aura */}
        <div className="absolute w-[320px] sm:w-[450px] h-[320px] sm:h-[450px] bg-gradient-to-tr from-[#D8C9AD]/25 via-[#C2A36C]/15 to-transparent rounded-full filter blur-3xl pointer-events-none -z-0" />

        {/* Center Glass Bottle Standing in Place */}
        <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
          <Bottle360Viewer className="transform scale-75 sm:scale-90 md:scale-100" showControls={false} showDragBadge={false} />
        </div>

        {/* Floating Halo Spheres Surrounding the Bottle - DESKTOP ONLY to prevent mobile overlap */}
        <div className="hidden md:block absolute inset-0 z-20 pointer-events-none">
          {benefits.map((item, idx) => {
            const isActive = activeId === item.id;

            return (
              <div
                key={item.id}
                onMouseEnter={() => setActiveId(item.id)}
                onClick={() => setActiveId(item.id)}
                className={`absolute pointer-events-auto cursor-pointer transition-all duration-300 ${item.positionClass}`}
                style={{ transform: 'translate(-50%, -50%)' }}
              >
                {/* Luminous Pulsing Aura behind active icon */}
                {isActive && (
                  <div className="absolute -inset-2.5 rounded-full bg-[#C2A36C]/30 animate-ping pointer-events-none" />
                )}

                {/* Aesthetic Icon Orb Button */}
                <div
                  className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                    isActive
                      ? 'bg-[#263D30] text-[#FAF6EE] scale-120 ring-4 ring-[#C2A36C] shadow-2xl'
                      : 'bg-[#FAF6EE] text-[#263D30] border-2 border-[#D8C9AD] hover:border-[#263D30] hover:scale-108'
                  }`}
                >
                  <div className={isActive ? 'text-[#C2A36C]' : 'text-[#263D30]'}>
                    {item.icon}
                  </div>

                  {/* Tiny Number Badge */}
                  <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center transition-colors ${
                    isActive ? 'bg-[#A34F37] text-[#FAF6EE]' : 'bg-[#D8C9AD] text-[#302C26]'
                  }`}>
                    0{idx + 1}
                  </div>
                </div>

                {/* Subtitle Label under Icon */}
                <div className="text-center mt-2 w-28 -ml-6 sm:-ml-6 pointer-events-none">
                  <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-tight leading-tight block transition-colors ${
                    isActive ? 'text-[#263D30] font-black' : 'text-[#302C26]/75'
                  }`}>
                    {item.shortLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Elegant Clinical Intelligence Card */}
      {activeBenefit && (
        <div className="w-full max-w-xl mx-auto px-4 mt-4 md:-mt-14 relative z-30 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-[#FAF6EE]/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-[#C2A36C]/60 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            <div className="space-y-1.5 flex-1">
              {/* Micro Category Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-[#A34F37] bg-[#A34F37]/10 px-2 py-0.5 rounded border border-[#A34F37]/30">
                  <Sparkles className="w-3 h-3 text-[#A34F37]" />
                  <span>Bio-Advantage 0{activeIndex + 1}</span>
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#263D30] bg-[#E8EFEA] px-2 py-0.5 rounded border border-[#263D30]/20">
                  {activeBenefit.biomarker}
                </span>
                <span className="text-[9px] font-semibold text-[#C2A36C] bg-[#263D30] px-2 py-0.5 rounded ml-auto sm:ml-0">
                  {activeBenefit.metricBadge}
                </span>
              </div>

              {/* Benefit Title */}
              <h3 className="font-serif text-base sm:text-lg font-bold text-[#263D30] tracking-tight leading-snug">
                {activeBenefit.title}
              </h3>

              {/* Clinical Science Explanation */}
              <p className="text-xs text-[#302C26]/85 leading-relaxed">
                {activeBenefit.clinicalText}
              </p>
            </div>

            {/* Verified Purity Seal Badge */}
            <div className="hidden sm:flex flex-col items-center justify-center p-3 rounded-xl bg-[#263D30] text-[#FAF6EE] shrink-0 border border-[#C2A36C]/40 text-center min-w-[90px]">
              <ShieldCheck className="w-6 h-6 text-[#C2A36C] mb-1" />
              <span className="text-[8px] uppercase tracking-wider text-[#D8C9AD] font-bold block">Vedic Assay</span>
              <span className="text-[10px] font-bold text-[#FAF6EE]">Certified</span>
            </div>

          </div>
        </div>
      )}

      {/* Horizontal Aesthetic Benefit Navigation Strip */}
      <div className="mt-6 max-w-4xl mx-auto px-4 w-full relative z-20">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
          {benefits.map((b, idx) => {
            const isActive = activeId === b.id;

            return (
              <button
                key={b.id}
                onClick={() => setActiveId(b.id)}
                className={`px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-[#263D30] text-[#FAF6EE] shadow-md border border-[#C2A36C]/60 scale-105'
                    : 'bg-[#FAF6EE] text-[#302C26]/80 hover:bg-[#F3EDE1] hover:text-[#263D30] border border-[#D8C9AD]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#C2A36C]' : 'bg-[#D8C9AD]'}`} />
                <span>{b.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

    </section>
  );
};
