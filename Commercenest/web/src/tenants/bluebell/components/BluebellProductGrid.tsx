'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ProductListItem } from '@/server/modules/products/service'

interface BluebellProductGridProps {
  products: ProductListItem[]
}

export default function BluebellProductGrid({ products }: BluebellProductGridProps) {
  console.log('[BLUEBELL_PRODUCT_GRID] Rendering with products:', products.length)
  
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🧵</div>
        <h3 className="text-2xl font-serif font-bold text-bluebell-blue mb-2">No Fabrics Found</h3>
        <p className="text-bluebell-brown">Try adjusting your filters to discover more premium fabrics.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

function ProductCard({ product }: { product: ProductListItem }) {
  const pricePerYard = (product.price_cents || 0) / 100
  
  // Generate a badge type based on product name or category
  const getBadgeType = () => {
    const name = product.name.toLowerCase()
    if (name.includes('premium') || name.includes('luxury')) return { text: 'Premium', bg: 'bg-bluebell-mustard', textColor: 'text-bluebell-brown' }
    if (name.includes('silk')) return { text: 'Luxury', bg: 'bg-bluebell-blue', textColor: 'text-white' }
    if (name.includes('velvet')) return { text: 'Elegant', bg: 'bg-bluebell-crimson', textColor: 'text-white' }
    if (name.includes('linen')) return { text: 'Natural', bg: 'bg-bluebell-white', textColor: 'text-bluebell-brown' }
    return { text: 'Premium', bg: 'bg-bluebell-mustard', textColor: 'text-bluebell-brown' }
  }
  
  // Prefer backend image when available; fallback to themed mocks
  const getProductImage = () => {
    if (product.hero_image_url) return product.hero_image_url
    const name = product.name.toLowerCase()
    if (name.includes('marble') || name.includes('coffee')) {
      return 'https://images.pexels.com/photos/7232401/pexels-photo-7232401.jpeg?auto=compress&cs=tinysrgb&w=800'
    }
    if (name.includes('classic') || name.includes('sofa')) {
      return 'https://images.pexels.com/photos/6843226/pexels-photo-6843226.jpeg?auto=compress&cs=tinysrgb&w=800'
    }
    // Fallback to a generic luxury fabric
    return 'https://images.pexels.com/photos/4862909/pexels-photo-4862909.jpeg?auto=compress&cs=tinysrgb&w=800'
  }
  
  const badge = getBadgeType()
  
  return (
    <div className="product-card bg-white rounded-2xl overflow-hidden shadow-lg group flex flex-col">
      <div className="product-border border-2 border-transparent rounded-2xl h-full flex flex-col">
        {/* Product Image */}
        <div className="fabric-texture aspect-[4/5] bg-gradient-to-br from-bluebell-blue via-blue-600 to-bluebell-blue/70 relative overflow-hidden">
          {/* Fabric texture simulation */}
          <div 
            className="absolute inset-0 opacity-40" 
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.15) 8px, rgba(255,255,255,0.15) 16px)`
            }}
          />
          <div 
            className="absolute inset-0 opacity-20" 
            style={{
              background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 2px, transparent 2px), radial-gradient(circle at 70% 70%, rgba(255,255,255,0.2) 1px, transparent 1px)`,
              backgroundSize: '20px 20px, 15px 15px'
            }}
          />
          
          {/* Product Image */}
          <Image
            src={getProductImage()}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            unoptimized
            className="object-cover object-center transition-transform duration-500 group-hover:scale-110 w-full h-full"
          />
          
          {/* Premium Badge */}
          <div className="absolute top-4 left-4 bg-yellow-400 backdrop-blur-sm text-bluebell-brown px-3 py-1 rounded-full text-sm font-semibold">
            {badge.text}
          </div>

          {/* Wishlist Heart */}
          <button
            aria-label="Add to wishlist"
            className="absolute top-4 right-4 bg-white/90 text-bluebell-brown rounded-full p-2 shadow-sm hover:shadow transition focus:outline-none"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          
          {/* Quick View Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
            <Link
              href={`/bluebell/products/${product.slug}`}
              className="view-details-btn bg-yellow-400 backdrop-blur-sm text-bluebell-brown font-semibold px-6 py-3 rounded-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 opacity-0 group-hover:opacity-100 invisible group-hover:visible pointer-events-auto"
            >
              View Details
            </Link>
          </div>
        </div>
        
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-xl font-serif font-bold text-[#01589D] mb-3 line-clamp-2 min-h-[3.5rem]">{product.name}</h3>
          <p className="text-bluebell-brown text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
            {product.description || 'Premium fabric for exceptional interior design'}
          </p>
          <div className="space-y-1 mb-4">
            <div className="flex items-baseline justify-start gap-2">
              <span className="text-2xl leading-none font-serif font-bold text-bluebell-crimson whitespace-nowrap">₹{Number(pricePerYard).toLocaleString('en-IN')}</span>
              <span className="text-bluebell-brown text-sm leading-none whitespace-nowrap">per metre</span>
            </div>
            <div className="text-bluebell-brown text-xs">
              Inclusive of all taxes
            </div>
          </div>
          <div className="flex space-x-3 mt-auto"></div>
        </div>
      </div>
    </div>
  )
}


