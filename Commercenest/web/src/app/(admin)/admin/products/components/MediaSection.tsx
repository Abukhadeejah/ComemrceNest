'use client'

import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface MediaSectionProps {
  images: File[]
  onImagesChange: (images: File[]) => void
}

export function MediaSection({ images, onImagesChange }: MediaSectionProps) {
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
      const isValidSize = file.size <= 5 * 1024 * 1024 // 5MB limit
      return isValidType && isValidSize
    })
    
    if (validFiles.length !== files.length) {
      alert('Some files were skipped. Only JPEG, PNG, and WebP files under 5MB are allowed.')
    }
    
    onImagesChange([...images, ...validFiles])
  }

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index))
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Media</h3>
      <div className="space-y-4">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Images
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-2">
              <label className="cursor-pointer">
                <span className="text-indigo-600 hover:text-indigo-500 font-medium">
                  Click to upload
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              <p className="text-gray-500">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, WebP up to 5MB each
            </p>
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
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-gray-200 group-hover:border-gray-300 transition-colors"
                  />
                  
                  {/* Hero Badge */}
                  {index === 0 && (
                    <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      Hero
                    </div>
                  )}
                  
                  {/* Action Buttons */}
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}






