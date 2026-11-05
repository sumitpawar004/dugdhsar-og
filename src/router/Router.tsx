import React from 'react';
import { useRouter } from './RouterContext';

// Public pages
import { HomePage } from '../pages/public/HomePage';
import { OurStoryPage } from '../pages/public/OurStoryPage';
import { OurCraftPage } from '../pages/public/OurCraftPage';
import { QualityPage } from '../pages/public/QualityPage';
import { JournalIndexPage } from '../pages/public/JournalIndexPage';
import { JournalPostPage } from '../pages/public/JournalPostPage';
import { ContactPage } from '../pages/public/ContactPage';
import { FaqPage } from '../pages/public/FaqPage';
import { StoreLocatorPage } from '../pages/public/StoreLocatorPage';

// Legal pages
import { PrivacyPolicyPage } from '../pages/legal/PrivacyPolicyPage';
import { TermsPage } from '../pages/legal/TermsPage';
import { ShippingPolicyPage, CancellationRefundPage, ReturnPolicyPage } from '../pages/legal/ShippingPolicyPage';

// Commerce pages
import { ShopPage } from '../pages/commerce/ShopPage';
import { CollectionPage } from '../pages/commerce/CollectionPage';
import { ProductDetailPage } from '../pages/commerce/ProductDetailPage';
import { SearchPage } from '../pages/commerce/SearchPage';
import { CartPage } from '../pages/commerce/CartPage';
import { CheckoutPage } from '../pages/commerce/CheckoutPage';
import { PaymentResultPage } from '../pages/commerce/PaymentResultPage';
import { OrderSuccessPage } from '../pages/commerce/OrderSuccessPage';
import { TrackOrderPage } from '../pages/commerce/TrackOrderPage';
import { WishlistPage } from '../pages/commerce/WishlistPage';

// Account pages
import { LoginPage } from '../pages/account/LoginPage';
import { RegisterPage } from '../pages/account/RegisterPage';
import { AccountOverviewPage } from '../pages/account/AccountOverviewPage';
import { ProfilePage } from '../pages/account/ProfilePage';
import { AddressesPage } from '../pages/account/AddressesPage';
import { OrdersPage } from '../pages/account/OrdersPage';
import { OrderDetailPage } from '../pages/account/OrderDetailPage';
import { DailyMilkTrackingPage } from '../pages/account/DailyMilkTrackingPage';

// Dealer Portal
import { DealerPortalPage } from '../pages/dealer/DealerPortalPage';

// Admin pages
import { AdminLoginPage } from '../pages/admin/AdminLoginPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';

// 404 Fallback
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRouter: React.FC = () => {
  const { path } = useRouter();

  // Root Homepage
  if (path === '/' || path === '') {
    return <HomePage />;
  }

  // Public brand routes
  if (path === '/our-story') return <OurStoryPage />;
  if (path === '/our-craft') return <OurCraftPage />;
  if (path === '/quality') return <QualityPage />;
  if (path === '/journal') return <JournalIndexPage />;
  if (path.startsWith('/journal/')) return <JournalPostPage />;
  if (path === '/contact') return <ContactPage />;
  if (path === '/faq') return <FaqPage />;
  if (path === '/store-locator') return <StoreLocatorPage />;

  // Legal routes
  if (path === '/privacy-policy') return <PrivacyPolicyPage />;
  if (path === '/terms-and-conditions') return <TermsPage />;
  if (path === '/shipping-policy') return <ShippingPolicyPage />;
  if (path === '/cancellation-refund') return <CancellationRefundPage />;
  if (path === '/return-policy') return <ReturnPolicyPage />;

  // Commerce routes
  if (path === '/shop' || path === '/products') return <ShopPage />;
  if (path.startsWith('/collections/')) return <CollectionPage />;
  
  // Support exact requested paths: /products/milk, /products/ghee, /products/paneer, /products/curd, /products/butter, /products/khoya-mawa
  if (path.startsWith('/products/')) {
    const subSlug = path.replace('/products/', '').split('/')[0].split('?')[0];
    const categorySlugs = ['milk', 'ghee', 'paneer', 'curd', 'butter', 'khoya-mawa'];
    if (categorySlugs.includes(subSlug)) {
      return <CollectionPage />;
    }
    return <ProductDetailPage />;
  }
  if (path.startsWith('/product/')) return <ProductDetailPage />;
  if (path === '/search') return <SearchPage />;
  if (path === '/cart') return <CartPage />;
  if (path === '/checkout') return <CheckoutPage />;
  if (path === '/payment/result') return <PaymentResultPage />;
  if (path.startsWith('/order/success/')) return <OrderSuccessPage />;
  if (path === '/track-order') return <TrackOrderPage />;
  if (path === '/wishlist' || path === '/account/wishlist') return <WishlistPage />;

  // Direct login
  if (path === '/login') return <LoginPage />;

  // Account routes
  if (path === '/account/login') return <LoginPage />;
  if (path === '/account/register') return <RegisterPage />;
  if (path === '/account') return <AccountOverviewPage />;
  if (path === '/account/profile') return <ProfilePage />;
  if (path === '/account/addresses') return <AddressesPage />;
  if (path === '/account/daily-milk-tracking' || path === '/account/tracking' || path === '/account/milk-calendar' || path === '/account/subscriptions') {
    return <DailyMilkTrackingPage />;
  }
  if (path === '/account/payments') return <AccountOverviewPage />;
  if (path.startsWith('/account/orders/')) return <OrderDetailPage />;
  if (path === '/account/orders') return <OrdersPage />;

  // B2B Dealer Portal routes (/dealer, /dealer/login, /dealer/dashboard, /dealer/orders, /dealer/inventory, /dealer/reports)
  if (path === '/dealer' || path.startsWith('/dealer/')) {
    return <DealerPortalPage />;
  }

  // Admin Login route
  if (path === '/admin/login') {
    return <AdminLoginPage />;
  }

  // Admin routes (/admin, /admin/dashboard, /admin/products, /admin/categories, /admin/orders, /admin/customers, /admin/dealers, /admin/partners, /admin/inventory, /admin/deliveries, /admin/payments, /admin/offers, /admin/analytics, /admin/reviews, /admin/content, /admin/staff, /admin/settings, /admin/audit-logs)
  if (path === '/admin' || path.startsWith('/admin/')) {
    return <AdminDashboardPage />;
  }

  // 404 Fallback
  return <NotFoundPage />;
};
