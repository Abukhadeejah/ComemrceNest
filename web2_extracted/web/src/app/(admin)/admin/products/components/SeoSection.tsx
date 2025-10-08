'use client'


import { ProductFormData } from '@/types/product'

interface SeoSectionProps {
  formData: ProductFormData
  errors: Record<string, string>
  onInputChange: (field: keyof ProductFormData, value: string | number | boolean | null | unknown[]) => void
}

export function SeoSection({ formData, onInputChange }: SeoSectionProps) {
  const generateMetaTitle = () => {
    if (formData.name) {
      onInputChange('meta_title', `${formData.name} - Best Quality | Fast Delivery`)
    }
  }

  const generateMetaDescription = () => {
    if (formData.description) {
      const truncated = formData.description.substring(0, 150)
      onInputChange('meta_description', `${truncated}... Shop now for the best deals and fast delivery.`)
    }
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">SEO</h3>
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Meta Title
            </label>
            <span className="text-xs text-gray-500">
              {String(formData.meta_title || '').length}/60
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={String(formData.meta_title || '')}
              onChange={(e) => onInputChange('meta_title', e.target.value)}
              maxLength={60}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Product meta title for SEO"
            />
            <button
              type="button"
              onClick={generateMetaTitle}
              className="px-4 py-2 text-sm text-indigo-600 border border-indigo-300 rounded-md hover:bg-indigo-50"
            >
              Generate
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Title that appears in search results (max 60 characters)
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Meta Description
            </label>
            <span className="text-xs text-gray-500">
              {String(formData.meta_description || '').length}/160
            </span>
          </div>
          <div className="flex gap-2">
            <textarea
              value={String(formData.meta_description || '')}
              onChange={(e) => onInputChange('meta_description', e.target.value)}
              maxLength={160}
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Product meta description for SEO"
            />
            <button
              type="button"
              onClick={generateMetaDescription}
              className="px-4 py-2 text-sm text-indigo-600 border border-indigo-300 rounded-md hover:bg-indigo-50"
            >
              Generate
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Description that appears in search results (max 160 characters)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SEO URL Handle
          </label>
          <input
            type="text"
            value={String(formData.seo_url || '')}
            onChange={(e) => onInputChange('seo_url', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Custom SEO-friendly URL"
          />
          <p className="mt-1 text-sm text-gray-500">
            Custom URL for this product (optional)
          </p>
        </div>
      </div>
    </div>
  )
}
