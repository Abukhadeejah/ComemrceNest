'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function DefaultWelcomeBanner() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white relative overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold">C</span>
              </div>
              <div>
                <h2 className="text-lg font-bold">CommerceNest</h2>
                <p className="text-sm opacity-90">Your E-commerce Platform</p>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="hidden md:block ml-8">
              <p className="text-sm">
                🎉 Welcome to CommerceNest! 
                <span className="ml-2 font-medium">Explore our products</span> and 
                <span className="ml-1 font-medium">discover amazing deals</span>.
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center space-x-4">
            <Link 
              href="/products" 
              className="bg-white hover:bg-gray-100 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
            >
              Shop Now
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
            🎉 Welcome! Explore our products and discover amazing deals.
          </p>
        </div>
      </div>
    </div>
  )
}
























