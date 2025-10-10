'use client'


import { ProductFormData } from '@/types/product'

interface InventorySectionProps {
  formData: ProductFormData
  errors: Record<string, string>
  onInputChange: (field: keyof ProductFormData, value: string | number | boolean | null | unknown[]) => void
}

export function InventorySection({ formData, errors, onInputChange }: InventorySectionProps) {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stock Quantity
          </label>
          <input
            type="number"
            value={String(formData.stock || 0)}
            onChange={(e) => onInputChange('stock', parseInt(e.target.value) || 0)}
            min="0"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="0"
          />
          {errors.stock && (
            <p className="mt-1 text-sm text-red-600">{errors.stock}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SKU
          </label>
          <input
            type="text"
            value={String(formData.sku || '')}
            onChange={(e) => onInputChange('sku', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="SKU-123"
          />
          {errors.sku && (
            <p className="mt-1 text-sm text-red-600">{errors.sku}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Unique identifier for this product
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Low Stock Threshold
          </label>
          <input
            type="number"
            value={String(formData.low_stock_threshold || '')}
            onChange={(e) => onInputChange('low_stock_threshold', e.target.value ? parseInt(e.target.value) : null)}
            min="0"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="5"
          />
          {errors.low_stock_threshold && (
            <p className="mt-1 text-sm text-red-600">{errors.low_stock_threshold}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Alert when stock falls below this number
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Track Inventory
              </label>
              <p className="text-sm text-gray-500">
                Monitor stock levels for this product
              </p>
            </div>
            <button
              type="button"
              onClick={() => onInputChange('track_inventory', !formData.track_inventory)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.track_inventory ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.track_inventory ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Allow Backorders
              </label>
              <p className="text-sm text-gray-500">
                Let customers order when out of stock
              </p>
            </div>
            <button
              type="button"
              onClick={() => onInputChange('allow_backorders', !formData.allow_backorders)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.allow_backorders ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.allow_backorders ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
