'use client'

import { useState } from 'react'
import { ProductFormData } from '@/types/product'

interface BadgeSectionProps {
  formData: ProductFormData
  errors: Record<string, string>
  onInputChange: (field: keyof ProductFormData, value: string | number | boolean | null | unknown[]) => void
}

export function BadgeSection({ formData, onInputChange }: BadgeSectionProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const badgeTypes = [
    {
      key: 'is_featured' as keyof ProductFormData,
      label: 'Featured',
      description: 'Highlight this product as a featured item',
      color: '#3b82f6', // Blue
      icon: '⭐'
    },
    {
      key: 'is_bestseller' as keyof ProductFormData,
      label: 'Bestseller',
      description: 'Mark as a best-selling product',
      color: '#f59e0b', // Amber
      icon: '🏆'
    },
    {
      key: 'is_new_arrival' as keyof ProductFormData,
      label: 'New Arrival',
      description: 'Show as a new product',
      color: '#10b981', // Green
      icon: '✨'
    },
    {
      key: 'is_on_sale' as keyof ProductFormData,
      label: 'On Sale',
      description: 'Mark as a discounted product',
      color: '#ef4444', // Red
      icon: '🔥'
    },
    {
      key: 'is_limited_edition' as keyof ProductFormData,
      label: 'Limited Edition',
      description: 'Show as a limited edition item',
      color: '#8b5cf6', // Purple
      icon: '💎'
    },
    {
      key: 'is_sold_out' as keyof ProductFormData,
      label: 'Sold Out',
      description: 'Mark as out of stock',
      color: '#6b7280', // Gray
      icon: '❌'
    }
  ]

  const handleBadgeToggle = (badgeKey: keyof ProductFormData) => {
    const currentValue = formData[badgeKey] as boolean
    onInputChange(badgeKey, !currentValue)
  }

  const handleColorChange = (color: string) => {
    onInputChange('badge_color', color)
  }

  const handlePriorityChange = (priority: number) => {
    onInputChange('badge_priority', priority)
  }

  const handleCustomBadgeChange = (text: string) => {
    onInputChange('custom_badge_text', text)
  }

  const handleDateChange = (field: 'badge_display_from' | 'badge_display_until', value: string) => {
    onInputChange(field, value || null)
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Product Badges</h3>
          <p className="text-sm text-gray-500">Control how this product appears with badges and labels</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
        </button>
      </div>

      {/* Badge Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {badgeTypes.map((badge) => (
          <div
            key={badge.key}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              formData[badge.key] 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleBadgeToggle(badge.key)}
          >
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData[badge.key] as boolean}
                onChange={() => handleBadgeToggle(badge.key)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{badge.icon}</span>
                  <span className="font-medium text-gray-900">{badge.label}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{badge.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Badge */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom Badge Text
        </label>
        <input
          type="text"
          value={formData.custom_badge_text || ''}
          onChange={(e) => handleCustomBadgeChange(e.target.value)}
          placeholder="e.g., Flash Sale, Limited Time, Staff Pick"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-sm text-gray-500 mt-1">
          Add custom text for special promotions or unique labels
        </p>
      </div>

      {/* Badge Preview */}
      {(formData.is_featured || formData.is_bestseller || formData.is_new_arrival || 
        formData.is_on_sale || formData.is_limited_edition || formData.is_sold_out || 
        formData.custom_badge_text) && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Badge Preview
          </label>
          <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
            {badgeTypes.map((badge) => {
              if (!formData[badge.key]) return null
              return (
                <span
                  key={badge.key}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: formData.badge_color || badge.color }}
                >
                  {badge.icon} {badge.label}
                </span>
              )
            })}
            {formData.custom_badge_text && (
              <span
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: formData.badge_color || '#ef4444' }}
              >
                {formData.custom_badge_text}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="space-y-4 border-t pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Badge Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Badge Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.badge_color || '#ef4444'}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.badge_color || '#ef4444'}
                  onChange={(e) => handleColorChange(e.target.value)}
                  placeholder="#ef4444"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Badge Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Priority
              </label>
              <select
                value={formData.badge_priority || 0}
                onChange={(e) => handlePriorityChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={0}>Default</option>
                <option value={1}>High Priority</option>
                <option value={2}>Medium Priority</option>
                <option value={3}>Low Priority</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Higher priority badges appear first when multiple badges exist
              </p>
            </div>
          </div>

          {/* Badge Scheduling */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display From
              </label>
              <input
                type="datetime-local"
                value={formData.badge_display_from ? new Date(formData.badge_display_from).toISOString().slice(0, 16) : ''}
                onChange={(e) => handleDateChange('badge_display_from', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                When to start showing badges (optional)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Until
              </label>
              <input
                type="datetime-local"
                value={formData.badge_display_until ? new Date(formData.badge_display_until).toISOString().slice(0, 16) : ''}
                onChange={(e) => handleDateChange('badge_display_until', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                When to stop showing badges (optional)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Badge Tips:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use &quot;Featured&quot; for your most important products</li>
          <li>• &quot;Bestseller&quot; works great for top-selling items</li>
          <li>• &quot;New Arrival&quot; helps highlight recently added products</li>
          <li>• &quot;On Sale&quot; automatically shows when you have a compare price</li>
          <li>• Custom badges are perfect for special promotions</li>
        </ul>
      </div>
    </div>
  )
}

