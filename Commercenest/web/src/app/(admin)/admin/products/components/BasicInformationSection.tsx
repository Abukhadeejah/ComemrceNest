'use client'


import { ProductFormData } from '@/types/product'

interface BasicInformationSectionProps {
  formData: ProductFormData
  errors: Record<string, string>
  onInputChange: (field: keyof ProductFormData, value: string | number | boolean | null | unknown[]) => void
}

export function BasicInformationSection({ formData, errors, onInputChange }: BasicInformationSectionProps) {

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Name *
          </label>
          <input
            type="text"
            value={String(formData.name || '')}
            onChange={(e) => onInputChange('name', e.target.value)}
            placeholder="Enter product name"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Slug
          </label>
          <input
            type="text"
            value={String(formData.slug || '')}
            onChange={(e) => onInputChange('slug', e.target.value)}
            placeholder="product-slug"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.slug && (
            <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
          )}
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            rows={4}
            value={String(formData.description || '')}
            onChange={(e) => onInputChange('description', e.target.value)}
            placeholder="Enter product description"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>
      </div>
    </div>
  )
}
