import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/RouterContext';
import { formatPaise, Product } from '../../types';
import { ArrowLeft, ShoppingBag, Heart, Star, Check } from 'lucide-react';

export const CollectionPage: React.FC = () => {
  const { products, categories, addToCart, toggleWishlist, isInWishlist } = useStore();
  const { params, navigate } = useRouter();

  const collectionSlug = params.slug || 'milk';
  const category = categories.find(c => c.slug === collectionSlug) || categories[0];
  const collectionProducts = products.filter(p => p.categorySlug === category.slug);

  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const activeVariantId = selectedVariants[product.id] || product.variants[0].id;
    const variant = product.variants.find(v => v.id === activeVariantId) || product.variants[0];
    addToCart(product, variant, 1);

    setAddedNotice(`${product.name} (${variant.sizeLabel}) added to bag`);
    setTimeout(() => setAddedNotice(null), 2500);
  };

  return (
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-10 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[#302C26]/70 mb-6 flex-wrap">
          <button 
            onClick={() => navigate('/')}
            className="hover:text-[#A34F37] transition-colors cursor-pointer"
          >
            Home
          </button>
          <span>/</span>
          <button 
            onClick={() => navigate('/products')}
            className="hover:text-[#A34F37] transition-colors cursor-pointer"
          >
            Products
          </button>
          <span>/</span>
          <span className="text-[#A34F37] font-bold">{category.name}</span>
        </div>

        {/* Category Switcher Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {categories.map((c) => {
            const isCurrent = c.slug === category.slug;
            return (
              <button
                key={c.id}
                onClick={() => navigate(`/products/${c.slug}`)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isCurrent 
                    ? 'bg-[#263D30] text-[#FAF6EE] shadow-md border border-[#C2A36C]/40' 
                    : 'bg-[#FAF6EE] text-[#302C26] border border-[#D8C9AD] hover:bg-white'
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>

        {/* Collection Hero */}
        <div className="bg-[#FAF6EE] p-6 sm:p-10 rounded-3xl border border-[#D8C9AD] mb-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xs">
          <div className="max-w-xl">
            <span className="text-xs uppercase tracking-[0.25em] text-[#A34F37] font-semibold block mb-2 font-devanagari">
              {category.hindiName}
            </span>
            <h1 className="text-3xl sm:text-5xl font-serif text-[#263D30] font-bold mb-3">
              {category.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#302C26]/80 leading-relaxed mb-4">
              {category.description}
            </p>
            <div className="flex items-center gap-3 text-xs text-[#263D30]/80">
              <span className="bg-[#263D30]/10 px-2.5 py-1 rounded-lg font-bold text-[#263D30]">
                {collectionProducts.length} Items Available
              </span>
              <span>·</span>
              <span>Daily Cold-Chain Shipping</span>
            </div>
          </div>

          <div className="w-44 h-44 sm:w-56 sm:h-56 bg-[#F8F4EC] rounded-2xl flex items-center justify-center p-6 border border-[#D8C9AD]">
            <img 
              src={category.imageUrl || '/assets/aistudio/1000095624-clean_337007be.png'} 
              alt={category.name}
              className="max-h-full max-w-full object-contain drop-shadow-md"
            />
          </div>
        </div>

        {addedNotice && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#263D30] text-[#FAF6EE] px-5 py-3 rounded-xl shadow-xl border border-[#C2A36C] text-xs flex items-center gap-2.5 animate-bounce">
            <Check className="w-4 h-4 text-[#C2A36C]" />
            <span>{addedNotice}</span>
          </div>
        )}

        {/* Products in Collection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {collectionProducts.map((product) => {
            const activeVariantId = selectedVariants[product.id] || product.variants[0].id;
            const activeVariant = product.variants.find(v => v.id === activeVariantId) || product.variants[0];
            const inWishlist = isInWishlist(product.id);

            return (
              <div 
                key={product.id}
                onClick={() => navigate(`/products/${product.slug}`)}
                className="bg-[#FAF6EE] rounded-2xl border border-[#D8C9AD] overflow-hidden hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="relative bg-[#F8F4EC] h-72 sm:h-80 flex items-center justify-center p-8 overflow-hidden">
                  <img 
                    src={product.images[0]?.imageUrl || '/assets/aistudio/image_fe6cbcdf.png'} 
                    alt={product.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-md"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product.id);
                    }}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#FAF6EE] text-[#302C26] hover:text-[#A34F37] flex items-center justify-center shadow-xs transition-colors border border-[#D8C9AD]/50"
                  >
                    <Heart className={`w-4 h-4 ${inWishlist ? 'fill-[#A34F37] text-[#A34F37]' : ''}`} />
                  </button>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs text-[#302C26]/70 mb-2">
                    <span className="flex items-center gap-0.5 text-amber-700 font-medium">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{product.rating}</span>
                    </span>
                    <span>·</span>
                    <span>{product.reviewsCount} reviews</span>
                  </div>

                  <h3 className="font-serif text-xl text-[#263D30] font-semibold mb-1 group-hover:text-[#A34F37] transition-colors leading-snug">
                    {product.name}
                  </h3>
                  <p className="text-xs text-[#302C26]/60 font-devanagari mb-3">
                    {product.hindiName}
                  </p>

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

                  <div className="pt-3 border-t border-[#D8C9AD]/40 flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold text-[#263D30] font-mono tabular-nums">
                        {formatPaise(activeVariant.pricePaise)}
                      </div>
                      {activeVariant.compareAtPricePaise && (
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
      </div>
    </div>
  );
};
