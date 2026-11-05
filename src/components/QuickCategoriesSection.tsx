import React from 'react';
import { useRouter } from '../router/RouterContext';
import { ArrowRight, Sparkles, Milk, Heart, Flame, ShieldCheck } from 'lucide-react';

interface CategoryCard {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  slug: string;
  badge: string;
  image: string;
  colorAccent: string;
}

export const QuickCategoriesSection: React.FC = () => {
  const { navigate } = useRouter();

  const categories: CategoryCard[] = [
    {
      id: 'cat-milk',
      category: 'A2 Desi Cow Milk',
      title: 'A2 Desi Cow Milk',
      subtitle: 'Daily fresh, doorstep delivery',
      slug: 'milk',
      badge: 'Farm Morning Chilled',
      image: '/assets/aistudio/1000095715-clean_c92aa3a9.png',
      colorAccent: '#263D30'
    },
    {
      id: 'cat-curd',
      category: 'A2 Curd',
      title: 'Curd (Dahi)',
      subtitle: 'Cultured, creamy, natural',
      slug: 'curd',
      badge: 'Terracotta Pot Set',
      image: '/assets/aistudio/1000095624-clean_337007be.png',
      colorAccent: '#C2A36C'
    },
    {
      id: 'cat-paneer',
      category: 'Paneer',
      title: 'Paneer',
      subtitle: 'Soft, fresh, high-protein',
      slug: 'paneer',
      badge: 'Hand-Pressed Malai',
      image: '/assets/aistudio/1000095664-clean_2425f7fb.png',
      colorAccent: '#A34F37'
    },
    {
      id: 'cat-ghee',
      category: 'A2 Ghee',
      title: 'A2 Ghee',
      subtitle: 'Traditional bilona method',
      slug: 'ghee',
      badge: 'Slow Fire Clarified',
      image: '/assets/aistudio/1000095662-clean_7d12ecae.png',
      colorAccent: '#C2A36C'
    }
  ];

  return (
    <section id="quick-categories" className="py-20 bg-[#F8F4EC] border-t border-[#D8C9AD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-0.5 bg-[#A34F37]" />
              <span className="text-xs uppercase tracking-[0.25em] text-[#A34F37] font-bold">
                Direct From Gaushala
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#263D30] font-normal tracking-tight">
              Explore Quick Categories
            </h2>
            <p className="text-xs sm:text-sm text-[#302C26]/75 mt-2 max-w-xl">
              Fresh unadulterated dairy from pure-bred Gir cows, delivered across active cold-chain zones before 11:00 AM.
            </p>
          </div>

          <button
            onClick={() => navigate('/shop')}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#263D30] hover:text-[#A34F37] transition-colors py-2 px-4 rounded-full border border-[#D8C9AD] hover:border-[#263D30] bg-[#FAF6EE] shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
          >
            <span>See All</span>
            <ArrowRight className="w-4 h-4 text-[#A34F37]" />
          </button>
        </div>

        {/* 4 Quick Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/collections/${item.slug}`)}
              className="bg-[#FAF6EE] rounded-2xl border border-[#D8C9AD] hover:border-[#263D30] p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer group relative overflow-hidden"
            >
              {/* Top Accent Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#A34F37] bg-[#A34F37]/10 px-2.5 py-1 rounded-md border border-[#A34F37]/20">
                  {item.badge}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#302C26]/60 font-semibold font-mono">
                  {item.category}
                </span>
              </div>

              {/* Product Visual Presentation */}
              <div className="relative h-48 w-full my-3 flex items-center justify-center rounded-xl bg-[#F8F4EC] border border-[#D8C9AD]/60 overflow-hidden p-3">
                <img
                  src={item.image}
                  alt={item.title}
                  className="max-h-full max-w-full object-contain group-hover:scale-108 transition-transform duration-500 drop-shadow-md"
                />
              </div>

              {/* Text Info */}
              <div className="mt-4 pt-2 border-t border-[#D8C9AD]/50">
                <h3 className="font-serif text-xl font-bold text-[#263D30] group-hover:text-[#A34F37] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-[#302C26]/75 mt-1 font-medium">
                  {item.subtitle}
                </p>

                <div className="mt-4 flex items-center justify-between pt-2">
                  <span className="text-xs font-bold text-[#263D30] group-hover:text-[#A34F37] transition-colors flex items-center gap-1.5">
                    <span>Shop Fresh</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="text-[10px] font-semibold text-[#C2A36C] uppercase tracking-wider">
                    Cold-Chain
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
