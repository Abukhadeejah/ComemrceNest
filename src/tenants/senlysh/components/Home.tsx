'use client'

import React, { useState, useEffect } from 'react';
import type { HeroSlide as SharedHeroSlide, HeroSettings as SharedHeroSettings } from '@/types/hero'

// Import modular components
import HeroSection from './HeroSection';
import CategoriesSection from './CategoriesSection';
import LatestProducts from './LatestProducts';
import FeatureIcons from './FeatureIcons';
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
  is_featured?: boolean
  is_bestseller?: boolean
  is_on_sale?: boolean
  is_new_arrival?: boolean
  // Variant support
  product_variant_options?: Array<{
    variant_options: {
      id: string
      name: string
      display_name: string
      type: string
      variant_option_values: Array<{
        id: string
        value: string
        display_value: string
        color_hex: string | null
        image_url: string | null
        price_adjustment_cents: number | null
        cost_adjustment_cents: number | null
        sort_order: number | null
      }>
    }
  }>
}

interface Category {
  id: string
  name: string
  slug: string
  parent_id?: string
  image_url?: string
  image_alt?: string
}

type HeroSlide = SharedHeroSlide

type HeroSettings = SharedHeroSettings | null

interface HomeProps {
  products: ApiProduct[]
  categories: Category[]
  heroSlides: HeroSlide[]
  heroSettings: HeroSettings
  variantCombinations: Array<{
    product_id: string
    id: string
    name: string
    price_cents: number
    stock: number
    sku: string
    attributes: Record<string, string>
  }>
}

export default function Home({ products, categories, heroSlides, heroSettings, variantCombinations }: HomeProps) {
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
    <div className="bg-white">
      <div className="w-full max-w-screen-xl mx-auto px-2 sm:px-4 lg:px-6">
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
        <LatestProducts apiProducts={products} variantCombinations={variantCombinations} />

        {/* Feature Icons Section */}
        <FeatureIcons />


        {/* Best Sellers Section */}
        <BestSellers 
          products={products.filter(p => p.is_bestseller)} 
          countdown={countdown}
          variantCombinations={variantCombinations}
        />

        {/* Brand Carousel Section */}
        <BrandCarousel />

        {/* Featured Products Section */}
        <FeaturedProducts 
          products={products.filter(p => p.is_featured)} 
          countdown={countdown}
          variantCombinations={variantCombinations}
        />

        {/* Customer Reviews Section */}
        <CustomerReviews />
      </div>
    </div>
  );
}




























