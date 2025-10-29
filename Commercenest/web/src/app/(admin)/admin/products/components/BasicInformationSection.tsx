'use client'

import { useState } from 'react'
import { ProductFormData } from '@/types/product'

interface BasicInformationSectionProps {
  formData: ProductFormData
  errors: Record<string, string>
  onInputChange: (field: keyof ProductFormData, value: string | number | boolean | null | unknown[]) => void
}

export function BasicInformationSection({ formData, errors, onInputChange }: BasicInformationSectionProps) {
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false)

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  // Generate unique slug by appending timestamp
  const generateUniqueSlug = (baseSlug: string) => {
    const timestamp = Date.now().toString().slice(-6) // Last 6 digits of timestamp
    return `${baseSlug}-${timestamp}`
  }

  const handleGenerateSlug = async () => {
    if (!formData.name?.trim()) {
      alert('Please enter a product name first')
      return
    }

    setIsGeneratingSlug(true)
    
    try {
      const baseSlug = generateSlug(formData.name)
      const uniqueSlug = generateUniqueSlug(baseSlug)
      onInputChange('slug', uniqueSlug)
    } catch (error) {
      console.error('Error generating slug:', error)
    } finally {
      setIsGeneratingSlug(false)
    }
  }

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
          {/* FIXED: Button now stacks below input on mobile */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={String(formData.slug || '')}
              onChange={(e) => onInputChange('slug', e.target.value)}
              placeholder="product-slug"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <button
              type="button"
              onClick={handleGenerateSlug}
              disabled={isGeneratingSlug || !formData.name?.trim()}
              className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap w-full sm:w-auto"
            >
              {isGeneratingSlug ? 'Generating...' : 'Generate Slug'}
            </button>
          </div>
          {errors.slug && (
            <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            The URL-friendly version of the product name. Click &quot;Generate Slug&quot; to create a unique slug.
          </p>
        </div>

        {/* FIXED: Description field now responsive */}
        <div className="col-span-1 md:col-span-2">
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