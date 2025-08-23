'use client'

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Brand {
  name: string;
  logo: string;
  url?: string;
}

interface BrandCarouselProps {
  title?: string;
  brands?: Brand[];
  seeAllUrl?: string;
  bgColor?: string;
  autoPlayInterval?: number;
}

const defaultBrands: Brand[] = [
  { 
    name: 'Nike', 
    logo: '/images/brands/nike-logo.svg',
    url: '/brand/nike'
  },
  { 
    name: 'Adidas', 
    logo: '/images/brands/adidas-logo.svg',
    url: '/brand/adidas'
  },
  { 
    name: 'Puma', 
    logo: '/images/brands/puma-logo.svg',
    url: '/brand/puma'
  },
  { 
    name: 'Reebok', 
    logo: '/images/brands/reebok-logo.svg',
    url: '/brand/reebok'
  },
  { 
    name: 'Under Armour', 
    logo: '/images/brands/under-armour-logo.svg',
    url: '/brand/under-armour'
  },
  { 
    name: 'New Balance', 
    logo: '/images/brands/new-balance-logo.svg',
    url: '/brand/new-balance'
  },
  { 
    name: 'Converse', 
    logo: '/images/brands/converse-logo.svg',
    url: '/brand/converse'
  },
  { 
    name: 'Vans', 
    logo: '/images/brands/vans-logo.svg',
    url: '/brand/vans'
  }
];

const BrandCarousel: React.FC<BrandCarouselProps> = ({
  title = "Shop by Brands",
  brands = defaultBrands,
  seeAllUrl = "/shop",
  bgColor = "bg-white",
  autoPlayInterval = 3000
}) => {
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout>();

  // Auto-play functionality with smooth scrolling
  useEffect(() => {
    if (isAutoPlaying && carouselRef.current) {
      autoPlayRef.current = setInterval(() => {
        if (carouselRef.current) {
          const scrollAmount = 3; // Faster scroll speed
          carouselRef.current.scrollLeft += scrollAmount;
          
          // Reset to beginning when reaching the end (seamless loop)
          if (carouselRef.current.scrollLeft >= carouselRef.current.scrollWidth / 2) {
            carouselRef.current.scrollLeft = 0;
          }
        }
      }, 16); // 60fps for smooth motion
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, autoPlayInterval]);

  // Pause auto-play on hover
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  const scrollToPrevious = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollToNext = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <section className={`py-16 ${bgColor}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">{title}</h2>
        
        {/* Carousel Container */}
        <div 
          className="relative max-w-6xl mx-auto"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Navigation Buttons */}
          <button
            onClick={scrollToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
            aria-label="Previous brands"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={scrollToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
            aria-label="Next brands"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Brands Horizontal Scroll */}
          <div 
            ref={carouselRef}
            className="flex gap-8 overflow-x-auto scrollbar-hide"
            style={{ 
              scrollBehavior: 'smooth',
              scrollSnapType: 'x mandatory'
            }}
          >
            {/* Duplicate brands for seamless infinite loop */}
            {[...brands, ...brands].map((brand, index) => (
              <div key={`${brand.name}-${index}`} className="group text-center flex-shrink-0 w-32 sm:w-40">
                <Link 
                  href={brand.url || '#'} 
                  className="block transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 relative">
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-800 group-hover:text-purple-600 transition-colors">
                    {brand.name}
                  </p>
                </Link>
              </div>
            ))}
          </div>
        </div>
        
        {/* See All Link */}
        <div className="text-center mt-8">
          <Link 
            href={seeAllUrl} 
            className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium transition-colors duration-300"
          >
            <span>See All</span>
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BrandCarousel;
