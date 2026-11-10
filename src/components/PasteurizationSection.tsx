import React from 'react';
import { Bottle360Viewer } from './Bottle360Viewer';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export const PasteurizationSection: React.FC = () => {
  return (
    <section id="pasteurization" className="min-h-screen py-16 bg-[#F8F4EC] flex flex-col justify-center items-center relative overflow-hidden">
      
      {/* Title */}
      <div className="text-center mb-8 relative z-20">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#263D30] tracking-wider uppercase font-sans">
          IN HOUSE PASTEURIZATION FACILITY
        </h2>
        <p className="text-xs text-[#302C26]/70 uppercase tracking-widest mt-1">
          Low-temperature gentle vat holding preserving natural live enzymes
        </p>
      </div>

      {/* Main Diagram Stage */}
      {/* Desktop Layout (md and up) */}
      <div className="hidden md:flex relative w-full max-w-5xl h-[520px] sm:h-[580px] bg-[#FAF6EE] rounded-3xl border border-[#D8C9AD] shadow-xl overflow-hidden items-center justify-center p-6">
        
        {/* Background Grayscale Industrial Dairy Tanks Image / Silhouette */}
        <div 
          className="absolute inset-0 opacity-10 grayscale pointer-events-none bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?auto=format&fit=crop&w=1200&q=80')`
          }}
        />

        {/* Schematic Technical Flow Piping SVG Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 600">
          <defs>
            <linearGradient id="pipeFlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#263D30" />
              <stop offset="50%" stopColor="#C2A36C" />
              <stop offset="100%" stopColor="#263D30" />
            </linearGradient>
          </defs>

          {/* Left Vat to Bottle Piping */}
          <path
            d="M 160 300 
               L 360 300 
               L 360 220 
               L 420 220"
            fill="none"
            stroke="#263D30"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Right Cooling Coil Piping */}
          <path
            d="M 580 220 
               L 640 220 
               L 640 380 
               L 670 380 
               L 670 220 
               L 700 220 
               L 700 380 
               L 730 380 
               L 730 220 
               L 820 220 
               L 820 300"
            fill="none"
            stroke="#263D30"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Flow Direction Pulse Dots */}
          <circle cx="260" cy="300" r="4" fill="#C2A36C" className="animate-ping" />
          <circle cx="715" cy="300" r="4" fill="#C2A36C" className="animate-ping" />
        </svg>

        {/* Left Side Info Box */}
        <div className="absolute left-6 sm:left-12 top-1/2 -translate-y-1/2 z-20 max-w-[220px] sm:max-w-xs bg-[#FAF6EE]/95 backdrop-blur-md p-4 rounded-2xl border border-[#D8C9AD] shadow-md">
          <div className="w-8 h-8 rounded-lg bg-[#263D30] text-[#FAF6EE] flex items-center justify-center font-bold text-xs mb-2">
            01
          </div>
          <h4 className="text-xs sm:text-sm font-black text-[#263D30] uppercase tracking-wider leading-snug">
            PASTEURIZATION FOR PRESERVING RAW MILK
          </h4>
          <p className="text-[10px] sm:text-xs text-[#302C26]/75 mt-1 leading-relaxed">
            Gentle 63°C VAT holding destroys harmful bacteria while keeping 100% of delicate enzymes and probiotics intact.
          </p>
        </div>

        {/* Center: The Glass Milk Bottle Standing in Flow Path */}
        <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
          <Bottle360Viewer className="transform scale-90 sm:scale-100" showControls={false} showDragBadge={false} />
        </div>

        {/* Right Side Info Box */}
        <div className="absolute right-6 sm:right-12 top-1/2 -translate-y-1/2 z-20 max-w-[220px] sm:max-w-xs bg-[#FAF6EE]/95 backdrop-blur-md p-4 rounded-2xl border border-[#D8C9AD] shadow-md text-right">
          <div className="w-8 h-8 rounded-lg bg-[#A34F37] text-[#FAF6EE] flex items-center justify-center font-bold text-xs mb-2 ml-auto">
            02
          </div>
          <h4 className="text-xs sm:text-sm font-black text-[#263D30] uppercase tracking-wider leading-snug">
            CHILLED AT 4°C FOR DOORSTEP FRESHNESS
          </h4>
          <p className="text-[10px] sm:text-xs text-[#302C26]/75 mt-1 leading-relaxed">
            Instant shock chilling stops any fermentation, sealed in sterilized glass bottles for morning distribution.
          </p>
        </div>

        {/* Bottom Tagline */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-[#263D30] text-[#FAF6EE] px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md border border-[#C2A36C]/40">
          IN HOUSE FACILITY FOR UNMATCHED PURITY
        </div>

      </div>

      {/* Mobile Flow (md:hidden) - Clean stacked cards without overlapping */}
      <div className="md:hidden w-full px-4 flex flex-col items-center space-y-4">
        {/* Step 01 Card */}
        <div className="w-full bg-[#FAF6EE] p-4 rounded-2xl border border-[#D8C9AD] shadow-md">
          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="w-6 h-6 rounded-md bg-[#263D30] text-[#FAF6EE] flex items-center justify-center font-bold text-xs">
              01
            </span>
            <h4 className="text-xs font-black text-[#263D30] uppercase tracking-wider">
              Pasteurization for Raw Milk
            </h4>
          </div>
          <p className="text-[11px] text-[#302C26]/80 leading-relaxed">
            Gentle 63°C VAT holding destroys harmful bacteria while keeping 100% of delicate enzymes and probiotics intact.
          </p>
        </div>

        {/* Center Bottle */}
        <div className="my-2 flex justify-center w-full">
          <Bottle360Viewer className="transform scale-90" showControls={false} showDragBadge={false} />
        </div>

        {/* Step 02 Card */}
        <div className="w-full bg-[#FAF6EE] p-4 rounded-2xl border border-[#D8C9AD] shadow-md">
          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="w-6 h-6 rounded-md bg-[#A34F37] text-[#FAF6EE] flex items-center justify-center font-bold text-xs">
              02
            </span>
            <h4 className="text-xs font-black text-[#263D30] uppercase tracking-wider">
              Chilled at 4°C for Freshness
            </h4>
          </div>
          <p className="text-[11px] text-[#302C26]/80 leading-relaxed">
            Instant shock chilling stops any fermentation, sealed in sterilized glass bottles for morning distribution.
          </p>
        </div>

        {/* Mobile Tagline */}
        <div className="bg-[#263D30] text-[#FAF6EE] px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider text-center shadow-sm border border-[#C2A36C]/40">
          In House Facility for Unmatched Purity
        </div>
      </div>

    </section>
  );
};
