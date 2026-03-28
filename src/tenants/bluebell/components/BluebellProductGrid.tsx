"use client"

import React, { useMemo, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ProductListItem } from '@/server/modules/products/service'
// UPDATED IMPORT - Use helper functions
import { WHATSAPP_NUMBER, getProductInquiryLink, shouldShowWishlist } from '@/tenants/bluebell/config'

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
  // Keep price calculation for cart functionality, but don't display it
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
  
  // Compute QR URL after mount to avoid SSR/CSR mismatch
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  useEffect(() => {
    const url = `${window.location.origin}/bluebell/products/${product.slug}`
    const base = 'https://api.qrserver.com/v1/create-qr-code/'
    const size = '128x128'
    setQrDataUrl(`${base}?size=${size}&data=${encodeURIComponent(url)}`)
  }, [product.slug])

  // UPDATED - Use helper function from config
  const whatsappLink = getProductInquiryLink(product.name)

  return (
    <div className="product-card bg-white rounded-2xl overflow-hidden shadow-lg group flex flex-col h-full">
      <div className="product-border border-2 border-transparent rounded-2xl h-full flex flex-col">
        {/* Image/QR flip container */}
        <div className="fabric-texture h-56 bg-gradient-to-br from-bluebell-blue via-blue-600 to-bluebell-blue/70 relative overflow-hidden [perspective:1000px]">
          <div className="absolute inset-0 [transform-style:preserve-3d] transition-transform duration-500 group-hover:[transform:rotateY(180deg)]">
            {/* Front: Product Image */}
            <div className="absolute inset-0 [backface-visibility:hidden]">
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
              <Image
                src={getProductImage()}
                alt={product.name}
                fill
                unoptimized
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {/* Premium Badge */}
              <div className="absolute top-4 left-4 bg-yellow-400 backdrop-blur-sm text-bluebell-brown px-3 py-1 rounded-full text-sm font-semibold">
                {badge.text}
              </div>
              {/* WISHLIST HEART - HIDE IF E-COMMERCE DISABLED */}
              {shouldShowWishlist() && (
                <button
                  aria-label="Add to wishlist"
                  className="absolute top-4 right-4 bg-white/90 text-bluebell-brown rounded-full p-2 shadow-sm hover:shadow transition focus:outline-none"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Back: QR Code */}
            <div className="absolute inset-0 bg-white/95 flex items-center justify-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt={`QR for ${product.name}`} className="w-32 h-32 shadow-sm rounded-md" />
              ) : (
                <div className="w-32 h-32 bg-gray-100 rounded-md animate-pulse" />
              )}
            </div>
          </div>
        </div>
        
        {/* Content section - FIXED ALIGNMENT */}
        <div className="p-6 flex-1 flex flex-col">
          {/* Title - Fixed height */}
          <h3 className="text-xl font-serif font-bold text-[#01589D] mb-3 line-clamp-2 h-[3.5rem]">
            {product.name}
          </h3>
          
          {/* Description - Fixed height */}
          <p className="text-bluebell-brown text-sm mb-4 line-clamp-3 h-[4.5rem]">
            {product.description || 'Premium fabric for exceptional interior design'}
          </p>
          
          {/* Spacer to push buttons to bottom */}
          <div className="flex-1"></div>
          
          {/* WhatsApp Contact Button - Fixed at bottom */}
          <div className="mb-3">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 text-center text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-[#20BA5A] active:scale-[0.98]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Message on WhatsApp
            </a>
          </div>

          {/* View Details Button - Fixed at bottom */}
          <div>
            <Link
              href={`/bluebell/products/${product.slug}`}
              className="inline-flex items-center justify-center w-full bg-yellow-400 text-bluebell-brown font-semibold py-3 px-4 rounded-xl hover:shadow-md transition-colors"
            >
              View Product
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
