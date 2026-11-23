import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useRouter } from '../router/RouterContext';
import { siteConfig } from '../config/site';
import { getCleanTelHref, getShopDirectionsUrl, hasText } from '../config/siteHelpers';
import { 
  ShoppingBag, 
  Heart, 
  Search, 
  User, 
  ShieldCheck, 
  X, 
  Activity, 
  PhoneCall, 
  ChevronDown,
  Sparkles,
  Home,
  Package,
  Milk,
  Calendar,
  Truck,
  Info,
  LogOut,
  ArrowRight,
  MapPin,
  Navigation,
  ArrowUpRight
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    cart, 
    wishlist, 
    currentUser, 
    setIsCartOpen, 
    setIsQAAuditOpen,
    setIsSubscriptionModalOpen,
    searchQuery,
    setSearchQuery,
    websiteAnnouncement,
    siteSettings
  } = useStore();

  const { path, navigate } = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    setIsCategoryDropdownOpen(false);
    setIsMoreDropdownOpen(false);
    navigate(href);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <>
      {/* Top Notice Bar */}
      <div className="bg-[#1F3327] text-[#F3EDE1] text-[10px] sm:text-[11px] font-medium py-1.5 px-3 sm:px-4 flex justify-between items-center tracking-wide border-b border-[#3A5243]">
        {/* Left: Location Arrow Sign with Direct Google Map Route to Shop */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 truncate">
          <a
            href={getShopDirectionsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full bg-[#C2A36C] hover:bg-[#d8b97d] text-[#1F3327] font-black text-[9px] sm:text-[10px] uppercase tracking-wider transition-all shadow-xs active:scale-95 group cursor-pointer shrink-0"
            title={`Directions to ${siteConfig.name} Shop (${siteConfig.location.latitude}, ${siteConfig.location.longitude})`}
          >
            <Navigation className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#1F3327] fill-[#1F3327] group-hover:rotate-45 transition-transform shrink-0" />
            <span>Shop Map</span>
            <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#1F3327] stroke-[3]" />
          </a>

          <a
            href={getShopDirectionsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#FAF6EE] hover:text-[#C2A36C] transition-colors font-semibold truncate group"
            title={`${siteConfig.name} Shop — ${siteConfig.location.city}, ${siteConfig.location.state}`}
          >
            <span className="font-bold text-[#C2A36C] underline decoration-[#C2A36C]/50 group-hover:decoration-white">
              {siteConfig.location.city}, MP
            </span>
            <span className="text-[10px] text-[#F3EDE1]/80 hidden sm:inline">(Barghat Rd, Seoni)</span>
          </a>

          <span className="truncate text-[#F3EDE1]/75 hidden md:inline">· 5–10 AM &amp; 6–10 PM Daily</span>
        </div>

        {/* Right: Farm Fresh Status + Call Support */}
        <div className="flex items-center space-x-2 sm:space-x-4 shrink-0 ml-2">
          <div className="flex items-center space-x-1 text-[#F3EDE1]/90 text-[10px] sm:text-xs">
            <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C2A36C]" />
            <span className="hidden sm:inline">Farm Fresh: </span><strong className="text-[#C2A36C]">100% Pure A2</strong>
          </div>

          {hasText(siteConfig.contact.phoneFormatted) && (
            getCleanTelHref() ? (
              <a
                href={`tel:${getCleanTelHref()}`}
                className="hidden xs:flex items-center space-x-1 text-[#F3EDE1]/85 hover:text-white"
                title={`Call ${siteConfig.name} Support`}
              >
                <PhoneCall className="w-3 h-3 text-[#C2A36C]" />
                <span>{siteConfig.contact.phoneFormatted}</span>
              </a>
            ) : (
              <span className="hidden xs:flex items-center space-x-1 text-[#F3EDE1]/85">
                <PhoneCall className="w-3 h-3 text-[#C2A36C]" />
                <span>{siteConfig.contact.phoneFormatted}</span>
              </span>
            )
          )}
        </div>
      </div>

      {/* Main Top Bar */}
      <header className="sticky top-0 z-40 bg-[#F8F4EC]/95 backdrop-blur-md border-b border-[#D8C9AD] transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 h-16 sm:h-20 flex items-center justify-between gap-1.5 sm:gap-3 lg:gap-4 flex-nowrap w-full">
          
          {/* LEFT SECTION: Official Logo at extreme left + Hamburger menu + Top Left Menu Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 flex-nowrap">
            {/* Logo */}
            <div 
              onClick={() => handleNavClick('/')}
              className="flex items-center gap-2 sm:gap-2.5 cursor-pointer shrink-0"
            >
              <img 
                src="/assets/aistudio/1000095715-clean_c92aa3a9.png" 
                alt="Dugdhsar Gir Cow Emblem" 
                className="h-9 w-9 sm:h-11 sm:w-11 object-contain rounded-xl"
              />
              <div className="flex flex-col">
                <span className="font-serif text-base sm:text-xl font-bold tracking-tight text-[#263D30] leading-none whitespace-nowrap">
                  DUGDHSAR
                </span>
                <span className="text-[7px] sm:text-[8px] uppercase tracking-[0.16em] text-[#A34F37] font-semibold mt-0.5 whitespace-nowrap">
                  60 Years Heritage
                </span>
              </div>
            </div>

            {/* Hamburger Menu immediately beside logo */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 sm:p-2 text-[#263D30] hover:text-[#A34F37] transition-colors rounded-xl hover:bg-[#D8C9AD]/30 flex items-center justify-center cursor-pointer shrink-0"
              title="Open Navigation Menu"
              aria-label="Navigation Menu"
            >
              <span className="flex flex-col justify-between w-5 h-3.5" aria-hidden="true">
                <span className="block h-0.5 w-full bg-current rounded-full" />
                <span className="block h-0.5 w-full bg-current rounded-full" />
                <span className="block h-0.5 w-full bg-current rounded-full" />
              </span>
            </button>

            {/* TOP LEFT MENU BAR (Responsive for Windows Tab, Tablet & Desktop) */}
            <nav className="hidden lg:flex items-center gap-2 xl:gap-3 2xl:gap-4.5 text-xs font-semibold text-[#302C26] ml-1 shrink-0">
              <button 
                onClick={() => handleNavClick('/')}
                className={`hover:text-[#A34F37] transition-colors whitespace-nowrap py-1 ${path === '/' ? 'text-[#A34F37] font-bold border-b-2 border-[#A34F37]' : ''}`}
              >
                Home
              </button>

              {/* Category Dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setIsCategoryDropdownOpen(true)}
                onMouseLeave={() => setIsCategoryDropdownOpen(false)}
              >
                <button 
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className={`flex items-center gap-0.5 sm:gap-1 hover:text-[#A34F37] transition-colors whitespace-nowrap py-1 ${path.startsWith('/products/') && path !== '/products' ? 'text-[#A34F37] font-bold border-b-2 border-[#A34F37]' : ''}`}
                >
                  <span>Category</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#A34F37]" />
                </button>

                {isCategoryDropdownOpen && (
                  <div className="absolute top-full left-0 w-52 bg-[#FAF6EE] border border-[#D8C9AD] shadow-xl rounded-2xl py-2 z-50 animate-in fade-in slide-in-from-top-1">
                    <button
                      onClick={() => handleNavClick('/products/milk')}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-[#263D30] hover:bg-[#D8C9AD]/30 flex items-center gap-2.5"
                    >
                      <Milk className="w-3.5 h-3.5 text-[#A34F37]" />
                      <span>Milk (A2 Whole Milk)</span>
                    </button>
                    <button
                      onClick={() => handleNavClick('/products/ghee')}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-[#263D30] hover:bg-[#D8C9AD]/30 flex items-center gap-2.5"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#C2A36C]" />
                      <span>Ghee (Vedic Bilona)</span>
                    </button>
                    <button
                      onClick={() => handleNavClick('/products/paneer')}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-[#263D30] hover:bg-[#D8C9AD]/30 flex items-center gap-2.5"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#C2A36C]" />
                      <span>Paneer (Fresh Malai)</span>
                    </button>
                    <button
                      onClick={() => handleNavClick('/products/curd')}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-[#263D30] hover:bg-[#D8C9AD]/30 flex items-center gap-2.5"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#C2A36C]" />
                      <span>Curd (Clay-Pot Dahi)</span>
                    </button>
                    <button
                      onClick={() => handleNavClick('/products/butter')}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-[#263D30] hover:bg-[#D8C9AD]/30 flex items-center gap-2.5"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#C2A36C]" />
                      <span>Butter (White Makhan)</span>
                    </button>
                    <button
                      onClick={() => handleNavClick('/products/khoya-mawa')}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-[#263D30] hover:bg-[#D8C9AD]/30 flex items-center gap-2.5"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#C2A36C]" />
                      <span>Khoya & Mawa</span>
                    </button>
                  </div>
                )}
              </div>

              <button 
                onClick={() => handleNavClick('/products')}
                className={`hover:text-[#A34F37] transition-colors whitespace-nowrap py-1 ${path === '/products' || path === '/shop' ? 'text-[#A34F37] font-bold border-b-2 border-[#A34F37]' : ''}`}
              >
                Products
              </button>

              <button 
                onClick={() => handleNavClick('/account/daily-milk-tracking')}
                className={`hover:text-[#A34F37] transition-colors whitespace-nowrap py-1 flex items-center gap-1 ${path.includes('milk-tracking') ? 'text-[#A34F37] font-bold border-b-2 border-[#A34F37]' : ''}`}
              >
                <Calendar className="w-3.5 h-3.5 text-[#C2A36C]" />
                <span className="hidden xl:inline">Milk Calendar</span>
                <span className="xl:hidden">Calendar</span>
              </button>

              {/* Inline Secondary Links (Visible on 2xl Desktop) */}
              <button 
                onClick={() => handleNavClick('/our-story')}
                className={`hidden 2xl:block hover:text-[#A34F37] transition-colors whitespace-nowrap py-1 ${path === '/our-story' ? 'text-[#A34F37] font-bold border-b-2 border-[#A34F37]' : ''}`}
              >
                Our Story
              </button>

              <button 
                onClick={() => handleNavClick('/quality')}
                className={`hidden 2xl:block hover:text-[#A34F37] transition-colors whitespace-nowrap py-1 ${path === '/quality' ? 'text-[#A34F37] font-bold border-b-2 border-[#A34F37]' : ''}`}
              >
                Our Quality
              </button>

              <button 
                onClick={() => handleNavClick('/contact')}
                className={`hidden 2xl:block hover:text-[#A34F37] transition-colors whitespace-nowrap py-1 ${path === '/contact' ? 'text-[#A34F37] font-bold border-b-2 border-[#A34F37]' : ''}`}
              >
                Contact Us
              </button>

              <button 
                onClick={() => handleNavClick('/faq')}
                className={`hidden 2xl:block hover:text-[#A34F37] transition-colors whitespace-nowrap py-1 ${path === '/faq' ? 'text-[#A34F37] font-bold border-b-2 border-[#A34F37]' : ''}`}
              >
                FAQ
              </button>

              {/* "More ▾" Dropdown for Windows Tab / Laptops below 2xl */}
              <div 
                className="relative 2xl:hidden"
                onMouseEnter={() => setIsMoreDropdownOpen(true)}
                onMouseLeave={() => setIsMoreDropdownOpen(false)}
              >
                <button 
                  onClick={() => setIsMoreDropdownOpen(!isMoreDropdownOpen)}
                  className={`flex items-center gap-0.5 hover:text-[#A34F37] transition-colors whitespace-nowrap py-1 ${
                    ['/our-story', '/quality', '/contact', '/faq'].includes(path) 
                      ? 'text-[#A34F37] font-bold border-b-2 border-[#A34F37]' 
                      : ''
                  }`}
                >
                  <span>More</span>
                  <ChevronDown className="w-3 h-3 text-[#A34F37]" />
                </button>

                {isMoreDropdownOpen && (
                  <div className="absolute top-full left-0 w-44 bg-[#FAF6EE] border border-[#D8C9AD] shadow-xl rounded-2xl py-2 z-50 animate-in fade-in slide-in-from-top-1">
                    <button
                      onClick={() => handleNavClick('/our-story')}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-[#D8C9AD]/30 flex items-center gap-2 ${path === '/our-story' ? 'text-[#A34F37] font-bold' : 'text-[#263D30]'}`}
                    >
                      <span>Our Story</span>
                    </button>
                    <button
                      onClick={() => handleNavClick('/quality')}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-[#D8C9AD]/30 flex items-center gap-2 ${path === '/quality' ? 'text-[#A34F37] font-bold' : 'text-[#263D30]'}`}
                    >
                      <span>Our Quality</span>
                    </button>
                    <button
                      onClick={() => handleNavClick('/contact')}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-[#D8C9AD]/30 flex items-center gap-2 ${path === '/contact' ? 'text-[#A34F37] font-bold' : 'text-[#263D30]'}`}
                    >
                      <span>Contact Us</span>
                    </button>
                    <button
                      onClick={() => handleNavClick('/faq')}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-[#D8C9AD]/30 flex items-center gap-2 ${path === '/faq' ? 'text-[#A34F37] font-bold' : 'text-[#263D30]'}`}
                    >
                      <span>FAQ</span>
                    </button>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* RIGHT SECTION: Search Bar + Account + Subscription + Cart Basket */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-2 xl:gap-2.5 shrink-0 flex-nowrap">
            
            {/* Desktop Full Search Bar (Visible only on 2xl) */}
            <div className="hidden 2xl:flex w-44">
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dairy..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#D8C9AD] rounded-xl text-[#302C26] bg-[#FAF6EE] focus:outline-none focus:border-[#263D30]"
                />
                <Search className="w-3.5 h-3.5 text-[#302C26]/50 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </form>
            </div>

            {/* Search Trigger Icon for Windows Tab, Tablet & Mobile */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="2xl:hidden p-1.5 sm:p-2 text-[#302C26] hover:text-[#A34F37] transition-colors rounded-xl hover:bg-[#D8C9AD]/20 cursor-pointer shrink-0"
              title="Search provisions"
            >
              <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            {/* Wishlist Icon */}
            <button
              onClick={() => handleNavClick('/wishlist')}
              className="hidden md:flex p-1.5 sm:p-2 text-[#302C26] hover:text-[#A34F37] transition-colors relative rounded-xl hover:bg-[#D8C9AD]/20 cursor-pointer shrink-0"
              title="Saved items"
            >
              <Heart className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              {wishlist.length > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#A34F37] text-white text-[9px] font-bold rounded-full flex items-center justify-center font-mono">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Customer / Admin / Manager / Dealer Account Button */}
            <button
              onClick={() => {
                if (currentUser.role === 'admin') {
                  handleNavClick('/admin/dashboard');
                } else if (currentUser.role === 'manager') {
                  handleNavClick('/manager/dashboard');
                } else if (currentUser.role === 'dealer') {
                  handleNavClick('/dealer/dashboard');
                } else if (currentUser.email && currentUser.id !== 'guest') {
                  handleNavClick('/account');
                } else {
                  handleNavClick('/login');
                }
              }}
              className="p-1 sm:p-1.5 text-[#302C26] hover:text-[#A34F37] transition-colors flex items-center gap-1.5 rounded-xl hover:bg-[#D8C9AD]/20 cursor-pointer shrink-0"
              title={currentUser.email ? `${currentUser.fullName} (${currentUser.role})` : 'Sign In'}
            >
              <User className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#263D30] shrink-0" />
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-xs font-bold text-[#263D30] whitespace-nowrap">
                  {currentUser.fullName ? currentUser.fullName.split(' ')[0] : 'Sign In'}
                </span>
                <span className="text-[8.5px] uppercase tracking-wider text-[#A34F37] font-semibold whitespace-nowrap">
                  {currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'manager' ? 'Manager' : currentUser.role === 'dealer' ? 'Dealer' : 'Patron'}
                </span>
              </div>
            </button>

            {/* Quick Morning Subscription Trigger */}
            <button
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-[#263D30] hover:bg-[#1A2B22] text-[#FAF6EE] rounded-xl text-xs font-bold transition-all shadow-xs border border-[#C2A36C]/40 whitespace-nowrap shrink-0 group cursor-pointer"
              title="Subscribe to daily morning A2 milk delivery"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C2A36C] group-hover:rotate-12 transition-transform shrink-0" />
              <span className="hidden xl:inline">Subscription</span>
              <span className="xl:hidden">Subscribe</span>
            </button>

            {/* Shopping Bag Button (Primary Action) */}
            <button
              onClick={() => handleNavClick('/cart')}
              className="bg-[#FAF6EE] text-[#263D30] hover:bg-[#F3EDE1] border border-[#D8C9AD] px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 sm:gap-2 shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-[#A34F37] shrink-0" />
              <span className="hidden sm:inline">Basket</span>
              <span className="bg-[#263D30] text-[#FAF6EE] font-bold font-mono text-[10px] px-1.5 py-0.2 rounded-full">
                {totalCartCount}
              </span>
            </button>
          </div>
        </div>

        {/* Dropdown Search Bar if Active */}
        {isSearchOpen && (
          <div className="bg-[#FAF6EE] border-t border-[#D8C9AD] p-4 shadow-md animate-in slide-in-from-top duration-200">
            <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto flex gap-2">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search raw A2 milk, cultured curd, wooden bilona ghee..."
                className="flex-1 px-4 py-2.5 text-xs border border-[#D8C9AD] rounded-xl text-[#302C26] bg-[#F8F4EC] focus:outline-none focus:border-[#263D30]"
              />
              <button
                type="submit"
                className="bg-[#263D30] text-[#F8F4EC] px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#1A2B22]"
              >
                Search
              </button>
            </form>
          </div>
        )}

        {/* Left Sliding Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div 
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
            />

            {/* Sliding Drawer from Left */}
            <div 
              className="relative w-80 max-w-[85vw] h-full bg-[#FAF6EE] text-[#302C26] shadow-2xl z-10 flex flex-col border-r border-[#D8C9AD] animate-in slide-in-from-left duration-300 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 bg-[#263D30] text-[#FAF6EE] flex items-center justify-between border-b border-[#3A5243]">
                <div className="flex items-center gap-2.5">
                  <img 
                    src="/assets/aistudio/1000095715-clean_c92aa3a9.png" 
                    alt="Dugdhsar Gir Cow Emblem" 
                    className="h-10 w-10 object-contain rounded-xl"
                  />
                  <div>
                    <h3 className="font-serif text-lg font-bold leading-tight text-[#FAF6EE]">
                      DUGDHSAR
                    </h3>
                    <span className="text-[9px] uppercase tracking-wider text-[#C2A36C] font-semibold">
                      60 Years Heritage · Seoni
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#FAF6EE] transition-colors cursor-pointer"
                  title="Close Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Search Bar for Mobile Quick Access */}
              <div className="p-3 bg-[#F8F4EC] border-b border-[#D8C9AD]/60">
                <form onSubmit={handleSearchSubmit} className="relative w-full">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search milk, ghee, paneer, sweets..."
                    className="w-full pl-8 pr-3 py-2 text-xs border border-[#D8C9AD] rounded-xl text-[#302C26] bg-[#FAF6EE] focus:outline-none focus:border-[#263D30]"
                  />
                  <Search className="w-3.5 h-3.5 text-[#302C26]/50 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </form>
              </div>

              {/* Quick Subscribe Morning Bottle Banner */}
              <div className="p-3 bg-[#FAF6EE] border-b border-[#D8C9AD]/60">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsSubscriptionModalOpen(true);
                  }}
                  className="w-full py-2.5 px-3 bg-[#263D30] text-[#FAF6EE] rounded-xl font-bold text-xs flex items-center justify-between shadow-xs border border-[#C2A36C]/40 group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C2A36C] group-hover:rotate-12 transition-transform" />
                    <span>Daily Morning Milk Order</span>
                  </div>
                  <span className="text-[9px] bg-[#C2A36C] text-[#263D30] font-bold px-2 py-0.5 rounded-full">
                    Subscribe
                  </span>
                </button>
              </div>

              {/* Drawer Links List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1 text-xs font-semibold text-[#263D30]">
                {/* 1. Home */}
                <button
                  onClick={() => handleNavClick('/')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-[#D8C9AD]/30 transition-colors ${
                    path === '/' ? 'bg-[#263D30] text-white' : ''
                  }`}
                >
                  <Home className="w-4 h-4 text-[#A34F37]" />
                  <span>Home</span>
                </button>

                {/* 2. All Products */}
                <button
                  onClick={() => handleNavClick('/products')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-[#D8C9AD]/30 transition-colors ${
                    path === '/products' ? 'bg-[#263D30] text-white' : ''
                  }`}
                >
                  <Package className="w-4 h-4 text-[#A34F37]" />
                  <span>All Products</span>
                </button>

                {/* Category Links */}
                <div className="pt-2 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-[#302C26]/50">
                  Dairy Categories
                </div>

                {/* 3. Milk */}
                <button
                  onClick={() => handleNavClick('/products/milk')}
                  className="w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-left hover:bg-[#D8C9AD]/30 transition-colors pl-6"
                >
                  <Milk className="w-3.5 h-3.5 text-[#263D30]" />
                  <span>Milk</span>
                </button>

                {/* 4. Curd */}
                <button
                  onClick={() => handleNavClick('/products/curd')}
                  className="w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-left hover:bg-[#D8C9AD]/30 transition-colors pl-6"
                >
                  <span className="w-2 h-2 rounded-full bg-[#C2A36C]" />
                  <span>Curd (Dahi)</span>
                </button>

                {/* 5. Butter */}
                <button
                  onClick={() => handleNavClick('/products/butter')}
                  className="w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-left hover:bg-[#D8C9AD]/30 transition-colors pl-6"
                >
                  <span className="w-2 h-2 rounded-full bg-[#C2A36C]" />
                  <span>Butter (Makhan)</span>
                </button>

                {/* 6. Ghee */}
                <button
                  onClick={() => handleNavClick('/products/ghee')}
                  className="w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-left hover:bg-[#D8C9AD]/30 transition-colors pl-6"
                >
                  <span className="w-2 h-2 rounded-full bg-[#C2A36C]" />
                  <span>Ghee (Vedic Bilona)</span>
                </button>

                {/* 7. Paneer */}
                <button
                  onClick={() => handleNavClick('/products/paneer')}
                  className="w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-left hover:bg-[#D8C9AD]/30 transition-colors pl-6"
                >
                  <span className="w-2 h-2 rounded-full bg-[#C2A36C]" />
                  <span>Paneer</span>
                </button>

                {/* 8. Khoya & Mawa */}
                <button
                  onClick={() => handleNavClick('/products/khoya-mawa')}
                  className="w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-left hover:bg-[#D8C9AD]/30 transition-colors pl-6"
                >
                  <span className="w-2 h-2 rounded-full bg-[#C2A36C]" />
                  <span>Khoya & Mawa</span>
                </button>

                {/* Brand Information Section */}
                <div className="pt-3 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-[#302C26]/50">
                  Brand & Heritage
                </div>

                {/* Our Story */}
                <button
                  onClick={() => handleNavClick('/our-story')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-[#D8C9AD]/30 transition-colors"
                >
                  <Info className="w-4 h-4 text-[#A34F37]" />
                  <span>Our Story</span>
                </button>

                {/* Our Quality */}
                <button
                  onClick={() => handleNavClick('/quality')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-[#D8C9AD]/30 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-[#A34F37]" />
                  <span>Our Quality & Testing</span>
                </button>

                {/* Contact Us */}
                <button
                  onClick={() => handleNavClick('/contact')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-[#D8C9AD]/30 transition-colors"
                >
                  <PhoneCall className="w-4 h-4 text-[#A34F37]" />
                  <span>Contact Us</span>
                </button>

                {/* Direct Shop Map Location (Google Maps) */}
                <a
                  href={getShopDirectionsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left bg-[#C2A36C]/15 hover:bg-[#C2A36C]/25 text-[#263D30] font-bold border border-[#C2A36C]/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Navigation className="w-4 h-4 text-[#A87520] fill-[#A87520]" />
                    <span>Shop Map &amp; Directions</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#A87520]" />
                </a>

                {/* FAQ */}
                <button
                  onClick={() => handleNavClick('/faq')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-[#D8C9AD]/30 transition-colors"
                >
                  <span className="w-4 h-4 rounded-full bg-[#263D30] text-[#FAF6EE] text-[9px] font-bold flex items-center justify-center">?</span>
                  <span>FAQ (Questions)</span>
                </button>

                {/* Services Section */}
                <div className="pt-3 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-[#302C26]/50">
                  Patron Services
                </div>

                {/* Daily Subscription */}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsSubscriptionModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-[#D8C9AD]/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Milk className="w-4 h-4 text-[#A34F37]" />
                    <span>Daily Subscription</span>
                  </div>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded-full">
                    Doorstep
                  </span>
                </button>

                {/* My Milk Calendar (New Feature) */}
                <button
                  onClick={() => handleNavClick('/account/daily-milk-tracking')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-[#D8C9AD]/30 transition-colors text-[#263D30] font-bold bg-[#FAF6EE] border border-[#C2A36C]/40"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-[#C2A36C]" />
                    <span>My Milk Calendar</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </button>

                {/* Track My Order */}
                <button
                  onClick={() => handleNavClick('/track-order')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-[#D8C9AD]/30 transition-colors"
                >
                  <Truck className="w-4 h-4 text-[#A34F37]" />
                  <span>Track My Order</span>
                </button>
              </div>

              {/* Drawer Footer with Customer Account, Cart & Care */}
              <div className="p-4 bg-[#F8F4EC] border-t border-[#D8C9AD] space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleNavClick('/account')}
                    className="py-2.5 px-3 bg-white hover:bg-[#FAF6EE] border border-[#D8C9AD] rounded-xl text-xs font-semibold text-[#263D30] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-[#A34F37]" />
                    <span className="truncate">{currentUser.fullName ? currentUser.fullName.split(' ')[0] : 'Account'}</span>
                  </button>

                  <button
                    onClick={() => handleNavClick('/cart')}
                    className="py-2.5 px-3 bg-[#263D30] hover:bg-[#1A2B22] text-[#FAF6EE] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#C2A36C]" />
                    <span>Cart ({totalCartCount})</span>
                  </button>
                </div>

                {/* Separate Portals Section */}
                <div className="pt-2 border-t border-[#D8C9AD]/50">
                  <div className="text-[10px] uppercase font-bold text-[#302C26]/50 mb-1.5 px-0.5 tracking-wider">
                    Separate Access Portals
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[10px]">
                    <button
                      onClick={() => handleNavClick('/manager/login')}
                      className="py-1.5 px-2 bg-[#263D30]/10 hover:bg-[#263D30]/20 text-[#263D30] font-bold rounded-lg text-center transition-colors cursor-pointer border border-[#263D30]/20"
                    >
                      📋 Manager
                    </button>
                    <button
                      onClick={() => handleNavClick('/admin/login')}
                      className="py-1.5 px-2 bg-[#A34F37]/10 hover:bg-[#A34F37]/20 text-[#A34F37] font-bold rounded-lg text-center transition-colors cursor-pointer border border-[#A34F37]/20"
                    >
                      🛡️ Admin
                    </button>
                    <button
                      onClick={() => handleNavClick('/dealer/login')}
                      className="py-1.5 px-2 bg-[#C2A36C]/20 hover:bg-[#C2A36C]/35 text-[#5C4524] font-bold rounded-lg text-center transition-colors cursor-pointer border border-[#C2A36C]/40"
                    >
                      🏢 Dealer
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#302C26]/75 px-1 pt-1">
                  <a 
                    href="https://wa.me/917067672604?text=Hello%20Dugdhsar%2C%20I%20have%20an%20enquiry%20regarding%20A2%20milk%20delivery."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-800 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>WhatsApp: +91 7067672604</span>
                  </a>
                  <span className="text-[#302C26]/40 text-[10px]">Vedic Seoni Dairy</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
