'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function SenlyshHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount] = useState(3); // Mock cart count
  const [wishlistCount] = useState(12); // Mock wishlist count

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
            <Link href="/" className="flex items-center gap-1 sm:gap-2 transition-transform hover:scale-[1.02]">
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
              <Link href="/" className="text-gray-800 hover:text-gray-600 font-semibold text-sm uppercase tracking-wide transition-colors border-b-2 border-gray-800 pb-1">
                HOME
              </Link>
              <div className="relative group">
                <Link href="/shop" className="text-gray-800 hover:text-gray-600 font-semibold text-sm uppercase tracking-wide transition-colors pb-1 flex items-center gap-1">
                  SHOP
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>
                {/* Dropdown Menu */}
                <div className="absolute top-full left-0 bg-white shadow-lg border border-gray-200 rounded-md py-2 min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                  <Link href="/shop/men" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900">Men&apos;s Fashion</Link>
                  <Link href="/shop/women" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900">Women&apos;s Fashion</Link>
                  <Link href="/shop/kids" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900">Kids & Teens</Link>
                  <Link href="/shop/accessories" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900">Accessories</Link>
                  <Link href="/shop/shoes" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900">Footwear</Link>
                </div>
              </div>
              <Link href="/new-arrivals" className="text-gray-800 hover:text-gray-600 font-semibold text-sm uppercase tracking-wide transition-colors pb-1">
                NEW ARRIVALS
              </Link>
              <Link href="/sale" className="text-red-600 hover:text-red-700 font-semibold text-sm uppercase tracking-wide transition-colors pb-1">
                SALE
              </Link>
              <Link href="/about" className="text-gray-800 hover:text-gray-600 font-semibold text-sm uppercase tracking-wide transition-colors pb-1">
                ABOUT US
              </Link>
              <Link href="/contact" className="text-gray-800 hover:text-gray-600 font-semibold text-sm uppercase tracking-wide transition-colors pb-1">
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

              {/* User Account Dropdown */}
              <div className="relative group">
                <button className="text-gray-700 hover:text-gray-900 transition-colors relative group flex items-center">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">●</span>
                </button>
                
                {/* Profile Dropdown Menu */}
                <div className="absolute top-full right-0 bg-white shadow-lg border border-gray-200 rounded-md py-2 min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                  <Link href="/senlysh/my-account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    My Account
                  </Link>
                  <Link href="/senlysh/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    My Orders
                  </Link>
                  <Link href="/senlysh/wallet" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    My Wallet
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <Link href="/senlysh/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </Link>
                  <Link href="/senlysh/login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Login / Register
                  </Link>
                </div>
              </div>

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
                  href="/" 
                  className="text-gray-800 hover:text-gray-600 font-semibold text-base uppercase tracking-wide transition-colors border-b-2 border-gray-800 pb-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  HOME
                </Link>
                <div className="space-y-2">
                  <Link 
                    href="/shop" 
                    className="text-gray-800 hover:text-gray-600 font-semibold text-base uppercase tracking-wide transition-colors pb-2 block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    SHOP
                  </Link>
                  <div className="ml-4 space-y-1">
                    <Link href="/shop/men" className="block text-sm text-gray-600 hover:text-gray-800">Men&apos;s Fashion</Link>
                    <Link href="/shop/women" className="block text-sm text-gray-600 hover:text-gray-800">Women&apos;s Fashion</Link>
                    <Link href="/shop/kids" className="block text-sm text-gray-600 hover:text-gray-800">Kids & Teens</Link>
                    <Link href="/shop/accessories" className="block text-sm text-gray-600 hover:text-gray-800">Accessories</Link>
                  </div>
                </div>
                <Link 
                  href="/new-arrivals" 
                  className="text-gray-800 hover:text-gray-600 font-semibold text-base uppercase tracking-wide transition-colors pb-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  NEW ARRIVALS
                </Link>
                <Link 
                  href="/sale" 
                  className="text-red-600 hover:text-red-700 font-semibold text-base uppercase tracking-wide transition-colors pb-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  SALE
                </Link>
                <Link 
                  href="/about" 
                  className="text-gray-800 hover:text-gray-600 font-semibold text-base uppercase tracking-wide transition-colors pb-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  ABOUT US
                </Link>
                <Link 
                  href="/contact" 
                  className="text-gray-800 hover:text-gray-600 font-semibold text-base uppercase tracking-wide transition-colors pb-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  CONTACT US
                </Link>
                
                {/* Mobile Profile Menu */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="text-gray-600 font-semibold text-sm uppercase tracking-wide mb-2">Account</div>
                  <div className="space-y-2 ml-4">
                    <Link 
                      href="/senlysh/my-account" 
                      className="block text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      My Account
                    </Link>
                    <Link 
                      href="/senlysh/orders" 
                      className="block text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      My Orders
                    </Link>
                    <Link 
                      href="/senlysh/wallet" 
                      className="block text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      My Wallet
                    </Link>
                    <Link 
                      href="/senlysh/login" 
                      className="block text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                      </svg>
                      Login / Register
                    </Link>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
