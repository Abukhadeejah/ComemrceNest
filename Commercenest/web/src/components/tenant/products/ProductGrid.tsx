'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ProductListItem } from '@/server/modules/products/service'
import { HeartIcon, ShoppingBagIcon, EyeIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { useState } from 'react'
import { QuickViewModal } from './QuickViewModal'
import { generateProductBadges, getBadgeClassName, getBadgeStyle } from '@/utils/badges'

interface ProductGridProps {
  products: ProductListItem[]
}

export function ProductGrid({ products }: ProductGridProps) {
  const [quickViewProduct, setQuickViewProduct] = useState<ProductListItem | null>(null)
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)


  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-500 text-xl mb-4 font-medium">No products found</div>
        <p className="text-gray-400 max-w-md mx-auto">
          We couldn&apos;t find any products matching your criteria. Try adjusting your search or browse our categories.
        </p>
        <Link 
          href="/products" 
          className="inline-block mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
        >
          Browse All Products
        </Link>
      </div>
    )
  }

  const handleQuickView = (product: ProductListItem) => {
    setQuickViewProduct(product)
    setIsQuickViewOpen(true)
  }

  const closeQuickView = () => {
    setIsQuickViewOpen(false)
    setQuickViewProduct(null)
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onQuickView={handleQuickView}
          />
        ))}
      </div>

      {/* Quick View Modal */}
      {isQuickViewOpen && quickViewProduct && (
        <QuickViewModal 
          product={quickViewProduct} 
          isOpen={isQuickViewOpen}
          onClose={closeQuickView} 
        />
      )}
    </>
  )
}

function ProductCard({ 
  product, 
  onQuickView 
}: { 
  product: ProductListItem; 
  onQuickView: (product: ProductListItem) => void;
}) {
  const [isWishlisted, setIsWishlisted] = useState(false)

  const formatPrice = (priceCents: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(priceCents / 100)
  }

  // Calculate discount for price display
  const hasDiscount = product.compare_at_price_cents && product.compare_at_price_cents > product.price_cents

  // Generate badges using the new badge system
  const badgeConfig = {
    is_featured: product.is_featured,
    is_bestseller: product.is_bestseller,
    is_new_arrival: product.is_new_arrival,
    is_on_sale: product.is_on_sale,
    is_limited_edition: product.is_limited_edition,
    is_sold_out: product.is_sold_out,
    custom_badge_text: product.custom_badge_text,
    badge_color: product.badge_color,
    badge_priority: product.badge_priority,
    badge_display_until: product.badge_display_until,
    badge_display_from: product.badge_display_from,
    compare_at_price_cents: product.compare_at_price_cents,
    price_cents: product.price_cents,
    stock: product.stock,
    low_stock_threshold: product.low_stock_threshold
  }
  
  const badges = generateProductBadges(badgeConfig)

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsWishlisted(!isWishlisted)
  }

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onQuickView(product)
  }

  return (
    <div className="group bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-gray-200 transform hover:-translate-y-1 flex flex-col">
              {/* Product Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        {product.hero_image_url ? (
          <Image
            src={product.hero_image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {badges.map((badge, i) => (
            <span 
              key={i} 
              className={`text-xs px-2 py-1 rounded-full font-medium shadow-sm ${getBadgeClassName(badge, product.badge_color)}`}
              style={getBadgeStyle(badge, product.badge_color)}
            >
              {badge.icon && <span className="mr-1">{badge.icon}</span>}
              {badge.text}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          {/* Wishlist Button */}
          <button 
            onClick={handleWishlistToggle}
            className="bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
          >
            {isWishlisted ? (
              <HeartSolidIcon className="w-4 h-4 text-red-500" />
            ) : (
              <HeartIcon className="w-4 h-4 text-gray-600 hover:text-red-500" />
            )}
          </button>

          {/* Quick View Button */}
          <button 
            onClick={handleQuickViewClick}
            className="bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
          >
            <EyeIcon className="w-4 h-4 text-gray-600 hover:text-indigo-600" />
          </button>
        </div>

        {/* Quick View Button - No overlay, just a floating button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
          <Link 
            href={`/products/${product.slug}`}
            className="bg-white text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-auto"
          >
            View Details
          </Link>
        </div>

        {/* Stock Status Overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info - Using flexbox with consistent spacing */}
      <div className="p-3 flex flex-col">
        <Link href={`/products/${product.slug}`} className="block group">
          <h3 className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors duration-200 line-clamp-2 mb-2 leading-tight min-h-[2rem]">
            {product.name}
          </h3>
        </Link>
        
        {/* Star Rating */}
        <div className="flex items-center mb-2">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-1">(4.8)</span>
          <span className="text-xs text-gray-400 ml-2">• 127 reviews</span>
        </div>
        
        {/* Price */}
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(product.price_cents)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(product.compare_at_price_cents!)}
            </span>
          )}
        </div>

        {/* Size Options Preview */}
        <div className="flex gap-1 mb-3">
          {['S', 'M', 'L', 'XL'].map((size) => (
            <button
              key={size}
              className="text-xs px-2 py-1 border border-gray-200 rounded hover:border-gray-400 transition-colors duration-200 hover:bg-gray-50"
            >
              {size}
            </button>
          ))}
        </div>

        {/* Stock Status & Add to Cart */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {product.stock > 0 ? (
              <span className="text-xs text-green-600 font-medium">
                {product.stock} in stock
              </span>
            ) : (
              <span className="text-xs text-red-600 font-medium">
                Out of stock
              </span>
            )}
          </div>
          
          {/* Add to Cart Button */}
          <button 
            disabled={product.stock === 0}
            className="bg-indigo-600 text-white text-sm py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            <ShoppingBagIcon className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  )
}


