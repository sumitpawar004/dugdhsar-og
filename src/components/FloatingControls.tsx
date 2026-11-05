import React from 'react';
import { ArrowUp, MessageCircle, Home, ShoppingBag, Milk, User } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useRouter } from '../router/RouterContext';

export const FloatingControls: React.FC = () => {
  const { cart, setIsSubscriptionModalOpen, setIsCartOpen } = useStore();
  const { navigate, path } = useRouter();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Fixed Floating Scroll-To-Top Button (positioned above mobile nav bar) */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 z-40 flex flex-col items-center space-y-2.5">
        {/* Desktop-only WhatsApp Floating Bubble */}
        <a
          href="https://wa.me/917067672604?text=Hello%20DUGDHSAR%2C%20I%20would%20like%20to%20order%20farm%20fresh%20A2%20milk%20in%20Seoni."
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex w-12 h-12 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 group"
          title="Chat on WhatsApp (+91 7067672604)"
        >
          <MessageCircle className="w-6 h-6 fill-white text-[#25D366]" />
        </a>

        {/* Scroll To Top Button */}
        <button
          onClick={scrollToTop}
          className="w-10 h-10 rounded-full bg-[#FAF6EE]/95 hover:bg-[#F3EDE1] text-[#263D30] border border-[#D8C9AD] flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 backdrop-blur-xs cursor-pointer"
          title="Scroll to top"
        >
          <ArrowUp className="w-4 h-4 text-[#263D30]" />
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar (sm:hidden) for Easy Thumb-Reach */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-[#FAF6EE]/98 backdrop-blur-md border-t border-[#D8C9AD] z-40 py-2 px-2 shadow-2xl flex items-center justify-around safe-area-pb">
        {/* Home */}
        <button
          onClick={() => {
            navigate('/');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center space-y-0.5 px-2 py-1 rounded-xl transition-colors cursor-pointer ${
            path === '/' ? 'text-[#263D30] font-black' : 'text-[#302C26]/70 hover:text-[#263D30]'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Home</span>
        </button>

        {/* Products / Shop */}
        <button
          onClick={() => {
            navigate('/shop');
          }}
          className={`flex flex-col items-center justify-center space-y-0.5 px-2 py-1 rounded-xl transition-colors cursor-pointer ${
            path === '/shop' || path === '/products' ? 'text-[#263D30] font-black' : 'text-[#302C26]/70 hover:text-[#263D30]'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Products</span>
        </button>

        {/* Center Milk Subscribe Action Button */}
        <button
          onClick={() => setIsSubscriptionModalOpen(true)}
          className="flex flex-col items-center justify-center -mt-5 cursor-pointer group"
          title="Order Morning Bottle"
        >
          <div className="w-12 h-12 rounded-full bg-[#263D30] text-[#FAF6EE] border-2 border-[#C2A36C] flex items-center justify-center shadow-xl group-active:scale-95 transition-transform">
            <Milk className="w-6 h-6 text-[#C2A36C]" />
          </div>
          <span className="text-[10px] font-black uppercase text-[#263D30] tracking-wider mt-0.5">
            Subscribe
          </span>
        </button>

        {/* WhatsApp Official */}
        <a
          href="https://wa.me/917067672604?text=Hello%20DUGDHSAR%2C%20I%20would%20like%20to%20order%20farm%20fresh%20A2%20milk%20in%20Seoni."
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center space-y-0.5 px-2 py-1 rounded-xl text-[#25D366] hover:text-[#1EBE5D] transition-colors"
        >
          <MessageCircle className="w-5 h-5 fill-[#25D366] text-white" />
          <span className="text-[10px] tracking-tight font-semibold">WhatsApp</span>
        </a>

        {/* Bag / Cart */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center space-y-0.5 px-2 py-1 rounded-xl text-[#302C26]/70 hover:text-[#263D30] transition-colors relative cursor-pointer"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-[#A34F37] text-white text-[9px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Bag</span>
        </button>
      </nav>
    </>
  );
};
