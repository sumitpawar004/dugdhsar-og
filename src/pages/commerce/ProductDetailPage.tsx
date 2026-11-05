import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useRouter } from '../../router/RouterContext';
import { formatPaise, ProductVariant, Review } from '../../types';
import { 
  ArrowLeft, 
  Star, 
  ShieldCheck, 
  Heart, 
  ShoppingBag, 
  Check, 
  MapPin, 
  Clock, 
  Sparkles, 
  Calendar,
  AlertCircle
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { 
    products, 
    reviews, 
    addToCart, 
    toggleWishlist, 
    isInWishlist, 
    deliveryPincode, 
    setDeliveryPincode,
    isPincodeServiceable,
    activeDeliveryZone,
    submitReview
  } = useStore();

  const { params, navigate } = useRouter();

  // Find product by slug or id
  const product = products.find(p => p.slug === params.slug || p.id === params.slug) || products[0];
  const productReviews = reviews.filter(r => r.productId === product.id);

  // Active state
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(product.variants[0]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [purchaseMode, setPurchaseMode] = useState<'onetime' | 'subscription'>('onetime');
  const [subFrequency, setSubFrequency] = useState<'daily' | 'alternate' | 'weekly'>('daily');
  const [tempPincode, setTempPincode] = useState(deliveryPincode);
  const [pincodeMessage, setPincodeMessage] = useState<string | null>(null);
  const [addedToast, setAddedToast] = useState(false);

  // Review form modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [revRating, setRevRating] = useState(5);
  const [revTitle, setRevTitle] = useState('');
  const [revComment, setRevComment] = useState('');
  const [revName, setRevName] = useState('');
  const [revCity, setRevCity] = useState('');

  const inWishlist = isInWishlist(product.id);

  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const serviceable = setDeliveryPincode(tempPincode);
    if (serviceable) {
      setPincodeMessage(`Delivering to ${tempPincode} by 11:00 AM morning dispatch.`);
    } else {
      setPincodeMessage(`Pincode ${tempPincode} is outside our daily cold-chain zone. Shelf-stable items only.`);
    }
  };

  const handleAddToCart = () => {
    addToCart(
      product, 
      selectedVariant, 
      quantity, 
      purchaseMode === 'subscription', 
      subFrequency
    );
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revTitle || !revComment || !revName) return;

    submitReview({
      productId: product.id,
      productName: product.name,
      userName: revName,
      userCity: revCity || 'New Delhi',
      rating: revRating,
      title: revTitle,
      comment: revComment,
      verifiedPurchase: true
    });

    setShowReviewModal(false);
    setRevTitle('');
    setRevComment('');
  };

  return (
    <div className="bg-[#F8F4EC] text-[#302C26] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <button 
          onClick={() => navigate('/shop')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#A34F37] hover:text-[#263D30] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Provisions</span>
        </button>

        {/* Contiguous Purchase Module (PDP Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
          
          {/* Left Column: Gallery & High-Fidelity Photography (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-[#FAF6EE] rounded-3xl border border-[#D8C9AD] p-10 h-[420px] sm:h-[500px] flex items-center justify-center relative overflow-hidden">
              <img 
                src={product.images[activeImageIndex]?.imageUrl || product.images[0]?.imageUrl || '/assets/aistudio/image_fe6cbcdf.png'} 
                alt={product.name}
                className="max-h-full max-w-full object-contain drop-shadow-xl"
              />

              <button
                onClick={() => toggleWishlist(product.id)}
                className="absolute top-5 right-5 w-11 h-11 rounded-full bg-[#FAF6EE] text-[#302C26] hover:text-[#A34F37] flex items-center justify-center shadow-sm transition-colors border border-[#D8C9AD]/50"
                title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
              >
                <Heart className={`w-5 h-5 ${inWishlist ? 'fill-[#A34F37] text-[#A34F37]' : ''}`} />
              </button>
            </div>

            {/* Gallery Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-20 h-20 rounded-xl bg-[#FAF6EE] border p-2 flex items-center justify-center transition-colors ${
                      activeImageIndex === idx ? 'border-2 border-[#263D30]' : 'border-[#D8C9AD]'
                    }`}
                  >
                    <img src={img.imageUrl} alt={img.altText} className="max-h-full max-w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Contiguous Purchase Module (5 cols) */}
          <div className="lg:col-span-5 bg-[#FAF6EE] p-8 rounded-3xl border border-[#D8C9AD] shadow-sm space-y-6">
            <div>
              {/* Category & Rating */}
              <div className="flex items-center gap-2 text-xs text-[#302C26]/75 mb-2">
                <span className="font-bold text-[#A34F37] uppercase tracking-wider text-[11px]">
                  {product.categorySlug}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 text-amber-700 font-semibold">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{product.rating}</span>
                </span>
                <span>·</span>
                <span>{product.reviewsCount} customer reviews</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl text-[#263D30] font-normal mb-1 leading-tight">
                {product.name}
              </h1>
              <p className="font-devanagari text-sm text-[#302C26]/60 mb-4">
                {product.hindiName}
              </p>

              {/* Price in Integer Paise */}
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl font-bold text-[#263D30] font-mono tabular-nums">
                  {formatPaise(selectedVariant.pricePaise)}
                </span>
                {selectedVariant.compareAtPricePaise && selectedVariant.compareAtPricePaise > selectedVariant.pricePaise && (
                  <span className="text-base text-[#302C26]/50 line-through font-mono tabular-nums">
                    {formatPaise(selectedVariant.compareAtPricePaise)}
                  </span>
                )}
                <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                  In Stock ({selectedVariant.stockCount} units)
                </span>
              </div>
            </div>

            {/* Pack Size Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#302C26] uppercase tracking-wider mb-2">
                Select Pack Size / Bottle:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`p-3 text-left rounded-xl border text-xs transition-all ${
                      selectedVariant.id === v.id
                        ? 'bg-[#263D30] text-[#FAF6EE] border-[#263D30]'
                        : 'bg-[#F8F4EC] text-[#302C26] border-[#D8C9AD] hover:bg-[#D8C9AD]/30'
                    }`}
                  >
                    <div className="font-semibold">{v.sizeLabel}</div>
                    <div className="font-mono text-[11px] opacity-80">{formatPaise(v.pricePaise)}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Purchase Mode: One-Time vs Daily Subscription */}
            {product.isSubscriptionEligible && (
              <div className="bg-[#F8F4EC] p-4 rounded-xl border border-[#D8C9AD] space-y-3">
                <span className="block text-xs font-semibold text-[#263D30] uppercase tracking-wider">
                  Order Type
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPurchaseMode('onetime')}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${
                      purchaseMode === 'onetime'
                        ? 'bg-[#FAF6EE] text-[#263D30] border-[#263D30] shadow-xs'
                        : 'text-[#302C26]/70 border-transparent hover:bg-[#FAF6EE]/50'
                    }`}
                  >
                    One-Time Order
                  </button>
                  <button
                    onClick={() => setPurchaseMode('subscription')}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors flex items-center justify-center gap-1 ${
                      purchaseMode === 'subscription'
                        ? 'bg-[#FAF6EE] text-[#263D30] border-[#263D30] shadow-xs'
                        : 'text-[#302C26]/70 border-transparent hover:bg-[#FAF6EE]/50'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#C2A36C]" />
                    <span>Daily Subscription</span>
                  </button>
                </div>

                {purchaseMode === 'subscription' && (
                  <div className="pt-2 border-t border-[#D8C9AD]/60">
                    <span className="block text-[11px] text-[#302C26]/70 mb-1.5">Delivery Frequency:</span>
                    <div className="flex gap-1.5">
                      {(['daily', 'alternate', 'weekly'] as const).map(freq => (
                        <button
                          key={freq}
                          onClick={() => setSubFrequency(freq)}
                          className={`px-3 py-1.5 text-xs rounded border capitalize transition-colors ${
                            subFrequency === freq
                              ? 'bg-[#263D30] text-[#FAF6EE] border-[#263D30]'
                              : 'bg-[#FAF6EE] text-[#302C26] border-[#D8C9AD]'
                          }`}
                        >
                          {freq}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantity Stepper & Add to Bag CTA */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center border border-[#D8C9AD] rounded-xl bg-[#FAF6EE] overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3.5 py-2.5 text-[#302C26] hover:bg-[#F8F4EC] font-bold text-sm"
                >
                  -
                </button>
                <span className="px-4 py-2.5 text-xs font-mono font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3.5 py-2.5 text-[#302C26] hover:bg-[#F8F4EC] font-bold text-sm"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 bg-[#263D30] text-[#FAF6EE] hover:bg-[#1A2B22] py-3.5 px-6 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {purchaseMode === 'subscription' ? 'Start Subscription' : 'Add to Bag'} · {formatPaise(selectedVariant.pricePaise * quantity)}
                </span>
              </button>
            </div>

            {addedToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Added to bag! Checkout or explore more items.</span>
              </div>
            )}

            {/* Pincode Check Form */}
            <div className="pt-4 border-t border-[#D8C9AD]">
              <form onSubmit={handlePincodeCheck} className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#302C26]/50" />
                  <input
                    type="text"
                    value={tempPincode}
                    onChange={(e) => setTempPincode(e.target.value)}
                    placeholder="Enter pincode for morning slot"
                    className="w-full pl-8 pr-3 py-2 text-xs border border-[#D8C9AD] rounded-lg bg-[#F8F4EC] text-[#263D30] font-mono focus:outline-none focus:border-[#263D30]"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#A34F37] text-[#FAF6EE] px-4 py-2 text-xs font-semibold rounded-lg hover:bg-[#8e422c] transition-colors"
                >
                  Check
                </button>
              </form>

              {pincodeMessage && (
                <p className={`text-xs ${isPincodeServiceable ? 'text-emerald-800' : 'text-amber-800'}`}>
                  {pincodeMessage}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Nutritional Highlights & Heritage Story */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-[#FAF6EE] p-6 sm:p-8 rounded-2xl border border-[#D8C9AD]">
            <h3 className="font-serif text-lg text-[#263D30] font-semibold mb-3">
              Nutritional Highlights
            </h3>
            <div className="space-y-3 text-xs">
              {product.nutritionalHighlights.map((n, i) => (
                <div key={i} className="flex justify-between py-1.5 border-b border-[#D8C9AD]/40">
                  <span className="text-[#302C26]/70">{n.label}</span>
                  <span className="font-semibold text-[#263D30]">{n.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#FAF6EE] p-6 sm:p-8 rounded-2xl border border-[#D8C9AD]">
            <h3 className="font-serif text-lg text-[#263D30] font-semibold mb-3">
              Storage & Shelf Life
            </h3>
            <div className="space-y-3 text-xs text-[#302C26]/80 leading-relaxed">
              <p><strong>Shelf Life:</strong> {product.shelfLife}</p>
              <p><strong>Storage:</strong> {product.storageInstructions}</p>
              <p><strong>Allergens:</strong> {product.allergens.join(', ')}</p>
            </div>
          </div>

          <div className="bg-[#FAF6EE] p-6 sm:p-8 rounded-2xl border border-[#D8C9AD]">
            <h3 className="font-serif text-lg text-[#263D30] font-semibold mb-3">
              Heritage Gir Cow Lineage
            </h3>
            <p className="text-xs text-[#302C26]/80 leading-relaxed mb-4">
              {product.heritageStory}
            </p>
            <div className="flex items-center gap-2 text-xs text-[#A34F37] font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Certified Purity Score: {product.purityScore}/500</span>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="bg-[#FAF6EE] p-8 sm:p-12 rounded-3xl border border-[#D8C9AD]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#D8C9AD]">
            <div>
              <h2 className="font-serif text-2xl text-[#263D30] font-semibold">
                Verified Patron Reviews ({productReviews.length})
              </h2>
              <p className="text-xs text-[#302C26]/70">
                Honest feedback from households consuming DUGDHSAR daily.
              </p>
            </div>
            <button
              onClick={() => setShowReviewModal(true)}
              className="bg-[#263D30] text-[#FAF6EE] px-5 py-2.5 rounded-lg text-xs font-semibold hover:bg-[#1A2B22] transition-colors"
            >
              Write a Review
            </button>
          </div>

          {productReviews.length === 0 ? (
            <p className="text-xs text-[#302C26]/70 py-6">Be the first to review this heritage product.</p>
          ) : (
            <div className="space-y-6">
              {productReviews.map((rev) => (
                <div key={rev.id} className="pb-6 border-b border-[#D8C9AD]/40 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex text-[#C2A36C]">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-[#C2A36C]" />
                        ))}
                      </div>
                      <span className="font-semibold text-xs text-[#263D30]">{rev.title}</span>
                    </div>
                    <span className="text-[11px] text-[#302C26]/50">
                      {new Date(rev.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-[#302C26]/80 leading-relaxed mb-2">
                    {rev.comment}
                  </p>
                  <div className="text-[11px] text-[#302C26]/60 flex items-center gap-2">
                    <span>{rev.userName} ({rev.userCity})</span>
                    <span>·</span>
                    <span className="text-emerald-700 font-medium">✓ Verified Daily Consumer</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal: Write Review */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FAF6EE] max-w-lg w-full p-8 rounded-2xl border border-[#D8C9AD] shadow-2xl">
              <h3 className="font-serif text-2xl text-[#263D30] font-semibold mb-4">
                Review {product.name}
              </h3>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Star Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRevRating(star)}
                        className="text-[#C2A36C] p-1"
                      >
                        <Star className={`w-5 h-5 ${star <= revRating ? 'fill-[#C2A36C]' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Review Headline</label>
                  <input
                    type="text"
                    required
                    value={revTitle}
                    onChange={(e) => setRevTitle(e.target.value)}
                    placeholder="e.g. Incomparable morning freshness and thick cream"
                    className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-lg bg-[#F8F4EC] text-[#263D30]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Your Detailed Experience</label>
                  <textarea
                    rows={3}
                    required
                    value={revComment}
                    onChange={(e) => setRevComment(e.target.value)}
                    placeholder="Share your experience regarding digestion, boiling, cream texture..."
                    className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-lg bg-[#F8F4EC] text-[#263D30]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={revName}
                      onChange={(e) => setRevName(e.target.value)}
                      placeholder="e.g. S. Sen"
                      className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-lg bg-[#F8F4EC] text-[#263D30]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">City / Sector</label>
                    <input
                      type="text"
                      value={revCity}
                      onChange={(e) => setRevCity(e.target.value)}
                      placeholder="e.g. DLF Phase 5"
                      className="w-full px-3 py-2 text-xs border border-[#D8C9AD] rounded-lg bg-[#F8F4EC] text-[#263D30]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#D8C9AD]">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-2 text-xs font-medium text-[#302C26]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#263D30] text-[#FAF6EE] px-5 py-2 text-xs font-semibold rounded-lg hover:bg-[#1A2B22]"
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
