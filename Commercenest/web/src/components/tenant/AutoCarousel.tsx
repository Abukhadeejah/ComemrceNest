'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface AutoCarouselProps {
  children: React.ReactNode[];
  itemsPerView?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showControls?: boolean;
  showArrows?: boolean;
  showIndicators?: boolean;
  showProgress?: boolean;
  className?: string;
  itemClassName?: string;
  onSlideChange?: (currentIndex: number) => void;
}

const AutoCarousel: React.FC<AutoCarouselProps> = ({
  children,
  itemsPerView = { mobile: 2.2, tablet: 2.5, desktop: 4 },
  autoPlay = true,
  autoPlayInterval = 4000,
  showControls = true,
  showArrows = true,
  showIndicators = true,
  showProgress = true,
  className = '',
  itemClassName = '',
  onSlideChange
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const totalItems = children.length;
  const maxIndex = Math.max(0, totalItems - itemsPerView.desktop);

  // Get current items per view based on screen size
  const getItemsPerView = useCallback(() => {
    if (typeof window === 'undefined') return itemsPerView.desktop;
    if (window.innerWidth < 640) return itemsPerView.mobile;
    if (window.innerWidth < 1024) return itemsPerView.tablet;
    return itemsPerView.desktop;
  }, [itemsPerView]);

  const itemsPerViewCurrent = getItemsPerView();
  const maxIndexCurrent = Math.max(0, totalItems - itemsPerViewCurrent);

  // Auto-play functionality with smooth transitions
  useEffect(() => {
    if (!autoPlay || isPaused || isHovered || isDragging) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = (prev + 1) > maxIndexCurrent ? 0 : prev + 1;
        onSlideChange?.(nextIndex);
        return nextIndex;
      });
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, isPaused, isHovered, isDragging, maxIndexCurrent, onSlideChange]);

  // Auto-resume after touch interaction
  useEffect(() => {
    if (!isDragging && !isHovered && autoPlay) {
      const resumeTimeout = setTimeout(() => {
        setIsPaused(false);
      }, 1500); // Shorter delay for better UX

      return () => clearTimeout(resumeTimeout);
    }
  }, [isDragging, isHovered, autoPlay]);

  // Touch/swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setIsPaused(true); // Pause auto-play during touch
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const x = e.touches[0].clientX;
    const walk = (x - startX) * 1.5; // Reduced scroll speed for better control
    const container = e.currentTarget as HTMLElement;
    container.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    // Resume auto-play after a brief delay
    setTimeout(() => {
      setIsPaused(false);
    }, 2000);
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    const container = e.currentTarget as HTMLElement;
    setScrollLeft(container.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.clientX;
    const walk = (x - startX) * 2;
    const container = e.currentTarget as HTMLElement;
    container.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const goToSlide = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, maxIndexCurrent));
    setCurrentIndex(clampedIndex);
    onSlideChange?.(clampedIndex);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev - 1 < 0 ? maxIndexCurrent : prev - 1;
      onSlideChange?.(newIndex);
      return newIndex;
    });
  };

  const goToNext = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev + 1 > maxIndexCurrent ? 0 : prev + 1;
      onSlideChange?.(newIndex);
      return newIndex;
    });
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main carousel container */}
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerViewCurrent)}%)`,
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {children.map((child, index) => (
            <div
              key={index}
              className={`flex-shrink-0 px-2 ${itemClassName}`}
              style={{
                width: `${100 / itemsPerViewCurrent}%`,
              }}
            >
              {child}
            </div>
          ))}
        </div>

        {/* Navigation controls */}
        {showControls && showArrows && totalItems > itemsPerViewCurrent && (
          <>
            {/* Previous button */}
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 z-10 transition-all duration-200 hover:scale-110"
              aria-label="Previous slide"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-700" />
            </button>

            {/* Next button */}
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 z-10 transition-all duration-200 hover:scale-110"
              aria-label="Next slide"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-700" />
            </button>
          </>
        )}

        {/* Progress bar */}
        {showProgress && totalItems > itemsPerViewCurrent && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-in-out"
              style={{
                width: `${((currentIndex + itemsPerViewCurrent) / totalItems) * 100}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Indicators */}
      {showIndicators && totalItems > itemsPerViewCurrent && (
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: maxIndexCurrent + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'bg-purple-500 scale-125'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AutoCarousel;
