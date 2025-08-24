'use client'


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
    </div>
  )
}
