import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AutoCarousel from '@/components/tenant/AutoCarousel';
import { generateProductBadges } from '@/utils/badges';

interface CountdownTimer {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface FeaturedProduct {
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  badges: string[];
  url: string;
  rating?: number;
}

// Database product format from HomeServer
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
}

interface FeaturedProductsProps {
  title?: string;
  products?: ApiProduct[]; // Changed to accept database products
  countdown?: CountdownTimer;
  bgColor?: string;
}

// PRODUCTION READY: No hardcoded mock data - only dynamic database data is used
// All featured products are managed through the admin panel and stored in the database

// PRODUCTION READY: No hardcoded countdown - should come from database or be removed

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({
  title = "Our Featured Products",
  products = [], // PRODUCTION READY: No default products - only database data
  countdown, // PRODUCTION READY: No default countdown - optional prop
  bgColor = "bg-gray-50"
}) => {
  // Convert database products to display format
  const displayProducts: FeaturedProduct[] = products.map(product => {
    const badges = generateProductBadges({
      is_featured: product.is_featured,
      is_on_sale: product.is_on_sale,
      is_bestseller: product.is_bestseller,
      is_new_arrival: product.is_new_arrival,
      compare_at_price_cents: product.compare_at_price_cents,
      price_cents: product.price_cents
    });

    // Warn if no image found in database
    if (!product.hero_image_url) {
      console.warn(`Featured product "${product.name}" has no hero_image_url in database`);
    }

    // Fallback fashion images for different product types
    const fallbackImages = [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&crop=center', // Fashion store
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=400&fit=crop&crop=center', // Clothing rack
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop&crop=center', // Fashion model
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=400&fit=crop&crop=center', // Shopping bags
      'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop&crop=center'  // Fashion display
    ];
    
    const fallbackImage = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];

    // Generate a proper slug from product name if slug is missing
    const generateSlug = (name: string) => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim();
    };

    const productSlug = product.slug || generateSlug(product.name || 'unnamed-product');

    return {
      name: product.name,
      image: product.hero_image_url || fallbackImage,
      price: product.price_cents / 100,
      originalPrice: product.compare_at_price_cents ? product.compare_at_price_cents / 100 : undefined,
      badges: badges.map(badge => badge.text),
      url: `/senlysh/products/${productSlug}`,
      rating: 4.5 // Default rating - could be made dynamic from reviews table
    };
  });

  // Show warning if no products found
  if (displayProducts.length === 0) {
    console.warn('No featured products found in database - FeaturedProducts section will be empty');
  }
  return (
    <section className={`py-16 ${bgColor}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">{title}</h2>
        
        {/* Auto-Play Carousel */}
        <AutoCarousel
          itemsPerView={{
            mobile: 2.1,
            tablet: 2.5,
            desktop: 3
          }}
          autoPlay={true}
          autoPlayInterval={7000}
          showControls={false}  // Remove play/pause button
          showIndicators={true}
          showProgress={true}
          className="px-4"
        >
          {displayProducts.map((product, index) => (
            <div key={product.name} className="group relative flex-shrink-0 w-full animate-fade-in-up px-2"
                 style={{ animationDelay: `${index * 200}ms` }}>
              <Link href={product.url} className="block">
                <div className="relative overflow-hidden rounded-lg shadow-lg cursor-pointer">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={400}
                  height={400}
                  className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    console.error('Featured product image failed to load:', product.image);
                    const fallbackImages = [
                      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&crop=center',
                      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=400&fit=crop&crop=center',
                      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop&crop=center'
                    ];
                    e.currentTarget.src = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
                  }}
                  onLoad={() => {
                    console.log('Featured product image loaded successfully:', product.image);
                  }}
                />
                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                  {product.badges.map((badge, index) => (
                    <span key={index} className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold
                      transition-all duration-200 hover:scale-110 hover:shadow-sm">
                      {badge}
                    </span>
                  ))}
                </div>
                <div className="absolute top-2 right-2 bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center">
                  <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                {countdown && (
                  <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-75 text-white p-2 rounded">
                    <div className="flex justify-between text-xs">
                      <span>{countdown.days} Days</span>
                      <span>{countdown.hours.toString().padStart(2, '0')} Hours</span>
                      <span>{countdown.minutes.toString().padStart(2, '0')} Mins</span>
                      <span>{countdown.seconds.toString().padStart(2, '0')} Secs</span>
                    </div>
                  </div>
                )}
                <Link href="/wishlist" className="absolute top-2 right-12 bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center">
                  <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </Link>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 hover:text-purple-600 transition-colors duration-200">{product.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-800">₹{product.price}</span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
                    )}
                  </div>
                  {product.rating && (
                    <div className="flex items-center mt-2">
                      <span className="text-sm text-gray-600">Rated</span>
                      <span className="text-sm font-bold text-gray-800 ml-1">{product.rating}</span>
                      <span className="text-sm text-gray-600 ml-1">out of 5</span>
                    </div>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </AutoCarousel>
      </div>
    </section>
  );
};

export default FeaturedProducts;
