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
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto relative p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
          aria-label="Close preview"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <div>
          <h2 className="text-2xl font-bold mb-4">{formData.name || 'Untitled Product'}</h2>
          {images.length > 0 ? (
            <div className="grid grid-cols-4 gap-4 mb-6">
              {images.map((img, idx) =>
                typeof img === 'string' ? (
                  <img
                    key={idx}
                    src={img}
                    alt={`Product image ${idx + 1}`}
                    className="rounded border border-gray-300 object-cover h-32 w-full"
                  />
                ) : (
                  <img
                    key={idx}
                    src={URL.createObjectURL(img)}
                    alt={`Product image ${idx + 1}`}
                    className="rounded border border-gray-300 object-cover h-32 w-full"
                  />
                )
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-gray-300 rounded text-gray-400">
              <PhotoIcon className="h-12 w-12 mb-2" />
              <p>No images uploaded</p>
            </div>
          )}

          <p className="mb-4 whitespace-pre-wrap">{formData.description || 'No description provided.'}</p>

          <div className="text-sm text-gray-600">Guaranteed Safe Checkout</div>
        </div>
      </div>
    </div>
  )
}
