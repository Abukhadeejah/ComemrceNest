'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function WelcomeBanner() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="bg-gradient-to-r from-blue-900 via-blue-700 to-blue-900 text-white relative overflow-hidden shadow-lg border-b border-blue-600">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100" height="100" viewBox="0 0 100 100" className="w-full h-full">
          <pattern id="banner-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1" fill="#FEFEFE"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#banner-pattern)"/>
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <div className="flex items-center">
              <svg width="32" height="32" viewBox="0 0 40 40" className="mr-3">
                <g transform="translate(2, 2)">
                  <path d="M18 20 Q12 8 18 -4 Q24 8 18 20" fill="#FEFEFE" opacity="0.9"/>
                  <path d="M14 16 Q9 6 14 -2 Q19 6 14 16" fill="#FDCE59" opacity="0.7"/>
                  <circle cx="18" cy="-4" r="4" fill="#DC2A38" opacity="0.8"/>
                  <line x1="18" y1="20" x2="18" y2="26" stroke="#FEFEFE" strokeWidth="3"/>
                  <path d="M10 26 Q18 20 26 26" fill="none" stroke="#FEFEFE" strokeWidth="2"/>
                </g>
              </svg>
              <div>
                <h2 className="text-base font-serif font-bold text-white drop-shadow-sm">Bluebell Fabrics</h2>
                <p className="text-xs text-white/90 drop-shadow-sm">Premium Interior Design Solutions</p>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="hidden md:block ml-6">
              <p className="text-sm text-white drop-shadow-sm">
                🎉 Welcome to our premium fabric collection! 
                <span className="ml-2 font-medium text-white drop-shadow-sm">New arrivals</span> and 
                <span className="ml-1 font-medium text-white drop-shadow-sm">exclusive designs</span> now available.
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center space-x-3">
            <Link 
              href="/bluebell/portfolio" 
              className="bg-yellow-400 hover:bg-yellow-300 text-yellow-800 px-3 py-1.5 rounded font-medium transition-colors duration-200 text-xs shadow-md"
            >
              View Portfolio
            </Link>
            <Link 
              href="/bluebell/products" 
              className="bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded font-medium transition-colors duration-200 text-xs border border-white/30 shadow-md"
            >
              Shop Fabrics
            </Link>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white/80 hover:text-white transition-colors duration-200"
              aria-label="Close banner"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Message */}
        <div className="md:hidden mt-3 text-center">
          <p className="text-xs text-white drop-shadow-sm">
            🎉 Welcome! New arrivals and exclusive designs available.
          </p>
        </div>
      </div>
    </div>
  )
}
