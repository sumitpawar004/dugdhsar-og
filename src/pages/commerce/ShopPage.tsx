import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/RouterContext';
import { formatPaise, Product, ProductVariant } from '../../types';
import { Search, SlidersHorizontal, Heart, ShoppingBag, Check, Star } from 'lucide-react';

export const ShopPage: React.FC = () => {
  const { 
    products, 
    categories, 
    addToCart, 
    toggleWishlist, 
    isInWishlist, 
    searchQuery, 
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy
  } = useStore();

  const { navigate } = useRouter();

  // Selected variant state per product { [productId]: variantId }
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  // Active filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Category filter
      if (selectedCategory !== 'all' && product.categorySlug !== selectedCategory) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesHindi = product.hindiName?.toLowerCase().includes(q);
        const matchesDesc = product.description.toLowerCase().includes(q);
        if (!matchesName && !matchesHindi && !matchesDesc) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      const getMinPrice = (p: Product) => Math.min(...p.variants.map(v => v.pricePaise));
      if (sortBy === 'price-low') {
        return getMinPrice(a) - getMinPrice(b);
      }
      if (sortBy === 'price-high') {
        return getMinPrice(b) - getMinPrice(a);
      }
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      return 0; // featured default
    });
  }, [products, selectedCategory, searchQuery, sortBy]);

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const activeVariantId = selectedVariants[product.id] || product.variants[0].id;
    const variant = product.variants.find(v => v.id === activeVariantId) || product.variants[0];
    addToCart(product, variant, 1);

    setAddedNotice(`${product.name} (${variant.sizeLabel}) added to bag`);
    setTimeout(() => setAddedNotice(null), 2500);
  };

  return (
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[#302C26]/70 mb-6">
          <button 
            onClick={() => navigate('/')}
            className="hover:text-[#A34F37] transition-colors cursor-pointer"
          >
            Home
          </button>
          <span>/</span>
          <span className="text-[#A34F37] font-bold">All Products</span>
        </div>

        {/* Landscape Hero Banner (Inspired by Dairy Mockup) */}
        <div className="relative rounded-3xl overflow-hidden mb-8 border border-[#D8C9AD] shadow-md bg-[#263D30] text-[#FAF6EE]">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-25"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1600&q=80')`
            }}
          />
          <div className="relative z-10 p-6 sm:p-12 max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C2A36C]/30 text-[#FAF6EE] text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-3 border border-[#C2A36C]/40">
              <span className="w-2 h-2 rounded-full bg-[#C2A36C]" />
              <span>Direct From Gaushala · Seoni, MP</span>
            </span>
            <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#FAF6EE] tracking-tight mb-3">
              All Dairy Products
            </h1>
            <p className="text-xs sm:text-sm text-[#FAF6EE]/85 leading-relaxed font-sans max-w-lg">
              Fresh unadulterated dairy from pure-bred indigenous Gir cows. Bottled raw and cold-dispatched daily before 11:00 AM across Seoni and regional routes.
            </p>
          </div>
        </div>

        {/* Filter and Control Bar */}
        <div className="bg-[#FAF6EE]/90 backdrop-blur-md p-4 rounded-2xl border border-[#D8C9AD] mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Category Tabs (Interactive Segmented Buttons) */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === 'all' 
                  ? 'bg-[#263D30] text-[#FAF6EE]' 
                  : 'text-[#302C26] hover:bg-[#D8C9AD]/30'
              }`}
            >
              All Provisions
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === cat.slug 
                    ? 'bg-[#263D30] text-[#FAF6EE]' 
                    : 'text-[#302C26] hover:bg-[#D8C9AD]/30'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#302C26]/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search A2 milk, ghee..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#D8C9AD] rounded-lg bg-[#F8F4EC] text-[#302C26] placeholder-[#302C26]/40 focus:outline-none focus:border-[#263D30]"
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs border border-[#D8C9AD] rounded-lg bg-[#F8F4EC] text-[#302C26] focus:outline-none focus:border-[#263D30]"
            >
              <option value="featured">Curated & Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Feedback Alert */}
        {addedNotice && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#263D30] text-[#FAF6EE] px-5 py-3 rounded-xl shadow-xl border border-[#C2A36C] text-xs flex items-center gap-2.5 animate-bounce">
            <Check className="w-4 h-4 text-[#C2A36C]" />
            <span>{addedNotice}</span>
          </div>
        )}

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-24 text-center bg-[#FAF6EE] rounded-2xl border border-[#D8C9AD]">
            <p className="text-base font-serif text-[#263D30] mb-2">No provisions match your search</p>
            <p className="text-xs text-[#302C26]/70 mb-4">Try clearing your filters or search terms</p>
            <button
              onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
              className="bg-[#263D30] text-[#FAF6EE] px-5 py-2 rounded-lg text-xs font-semibold hover:bg-[#1A2B22] transition-colors"
            >
              View All Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => {
              const activeVariantId = selectedVariants[product.id] || product.variants[0].id;
              const activeVariant = product.variants.find(v => v.id === activeVariantId) || product.variants[0];
              const inWishlist = isInWishlist(product.id);

              return (
                <div 
                  key={product.id}
                  onClick={() => navigate(`/products/${product.slug}`)}
                  className="bg-[#FAF6EE] rounded-2xl border border-[#D8C9AD] overflow-hidden hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
                >
                  {/* Lead with high-fidelity imagery */}
                  <div className="relative bg-[#F8F4EC] h-72 sm:h-80 flex items-center justify-center p-8 overflow-hidden">
                    <img 
                      src={product.images[0]?.imageUrl || '/assets/aistudio/image_fe6cbcdf.png'} 
                      alt={product.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-md"
                    />

                    {/* Subtle text tag */}
                    {product.badge && (
                      <span className="absolute top-4 left-4 text-[10px] uppercase tracking-wider text-[#A34F37] font-bold bg-[#FAF6EE]/90 px-2.5 py-1 rounded">
                        {product.badge}
                      </span>
                    )}

                    {/* Wishlist Heart Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                      className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#FAF6EE] text-[#302C26] hover:text-[#A34F37] flex items-center justify-center shadow-xs transition-colors border border-[#D8C9AD]/50"
                      title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
                    >
                      <Heart className={`w-4 h-4 ${inWishlist ? 'fill-[#A34F37] text-[#A34F37]' : ''}`} />
                    </button>
                  </div>

                  {/* Product Details & Variant Selection */}
                  <div className="p-6">
                    {/* Clean unboxed metadata with dot separators */}
                    <div className="flex items-center gap-2 text-xs text-[#302C26]/70 mb-2">
                      <span className="font-semibold text-[#A34F37] uppercase tracking-wider text-[10px]">
                        {product.categorySlug}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5 text-amber-700 font-medium">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{product.rating}</span>
                      </span>
                      <span>·</span>
                      <span>{product.reviewsCount} reviews</span>
                    </div>

                    {/* Product Name */}
                    <h3 className="font-serif text-xl text-[#263D30] font-semibold mb-1 group-hover:text-[#A34F37] transition-colors leading-snug">
                      {product.name}
                    </h3>
                    <p className="text-xs text-[#302C26]/60 font-devanagari mb-3">
                      {product.hindiName}
                    </p>

                    {/* Pack Size Variant Switcher (Clean Segmented Buttons) */}
                    {product.variants.length > 1 && (
                      <div className="flex flex-wrap gap-1.5 mb-4" onClick={(e) => e.stopPropagation()}>
                        {product.variants.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => setSelectedVariants(prev => ({ ...prev, [product.id]: v.id }))}
                            className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${
                              activeVariant.id === v.id
                                ? 'bg-[#263D30] text-[#FAF6EE] border-[#263D30]'
                                : 'bg-[#F8F4EC] text-[#302C26] border-[#D8C9AD] hover:bg-[#D8C9AD]/30'
                            }`}
                          >
                            {v.sizeLabel.split(' ')[0]} {v.sizeLabel.split(' ')[1] || ''}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Price and Add CTA (Price strictly in integer paise via formatPaise) */}
                    <div className="pt-3 border-t border-[#D8C9AD]/40 flex items-center justify-between">
                      <div>
                        <div className="text-lg font-bold text-[#263D30] font-mono tabular-nums">
                          {formatPaise(activeVariant.pricePaise)}
                        </div>
                        {activeVariant.compareAtPricePaise && activeVariant.compareAtPricePaise > activeVariant.pricePaise && (
                          <div className="text-[11px] text-[#302C26]/50 line-through font-mono tabular-nums">
                            {formatPaise(activeVariant.compareAtPricePaise)}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={(e) => handleAddToCart(product, e)}
                        className="bg-[#263D30] text-[#FAF6EE] hover:bg-[#1A2B22] px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add to Bag</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
