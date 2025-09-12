'use client'

import { useState, useRef } from 'react'
import { HeroSlide } from '@/types/hero'

interface HeroSlideFormProps {
  slide: HeroSlide
  onSubmit: (data: HeroSlide) => void
  onCancel: () => void
  isPending: boolean
}

export function HeroSlideForm({ slide, onSubmit, onCancel, isPending }: HeroSlideFormProps) {
  const [formData, setFormData] = useState({
    title: slide.title || '',
    subtitle: slide.subtitle || '',
    description: slide.description || '',
    cta_text: slide.cta_text || '',
    cta_link: slide.cta_link || '',
    badge: slide.badge || '',
    sale_text: slide.sale_text || '',
    urgency_text: slide.urgency_text || '',
    features: Array.isArray(slide.features) ? slide.features.join(', ') : '',
    image_url: slide.image_url || '',
    countdown: slide.countdown || false,
    countdown_end: slide.countdown_end || '',
    bg_overlay_class: slide.bg_overlay_class || '',
    is_active: slide.is_active !== false
  })

  const [imageUploading, setImageUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageUploading(true)
    try {
      // TODO: Implement image upload functionality
      console.log('Image upload not implemented yet', file)
      alert('Image upload functionality not implemented yet. Please enter image URL manually.')
    } catch (error) {
      console.error('Failed to upload image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setImageUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const data = {
      ...formData,
      features: formData.features ? formData.features.split(',').map(f => f.trim()).filter(f => f) : []
    }
    
    onSubmit(data)
  }

  const badgeOptions = [
    'TRENDING', 'NEW', 'SALE', 'HOT', 'LIMITED', 'EXCLUSIVE', 'PREMIUM', 'BESTSELLER'
  ]

  const bgOverlayOptions = [
    'bg-black/20',
    'bg-black/30',
    'bg-black/40',
    'bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900',
    'bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900',
    'bg-gradient-to-r from-amber-50 via-orange-100 to-red-50',
    'bg-gradient-to-r from-gray-900/40 via-purple-900/30 to-pink-900/40'
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Basic Information</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subtitle
            </label>
            <input
              type="text"
              name="subtitle"
              value={formData.subtitle}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Badge
            </label>
            <select
              name="badge"
              value={formData.badge}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No Badge</option>
              {badgeOptions.map(badge => (
                <option key={badge} value={badge}>{badge}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Call to Action */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Call to Action</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CTA Text
            </label>
            <input
              type="text"
              name="cta_text"
              value={formData.cta_text}
              onChange={handleInputChange}
              placeholder="e.g., Shop Now, Learn More"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CTA Link
            </label>
            <input
              type="text"
              name="cta_link"
              value={formData.cta_link}
              onChange={handleInputChange}
              placeholder="e.g., /products, /sale"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sale Text
            </label>
            <input
              type="text"
              name="sale_text"
              value={formData.sale_text}
              onChange={handleInputChange}
              placeholder="e.g., UP TO 50% OFF"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Urgency Text
            </label>
            <input
              type="text"
              name="urgency_text"
              value={formData.urgency_text}
              onChange={handleInputChange}
              placeholder="e.g., Limited Time Offer"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Features */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Features (comma-separated)
        </label>
        <input
          type="text"
          name="features"
          value={formData.features}
          onChange={handleInputChange}
          placeholder="e.g., Premium Quality, Latest Trends, Express Delivery"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Hero Image
        </label>
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={imageUploading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            {imageUploading ? 'Uploading...' : 'Upload Image'}
          </button>
          {formData.image_url && (
            <div className="mt-2">
              <img 
                src={formData.image_url} 
                alt="Hero preview" 
                className="w-32 h-20 object-cover rounded"
              />
            </div>
          )}
        </div>
      </div>

      {/* Countdown */}
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            name="countdown"
            checked={formData.countdown}
            onChange={handleInputChange}
            className="mr-2"
          />
          <label className="text-sm font-medium text-gray-700">
            Enable Countdown Timer
          </label>
        </div>
        
        {formData.countdown && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Countdown End Date
            </label>
            <input
              type="datetime-local"
              name="countdown_end"
              value={formData.countdown_end}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Background Overlay */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Background Overlay Class
        </label>
        <select
          name="bg_overlay_class"
          value={formData.bg_overlay_class}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {bgOverlayOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      {/* Active Status */}
      <div className="flex items-center">
        <input
          type="checkbox"
          name="is_active"
          checked={formData.is_active}
          onChange={handleInputChange}
          className="mr-2"
        />
        <label className="text-sm font-medium text-gray-700">
          Active (visible on storefront)
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          disabled={isPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
          disabled={isPending}
        >
          {isPending ? 'Saving...' : (slide.id ? 'Update Slide' : 'Create Slide')}
        </button>
      </div>
    </form>
  )
}




