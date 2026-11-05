import React from 'react';
import { useStore } from '../context/StoreContext';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface SplitProduct {
  id: string;
  variantId: string;
  name: string;
  pack: string;
  price: number;
  bgColor: string;
  image: string;
}

export const ProductsSplitSection: React.FC = () => {
  const { products, addToCart, setIsCartOpen } = useStore();

  const splitItems: SplitProduct[] = [
    {
      id: 'dug-malai-paneer',
      variantId: 'mp-200g',
      name: 'A2 PANEER',
      pack: '(200 GM)',
      price: 190,
      bgColor: 'bg-[#E8EFEA]', // Deep forest organic tint
      image: '/assets/aistudio/1000095624-clean_337007be.png',
    },
    {
      id: 'dug-bilona-ghee',
      variantId: 'bg-1l',
      name: 'A2 GHEE',
      pack: '(1 L)',
      price: 2398,
      bgColor: 'bg-[#FAF2DF]', // Antique gold soft glow
      image: '/assets/aistudio/1000095624-clean_337007be.png',
    },
    {
      id: 'dug-whole-milk',
      variantId: 'wm-1l',
      name: 'A2 WHOLE PASTEURIZED MILK',
      pack: '(1 L)',
      price: 170,
      bgColor: 'bg-[#F5EBE6]', // Terracotta gentle wash
      image: '/assets/aistudio/image_fe6cbcdf.png',
    },
    {
      id: 'dug-skimmed-milk',
      variantId: 'sm-1l',
      name: 'A2 SKIMMED MILK',
      pack: '(1 L)',
      price: 110,
      bgColor: 'bg-[#F1E8DC]', // Soft sand secondary surface
      image: '/assets/aistudio/image_fe6cbcdf.png',
    },
    {
      id: 'dug-bilona-ghee',
      variantId: 'bg-500ml',
      name: 'A2 GHEE',
      pack: '(500 ML)',
      price: 1199,
      bgColor: 'bg-[#FAF6EE]', // Warm cream card
      image: '/assets/aistudio/1000095624-clean_337007be.png',
    },
  ];

  const handleQuickAdd = (item: SplitProduct) => {
    const p = products.find(prod => prod.id === item.id);
    if (p) {
      const v = p.variants.find(varnt => varnt.id === item.variantId) || p.variants[0];
      addToCart(p, v, 1);
    }
  };

  const scrollToCatalog = () => {
    document.getElementById('products-catalog')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="products-split" className="min-h-screen py-12 bg-[#F8F4EC] flex flex-col justify-center relative overflow-hidden">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Main Columns Container + Vertical "P R O D U C T S" Word on Right */}
        <div className="relative flex items-stretch border border-[#D8C9AD] shadow-md rounded-3xl overflow-hidden min-h-[580px]">
          
          {/* 5 Vertical Product Panels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 flex-1">
            {splitItems.map((item, idx) => (
              <div
                key={idx}
                className={`${item.bgColor} p-6 flex flex-col justify-between items-center text-center border-r border-[#D8C9AD]/40 transition-all duration-300 hover:brightness-95 group relative`}
              >
                {/* Product Title at top */}
                <div className="pt-4">
                  <h3 className="text-sm sm:text-base font-black text-[#263D30] tracking-wider leading-snug uppercase">
                    {item.name}
                  </h3>
                  <span className="text-xs font-bold text-[#302C26]/75 block mt-0.5">
                    {item.pack}
                  </span>
                </div>

                {/* Product Packaging Image in Center */}
                <div className="my-6 w-36 h-48 sm:w-40 sm:h-56 flex items-center justify-center transform transition-transform duration-500 group-hover:scale-110">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="max-w-full max-h-full object-contain drop-shadow-xl"
                  />
                </div>

                {/* Price & Action Button at bottom */}
                <div className="w-full pb-4 space-y-2">
                  <div className="text-base font-black text-[#263D30] font-mono">
                    Rs. {item.price}
                  </div>

                  <div className="flex flex-col gap-1.5 w-full">
                    <button
                      onClick={() => handleQuickAdd(item)}
                      className="w-full py-2 bg-[#263D30] hover:bg-[#1A2B22] text-[#FAF6EE] font-bold text-[11px] uppercase tracking-wider rounded-full shadow-sm transition-all active:scale-95 flex items-center justify-center space-x-1"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-[#C2A36C]" />
                      <span>Add to Cart</span>
                    </button>
                    <button
                      onClick={scrollToCatalog}
                      className="text-[10px] font-bold text-[#A34F37] hover:underline"
                    >
                      View More
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Vertical "P R O D U C T S" Typography on Far Right */}
          <div className="hidden lg:flex w-20 bg-[#FAF6EE] items-center justify-center border-l border-[#D8C9AD]">
            <div className="flex flex-col items-center justify-between h-4/5 text-[#263D30] font-black text-2xl tracking-[0.3em] font-sans">
              <span>P</span>
              <span>R</span>
              <span>O</span>
              <span>D</span>
              <span>U</span>
              <span>C</span>
              <span>T</span>
              <span>S</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
