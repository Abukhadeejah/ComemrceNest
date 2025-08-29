'use client'

import { useCart, formatPrice } from '@/lib/cart'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Playfair_Display, Inter } from 'next/font/google'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700','800','900'] })
const inter = Inter({ subsets: ['latin'], weight: ['300','400','500','600','700'] })

export default function CartPage() {
  const { state, removeItem, updateQuantity } = useCart()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCheckout = async () => {
    setIsProcessing(true)
    try {
      // Here we'll integrate with the checkout API
      console.log('Processing checkout with items:', state.items)
      // For now, redirect to checkout
      window.location.href = '/checkout'
    } catch (error) {
      console.error('Checkout error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  if (state.items.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <div className="mb-8">
            <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13v8a2 2 0 002 2h10a2 2 0 002-2v-3" />
            </svg>
            <h1 className={`${playfair.className} text-3xl font-bold text-gray-900 mb-2`}>Your cart is empty</h1>
            <p className={`${inter.className} text-gray-600 mb-8`}>Discover our premium fabric collection and start building your perfect interior.</p>
            <Link
              href="/products"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Products
              <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`${playfair.className} text-3xl font-bold text-gray-900 mb-2`}>Shopping Cart</h1>
          <p className={`${inter.className} text-gray-600`}>{state.itemCount} item{state.itemCount !== 1 ? 's' : ''} in your cart</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {state.items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>

                    {/* Variant Info */}
                    {item.variant && (
                      <p className="text-sm text-gray-600 mt-1">
                        {Object.entries(item.variant.options).map(([key, value]) => `${key}: ${value}`).join(', ')}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-blue-600">{formatPrice(item.price)}</span>

                        {/* Quantity Controls */}
                        <div className="flex items-center border rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                          >
                            -
                          </button>
                          <span className="px-3 py-1 font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-gray-900">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove item"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h2 className={`${playfair.className} text-xl font-bold text-gray-900 mb-6`}>Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({state.itemCount} items)</span>
                  <span>{formatPrice(state.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-blue-600">{formatPrice(state.total)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
              </button>

              <div className="mt-4 text-center">
                <Link
                  href="/products"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}





