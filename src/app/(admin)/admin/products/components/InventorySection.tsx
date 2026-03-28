'use client'

import { ProductFormData } from '@/types/product'
import { FieldErrors, UseFormRegister } from 'react-hook-form'

interface InventorySectionProps {
  formData: ProductFormData
  errors?: FieldErrors<ProductFormData>
  onInputChange?: (field: keyof ProductFormData, value: string | number | boolean | null | unknown[]) => void
  register?: UseFormRegister<ProductFormData>
}

export function InventorySection({ formData, errors, onInputChange }: InventorySectionProps) {
  // Handle stock change with better empty value handling
  const handleStockChange = (value: string) => {
    if (value === '') {
      onInputChange?.('stock', null)
    } else {
      const parsed = parseInt(value)
      onInputChange?.('stock', isNaN(parsed) ? 0 : parsed)
    }
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stock Quantity *
          </label>
          <input
            type="number"
            value={formData.stock ?? ''}
            onChange={(e) => handleStockChange(e.target.value)}
            min="0"
            className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
            placeholder="0"
          />
          {errors?.stock && (
            <p className="mt-1 text-sm text-red-600">{errors?.stock?.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Current available stock. Set to 0 if out of stock.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SKU <span className="text-gray-400 text-xs">({(formData.sku || '').length}/100)</span>
          </label>
          <input
            type="text"
            value={formData.sku || ''}
            onChange={(e) => onInputChange?.('sku', e.target.value)}
            maxLength={100}
            className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
            placeholder="SKU-123"
          />
          {errors?.sku && (
            <p className="mt-1 text-sm text-red-600">{errors?.sku?.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Unique identifier for this product (max 100 characters)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Barcode <span className="text-gray-400 text-xs">({(formData.barcode || '').length}/100)</span>
          </label>
          <input
            type="text"
            value={formData.barcode || ''}
            onChange={(e) => onInputChange?.('barcode', e.target.value)}
            maxLength={100}
            className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
            placeholder="EAN-13, UPC, or other barcode"
          />
          {errors?.barcode && (
            <p className="mt-1 text-sm text-red-600">{errors?.barcode?.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Product barcode (EAN-13, UPC, ISBN, etc.)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Low Stock Threshold
          </label>
          <input
            type="number"
            value={formData.low_stock_threshold ?? ''}
            onChange={(e) => onInputChange?.('low_stock_threshold', e.target.value ? parseInt(e.target.value) : null)}
            min="0"
            className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
            placeholder="5"
            disabled={!formData.track_inventory}
          />
          {errors?.low_stock_threshold && (
            <p className="mt-1 text-sm text-red-600">{errors?.low_stock_threshold?.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {formData.track_inventory 
              ? 'Get notified when stock falls below this number' 
              : 'Enable "Track Inventory" to set threshold'}
          </p>
        </div>

        <div className="space-y-4">
          {/* Track Inventory Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Track Inventory</label>
              <p className="text-sm text-gray-500">Monitor stock levels for this product</p>
            </div>
            <button
              type="button"
              onClick={() => onInputChange?.('track_inventory', !formData.track_inventory)}
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

          {/* Allow Backorders Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Allow Backorders</label>
              <p className="text-sm text-gray-500">Let customers order when out of stock</p>
            </div>
            <button
              type="button"
              onClick={() => onInputChange?.('allow_backorders', !formData.allow_backorders)}
              disabled={!formData.track_inventory}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.allow_backorders && formData.track_inventory ? 'bg-indigo-600' : 'bg-gray-200'
              } ${!formData.track_inventory ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.allow_backorders && formData.track_inventory ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {!formData.track_inventory && (
            <p className="text-xs text-amber-600">
              ⚠️ Backorders can only be enabled when inventory tracking is on
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
