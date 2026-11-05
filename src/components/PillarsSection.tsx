import React, { useState } from 'react';
import { Bottle360Viewer } from './Bottle360Viewer';
import { ChevronLeft, ChevronRight, Sparkles, Leaf, ShieldCheck, Home, Milk, Check } from 'lucide-react';

export const PillarsSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const bannerSlides = [
    {
      title: 'WONDERING WHAT IS A2?',
      subtitle: 'Pure Indigenous Indian Cow Milk With Non-Inflammatory A2 Beta-Casein',
      image: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=80', // Beautiful cows grazing in meadow
    },
    {
      title: 'ANCIENT VEDIC AHIMSA CARE',
      subtitle: 'Calves Fed First • 100% Hormone-Free Grass-Fed Sacred Cattle',
      image: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=1200&q=80',
    }
  ];

  const handleNext = () => setCurrentSlide(prev => (prev + 1) % bannerSlides.length);
  const handlePrev = () => setCurrentSlide(prev => (prev - 1 + bannerSlides.length) % bannerSlides.length);

  return (
    <section id="why-a2" className="min-h-screen py-10 bg-[#F8F4EC] flex flex-col justify-center items-center relative overflow-hidden">
      
      {/* Top Banner Image with Grazing Cow and Title + Arrows */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 mb-8">
        <div className="relative rounded-3xl overflow-hidden h-60 sm:h-72 shadow-lg border border-[#C2A36C]/30">
          <img
            src={bannerSlides[currentSlide].image}
            alt="Cows grazing on grass"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#263D30]/60 flex flex-col items-center justify-center text-center p-6 text-[#FAF6EE]">
            <h2 className="text-3xl sm:text-5xl font-black tracking-wider uppercase font-sans drop-shadow-md text-[#FAF6EE]">
              {bannerSlides[currentSlide].title}
            </h2>
            <p className="text-xs sm:text-sm font-semibold tracking-wide text-[#FAF6EE]/90 mt-2 max-w-xl">
              {bannerSlides[currentSlide].subtitle}
            </p>
          </div>

          {/* Left / Right Carousel Arrows */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#FAF6EE]/70 hover:bg-[#FAF6EE] text-[#263D30] flex items-center justify-center backdrop-blur-md transition-all shadow-md"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#FAF6EE]/70 hover:bg-[#FAF6EE] text-[#263D30] flex items-center justify-center backdrop-blur-md transition-all shadow-md"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Desktop Stage: Circular Icons Flanking the Central Bottle */}
      <div className="hidden md:flex relative w-full max-w-5xl h-[480px] items-center justify-center px-4">
        
        {/* Left Side 3 Circular Icons */}
        <div className="absolute left-4 sm:left-12 inset-y-0 flex flex-col justify-around py-4 z-20">
          {/* Icon 1: Local Farm */}
          <div className="flex items-center space-x-3 cursor-pointer group">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[#D8C9AD] bg-[#FAF6EE] flex items-center justify-center shadow-xs group-hover:border-[#263D30] group-hover:scale-105 transition-all">
              <span className="font-serif italic font-bold text-lg text-[#263D30]">Local</span>
            </div>
            <div className="text-left">
              <strong className="text-xs font-black text-[#263D30] uppercase block">Local Farm</strong>
              <span className="text-[10px] text-[#302C26]/70">Sukla Gaushala, Seoni</span>
            </div>
          </div>

          {/* Icon 2: 100% Natural */}
          <div className="flex items-center space-x-3 cursor-pointer group">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[#D8C9AD] bg-[#FAF6EE] flex items-center justify-center shadow-xs group-hover:border-[#263D30] group-hover:scale-105 transition-all text-[#263D30]">
              <Leaf className="w-6 h-6 text-[#263D30]" />
            </div>
            <div className="text-left">
              <strong className="text-xs font-black text-[#263D30] uppercase block">100% Natural</strong>
              <span className="text-[10px] text-[#302C26]/70">Unadulterated Raw</span>
            </div>
          </div>

          {/* Icon 3: Safe for Direct Consumption */}
          <div className="flex items-center space-x-3 cursor-pointer group">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[#D8C9AD] bg-[#FAF6EE] flex items-center justify-center shadow-xs group-hover:border-[#263D30] group-hover:scale-105 transition-all text-[#A34F37]">
              <Milk className="w-6 h-6 text-[#A34F37]" />
            </div>
            <div className="text-left">
              <strong className="text-xs font-black text-[#263D30] uppercase block">Direct Consumption</strong>
              <span className="text-[10px] text-[#302C26]/70">Pure A2 Certified</span>
            </div>
          </div>
        </div>

        {/* Center: Glass Milk Bottle Standing Tall + "Read More" button beneath it */}
        <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
          <Bottle360Viewer className="transform scale-85 sm:scale-95" showControls={false} showDragBadge={false} />
          
          <button
            onClick={() => {
              document.getElementById('why-love')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="pointer-events-auto mt-2 px-6 py-2 bg-[#263D30] hover:bg-[#1A2B22] text-[#FAF6EE] text-xs font-bold uppercase tracking-wider rounded-full shadow-md transition-all active:scale-95 border border-[#C2A36C]/40"
          >
            Read More
          </button>
        </div>

        {/* Right Side 3 Circular Icons */}
        <div className="absolute right-4 sm:right-12 inset-y-0 flex flex-col justify-around py-4 z-20 text-right">
          {/* Icon 4: Direct Doorstep */}
          <div className="flex items-center space-x-3 flex-row-reverse cursor-pointer group">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[#D8C9AD] bg-[#FAF6EE] flex items-center justify-center shadow-xs group-hover:border-[#263D30] group-hover:scale-105 transition-all text-[#C2A36C]">
              <Home className="w-6 h-6 text-[#C2A36C]" />
            </div>
            <div className="text-right pr-3">
              <strong className="text-xs font-black text-[#263D30] uppercase block">Direct Doorstep</strong>
              <span className="text-[10px] text-[#302C26]/70">Seoni Cold-Chain</span>
            </div>
          </div>

          {/* Icon 5: No Hormones */}
          <div className="flex items-center space-x-3 flex-row-reverse cursor-pointer group">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[#D8C9AD] bg-[#FAF6EE] flex items-center justify-center shadow-xs group-hover:border-[#263D30] group-hover:scale-105 transition-all text-[#A34F37]">
              <ShieldCheck className="w-6 h-6 text-[#A34F37]" />
            </div>
            <div className="text-right pr-3">
              <strong className="text-xs font-black text-[#263D30] uppercase block">Zero Hormones</strong>
              <span className="text-[10px] text-[#302C26]/70">0% Oxytocin</span>
            </div>
          </div>

          {/* Icon 6: Sterile Glass Bottles */}
          <div className="flex items-center space-x-3 flex-row-reverse cursor-pointer group">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[#D8C9AD] bg-[#FAF6EE] flex items-center justify-center shadow-xs group-hover:border-[#263D30] group-hover:scale-105 transition-all text-[#C2A36C]">
              <Sparkles className="w-6 h-6 text-[#C2A36C]" />
            </div>
            <div className="text-right pr-3">
              <strong className="text-xs font-black text-[#263D30] uppercase block">Glass Bottles</strong>
              <span className="text-[10px] text-[#302C26]/70">100% Recyclable</span>
            </div>
          </div>
        </div>

      </div>

      {/* Mobile Stage (< md): Bottle with 2-Column Clean Pillar Cards */}
      <div className="md:hidden w-full px-4 flex flex-col items-center">
        {/* Center Bottle */}
        <div className="flex flex-col items-center justify-center mb-6">
          <Bottle360Viewer className="transform scale-80" showControls={false} showDragBadge={false} />
          <button
            onClick={() => {
              document.getElementById('why-love')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="mt-2 px-6 py-2 bg-[#263D30] hover:bg-[#1A2B22] text-[#FAF6EE] text-xs font-bold uppercase tracking-wider rounded-full shadow-md border border-[#C2A36C]/40"
          >
            Read More
          </button>
        </div>

        {/* 6 Clean Pillar Cards Grid for Mobile */}
        <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm">
          {[
            { title: 'Local Farm', sub: 'Sukla Gaushala, Seoni', icon: <span className="font-serif italic font-bold text-xs text-[#263D30]">Local</span> },
            { title: '100% Natural', sub: 'Unadulterated Raw', icon: <Leaf className="w-4 h-4 text-[#263D30]" /> },
            { title: 'Direct Use', sub: 'Pure A2 Certified', icon: <Milk className="w-4 h-4 text-[#A34F37]" /> },
            { title: 'Doorstep Drop', sub: 'Seoni Cold-Chain', icon: <Home className="w-4 h-4 text-[#C2A36C]" /> },
            { title: 'Zero Hormones', sub: '0% Oxytocin', icon: <ShieldCheck className="w-4 h-4 text-[#A34F37]" /> },
            { title: 'Glass Bottles', sub: '100% Recyclable', icon: <Sparkles className="w-4 h-4 text-[#C2A36C]" /> },
          ].map((item, i) => (
            <div key={i} className="p-3 rounded-2xl bg-[#FAF6EE] border border-[#D8C9AD] flex items-center space-x-2.5 shadow-xs">
              <div className="w-8 h-8 rounded-full bg-[#F8F4EC] border border-[#D8C9AD] flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div className="overflow-hidden">
                <strong className="text-[11px] font-bold text-[#263D30] block truncate">{item.title}</strong>
                <span className="text-[9px] text-[#302C26]/70 block truncate">{item.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
};
