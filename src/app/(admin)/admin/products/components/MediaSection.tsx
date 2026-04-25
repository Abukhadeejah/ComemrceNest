'use client'

import { useRef, useId, useEffect, useState } from 'react'
import Image from 'next/image'
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { IMAGE_UPLOAD_LABEL, validateImageFile } from '@/lib/image-upload'

interface MediaSectionProps {
  images: (File | string)[]
  onImagesChange: (images: (File | string)[]) => void
  productId?: string
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes
const MAX_IMAGE_COUNT = 10

export function MediaSection({ images, onImagesChange }: MediaSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const [objectUrls, setObjectUrls] = useState<string[]>([])
  const [uploadError, setUploadError] = useState<string>('')

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      objectUrls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [objectUrls])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('')
    
    if (event.target.files && event.target.files.length > 0) {
      const newFiles = Array.from(event.target.files)

      if (images.length >= MAX_IMAGE_COUNT) {
        setUploadError(`Maximum ${MAX_IMAGE_COUNT} images allowed.`)
        event.target.value = ''
        return
      }

      const availableSlots = MAX_IMAGE_COUNT - images.length
      const filesToValidate = newFiles.slice(0, availableSlots)
      
      // Validate each file
      const validFiles: File[] = []
      const errors: string[] = []

      filesToValidate.forEach(file => {
        const validation = validateImageFile(file, MAX_FILE_SIZE)
        if (!validation.valid) {
          errors.push(`${file.name}: ${validation.error}`)
          return
        }
        
        validFiles.push(file)
      })

      if (newFiles.length > filesToValidate.length) {
        errors.push(`Only ${availableSlots} more image(s) can be added (max ${MAX_IMAGE_COUNT}).`)
      }

      if (errors.length > 0) {
        setUploadError(errors.join(' '))
      }

      if (validFiles.length > 0) {
        // Create object URLs for preview
        const newUrls = validFiles.map(file => URL.createObjectURL(file))
        setObjectUrls(prev => [...prev, ...newUrls])
        
        onImagesChange([...images, ...validFiles])
      }
      
      event.target.value = ''
    }
  }

  const removeImage = (index: number) => {
    // Revoke object URL if it's a File
    if (images[index] instanceof File) {
      const urlToRevoke = objectUrls[index]
      if (urlToRevoke) {
        URL.revokeObjectURL(urlToRevoke)
        setObjectUrls(prev => prev.filter((_, i) => i !== index))
      }
    }
    
    onImagesChange(images.filter((_, i) => i !== index))
  }

  const getImageSrc = (image: File | string, index: number): string => {
    if (typeof image === 'string') {
      return image
    }
    return objectUrls[index] || ''
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Media</h3>
      
      {/* Upload Error */}
      {uploadError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">⚠️ {uploadError}</p>
        </div>
      )}

      {/* Image Upload */}
      <div className="mb-6">
        <label
          htmlFor={inputId}
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <PhotoIcon className="w-10 h-10 mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">{IMAGE_UPLOAD_LABEL} up to 5MB each, max 10 images</p>
          </div>
          <input
            id={inputId}
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />
        </label>
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Image Gallery</h4>
            <span className="text-sm text-gray-500">{images.length} image(s)</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((image, index) => {
              const imageSrc = getImageSrc(image, index)
              const imageName = typeof image === 'string'
                ? image.split('/').pop()?.split('?')[0] || 'Image'
                : image.name

              return (
                <div key={index} className="relative group">
                  {index === 0 && (
                    <div className="absolute top-2 left-2 z-10 bg-indigo-600 text-white text-xs font-medium px-2 py-1 rounded">
                      Hero
                    </div>
                  )}
                  <div className="aspect-square relative rounded-lg overflow-hidden border border-gray-200">
                    <Image
                      src={imageSrc}
                      alt={imageName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove image"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                  <p className="mt-1 text-xs text-gray-500 truncate">{imageName}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
        