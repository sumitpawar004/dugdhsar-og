import React from 'react';
import { Bottle360Viewer } from './Bottle360Viewer';
import { useStore } from '../context/StoreContext';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export const StartDaySection: React.FC = () => {
  const { setIsSubscriptionModalOpen } = useStore();

  const handleOrder = () => {
    setIsSubscriptionModalOpen(true);
  };

  return (
    <section id="start-day" className="min-h-screen py-16 bg-[#F8F4EC] flex flex-col justify-center items-center relative overflow-hidden">
      
      {/* Background Breakfast Table Photo */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=80')`
        }}
      />

      {/* Title from Video 00:43: "START YOUR DAY WITH DUGDHSAR'S FRESH & HEALTHY A2 MILK" */}
      <div className="text-center mb-6 relative z-20 px-4">
        <h2 className="text-3xl sm:text-5xl font-black text-[#263D30] tracking-wider uppercase font-sans max-w-3xl mx-auto leading-tight">
          START YOUR DAY WITH <br />
          DUGDHSAR'S FRESH & HEALTHY A2 MILK
        </h2>
        <p className="text-xs sm:text-sm text-[#302C26]/80 uppercase tracking-widest mt-2">
          Natural nutrition delivered to your doorstep before the morning sun
        </p>
      </div>

      {/* Central Stage with Bottle Resting on Breakfast Table */}
      <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
        <Bottle360Viewer isDocked={true} className="transform scale-95 sm:scale-105" showControls={false} showDragBadge={false} />
        
        <div className="pointer-events-auto mt-4">
          <button
            onClick={handleOrder}
            className="px-8 py-3 bg-[#263D30] hover:bg-[#1e3026] text-[#FAF6EE] text-xs font-bold uppercase tracking-wider rounded-full shadow-lg transition-all active:scale-95 flex items-center space-x-2"
          >
            <ShoppingBag className="w-4 h-4 text-[#C2A36C]" />
            <span>Order Fresh Morning Milk</span>
          </button>
        </div>
      </div>

    </section>
  );
};
