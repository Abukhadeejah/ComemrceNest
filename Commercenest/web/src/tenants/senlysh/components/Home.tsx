'use client'

import React, { useState, useEffect } from 'react';

// Import modular components
import HeroSection from './HeroSection';
import CategoriesSection from './CategoriesSection';
import LatestProducts from './LatestProducts';
import FeatureIcons from './FeatureIcons';
import PromotionalBanners from './PromotionalBanners';
import BestSellers from './BestSellers';
import BrandCarousel from './BrandCarousel';
import FeaturedProducts from './FeaturedProducts';
import CustomerReviews from './CustomerReviews';

export default function Home() {
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
    <div className="bg-white overflow-x-auto">
      <div className="min-w-[1200px] w-full">
        {/* Hero Section */}
        <HeroSection autoPlay={true} autoPlayInterval={8000} />

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
}
















