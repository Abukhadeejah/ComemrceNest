'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/cart';
import { usePathname } from 'next/navigation';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { Category, CategoryTree, buildCategoryTree, filterTestCategories } from '@/lib/categories';
import MembershipStatusIndicator from '@/components/MembershipStatusIndicator';
import MembershipUpgradeModal from '@/components/MembershipUpgradeModal';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const { state } = useCart();
  const { isCustomer, user } = useCustomerAuth();
  const pathname = usePathname();
  const cartCount = state.itemCount;
  const wishlistCount = 0;
  
  const showNewArrivals = false;
  const showSale = false;

  const isActive = (href: string) => {
    if (href === '/senlysh') {
      return pathname === '/senlysh' || pathname === '/senlysh/';
    }
    return pathname.startsWith(href);
  };

  const getActiveClasses = (href: string, baseClasses: string) => {
    return isActive(href) 
      ? `${baseClasses} border-b-2 border-gray-800 pb-1`
      : `${baseClasses} pb-1`;
  };

  // Removed: filterTestCategories and buildCategoryTree - now imported from lib/categories

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/site/categories');
        if (response.ok) {
          const data = await response.json();
          const cats = filterTestCategories(data.categories || []);
          setCategories(cats);
          setCategoryTree(buildCategoryTree(cats));
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
      {/* Welcome Banner */}
      <div className="bg-white text-gray-900 py-1.5 sm:py-2 md:py-3 overflow-hidden border-b border-gray-100">
        <div className="flex whitespace-nowrap animate-marquee" style={{ animationDuration: '32.5s' }}>
          <div className="flex items-center px-2 sm:px-3 md:px-4">
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
      <header className="sticky top-0 z-[100] bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/senlysh" className="flex items-center gap-2 transition-transform hover:scale-[1.02]">
              <Image 
                src="/images/senlysh/logo.png" 
                alt="Senlysh" 
                width={80}
                height={80}
                className="h-12 sm:h-16 md:h-20 w-auto"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-8">
              <Link href="/senlysh" className={getActiveClasses('/senlysh', 'text-gray-800 hover:text-purple-600 font-semibold text-sm uppercase tracking-wide transition-colors')}>
                HOME
              </Link>
              
              {/* 2-Level SHOP Dropdown */}
              <div className="relative group">
                <Link href="/senlysh/products" className={getActiveClasses('/senlysh/products', 'text-gray-800 hover:text-purple-600 font-semibold text-sm uppercase tracking-wide transition-colors flex items-center gap-1')}>
                  SHOP
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>
                
                <div className="absolute top-full left-0 bg-white shadow-lg border border-gray-200 rounded-md py-2 min-w-[220px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                  {loading ? (
                    <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
                  ) : categoryTree.length > 0 ? (
                    categoryTree.map((rootCategory) => (
                      <div key={rootCategory.id} className="relative group/sub">
                        <Link 
                          href={`/senlysh/products?categories[]=${rootCategory.slug}`} 
                          className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                        >
                          <span>{rootCategory.name}</span>
                          {rootCategory.children && rootCategory.children.length > 0 && (
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </Link>
                        
                        {rootCategory.children && rootCategory.children.length > 0 && (
                          <div className="absolute left-full top-0 bg-white shadow-lg border border-gray-200 rounded-md py-2 min-w-[200px] opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-300 z-50 ml-1">
                            {rootCategory.children.map((subCategory) => (
                              <Link 
                                key={subCategory.id}
                                href={`/senlysh/products?categories[]=${subCategory.slug}`} 
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                              >
                                {subCategory.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">No categories available</div>
                  )}
                </div>
              </div>

              {showNewArrivals && (
                <Link href="/senlysh/new-arrivals" className={getActiveClasses('/senlysh/new-arrivals', 'text-gray-800 hover:text-purple-600 font-semibold text-sm uppercase tracking-wide transition-colors')}>
                  NEW ARRIVALS
                </Link>
              )}
              {showSale && (
                <Link href="/senlysh/sale" className={getActiveClasses('/senlysh/sale', 'text-red-600 hover:text-red-700 font-semibold text-sm uppercase tracking-wide transition-colors')}>
                  SALE
                </Link>
              )}
              <Link href="/senlysh/about" className={getActiveClasses('/senlysh/about', 'text-gray-800 hover:text-purple-600 font-semibold text-sm uppercase tracking-wide transition-colors')}>
                ABOUT US
              </Link>
              <Link href="/senlysh/contact" className={getActiveClasses('/senlysh/contact', 'text-gray-800 hover:text-purple-600 font-semibold text-sm uppercase tracking-wide transition-colors')}>
                CONTACT
              </Link>
            </nav>

            {/* Icons */}
            <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-6">
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

              <Link href="/search" className="md:hidden text-gray-700 hover:text-purple-600 transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Link>

              {/* Membership Status Indicator */}
              <MembershipStatusIndicator 
                customerId={user?.id}
                onUpgradeClick={() => setShowMembershipModal(true)}
                className="hidden sm:block"
              />

              {/* User Account */}
              {isCustomer ? (
                <div className="relative group">
                  <button className="text-gray-700 hover:text-purple-600 transition-colors relative">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">●</span>
                  </button>
                  <div className="absolute right-0 top-full mt-2 bg-white shadow-lg border border-gray-200 rounded-md py-2 min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                    <Link 
                      href="/senlysh/my-account" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        My Account
                      </div>
                    </Link>
                    <Link 
                      href="/senlysh/orders" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        My Orders
                      </div>
                    </Link>
                    <Link 
                      href="/senlysh/wallet" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        My Wallet
                      </div>
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <Link 
                      href="/senlysh/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </div>
                    </Link>
                    <form action="/api/auth/signout" method="post" className="block">
                      <button 
                        type="submit" 
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600"
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
                  className="text-gray-700 hover:text-purple-600 transition-colors relative group"
                  title="Sign In"
                >
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">●</span>
                </Link>
              )}

              <Link href="/wishlist" className="text-gray-700 hover:text-purple-600 transition-colors relative">
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>

              {isCustomer && (
                <Link href="/senlysh/wallet" className="text-gray-700 hover:text-purple-600 transition-colors relative" title="Wallet">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h12a2 2 0 012 2v1h1a1 1 0 010 2h-1v5a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm2-1h12a1 1 0 011 1v1H5V7a1 1 0 011-1z" />
                  </svg>
                </Link>
              )}

              <Link href="/cart" className="text-gray-700 hover:text-purple-600 transition-colors relative">
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 text-gray-700 hover:text-purple-600 transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* PREMIUM MOBILE MENU - BLUEBELL STYLE */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[9999]">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsMenuOpen(false)} />

          <div className="absolute right-0 top-0 h-full w-full sm:w-[85vw] sm:max-w-md bg-white shadow-2xl overflow-y-auto">

            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-b from-purple-600 to-purple-700 px-6 py-6 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-full p-2 flex items-center justify-center">
                  <Image 
                    src="/images/senlysh/logo.png" 
                    alt="Senlysh" 
                    width={48}
                    height={48}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Menu</h2>
                  <p className="text-xs text-purple-100">Senlysh Fashion</p>
                </div>
              </div>
              <button onClick={() => setIsMenuOpen(false)} className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-all group">
                <svg className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="px-4 py-6 space-y-2 bg-white">

              {/* HOME */}
              <Link href="/senlysh" className="flex items-center justify-between py-3 px-4 text-sm font-bold text-gray-900 hover:text-white bg-gray-50 hover:bg-purple-600 rounded-xl transition-all shadow-sm group"
                onClick={() => setIsMenuOpen(false)}>
                <span>HOME</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              {/* SHOP Accordion with Categories */}
              <div className="mb-2">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'shop' ? null : 'shop')}
                  className="w-full flex items-center justify-between py-3 px-4 text-sm font-bold text-gray-900 hover:text-white bg-gray-50 hover:bg-purple-600 rounded-xl transition-all shadow-sm group"
                >
                  <span>SHOP</span>
                  <svg className={`w-4 h-4 transition-transform duration-200 ${openDropdown === 'shop' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {openDropdown === 'shop' && (
                  <div className="mt-2 ml-2 space-y-1 pl-3 border-l-2 border-purple-200">
                    {loading ? (
                      <div className="text-xs text-gray-500 px-3 py-2">Loading categories...</div>
                    ) : categoryTree.length > 0 ? (
                      categoryTree.map((rootCategory) => (
                        <div key={rootCategory.id} className="space-y-1">
                          <Link 
                            href={`/senlysh/products?categories[]=${rootCategory.slug}`} 
                            className="flex items-center py-2 px-3 text-xs font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mr-2"></span>
                            {rootCategory.name}
                          </Link>
                          
                          {rootCategory.children && rootCategory.children.length > 0 && (
                            <div className="ml-4 space-y-1">
                              {rootCategory.children.map((subCategory) => (
                                <Link 
                                  key={subCategory.id}
                                  href={`/senlysh/products?categories[]=${subCategory.slug}`} 
                                  className="flex items-center py-1.5 px-3 text-[11px] text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                  onClick={() => setIsMenuOpen(false)}
                                >
                                  <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                                  {subCategory.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-500 px-3 py-2">No categories</div>
                    )}
                  </div>
                )}
              </div>

              {showNewArrivals && (
                <Link href="/senlysh/new-arrivals" className="flex items-center justify-between py-3 px-4 text-sm font-bold text-gray-900 hover:text-white bg-gray-50 hover:bg-purple-600 rounded-xl transition-all shadow-sm group"
                  onClick={() => setIsMenuOpen(false)}>
                  <span>NEW ARRIVALS</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}

              {showSale && (
                <Link href="/senlysh/sale" className="flex items-center justify-between py-3 px-4 text-sm font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 rounded-xl transition-all shadow-sm group"
                  onClick={() => setIsMenuOpen(false)}>
                  <span>SALE</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}

              <div className="py-2"><div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div></div>

              <Link href="/senlysh/about" className="flex items-center justify-between py-3 px-4 text-sm font-bold text-gray-900 hover:text-white bg-gray-50 hover:bg-purple-600 rounded-xl transition-all shadow-sm group"
                onClick={() => setIsMenuOpen(false)}>
                <span>ABOUT US</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Link>

              <Link href="/senlysh/contact" className="flex items-center justify-between py-3 px-4 text-sm font-bold text-gray-900 hover:text-white bg-gray-50 hover:bg-purple-600 rounded-xl transition-all shadow-sm group"
                onClick={() => setIsMenuOpen(false)}>
                <span>CONTACT</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </Link>

              {isCustomer && (
                <>
                  <div className="py-2"><div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div></div>
                  
                  <Link href="/senlysh/my-account" className="flex items-center justify-between py-3 px-4 text-sm font-bold text-gray-900 hover:text-white bg-gray-50 hover:bg-purple-600 rounded-xl transition-all shadow-sm group"
                    onClick={() => setIsMenuOpen(false)}>
                    <span>MY ACCOUNT</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>

                  <Link href="/senlysh/orders" className="flex items-center justify-between py-3 px-4 text-sm font-bold text-gray-900 hover:text-white bg-gray-50 hover:bg-purple-600 rounded-xl transition-all shadow-sm group"
                    onClick={() => setIsMenuOpen(false)}>
                    <span>MY ORDERS</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </Link>

                  <Link href="/senlysh/wallet" className="flex items-center justify-between py-3 px-4 text-sm font-bold text-gray-900 hover:text-white bg-gray-50 hover:bg-purple-600 rounded-xl transition-all shadow-sm group"
                    onClick={() => setIsMenuOpen(false)}>
                    <span>MY WALLET</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h12a2 2 0 012 2v1h1a1 1 0 010 2h-1v5a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm2-1h12a1 1 0 011 1v1H5V7a1 1 0 011-1z" />
                    </svg>
                  </Link>
                </>
              )}

              {!isCustomer && (
                <>
                  <div className="py-2"><div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div></div>
                  
                  <Link href="/senlysh/login" className="flex items-center justify-between py-3 px-4 text-sm font-bold text-gray-900 hover:text-white bg-gray-50 hover:bg-purple-600 rounded-xl transition-all shadow-sm group"
                    onClick={() => setIsMenuOpen(false)}>
                    <span>LOGIN / REGISTER</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                    </svg>
                  </Link>
                </>
              )}
            </nav>

            {/* Sticky Bottom CTA */}
            <div className="sticky bottom-0 bg-white px-6 py-6 border-t-2 border-gray-100 shadow-2xl">
              <Link href="/senlysh/products" onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-black text-base py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02] active:scale-95 group">
                <span>Shop Now</span>
                <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Membership Upgrade Modal */}
      <MembershipUpgradeModal 
        isOpen={showMembershipModal}
        onClose={() => setShowMembershipModal(false)}
        customerId={user?.id}
      />
    </>
  );
}
