'use client'

import { useRef, useId } from 'react'
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface MediaSectionProps {
  images: (File | string)[]
  onImagesChange: (images: (File | string)[]) => void
  productId?: string
}

export function MediaSection({ images, onImagesChange }: MediaSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newFiles = Array.from(event.target.files)
      onImagesChange([...images, ...newFiles])
      event.target.value = ''
    }
  }

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index))
  }

  // Clicking the label triggers the input via htmlFor; no JS click needed

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Media</h3>
      <div className="space-y-4">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Images
          </label>
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 hover:bg-gray-50"
            role="group"
          >
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor={inputId} className="text-indigo-600 hover:text-indigo-500 font-medium cursor-pointer">
                Click to upload
              </label>
              <p className="text-gray-500 mt-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              PNG, JPG, WebP, GIF up to 5MB each
            </p>
            
            <input
              ref={fileInputRef}
              id={inputId}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Image Gallery */}
        {images.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Image Gallery</h4>
              <span className="text-xs text-gray-500">
                {images.length} images
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {images.map((image, index) => {
                const imageSrc = typeof image === 'string' ? image : URL.createObjectURL(image)
                const imageName = typeof image === 'string' 
                  ? image.split('/').pop()?.split('?')[0] || 'Image' 
                  : image.name
                
                return (
                  <div key={index} className="relative group">
                    <img
                      src={imageSrc}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    
                    {index === 0 && (
                      <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        Hero
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          title="Remove image"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="absolute bottom-1 left-1 right-1">
                      <div className="bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded truncate">
                        {imageName}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}