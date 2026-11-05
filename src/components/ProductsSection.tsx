import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useRouter } from '../router/RouterContext';
import { Product, formatPaise } from '../types';
import { ShoppingBag, Search, Check, Eye, Star } from 'lucide-react';

export const ProductsSection: React.FC = () => {
  const { 
    products, 
    addToCart, 
    selectedCategory, 
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    setIsCartOpen
  } = useStore();

  const { navigate } = useRouter();
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const circularCategories = [
    { id: 'all', label: 'ALL PROVISIONS', icon: '🥛' },
    { id: 'milk', label: 'A2 MILK', icon: '🥛' },
    { id: 'ghee', label: 'BILONA GHEE', icon: '🏺' },
    { id: 'paneer-curd', label: 'PANEER & DAHI', icon: '🧀' },
    { id: 'sweets', label: 'VEDIC SWEETS', icon: '🍯' },
  ];

  const filtered = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.categorySlug === selectedCategory;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, product.variants[0], 1);
    setJustAddedId(product.id);
    setTimeout(() => setJustAddedId(null), 1500);
  };

  return (
    <section id="products-catalog" className="py-10 sm:py-20 bg-[#F8F4EC] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header with Circular Icons */}
        <div className="flex flex-col items-center justify-center mb-8 sm:mb-12">
          
          <div className="flex items-center justify-center space-x-4 sm:space-x-6 overflow-x-auto pb-4 max-w-full scrollbar-none">
            {circularCategories.map((cat) => {
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="flex flex-col items-center group cursor-pointer shrink-0"
                >
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl transition-all shadow-xs ${
                    isSelected
                      ? 'bg-[#263D30] text-[#FAF6EE] scale-110 shadow-md ring-4 ring-[#C2A36C]/40'
                      : 'bg-[#263D30] text-[#FAF6EE] opacity-85 hover:opacity-100 hover:scale-105'
                  }`}>
                    {cat.icon}
                  </div>

                  <span className={`text-[10px] sm:text-[11px] font-bold tracking-wider uppercase mt-2.5 ${
                    isSelected ? 'text-[#263D30] underline underline-offset-4 decoration-2' : 'text-[#302C26]/70'
                  }`}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="w-full max-w-md mt-6 relative">
            <Search className="w-4 h-4 text-[#A34F37] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Dugdhsar A2 dairy, ghee, paneer..."
              className="w-full bg-[#FAF6EE] border border-[#D8C9AD] rounded-full pl-10 pr-4 py-2.5 text-xs text-[#263D30] outline-none focus:border-[#263D30] focus:ring-1 focus:ring-[#263D30] transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((product) => {
            const v = product.variants[0];
            const isAdded = justAddedId === product.id;

            return (
              <div
                key={product.id}
                onClick={() => navigate(`/products/${product.slug}`)}
                className="bg-[#FAF6EE] rounded-2xl border border-[#D8C9AD] p-5 flex flex-col justify-between text-center shadow-xs hover:shadow-xl transition-all duration-300 group cursor-pointer"
              >
                {/* Product Image */}
                <div className="w-full h-44 flex items-center justify-center my-2 p-2 bg-[#F8F4EC] border border-[#D8C9AD]/40 rounded-xl">
                  <img
                    src={product.images[0]?.imageUrl || '/assets/aistudio/image_fe6cbcdf.png'}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain transform group-hover:scale-105 transition-transform duration-300 drop-shadow-sm"
                  />
                </div>

                {/* Title & Price */}
                <div className="my-2 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-[#A34F37] tracking-wider">
                    {product.categorySlug}
                  </div>
                  <h4 className="text-xs sm:text-sm font-serif font-bold text-[#263D30] leading-snug line-clamp-2">
                    {product.name}
                  </h4>
                  <div className="text-sm font-bold text-[#263D30] font-mono tabular-nums">
                    {formatPaise(v.pricePaise)}
                  </div>
                </div>

                {/* Two Action Buttons: "View Details" and "Add" */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#D8C9AD]/40">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/products/${product.slug}`);
                    }}
                    className="py-1.5 px-2 bg-[#FAF6EE] hover:bg-[#F3EDE1] text-[#263D30] border border-[#D8C9AD] text-[11px] font-semibold rounded-lg transition-all"
                  >
                    View
                  </button>

                  <button
                    onClick={(e) => handleAddToCart(product, e)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all text-[#FAF6EE] flex items-center justify-center space-x-1 ${
                      isAdded 
                        ? 'bg-emerald-700' 
                        : 'bg-[#263D30] hover:bg-[#1A2B22] shadow-xs active:scale-95'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5 text-[#C2A36C]" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
