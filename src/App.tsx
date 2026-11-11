import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { RouterProvider } from './router/RouterContext';
import { AppRouter } from './router/Router';
import { Preloader } from './components/Preloader';
import { Navbar } from './components/Navbar';
import { FooterSection } from './components/FooterSection';
import { FloatingControls } from './components/FloatingControls';
import { CartDrawer } from './components/CartDrawer';
import { QAAuditConsole } from './components/QAAuditConsole';
import { MorningSubscriptionModal } from './components/MorningSubscriptionModal';
import { ProductReviewModal } from './components/ProductReviewModal';

import { ErrorBoundary } from './components/ErrorBoundary';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { initWebVitals } from './lib/analytics';

const AppContent: React.FC = () => {
  const { activeViewport } = useStore();
  const [isPreloaderDone, setIsPreloaderDone] = useState(false);

  React.useEffect(() => {
    initWebVitals();
  }, []);

  const viewportContainerClass = 
    activeViewport === 'mobile' 
      ? 'max-w-[390px] mx-auto shadow-2xl border-x-4 border-[#263D30] my-4 rounded-3xl overflow-hidden bg-[#F8F4EC]' 
      : activeViewport === 'tablet' 
      ? 'max-w-[768px] mx-auto shadow-2xl border-x-4 border-[#263D30] my-4 rounded-2xl overflow-hidden bg-[#F8F4EC]' 
      : 'w-full bg-[#F8F4EC]';

  return (
    <div className="min-h-screen bg-[#F8F4EC] text-[#302C26] flex flex-col relative overflow-x-hidden w-full max-w-full pb-16 sm:pb-0 selection:bg-[#C2A36C] selection:text-[#263D30]">
      {/* WCAG 2.2 AA Skip Link for Keyboard & Screen Reader Users */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#263D30] focus:text-[#F8F4EC] focus:font-medium focus:rounded-lg focus:shadow-xl focus:ring-2 focus:ring-[#C2A36C] focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Exact Video Milk Bottle Silhouette Filling Preloader */}
      <Preloader onComplete={() => setIsPreloaderDone(true)} />

      {/* Main Viewport Container */}
      <div className={`${viewportContainerClass} overflow-x-hidden`}>
        {/* Navigation Bar */}
        <Navbar />

        {/* Dynamic Multi-Route Viewport Engine with Error Boundary */}
        <main id="main-content" tabIndex={-1} className="flex-1 w-full focus:outline-none" role="main">
          <ErrorBoundary>
            <AppRouter />
          </ErrorBoundary>
        </main>

        {/* Master Footer */}
        <FooterSection />
      </div>

      {/* Floating Bottom Controls: WhatsApp & Scroll-To-Top */}
      <FloatingControls />

      {/* Global Modals & Slide-out Drawers */}
      <CartDrawer />
      <QAAuditConsole />
      <MorningSubscriptionModal />
      <ProductReviewModal />

      {/* Privacy and Cookie Consent Banner */}
      <CookieConsentBanner />
    </div>
  );
};

export default function App({ initialPath }: { initialPath?: string } = {}) {
  return (
    <StoreProvider>
      <RouterProvider initialPath={initialPath}>
        <AppContent />
      </RouterProvider>
    </StoreProvider>
  );
}
