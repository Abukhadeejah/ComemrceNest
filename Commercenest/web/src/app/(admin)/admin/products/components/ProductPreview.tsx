'use client'

import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { ProductFormData } from '@/types/product'

interface ProductPreviewProps {
  formData: ProductFormData
  images: (File | string)[]
  onClose: () => void
}

export function ProductPreview({ formData, images, onClose }: ProductPreviewProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-7xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-medium text-gray-900">Product Preview - How it will appear to customers</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          {/* Senlysh PDP Design Preview - Exact Match */}
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            {/* Senlysh Header Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm">Welcome To Senlysh - Rewards Begin Now</span>
                  <span className="text-sm">Your Shopping Our Rewards, Free Membership Inside!</span>
                </div>
              </div>
            </div>

            {/* Senlysh Navigation */}
            <div className="bg-white border-b border-gray-200 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <span className="font-semibold text-gray-900">Senlysh</span>
                  <nav className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-600">HOME</span>
                    <span className="text-gray-600">SHOP</span>
                    <span className="text-gray-600">NEW ARRIVALS</span>
                    <span className="text-gray-600">SALE</span>
                    <span className="text-gray-600">ABOUT US</span>
                    <span className="text-gray-600">CONTACT US</span>
                  </nav>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Search</span>
                  <span className="text-sm text-gray-600">●</span>
                  <span className="text-sm text-gray-600">9+</span>
                  <span className="text-sm text-gray-600">3</span>
                </div>
              </div>
            </div>

            {/* Breadcrumb */}
            <div className="bg-gray-50 border-b border-gray-100 px-6 py-3">
              <nav className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Home</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                </svg>
                <span className="text-gray-500">Products</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                </svg>
                <span className="text-gray-900 font-semibold">{String(formData.name || 'Product Name')}</span>
              </nav>
            </div>

            {/* Product Content - Exact Senlysh Layout */}
            <div className="p-6">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Image Gallery - Senlysh Style */}
                <div>
                  <div className="relative w-full overflow-hidden rounded-2xl border border-gray-200 shadow-sm aspect-[4/3] bg-gray-100">
                    {images.length > 0 ? (
                      <div className="h-full w-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <div className="text-center">
                          <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Image Preview</p>
                          <p className="text-xs text-gray-400">{images.length} image(s) uploaded</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <div className="text-center">
                          <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No images uploaded</p>
                        </div>
                      </div>
                    )}
                    {/* Hover to zoom text */}
                    <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      Hover to zoom
                    </div>
                  </div>
                </div>

                {/* Product Details - Exact Senlysh Style */}
                <div>
                  <h1 className="text-4xl font-black text-gray-900 leading-tight mb-2">
                    {String(formData.name || 'Product Name')}
                  </h1>
                  
                  {/* Price - Senlysh Style */}
                  <div className="text-3xl font-bold text-gray-900 mb-4">
                    ₹{formData.price_cents ? (Number(formData.price_cents) / 100).toLocaleString('en-IN') : '0.00'}
                  </div>

                  {/* Rating + Stock - Senlysh Style */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1 text-yellow-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                        </svg>
                      ))}
                    </div>
                    <span className="text-gray-500 text-sm">(47 reviews)</span>
                    <span className="text-green-600 text-sm font-medium">✓ In Stock</span>
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 text-lg leading-relaxed mb-6">
                    {String(formData.description || 'No description provided.')}
                  </p>

                  {/* Size Selection - Senlysh Style */}
                  <div className="mb-6">
                    <div className="text-gray-700 font-semibold mb-3">Size</div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                        M-38
                      </button>
                      <button className="px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                        L-40
                      </button>
                      <button className="px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                        XL-42
                      </button>
                    </div>
                  </div>

                  {/* Quantity and Add to Cart - Senlysh Style */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-700 font-semibold">Quantity</span>
                      <div className="inline-flex items-center rounded-lg border border-gray-300 overflow-hidden">
                        <button className="w-10 h-10 grid place-items-center text-gray-600 hover:bg-gray-50">-</button>
                        <div className="px-4 font-semibold text-gray-700 select-none">1</div>
                        <button className="w-10 h-10 grid place-items-center text-gray-600 hover:bg-gray-50">+</button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                        ADD TO CART
                      </button>
                      <button className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">
                        BUY NOW
                      </button>
                    </div>
                  </div>

                  {/* Social Proof - Senlysh Style */}
                  <div className="mb-6 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700">
                      <span>😊</span>
                      <span className="text-sm font-medium">56 people are viewing this right now</span>
                    </div>
                  </div>

                  {/* Action Buttons - Senlysh Style */}
                  <div className="flex gap-3 mb-6">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      <span className="text-sm">Size Guide</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                      </svg>
                      <span className="text-sm">Delivery & Returns</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <span className="text-sm">Ask a Question</span>
                    </button>
                  </div>

                  {/* Share Buttons - Senlysh Style */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-gray-700 font-medium">Share:</span>
                    <button className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                      </svg>
                    </button>
                    <button className="p-2 bg-blue-800 text-white rounded-full hover:bg-blue-900 transition-colors">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                      </svg>
                    </button>
                    <button className="p-2 bg-pink-600 text-white rounded-full hover:bg-pink-700 transition-colors">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                      </svg>
                    </button>
                    <button className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </button>
                  </div>

                  {/* Trust Badges - Senlysh Style */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center mb-2">
                      <p className="text-sm font-medium text-gray-700">Guaranteed Safe Checkout</p>
                    </div>
                    <div className="flex justify-center gap-4">
                      <div className="text-xs text-gray-500">PayPal</div>
                      <div className="text-xs text-gray-500">VISA</div>
                      <div className="text-xs text-gray-500">MC</div>
                      <div className="text-xs text-gray-500">AMEX</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Section - Senlysh Style */}
              <div className="mt-8 border-t border-gray-200 pt-6">
                <div className="flex gap-6 mb-4">
                  <button className="px-4 py-2 text-gray-700 font-medium border-b-2 border-blue-600">Description</button>
                  <button className="px-4 py-2 text-gray-500 hover:text-gray-700">Additional information</button>
                  <button className="px-4 py-2 text-gray-500 hover:text-gray-700">Reviews (0)</button>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {String(formData.description || 'No description provided.')}
                </p>
              </div>

              {/* Related Products - Senlysh Style */}
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Related Products</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    <div className="text-sm text-gray-600">Related Product 1</div>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    <div className="text-sm text-gray-600">Related Product 2</div>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    <div className="text-sm text-gray-600">Related Product 3</div>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    <div className="text-sm text-gray-600">Related Product 4</div>
                  </div>
                </div>
              </div>

              {/* My Rewards Button - Senlysh Style */}
              <div className="mt-6 text-center">
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 text-gray-900 font-semibold rounded-lg hover:bg-yellow-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                  </svg>
                  My Rewards
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



