'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { QuestionMarkCircleIcon, GiftIcon } from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/24/solid'
import { Product } from '@/types/product'

// Type for server response which may be partial
type ProductServerResponse = Partial<Product> & {
  id: string
  name: string
  price_cents: number
  currency: string
}

interface ProductDetailProps {
  product: ProductServerResponse
  images: Record<string, unknown>[]
}

export function ProductDetail({ product, images }: ProductDetailProps) {
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)

  const formatPrice = (priceCents: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(priceCents / 100)
  }

  const hasDiscount = product.compare_at_price_cents && product.compare_at_price_cents > product.price_cents

  const allImages = product.hero_image_url ? [product.hero_image_url, ...images.map((img: Record<string, unknown>) => img.url as string)] : images.map((img: Record<string, unknown>) => img.url as string)

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Breadcrumb */}
      <div className="px-6 py-4 border-b border-gray-200">
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <span>»</span>
          <Link href="/products" className="hover:text-gray-700">Products</Link>
          <span>»</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
            {allImages[activeImage] ? (
              <Image
                src={allImages[activeImage] as string}
                alt={String(product.name)}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            {/* Zoom indicator */}
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
              Hover to zoom
            </div>
          </div>

          {/* Thumbnail Images */}
          {allImages.length > 1 && (
            <div className="flex space-x-2">
              {allImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`w-16 h-16 rounded border-2 overflow-hidden ${
                    activeImage === index ? 'border-indigo-500' : 'border-gray-300'
                  }`}
                >
                  <Image
                    src={image as string}
                    alt={`${String(product.name)} ${index + 1}`}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Product Title and Price */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{String(product.name)}</h1>
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-bold text-gray-900">
                {formatPrice(product.price_cents)}
              </span>
              {hasDiscount && (
                <span className="text-lg text-gray-500 line-through">
                  {formatPrice(product.compare_at_price_cents || 0)}
                </span>
              )}
            </div>
          </div>

          {/* Star Rating */}
          <div className="flex items-center space-x-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className="w-5 h-5" />
              ))}
            </div>
            <span className="text-sm text-gray-600">(47 reviews)</span>
            <span className="text-sm text-green-600">✓ In Stock</span>
          </div>

          {/* Product Description */}
          <div className="text-gray-700 leading-relaxed">
            <p className="text-lg mb-4">&ldquo;{String(product.description || '')}&rdquo;</p>
          </div>

          {/* Size Selection - Circular Radio Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
            <div className="flex space-x-2">
              {['M-38', 'L-40', 'XL-42'].map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${
                    selectedSize === size
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity and Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Quantity</label>
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-gray-600 hover:text-gray-900"
                >
                  -
                </button>
                <span className="px-4 py-2 border-x border-gray-300">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-gray-600 hover:text-gray-900"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex space-x-3">
              <button className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-md font-medium hover:bg-orange-600 transition-colors">
                ADD TO CART
              </button>
              <button className="flex-1 bg-green-600 text-white py-3 px-6 rounded-md font-medium hover:bg-green-700 transition-colors">
                BUY NOW
              </button>
            </div>
          </div>

          {/* Social Proof */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">😊</span>
              <span className="font-medium">56 people</span>
              <span className="text-gray-600">are viewing this right now</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex space-x-4">
            <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Size Guide</span>
            </button>
            <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>Delivery & Returns</span>
            </button>
            <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900">
              <QuestionMarkCircleIcon className="w-4 h-4" />
              <span>Ask a Question</span>
            </button>
          </div>

          {/* Social Sharing */}
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Share:</span>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </button>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
              </svg>
            </button>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </button>
          </div>

          {/* Guaranteed Safe Checkout */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Guaranteed Safe Checkout</p>
            <div className="flex justify-center space-x-4">
              {/* PayPal */}
              <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">PayPal</span>
              </div>
              {/* Visa */}
              <div className="w-12 h-8 bg-blue-800 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">VISA</span>
              </div>
              {/* Mastercard */}
              <div className="w-12 h-8 bg-red-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">MC</span>
              </div>
              {/* American Express */}
              <div className="w-12 h-8 bg-green-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">AMEX</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Tabs */}
      <div className="border-t border-gray-200">
        <div className="px-6 py-4">
          <div className="flex space-x-8">
            <button className="text-sm font-medium text-indigo-600 border-b-2 border-indigo-600 pb-2">
              Description
            </button>
            <button className="text-sm font-medium text-gray-500 hover:text-gray-700">
              Additional information
            </button>
            <button className="text-sm font-medium text-gray-500 hover:text-gray-700">
              Reviews (0)
            </button>
          </div>
        </div>
        <div className="px-6 pb-6">
          <p className="text-gray-700">&ldquo;{product.description}&rdquo;</p>
        </div>
      </div>

      {/* Related Products */}
      <div className="border-t border-gray-200 px-6 py-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Related Products</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Placeholder for related products */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-100 rounded-lg aspect-square flex items-center justify-center">
              <span className="text-gray-400">Related Product {i}</span>
            </div>
          ))}
        </div>
      </div>

      {/* My Rewards Floating Button */}
      <button className="fixed bottom-6 right-6 bg-purple-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 z-50">
        <GiftIcon className="w-5 h-5" />
        <span className="font-medium">My Rewards</span>
      </button>
    </div>
  )
}
