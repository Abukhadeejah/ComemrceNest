'use client'

import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { ProductFormData } from '@/types/product'

interface ProductPreviewProps {
  formData: ProductFormData
  images: File[]
  onClose: () => void
}

export function ProductPreview({ formData, images, onClose }: ProductPreviewProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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
          
          {/* Preview Content - Mimicking the actual product page */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
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

            {/* Product Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Image Gallery */}
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
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4 rounded-full bg-yellow-500 text-white px-3 py-1 text-xs font-bold shadow-lg">
                      {String(formData.status) === 'published' ? 'Published' : 'Draft'}
                    </div>
                  </div>
                  
                  {/* Thumbnail Gallery */}
                  {images.length > 1 && (
                    <div className="mt-4 flex gap-3">
                      {images.slice(0, 4).map((_, i) => (
                        <div key={i} className="h-16 w-16 rounded-xl border border-gray-200 bg-gray-100 flex items-center justify-center">
                          <PhotoIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div>
                  <h1 className="text-4xl font-black text-gray-900 leading-tight mb-2">
                    {String(formData.name || 'Product Name')}
                  </h1>
                  <div className="w-28 h-1 bg-yellow-500 rounded-full mb-4" />
                  <div className="text-yellow-600 font-semibold mb-4">
                    {formData.category_id ? 'Category Selected' : 'No Category'}
                  </div>

                  {/* Rating + Stock */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1 text-yellow-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                        </svg>
                      ))}
                    </div>
                    <div className="text-gray-600 text-sm">(0 reviews)</div>
                    <div className={`text-sm font-semibold ${
                      Number(formData.stock) > 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {Number(formData.stock) > 0 ? '✓ In Stock' : '✗ Out of Stock'}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 text-lg leading-relaxed mb-6">
                    {String(formData.description || 'No description provided.')}
                  </p>

                  {/* Price */}
                  <div className="flex items-end gap-4 mb-8">
                    <div className="text-3xl font-extrabold text-red-600">
                      ₹{formData.price_cents ? (Number(formData.price_cents) / 100).toLocaleString('en-IN') : '0.00'}
                    </div>
                    {formData.compare_at_price_cents && (
                      <div className="text-lg text-gray-500 line-through">
                        ₹{formData.compare_at_price_cents ? (Number(formData.compare_at_price_cents) / 100).toLocaleString('en-IN') : '0.00'}
                      </div>
                    )}
                    <div className="text-gray-600">per unit</div>
                  </div>

                                     {/* SKU and Details */}
                   {String(formData.sku || '') && (
                     <div className="mb-4">
                       <span className="text-sm text-gray-500">SKU: </span>
                       <span className="text-sm font-medium text-gray-700">{String(formData.sku)}</span>
                     </div>
                   )}

                   {/* Weight and Dimensions */}
                   {(String(formData.weight || '') || String(formData.dimensions || '')) && (
                     <div className="mb-6 space-y-2">
                       {String(formData.weight || '') && (
                         <div>
                           <span className="text-sm text-gray-500">Weight: </span>
                           <span className="text-sm font-medium text-gray-700">{String(formData.weight)} kg</span>
                         </div>
                       )}
                       {String(formData.dimensions || '') && (
                         <div>
                           <span className="text-sm text-gray-500">Dimensions: </span>
                           <span className="text-sm font-medium text-gray-700">{String(formData.dimensions)}</span>
                         </div>
                       )}
                     </div>
                   )}

                  {/* Quantity Selector */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-gray-700 font-semibold">Quantity</span>
                    <div className="inline-flex items-center rounded-xl border border-gray-200 overflow-hidden">
                      <button className="w-10 h-10 grid place-items-center text-gray-600 hover:bg-gray-50">-</button>
                      <div className="px-4 font-semibold text-gray-700 select-none">1</div>
                      <button className="w-10 h-10 grid place-items-center text-gray-600 hover:bg-gray-50">+</button>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <button className="inline-flex items-center justify-center gap-2 rounded-full bg-yellow-500 text-gray-900 px-8 py-4 font-semibold shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5">
                    Add to Cart
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>

                  {/* SEO Preview */}
                  {(formData.meta_title || formData.meta_description) && (
                    <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">SEO Preview</h4>
                      {formData.meta_title && (
                        <div className="mb-2">
                          <div className="text-sm text-blue-700 font-medium">Meta Title:</div>
                          <div className="text-sm text-blue-600">{String(formData.meta_title)}</div>
                        </div>
                      )}
                      {formData.meta_description && (
                        <div>
                          <div className="text-sm text-blue-700 font-medium">Meta Description:</div>
                          <div className="text-sm text-blue-600">{String(formData.meta_description)}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


