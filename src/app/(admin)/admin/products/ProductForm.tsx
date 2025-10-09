'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ADMIN_URLS } from '@/utils/admin-urls'
import { useAdminTenantKey } from '@/components/admin/AdminBrandingWrapper'
// Removed draft persistence - interferes with database operations
import { 
  createProduct, 
  updateProduct,
  updateProductVariants,
  uploadProductImage
} from './actions'
import { Category } from '@/utils/categoryUtils'
import { BasicInformationSection } from './components/BasicInformationSection'
import { PricingSection } from './components/PricingSection'
import { InventorySection } from './components/InventorySection'
import { ShippingSection } from './components/ShippingSection'
import { TaxSection } from './components/TaxSection'
import { OrganizationSection } from './components/OrganizationSection'

import { MediaSection } from './components/MediaSection'
import { SeoSection } from './components/SeoSection'
import { ProductPreview } from './components/ProductPreview'
import { VariantsSection } from './components/VariantsSection'
import { BadgeSection } from './components/BadgeSection'
import SizeGuideSection from '@/components/admin/products/SizeGuideSection'
import { ProductFormData } from '@/types/product'

interface ProductFormProps {
  mode: 'create' | 'edit'
  initialData?: Partial<ProductFormData> & { variantOptions?: unknown[]; variantCombinations?: unknown[] }
  categories: Category[]
}

export function ProductForm({ mode, initialData, categories }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    price_cents: '',
    compare_at_price_cents: '',
    cost_per_item_cents: '',
    currency: 'INR',
    stock: 0,
    sku: '',
    barcode: '',
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
    category_ids: [],
    status: 'draft',
    tax_class_id: '',
    images: [],
    variantOptions: [],
    sizeGuides: [],
    sizeGuideId: '',
    // Fashion-specific fields
    brand: '',
    color: '',
    material: '',
    // Badge System
    is_featured: false,
    is_bestseller: false,
    is_new_arrival: false,
    is_on_sale: false,
    is_limited_edition: false,
    is_sold_out: false,
    custom_badge_text: '',
    badge_color: '#ef4444',
    badge_priority: 0,
    badge_display_until: '',
    badge_display_from: '',
    // Tags
    tags: []
  })

  // Draft persistence removed - was interfering with database operations

  // State for images (can be File objects for new uploads or URL strings for existing images)
  const [imageFiles, setImageFiles] = useState<(File | string)[]>(initialData?.images || [])

  // State for variants
  type UIOptionValue = { id: string; value: string; displayValue: string; colorHex?: string; imageUrl?: string }
  type UIOption = { id: string; name: string; displayName: string; type: 'text'|'color'|'image'|'select'; required: boolean; values: UIOptionValue[] }
  type UICombination = { id: string; options: Record<string, string>; priceCents: number; stock: number; sku: string; imageUrl?: string }

  const [variantOptions, setVariantOptions] = useState<UIOption[]>(
    Array.isArray(initialData?.variantOptions) ? (initialData?.variantOptions as UIOption[]) : []
  )
  const [variantCombinations, setVariantCombinations] = useState<UICombination[]>(
    Array.isArray(initialData?.variantCombinations) ? (initialData?.variantCombinations as UICombination[]) : []
  )

  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPreview, setShowPreview] = useState(false)
  const tenantKey = useAdminTenantKey()

  // Use initialData if provided
  const data = initialData

  // Populate form data when initialData is provided (edit mode)
  useEffect(() => {
    if (initialData && mode === 'edit') {
      console.log('ProductForm: Loading initial data for edit mode:', {
        has_variants: initialData.has_variants,
        has_variants_type: typeof initialData.has_variants,
        has_variants_boolean: Boolean(initialData.has_variants),
        variantOptions_length: initialData.variantOptions?.length || 0
      })
      setFormData(prev => ({
        ...prev,
        ...initialData,
        // Explicit handling for has_variants to prevent undefined
        has_variants: Boolean(initialData.has_variants)
      }))
    }
  }, [initialData, mode])

  // Draft persistence removed - was interfering with database operations

  // Dedicated variant update handler
  const handleVariantUpdate = async (variantData: {
    hasVariants: boolean
    variantOptions: Array<{
      id: string
      name: string
      displayName: string
      type: string
      required: boolean
      values: Array<{
        id: string
        value: string
        displayValue: string
        colorHex?: string
        imageUrl?: string
        priceAdjustmentCents?: number
        costAdjustmentCents?: number
      }>
    }>
    variantCombinations: Array<{
      id: string
      options: Record<string, string>
      priceCents: number
      stock: number
      sku: string
      imageUrl?: string
    }>
  }) => {
    if (!formData.id) {
      console.error('DEBUG: Cannot update variants - no product ID')
      return
    }

    try {
      console.log('DEBUG: ProductForm triggering variant update...')
      await updateProductVariants(formData.id, variantData)
      console.log('DEBUG: ProductForm variant update completed')
      
      // Update the local form state to reflect the changes
          setFormData(prev => ({
            ...prev,
        has_variants: variantData.hasVariants
      }))
      
    } catch (error) {
      console.error('DEBUG: ProductForm variant update failed:', error)
      throw error
    }
  }

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
    
    // Add all form data (excluding variant data which is handled separately)
    Object.entries(formData).forEach(([key, value]) => {
      // Skip variant data - handled by updateProductVariants action
      if (key === 'variantOptions' || key === 'variantCombinations') {
        return
      }
      
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

    // Variant data is handled separately via updateProductVariants action
    // Do not include variant data in main product update

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
          if ('id' in result) {
            createdProductId = result.id
          } else {
            throw new Error(result.error || 'Failed to create product')
          }
          
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
        
        // Draft persistence removed - no need to clear
        
        // Small delay to ensure cache invalidation completes
        await new Promise(resolve => setTimeout(resolve, 100))
        
        router.push(ADMIN_URLS.products(tenantKey))
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
        {/* Draft notification removed - no longer using local storage drafts */}
        
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

        <TaxSection 
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
          onUpdateVariants={mode === 'edit' ? handleVariantUpdate : undefined}
          productId={formData.id}
        />

        <SizeGuideSection
          formData={formData}
          onInputChange={handleInputChange}
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
        
        <BadgeSection 
          formData={formData} 
          errors={errors}
          onInputChange={handleInputChange}
        />
        
        <SeoSection 
          formData={formData} 
          errors={errors}
          onInputChange={handleInputChange}
        />

        <div className="flex justify-end gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => router.push(ADMIN_URLS.products(tenantKey))}
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
