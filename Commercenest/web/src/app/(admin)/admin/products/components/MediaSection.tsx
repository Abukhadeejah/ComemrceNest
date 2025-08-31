'use client'

import { useState, useCallback, useRef, useId } from 'react'
import { PhotoIcon, XMarkIcon, CloudArrowUpIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { uploadProductImage } from '../actions'

interface MediaSectionProps {
  images: (File | string)[]
  onImagesChange: (images: (File | string)[]) => void
  productId?: string
}

export function MediaSection({ images, onImagesChange, productId }: MediaSectionProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({})
  const [uploadErrors, setUploadErrors] = useState<Record<number, string>>({})
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dialogOpenRef = useRef(false)
  const inputId = useId()

  const handleImageUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const validFiles: File[] = []
    const errors: string[] = []

    // Basic validation
    for (const file of fileArray) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      const maxSize = 5 * 1024 * 1024 // 5MB
      
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.`)
      } else if (file.size > maxSize) {
        errors.push(`${file.name}: File too large. Maximum size is 5MB.`)
      } else {
        validFiles.push(file)
      }
    }

    // Show validation errors
    if (errors.length > 0) {
      alert(`Some files were skipped:\n${errors.join('\n')}`)
    }

    if (validFiles.length === 0) return

    // Add files to local state immediately for preview
    onImagesChange([...images, ...validFiles])

    // For new products (no productId), we'll store images locally
    // For existing products (with productId), upload to storage immediately
    if (productId) {
      setIsUploading(true)
      
      try {
        // Upload each file using the existing uploadProductImage function
        for (let i = 0; i < validFiles.length; i++) {
          const file = validFiles[i]
          const index = images.length + i
          
          // Simulate progress
          setUploadProgress(prev => ({ ...prev, [index]: 0 }))
          
          try {
            await uploadProductImage(file, productId)
            setUploadProgress(prev => ({ ...prev, [index]: 100 }))
          } catch (error) {
            setUploadErrors(prev => ({
              ...prev,
              [index]: error instanceof Error ? error.message : 'Upload failed'
            }))
          }
        }

        // Clear progress after upload
        setTimeout(() => {
          setUploadProgress({})
          setUploadErrors({})
        }, 3000)

      } catch (error) {
        console.error('Upload failed:', error)
        alert('Failed to upload images. Please try again.')
      } finally {
        setIsUploading(false)
      }
    } else {
      // For new products, show a message that images will be uploaded when product is saved
      console.log('Images will be uploaded when product is created')
    }
  }, [images, onImagesChange, productId])

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      handleImageUpload(event.target.files)
      // Clear the input value so selecting the same file again triggers onChange
      event.target.value = ''
    }
    // Mark dialog as closed after selection
    dialogOpenRef.current = false
  }

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index))
  }

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleImageUpload(files)
    }
  }, [handleImageUpload])

  const handleClick = () => {
    if (dialogOpenRef.current) return
    dialogOpenRef.current = true
    fileInputRef.current?.click()
  }
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      fileInputRef.current?.click()
    }
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
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
              isDragging 
                ? 'border-indigo-400 bg-indigo-50' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
          >
            {isUploading ? (
              <div className="space-y-4">
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-indigo-500 animate-bounce" />
                <div className="text-indigo-600 font-medium">Uploading images...</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: '60%' }}></div>
                </div>
              </div>
            ) : (
              <>
                <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor={inputId} className="text-indigo-600 hover:text-indigo-500 font-medium cursor-pointer" onClick={(e) => { e.stopPropagation(); handleClick(); }}>
                    Click to upload
                  </label>
                  <p className="text-gray-500 mt-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  PNG, JPG, WebP, GIF up to 5MB each
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Images will be automatically compressed for optimal performance
                </p>
              </>
            )}
            
            <input
              ref={fileInputRef}
              id={inputId}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInputChange}
              className="sr-only"
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
                const progress = uploadProgress[index]
                const error = uploadErrors[index]
                
                // Handle both File objects and URL strings
                const imageSrc = typeof image === 'string' ? image : URL.createObjectURL(image)
                const imageName = typeof image === 'string' 
                  ? image.split('/').pop()?.split('?')[0] || 'Image' 
                  : image.name
                
                return (
                  <div key={index} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageSrc}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200 group-hover:border-gray-300 transition-colors"
                    />
                    
                    {/* Hero Badge */}
                    {index === 0 && (
                      <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        Hero
                      </div>
                    )}
                    
                    {/* Upload Progress */}
                    {progress !== undefined && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="text-xs font-medium mb-1">{progress}%</div>
                          <div className="w-12 h-1 bg-gray-300 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-400 transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Upload Error */}
                    {error && (
                      <div className="absolute inset-0 bg-red-500 bg-opacity-90 rounded-lg flex items-center justify-center">
                        <div className="text-center text-white p-2">
                          <ExclamationTriangleIcon className="w-4 h-4 mx-auto mb-1" />
                          <div className="text-xs">Upload Failed</div>
                        </div>
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
                    
                    {/* File Info */}
                    <div className="absolute bottom-1 left-1 right-1">
                      <div className="bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded truncate">
                        {imageName}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Upload Status */}
            {isUploading && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CloudArrowUpIcon className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-blue-700">Uploading images to cloud storage...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}







