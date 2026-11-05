import React, { useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/RouterContext';
import { formatPaise } from '../../types';
import { Search, Heart, ShoppingBag, ArrowRight } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const { products, searchQuery, setSearchQuery, addToCart, toggleWishlist, isInWishlist } = useStore();
  const { searchParams, navigate } = useRouter();

  // If query string ?q= exists, sync it
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && q !== searchQuery) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  const results = products.filter(p => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || 
           p.hindiName.toLowerCase().includes(q) || 
           p.description.toLowerCase().includes(q) ||
           p.categorySlug.toLowerCase().includes(q);
  });

  return (
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Search Input Hero */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h1 className="text-3xl font-serif text-[#263D30] font-normal mb-4">
            Search Dugdhsar Vedic Catalog
          </h1>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#302C26]/50" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, category, or ingredient (e.g. A2 milk, bilona ghee)..."
              className="w-full pl-12 pr-4 py-3.5 text-sm border-2 border-[#D8C9AD] rounded-2xl bg-[#FAF6EE] text-[#263D30] shadow-sm focus:outline-none focus:border-[#263D30]"
            />
          </div>
        </div>

        {/* Results Count */}
        {searchQuery.trim() && (
          <div className="mb-6 flex items-center justify-between text-xs text-[#302C26]/70">
            <span>Showing {results.length} results for "{searchQuery}"</span>
            <button 
              onClick={() => setSearchQuery('')}
              className="text-[#A34F37] hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Results Grid */}
        {results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {results.map((product) => {
              const inWishlist = isInWishlist(product.id);
              const defaultVariant = product.variants[0];

              return (
                <div 
                  key={product.id}
                  onClick={() => navigate(`/products/${product.slug}`)}
                  className="bg-[#FAF6EE] rounded-2xl border border-[#D8C9AD] overflow-hidden hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="relative bg-[#F8F4EC] h-64 flex items-center justify-center p-6">
                    <img 
                      src={product.images[0]?.imageUrl || '/assets/aistudio/image_fe6cbcdf.png'} 
                      alt={product.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#FAF6EE] text-[#302C26] hover:text-[#A34F37] flex items-center justify-center shadow-xs border border-[#D8C9AD]/50"
                    >
                      <Heart className={`w-3.5 h-3.5 ${inWishlist ? 'fill-[#A34F37] text-[#A34F37]' : ''}`} />
                    </button>
                  </div>

                  <div className="p-5">
                    <span className="text-[10px] uppercase font-bold text-[#A34F37] tracking-wider block mb-1">
                      {product.categorySlug}
                    </span>
                    <h3 className="font-serif text-lg text-[#263D30] font-semibold mb-1 group-hover:text-[#A34F37] transition-colors leading-tight">
                      {product.name}
                    </h3>
                    <p className="text-xs text-[#302C26]/70 line-clamp-2 mb-4">
                      {product.description}
                    </p>

                    <div className="pt-3 border-t border-[#D8C9AD]/40 flex items-center justify-between">
                      <span className="text-base font-bold font-mono text-[#263D30]">
                        {formatPaise(defaultVariant.pricePaise)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product, defaultVariant, 1);
                        }}
                        className="bg-[#263D30] text-[#FAF6EE] px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#1A2B22] flex items-center gap-1"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : searchQuery.trim() ? (
          <div className="py-20 text-center bg-[#FAF6EE] rounded-2xl border border-[#D8C9AD]">
            <p className="text-base font-serif text-[#263D30] mb-2">No matching products found</p>
            <p className="text-xs text-[#302C26]/70 mb-4">Try searching for "Milk", "Ghee", "Paneer", or "Curd"</p>
            <button
              onClick={() => navigate('/shop')}
              className="bg-[#263D30] text-[#FAF6EE] px-5 py-2 rounded-lg text-xs font-semibold"
            >
              Browse Full Shop
            </button>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-[#302C26]/60">
            Type in the search bar above to query live product inventory.
          </div>
        )}
      </div>
    </div>
  );
};
