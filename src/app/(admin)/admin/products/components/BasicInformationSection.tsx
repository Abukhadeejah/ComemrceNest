'use client'

import { useState } from 'react'
import { nanoid } from 'nanoid'
import { ProductFormData } from '@/types/product'
import { FieldErrors } from 'react-hook-form'

interface BasicInformationSectionProps {
  formData: ProductFormData
  errors?: FieldErrors<ProductFormData>
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

  // Generate unique slug with numeric ID
  const handleGenerateSlug = () => {
    if (!formData.name?.trim()) {
      alert('Please enter a product name first')
      return
    }

    setIsGeneratingSlug(true)
    
    try {
      const baseSlug = generateSlug(formData.name)
      // Generate a random 8-digit number
      const uniqueId = Math.floor(10000000 + Math.random() * 90000000)
      const uniqueSlug = `${baseSlug}-${uniqueId}`
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
            Product Name * <span className="text-gray-400 text-xs">({(formData.name || '').length}/255)</span>
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => onInputChange('name', e.target.value)}
            placeholder="Enter product name"
            maxLength={255}
            className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
          />
          {errors?.name && (
            <p className="mt-1 text-sm text-red-600">{errors?.name?.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Slug * <span className="text-gray-400 text-xs">({(formData.slug || '').length}/255)</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={formData.slug || ''}
              onChange={(e) => onInputChange('slug', e.target.value)}
              placeholder="product-slug"
              maxLength={255}
              className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
            />
            <button
              type="button"
              onClick={handleGenerateSlug}
              disabled={isGeneratingSlug || !formData.name?.trim()}
              className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap w-full sm:w-auto"
            >
              {isGeneratingSlug ? 'Generating...' : 'Generate'}
            </button>
          </div>
          {errors?.slug && (
            <p className="mt-1 text-sm text-red-600">{errors?.slug?.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            URL-friendly version of the product name. Must be unique.
          </p>
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-gray-400 text-xs">({(formData.description || '').length}/5000)</span>
          </label>
          <textarea
            rows={4}
            value={formData.description || ''}
            onChange={(e) => onInputChange('description', e.target.value)}
            placeholder="Enter product description"
            maxLength={5000}
            className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
          />
          {errors?.description && (
            <p className="mt-1 text-sm text-red-600">{errors?.description?.message}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Short Description <span className="text-gray-400 text-xs">({(formData.short_description || '').length}/500)</span>
          </label>
          <textarea
            rows={2}
            value={formData.short_description || ''}
            onChange={(e) => onInputChange('short_description', e.target.value)}
            placeholder="Brief product summary shown in listings (50-150 characters recommended)"
            maxLength={500}
            className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
          />
          {errors?.short_description && (
            <p className="mt-1 text-sm text-red-600">{errors?.short_description?.message}</p>
          )}
        </div>      </div>
    </div>
  )
}