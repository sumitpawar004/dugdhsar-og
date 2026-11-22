import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useRouter } from '../router/RouterContext';
import { 
  Sparkles, 
  ShoppingBag, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  ShieldCheck, 
  Clock, 
  Truck 
} from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { setIsSubscriptionModalOpen } = useStore();
  const { navigate } = useRouter();

  const slides = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1920&q=80',
      badge: 'Dugdhsar · A2 Milk & Dairy Delivery Subscription · Seoni, MP',
      title: 'Dugdhsar: A2 Milk & Dairy Delivery in Seoni',
      subtitle: 'Fresh A2 milk and daily dairy products delivered to homes across Seoni, Madhya Pradesh through flexible delivery subscriptions and one-time orders.',
      primaryBtn: 'Start Milk Subscription',
      primaryAction: () => setIsSubscriptionModalOpen(true),
      secondaryBtn: 'Explore Products',
      secondaryAction: () => navigate('/products')
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=1920&q=80',
      badge: 'Fresh Morning Doorstep Delivery · Seoni, MP',
      title: 'Every Drop Brings Natural Freshness.',
      subtitle: 'Chilled A2 milk and fresh dairy staples delivered directly to your doorstep across Seoni with flexible pause and schedule controls.',
      primaryBtn: 'Daily Subscription',
      primaryAction: () => setIsSubscriptionModalOpen(true),
      secondaryBtn: 'My Milk Calendar',
      secondaryAction: () => navigate('/account/daily-milk-tracking')
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1596733430284-f7437764b1a9?auto=format&fit=crop&w=1920&q=80',
      badge: 'Traditional Bilona Ghee & Fresh Dairy',
      title: 'Tradition You Trust, Quality You Deserve.',
      subtitle: 'Curd-churned A2 cow ghee, fresh paneer, curd, and white butter crafted for families in Seoni, Madhya Pradesh.',
      primaryBtn: 'Shop Bilona Ghee',
      primaryAction: () => navigate('/products/ghee'),
      secondaryBtn: 'View All Products',
      secondaryAction: () => navigate('/products')
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=1920&q=80',
      badge: 'Direct Local Dairy Subscription',
      title: 'From Our Dairy to Your Family.',
      subtitle: 'Manage daily or alternate-day A2 milk deliveries in Seoni with online payments via Razorpay or Cash on Delivery.',
      primaryBtn: 'Subscribe Milk',
      primaryAction: () => setIsSubscriptionModalOpen(true),
      secondaryBtn: 'Our Quality Process',
      secondaryAction: () => navigate('/quality')
    },
    {
      id: 5,
      image: '/assets/vedic_gir_cow_meadow.jpg',
      badge: 'Seoni, Madhya Pradesh · Morning & Evening Dispatch',
      title: 'Pure A2 Dairy Delivered Daily.',
      subtitle: 'Reliable morning and evening local dairy delivery in Seoni, Madhya Pradesh, with transparent subscription tracking.',
      primaryBtn: 'Start Morning Delivery',
      primaryAction: () => setIsSubscriptionModalOpen(true),
      secondaryBtn: 'Explore Products',
      secondaryAction: () => navigate('/products')
    }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-slide running carousel every 4.5 seconds
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <section 
      id="hero"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative min-h-[580px] sm:min-h-[660px] lg:min-h-[720px] flex items-center justify-center overflow-hidden bg-[#1A2B22]"
    >
      {/* Background Running Image Slider (3-4 automatic images) */}
      {slides.map((slide, index) => {
        const isActive = index === currentSlide;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105 pointer-events-none'
            }`}
            style={{ transitionProperty: 'opacity, transform' }}
          >
            <img
              src={slide.image}
              alt={slide.title}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/assets/vedic_gir_cow_meadow.jpg';
              }}
              className="w-full h-full object-cover object-center transform transition-transform duration-[7000ms] ease-out scale-105"
            />
            {/* Multi-layered cinematic gradient overlays for pristine text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/35" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A2B22]/90 via-transparent to-black/40" />
          </div>
        );
      })}

      {/* Hero Foreground Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 sm:py-24">
        <div className="max-w-2xl text-left space-y-4 sm:space-y-6">
          
          {/* Active Slide Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C2A36C]/25 text-[#F3EDE1] border border-[#C2A36C]/50 backdrop-blur-md shadow-md">
            <span className="w-2 h-2 rounded-full bg-[#C2A36C] animate-pulse" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#FAF6EE]">
              {slides[currentSlide].badge}
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#FAF6EE] tracking-tight leading-[1.08] font-serif uppercase drop-shadow-md">
            {slides[currentSlide].title}
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-[#FAF6EE]/90 leading-relaxed font-sans max-w-xl drop-shadow-sm font-medium">
            {slides[currentSlide].subtitle}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3">
            <button
              onClick={slides[currentSlide].primaryAction}
              className="px-6 sm:px-8 py-3.5 bg-[#C2A36C] hover:bg-[#b0915a] text-[#263D30] text-xs font-black uppercase tracking-wider rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer border border-[#FAF6EE]/40 group"
            >
              <Sparkles className="w-4 h-4 text-[#263D30] group-hover:rotate-12 transition-transform" />
              <span>{slides[currentSlide].primaryBtn}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={slides[currentSlide].secondaryAction}
              className="px-6 sm:px-7 py-3.5 bg-white/15 hover:bg-white/25 text-[#FAF6EE] backdrop-blur-md text-xs font-bold uppercase tracking-wider rounded-2xl border border-white/30 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <span>{slides[currentSlide].secondaryBtn}</span>
            </button>
          </div>

          {/* Quick Pillar Bullets */}
          <div className="pt-4 sm:pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-3 gap-3 text-[#FAF6EE]/85 text-[11px] font-semibold">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C2A36C] shrink-0" />
              <span>Delivered before 11:00 AM</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C2A36C] shrink-0" />
              <span>100% Pure A2 Gir Breed</span>
            </div>
            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <Truck className="w-4 h-4 text-[#C2A36C] shrink-0" />
              <span>2°C–4°C Insulated Chain</span>
            </div>
          </div>

        </div>
      </div>

      {/* Manual Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/70 text-[#FAF6EE] border border-white/20 backdrop-blur-md transition-all active:scale-90 cursor-pointer"
        title="Previous Slide"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/70 text-[#FAF6EE] border border-white/20 backdrop-blur-md transition-all active:scale-90 cursor-pointer"
        title="Next Slide"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Slide Indicator Dots */}
      <div className="absolute bottom-5 z-30 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/40 px-3.5 py-1.5 rounded-full border border-white/15 backdrop-blur-md">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`transition-all rounded-full cursor-pointer ${
              i === currentSlide 
                ? 'w-7 h-2 bg-[#C2A36C]' 
                : 'w-2 h-2 bg-white/50 hover:bg-white/80'
            }`}
            title={`Slide ${i + 1}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
