'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { Playfair_Display } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700','800','900'] });

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount] = useState(2); // Mock cart count
  const [wishlistCount] = useState(8); // Mock wishlist count

  return (
    <>
      {/* Welcome Banner - Above Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white py-2 sm:py-3 overflow-hidden border-b border-blue-600 shadow-sm">
        <div className="flex whitespace-nowrap animate-marquee" style={{ animationDuration: '40s' }}>
          <div className="flex items-center px-4 sm:px-6 md:px-8">
            <span className="text-sm sm:text-base md:text-lg font-semibold mr-16 sm:mr-32 md:mr-48 drop-shadow-sm">Welcome to Bluebell Interiors - Premium Fabrics & Design</span>
            <span className="text-sm sm:text-base md:text-lg font-semibold mr-16 sm:mr-32 md:mr-48 drop-shadow-sm">Transform Your Space with Timeless Elegance</span>
            <span className="text-sm sm:text-base md:text-lg font-semibold mr-16 sm:mr-32 md:mr-48 drop-shadow-sm">Welcome to Bluebell Interiors - Premium Fabrics & Design</span>
            <span className="text-sm sm:text-base md:text-lg font-semibold mr-16 sm:mr-32 md:mr-48 drop-shadow-sm">Transform Your Space with Timeless Elegance</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 transition-transform hover:scale-[1.02]">
              <div className="w-12 h-12 sm:w-16 sm:h-16">
                <svg viewBox="0 0 220 140" className="w-full h-full">
                  <g transform="translate(110, 25)">
                    <defs>
                      <radialGradient id="petalGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#01589d', stopOpacity: 0.8 }} />
                      </radialGradient>
                      <radialGradient id="accentGradient1" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" style={{ stopColor: '#d4af37', stopOpacity: 0.9 }} />
                        <stop offset="100%" style={{ stopColor: '#d4af37', stopOpacity: 0.4 }} />
                      </radialGradient>
                      <radialGradient id="accentGradient2" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" style={{ stopColor: '#dc143c', stopOpacity: 0.8 }} />
                        <stop offset="100%" style={{ stopColor: '#dc143c', stopOpacity: 0.3 }} />
                      </radialGradient>
                    </defs>
                    <path d="M0 90 Q-25 55 0 20 Q25 55 0 90" fill="url(#petalGradient)" stroke="#01589d" strokeWidth="2" />
                    <path d="M-15 80 Q-35 50 -15 25 Q5 50 -15 80" fill="url(#accentGradient1)" />
                    <path d="M15 80 Q35 50 15 25 Q-5 50 15 80" fill="url(#accentGradient2)" />
                    <circle cx="0" cy="20" r="10" fill="#01589d" opacity="0.9" />
                    <line x1="0" y1="90" x2="0" y2="110" stroke="#8B4513" strokeWidth="4" />
                    <path d="M-20 110 Q0 95 20 110" fill="none" stroke="#8B4513" strokeWidth="3" />
                    <circle cx="-30" cy="40" r="3" fill="#d4af37" opacity="0.6" />
                    <circle cx="30" cy="40" r="3" fill="#dc143c" opacity="0.6" />
                    <circle cx="0" cy="10" r="2" fill="#ffffff" />
                  </g>
                </svg>
              </div>
              <div className="hidden sm:block">
                <h1 className={`${playfair.className} text-xl sm:text-2xl font-bold text-primary`}>
                  Bluebell Interiors
                </h1>
                <p className="text-xs text-gray-600">Premium Fabrics & Design</p>
              </div>
            </Link>

            {/* Navigation Menu - Desktop */}
            <nav className="hidden lg:flex space-x-8">
              <Link href="/" className="text-gray-800 hover:text-primary font-semibold text-sm uppercase tracking-wide transition-colors border-b-2 border-primary pb-1">
                HOME
              </Link>
              <div className="relative group">
                <Link href="/products" className="text-gray-800 hover:text-primary font-semibold text-sm uppercase tracking-wide transition-colors pb-1 flex items-center gap-1">
                  FABRICS
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>
                {/* Dropdown Menu */}
                <div className="absolute top-full left-0 bg-white shadow-lg border border-gray-200 rounded-md py-2 min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                  <Link href="/products/upholstery" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900">Upholstery Fabrics</Link>
                  <Link href="/products/curtains" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900">Curtain & Drapery</Link>
                  <Link href="/products/cushions" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900">Cushion Covers</Link>
                  <Link href="/products/accessories" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900">Accessories</Link>
                </div>
              </div>
              <Link href="/portfolio" className="text-gray-800 hover:text-primary font-semibold text-sm uppercase tracking-wide transition-colors pb-1">
                PORTFOLIO
              </Link>
              <Link href="/new-arrivals" className="text-gray-800 hover:text-primary font-semibold text-sm uppercase tracking-wide transition-colors pb-1">
                NEW ARRIVALS
              </Link>
              <Link href="/sale" className="text-mustard hover:text-primary font-semibold text-sm uppercase tracking-wide transition-colors pb-1">
                SALE
              </Link>
              <Link href="/about" className="text-gray-800 hover:text-primary font-semibold text-sm uppercase tracking-wide transition-colors pb-1">
                ABOUT US
              </Link>
              <Link href="/contact" className="text-gray-800 hover:text-primary font-semibold text-sm uppercase tracking-wide transition-colors pb-1">
                CONTACT
              </Link>
            </nav>

            {/* Hamburger Menu Button - Mobile/Tablet */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:text-primary transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Search and Icons */}
            <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-6">
              {/* Search Bar - Desktop */}
              <div className="relative hidden md:block">
                <input
                  type="text"
                  placeholder="Search for fabrics, patterns, colors..."
                  className="pl-4 pr-10 py-2.5 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-48 lg:w-64 text-sm transition-all duration-300"
                />
                <svg className="absolute right-3 top-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Search Icon - Mobile/Tablet */}
              <Link href="/search" className="md:hidden text-gray-700 hover:text-primary transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Link>

              {/* User Account */}
              <Link href="/login" className="text-gray-700 hover:text-primary transition-colors relative group">
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">●</span>
              </Link>

              {/* Wishlist */}
              <Link href="/wishlist" className="text-gray-700 hover:text-primary transition-colors relative">
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-mustard text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Shopping Cart */}
              <Link href="/cart" className="text-gray-700 hover:text-primary transition-colors relative">
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white border-b border-gray-200 shadow-lg">
            <nav className="container mx-auto px-4 py-4">
              <div className="flex flex-col space-y-4">
                <Link 
                  href="/" 
                  className="text-gray-800 hover:text-primary font-semibold text-base uppercase tracking-wide transition-colors border-b-2 border-primary pb-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  HOME
                </Link>
                <div className="space-y-2">
                  <Link 
                    href="/products" 
                    className="text-gray-800 hover:text-primary font-semibold text-base uppercase tracking-wide transition-colors pb-2 block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    FABRICS
                  </Link>
                  <div className="ml-4 space-y-1">
                    <Link href="/products/upholstery" className="block text-sm text-gray-600 hover:text-gray-800">Upholstery Fabrics</Link>
                    <Link href="/products/curtains" className="block text-sm text-gray-600 hover:text-gray-800">Curtain & Drapery</Link>
                    <Link href="/products/cushions" className="block text-sm text-gray-600 hover:text-gray-800">Cushion Covers</Link>
                    <Link href="/products/accessories" className="block text-sm text-gray-600 hover:text-gray-800">Accessories</Link>
                  </div>
                </div>
                <Link 
                  href="/portfolio" 
                  className="text-gray-800 hover:text-primary font-semibold text-base uppercase tracking-wide transition-colors pb-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  PORTFOLIO
                </Link>
                <Link 
                  href="/new-arrivals" 
                  className="text-gray-800 hover:text-primary font-semibold text-base uppercase tracking-wide transition-colors pb-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  NEW ARRIVALS
                </Link>
                <Link 
                  href="/sale" 
                  className="text-mustard hover:text-primary font-semibold text-base uppercase tracking-wide transition-colors pb-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  SALE
                </Link>
                <Link 
                  href="/about" 
                  className="text-gray-800 hover:text-primary font-semibold text-base uppercase tracking-wide transition-colors pb-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  ABOUT US
                </Link>
                <Link 
                  href="/contact" 
                  className="text-gray-800 hover:text-primary font-semibold text-base uppercase tracking-wide transition-colors pb-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  CONTACT
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}

