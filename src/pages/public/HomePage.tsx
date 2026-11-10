import React, { useState, useEffect } from 'react';
import { HeroSection } from '../../components/HeroSection';
import { PasteurizationSection } from '../../components/PasteurizationSection';
import { WhyLoveSection } from '../../components/WhyLoveSection';
import { NutritionMatrixSection } from '../../components/NutritionMatrixSection';
import { InstagramFeed } from '../../components/InstagramFeed';
import { ProductsSection } from '../../components/ProductsSection';
import { CustomerQuickActionsSection } from '../../components/CustomerQuickActionsSection';
import { ShopMapSection } from '../../components/ShopMapSection';

export const HomePage: React.FC = () => {
  return (
    <div className="w-full">
      {/* 1st Section: Landscape Running Background Hero Carousel */}
      <HeroSection />

      {/* 2nd Section: Master Featured Product Catalog (All Provisions, A2 Milk, Bilona Ghee, Paneer, Curd, etc.) */}
      <ProductsSection />

      {/* 3rd Section: Customer Quick Action Section: 5 Main Services (Daily Subscription, Track My Order, My Orders, Help & Support, My Milk Calendar) */}
      <CustomerQuickActionsSection />

      {/* Industrial Pasteurization Piping & Facility */}
      <PasteurizationSection />

      {/* Why Love Dugdhsar with interactive Vedic bio-science */}
      <WhyLoveSection />

      {/* Nutrition Matrix: One Glass of A2 Equals */}
      <NutritionMatrixSection />

      {/* Instagram Feed Component (Automatically fetches from Instagram Graph API @dugdhsar.in) */}
      <InstagramFeed />

      {/* Physical Shop Location & Interactive Google Map (Barghat Rd, Seoni) */}
      <ShopMapSection />
    </div>
  );
};
