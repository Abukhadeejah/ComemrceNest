'use client'


import { ProductFormData } from '@/types/product'

interface ShippingSectionProps {
  formData: ProductFormData
  errors: Record<string, string>
  onInputChange: (field: keyof ProductFormData, value: string | number | boolean | null | unknown[]) => void
}

export function ShippingSection({ formData, errors, onInputChange }: ShippingSectionProps) {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weight (kg)
          </label>
          <input
            type="number"
            value={String(formData.weight || '')}
            onChange={(e) => onInputChange('weight', e.target.value)}
            step="0.01"
            min="0"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="0.5"
          />
          {errors.weight && (
            <p className="mt-1 text-sm text-red-600">{errors.weight}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Product weight for shipping calculations
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dimensions
          </label>
          <input
            type="text"
            value={String(formData.dimensions || '')}
            onChange={(e) => onInputChange('dimensions', e.target.value)}
            placeholder="10x5x2 cm"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.dimensions && (
            <p className="mt-1 text-sm text-red-600">{errors.dimensions}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Product dimensions (e.g., 30 x 20 x 5 cm)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            HS Code
          </label>
          <input
            type="text"
            value={String(formData.hs_code || '')}
            onChange={(e) => onInputChange('hs_code', e.target.value)}
            placeholder="HS code for customs"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.hs_code && (
            <p className="mt-1 text-sm text-red-600">{errors.hs_code}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            International trade classification code
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Requires Shipping
              </label>
              <p className="text-sm text-gray-500">
                This product needs to be shipped
              </p>
            </div>
            <button
              type="button"
              onClick={() => onInputChange('requires_shipping', !formData.requires_shipping)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.requires_shipping ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.requires_shipping ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Taxable
              </label>
              <p className="text-sm text-gray-500">
                Apply taxes to this product
              </p>
            </div>
            <button
              type="button"
              onClick={() => onInputChange('taxable', !formData.taxable)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.taxable ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.taxable ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
