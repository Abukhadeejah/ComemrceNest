'use client'

import { ProductFormData } from '@/types/product'
import { FieldErrors, UseFormRegister } from 'react-hook-form'

interface ShippingSectionProps {
  formData: ProductFormData
  errors?: FieldErrors<ProductFormData>
  onInputChange?: (field: keyof ProductFormData, value: string | number | boolean | null | unknown) => void
  register?: UseFormRegister<ProductFormData>
}

export function ShippingSection({ formData, errors, onInputChange }: ShippingSectionProps) {
  // Parse weight to float with proper handling
  const handleWeightChange = (value: string) => {
    if (value === '') {
      onInputChange?.('weight', null)
    } else {
      const parsed = parseFloat(value)
      onInputChange?.('weight', isNaN(parsed) ? null : parsed)
    }
  }

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
            value={formData.weight ?? ''}
            onChange={(e) => handleWeightChange(e.target.value)}
            step="0.01"
            min="0"
            className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
            placeholder="0.5"
          />
          {errors?.weight && (
            <p className="mt-1 text-sm text-red-600">{errors?.weight?.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Product weight for shipping calculations
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dimensions (L × W × H cm) <span className="text-gray-400 text-xs">({(formData.dimensions || '').length}/255)</span>
          </label>
          <input
            type="text"
            value={formData.dimensions || ''}
            onChange={(e) => onInputChange?.('dimensions', e.target.value)}
            maxLength={255}
            placeholder="30 * 20 * 5"
            pattern="^\d+\s*×\s*\d+\s*×\s*\d+$"
            className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
          />
          {errors?.dimensions && (
            <p className="mt-1 text-sm text-red-600">{errors?.dimensions?.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Format: Length × Width × Height (e.g., 30 × 20 × 5)
          </p>
        </div>

        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="text-sm font-medium text-gray-700">Requires Shipping</label>
              <p className="text-sm text-gray-500">
                {formData.requires_shipping 
                  ? 'Physical product - shipping required' 
                  : 'Digital product - no shipping needed'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onInputChange?.('requires_shipping', !formData.requires_shipping)}
              disabled={!formData.weight && !formData.dimensions}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.requires_shipping ? 'bg-indigo-600' : 'bg-gray-200'
              } ${!formData.weight && !formData.dimensions ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.requires_shipping ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {!formData.weight && !formData.dimensions && (
            <p className="mt-2 text-xs text-amber-600">
              ⚠️ Add weight or dimensions to enable shipping
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
