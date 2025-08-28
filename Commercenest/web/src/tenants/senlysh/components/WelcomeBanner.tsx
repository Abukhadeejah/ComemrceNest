'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function WelcomeBanner() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100" height="100" viewBox="0 0 100 100" className="w-full h-full">
          <pattern id="senlysh-banner-pattern" x="0" y="0" width="25" height="25" patternUnits="userSpaceOnUse">
            <path d="M12.5 0 L25 12.5 L12.5 25 L0 12.5 Z" fill="#FEFEFE"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#senlysh-banner-pattern)"/>
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h2 className="text-lg font-bold">Senlysh</h2>
                <p className="text-sm opacity-90">Fashion & Lifestyle</p>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="hidden md:block ml-8">
              <p className="text-sm">
                ✨ Welcome to Senlysh! 
                <span className="ml-2 font-medium">New collection</span> and 
                <span className="ml-1 font-medium">trending styles</span> just launched.
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center space-x-4">
            <Link 
              href="/senlysh/products" 
              className="bg-white hover:bg-gray-100 text-purple-600 px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
            >
              Shop Now
            </Link>
            <Link 
              href="/senlysh/portfolio" 
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm border border-white/20"
            >
              View Collection
            </Link>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white/70 hover:text-white transition-colors duration-200"
              aria-label="Close banner"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Message */}
        <div className="md:hidden mt-4 text-center">
          <p className="text-sm">
            ✨ Welcome! New collection and trending styles just launched.
          </p>
        </div>
      </div>
    </div>
  )
}
