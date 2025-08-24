'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ProductListItem } from '@/server/modules/products/service'
import { HeartIcon } from '@heroicons/react/24/outline'

interface ProductGridProps {
  products: ProductListItem[]
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">No products found</div>
        <p className="text-gray-400">Try adjusting your search or filter criteria</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  )
}

function ProductCard({ product, index }: { product: ProductListItem; index: number }) {
  const formatPrice = (priceCents: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(priceCents / 100)
  }

  const hasDiscount = product.compare_at_price_cents && product.compare_at_price_cents > product.price_cents
  const discountPercentage = hasDiscount 
    ? Math.round(((product.compare_at_price_cents! - product.price_cents) / product.compare_at_price_cents!) * 100)
    : 0

  // Generate badges based on index for demo purposes
  const badges = []
  if (index % 4 === 0) badges.push({ text: 'Featured', className: 'bg-blue-500 text-white' })
  if (hasDiscount) badges.push({ text: `-${discountPercentage}%`, className: 'bg-red-500 text-white' })
  if (index % 5 === 0) badges.push({ text: 'Limited', className: 'bg-orange-500 text-white' })
  if (product.stock === 0) badges.push({ text: 'Sold Out', className: 'bg-gray-500 text-white' })

  return (
    <div className="group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Product Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {product.hero_image_url ? (
          <Image
            src={product.hero_image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {badges.map((badge, i) => (
            <span key={i} className={`text-xs px-2 py-1 rounded font-medium ${badge.className}`}>
              {badge.text}
            </span>
          ))}
        </div>

        {/* Countdown Timer (Demo) */}
        {index % 3 === 0 && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            <div className="flex gap-1">
              <span>127</span>
              <span>Days</span>
            </div>
          </div>
        )}

        {/* Wishlist Button */}
        <button className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-red-50 transition-colors duration-200 opacity-0 group-hover:opacity-100">
          <HeartIcon className="w-4 h-4 text-gray-600 hover:text-red-500" />
        </button>

        {/* Quick View Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Link 
            href={`/products/${product.slug}`}
            className="bg-white text-gray-900 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors duration-200"
          >
            Quick View
          </Link>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <Link href={`/products/${product.slug}`} className="block">
          <h3 className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors duration-200 line-clamp-2 mb-2">
            {product.name}
          </h3>
        </Link>
        
        {/* Star Rating (Demo) */}
        {index % 3 === 0 && (
          <div className="flex items-center mb-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-1">(5.0)</span>
          </div>
        )}
        
        {/* Price */}
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-lg font-semibold text-gray-900">
            {formatPrice(product.price_cents)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(product.compare_at_price_cents!)}
            </span>
          )}
        </div>

        {/* Size Options (Demo) */}
        {index % 2 === 0 && (
          <div className="flex gap-1 mb-3">
            {['M-38', 'L-40', 'XL-42'].map((size) => (
              <button
                key={size}
                className="text-xs px-2 py-1 border border-gray-300 rounded hover:border-gray-400 transition-colors duration-200"
              >
                {size}
              </button>
            ))}
          </div>
        )}

        {/* Stock Status */}
        <div className="flex items-center justify-between">
          {product.stock > 0 ? (
            <span className="text-xs text-green-600">
              {product.stock} in stock
            </span>
          ) : (
            <span className="text-xs text-red-600">
              Out of stock
            </span>
          )}
          
          {/* Add to Cart Button */}
          <button className="bg-indigo-600 text-white text-xs py-2 px-3 rounded-md hover:bg-indigo-700 transition-colors duration-200">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}
