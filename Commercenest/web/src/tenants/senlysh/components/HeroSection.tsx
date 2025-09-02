'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTenant } from '@/hooks/useTenant'
import { getSiteUrl } from '@/utils/site-urls'

interface HeroSlide {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  ctaText?: string;
  ctaLink: string;
  saleText?: string;
  date?: string;
  bgColor?: string;
  badge?: string;
  countdown?: boolean;
  countdownEnd?: string;
  socialProof?: {
    customers: string;
    rating: string;
    reviews: string;
  };
  urgencyText?: string;
  features?: string[];
}

interface HeroSectionProps {
  slides?: HeroSlide[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

const defaultSlides: HeroSlide[] = [
  {
    id: 1,
    title: 'NEW',
    subtitle: 'COLLECTION',
    description: 'Discover the latest trends in fashion',
    badge: 'TRENDING',
    image: '/images/senlysh/dress-hero.jpg',
    ctaText: 'Shop Now',
    ctaLink: '/new-arrivals',
    bgColor: 'bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900',
    countdown: true,
    countdownEnd: '2024-12-31T23:59:59',
    socialProof: {
      customers: '10,000+',
      rating: '4.8',
      reviews: 'Happy Customers'
    },
    features: ['Premium Quality', 'Latest Trends', 'Express Delivery']
  },
  {
    id: 2,
    title: "WINTER",
    subtitle: 'ESSENTIALS',
    description: 'Stay warm and stylish this season',
    saleText: 'UP TO 50% OFF',
    badge: 'SALE',
    image: '/images/senlysh/subscription-img.png',
    ctaText: 'SHOP SALE',
    ctaLink: '/sale',
    bgColor: 'bg-gradient-to-r from-amber-50 via-orange-100 to-red-50',
    countdown: true,
    countdownEnd: '2024-01-15T23:59:59',
    urgencyText: 'Limited Time Offer - Ends Soon!',
    features: ['Warm & Cozy', 'Trendy Designs', 'Best Prices']
  },
  {
    id: 3,
    title: 'PREMIUM',
    subtitle: 'ACCESSORIES',
    description: 'Complete your look with our premium collection',
    badge: 'PREMIUM',
    image: '/images/senlysh/hero-collection.jpg',
    ctaText: 'Explore Now',
    ctaLink: '/accessories',
    bgColor: 'bg-gradient-to-r from-gray-900/40 via-purple-900/30 to-pink-900/40',
    socialProof: {
      customers: '5,000+',
      rating: '4.9',
      reviews: 'Premium Customers'
    },
    features: ['Luxury Quality', 'Exclusive Designs', 'VIP Service']
  }
];

const HeroSection: React.FC<HeroSectionProps> = ({
  slides = defaultSlides,
  autoPlay = true,
  autoPlayInterval = 8000
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const tenant = useTenant()
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, slides.length]);

  // Countdown timer
  useEffect(() => {
    const currentSlideData = slides[currentSlide];
    if (!currentSlideData?.countdown || !currentSlideData?.countdownEnd) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(currentSlideData.countdownEnd || '').getTime();
      const difference = end - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentSlide, slides]);

  const goToSlide = (index: number) => {
    console.log(`Switching to slide ${index}:`, slides[index]);
    setCurrentSlide(index);
  };

  return (
    <section className="relative w-full h-[500px] sm:h-[600px] md:h-[700px] overflow-hidden">
      {/* Slides */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center pointer-events-none"
              style={{
                backgroundImage: `url(${slide.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
              onError={() => {
                console.error(`Failed to load image: ${slide.image}`);
                // Fallback to gradient background if image fails
                const element = document.querySelector(`[data-slide="${slide.id}"]`) as HTMLElement;
                if (element) {
                  element.style.backgroundImage = 'none';
                }
              }}
              onLoad={() => {
                console.log(`Successfully loaded image: ${slide.image}`);
              }}
              data-slide={slide.id}
            />
            
            {/* Overlay */}
            <div className={`absolute inset-0 ${slide.bgColor} pointer-events-none`}></div>
            
            {/* Content */}
            <div className="absolute inset-0 flex items-center z-10">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl">
                  {/* Badge */}
                  {slide.badge && (
                    <div className="inline-block bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold mb-4 border border-white/30">
                      {slide.badge}
                    </div>
                  )}

                  {/* Urgency Text */}
                  {slide.urgencyText && (
                    <div className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4 inline-block animate-pulse">
                      ⏰ {slide.urgencyText}
                    </div>
                  )}
                  
                  {/* Main Title */}
                  <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold text-white mb-2 sm:mb-4 leading-tight">
                    {slide.title}
                  </h1>
                  
                  {/* Subtitle */}
                  {slide.subtitle && (
                    <h2 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white mb-2 sm:mb-4 leading-tight">
                      {slide.subtitle}
                    </h2>
                  )}
                  
                  {/* Description */}
                  {slide.description && (
                    <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-4 sm:mb-6 font-medium">
                      {slide.description}
                    </p>
                  )}

                  {/* Features List */}
                  {slide.features && (
                    <div className="flex flex-wrap gap-3 mb-6">
                      {slide.features.map((feature, idx) => (
                        <span key={idx} className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                          ✓ {feature}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Sale Text */}
                  {slide.saleText && (
                    <div className="text-2xl sm:text-4xl md:text-6xl font-bold text-yellow-300 mb-4 sm:mb-6 drop-shadow-lg">
                      {slide.saleText}
                    </div>
                  )}

                  {/* Countdown Timer */}
                  {slide.countdown && (
                    <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 mb-6 inline-block">
                      <p className="text-white text-sm mb-2">Offer Ends In:</p>
                      <div className="flex gap-2">
                        <div className="text-center">
                          <div className="bg-white text-gray-900 rounded px-2 py-1 text-lg font-bold">{timeLeft.days}</div>
                          <div className="text-white text-xs mt-1">Days</div>
                        </div>
                        <div className="text-center">
                          <div className="bg-white text-gray-900 rounded px-2 py-1 text-lg font-bold">{timeLeft.hours}</div>
                          <div className="text-white text-xs mt-1">Hours</div>
                        </div>
                        <div className="text-center">
                          <div className="bg-white text-gray-900 rounded px-2 py-1 text-lg font-bold">{timeLeft.minutes}</div>
                          <div className="text-white text-xs mt-1">Mins</div>
                        </div>
                        <div className="text-center">
                          <div className="bg-white text-gray-900 rounded px-2 py-1 text-lg font-bold">{timeLeft.seconds}</div>
                          <div className="text-white text-xs mt-1">Secs</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Social Proof */}
                  {slide.socialProof && (
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-6 inline-block">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-white text-2xl font-bold">{slide.socialProof.customers}</div>
                          <div className="text-white/80 text-sm">{slide.socialProof.reviews}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-yellow-300 text-2xl font-bold">★ {slide.socialProof.rating}</div>
                          <div className="text-white/80 text-sm">Rating</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* CTA Button */}
                  {slide.ctaText && (
                    <Link
                      href={getSiteUrl(slide.ctaLink, tenant.key)}
                      className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 sm:px-10 py-4 sm:py-5 text-lg sm:text-xl font-semibold rounded-full hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      {slide.ctaText}
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Dots */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 sm:w-4 h-3 sm:h-4 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-white scale-125 shadow-lg'
                : 'bg-white bg-opacity-50 hover:bg-opacity-75 hover:scale-110'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
        <div 
          className="h-full bg-white transition-all duration-1000 ease-linear"
          style={{ 
            width: `${((currentSlide + 1) / slides.length) * 100}%` 
          }}
        />
      </div>
    </section>
  );
};

export default HeroSection;
