'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  createProduct, 
  updateProduct,
  uploadProductImage
} from './actions'
import { BasicInformationSection } from './components/BasicInformationSection'
import { PricingSection } from './components/PricingSection'
import { InventorySection } from './components/InventorySection'
import { ShippingSection } from './components/ShippingSection'
import { OrganizationSection } from './components/OrganizationSection'

import { MediaSection } from './components/MediaSection'
import { SeoSection } from './components/SeoSection'
import { ProductPreview } from './components/ProductPreview'
import { VariantsSection } from './components/VariantsSection'
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

  // State for images (can be File objects for new uploads or URL strings for existing images)
  const [imageFiles, setImageFiles] = useState<(File | string)[]>(initialData?.images || [])

  // State for variants
  const [variantOptions, setVariantOptions] = useState(initialData?.variantOptions || [])
  const [variantCombinations, setVariantCombinations] = useState(initialData?.variantCombinations || [])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPreview, setShowPreview] = useState(false)

  // Use initialData if provided
  const data = initialData

  // Populate form data when initialData is provided (edit mode)
  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData(prev => ({
        ...prev,
        ...initialData
      }))
    }
  }, [initialData, mode])

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleInputChange = (field: keyof ProductFormData, value: string | number | boolean | null | unknown[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Auto-generate slug when name changes
    if (field === 'name' && typeof value === 'string' && value.trim()) {
      const generatedSlug = generateSlug(value)
      setFormData(prev => ({
        ...prev,
        slug: generatedSlug
      }))
    }
    
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
        // Only append arrays if they have content
        if (value.length > 0) {
          form.append(key, JSON.stringify(value))
        }
      } else if (value !== null && value !== undefined) {
        // Include all values, including empty strings
        form.append(key, String(value))
      }
    })

    // Add variant data
    form.append('variantOptions', JSON.stringify(variantOptions))
    form.append('variantCombinations', JSON.stringify(variantCombinations))

    startTransition(async () => {
      try {
        let createdProductId: string | undefined
        
        if (mode === 'edit' && data?.id) {
          await updateProduct(data.id as string, form)
          
          // Handle new image uploads for edit mode
          const fileImages = imageFiles.filter(img => img instanceof File) as File[]
          if (fileImages.length > 0) {
            try {
              console.log(`Uploading ${fileImages.length} new images for product ${data.id}`)
              for (let i = 0; i < fileImages.length; i++) {
                const file = fileImages[i]
                await uploadProductImage(file, data.id)
                console.log(`Uploaded image ${i + 1}/${fileImages.length}`)
              }
            } catch (uploadError) {
              console.error('Error uploading images:', uploadError)
              // Don't fail the product update if image upload fails
            }
          }
        } else {
          const result = await createProduct(form)
          createdProductId = result.id
          
          // After product creation, upload images if any
          if (imageFiles.length > 0 && createdProductId) {
            try {
              const fileImages = imageFiles.filter(img => img instanceof File) as File[]
              console.log(`Uploading ${fileImages.length} images for product ${createdProductId}`)
              for (let i = 0; i < fileImages.length; i++) {
                const file = fileImages[i]
                await uploadProductImage(file, createdProductId)
                console.log(`Uploaded image ${i + 1}/${fileImages.length}`)
              }
            } catch (uploadError) {
              console.error('Error uploading images:', uploadError)
              // Don't fail the product creation if image upload fails
            }
          }
        }
        
        router.push('/admin/products')
        router.refresh()
      } catch (error) {
        console.error('Failed to save product:', error)
        
        // Handle specific error types
        const errorMessage = error instanceof Error ? error.message : 'An error occurred'
        
        if (errorMessage.includes('duplicate key value violates unique constraint "products_tenant_id_slug_key"')) {
          setErrors(prev => ({
            ...prev,
            slug: 'A product with this slug already exists. Please choose a different slug.'
          }))
        } else if (errorMessage.includes('slug')) {
          setErrors(prev => ({
            ...prev,
            slug: 'Invalid slug format. Use only lowercase letters, numbers, and hyphens.'
          }))
        } else {
          // Set a general error
          setErrors(prev => ({
            ...prev,
            general: errorMessage
          }))
        }
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
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-800">{errors.general}</div>
          </div>
        )}
        
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

        <VariantsSection
          hasVariants={formData.has_variants || false}
          onHasVariantsChange={(hasVariants) => handleInputChange('has_variants', hasVariants)}
          variantOptions={variantOptions}
          onVariantOptionsChange={setVariantOptions}
          variantCombinations={variantCombinations}
          onVariantCombinationsChange={setVariantCombinations}
        />
        
        <MediaSection 
          images={imageFiles}
          onImagesChange={(images: (File | string)[]) => {
            setImageFiles(images)
            // Only include existing image URLs (strings) in formData
            // File objects will be handled separately during upload
            const imageUrls = images
              .filter(item => typeof item === 'string')
              .map(item => item as string)
            setFormData(prev => ({
              ...prev,
              images: imageUrls
            }))
          }}
          productId={data?.id as string}
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
          images={imageFiles}
          onClose={() => setShowPreview(false)} 
        />
      )}
    </div>
  )
}
