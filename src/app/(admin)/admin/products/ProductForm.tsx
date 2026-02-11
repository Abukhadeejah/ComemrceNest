'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ADMIN_URLS } from '@/utils/admin-urls'
import { useAdminTenantKey } from '@/components/admin/AdminBrandingWrapper'
import { useDraftAutoSave } from '@/hooks/useDraftAutoSave'
import {
  createProduct,
  updateProduct,
  updateProductVariants,
  uploadProductImage,
} from './actions'
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
// Force refresh - reimport ProductStatusSection
import { ProductStatusSection } from './components/ProductStatusSection'
import { SizeGuideSection } from './components/SizeGuideSection'
import { AttributesSection } from './components/AttributesSection'
import { ProductFormData, VariantOption, CategoryTreeNode, ProductAttributeDefinition } from '@/types/product'

import { useForm, SubmitHandler } from 'react-hook-form'



// ProductForm - Main product creation/editing form - Updated: ${new Date().toISOString()}

/**
 * Adapter: Convert UIOption[] to VariantOption[]
 * Ensures variant options passed to VariantsSection have the expected type union.
 */
function adaptVariantOptions(options: VariantOption[]): VariantOption[] {
  return options.map((opt) => ({
    ...opt,
    // Ensure type is in the VariantOption union; if unknown, default to 'select'
    type: ['text', 'color', 'image', 'select'].includes(opt.type) ? opt.type : 'select',
    required: opt.required ?? false,
  }))
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export function ProductForm({
  mode,
  initialData = {},
  categories,
  tenantId,
  attributes = [],
}: ProductFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialDraftId = searchParams?.get('draftId')
  const tenantKey = useAdminTenantKey()

  const [formError, setFormError] = useState<string>('')
  const [imageFiles, setImageFiles] = useState<(File | string)[]>(initialData.images || [])
  const [showPreview, setShowPreview] = useState(false)
  const [, startTransition] = useTransition()

  const {
    handleSubmit,
    setValue,
    watch,
    setError,
    control,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    mode: 'onChange',
    defaultValues: {
      ...(initialData as Partial<ProductFormData>),
      name: initialData.name ?? '',
      slug: initialData.slug ?? '',
      description: initialData.description ?? '',
      short_description: initialData.short_description ?? '',
      price_cents: initialData.price_cents ?? null,
      compare_at_price_cents: initialData.compare_at_price_cents ?? null,
      cost_price_cents: initialData.cost_price_cents ?? null,
      currency: initialData.currency ?? 'INR',
      stock: initialData.stock ?? 0,
      sku: initialData.sku ?? '',
      barcode: initialData.barcode ?? '',
      weight: initialData.weight ?? null,
      dimensions: initialData.dimensions ?? '',
      has_variants: initialData.has_variants ?? false,
      track_inventory: initialData.track_inventory ?? true,
      low_stock_threshold: initialData.low_stock_threshold ?? 5,
      meta_title: initialData.meta_title ?? '',
      meta_description: initialData.meta_description ?? '',
      allow_backorders: initialData.allow_backorders ?? false,
      requires_shipping: initialData.requires_shipping ?? true,
      taxable: initialData.taxable ?? true,
      hs_code: initialData.hs_code ?? '',
      seo_url: initialData.seo_url ?? '',
      material_composition: initialData.material_composition ?? '',
      care_instructions: initialData.care_instructions ?? '',
      fit_type: initialData.fit_type ?? '',
      model_height_cm: initialData.model_height_cm ?? null,
      model_weight_kg: initialData.model_weight_kg ?? null,
      model_wearing_size: initialData.model_wearing_size ?? '',
      is_gift_card: initialData.is_gift_card ?? false,
      gift_card_amount_cents: initialData.gift_card_amount_cents ?? null,
      gift_card_expiry_days: initialData.gift_card_expiry_days ?? null,
      category_id: initialData.category_id ?? null,
      category_ids: initialData.category_ids ?? [],
      status: initialData.status ?? 'draft',
      tax_class_id: initialData.tax_class_id ?? '',
      images: initialData.images ?? [],
      variantOptions: (initialData.variantOptions as VariantOption[]) ?? [],
      variantCombinations: initialData.variantCombinations ?? [],
      sizeGuides: initialData.sizeGuides ?? [],
      sizeGuideId: initialData.sizeGuideId ?? '',
      brand: initialData.brand ?? '',
      color: initialData.color ?? '',
      material: initialData.material ?? '',
      is_featured: initialData.is_featured ?? false,
      is_bestseller: initialData.is_bestseller ?? false,
      is_new_arrival: initialData.is_new_arrival ?? false,
      is_on_sale: initialData.is_on_sale ?? false,
      is_limited_edition: initialData.is_limited_edition ?? false,
      is_sold_out: initialData.is_sold_out ?? false,
      custom_badge_text: initialData.custom_badge_text ?? '',
      badge_color: initialData.badge_color ?? '#ef4444',
      badge_priority: initialData.badge_priority ?? 0,
      badge_display_until: initialData.badge_display_until ?? '',
      badge_display_from: initialData.badge_display_from ?? '',
      tags: initialData.tags ?? [],
      attributes: initialData.attributes ?? [],
    },
  })

  const productName = watch('name')
  const debouncedName = useDebounce(productName, 500)

  // CRITICAL FIX: Sync initialData with form values in edit mode
  // This ensures images, attributes, and all other fields load correctly when editing
  useEffect(() => {
    if (mode === 'edit' && initialData && Object.keys(initialData).length > 0) {
      console.log('🔄 ========== SYNCING EDIT FORM DATA ==========')
      console.log('📋 initialData received:', {
        id: initialData.id,
        name: initialData.name,
        images_count: initialData.images?.length || 0,
        attributes_count: initialData.attributes?.length || 0,
        description_length: initialData.description?.length || 0,
        category_ids: initialData.category_ids,
      })
      
      // Use reset() to properly sync all form values
      // This is the correct way to update form values after initial mount
      const formValues = {
        name: initialData.name ?? '',
        slug: initialData.slug ?? '',
        description: initialData.description ?? '',
        short_description: initialData.short_description ?? '',
        price_cents: initialData.price_cents ?? null,
        compare_at_price_cents: initialData.compare_at_price_cents ?? null,
        cost_price_cents: initialData.cost_price_cents ?? null,
        currency: initialData.currency ?? 'INR',
        stock: initialData.stock ?? 0,
        sku: initialData.sku ?? '',
        barcode: initialData.barcode ?? '',
        weight: initialData.weight ?? null,
        dimensions: initialData.dimensions ?? '',
        has_variants: initialData.has_variants ?? false,
        track_inventory: initialData.track_inventory ?? true,
        low_stock_threshold: initialData.low_stock_threshold ?? 5,
        meta_title: initialData.meta_title ?? '',
        meta_description: initialData.meta_description ?? '',
        allow_backorders: initialData.allow_backorders ?? false,
        requires_shipping: initialData.requires_shipping ?? true,
        taxable: initialData.taxable ?? true,
        hs_code: initialData.hs_code ?? '',
        seo_url: initialData.seo_url ?? '',
        material_composition: initialData.material_composition ?? '',
        care_instructions: initialData.care_instructions ?? '',
        fit_type: initialData.fit_type ?? '',
        model_height_cm: initialData.model_height_cm ?? null,
        model_weight_kg: initialData.model_weight_kg ?? null,
        model_wearing_size: initialData.model_wearing_size ?? '',
        is_gift_card: initialData.is_gift_card ?? false,
        gift_card_amount_cents: initialData.gift_card_amount_cents ?? null,
        gift_card_expiry_days: initialData.gift_card_expiry_days ?? null,
        category_id: initialData.category_id ?? null,
        category_ids: initialData.category_ids ?? [],
        status: initialData.status ?? 'draft',
        tax_class_id: initialData.tax_class_id ?? '',
        images: initialData.images ?? [],
        variantOptions: (initialData.variantOptions as VariantOption[]) ?? [],
        variantCombinations: initialData.variantCombinations ?? [],
        sizeGuides: initialData.sizeGuides ?? [],
        sizeGuideId: initialData.sizeGuideId ?? '',
        brand: initialData.brand ?? '',
        color: initialData.color ?? '',
        material: initialData.material ?? '',
        is_featured: initialData.is_featured ?? false,
        is_bestseller: initialData.is_bestseller ?? false,
        is_new_arrival: initialData.is_new_arrival ?? false,
        is_on_sale: initialData.is_on_sale ?? false,
        is_limited_edition: initialData.is_limited_edition ?? false,
        is_sold_out: initialData.is_sold_out ?? false,
        custom_badge_text: initialData.custom_badge_text ?? '',
        badge_color: initialData.badge_color ?? '#ef4444',
        badge_priority: initialData.badge_priority ?? 0,
        badge_display_until: initialData.badge_display_until ?? '',
        badge_display_from: initialData.badge_display_from ?? '',
        tags: initialData.tags ?? [],
        attributes: initialData.attributes ?? [],
      }
      
      console.log('📝 Resetting form with values:', {
        attributes: formValues.attributes,
        images: formValues.images,
        description: formValues.description?.substring(0, 50) + '...',
      })
      
      // Reset form with new values (keeps form dirty state)
      reset(formValues, { keepDirty: false })
      
      // Sync images state separately for MediaSection
      if (initialData.images && Array.isArray(initialData.images)) {
        console.log('📸 Syncing images state:', initialData.images.length, 'images')
        setImageFiles(initialData.images)
      }
      
      console.log('✅ Form sync complete')
      console.log('========================================')
    }
  }, [mode, initialData?.id, reset]) // Use initialData.id as dependency to trigger on data load

  useEffect(() => {
    // Only auto-generate slug in create mode, not when editing
    if (mode === 'create' && debouncedName.trim() && !initialData.slug) {
      const baseSlug = debouncedName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .toLowerCase() // Ensure it's lowercase

      // Add a random 8-digit number to make it unique
      const uniqueId = Math.floor(10000000 + Math.random() * 90000000)
      const slug = `${baseSlug}-${uniqueId}`

      setValue('slug', slug, { shouldValidate: true })
    }
  }, [debouncedName, setValue, mode, initialData.slug])

  // Memoize watchedValues to prevent unnecessary re-renders
  const watchedValues = watch()
  
  const handleFieldChange = useCallback(
    (field: keyof ProductFormData, value: any) => {
      setValue(field as any, value, { shouldValidate: true, shouldDirty: true })
    },
    [setValue]
  )

  const [shouldAutoSave, setShouldAutoSave] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // DISABLED: Auto-save was causing constant re-renders every 10 seconds
  // Users can manually save as draft or publish when ready
  const { draftId, isSaving, lastSaved, deleteDraft } = useDraftAutoSave(
    tenantId,
    null, // Disabled: was "mode === 'create' && shouldAutoSave && !isSubmitting ? watchedValues : null"
    initialDraftId
  )

  const onSubmit: SubmitHandler<ProductFormData> = async (data: ProductFormData) => {
    console.log('🚀 ========== FORM SUBMISSION STARTED ==========')
    console.log('🚀 Form submitted with data:', data)
    console.log('📝 Starting validation checks...')

    setFormError('')
    setIsSubmitting(true)

    // Enable auto-save for create mode
    if (mode === 'create') {
      setShouldAutoSave(true)
    }

    // Validation 1: Product Name
    console.log('✓ Validation 1: Product Name')
    console.log('  - Value:', data.name)
    console.log('  - Type:', typeof data.name)
    console.log('  - Trimmed:', data.name?.trim())
    console.log('  - Is Valid:', !!data.name?.trim())

    if (!data.name?.trim()) {
      const errorMsg = '❌ Product name is required'
      console.error('❌ VALIDATION FAILED: Product name is empty')
      setFormError(errorMsg)
      alert(errorMsg)
      setIsSubmitting(false)
      return
    }
    console.log('✅ Product name validation passed')

    // Validation 2: Categories
    console.log('✓ Validation 2: Categories')
    console.log('  - Value:', data.category_ids)
    console.log('  - Type:', typeof data.category_ids)
    console.log('  - Is Array:', Array.isArray(data.category_ids))
    console.log('  - Length:', data.category_ids?.length)
    console.log('  - Is Valid:', data.category_ids?.length > 0)

    if (!data.category_ids || data.category_ids.length === 0) {
      const errorMsg = '❌ At least one category must be selected'
      console.error('❌ VALIDATION FAILED: No categories selected')
      setFormError(errorMsg)
      alert(errorMsg)
      setIsSubmitting(false)
      return
    }
    console.log('✅ Categories validation passed')

    console.log('✅ ========== ALL VALIDATIONS PASSED ==========')
    console.log('📤 Proceeding with form submission...')

    startTransition(async () => {
      try {
        let createdProductId: string | undefined
        const form = new FormData()

        // Convert numeric fields to integers
        const numericFields = ['price_cents', 'compare_at_price_cents', 'cost_price_cents', 'stock', 'low_stock_threshold', 'gift_card_amount_cents', 'gift_card_expiry_days', 'badge_priority']

        console.log('📋 BEFORE FormData construction - form data object:', {
          price_cents: data.price_cents,
          compare_at_price_cents: data.compare_at_price_cents,
          cost_price_cents: data.cost_price_cents,
          stock: data.stock,
          low_stock_threshold: data.low_stock_threshold,
        })

        for (const [key, value] of Object.entries(data)) {
          if (key === 'variantOptions' || key === 'variantCombinations') continue
          if (key === 'category_ids' && Array.isArray(value) && value.length > 0) {
            value.forEach((cid) => form.append('category_ids[]', cid))
            continue
          }

          // Map cost_price_cents to cost_per_item_cents for backend compatibility
          const formKey = key === 'cost_price_cents' ? 'cost_per_item_cents' : key

          // Special handling for attributes - always append even if empty array
          if (key === 'attributes') {
            console.log('🎨 ATTRIBUTES FORM DATA:', {
              value,
              isArray: Array.isArray(value),
              length: Array.isArray(value) ? value.length : 'N/A',
              stringified: JSON.stringify(value)
            })
            form.append(formKey, JSON.stringify(value || []))
            continue
          }

          if (Array.isArray(value)) {
            if (value.length > 0) form.append(formKey, JSON.stringify(value))
          } else if (value !== null && value !== undefined) {
            // Convert numeric fields to integers
            if (numericFields.includes(key) && typeof value === 'number') {
              const rounded = Math.round(value)
              // Log ALL numeric field conversions (including cost_price_cents)
              if (numericFields.includes(key)) {
                console.log(`💰 FormData ${key} -> ${formKey}: ${value} -> ${rounded}`)
                // CRITICAL: Log cost price separately for debugging
                if (key === 'cost_price_cents') {
                  console.log(`🔴 COST PRICE AUDIT: cost_price_cents ${value} cents -> cost_per_item_cents ${rounded} cents [APPENDED TO FORMDATA]`)
                }
              }
              form.append(formKey, String(rounded))
            } else {
              form.append(formKey, String(value))
            }
          } else if (value === 0 && numericFields.includes(key)) {
            // IMPORTANT: Always send numeric fields even if 0 (including cost_price_cents)
            // This ensures we don't accidentally preserve old values during updates
            const rounded = 0
            form.append(formKey, String(rounded))
            if (key === 'cost_price_cents') {
              console.log(`🔴 COST PRICE AUDIT: cost_price_cents is 0 -> cost_per_item_cents 0 [APPENDED TO FORMDATA - IMPORTANT FOR EDIT MODE]`)
            }
          }
        }

        // STRICT LOGGING: Log ALL FormData entries with field lengths
        console.log('📋 ========== COMPLETE FormData AUDIT ==========')
        console.log('📋 Total FormData entries:', Array.from(form.entries()).length)
        
        // Fields that have specific character limits in database
        const fieldsWithLimit50 = ['fit_type', 'model_wearing_size', 'badge_color', 'hs_code', 'color']
        
        for (const [key, value] of form.entries()) {
          const stringValue = String(value)
          const length = stringValue.length
          console.log(`  🔸 ${key}: "${stringValue.substring(0, 50)}${stringValue.length > 50 ? '...' : ''}" (${length} chars)`)
          
          // Only flag specific 50-char limit fields
          if (fieldsWithLimit50.includes(key) && length > 50) {
            console.error(`⚠️  POTENTIAL ISSUE: ${key} = ${length} chars (exceeds 50 limit!)`)
          }
        }
        console.log('📋 ========== END FormData AUDIT ==========')

        console.log('📋 AFTER FormData construction - form entries:')
        console.log('  price_cents:', form.get('price_cents'))
        console.log('  compare_at_price_cents:', form.get('compare_at_price_cents'))
        console.log('  cost_per_item_cents:', form.get('cost_per_item_cents'))
        console.log('  stock:', form.get('stock'))

        // Remove primary category logic - products can belong to multiple categories equally

        if (mode === 'edit' && initialData?.id) {
          console.log('🔴 EDIT MODE: Updating product', initialData.id)
          console.log('🔴 EDIT MODE: cost_price_cents from form data:', form.get('cost_per_item_cents'), '[Before updateProduct]')
          console.log('🔴 EDIT MODE: attributes from form data:', form.get('attributes'))
          
          const updateResult = await updateProduct(initialData.id, form)
          console.log('✅ EDIT MODE: Product updated successfully', updateResult)

          const files = imageFiles.filter((i) => i instanceof File) as File[]
          if (files.length > 0) {
            console.log('📸 EDIT MODE: Uploading', files.length, 'new image files')
            for (const file of files) {
              await uploadProductImage(file, initialData.id)
            }
            console.log('✅ EDIT MODE: Images uploaded successfully')
          }

          if (data.variantOptions && data.variantCombinations) {
            console.log('🔧 EDIT MODE: Updating variants')
            await updateProductVariants(initialData.id, {
              hasVariants: data.has_variants || false,
              variantOptions: data.variantOptions,
              variantCombinations: data.variantCombinations,
            })
            console.log('✅ EDIT MODE: Variants updated successfully')
          }

          // OPTIONAL: Try to delete draft (non-blocking - don't fail if this errors)
          try {
            const deleteRes = await fetch(`/api/product-drafts/${initialData.id}`, { method: 'DELETE' })
            if (deleteRes.ok) {
              console.log('✅ Draft deleted after successful product update')
            } else {
              console.warn('⚠️ Draft deletion returned non-OK status:', deleteRes.status)
            }
          } catch (err) {
            // Silently fail - draft deletion is not critical
            console.warn('⚠️ Failed to delete draft after update (non-critical):', err)
          }
          
          console.log('✅ ========== EDIT COMPLETE - REDIRECTING ==========')
        } else {
          console.log('Creating product with form data:', Object.fromEntries(form.entries())) // Debug log
          const result = await createProduct(form)
          console.log('Create product result:', result) // Debug log
          if ('id' in result) {
            createdProductId = result.id
          } else if ('error' in result) {
            console.error('Product creation failed:', JSON.stringify(result, null, 2))
            const errorMsg = (result as any).error || (result as any).message || 'Failed to create product'
            throw new Error(errorMsg)
          } else {
            console.error('Unexpected product creation response:', result)
            throw new Error('Failed to create product - unexpected response from server')
          }

          const files = imageFiles.filter((i) => i instanceof File) as File[]
          for (const file of files) {
            await uploadProductImage(file, createdProductId!)
          }

          if (data.variantOptions && data.variantCombinations && createdProductId) {
            await updateProductVariants(createdProductId, {
              hasVariants: data.has_variants || false,
              variantOptions: data.variantOptions,
              variantCombinations: data.variantCombinations,
            })
          }

          if (draftId) {
            await deleteDraft()
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 100))

        // Redirect to the created product's detail page if we have the ID
        if (createdProductId) {
          router.push(ADMIN_URLS.productDetail(createdProductId, tenantKey))
        } else {
          router.push(ADMIN_URLS.products(tenantKey))
        }
        router.refresh()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        
        // Ignore Next.js redirect "errors" - these are normal and handled by the framework
        if (errorMessage.includes('NEXT_REDIRECT')) {
          console.log('[ProductForm] Redirect triggered (this is normal)')
          return
        }
        
        console.error('[ProductForm] Error during submission:', errorMessage, error)
        
        if (errorMessage.includes('duplicate key value violates unique constraint "products_tenant_id_slug_key"')) {
          setError('slug', {
            type: 'manual',
            message: 'A product with this slug already exists. Please choose a different slug.',
          })
          setFormError('❌ A product with this slug already exists. Please choose a different slug.')
        } else if (errorMessage.includes('slug')) {
          setError('slug', {
            type: 'manual',
            message: 'Invalid slug format. Use only lowercase letters, numbers, and hyphens.',
          })
          setFormError('❌ Invalid slug format. Use only lowercase letters, numbers, and hyphens.')
        } else if (errorMessage.includes('tenant')) {
          setFormError('❌ Tenant not found. Please refresh and try again.')
        } else if (errorMessage.includes('category')) {
          setFormError('❌ Category error: ' + errorMessage)
        } else {
          setFormError('❌ ' + (errorMessage || 'An unexpected error occurred. Please try again or contact support.'))
        }
        setIsSubmitting(false)
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{mode === 'edit' ? 'Edit Product' : 'Create Product'}</h1>

        <div className="flex gap-2 items-center">
          {mode === 'create' && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {isSaving && (
                <span className="flex items-center gap-1">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving draft...
                </span>
              )}
              {!isSaving && lastSaved && <span>Draft saved at {lastSaved.toLocaleTimeString()}</span>}
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Preview
          </button>
        </div>
      </div>

      {/* Global form error display */}
      {formError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-red-400 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-red-800">{formError}</p>
          </div>
        </div>
      )}

      <fieldset disabled={isSubmitting} className="space-y-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <BasicInformationSection
            formData={watchedValues}
            errors={errors}
            onInputChange={handleFieldChange}
          />
          <PricingSection
            formData={watchedValues}
            errors={errors}
            onInputChange={handleFieldChange}
          />
          <InventorySection
            formData={watchedValues}
            errors={errors}
            onInputChange={handleFieldChange}
          />
          <ShippingSection
            formData={watchedValues}
            errors={errors}
            onInputChange={handleFieldChange}
          />
          <TaxSection
            formData={watchedValues}
            errors={errors}
            onInputChange={handleFieldChange}
            setValue={setValue}
          />
          <OrganizationSection
            formData={watchedValues}
            errors={errors}
            categories={categories}
            setValue={setValue}
          />
          <VariantsSection
            hasVariants={watchedValues.has_variants || false}
            onHasVariantsChange={(has) => handleFieldChange('has_variants', has)}
            variantOptions={adaptVariantOptions(watchedValues.variantOptions || [])}
            onVariantOptionsChange={(opts) => handleFieldChange('variantOptions', opts)}
            variantCombinations={watchedValues.variantCombinations || []}
            onVariantCombinationsChange={(combs) => handleFieldChange('variantCombinations', combs)}
            onUpdateVariants={undefined}
            productId={initialData?.id}
          />
          <AttributesSection
            control={control}
            name="attributes"
            attributes={attributes}
          />
          <SizeGuideSection formData={watchedValues} errors={errors} setValue={setValue} />
          <MediaSection
            images={imageFiles}
            onImagesChange={(images: (File | string)[]) => {
              setImageFiles(images)
              const imageUrls = images.filter((i) => typeof i === 'string') as string[]
              setValue('images', imageUrls)
            }}
            productId={initialData?.id || ''}
          />
          <BadgeSection
            formData={watchedValues}
            errors={errors}
            onInputChange={handleFieldChange}
          />
          <SeoSection
            formData={watchedValues}
            errors={errors}
            onInputChange={handleFieldChange}
          />
          <ProductStatusSection
            formData={watchedValues}
            errors={errors}
            onInputChange={handleFieldChange}
          />

          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.push(ADMIN_URLS.products(tenantKey))}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              onClick={() => {
                console.log('🔘 ========== SUBMIT BUTTON CLICKED ==========')
                console.log('📋 Current form state:', watchedValues)
                console.log('🔒 Is Submitting:', isSubmitting)
                console.log('⏳ Waiting for form validation...')
              }}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (mode === 'edit' ? 'Updating...' : 'Creating...') : mode === 'edit' ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </fieldset>

      {showPreview && <ProductPreview formData={watchedValues} images={imageFiles} onClose={() => setShowPreview(false)} />}
    </div>
  )
}
export interface ProductFormProps {
  mode: 'create' | 'edit'
  initialData?: Partial<ProductFormData>
  categories: CategoryTreeNode[]
  tenantId: string
  attributes?: ProductAttributeDefinition[]
}