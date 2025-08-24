'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { 
  createProduct, 
  updateProduct
} from './actions'
import { BasicInformationSection } from './components/BasicInformationSection'
import { PricingSection } from './components/PricingSection'
import { InventorySection } from './components/InventorySection'
import { ShippingSection } from './components/ShippingSection'
import { OrganizationSection } from './components/OrganizationSection'

import { MediaSection } from './components/MediaSection'
import { SeoSection } from './components/SeoSection'
import { ProductPreview } from './components/ProductPreview'
import { ProductFormData } from '@/types/product'

interface ProductFormProps {
  mode: 'create' | 'edit'
  initialData?: Partial<ProductFormData>
  categories: Record<string, unknown>[]
}

export function ProductForm({ mode, initialData, categories }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    description: '',
    price_cents: '',
    compare_at_price_cents: '',
    cost_per_item_cents: '',
    currency: 'INR',
    stock: 0,
    sku: '',
    weight: '',
    dimensions: '',
    has_variants: false,
    track_inventory: true,
    low_stock_threshold: 5,
    meta_title: '',
    meta_description: '',
    allow_backorders: false,
    requires_shipping: true,
    taxable: true,
    hs_code: '',
    seo_url: '',
    material_composition: '',
    care_instructions: '',
    fit_type: '',
    model_height_cm: '',
    model_weight_kg: '',
    model_wearing_size: '',
    is_gift_card: false,
    gift_card_amount_cents: '',
    gift_card_expiry_days: '',
    category_id: '',
    status: 'draft',
    images: [],
    variantOptions: [],
    sizeGuides: [],
    sizeGuideId: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPreview, setShowPreview] = useState(false)

  // Use initialData if provided
  const data = initialData

  const handleInputChange = (field: keyof ProductFormData, value: string | number | boolean | null | unknown[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const form = new FormData(e.currentTarget)
    
    // Add all form data
    Object.entries(formData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        form.append(key, JSON.stringify(value))
      } else if (value !== null && value !== undefined) {
        form.append(key, String(value))
      }
    })

    startTransition(async () => {
      try {
        if (mode === 'edit' && data?.id) {
          await updateProduct(data.id as string, form)
        } else {
          await createProduct(form)
        }
        router.push('/admin/products')
        router.refresh()
      } catch (error) {
        console.error('Failed to save product:', error)
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {mode === 'edit' ? 'Edit Product' : 'Create Product'}
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Preview
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <BasicInformationSection 
          formData={formData} 
          errors={errors}
          onInputChange={handleInputChange}
        />
        
        <PricingSection 
          formData={formData} 
          errors={errors}
          onInputChange={handleInputChange}
        />
        
        <InventorySection 
          formData={formData} 
          errors={errors}
          onInputChange={handleInputChange}
        />
        
        <ShippingSection 
          formData={formData} 
          errors={errors}
          onInputChange={handleInputChange}
        />
        
        <OrganizationSection 
          formData={formData} 
          errors={errors}
          categories={categories}
          onInputChange={handleInputChange}
        />

        {/* Temporarily disabled due to TypeScript issues */}
        {/*
        <FashionDetailsSection 
          formData={formData} 
          errors={errors}
          onInputChange={handleInputChange}
        />

        <VariantsSection 
          formData={formData} 
          errors={errors}
          onInputChange={handleInputChange}
        />

        <SizeGuideSection 
          formData={formData} 
          errors={errors}
          onInputChange={handleInputChange}
        />
        */}
        
        <MediaSection 
          images={[]}
          onImagesChange={(images: File[]) => {
            // Convert File[] to string[] for formData
            const imageUrls = images.map(file => URL.createObjectURL(file))
            setFormData(prev => ({
              ...prev,
              images: imageUrls
            }))
          }}
        />
        
        <SeoSection 
          formData={formData} 
          errors={errors}
          onInputChange={handleInputChange}
        />

        <div className="flex justify-end gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => router.push('/admin/products')}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? 'Saving...' : (mode === 'edit' ? 'Update Product' : 'Create Product')}
          </button>
        </div>
      </form>

      {showPreview && (
        <ProductPreview 
          formData={formData}
          images={[]}
          onClose={() => setShowPreview(false)} 
        />
      )}
    </div>
  )
}
