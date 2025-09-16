'use client'

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTenant } from '@/hooks/useTenant'
import { getSiteUrl } from '@/utils/site-urls'
import { HeroSlide as SharedHeroSlide } from '@/types/hero'

interface DatabaseHeroSlide extends SharedHeroSlide {
  id: string;
  position: number;
  is_active: boolean;
}

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

interface HeroSettings {
  id: string;
  auto_play: boolean;
  auto_play_interval_ms: number;
  bg_overlay_class?: string;
}

interface HeroSectionProps {
  heroSlides?: DatabaseHeroSlide[];
  heroSettings?: HeroSettings | null;
  slides?: HeroSlide[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

// PRODUCTION READY: No hardcoded mock data - only dynamic database data is used
// All hero slides are managed through the admin panel and stored in the database

const HeroSection: React.FC<HeroSectionProps> = ({
  heroSlides = [],
  heroSettings = null,
  slides: _slides = [], // PRODUCTION READY: No default slides - only database data
  autoPlay = true,
  autoPlayInterval = 2000
}) => {
  // Convert database slides to component format - PRODUCTION READY: No fallback to mock data
  const clampOverlay = (overlayClass?: string): string => {
    if (!overlayClass) return 'bg-black/30';
    // Only allow 10–60 strength to guarantee image remains visible
    const match = overlayClass.match(/bg-(black|white)\/(\d{1,2})/);
    if (match) {
      const color = match[1];
      const strength = Math.min(60, Math.max(10, parseInt(match[2] || '30', 10)));
      return `bg-${color}/${strength}`;
    }
    return overlayClass;
  };

  const getSlides = (): HeroSlide[] => {
    if (heroSlides && heroSlides.length > 0) {
      return heroSlides.map((dbSlide, index) => {
        // PRODUCTION READY: No fallback images - only database data
        const imageUrl = dbSlide.image_url;

        if (!imageUrl) {
          console.warn(`Hero slide ${index + 1} has no image_url in database`);
        }

        console.log(`Hero slide ${index + 1}:`, {
          title: dbSlide.title,
          imageUrl,
          bgOverlay: dbSlide.bg_overlay_class
        });

        return {
          id: index + 1,
          title: dbSlide.title || 'New Collection',
          subtitle: dbSlide.subtitle || 'Discover',
          description: dbSlide.description || 'Explore our latest collection',
          image: imageUrl || '', // Only use database image - no fallbacks
          ctaText: dbSlide.cta_text || 'Shop Now',
          ctaLink: dbSlide.cta_link || '/products',
          saleText: dbSlide.sale_text,
          badge: dbSlide.badge,
          countdown: dbSlide.countdown || false,
          countdownEnd: dbSlide.countdown_end,
          // Safe default: translucent black overlay so image is always visible if admin leaves blank
          bgColor: clampOverlay(dbSlide.bg_overlay_class),
          urgencyText: dbSlide.urgency_text,
          features: Array.isArray(dbSlide.features) ? dbSlide.features : []
        };
      });
    }
    // PRODUCTION READY: No fallback to mock data - return empty array if no database data
    console.warn('No hero slides found in database - HeroSection will be empty');
    return [];
  };

  const finalSlides = getSlides();
  const finalAutoPlay = heroSettings?.auto_play ?? autoPlay;
  const finalAutoPlayInterval = heroSettings?.auto_play_interval_ms ?? autoPlayInterval;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const tenant = useTenant()
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Auto-play functionality
  useEffect(() => {
    if (!finalAutoPlay || isPaused) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % finalSlides.length);
    }, finalAutoPlayInterval);

    return () => clearInterval(interval);
  }, [finalAutoPlay, finalAutoPlayInterval, finalSlides.length, isPaused]);

  // Pause on hover
  const handleMouseEnter = () => {
    if (finalAutoPlay) setIsPaused(true);
  };

  const handleMouseLeave = () => {
    if (finalAutoPlay) setIsPaused(false);
  };

  // Navigation functions
  const goToPreviousSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === 0 ? finalSlides.length - 1 : prev - 1));
  }, [finalSlides.length]);

  const goToNextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % finalSlides.length);
  }, [finalSlides.length]);

  // const togglePause = () => {
  //   setIsPaused((prev) => !prev);
  // };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        goToPreviousSlide();
      } else if (event.key === 'ArrowRight') {
        goToNextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [finalSlides.length, goToNextSlide, goToPreviousSlide]);

  // Countdown timer
  useEffect(() => {
    const currentSlideData = finalSlides[currentSlide];
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
  }, [currentSlide, finalSlides]);

  const goToSlide = (index: number) => {
    console.log(`Switching to slide ${index}:`, finalSlides[index]);
    setCurrentSlide(index);
  };

  return (
    <section
      className="relative w-full h-[600px] sm:h-[700px] md:h-[700px] overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Slides */}
      <div className="relative w-full h-full">
        {finalSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Full-bleed Background Image (robust) */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900">
              {slide.image && (
                <Image
                  src={encodeURI(slide.image)}
                  alt=""
                  fill
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Hero image failed to load:', slide.image);
                    e.currentTarget.style.display = 'none';
                  }}
                  onLoad={() => {
                    console.log('Hero image loaded successfully:', slide.image);
                  }}
                />
              )}
            </div>
            {/* Overlay for readability */}
            <div className={`absolute inset-0 ${slide.bgColor || 'bg-black/40'} pointer-events-none`}></div>
            
            {/* Content */}
            <div className="absolute inset-0 flex items-center z-10">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl">
                  <div className="space-y-3">
                    {/* Badge */}
                    {slide.badge && (
                      <div className="inline-block bg-red-600 text-white px-2 py-1 rounded text-xs font-bold uppercase tracking-wide">
                        {slide.badge}
                      </div>
                    )}

                    {/* Urgency Text */}
                    {slide.urgencyText && (
                      <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold inline-block ml-2">
                        ⏰ {slide.urgencyText}
                      </div>
                    )}
                    
                    {/* Main Title */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
                      {slide.title}
                    </h1>
                    
                    {/* Subtitle */}
                    {slide.subtitle && (
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white/90 leading-tight">
                        {slide.subtitle}
                      </h2>
                    )}
                    
                    {/* Description */}
                    {slide.description && (
                      <p className="text-sm sm:text-base md:text-lg text-white/80 leading-relaxed">
                        {slide.description}
                      </p>
                    )}

                    {/* Features List */}
                    {slide.features && (
                      <div className="flex flex-wrap gap-2">
                        {slide.features.map((feature, idx) => (
                          <span key={idx} className="bg-white/10 text-white px-2 py-1 rounded text-xs">
                            ✓ {feature}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Sale Text */}
                    {slide.saleText && (
                      <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-300">
                        {slide.saleText}
                      </div>
                    )}

                    {/* Countdown Timer */}
                    {slide.countdown && (
                      <div className="bg-black/40 rounded-lg p-3 inline-block">
                        <p className="text-white text-xs mb-2">Offer Ends In:</p>
                        <div className="flex gap-1">
                          <div className="text-center">
                            <div className="bg-white text-gray-900 rounded px-2 py-1 text-sm font-bold">{timeLeft.days}</div>
                            <div className="text-white text-xs mt-1">Days</div>
                          </div>
                          <div className="text-center">
                            <div className="bg-white text-gray-900 rounded px-2 py-1 text-sm font-bold">{timeLeft.hours}</div>
                            <div className="text-white text-xs mt-1">Hours</div>
                          </div>
                          <div className="text-center">
                            <div className="bg-white text-gray-900 rounded px-2 py-1 text-sm font-bold">{timeLeft.minutes}</div>
                            <div className="text-white text-xs mt-1">Mins</div>
                          </div>
                          <div className="text-center">
                            <div className="bg-white text-gray-900 rounded px-2 py-1 text-sm font-bold">{timeLeft.seconds}</div>
                            <div className="text-white text-xs mt-1">Secs</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Social Proof */}
                    {slide.socialProof && (
                      <div className="bg-white/10 rounded-lg p-3 inline-block">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-white text-lg font-bold">{slide.socialProof.customers}</div>
                            <div className="text-white/80 text-xs">{slide.socialProof.reviews}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-yellow-300 text-lg font-bold">★ {slide.socialProof.rating}</div>
                            <div className="text-white/80 text-xs">Rating</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* CTA Button */}
                    {slide.ctaText && (
                      <Link
                        href={getSiteUrl(slide.ctaLink, tenant.key)}
                        className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 text-base font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        {slide.ctaText}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>


      {/* Navigation Controls */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 sm:space-x-6">

        {/* Pagination Dots */}
        {finalSlides.map((_, index) => (
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
            width: `${((currentSlide + 1) / finalSlides.length) * 100}%`
          }}
        />
      </div>

      {/* Auto-play indicator */}
      {!isPaused && finalAutoPlay && finalSlides.length > 1 && (
        <div className="absolute top-6 right-6 bg-black/30 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Auto-play</span>
        </div>
      )}
    </section>
  );
};

export default HeroSection;
