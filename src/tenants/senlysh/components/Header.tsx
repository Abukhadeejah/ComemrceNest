'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/cart';
import { usePathname } from 'next/navigation';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string;
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { state } = useCart();
  const { isCustomer } = useCustomerAuth();
  const pathname = usePathname();
  const cartCount = state.itemCount;
  const wishlistCount = 0; // TODO: Implement wishlist functionality later
  // Feature flags (superadmin-controlled in future)
  const showNewArrivals = false
  const showSale = false

  // Helper function to determine if a link is active
  const isActive = (href: string) => {
    if (href === '/senlysh') {
      return pathname === '/senlysh' || pathname === '/senlysh/';
    }
    return pathname.startsWith(href);
  };

  // Helper function to get active link classes
  const getActiveClasses = (href: string, baseClasses: string) => {
    return isActive(href) 
      ? `${baseClasses} border-b-2 border-gray-800 pb-1`
      : `${baseClasses} pb-1`;
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/site/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <>
      {/* Welcome Banner - Above Header */}
      <div className="bg-white text-gray-900 py-1.5 sm:py-2 md:py-3 overflow-hidden border-b border-gray-100">
        <div className="flex whitespace-nowrap animate-marquee" style={{ animationDuration: '32.5s' }}>
          <div className="flex items-center px-2 sm:px-3 md:px-4">
            <span className="text-xs sm:text-sm md:text-lg font-semibold mr-12 sm:mr-24 md:mr-48">Welcome To Senlysh - Rewards Begin Now</span>
            <span className="text-xs sm:text-sm md:text-lg font-semibold mr-12 sm:mr-24 md:mr-48">Your Shopping Our Rewards, Free Membership Inside!</span>
            <span className="text-xs sm:text-sm md:text-lg font-semibold mr-12 sm:mr-24 md:mr-48">Welcome To Senlysh - Rewards Begin Now</span>
            <span className="text-xs sm:text-sm md:text-lg font-semibold mr-12 sm:mr-24 md:mr-48">Your Shopping Our Rewards, Free Membership Inside!</span>
            <span className="text-xs sm:text-sm md:text-lg font-semibold mr-12 sm:mr-24 md:mr-48">Welcome To Senlysh - Rewards Begin Now</span>
            <span className="text-xs sm:text-sm md:text-lg font-semibold mr-12 sm:mr-24 md:mr-48">Your Shopping Our Rewards, Free Membership Inside!</span>
            <span className="text-xs sm:text-sm md:text-lg font-semibold mr-12 sm:mr-24 md:mr-48">Welcome To Senlysh - Rewards Begin Now</span>
            <span className="text-xs sm:text-sm md:text-lg font-semibold mr-12 sm:mr-24 md:mr-48">Your Shopping Our Rewards, Free Membership Inside!</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#f7fafc] shadow-sm">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3 md:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/senlysh" className="flex items-center gap-1 sm:gap-2 transition-transform hover:scale-[1.02]">
              <Image 
                src="/images/senlysh/logo.png" 
                alt="Senlysh" 
                width={80}
                height={80}
                className="h-12 sm:h-16 md:h-20 w-auto"
              />
            </Link>

            {/* Navigation Menu - Desktop */}
            <nav className="hidden lg:flex space-x-8">
              <Link href="/senlysh" className={getActiveClasses('/senlysh', 'text-gray-800 hover:text-gray-600 font-semibold text-sm uppercase tracking-wide transition-colors')}>
                HOME
              </Link>
              <div className="relative group">
                <Link href="/senlysh/products" className={getActiveClasses('/senlysh/products', 'text-gray-800 hover:text-gray-600 font-semibold text-sm uppercase tracking-wide transition-colors flex items-center gap-1')}>
                  SHOP
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>
                {/* Dropdown Menu */}
                <div className="absolute top-full left-0 bg-white shadow-lg border border-gray-200 rounded-md py-2 min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                  {loading ? (
                    <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
                  ) : categories.length > 0 ? (
                    categories.slice(0, 8).map((category) => (
                      <Link 
                        key={category.id}
                        href={`/senlysh/products?category=${category.slug}`} 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      >
                        {category.name}
                      </Link>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">No categories available</div>
                  )}
                </div>
              </div>
              {showNewArrivals ? (
                <Link href="/senlysh/new-arrivals" className={getActiveClasses('/senlysh/new-arrivals', 'text-gray-800 hover:text-gray-600 font-semibold text-sm uppercase tracking-wide transition-colors')}>
                  NEW ARRIVALS
                </Link>
              ) : null}
              {showSale ? (
                <Link href="/senlysh/sale" className={getActiveClasses('/senlysh/sale', 'text-red-600 hover:text-red-700 font-semibold text-sm uppercase tracking-wide transition-colors')}>
                  SALE
                </Link>
              ) : null}
              <Link href="/senlysh/about" className={getActiveClasses('/senlysh/about', 'text-gray-800 hover:text-gray-600 font-semibold text-sm uppercase tracking-wide transition-colors')}>
                ABOUT US
              </Link>
              <Link href="/senlysh/contact" className={getActiveClasses('/senlysh/contact', 'text-gray-800 hover:text-gray-600 font-semibold text-sm uppercase tracking-wide transition-colors')}>
                CONTACT US
              </Link>
            </nav>

            {/* Hamburger Menu Button - Mobile/Tablet */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:text-gray-900 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Search and Icons */}
            <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6">
              {/* Search Bar - Desktop */}
              <div className="relative hidden md:block">
                <input
                  type="text"
                  placeholder="Search for clothes, shoes, accessories..."
                  className="pl-4 pr-10 py-2.5 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-48 lg:w-64 text-sm transition-all duration-300"
                />
                <svg className="absolute right-3 top-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Search Icon - Mobile/Tablet */}
              <Link href="/search" className="md:hidden text-gray-700 hover:text-gray-900 transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Link>

              {/* User Account */}
              {isCustomer ? (
                <div className="relative group">
                  <button className="text-gray-700 hover:text-gray-900 transition-colors relative">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">●</span>
                  </button>
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 top-full mt-2 bg-white shadow-lg border border-gray-200 rounded-md py-2 min-w-[160px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                    <Link 
                      href="/senlysh/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        My Profile
                      </div>
                    </Link>
                    <form action="/api/auth/signout" method="post" className="block">
                      <button 
                        type="submit" 
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </div>
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <Link 
                  href="/senlysh/login" 
                  className="text-gray-700 hover:text-gray-900 transition-colors relative group"
                  title="Sign In"
                >
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">●</span>
                </Link>
              )}

              {/* Wishlist */}
              <Link href="/wishlist" className="text-gray-700 hover:text-gray-900 transition-colors relative">
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Shopping Cart */}
              <Link href="/cart" className="text-gray-700 hover:text-gray-900 transition-colors relative">
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold">
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
                  href="/senlysh" 
                  className={getActiveClasses('/senlysh', 'text-gray-800 hover:text-gray-600 font-semibold text-base uppercase tracking-wide transition-colors pb-2')}
                  onClick={() => setIsMenuOpen(false)}
                >
                  HOME
                </Link>
                <div className="space-y-2">
                  <Link 
                    href="/senlysh/products" 
                    className={getActiveClasses('/senlysh/products', 'text-gray-800 hover:text-gray-600 font-semibold text-base uppercase tracking-wide transition-colors pb-2 block')}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    SHOP
                  </Link>
                  <div className="ml-4 space-y-1">
                    {loading ? (
                      <div className="text-sm text-gray-500">Loading...</div>
                    ) : categories.length > 0 ? (
                      categories.slice(0, 6).map((category) => (
                        <Link 
                          key={category.id}
                          href={`/senlysh/products?category=${category.slug}`} 
                          className="block text-sm text-gray-600 hover:text-gray-800"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {category.name}
                        </Link>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">No categories available</div>
                    )}
                  </div>
                </div>
                {showNewArrivals ? (
                  <Link 
                    href="/senlysh/new-arrivals" 
                    className="text-gray-800 hover:text-gray-600 font-semibold text-base uppercase tracking-wide transition-colors pb-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    NEW ARRIVALS
                  </Link>
                ) : null}
                {showSale ? (
                  <Link 
                    href="/senlysh/sale" 
                    className="text-red-600 hover:text-red-700 font-semibold text-base uppercase tracking-wide transition-colors pb-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    SALE
                  </Link>
                ) : null}
                <Link 
                  href="/senlysh/about" 
                  className="text-gray-800 hover:text-gray-600 font-semibold text-base uppercase tracking-wide transition-colors pb-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  ABOUT US
                </Link>
                <Link 
                  href="/senlysh/contact" 
                  className="text-gray-800 hover:text-gray-600 font-semibold text-base uppercase tracking-wide transition-colors pb-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  CONTACT US
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}

