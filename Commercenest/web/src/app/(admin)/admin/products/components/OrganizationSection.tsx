'use client'

import Link from 'next/link'
import { ProductFormData } from '@/types/product'

interface OrganizationSectionProps {
  formData: ProductFormData
  errors: Record<string, string>
  onInputChange: (field: keyof ProductFormData, value: string | number | boolean | null | unknown[]) => void
  categories: Record<string, unknown>[]
}

export function OrganizationSection({ formData, errors, categories, onInputChange }: OrganizationSectionProps) {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Organization</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={String(formData.category_id || '')}
            onChange={(e) => onInputChange('category_id', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Select a category</option>
            {categories.map((category: Record<string, unknown>) => (
              <option key={String(category.id)} value={String(category.id)}>
                {String(category.name)}
              </option>
            ))}
          </select>
          {errors.category_id && (
            <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={String(formData.status || 'draft')}
            onChange={(e) => onInputChange('status', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          {errors.status && (
            <p className="mt-1 text-sm text-red-600">{errors.status}</p>
          )}
        </div>
      </div>

      {/* Tags Section */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Enter tags separated by commas (e.g., rain, waterproof, summer)"
            value={Array.isArray(formData.tags) ? formData.tags.join(', ') : ''}
            onChange={(e) => {
              const tags = e.target.value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0)
              onInputChange('tags', tags)
            }}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">
                    Tags help customers find products through filters and collections. Use descriptive words like &quot;rain&quot;, &quot;summer&quot;, &quot;waterproof&quot;, etc.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
                    <p className="text-xs text-blue-800">
                      <strong>💡 Pro Tip:</strong> Tags can be used in Hero Carousel CTAs to create dynamic collections! 
                      <Link href="/senlysh/admin/tutorial" className="text-blue-600 hover:text-blue-800 underline ml-1">
                        Learn more
                      </Link>
                    </p>
                  </div>
                </div>
          {Array.isArray(formData.tags) && formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => {
                      const newTags = formData.tags?.filter((_, i) => i !== index) || []
                      onInputChange('tags', newTags)
                    }}
                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        {errors.tags && (
          <p className="mt-1 text-sm text-red-600">{errors.tags}</p>
        )}
      </div>
    </div>
  )
}
