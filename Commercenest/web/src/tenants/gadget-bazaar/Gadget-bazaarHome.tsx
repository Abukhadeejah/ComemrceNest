"use client"

import { useEffect, useState } from 'react'

export default function Gadget-bazaarHome() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(true)
  }, [])

  return (
    <main className="p-0">
      {/* Hero Section */}
      <section className="hero-gradient min-h-[70vh] flex items-center justify-center relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100" />

        {/* Hero Content */}
        <div className={`hero-content text-center z-10 px-4 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Logo */}
          <div className="hero-logo mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <span className="text-white font-bold text-3xl">G</span>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="hero-title text-4xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
            Welcome to Gadget Bazaar
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Your trusted partner for quality electronics products and services.
            Discover our curated collection designed to meet your needs.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/products"
              className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Explore Products
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 bg-white text-blue-600 font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border border-blue-200"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose Us?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We provide exceptional electronics solutions with quality, innovation, and customer satisfaction at our core.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Quality Assurance</h3>
              <p className="text-gray-600">Premium quality products that meet the highest standards and exceed expectations.</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast Service</h3>
              <p className="text-gray-600">Quick and efficient service to ensure you get what you need when you need it.</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Customer First</h3>
              <p className="text-gray-600">Your satisfaction is our priority. We're here to support you every step of the way.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
