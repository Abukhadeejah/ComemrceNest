'use client'

import { useState, useCallback } from 'react'
import { ProductFormData } from '@/types/product'
import { UseFormSetValue, FieldErrors } from 'react-hook-form'
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface SizeGuideSectionProps {
  formData?: ProductFormData
  errors?: FieldErrors<ProductFormData>
  setValue?: UseFormSetValue<ProductFormData>
}

export function SizeGuideSection({
  formData,
  errors,
  setValue
}: SizeGuideSectionProps) {
  const [sizeGuideImage, setSizeGuideImage] = useState<string | null>(
    formData?.sizeGuides?.[0] as string | null || null
  )
  const [isUploading, setIsUploading] = useState(false)

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      const imageUrl = data.url

      setSizeGuideImage(imageUrl)
      if (setValue) {
        setValue('sizeGuideId', imageUrl)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }, [setValue])

  const handleRemoveImage = useCallback(() => {
    setSizeGuideImage(null)
    if (setValue) {
      setValue('sizeGuideId', '')
    }
  }, [setValue])

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Size Guide</h3>
      <p className="text-sm text-gray-600 mb-6">
        Upload a size guide image (chart, diagram, or measurement table) to help customers choose the right size.
      </p>

      {sizeGuideImage ? (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={sizeGuideImage}
              alt="Size Guide Preview"
              className="w-full max-w-md h-auto rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              disabled={isUploading}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUploading}
              className="hidden"
            />
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.parentElement?.querySelector('input')?.click()
              }}
              disabled={isUploading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Change Image'}
            </button>
          </label>
        </div>
      ) : (
        <label className="block">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isUploading}
            className="hidden"
          />
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition"
            onClick={(e) => {
              e.currentTarget.querySelector('input')?.click()
            }}
          >
            <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900">
              {isUploading ? 'Uploading...' : 'Drop image here or click to upload'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, GIF up to 5MB
            </p>
          </div>
        </label>
      )}
    </div>
  )
}