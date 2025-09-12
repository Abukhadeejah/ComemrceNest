'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { HeroSlide } from '@/types/hero'

interface HeroSlideFormProps {
  slide: HeroSlide
  onSubmit: (data: HeroSlide) => void
  onCancel: () => void
  isPending: boolean
  availableTags?: string[]
}

// Helper functions to parse existing CTA links
function getCtaDestinationType(ctaLink: string | undefined): string {
  if (!ctaLink) return 'all-products'
  if (ctaLink.includes('category=')) return 'category'
  if (ctaLink.includes('sale')) return 'sale'
  if (ctaLink.includes('new')) return 'new-arrivals'
  return 'custom'
}

function getCtaCategory(ctaLink: string | undefined): string {
  if (!ctaLink || !ctaLink.includes('category=')) return ''
  const match = ctaLink.match(/category=([^&]+)/)
  return match ? match[1] : ''
}

export function HeroSlideForm({ slide, onSubmit, onCancel, isPending, availableTags = [] }: HeroSlideFormProps) {
  const [formData, setFormData] = useState({
    title: slide.title || '',
    subtitle: slide.subtitle || '',
    description: slide.description || '',
    cta_text: slide.cta_text || '',
    cta_link: slide.cta_link || '',
    cta_destination_type: getCtaDestinationType(slide.cta_link) || 'all-products',
    cta_category: getCtaCategory(slide.cta_link) || '',
    cta_badge_filter: '',
    cta_tag_filter: '',
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

  // --- Robust preview handling to avoid broken images in Admin ---
  const normalizeImageUrl = (url: string): string => {
    if (!url) return ''
    try {
      const u = new URL(url)
      // Ensure https
      if (u.protocol !== 'https:') u.protocol = 'https:'
      // Add friendly params for external hosts (e.g., Unsplash)
      if (u.hostname.includes('images.unsplash.com')) {
        if (!u.searchParams.get('auto')) u.searchParams.set('auto', 'format')
        if (!u.searchParams.get('q')) u.searchParams.set('q', '80')
      }
      return u.toString()
    } catch {
      // Fallback to encodeURI if URL constructor fails
      return encodeURI(url)
    }
  }

  const stripQuery = (url: string): string => {
    try { const u = new URL(url); u.search = ''; return u.toString() } catch { return url.split('?')[0] }
  }

  const FALLBACK_DATA_URI =
    'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b7280" font-family="Arial, Helvetica, sans-serif" font-size="16">Preview not available</text></svg>')

  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [previewFallbackStep, setPreviewFallbackStep] = useState<number>(0)

  useEffect(() => {
    if (!formData.image_url) { setPreviewUrl(''); return }
    setPreviewFallbackStep(0)
    setPreviewUrl(normalizeImageUrl(formData.image_url))
  }, [formData.image_url])

  const handlePreviewError = () => {
    // Step 0 -> try without query, Step 1 -> original raw, Step 2 -> data URI
    if (previewFallbackStep === 0) {
      setPreviewFallbackStep(1)
      setPreviewUrl(stripQuery(formData.image_url))
    } else if (previewFallbackStep === 1) {
      setPreviewFallbackStep(2)
      setPreviewUrl(encodeURI(formData.image_url))
    } else {
      setPreviewUrl(FALLBACK_DATA_URI)
    }
  }

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
      // const imageUrl = await uploadHeroImage(file, slide.id)
      // setFormData(prev => ({ ...prev, image_url: imageUrl }))
      alert('Image upload functionality not yet implemented. Please use image URL instead.')
    } catch (error) {
      console.error('Failed to upload image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setImageUploading(false)
    }
  }

  // Generate the final CTA URL based on form selections
  const getFinalCtaUrl = () => {
    switch (formData.cta_destination_type) {
      case 'all-products':
        return '/products'
      case 'category':
        return formData.cta_category ? `/products?category=${formData.cta_category}` : '/products'
      case 'badge-filter':
        return formData.cta_badge_filter ? `/products?${formData.cta_badge_filter}` : '/products'
      case 'tag-filter':
        return formData.cta_tag_filter ? `/products?tag=${formData.cta_tag_filter}` : '/products'
      case 'sale':
        return '/products?sale=true'
      case 'new-arrivals':
        return '/products?new=true'
      case 'custom':
        return formData.cta_link || '/products'
      default:
        return '/products'
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Only send the fields that exist in the database
    const data = {
      title: formData.title,
      subtitle: formData.subtitle,
      description: formData.description,
      cta_text: formData.cta_text,
      cta_link: getFinalCtaUrl(), // Generate the final URL
      badge: formData.badge,
      sale_text: formData.sale_text,
      urgency_text: formData.urgency_text,
      features: formData.features ? formData.features.split(',').map(f => f.trim()).filter(f => f) : [],
      image_url: formData.image_url,
      countdown: formData.countdown,
      countdown_end: formData.countdown_end,
      bg_overlay_class: formData.bg_overlay_class,
      is_active: formData.is_active
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

  // Simple overlay controls (color + intensity)
  const overlayColors = [
    { label: 'Black', value: 'black' },
    { label: 'White', value: 'white' },
  ]
  const overlayIntensitySteps = [10,20,30,40,50,60,70,80,90]

  const [simpleOverlayColor, setSimpleOverlayColor] = useState<'black'|'white'>(
    formData.bg_overlay_class?.includes('white') ? 'white' : 'black'
  )
  const initialIntensity = (() => {
    const m = formData.bg_overlay_class?.match(/\/(\d{1,3})$/)
    const pct = m ? parseInt(m[1], 10) : 30
    return overlayIntensitySteps.includes(pct as typeof overlayIntensitySteps[number]) ? pct : 30
  })()
  const [simpleOverlayIntensity, setSimpleOverlayIntensity] = useState<number>(initialIntensity)

  const applySimpleOverlay = (color: 'black'|'white', intensity: number) => {
    const cls = `bg-${color}/${intensity}`
    setFormData(prev => ({ ...prev, bg_overlay_class: cls }))
  }

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
              CTA Destination
            </label>
            <select
              name="cta_destination_type"
              value={formData.cta_destination_type || 'all-products'}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            >
              <option value="all-products">All Products</option>
              <option value="category">Specific Category</option>
              <option value="badge-filter">Product Badges</option>
              <option value="tag-filter">Product Tags</option>
              <option value="custom">Custom URL</option>
            </select>
            
            {formData.cta_destination_type === 'category' && (
              <select
                name="cta_category"
                value={formData.cta_category || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              >
                <option value="">Select a category...</option>
                <option value="accessories">Accessories</option>
                <option value="bags-wallets">Bags & Wallets</option>
                <option value="beauty-personal-care">Beauty & Personal Care</option>
                <option value="bottom-wear">Bottom Wear</option>
                <option value="footwear">Footwear</option>
                <option value="formal-trousers">Formal Trousers</option>
                <option value="gifts">Gifts</option>
                <option value="home-living">Home & Living</option>
                <option value="jeans">Jeans</option>
                <option value="jewelry">Jewelry</option>
                <option value="kids-baby">Kids & Baby</option>
                <option value="men">Men</option>
                <option value="shirts">Shirts</option>
                <option value="sports-activewear">Sports & Activewear</option>
                <option value="t-shirts">T-Shirts</option>
                <option value="top-wear">Top Wear</option>
                <option value="watches">Watches</option>
                <option value="women">Women</option>
              </select>
            )}
            
            {formData.cta_destination_type === 'badge-filter' && (
              <select
                name="cta_badge_filter"
                value={formData.cta_badge_filter || ''}
                onChange={handleInputChange}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a badge filter...</option>
                <option value="is_featured=true">Featured Items</option>
                <option value="is_bestseller=true">Bestsellers</option>
                <option value="is_new_arrival=true">New Arrivals</option>
                <option value="is_on_sale=true">Sale Items</option>
                <option value="is_limited_edition=true">Limited Edition</option>
              </select>
            )}
            
            
            {formData.cta_destination_type === 'tag-filter' && (
              <div className="mt-2 space-y-3">
                <input
                  type="text"
                  name="cta_tag_filter"
                  value={formData.cta_tag_filter || ''}
                  onChange={handleInputChange}
                  placeholder="Enter tag name (e.g., rain, summer, waterproof)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {availableTags.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <p className="mb-2 font-medium">Available tags (click to use):</p>
                    <div className="flex flex-wrap gap-1">
                      {availableTags.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleInputChange({ target: { name: 'cta_tag_filter', value: tag } } as React.ChangeEvent<HTMLInputElement>)}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Tip:</strong> Make sure your products have this tag! 
                    <Link href="/senlysh/admin/tutorial" className="text-blue-600 hover:text-blue-800 underline ml-1">
                      Learn how to tag products
                    </Link>
                  </p>
                </div>
              </div>
            )}
            
            {formData.cta_destination_type === 'custom' && (
              <input
                type="text"
                name="cta_link"
                value={formData.cta_link}
                onChange={handleInputChange}
                placeholder="e.g., /products, /sale, /about"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
            
            {/* Preview the final URL */}
            <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
              <strong>Final URL:</strong> {getFinalCtaUrl()}
            </div>
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
          
          {/* Image URL Input */}
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Or enter image URL directly:
            </label>
            <input
              type="url"
              name="image_url"
              value={formData.image_url}
              onChange={handleInputChange}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {formData.image_url && (
            <div className="mt-2">
              <div className="w-64 h-36 rounded overflow-hidden border border-gray-200 bg-gray-100 relative">
                {formData.image_url && (
                  <img
                    src={previewUrl}
                    alt="Hero preview"
                    className="w-full h-full object-cover"
                    onError={handlePreviewError}
                    onLoad={() => console.log('Admin preview loaded:', previewUrl)}
                  />
                )}
                {!formData.image_url && (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                    No image
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">Preview may normalize external URLs for reliability. Final hero uses full-bleed background with object-cover.</p>
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
          Background Overlay (Simple)
        </label>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <select
            value={simpleOverlayColor}
            onChange={(e) => {
              const val = (e.target.value as 'black'|'white')
              setSimpleOverlayColor(val)
              applySimpleOverlay(val, simpleOverlayIntensity)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {overlayColors.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <select
            value={simpleOverlayIntensity}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10)
              setSimpleOverlayIntensity(val)
              applySimpleOverlay(simpleOverlayColor, val)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {overlayIntensitySteps.map(step => (
              <option key={step} value={step}>{step}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-gray-500 mb-2">Pick a color and strength (10–90). This auto-fills the advanced field below.</p>

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Background Overlay Class (Advanced)
        </label>
        <input
          type="text"
          name="bg_overlay_class"
          list="overlay-presets"
          value={formData.bg_overlay_class}
          onChange={handleInputChange}
          placeholder="e.g., bg-black/30 or a gradient class"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <datalist id="overlay-presets">
          {bgOverlayOptions.map(option => (
            <option key={option} value={option} />
          ))}
          <option value="bg-black/10" />
          <option value="bg-black/20" />
          <option value="bg-black/30" />
          <option value="bg-black/40" />
          <option value="bg-black/50" />
          <option value="bg-black/60" />
          <option value="bg-black/70" />
          <option value="bg-black/80" />
          <option value="bg-black/90" />
          <option value="bg-white/10" />
          <option value="bg-white/20" />
          <option value="bg-white/30" />
          <option value="bg-white/40" />
          <option value="bg-white/50" />
          <option value="bg-white/60" />
          <option value="bg-white/70" />
          <option value="bg-white/80" />
          <option value="bg-white/90" />
        </datalist>
        <p className="text-xs text-gray-500 mt-1">Advanced: override with any Tailwind or gradient class.</p>
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
