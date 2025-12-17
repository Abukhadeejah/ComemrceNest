'use client'

import { ProductFormData } from '@/types/product'
import { FieldErrors } from 'react-hook-form'

interface ProductStatusSectionProps {
  formData: ProductFormData
  errors?: FieldErrors<ProductFormData>
  onInputChange?: (field: keyof ProductFormData, value: string | number | boolean | null | unknown[]) => void
}

export function ProductStatusSection({ formData, errors, onInputChange }: ProductStatusSectionProps) {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Product Status</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Publication Status
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="draft"
                checked={formData.status === 'draft'}
                onChange={(e) => onInputChange?.('status', e.target.value)}
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                  <span className="text-sm font-medium text-gray-900">Save as Draft</span>
                </div>
                <p className="text-xs text-gray-500">
                  Product will be saved but not visible to customers.
                </p>
              </div>
            </label>

            <label className="flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="published"
                checked={formData.status === 'published'}
                onChange={(e) => onInputChange?.('status', e.target.value)}
                className="mr-3 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span className="text-sm font-medium text-gray-900">Publish Product</span>
                </div>
                <p className="text-xs text-gray-500">
                  Product will be live and visible to customers.
                </p>
              </div>
            </label>
          </div>
          
          {errors?.status && (
            <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
          )}
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-blue-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm text-blue-800">
                <strong>Current Status:</strong> {formData.status === 'published' ? 'Published' : 'Draft'}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {formData.status === 'published' 
                  ? 'This product is live and customers can see it on your store.'
                  : 'This product is saved as a draft and not visible to customers yet.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
