"use client"

import { ProductFormData } from '@/types/product'
import { useState } from 'react'
import { FieldErrors, UseFormRegister } from 'react-hook-form'

interface SeoSectionProps {
  formData: ProductFormData
  errors?: FieldErrors<ProductFormData>
  onInputChange?: (field: keyof ProductFormData, value: string | number | boolean | null | unknown[]) => void
  register?: UseFormRegister<ProductFormData>
}

export function SeoSection({ formData, onInputChange, errors }: SeoSectionProps) {
  const [charCounts, setCharCounts] = useState({
    title: formData.meta_title?.length || 0,
    description: formData.meta_description?.length || 0
  })

  const generateMetaTitle = () => {
    if (!formData.name) {
      alert('Please enter a product name first')
      return
    }
    
    // Create a more natural meta title
    const title = formData.name.length <= 50 
      ? `${formData.name} | Your Store`
      : formData.name
    
    onInputChange?.('meta_title', title.substring(0, 60))
    setCharCounts(prev => ({ ...prev, title: title.substring(0, 60).length }))
  }

  const generateMetaDescription = () => {
    if (!formData.description) {
      alert('Please add a product description first')
      return
    }
    
    // Extract first 155 characters and clean it up
    const cleaned = formData.description
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    const description = cleaned.length <= 155 
      ? cleaned 
      : cleaned.substring(0, 152) + '...'
    
    onInputChange?.('meta_description', description)
    setCharCounts(prev => ({ ...prev, description: description.length }))
  }

  const handleTitleChange = (value: string) => {
    onInputChange?.('meta_title', value)
    setCharCounts(prev => ({ ...prev, title: value.length }))
  }

  const handleDescriptionChange = (value: string) => {
    onInputChange?.('meta_description', value)
    setCharCounts(prev => ({ ...prev, description: value.length }))
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">SEO</h3>
      
      <div className="space-y-6">
        {/* Meta Title */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Meta Title
            </label>
            <span className={`text-xs ${charCounts.title > 60 ? 'text-red-600' : 'text-gray-500'}`}>
              {charCounts.title}/60
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.meta_title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              maxLength={60}
              className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
              placeholder="Product meta title for SEO"
            />
            <button
              type="button"
              onClick={generateMetaTitle}
              className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 whitespace-nowrap"
            >
              Generate
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Appears in search engine results. Keep it under 60 characters.
          </p>
        </div>

        {/* Meta Description */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Meta Description
            </label>
            <span className={`text-xs ${charCounts.description > 160 ? 'text-red-600' : 'text-gray-500'}`}>
              {charCounts.description}/160
            </span>
          </div>
          <div className="space-y-2">
            <textarea
              rows={3}
              value={formData.meta_description || ''}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              maxLength={160}
              className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
              placeholder="Brief description that appears in search results"
            />
            <button
              type="button"
              onClick={generateMetaDescription}
              className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Generate from Description
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Shown below the title in search results. Optimal length: 150-160 characters.
          </p>
        </div>

        {/* URL Preview */}
        {formData.slug && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Search Result Preview</h4>
            <div className="space-y-1">
              <div className="text-sm text-blue-600 truncate">
                yourstore.com/products/{formData.slug}
              </div>
              <div className="text-base text-blue-800 font-medium">
                {formData.meta_title || formData.name || 'Product Title'}
              </div>
              <div className="text-sm text-gray-600">
                {formData.meta_description || formData.description || 'Product description will appear here...'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
