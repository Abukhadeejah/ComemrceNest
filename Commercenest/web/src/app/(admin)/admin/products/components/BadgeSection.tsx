'use client'

import { ProductFormData } from '@/types/product'
import { useState, useEffect } from 'react'
import { FieldErrors, UseFormRegister } from 'react-hook-form'

interface BadgeSectionProps {
  formData: ProductFormData
  errors?: FieldErrors<ProductFormData>
  onInputChange?: (field: keyof ProductFormData, value: string | number | boolean | null | unknown[]) => void
  register?: UseFormRegister<ProductFormData>
}

const BADGE_PRESETS = [
  { value: 'new', label: 'New Arrival', description: 'Highlight new products', color: 'bg-blue-500' },
  { value: 'sale', label: 'On Sale', description: 'Show discounted items', color: 'bg-red-500' },
  { value: 'featured', label: 'Featured', description: 'Spotlight special products', color: 'bg-purple-500' },
  { value: 'bestseller', label: 'Bestseller', description: 'Top performing products', color: 'bg-green-500' },
  { value: 'limited', label: 'Limited Edition', description: 'Exclusive or rare items', color: 'bg-amber-500' },
  { value: 'custom', label: 'Custom', description: 'Create your own badge text', color: 'bg-gray-500' },
]

const PRIORITY_OPTIONS = [
  { value: 1, label: 'High (Shown First)' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'Low' },
]

export function BadgeSection({ formData, errors, onInputChange }: BadgeSectionProps) {
  // Handle multiple badge toggles
  const handleBadgeToggle = (badgeField: keyof ProductFormData, value: boolean) => {
    onInputChange?.(badgeField, value)
  }

  const handleCustomBadgeChange = (text: string) => {
    onInputChange?.('custom_badge_text', text)
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Badges & Labels</h3>
      
      <div className="space-y-6">
        {/* Multiple Badge Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Badge Types (Multiple allowed)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {/* Featured Badge */}
            <label className="flex items-center p-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_featured || false}
                onChange={(e) => handleBadgeToggle('is_featured', e.target.checked)}
                className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                  <span className="text-sm font-medium text-gray-900">Featured</span>
                </div>
                <p className="text-xs text-gray-500">Spotlight special products</p>
              </div>
            </label>

            {/* Bestseller Badge */}
            <label className="flex items-center p-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_bestseller || false}
                onChange={(e) => handleBadgeToggle('is_bestseller', e.target.checked)}
                className="mr-3 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span className="text-sm font-medium text-gray-900">Bestseller</span>
                </div>
                <p className="text-xs text-gray-500">Top performing products</p>
              </div>
            </label>

            {/* New Arrival Badge */}
            <label className="flex items-center p-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_new_arrival || false}
                onChange={(e) => handleBadgeToggle('is_new_arrival', e.target.checked)}
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  <span className="text-sm font-medium text-gray-900">New Arrival</span>
                </div>
                <p className="text-xs text-gray-500">Highlight new products</p>
              </div>
            </label>

            {/* On Sale Badge */}
            <label className="flex items-center p-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_on_sale || false}
                onChange={(e) => handleBadgeToggle('is_on_sale', e.target.checked)}
                className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span className="text-sm font-medium text-gray-900">On Sale</span>
                </div>
                <p className="text-xs text-gray-500">Show discounted items</p>
              </div>
            </label>

            {/* Limited Edition Badge */}
            <label className="flex items-center p-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_limited_edition || false}
                onChange={(e) => handleBadgeToggle('is_limited_edition', e.target.checked)}
                className="mr-3 h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span className="text-sm font-medium text-gray-900">Limited Edition</span>
                </div>
                <p className="text-xs text-gray-500">Exclusive or rare items</p>
              </div>
            </label>

            {/* Sold Out Badge */}
            <label className="flex items-center p-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_sold_out || false}
                onChange={(e) => handleBadgeToggle('is_sold_out', e.target.checked)}
                className="mr-3 h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                  <span className="text-sm font-medium text-gray-900">Sold Out</span>
                </div>
                <p className="text-xs text-gray-500">Out of stock items</p>
              </div>
            </label>
          </div>
        </div>

        {/* Custom Badge Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Badge Text (Optional)
          </label>
          <input
            type="text"
            value={formData.custom_badge_text || ''}
            onChange={(e) => handleCustomBadgeChange(e.target.value)}
            maxLength={20}
            placeholder="e.g., Flash Deal, Trending, Hot"
            className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
          />
          <p className="mt-1 text-sm text-gray-500">
            Max 20 characters. This will show as an additional badge if entered.
          </p>
        </div>

        {/* Badge Color for Custom Badge */}
        {formData.custom_badge_text && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Badge Color
            </label>
            <input
              type="color"
              value={formData.badge_color || '#ef4444'}
              onChange={(e) => onInputChange?.('badge_color', e.target.value)}
              className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
            />
          </div>
        )}

        {/* Badge Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Badge Priority
          </label>
          <select
            value={formData.badge_priority || 0}
            onChange={(e) => onInputChange?.('badge_priority', parseInt(e.target.value))}
            className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
          >
            <option value={0}>Normal Priority</option>
            <option value={1}>High Priority (Shown First)</option>
            <option value={2}>Medium Priority</option>
            <option value={3}>Low Priority</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Higher priority badges display first when multiple badges are active
          </p>
        </div>

        {/* Badge Preview */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-3">Badge Preview</h4>
          <div className="flex flex-wrap gap-2">
            {formData.is_featured && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white bg-purple-600">
                Featured
              </span>
            )}
            {formData.is_bestseller && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white bg-green-600">
                Bestseller
              </span>
            )}
            {formData.is_new_arrival && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white bg-blue-600">
                New Arrival
              </span>
            )}
            {formData.is_on_sale && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white bg-red-600">
                On Sale
              </span>
            )}
            {formData.is_limited_edition && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white bg-amber-600">
                Limited Edition
              </span>
            )}
            {formData.is_sold_out && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white bg-gray-600">
                Sold Out
              </span>
            )}
            {formData.custom_badge_text && (
              <span 
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: formData.badge_color || '#ef4444' }}
              >
                {formData.custom_badge_text}
              </span>
            )}
            {!formData.is_featured && !formData.is_bestseller && !formData.is_new_arrival && 
             !formData.is_on_sale && !formData.is_limited_edition && !formData.is_sold_out && 
             !formData.custom_badge_text && (
              <span className="text-sm text-gray-500 italic">No badges selected</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
