'use client'

import React, { useState, useEffect } from 'react';
import { HeroSlide as SharedHeroSlide } from '@/types/hero'

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

// DB-shaped product used by HomeServer
interface ApiProduct {
  id: string
  name: string
  slug: string
  description?: string
  price_cents: number
  compare_at_price_cents?: number
  currency: string
  hero_image_url?: string
  images?: string[]
  stock: number
  status: string
}

interface Category {
  id: string
  name: string
  slug: string
  parent_id?: string
  image_url?: string
  image_alt?: string
}

interface HeroSlide extends SharedHeroSlide {
  id: string
  position: number
  is_active: boolean
}

interface HeroSettings {
  id: string
  auto_play: boolean
  auto_play_interval_ms: number
  bg_overlay_class?: string
}

interface HomeProps {
  products: ApiProduct[]
  categories: Category[]
  heroSlides: HeroSlide[]
  heroSettings: HeroSettings | null
}

export default function Home({ products, categories, heroSlides, heroSettings }: HomeProps) {
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
        <HeroSection 
          heroSlides={heroSlides}
          heroSettings={heroSettings}
          autoPlay={heroSettings?.auto_play ?? true} 
          autoPlayInterval={heroSettings?.auto_play_interval_ms ?? 8000} 
        />

        {/* Categories Section */}
        <CategoriesSection categories={categories} />

        {/* Latest Products Section */}
        <LatestProducts apiProducts={products} />

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




























