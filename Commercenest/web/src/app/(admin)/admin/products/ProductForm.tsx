'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ADMIN_URLS } from '@/utils/admin-urls'
import { useAdminTenantKey } from '@/components/admin/AdminBrandingWrapper'
import { useDraftAutoSave } from '@/hooks/useDraftAutoSave'
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
  tenantId: string // Add this to props
}

export function ProductForm({ mode, initialData, categories, tenantId }: ProductFormProps) {
  //console.log('Productform recieved tenantId prop:', tenantId,); // ADD THIS
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
    brand: '',
    color: '',
    material: '',
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
    tags: []
  })

  const searchParams = useSearchParams()
  const initialDraftId = searchParams?.get('draftId')

  // Database-backed draft auto-save
  const { draftId, isSaving, lastSaved, deleteDraft } = useDraftAutoSave(
    tenantId,
    mode === 'create' ? formData : null, // Only auto-save in create mode
    initialDraftId
  )

  const [imageFiles, setImageFiles] = useState<(File | string)[]>(initialData?.images || [])

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

  const data = initialData

  useEffect(() => {
    if (initialData && mode === 'edit') {
      console.log('ProductForm: Loading initial data for edit mode:', {
        has_variants: initialData.has_variants,
        has_variants_type: typeof initialData.has_variants,
        has_variants_boolean: Boolean(initialData.has_variants),
        variantOptions_length: initialData.variantOptions?.length || 0
      })
      setFormData((prev: ProductFormData) => ({
        ...prev,
        ...initialData,
        has_variants: Boolean(initialData.has_variants)
      }))
    }
  }, [initialData, mode])

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
      
      setFormData((prev: ProductFormData) => ({
        ...prev,
        has_variants: variantData.hasVariants
      }))
      
    } catch (error) {
      console.error('DEBUG: ProductForm variant update failed:', error)
      throw error
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleInputChange = (field: keyof ProductFormData, value: string | number | boolean | null | unknown[]) => {
    setFormData((prev: ProductFormData) => ({
      ...prev,
      [field]: value
    }))
    
    if (field === 'name' && typeof value === 'string' && value.trim()) {
      const generatedSlug = generateSlug(value)
      setFormData((prev: ProductFormData) => ({
        ...prev,
        slug: generatedSlug
      }))
    }
    
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const form = new FormData(e.currentTarget)
    
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'variantOptions' || key === 'variantCombinations') {
        return
      }
      
      if (key === 'category_ids') {
        if (Array.isArray(value) && value.length > 0) {
          value.forEach((catId) => {
            form.append('category_ids[]', catId)
          })
        }
        return
      }
      
      if (Array.isArray(value)) {
        if (value.length > 0) {
          form.append(key, JSON.stringify(value))
        }
      } else if (value !== null && value !== undefined) {
        form.append(key, String(value))
      }
    })

    if (formData.category_ids && formData.category_ids.length > 0) {
      form.set('category_id', formData.category_ids[0])
    }

    startTransition(async () => {
      try {
        let createdProductId: string | undefined
        
        if (mode === 'edit' && data?.id) {
          await updateProduct(data.id as string, form)
          
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
            }
          }
        } else {
          const result = await createProduct(form)
          if ('id' in result) {
            createdProductId = result.id
          } else {
            throw new Error(result.error || 'Failed to create product')
          }
          
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
            }
          }

          // Delete draft after successful product creation
          if (draftId) {
            await deleteDraft()
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 100))
        
        router.push(ADMIN_URLS.products(tenantKey))
        router.refresh()
      } catch (error) {
        console.error('Failed to save product:', error)
        
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
          setErrors(prev => ({
            ...prev,
            general: 'An unexpected error occurred. Please try again or contact support.'
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
        <div className="flex gap-2 items-center">
          {/* Draft status indicator */}
          {mode === 'create' && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {isSaving && (
                <span className="flex items-center gap-1">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving draft...
                </span>
              )}
              {!isSaving && lastSaved && (
                <span>Draft saved at {lastSaved.toLocaleTimeString()}</span>
              )}
            </div>
          )}
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
            const imageUrls = images
              .filter(item => typeof item === 'string')
              .map(item => item as string)
            setFormData((prev: ProductFormData) => ({
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
