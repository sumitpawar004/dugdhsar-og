import React from 'react';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/RouterContext';
import { formatPaise } from '../../types';
import { Heart, Trash2, ShoppingBag, ArrowLeft, ArrowRight } from 'lucide-react';

export const WishlistPage: React.FC = () => {
  const { wishlist, products, toggleWishlist, addToCart } = useStore();
  const { navigate } = useRouter();

  const savedProducts = products.filter(p => wishlist.includes(p.id));

  return (
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-[#D8C9AD]">
          <div>
            <h1 className="text-3xl font-serif text-[#263D30] font-normal mb-1">
              Your Saved Provisions ({savedProducts.length})
            </h1>
            <p className="text-xs text-[#302C26]/70">
              Items saved for future morning dispatches and regular standing orders.
            </p>
          </div>

          <button
            onClick={() => navigate('/shop')}
            className="text-xs font-semibold text-[#A34F37] hover:text-[#263D30] flex items-center gap-1.5"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {savedProducts.length === 0 ? (
          <div className="py-24 text-center bg-[#FAF6EE] rounded-3xl border border-[#D8C9AD]">
            <Heart className="w-12 h-12 text-[#D8C9AD] mx-auto mb-4" />
            <h2 className="text-2xl font-serif text-[#263D30] mb-2">Your wishlist is currently empty</h2>
            <p className="text-xs text-[#302C26]/70 max-w-sm mx-auto mb-6">
              Explore our fresh A2 Gir cow milk, Vedic Bilona Ghee, and artisanal pantry provisions to save items here.
            </p>
            <button
              onClick={() => navigate('/shop')}
              className="bg-[#263D30] text-[#FAF6EE] px-6 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#1A2B22] transition-colors"
            >
              Explore Farm Store
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {savedProducts.map((product) => {
              const defaultVariant = product.variants[0];

              return (
                <div 
                  key={product.id}
                  className="bg-[#FAF6EE] rounded-2xl border border-[#D8C9AD] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="relative bg-[#F8F4EC] h-64 flex items-center justify-center p-6 cursor-pointer" onClick={() => navigate(`/products/${product.slug}`)}>
                    <img 
                      src={product.images[0]?.imageUrl || '/assets/aistudio/image_fe6cbcdf.png'} 
                      alt={product.name}
                      className="max-h-full max-w-full object-contain"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#FAF6EE] text-[#A34F37] hover:bg-[#F8F4EC] flex items-center justify-center shadow-xs border border-[#D8C9AD]/60"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-5">
                    <span className="text-[10px] uppercase font-bold text-[#A34F37] tracking-wider block mb-1">
                      {product.categorySlug}
                    </span>
                    <h3 
                      onClick={() => navigate(`/products/${product.slug}`)}
                      className="font-serif text-lg text-[#263D30] font-semibold mb-2 hover:text-[#A34F37] transition-colors cursor-pointer leading-snug"
                    >
                      {product.name}
                    </h3>

                    <div className="pt-3 border-t border-[#D8C9AD]/40 flex items-center justify-between">
                      <span className="font-mono font-bold text-base text-[#263D30]">
                        {formatPaise(defaultVariant.pricePaise)}
                      </span>
                      <button
                        onClick={() => {
                          addToCart(product, defaultVariant, 1);
                          toggleWishlist(product.id);
                        }}
                        className="bg-[#263D30] text-[#FAF6EE] px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#1A2B22] transition-colors flex items-center gap-1.5"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Move to Bag</span>
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
