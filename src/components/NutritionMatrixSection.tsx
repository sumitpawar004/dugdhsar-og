import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface NutrientCircle {
  id: string;
  nutrient: string;
  food: string;
  sub: string;
  icon: string;
  positionClass: string;
}

export const NutritionMatrixSection: React.FC = () => {
  const circles: NutrientCircle[] = [
    {
      id: 'paneer',
      nutrient: 'PROTEIN',
      food: '100G FRESH PANEER',
      sub: '18.3g Pure Bio-Protein',
      icon: '🧀',
      positionClass: 'top-4 left-8 sm:top-10 sm:left-24',
    },
    {
      id: 'almonds',
      nutrient: 'VITAMIN E',
      food: '1 CUP ALMONDS',
      sub: 'Antioxidant Cell Defense',
      icon: '🥜',
      positionClass: 'top-4 left-1/2 -translate-x-1/2',
    },
    {
      id: 'sunlight-d3',
      nutrient: 'VITAMIN D',
      food: 'SOLAR GRAZED CLOVER',
      sub: '120 IU Bio-Identical D3',
      icon: '☀️',
      positionClass: 'top-4 right-8 sm:top-10 sm:right-24',
    },
    {
      id: 'broccoli',
      nutrient: 'CALCIUM',
      food: '3.2 CUPS BROCCOLI',
      sub: '305mg Dense Calcium',
      icon: '🥦',
      positionClass: 'bottom-8 left-8 sm:bottom-12 sm:left-20',
    },
    {
      id: 'spinach',
      nutrient: 'PHOSPHORUS',
      food: '2 CUPS SPINACH',
      sub: 'Bone Matrix Co-Factor',
      icon: '🥬',
      positionClass: 'bottom-2 left-1/2 -translate-x-1/2',
    },
    {
      id: 'banana',
      nutrient: 'POTASSIUM',
      food: '1 WHOLE BANANA',
      sub: '360mg Cardiac Electrolytes',
      icon: '🍌',
      positionClass: 'bottom-8 right-8 sm:bottom-12 sm:right-20',
    },
    {
      id: 'carrots',
      nutrient: 'VITAMIN A',
      food: '2 WHOLE CARROTS',
      sub: '500 IU Beta-Carotene',
      icon: '🥕',
      positionClass: 'top-1/2 -translate-y-1/2 left-2 sm:left-10',
    },
    {
      id: 'probiotics',
      nutrient: 'VITAMIN B12',
      food: '3 CUPS YOGURT',
      sub: 'Energy & Neuro Metabolism',
      icon: '✨',
      positionClass: 'top-1/2 -translate-y-1/2 right-2 sm:right-10',
    },
  ];

  return (
    <section id="nutrition-matrix" className="min-h-screen py-16 bg-[#F8F4EC] flex flex-col justify-center items-center relative overflow-hidden">
      
      {/* Title */}
      <div className="text-center mb-10 relative z-20">
        <h2 className="text-3xl sm:text-5xl font-black text-[#263D30] tracking-wider uppercase font-sans">
          ONE GLASS OF A2 EQUALS
        </h2>
        <p className="text-xs sm:text-sm text-[#302C26]/70 uppercase tracking-widest mt-1">
          A single 250ml morning glass delivers unmatched nutrient density
        </p>
      </div>

      {/* Desktop Layout: Radial Stage with Connecting Lines (hidden on mobile) */}
      <div className="hidden md:flex relative w-full max-w-4xl h-[520px] sm:h-[580px] items-center justify-center">
        
        {/* Subtle Radial Connecting Lines SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-[#C2A36C]/40 stroke-dasharray-[4_4]" strokeWidth="1.5">
          <line x1="50%" y1="50%" x2="22%" y2="18%" />
          <line x1="50%" y1="50%" x2="50%" y2="10%" />
          <line x1="50%" y1="50%" x2="78%" y2="18%" />
          <line x1="50%" y1="50%" x2="20%" y2="82%" />
          <line x1="50%" y1="50%" x2="50%" y2="90%" />
          <line x1="50%" y1="50%" x2="80%" y2="82%" />
          <line x1="50%" y1="50%" x2="10%" y2="50%" />
          <line x1="50%" y1="50%" x2="90%" y2="50%" />
        </svg>

        {/* Center: Glass of Fresh Milk */}
        <div className="relative z-10 w-52 h-52 sm:w-64 sm:h-64 rounded-full border-4 border-[#C2A36C]/50 bg-[#FAF6EE] shadow-2xl flex items-center justify-center p-3 group">
          {/* Top-Down Round Milk Glass Visual */}
          <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full border-4 border-[#D8C9AD] shadow-inner bg-[#F8F4EC] flex flex-col items-center justify-center text-center p-3 relative overflow-hidden">
            {/* Pure Milk Liquid Pool */}
            <div className="absolute inset-0 bg-radial from-[#ffffff] via-[#FAF6EE] to-[#EBE2D0] rounded-full" />
            
            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase text-[#C2A36C] tracking-widest block">
                Fresh Morning
              </span>
              <strong className="text-xl sm:text-2xl font-black text-[#263D30] block leading-none font-mono">
                250 ML
              </strong>
              <span className="text-[9px] font-bold text-[#A34F37] uppercase tracking-wider block mt-0.5">
                DUGDHSAR A2 MILK
              </span>
            </div>
          </div>
        </div>

        {/* Deep Forest Circular Badges Radiating in Radial Orbit */}
        {circles.map((item) => (
          <div
            key={item.id}
            className={`absolute z-20 flex flex-col items-center text-center cursor-pointer group ${item.positionClass}`}
          >
            {/* Deep Forest Circle Icon */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#263D30] text-[#FAF6EE] flex items-center justify-center shadow-lg border-2 border-[#FAF6EE] group-hover:scale-115 group-hover:bg-[#1A2B22] group-hover:border-[#C2A36C] transition-all duration-300">
              <span className="text-2xl">{item.icon}</span>
            </div>

            {/* Label Underneath */}
            <div className="mt-1.5 max-w-[110px]">
              <span className="text-[8px] font-black uppercase text-[#C2A36C] tracking-wider block font-bold">
                {item.nutrient}
              </span>
              <strong className="text-[10px] sm:text-[11px] font-black text-[#263D30] uppercase block leading-tight">
                {item.food}
              </strong>
              <span className="text-[8px] text-[#302C26]/70 block">
                {item.sub}
              </span>
            </div>
          </div>
        ))}

      </div>

      {/* Mobile Layout (md:hidden): Center Glass + 2-Column Responsive Cards */}
      <div className="md:hidden w-full px-4 flex flex-col items-center">
        {/* Center: Glass of Fresh Milk Emblem */}
        <div className="w-36 h-36 rounded-full border-4 border-[#C2A36C]/50 bg-[#FAF6EE] shadow-xl flex items-center justify-center p-2 mb-6">
          <div className="w-28 h-28 rounded-full border-2 border-[#D8C9AD] shadow-inner bg-[#F8F4EC] flex flex-col items-center justify-center text-center p-2 relative overflow-hidden">
            <span className="text-[9px] font-black uppercase text-[#C2A36C] tracking-widest block">
              Fresh Morning
            </span>
            <strong className="text-xl font-black text-[#263D30] block leading-none font-mono my-0.5">
              250 ML
            </strong>
            <span className="text-[8px] font-bold text-[#A34F37] uppercase tracking-wider block">
              DUGDHSAR A2
            </span>
          </div>
        </div>

        {/* 8 Nutrient Equivalencies in 2-Column Card Grid */}
        <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm">
          {circles.map((item) => (
            <div
              key={item.id}
              className="bg-[#FAF6EE] p-3 rounded-2xl border border-[#D8C9AD] shadow-sm flex flex-col items-center text-center space-y-1"
            >
              <div className="w-10 h-10 rounded-full bg-[#263D30] text-[#FAF6EE] flex items-center justify-center shadow-xs">
                <span className="text-lg">{item.icon}</span>
              </div>
              <span className="text-[9px] font-black uppercase text-[#C2A36C] tracking-wider block">
                {item.nutrient}
              </span>
              <strong className="text-[11px] font-black text-[#263D30] uppercase block leading-tight">
                {item.food}
              </strong>
              <span className="text-[9px] text-[#302C26]/70 block leading-tight">
                {item.sub}
              </span>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
};
