import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import { 
  X, 
  Star, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Heart, 
  Send,
  MessageSquareHeart,
  ChevronDown
} from 'lucide-react';

const QUICK_TAGS = [
  '🥛 Thick Natural Malai',
  '🏺 Danedar Bilona Aroma',
  '🍃 Gentle on Digestion',
  '❄️ Chilled Glass Bottle',
  '⏰ Punctual 7 AM Dispatch',
  '🐄 100% Gir Cow Ahimsa Milk',
  '👶 Kids Favorite Dairy',
  '🧀 Melt-in-Mouth Purity'
];

const RATING_DESCRIPTIONS: Record<number, string> = {
  5: 'Exceptional Vedic Purity & Freshness (5/5)',
  4: 'Very Good Quality & Punctual Morning Delivery (4/5)',
  3: 'Good Taste & Satisfactory Experience (3/5)',
  2: 'Average Quality / Needs Improvement (2/5)',
  1: 'Below Expectations (1/5)'
};

export const ProductReviewModal: React.FC = () => {
  const { 
    isReviewModalOpen, 
    closeReviewModal, 
    reviewModalProduct, 
    products, 
    submitReview,
    currentUser,
    deliveryPincode
  } = useStore();

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Sync state whenever modal opens or active product changes
  useEffect(() => {
    if (isReviewModalOpen) {
      if (reviewModalProduct) {
        setSelectedProductId(reviewModalProduct.id);
      } else if (products.length > 0 && !selectedProductId) {
        setSelectedProductId(products[0].id);
      }

      setName(currentUser?.fullName || '');
      setCity(currentUser?.role === 'admin' ? 'Sanjay Vihar Colony, Seoni' : (deliveryPincode ? `Seoni (${deliveryPincode})` : 'Seoni, MP'));
      setRating(5);
      setHoverRating(0);
      setTitle('');
      setComment('');
      setSelectedTags(['🥛 Thick Natural Malai', '❄️ Chilled Glass Bottle']);
      setIsSubmitting(false);
      setIsSubmitted(false);
    }
  }, [isReviewModalOpen, reviewModalProduct, currentUser, deliveryPincode, products]);

  if (!isReviewModalOpen) return null;

  const currentProduct = products.find(p => p.id === selectedProductId) || reviewModalProduct || products[0];

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !comment.trim() || !name.trim() || !currentProduct) return;

    setIsSubmitting(true);

    // Trigger celebratory confetti dynamically only when needed
    try {
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      }).catch(() => {});
    } catch {}

    setTimeout(() => {
      submitReview({
        productId: currentProduct.id,
        productName: currentProduct.name,
        userName: name.trim(),
        userCity: city.trim() || 'Seoni, MP',
        rating,
        title: title.trim(),
        comment: comment.trim(),
        verifiedPurchase: true,
        tags: selectedTags
      });

      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 400);
  };

  const handleClose = () => {
    setIsSubmitted(false);
    closeReviewModal();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-[#FAF6EE] text-[#302C26] rounded-3xl border border-[#D8C9AD] shadow-2xl max-w-xl w-full p-6 sm:p-8 relative overflow-hidden transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#F8F4EC] hover:bg-[#D8C9AD]/40 text-[#302C26] flex items-center justify-center transition-colors border border-[#D8C9AD]/60 cursor-pointer z-10"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {isSubmitted ? (
          /* Success Screen */
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] uppercase font-bold tracking-widest text-[#A34F37]">
                Heritage Verified Review Published
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#263D30]">
                Dhanyawaad for Your Honest Feedback!
              </h3>
              <p className="text-xs text-[#302C26]/75 max-w-md mx-auto pt-1 leading-relaxed">
                Your verified review for <strong>{currentProduct?.name}</strong> has been recorded and will guide fellow households in Seoni seeking pure Vedic A2 dairy.
              </p>
            </div>

            <div className="pt-4 flex justify-center">
              <button
                onClick={handleClose}
                className="bg-[#263D30] hover:bg-[#1A2B22] text-[#FAF6EE] px-8 py-2.5 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Back to Provisions
              </button>
            </div>
          </div>
        ) : (
          /* Review Form */
          <div>
            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#D8C9AD]/50">
              <div className="w-12 h-12 rounded-2xl bg-[#263D30] text-[#C2A36C] flex items-center justify-center shrink-0 shadow-sm">
                <MessageSquareHeart className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#A34F37]">
                  <Sparkles className="w-3 h-3" />
                  <span>Patron Voice & Purity Review</span>
                </div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#263D30] leading-tight">
                  Rate Dugdhsar Product
                </h2>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Product Selector */}
              <div>
                <label className="block text-xs font-bold text-[#263D30] uppercase tracking-wider mb-1.5">
                  Select Dairy Product
                </label>
                <div className="relative">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full bg-[#F8F4EC] border border-[#D8C9AD] rounded-xl px-4 py-2.5 text-xs text-[#263D30] font-semibold appearance-none outline-none focus:border-[#263D30] focus:ring-1 focus:ring-[#263D30] pr-10 cursor-pointer"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.hindiName}) · {p.variants[0]?.sizeLabel}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#263D30]/60 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Interactive Star Rating */}
              <div className="bg-[#F8F4EC] p-4 rounded-2xl border border-[#D8C9AD]/60">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#263D30] uppercase tracking-wider">
                    Your Overall Rating
                  </span>
                  <span className="text-[11px] font-semibold text-[#A34F37]">
                    {hoverRating > 0 ? `${hoverRating} Stars` : `${rating} Stars`}
                  </span>
                </div>

                <div className="flex items-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating || rating) >= star;
                    return (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 text-[#C2A36C] hover:scale-115 transition-transform cursor-pointer focus:outline-none"
                        aria-label={`Rate ${star} star`}
                      >
                        <Star 
                          className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                            isFilled ? 'fill-[#C2A36C] text-[#C2A36C] drop-shadow-xs' : 'text-slate-300'
                          }`} 
                        />
                      </button>
                    );
                  })}
                </div>

                <p className="text-[11px] text-[#302C26]/70 mt-1 italic">
                  {RATING_DESCRIPTIONS[hoverRating || rating]}
                </p>
              </div>

              {/* Quick Experience Pills */}
              <div>
                <label className="block text-[11px] font-bold text-[#263D30] uppercase tracking-wider mb-2">
                  Key Experience Highlights (Tap to include)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => handleToggleTag(tag)}
                        className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-[#263D30] text-[#FAF6EE] border-[#263D30] shadow-xs'
                            : 'bg-[#F8F4EC] text-[#302C26]/75 border-[#D8C9AD] hover:bg-[#D8C9AD]/30'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Review Title */}
              <div>
                <label className="block text-xs font-bold text-[#263D30] uppercase tracking-wider mb-1">
                  Review Headline *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Incomparable morning freshness & thick natural malai"
                  className="w-full bg-[#F8F4EC] border border-[#D8C9AD] rounded-xl px-3.5 py-2 text-xs text-[#263D30] outline-none focus:border-[#263D30] focus:ring-1 focus:ring-[#263D30]"
                />
              </div>

              {/* Detailed Experience Comment */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-[#263D30] uppercase tracking-wider">
                    Detailed Experience *
                  </label>
                  <span className="text-[10px] text-[#302C26]/50">
                    Aroma · Texture · Digestion
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about the aroma upon boiling, digestion comfort, delivery punctuality, or how your family enjoyed it..."
                  className="w-full bg-[#F8F4EC] border border-[#D8C9AD] rounded-xl p-3 text-xs text-[#302C26] outline-none focus:border-[#263D30] focus:ring-1 focus:ring-[#263D30] leading-relaxed resize-none"
                />
              </div>

              {/* Name & City Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#263D30] uppercase tracking-wider mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sumit Pawar"
                    className="w-full bg-[#F8F4EC] border border-[#D8C9AD] rounded-xl px-3 py-2 text-xs text-[#263D30] outline-none focus:border-[#263D30] focus:ring-1 focus:ring-[#263D30]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#263D30] uppercase tracking-wider mb-1">
                    City / Neighborhood
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Sanjay Vihar Colony, Seoni"
                    className="w-full bg-[#F8F4EC] border border-[#D8C9AD] rounded-xl px-3 py-2 text-xs text-[#263D30] outline-none focus:border-[#263D30] focus:ring-1 focus:ring-[#263D30]"
                  />
                </div>
              </div>

              {/* Verified Patron Badge Check */}
              <div className="flex items-center gap-2 p-2.5 bg-[#F8F4EC] rounded-xl border border-[#D8C9AD]/40 text-xs text-[#263D30]/80">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-[11px]">
                  Verified DUGDHSAR Patron. Your review will display the green <strong>Verified Consumer</strong> trust seal.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D8C9AD]/50">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-semibold text-[#302C26]/70 hover:text-[#302C26] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#263D30] hover:bg-[#1A2B22] text-[#FAF6EE] px-6 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-[#C2A36C]" />
                  <span>{isSubmitting ? 'Publishing...' : 'Submit Review'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
