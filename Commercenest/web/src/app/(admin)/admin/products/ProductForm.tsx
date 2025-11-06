'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import debounce from 'lodash.debounce'
import { ADMIN_URLS } from '@/utils/admin-urls'
import { useAdminTenantKey } from '@/components/admin/AdminBrandingWrapper'
import { createProduct, updateProduct, updateProductVariants, uploadProductImage } from './actions'
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
import { useDraftPersistence } from '@/hooks/useDraftPersistence'

interface ProductFormProps {
  mode: 'create' | 'edit'
  initialData?: Partial<ProductFormData> & { variantOptions?: unknown[]; variantCombinations?: unknown[] }
  categories: Category[]
}

export function ProductForm({ mode, initialData, categories }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>(initialData || ({} as ProductFormData))
  const [imageFiles, setImageFiles] = useState<(File | string)[]>(formData.images || [])
  const [variantOptions, setVariantOptions] = useState(formData.variantOptions || [])
  const [variantCombinations, setVariantCombinations] = useState(formData.variantCombinations || [])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const tenantKey = useAdminTenantKey()
  const [showPreview, setShowPreview] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)

  // Important: Declare isPending and startTransition here
  const [isPending, startTransition] = useTransition()

  // Load draft from server for edit mode
  useEffect(() => {
    if (mode === 'edit' && initialData?.id) {
      fetch(`/api/product-drafts/${initialData.id}`)
        .then(r => r.ok ? r.json() : null)
        .then((draft) => {
          if (draft && typeof draft === 'object') {
            setFormData(prev => ({ ...prev, ...(draft as Partial<ProductFormData>) }))
            if (Array.isArray((draft as any).variantOptions)) setVariantOptions((draft as any).variantOptions)
            if (Array.isArray((draft as any).variantCombinations)) setVariantCombinations((draft as any).variantCombinations)
            if (Array.isArray((draft as any).images)) setImageFiles((draft as any).images)
          }
        })
        .catch(() => {})
    }
  }, [mode, initialData])

  // Debounced server draft save (edit mode only)
  const debouncedSaveDraft = useCallback(
    debounce(async (data: ProductFormData, variants: typeof variantOptions, combinations: typeof variantCombinations, images: (File | string)[]) => {
      if (mode !== 'edit' || !initialData?.id) return
      setIsSavingDraft(true)
      try {
        const body = {
          ...data,
          variantOptions: variants,
          variantCombinations: combinations,
          images: images.filter((img) => typeof img === 'string'),
        }
        await fetch(`/api/product-drafts/${initialData.id}`,{ method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      } catch {
        // ignore
      }
      setIsSavingDraft(false)
    }, 800),
    [mode, initialData, variantOptions, variantCombinations, imageFiles]
  )

  useEffect(() => {
    debouncedSaveDraft(formData, variantOptions, variantCombinations, imageFiles)
  }, [formData, variantOptions, variantCombinations, imageFiles, debouncedSaveDraft])

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'variantOptions' || key === 'variantCombinations') return
      if (key === 'category_ids') {
        if (Array.isArray(value) && value.length > 0) {
          value.forEach((catId) => form.append('category_ids[]', catId))
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

        if (mode === 'edit' && initialData?.id) {
          await updateProduct(initialData.id, form)
          const fileImages = imageFiles.filter((img) => img instanceof File) as File[]
          for (const file of fileImages) {
            await uploadProductImage(file, initialData.id)
          }
          // Clear server draft on save
          fetch(`/api/product-drafts/${initialData.id}`, { method: 'DELETE' }).catch(() => {})
        } else {
          const result = await createProduct(form)
          if ('id' in result) {
            createdProductId = result.id
          } else {
            throw new Error(result.error || 'Failed to create product')
          }
          const fileImages = imageFiles.filter((img) => img instanceof File) as File[]
          for (const file of fileImages) {
            await uploadProductImage(file, createdProductId!)
          }
          if (createdProductId) {
            fetch(`/api/product-drafts/${createdProductId}`, { method: 'DELETE' }).catch(() => {})
          }
        }
        router.push(ADMIN_URLS.products(tenantKey))
        router.refresh()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred'
        if (errorMessage.includes('duplicate key value violates unique constraint "products_tenant_id_slug_key"')) {
          setErrors((prev) => ({
            ...prev,
            slug: 'A product with this slug already exists. Please choose a different slug.',
          }))
        } else if (errorMessage.includes('slug')) {
          setErrors((prev) => ({
            ...prev,
            slug: 'Invalid slug format. Use only lowercase letters, numbers, and hyphens.',
          }))
        } else {
          setErrors((prev) => ({
            ...prev,
            general: 'An unexpected error occurred. Please try again or contact support.',
          }))
        }
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{mode === 'edit' ? 'Edit Product' : 'Create Product'}</h1>
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
        <BasicInformationSection formData={formData} errors={errors} onInputChange={handleInputChange} />
        <PricingSection formData={formData} errors={errors} onInputChange={handleInputChange} />
        <InventorySection formData={formData} errors={errors} onInputChange={handleInputChange} />
        <ShippingSection formData={formData} errors={errors} onInputChange={handleInputChange} />
        <TaxSection formData={formData} errors={errors} onInputChange={handleInputChange} />
        <OrganizationSection formData={formData} errors={errors} categories={categories} onInputChange={handleInputChange} />
        <VariantsSection
          hasVariants={formData.has_variants || false}
          onHasVariantsChange={(hasVariants) => handleInputChange('has_variants', hasVariants)}
          variantOptions={variantOptions}
          onVariantOptionsChange={setVariantOptions}
          variantCombinations={variantCombinations}
          onVariantCombinationsChange={setVariantCombinations}
          onUpdateVariants={
            mode === 'edit'
              ? async (variantData) => {
                  if (!formData.id) return
                  await updateProductVariants(formData.id, variantData)
                  setFormData((prev) => ({ ...prev, has_variants: variantData.hasVariants }))
                }
              : undefined
          }
          productId={formData.id}
        />
        <SizeGuideSection formData={formData} onInputChange={handleInputChange} />
        <MediaSection
          images={imageFiles}
          onImagesChange={(images: (File | string)[]) => {
            setImageFiles(images)
            const imageUrls = images.filter((item) => typeof item === 'string') as string[]
            setFormData((prev) => ({ ...prev, images: imageUrls }))
          }}
          productId={formData.id}
        />
        <BadgeSection formData={formData} errors={errors} onInputChange={handleInputChange} />
        <SeoSection formData={formData} errors={errors} onInputChange={handleInputChange} />
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
            {isPending ? 'Saving...' : mode === 'edit' ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
      {showPreview && <ProductPreview formData={formData} images={imageFiles} onClose={() => setShowPreview(false)} />}
    </div>
  )
}
