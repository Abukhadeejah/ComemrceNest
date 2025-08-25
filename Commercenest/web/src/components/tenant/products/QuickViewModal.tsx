'use client'

import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, HeartIcon, ShoppingBagIcon, StarIcon, EyeIcon, ClockIcon, UsersIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import Image from 'next/image'
import Link from 'next/link'
import { ProductListItem } from '@/server/modules/products/service'

interface QuickViewModalProps {
  product: ProductListItem | null
  isOpen: boolean
  onClose: () => void
}

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const [selectedSize, setSelectedSize] = useState('M')
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [viewingCount, setViewingCount] = useState(0)
  const [recentPurchases, setRecentPurchases] = useState<string[]>([])

  // Simulate social proof data
  useEffect(() => {
    if (isOpen && product) {
      // Simulate viewing counter
      const baseViewers = Math.floor(Math.random() * 15) + 8
      setViewingCount(baseViewers)
      
      // Simulate recent purchases
      const names = ['Priya from Mumbai', 'Rahul from Delhi', 'Anjali from Bangalore', 'Vikram from Chennai', 'Meera from Hyderabad']
      const recent = names.slice(0, Math.floor(Math.random() * 3) + 2)
      setRecentPurchases(recent)
      
      // Update viewing count every 30 seconds
      const interval = setInterval(() => {
        setViewingCount(prev => prev + Math.floor(Math.random() * 3) - 1)
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [isOpen, product])

  if (!product) return null

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

  const handleWishlistToggle = () => {
    setIsWishlisted(!isWishlisted)
  }

  const handleAddToCart = () => {
    // TODO: Implement add to cart functionality
    console.log('Adding to cart:', { product: product.name, size: selectedSize, quantity })
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity)
    }
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>


        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-4">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-sm bg-white">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-2xl">
                    <div className="px-4 sm:px-6">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-lg font-medium text-gray-900">
                          Quick View
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            onClick={onClose}
                          >
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="relative mt-6 flex-1 px-4 sm:px-6">
                      {/* Social Proof Banner */}
                      <div className="mb-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <EyeIcon className="w-4 h-4 text-orange-600" />
                            <span className="text-orange-800 font-medium">
                              {viewingCount} people viewing this right now
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ClockIcon className="w-3 h-3 text-orange-600" />
                            <span className="text-orange-700">Live</span>
                          </div>
                        </div>
                      </div>

                      {/* Recent Purchases Ticker */}
                      {recentPurchases.length > 0 && (
                        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2 text-sm">
                            <UsersIcon className="w-4 h-4 text-green-600" />
                            <span className="text-green-800 font-medium">Recent purchases:</span>
                            <span className="text-green-700">
                              {recentPurchases.join(', ')}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Product Image */}
                      <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 mb-6">
                        {product.hero_image_url ? (
                          <Image
                            src={product.hero_image_url}
                            alt={product.name}
                            width={400}
                            height={400}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Product Specifications */}
                      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-blue-900 mb-3">Product Details</h3>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-blue-700 font-medium">Material:</span>
                            <span className="text-blue-600 ml-1">Premium Cotton</span>
                          </div>
                          <div>
                            <span className="text-blue-700 font-medium">Fit:</span>
                            <span className="text-blue-600 ml-1">Regular Fit</span>
                          </div>
                          <div>
                            <span className="text-blue-700 font-medium">Care:</span>
                            <span className="text-blue-600 ml-1">Machine Wash</span>
                          </div>
                          <div>
                            <span className="text-blue-700 font-medium">Origin:</span>
                            <span className="text-blue-600 ml-1">Made in India</span>
                          </div>
                        </div>
                      </div>

                      {/* Trust Badges */}
                      <div className="mb-6 flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center space-x-4 text-xs">
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-green-700 font-medium">Authentic</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-blue-700 font-medium">Free Returns</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                            <span className="text-purple-700 font-medium">Fast Delivery</span>
                          </div>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="space-y-4">
                        {/* Title */}
                        <h2 className="text-xl font-semibold text-gray-900">{product.name}</h2>

                        {/* Rating */}
                        <div className="flex items-center space-x-2">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon key={i} className="w-4 h-4 fill-current" />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">4.8 (127 reviews)</span>
                        </div>

                        {/* Price */}
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl font-bold text-gray-900">
                            {formatPrice(product.price_cents)}
                          </span>
                          {hasDiscount && (
                            <>
                              <span className="text-lg text-gray-500 line-through">
                                {formatPrice(product.compare_at_price_cents!)}
                              </span>
                              <span className="text-sm font-medium text-red-600">
                                {discountPercentage}% OFF
                              </span>
                            </>
                          )}
                        </div>

                        {/* Enhanced Stock Status with Urgency */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {product.stock > 0 ? (
                                <>
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                  <span className="text-sm text-green-700 font-medium">
                                    ✓ {product.stock} in stock
                                  </span>
                                </>
                              ) : (
                                <>
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  <span className="text-sm text-red-700 font-medium">
                                    ✗ Out of stock
                                  </span>
                                </>
                              )}
                            </div>
                            {product.stock <= 5 && product.stock > 0 && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                                Low Stock!
                              </span>
                            )}
                          </div>
                          {product.stock <= 3 && product.stock > 0 && (
                            <div className="mt-2 text-xs text-red-600 font-medium">
                              ⚠️ Only {product.stock} left! Order soon to avoid disappointment.
                            </div>
                          )}
                        </div>

                        {/* Size Selection */}
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 mb-2">Select Size</h3>
                          <div className="flex space-x-2">
                            {['S', 'M', 'L', 'XL'].map((size) => (
                              <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors duration-200 ${
                                  selectedSize === size
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                                }`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Quantity */}
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 mb-2">Quantity</h3>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleQuantityChange(quantity - 1)}
                              disabled={quantity <= 1}
                              className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              -
                            </button>
                            <span className="text-lg font-medium text-gray-900 min-w-[2rem] text-center">
                              {quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(quantity + 1)}
                              disabled={quantity >= product.stock}
                              className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-3 pt-4">
                          <button
                            onClick={handleWishlistToggle}
                            className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center space-x-2"
                          >
                            {isWishlisted ? (
                              <HeartSolidIcon className="w-5 h-5 text-red-500" />
                            ) : (
                              <HeartIcon className="w-5 h-5" />
                            )}
                            <span>{isWishlisted ? 'Wishlisted' : 'Wishlist'}</span>
                          </button>
                          
                          <button
                            onClick={handleAddToCart}
                            disabled={product.stock === 0}
                            className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                          >
                            <ShoppingBagIcon className="w-5 h-5" />
                            <span>Add to Cart</span>
                          </button>
                        </div>

                        {/* View Full Details Link */}
                        <div className="pt-4 border-t border-gray-200">
                          <Link
                            href={`/products/${product.slug}`}
                            className="block w-full text-center text-indigo-600 font-medium hover:text-indigo-700 transition-colors duration-200"
                            onClick={onClose}
                          >
                            View Full Details →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
