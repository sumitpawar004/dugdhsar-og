import React, { useState } from 'react';
import { Star, Quote, Sparkles, CheckCircle2 } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  city: string;
  rating: number;
  category: 'digestion' | 'kids' | 'taste';
  quote: string;
  userType: string;
}

export const TestimonialsSection: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'digestion' | 'kids' | 'taste'>('all');

  const testimonials: Testimonial[] = [
    {
      id: 't1',
      name: 'Dr. Ritika Mehrotra',
      city: 'DLF Phase 5, Gurugram',
      rating: 5,
      category: 'digestion',
      userType: 'Subscriber since 2021',
      quote: "I am lactose sensitive and hadn't been able to drink milk for almost 7 years due to severe bloating. Switching to Dugdhsar A2 Gir cow whole milk has been life-changing. No stomach cramps, no bloating at all. I can now drink warm golden turmeric milk every single evening without hesitation."
    },
    {
      id: 't2',
      name: 'Aditya & Neha Sharma',
      city: 'Greater Kailash II, New Delhi',
      rating: 5,
      category: 'kids',
      userType: 'Daily 2L Family Subscription',
      quote: "With young kids aged 4 and 8, commercial milk quality was our biggest parenting anxiety. Dugdhsar gives us complete peace of mind. The thick natural malai that forms on boiling makes the most heavenly homemade makhan, and our kids actually ask for a second glass before school."
    },
    {
      id: 't3',
      name: 'Chef Sanjeev B.',
      city: 'Bandra West, Mumbai',
      rating: 5,
      category: 'taste',
      userType: 'Artisanal Culinary Patron',
      quote: "The Vedic Bilona Ghee has that unmistakable granular danedar texture and nostalgic aroma of village curd churning. When heated, the smoking point is rock stable and the flavor profile elevates simple dal khichdi into a royal banquet."
    },
    {
      id: 't4',
      name: 'Meenakshi Sundaram',
      city: 'Indiranagar, Bangalore',
      rating: 5,
      category: 'digestion',
      userType: 'Daily 1L Subscription',
      quote: "The 7:00 AM delivery is punctually executed every morning. Chilled glass bottles with intact tamper seals. My acidity and acid reflux have vanished over the last 6 months. It tastes like real, pure, honest milk."
    }
  ];

  const filtered = testimonials.filter(t => filter === 'all' || t.category === filter);

  return (
    <section className="py-24 bg-[#F8F4EC] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 bg-[#FAF6EE] text-[#263D30] px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest mb-2 border border-[#D8C9AD]">
            <Sparkles className="w-3.5 h-3.5 text-[#C2A36C]" />
            <span>Section 10 • Real Family Experiences</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-[#263D30] tracking-tight">
            VERIFIED FAMILY TESTIMONIALS
          </h2>

          {/* Benefit Filter Pills */}
          <div className="flex items-center justify-center space-x-2 mt-6 flex-wrap gap-y-2">
            {[
              { id: 'all', label: 'All Reviews (4.9/5)' },
              { id: 'digestion', label: 'Digestion & Acidity' },
              { id: 'kids', label: 'Kids & Family Health' },
              { id: 'taste', label: 'Taste & Bilona Aroma' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  filter === tab.id
                    ? 'bg-[#263D30] text-[#FAF6EE] shadow-xs'
                    : 'bg-[#FAF6EE] text-[#302C26]/80 hover:bg-[#D8C9AD]/40 border border-[#D8C9AD]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map(t => (
            <div
              key={t.id}
              className="bg-[#FAF6EE] border border-[#D8C9AD] rounded-3xl p-7 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between relative group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-1 text-[#C2A36C]">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#C2A36C]" />
                    ))}
                  </div>
                  <Quote className="w-8 h-8 text-[#263D30]/10 group-hover:text-[#C2A36C]/40 transition-colors" />
                </div>

                <p className="text-sm text-[#302C26] leading-relaxed font-medium italic mb-6">
                  "{t.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-[#D8C9AD]/50 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-[#263D30] uppercase tracking-wide">
                    {t.name}
                  </h4>
                  <span className="text-[11px] text-[#302C26]/70 block">
                    {t.city} • <strong className="text-[#263D30] font-semibold">{t.userType}</strong>
                  </span>
                </div>
                <div className="w-7 h-7 rounded-full bg-[#263D30]/10 text-[#263D30] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
