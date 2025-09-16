'use client'

import React from 'react';
import Link from 'next/link';
import AutoCarousel from '@/components/tenant/AutoCarousel';

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
    logo: 'https://logos-world.net/wp-content/uploads/2020/04/Nike-Logo-700x394.png',
    url: '/brand/nike'
  },
  {
    name: 'Adidas',
    logo: 'https://logos-world.net/wp-content/uploads/2020/04/Adidas-Logo-700x394.png',
    url: '/brand/adidas'
  },
  {
    name: 'Puma',
    logo: 'https://logos-world.net/wp-content/uploads/2020/04/Puma-Logo-700x394.png',
    url: '/brand/puma'
  },
  {
    name: 'Reebok',
    logo: 'https://logos-world.net/wp-content/uploads/2020/04/Reebok-Logo-700x394.png',
    url: '/brand/reebok'
  },
  {
    name: 'Under Armour',
    logo: 'https://logos-world.net/wp-content/uploads/2020/04/Under-Armour-Logo-700x394.png',
    url: '/brand/under-armour'
  },
  {
    name: 'New Balance',
    logo: 'https://logos-world.net/wp-content/uploads/2020/09/New-Balance-Logo-2008-present-700x394.jpg',
    url: '/brand/new-balance'
  },
  {
    name: 'Converse',
    logo: 'https://logos-world.net/wp-content/uploads/2020/06/Converse-Logo-700x394.png',
    url: '/brand/converse'
  },
  {
    name: 'Vans',
    logo: 'https://logos-world.net/wp-content/uploads/2020/06/Vans-Logo-500x281.png',
    url: '/brand/vans'
  }
];

const BrandCarousel: React.FC<BrandCarouselProps> = ({
  title = "Shop by Brands",
  brands = defaultBrands,
  seeAllUrl = "/shop",
  bgColor = "bg-white",
  autoPlayInterval: _autoPlayInterval = 3000
}) => {

  return (
    <section className={`py-16 ${bgColor}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">{title}</h2>

        {/* Brands Auto-Play Carousel */}
        <AutoCarousel
          itemsPerView={{
            mobile: 3.5,
            tablet: 4,
            desktop: 6
          }}
          autoPlay={true}
          autoPlayInterval={4000}
          showControls={false}  // Remove play/pause button
          showIndicators={true}
          showProgress={false}
          className="px-4"
        >
          {brands.map((brand, index) => (
            <div key={`${brand.name}-${index}`} className="group text-center flex-shrink-0 w-full animate-fade-in-up px-2"
                 style={{ animationDelay: `${index * 100}ms` }}>
              <Link
                href={brand.url || '#'}
                className="block transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-center justify-center mb-3">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-800 group-hover:text-purple-600 transition-colors duration-200">
                  {brand.name}
                </p>
              </Link>
            </div>
          ))}
        </AutoCarousel>

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
