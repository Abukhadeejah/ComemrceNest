'use client'

import Link from 'next/link'
import Image from 'next/image'

import { useEffect, useRef, useState } from 'react'

export default function SenlyshHome() {
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const imageRef = useRef<HTMLDivElement | null>(null)
  const membershipSectionRef = useRef<HTMLDivElement | null>(null)
  const [membershipImageOffset, setMembershipImageOffset] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (membershipSectionRef.current) {
        const rect = membershipSectionRef.current.getBoundingClientRect()
        const scrollProgress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / window.innerHeight))
        
        // Move image left as section comes into view (0 to -30px)
        const maxOffset = 30
        setMembershipImageOffset(scrollProgress * maxOffset)
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial call
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  const [imageScale, setImageScale] = useState(1)

  // Scroll animation for hero image zoom effect
  useEffect(() => {
    const onScroll = () => {
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      const viewportH = window.innerHeight || 1
      
      // Calculate scroll progress (0 to 1)
      const scrollProgress = Math.min(Math.max(rect.top / viewportH, 0), 1)
      
      // Reverse the scale effect: zoom in when scrolling up, zoom out when scrolling down
      const scale = 1 + (1 - scrollProgress) * 0.3
      setImageScale(scale)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <main className="min-h-screen bg-white">
            {/* Hero Section - Template Exact Match */}
      <section ref={sectionRef} className="relative min-h-screen flex flex-col lg:flex-row">
         {/* Left Column - Text Content (70% width) */}
         <div className="flex-1 lg:flex-[7] bg-cyan-500 flex flex-col justify-center px-0 py-16 lg:py-0 relative">
           {/* Mobile: Dress Image positioned in upper half */}
           <div className="lg:hidden relative w-full max-w-sm mb-8 mx-auto">
             <div className="relative aspect-[3/4] bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl shadow-2xl overflow-hidden">
               <Image
                 src="/images/senlysh/dress-hero.jpg"
                 alt="Autumn Collection Dress - Senlysh Fashion"
                 fill
                 sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                 className="object-cover object-center"
                 priority
               />
               
               {/* SALE Badge - Mobile */}
               <div className="absolute -bottom-2 -left-2 bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center font-bold text-xs shadow-lg z-10">
                 SALE
               </div>
             </div>
           </div>

           {/* Centered Container with Generous Padding */}
           <div className="max-w-7xl mx-auto w-full px-8 lg:px-16">
             <div className="max-w-2xl">
               {/* Text Content Block - Lower positioning with top spacing */}
               <div className="text-white text-left pt-16 lg:pt-24">
                 {/* Main Headline Block - Wide letter-spacing, thinner weight */}
                 <h1 className="text-4xl lg:text-5xl xl:text-6xl font-medium tracking-wider leading-tight mb-2">
                   AUTUMN
                   <span className="block">COLLECTION</span>
                 </h1>
                 
                 {/* 50% OFF - Part of same block, proportional sizing */}
                 <h2 className="text-6xl lg:text-7xl xl:text-8xl font-black tracking-wide leading-none mb-8">
                   50% OFF
                 </h2>
                 
                 {/* Subheadline */}
                 <p className="text-lg lg:text-xl text-white/90 leading-relaxed mb-10 max-w-lg">
                   With our variety of styles, fabrics and trims, let us help you design a one of a kind outfit.
                 </p>
                 
                 {/* CTA Button */}
                 <Link 
                   href="/products" 
                   className="inline-block bg-blue-950 text-white px-8 py-4 rounded-md font-semibold text-lg hover:bg-blue-900 transition-colors shadow-lg"
                 >
                   SHOP NOW
                 </Link>
               </div>
             </div>
           </div>
          
          {/* Social Media Links - Bottom left */}
          <div className="absolute bottom-8 left-8 lg:left-16 text-white/70 text-sm">
            <span className="hover:text-white transition-colors cursor-pointer">Twitter</span>
            <span className="mx-3">-</span>
            <span className="hover:text-white transition-colors cursor-pointer">Instagram</span>
            <span className="mx-3">-</span>
            <span className="hover:text-white transition-colors cursor-pointer">Telegram</span>
            <span className="mx-3">-</span>
            <span className="hover:text-white transition-colors cursor-pointer">Whatsapp</span>
          </div>
        </div>
        
        {/* Right Column - Product Image (30% width) */}
        <div className="flex-1 lg:flex-[3] bg-gradient-to-br from-blue-50 to-blue-100 flex items-end justify-center px-0 py-0 relative overflow-visible">
          {/* Desktop: Dress Image - Overlapping left section dramatically */}
          <div className="hidden lg:block relative w-full h-full overflow-visible">
            <div className="absolute inset-0 flex items-center justify-start -ml-32 pb-0">
              <div 
                ref={imageRef}
                className="relative w-full max-w-sm xl:max-w-md h-[66vh] overflow-visible transition-transform duration-300"
                style={{ transform: `scale(${imageScale})` }}
              >
                <Image
                  src="/images/senlysh/dress-hero.jpg"
                  alt="Autumn Collection Dress - Senlysh Fashion"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover object-bottom"
                  priority
                />
                
                {/* Strong Elliptical Shadow */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-black/20 rounded-full blur-lg"></div>
                
                {/* SALE Badge - Positioned over the dress bottom left */}
                <div className="absolute bottom-4 left-4 bg-orange-500 text-white w-18 h-18 rounded-full flex items-center justify-center font-bold text-xs shadow-lg z-30 ring-2 ring-white">
                  SALE
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: Buy Now Button in upper right */}
          <div className="lg:hidden absolute top-8 right-8">
            <Link 
              href="/products" 
              className="inline-flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-600 transition-colors shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Buy Now!
            </Link>
          </div>

          {/* Mobile: Chat Icon in bottom right */}
          <div className="lg:hidden absolute bottom-8 right-8">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-blue-600 transition-colors">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Guarantees Section */}
      <section className="py-16 bg-white relative">
        {/* Teal bar at top */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-cyan-500"></div>
        
        {/* Blurred background shape */}
        <div className="absolute top-8 right-8 w-32 h-32 bg-gray-200 rounded-full blur-3xl opacity-30"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Main white rounded container */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-8 lg:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* FREE SHIPPING */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-cyan-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 uppercase mb-2">FREE SHIPPING</h3>
                <p className="text-sm text-gray-600 uppercase">ON ALL ORDER</p>
              </div>

              {/* MONEY GUARANTEE */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-cyan-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 uppercase mb-2">MONEY GUARANTEE</h3>
                <p className="text-sm text-gray-600 uppercase">30 DAY MONEY BACK</p>
              </div>

              {/* SECURE PAYMENT */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-cyan-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 uppercase mb-2">SECURE PAYMENT</h3>
                <p className="text-sm text-gray-600 uppercase">ALL CARDS ACCEPTED</p>
              </div>

              {/* BIG SAVING */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 uppercase mb-2">BIG SAVING</h3>
                <p className="text-sm text-gray-600 uppercase">WEEKEN SALES</p>
              </div>
            </div>
          </div>


        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Featured Products
                <div className="w-16 h-1 bg-cyan-400 mt-2"></div>
              </h2>
            </div>
            <button className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors">
              View All
            </button>
          </div>
          
          {/* Products Grid - 2 Rows */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Row 1 */}
            {/* Product 1: Babydoll */}
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[3/4] mb-4">
                <Image
                  src="https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=600&fit=crop&crop=center"
                  alt="Babydoll Dress"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Babydoll</h3>
              <p className="text-lg text-gray-800 mb-2">₹2,499</p>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>

            {/* Product 2: Body */}
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[3/4] mb-4">
                <Image
                  src="https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=600&fit=crop&crop=center"
                  alt="Body Top"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Body</h3>
              <p className="text-lg text-gray-800 mb-2">₹2,899</p>
              <div className="flex items-center">
                {[...Array(3)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <svg className="w-4 h-4 text-yellow-400 fill-current opacity-50" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg className="w-4 h-4 text-yellow-400 fill-current opacity-50" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>

            {/* Product 3: Dress */}
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[3/4] mb-4">
                <Image
                  src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=600&fit=crop&crop=center"
                  alt="Floral Dress"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Sale Badge */}
                <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  SALE!
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Dress</h3>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-lg text-gray-800">₹3,699</p>
                <p className="text-sm text-red-400 line-through">₹4,599</p>
              </div>
              <div className="flex items-center">
                {[...Array(4)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <svg className="w-4 h-4 text-yellow-400 fill-current opacity-50" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>

            {/* Product 4: Sport Shoes */}
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[3/4] mb-4">
                <Image
                  src="https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=600&fit=crop&crop=center"
                  alt="Sport Shoes"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Sale Badge */}
                <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  SALE!
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Sport Shoes</h3>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-lg text-gray-800">₹2,899</p>
                <p className="text-sm text-red-400 line-through">₹3,799</p>
              </div>
              <div className="flex items-center">
                {[...Array(3)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <svg className="w-4 h-4 text-yellow-400 fill-current opacity-50" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg className="w-4 h-4 text-yellow-400 fill-current opacity-50" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>

            {/* Row 2 */}
            {/* Product 5: Kurti */}
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[3/4] mb-4">
                <Image
                  src="https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=600&fit=crop&crop=center"
                  alt="Traditional Kurti"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Kurti</h3>
              <p className="text-lg text-gray-800 mb-2">₹1,899</p>
              <div className="flex items-center">
                {[...Array(4)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <svg className="w-4 h-4 text-yellow-400 fill-current opacity-50" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>

            {/* Product 6: Jeans */}
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[3/4] mb-4">
                <Image
                  src="https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=600&fit=crop&crop=center"
                  alt="Stylish Jeans"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Sale Badge */}
                <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  SALE!
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Jeans</h3>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-lg text-gray-800">₹1,599</p>
                <p className="text-sm text-red-400 line-through">₹2,199</p>
              </div>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>

            {/* Product 7: Handbag */}
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[3/4] mb-4">
                <Image
                  src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=600&fit=crop&crop=center"
                  alt="Designer Handbag"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Handbag</h3>
              <p className="text-lg text-gray-800 mb-2">₹3,299</p>
              <div className="flex items-center">
                {[...Array(4)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <svg className="w-4 h-4 text-yellow-400 fill-current opacity-50" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>

            {/* Product 8: Earrings */}
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[3/4] mb-4">
                <Image
                  src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=600&fit=crop&crop=center"
                  alt="Designer Earrings"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Sale Badge */}
                <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  SALE!
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Earrings</h3>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-lg text-gray-800">₹899</p>
                <p className="text-sm text-red-400 line-through">₹1,299</p>
              </div>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Today's Best Deals */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Today&apos;s Best Deals
                <div className="w-16 h-1 bg-cyan-400 mt-2"></div>
              </h2>
            </div>
            <button className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors">
              View All
            </button>
          </div>
          
          {/* Deals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Deal 1: Dress */}
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[3/4] mb-4">
                <Image
                  src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=600&fit=crop&crop=center"
                  alt="Floral Dress"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Sale Badge */}
                <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  SALE!
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Dress</h3>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-lg text-blue-600 font-semibold">₹3,699</p>
                <p className="text-sm text-orange-500 line-through">₹4,599</p>
              </div>
              <div className="flex items-center">
                {[...Array(4)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <svg className="w-4 h-4 text-yellow-400 fill-current opacity-50" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>

            {/* Deal 2: Sport Shoes */}
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[3/4] mb-4">
                <Image
                  src="https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=600&fit=crop&crop=center"
                  alt="Sport Shoes"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Sale Badge */}
                <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  SALE!
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Sport Shoes</h3>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-lg text-blue-600 font-semibold">₹2,899</p>
                <p className="text-sm text-orange-500 line-through">₹3,799</p>
              </div>
              <div className="flex items-center">
                {[...Array(4)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <svg className="w-4 h-4 text-yellow-400 fill-current opacity-50" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>

            {/* Deal 3: Fuzzy Hoodies */}
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[3/4] mb-4">
                <Image
                  src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=600&fit=crop&crop=center"
                  alt="Fuzzy Hoodies"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Sale Badge */}
                <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  SALE!
                </div>
                {/* Buffer Badge */}
                <div className="absolute bottom-3 right-3 bg-purple-400 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Buffer
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Fuzzy Hoodies</h3>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-lg text-blue-600 font-semibold">₹4,199</p>
                <p className="text-sm text-orange-500 line-through">₹5,099</p>
              </div>
              <div className="flex items-center">
                {[...Array(4)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <svg className="w-4 h-4 text-yellow-400 fill-current opacity-50" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>

            {/* Deal 4: Sundress */}
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-[3/4] mb-4">
                <Image
                  src="https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=600&fit=crop&crop=center"
                  alt="Sundress"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Sale Badge */}
                <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  SALE!
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Sundress</h3>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-lg text-blue-600 font-semibold">₹1,699</p>
                <p className="text-sm text-orange-500 line-through">₹2,499</p>
              </div>
              <div className="flex items-center">
                {[...Array(4)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <svg className="w-4 h-4 text-yellow-400 fill-current opacity-50" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

                      {/* Subscription Section */}
                <section ref={membershipSectionRef} className="py-12 bg-white overflow-visible">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-visible">
                    {/* Membership Banner */}
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-400 rounded-2xl overflow-visible relative h-64">
                      <div className="relative h-full">
                        {/* Left Side - Membership Promotion */}
                        <div className="absolute left-0 top-0 w-2/3 h-full p-8 lg:p-12 text-white flex flex-col justify-center">
                          <p className="text-sm text-gray-800 mb-3 uppercase tracking-wide font-semibold">MEMBERSHIP</p>
                          <h2 className="text-2xl md:text-3xl font-bold mb-8 leading-tight text-white">
                            Join Senlysh Premium<br />& Save Up To 25%
                          </h2>

                          {/* Membership Benefits */}
                          <div className="mb-6">
                            <ul className="text-white space-y-2">
                              <li className="flex items-center gap-2">
                                <span className="text-yellow-400">★</span> Exclusive cashback rewards
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-yellow-400">★</span> Free shipping on all orders
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-yellow-400">★</span> Early access to sales
                              </li>
                            </ul>
                          </div>

                          {/* Join Button */}
                          <div className="max-w-md">
                            <button className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-md font-semibold transition-colors w-full">
                              Join Premium Now
                            </button>
                          </div>
                        </div>
                        
                        {/* Right Side - Woman with Shopping Bags */}
                        <div className="absolute right-0 bottom-0 w-1/3 h-full flex items-end justify-end overflow-visible">
                          <Image
                            src="/images/senlysh/subscription-img.png"
                            alt="Woman with shopping bags"
                            width={600}
                            height={750}
                            className="object-cover object-bottom transition-transform duration-300 ease-out"
                            style={{
                              transform: `translate(${10 - membershipImageOffset}%, 0%)`,
                              height: 'auto',
                              width: 'auto',
                              maxHeight: '160%',
                              zIndex: 10,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real reviews from fashion enthusiasts who love our collections
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Priya Sharma',
                role: 'Fashion Blogger',
                content: 'The quality of Senlysh clothing is exceptional. I love how each piece feels premium and looks stunning.',
                rating: 5
              },
              {
                name: 'Rahul Mehta',
                role: 'Style Enthusiast',
                content: 'Perfect fit and amazing customer service. Senlysh has become my go-to for all fashion needs.',
                rating: 5
              },
              {
                name: 'Anjali Patel',
                role: 'Designer',
                content: 'The autumn collection is absolutely gorgeous. The colors and designs are perfectly on-trend.',
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">★</span>
                  ))}
                </div>
                
                {/* Content */}
                <p className="text-gray-600 mb-6 leading-relaxed">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
                
                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center text-white font-semibold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  )
}
