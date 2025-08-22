'use client'

import React, { useState, useEffect } from 'react';

// Import modular components
import HeroSection from './components/HeroSection';
import CategoriesSection from './components/CategoriesSection';
import LatestProducts from './components/LatestProducts';
import FeatureIcons from './components/FeatureIcons';
import PromotionalBanners from './components/PromotionalBanners';
import BestSellers from './components/BestSellers';
import BrandCarousel from './components/BrandCarousel';
import FeaturedProducts from './components/FeaturedProducts';
import CustomerReviews from './components/CustomerReviews';

const SenlyshHome: React.FC = () => {
  const [countdown, setCountdown] = useState({
    days: 129,
    hours: 6,
    minutes: 41,
    seconds: 58
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-auto">
      <div className="min-w-[1200px] w-full">
        {/* Hero Section */}
        <HeroSection />

        {/* Categories Section */}
        <CategoriesSection />

        {/* Latest Products Section */}
        <LatestProducts />

        {/* Feature Icons Section */}
        <FeatureIcons />

        {/* Promotional Banners Section */}
        <PromotionalBanners />

        {/* Best Sellers Section */}
        <BestSellers countdown={countdown} />

        {/* Brand Carousel Section */}
        <BrandCarousel />

        {/* Featured Products Section */}
        <FeaturedProducts countdown={countdown} />

        {/* Customer Reviews Section */}
        <CustomerReviews />
                </div>
              </div>
  );
};

export default SenlyshHome;
