"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Playfair_Display } from 'next/font/google';
import { useCart } from '@/lib/cart';
import { useTenant } from '@/hooks/useTenant';
import { useBluebellHomeMode } from '@/lib/bluebellHomeMode';
// IMPORT CONFIG - NEWLY ADDED
import { shouldShowCart, shouldShowWishlist } from '@/tenants/bluebell/config';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700', '800', '900'] });

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { state } = useCart();
  const cartCount = state.itemCount;
  const wishlistCount = 0;
  const tenant = useTenant();
  const basePath = `/${tenant.key || 'bluebell'}`;
  const { mode, setMode } = useBluebellHomeMode();
  const showNewArrivals = false
  const showSale = false

  const pathname = usePathname()
  const isActive = (href: string) => {
    if (!pathname) return false
    if (href === basePath) {
      return pathname === basePath || pathname === `${basePath}/`
    }
    return pathname.startsWith(href)
  }
  const navClass = (href: string) => `text-gray-800 hover:text-primary font-semibold text-sm uppercase tracking-wide transition-colors pb-1 border-b-2 ${isActive(href) ? 'border-primary' : 'border-transparent'}`

  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string; parent_id: string | null }>>([])

  const searchPlaceholder = mode === 'fabrics'
    ? 'Search for fabrics, patterns, colors...'
    : 'Search interiors:  rooms, styles...'

  useEffect(() => {
    let aborted = false
    async function load() {
      try {
        const res = await fetch('/api/site/categories', { cache: 'no-store' })
        const json = await res.json()
        if (!aborted && Array.isArray(json.data)) {
          setCategories(json.data)
        }
      } catch {
        // ignore
      }
    }
    load()
    return () => { aborted = true }
  }, [])

  return (
    <>
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white py-2 sm:py-3 overflow-hidden border-b border-blue-600 shadow-sm">
        <div className="flex whitespace-nowrap animate-marquee" style={{ animationDuration: '40s' }}>
          <div className="flex items-center px-4 sm:px-6 md:px-8">
            <span className="text-sm sm:text-base md:text-lg font-semibold mr-16 sm:mr-32 md:mr-48 drop-shadow-sm">Welcome to Bluebell Interiors Studio - Premium Fabrics & Design</span>
            <span className="text-sm sm:text-base md:text-lg font-semibold mr-16 sm:mr-32 md:mr-48 drop-shadow-sm">Transform Your Space with Timeless Elegance</span>
            <span className="text-sm sm:text-base md:text-lg font-semibold mr-16 sm:mr-32 md:mr-48 drop-shadow-sm">Welcome to Bluebell Interiors Studio - Premium Fabrics & Design</span>
            <span className="text-sm sm:text-base md:text-lg font-semibold mr-16 sm:mr-32 md:mr-48 drop-shadow-sm">Transform Your Space with Timeless Elegance</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-[100] bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href={basePath} className="flex items-center gap-2 sm:gap-3 transition-transform hover:scale-[1.02]">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 flex-shrink-0">
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
              <div className="flex flex-col">
                <h1 className={`${playfair.className} text-xs sm:text-sm md:text-lg lg:text-xl font-bold text-primary leading-tight`}>
                  Bluebell Interiors Studio LLP
                </h1>
                <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-600">Feel the luxurious life</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-8">
              <div className="relative group">
                <Link href={basePath} className={`${navClass(basePath)} flex items-center gap-1`}>
                  HOME
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>
                <div className="absolute top-full left-0 bg-white shadow-lg border border-gray-200 rounded-md py-2 min-w-[220px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                  <Link href={basePath} onClick={(e) => { e.preventDefault(); setMode('interiors'); if (pathname !== basePath) { window.location.href = basePath; } }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900">
                    Bluebell Interiors
                  </Link>
                  <Link href={basePath} onClick={(e) => { e.preventDefault(); setMode('fabrics'); if (pathname !== basePath) { window.location.href = basePath; } }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900">
                    Bluebell Fabric
                  </Link>
                  <div className="relative group/soon">
                    <button className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900">
                      <span>Coming Soon</span>
                      <svg className="w-4 h-4 text-gray-400 group-hover/soon:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                    <div className="absolute top-0 left-full ml-1 bg-white shadow-lg border border-gray-200 rounded-md py-2 min-w-[200px] opacity-0 invisible group-hover/soon:opacity-100 group-hover/soon:visible transition-all duration-200">
                      <span className="block px-4 py-2 text-sm text-gray-400 cursor-default">BB Sofa</span>
                      <span className="block px-4 py-2 text-sm text-gray-400 cursor-default">BB Curtains</span>
                      <span className="block px-4 py-2 text-sm text-gray-400 cursor-default">BB Cushion</span>
                      <span className="block px-4 py-2 text-sm text-gray-400 cursor-default">BB Bedsheets</span>
                    </div>
                  </div>
                </div>
              </div>
              {mode === 'fabrics' && (
                <div className="relative group">
                  <Link href={`${basePath}/products`} className={`${navClass(`${basePath}/products`)} flex items-center gap-1`}>
                    FABRICS
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Link>
                </div>
              )}

              {mode === 'interiors' && (
                <Link href={`${basePath}/portfolio`} className={navClass(`${basePath}/portfolio`)}>
                  PORTFOLIO
                </Link>
              )}
              {showNewArrivals && (
                <Link href={`${basePath}/new-arrivals`} className={navClass(`${basePath}/new-arrivals`)}>
                  NEW ARRIVALS
                </Link>
              )}
              {showSale && (
                <Link href={`${basePath}/sale`} className={navClass(`${basePath}/sale`)}>
                  SALE
                </Link>
              )}
              <Link href={`${basePath}/about`} className={navClass(`${basePath}/about`)}>
                ABOUT US
              </Link>
              <Link href={`${basePath}/contact`} className={navClass(`${basePath}/contact`)}>
                CONTACT
              </Link>
            </nav>

            {/* Icons */}
            <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-6">
              <div className="relative hidden md:block">
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  className="pl-4 pr-10 py-2.5 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-48 lg:w-64 text-sm transition-all duration-300"
                />
                <svg className="absolute right-3 top-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <Link href="/search" className="md:hidden text-gray-700 hover:text-primary transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Link>

              {/* ACCOUNT ICON - UPDATED TO CUSTOMER LOGIN */}
              <Link href={`${basePath}/login`} className="text-gray-700 hover:text-primary transition-colors relative group">
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">●</span>
              </Link>

              {/* WISHLIST - HIDE IF E-COMMERCE DISABLED */}
              {shouldShowWishlist() && (
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
              )}

              {/* CART - HIDE IF E-COMMERCE DISABLED */}
              {shouldShowCart() && (
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
              )}

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 text-gray-700 hover:text-primary transition-colors"
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

      {/* Mobile Menu - Rest of the code stays the same */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[9999]">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsMenuOpen(false)} />

          <div className="absolute right-0 top-0 h-full w-full sm:w-[85vw] sm:max-w-md bg-white shadow-2xl overflow-y-auto">

            <div className="sticky top-0 z-10 bg-gradient-to-b from-primary to-blue-700 px-6 py-6 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-full p-2">
                  <svg viewBox="0 0 220 140" className="w-full h-full">
                    <g transform="translate(110, 25)">
                      <defs>
                        <radialGradient id="mobilePetalGrad" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: '#01589d', stopOpacity: 0.8 }} />
                        </radialGradient>
                      </defs>
                      <path d="M0 90 Q-25 55 0 20 Q25 55 0 90" fill="url(#mobilePetalGrad)" stroke="#01589d" strokeWidth="2" />
                      <circle cx="0" cy="20" r="10" fill="#01589d" opacity="0.9" />
                    </g>
                  </svg>
                </div>
                <div>
                  <h2 className={`${playfair.className} text-xl font-bold text-white`}>Menu</h2>
                  <p className="text-xs text-blue-100">Bluebell Interiors</p>
                </div>
              </div>
              <button onClick={() => setIsMenuOpen(false)} className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-all group">
                <svg className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="px-4 py-6 space-y-2 bg-white">

              {/* HOME Accordion */}
              <div className="mb-2">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'home' ? null : 'home')}
                  className="w-full flex items-center justify-between py-3 px-4 text-sm font-bold text-gray-900 hover:text-white bg-gray-50 hover:bg-primary rounded-xl transition-all shadow-sm group"
                >
                  <span>HOME</span>
                  <svg className={`w-4 h-4 transition-transform duration-200 ${openDropdown === 'home' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {openDropdown === 'home' && (
                  <div className="mt-2 ml-2 space-y-1 pl-3 border-l-2 border-blue-200">
                    <Link href={basePath} className="flex items-center py-2 px-3 text-xs font-medium text-gray-700 hover:text-primary hover:bg-blue-50 rounded-lg transition-all"
                      onClick={(e) => { e.preventDefault(); setMode('interiors'); setIsMenuOpen(false); if (pathname !== basePath) { window.location.href = basePath; } }}>
                      <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                      Bluebell Interiors
                    </Link>
                    <Link href={basePath} className="flex items-center py-2 px-3 text-xs font-medium text-gray-700 hover:text-primary hover:bg-blue-50 rounded-lg transition-all"
                      onClick={(e) => { e.preventDefault(); setMode('fabrics'); setIsMenuOpen(false); if (pathname !== basePath) { window.location.href = basePath; } }}>
                      <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                      Bluebell Fabric
                    </Link>

                    <div className="pt-2 pb-1">
                      <div className="text-[10px] font-semibold text-gray-400 mb-1 px-3 uppercase">Coming Soon</div>
                      <div className="space-y-1">
                        {['BB Sofa', 'BB Curtains', 'BB Cushion', 'BB Bedsheets'].map((item) => (
                          <div key={item} className="flex items-center py-1.5 px-3 text-[11px] text-gray-400 rounded-lg bg-gray-50">
                            <svg className="w-3 h-3 mr-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* FABRICS Accordion */}
              {mode === 'fabrics' && (
                <div className="mb-2">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === 'fabrics' ? null : 'fabrics')}
                    className="w-full flex items-center justify-between py-3 px-4 text-sm font-bold text-gray-900 hover:text-white bg-gray-50 hover:bg-primary rounded-xl transition-all shadow-sm group"
                  >
                    <span>FABRICS</span>
                    <svg className={`w-4 h-4 transition-transform duration-200 ${openDropdown === 'fabrics' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {openDropdown === 'fabrics' && (
                    <div className="mt-2 ml-2 space-y-1 pl-3 border-l-2 border-blue-200">
                      {['Upholstery Fabrics', 'Curtain & Drapery', 'Cushion Covers', 'Accessories'].map((item) => (
                        <Link key={item} href={`${basePath}/products/${item.toLowerCase().replace(/\s+/g, '-').replace('&', 'and')}`}
                          className="flex items-center py-2 px-3 text-xs font-medium text-gray-700 hover:text-primary hover:bg-blue-50 rounded-lg transition-all"
                          onClick={() => setIsMenuOpen(false)}>
                          <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                          {item}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* PORTFOLIO */}
              {mode === 'interiors' && (
                <Link href={`${basePath}/portfolio`} className="flex items-center justify-between py-3 px-4 text-sm font-bold text-gray-900 hover:text-white bg-gray-50 hover:bg-primary rounded-xl transition-all shadow-sm group"
                  onClick={() => setIsMenuOpen(false)}>
                  <span>PORTFOLIO</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}

              <div className="py-2"><div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div></div>

              <Link href={`${basePath}/about`} className="flex items-center justify-between py-3 px-4 text-sm font-bold text-gray-900 hover:text-white bg-gray-50 hover:bg-primary rounded-xl transition-all shadow-sm group"
                onClick={() => setIsMenuOpen(false)}>
                <span>ABOUT US</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Link>

              <Link href={`${basePath}/contact`} className="flex items-center justify-between py-3 px-4 text-sm font-bold text-gray-900 hover:text-white bg-gray-50 hover:bg-primary rounded-xl transition-all shadow-sm group"
                onClick={() => setIsMenuOpen(false)}>
                <span>CONTACT</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </Link>
            </nav>

            <div className="sticky bottom-0 bg-white px-6 py-6 border-t-2 border-gray-100 shadow-2xl">
              <Link href={`${basePath}/products`} onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-gray-900 font-black text-base py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02] active:scale-95 group">
                <span>Explore Collection</span>
                <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
