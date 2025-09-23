'use server'

import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { assertTenantAdmin, getAuthenticatedUserId, hasAuthCookie } from '@/server/auth'
import { revalidateTag, unstable_cache } from 'next/cache'
import { tenantProductsTag } from '@/server/cacheTags'
import { forceInvalidateProductCaches } from '@/server/cacheUtils'
import { adaptProductStatus, adaptToSupabaseJson, undefinedToNull } from '@/utils/typeAdapters'
// GUARDRAIL: Import comprehensive guardrail system
import {
  validateModuleAccess,
  logSecurityEvent,
  createSafeErrorResponse,
  withPerformanceMonitoring
} from '@/server/guardrails'

interface ProductData {
  name: string
  slug: string
  description?: string
  price_cents: number
  compare_at_price_cents?: number | null
  cost_per_item_cents?: number | null
  currency: string
  stock: number
  status: string
  category_id?: string
  meta_title?: string
  meta_description?: string
  sku?: string
  weight?: string | number | null
  dimensions?: string
  has_variants?: boolean
  track_inventory?: boolean
  low_stock_threshold?: number | null
  allow_backorders?: boolean
  requires_shipping?: boolean
  taxable?: boolean
  hs_code?: string
  seo_url?: string
  // Fashion-specific fields
  material_composition?: string | null
  care_instructions?: string | null
  fit_type?: string | null
  model_height_cm?: number | null
  model_weight_kg?: number | null
  model_wearing_size?: string | null
  is_gift_card?: boolean
  gift_card_amount_cents?: number | null
  gift_card_expiry_days?: number | null
  // Variants and size guides (handled separately)
  variantOptions?: Record<string, unknown>[]
  variantCombinations?: Record<string, unknown>[]
  sizeGuides?: Record<string, unknown>[]
  sizeGuideId?: string
  images?: string[]
  // Badge System
  is_featured?: boolean
  is_bestseller?: boolean
  is_new_arrival?: boolean
  is_on_sale?: boolean
  is_limited_edition?: boolean
  is_sold_out?: boolean
  custom_badge_text?: string | null
  badge_color?: string | null
  badge_priority?: number | null
  badge_display_until?: string | null
  badge_display_from?: string | null
  // Tags
  tags?: string[]
}

function normalizeImageInputs(imageInputs: string[]): string[] {
  const urlRegex = /https?:\/\/[^\s'"\]\)]+/g
  const out: string[] = []
  const pushClean = (u?: string) => {
    if (!u) return
    const clean = u.trim().replace(/^(https?:)\/(?!\/)/, '$1//').replace(/\/+$/, '')
    if (clean) out.push(clean)
  }
  for (const s of imageInputs || []) {
    if (!s) continue
    const t = String(s)
    let parsed: unknown
    if (t.trim().startsWith('[') || t.includes('%5B') || t.includes('%22')) {
      try {
        parsed = JSON.parse(t)
      } catch {
        parsed = undefined
      }
    }
    if (Array.isArray(parsed)) {
      for (const v of parsed) {
        if (typeof v === 'string') {
          const m = v.match(urlRegex)
          if (m?.length) m.forEach(pushClean)
          else pushClean(v)
        }
      }
      continue
    }
    const matches = t.match(urlRegex)
    if (matches?.length) matches.forEach(pushClean)
    else pushClean(t)
  }
  return Array.from(new Set(out))
}

export async function checkSlugExists(slug: string, tenantId: string, excludeId?: string) {
  const query = supabaseAdmin
    .from('products')
    .select('id, slug')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
  
  if (excludeId) {
    query.neq('id', excludeId)
  }
  
  const { data, error } = await query.single()
  
  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    throw error
  }
  
  return !!data
}

// GUARDRAIL-ENHANCED: Product creation with comprehensive security and validation
export async function createProduct(formData: FormData) {
  return await withPerformanceMonitoring('createProduct', async () => {
    let tenantId: string | null = null
    try {
      // GUARDRAIL: Validate tenant context and admin access
      const tenantIdResult = await resolveTenantIdFromRequest()
      if (!tenantIdResult) {
        return createSafeErrorResponse('Tenant not found', 'createProduct')
      }
      tenantId = tenantIdResult
      
      await assertTenantAdmin(tenantId!)  // Safe because we checked above

      // GUARDRAIL: Validate module access
      await validateModuleAccess(tenantId!, 'products', 'create')

  const productData: ProductData = {
    name: formData.get('name') as string,
    slug: formData.get('slug') as string,
    description: formData.get('description') as string,
    price_cents: parseInt(formData.get('price_cents') as string) || 0,
    compare_at_price_cents: formData.get('compare_at_price_cents') ? parseInt(formData.get('compare_at_price_cents') as string) : null,
    cost_per_item_cents: formData.get('cost_per_item_cents') ? parseInt(formData.get('cost_per_item_cents') as string) : null,
    currency: 'INR',
    stock: parseInt(formData.get('stock') as string) || 0,
    sku: formData.get('sku') as string,
    weight: formData.get('weight') as string,
    dimensions: formData.get('dimensions') as string,
    has_variants: formData.get('has_variants') === 'true',
    track_inventory: formData.get('track_inventory') === 'true',
    low_stock_threshold: formData.get('low_stock_threshold') ? parseInt(formData.get('low_stock_threshold') as string) : null,
    meta_title: formData.get('meta_title') as string,
    meta_description: formData.get('meta_description') as string,
    allow_backorders: formData.get('allow_backorders') === 'true',
    requires_shipping: formData.get('requires_shipping') === 'true',
    taxable: formData.get('taxable') === 'true',
    hs_code: formData.get('hs_code') as string,
    seo_url: formData.get('seo_url') as string,
    material_composition: formData.get('material_composition') as string,
    care_instructions: formData.get('care_instructions') as string,
    fit_type: formData.get('fit_type') as string,
    model_height_cm: formData.get('model_height_cm') ? parseFloat(formData.get('model_height_cm') as string) : null,
    model_weight_kg: formData.get('model_weight_kg') ? parseFloat(formData.get('model_weight_kg') as string) : null,
    model_wearing_size: formData.get('model_wearing_size') as string,
    is_gift_card: formData.get('is_gift_card') === 'true',
    gift_card_amount_cents: formData.get('gift_card_amount_cents') ? parseInt(formData.get('gift_card_amount_cents') as string) : null,
    gift_card_expiry_days: formData.get('gift_card_expiry_days') ? parseInt(formData.get('gift_card_expiry_days') as string) : null,
    category_id: formData.get('category_id') as string,
    status: formData.get('status') as string,
    images: formData.getAll('images') as string[],
    variantOptions: JSON.parse(formData.get('variantOptions') as string || '[]'),
    variantCombinations: JSON.parse(formData.get('variantCombinations') as string || '[]'),
    sizeGuides: JSON.parse(formData.get('sizeGuides') as string || '[]'),
    sizeGuideId: formData.get('sizeGuideId') as string,
    // Badge System
    is_featured: formData.get('is_featured') === 'true',
    is_bestseller: formData.get('is_bestseller') === 'true',
    is_new_arrival: formData.get('is_new_arrival') === 'true',
    is_on_sale: formData.get('is_on_sale') === 'true',
    is_limited_edition: formData.get('is_limited_edition') === 'true',
    is_sold_out: formData.get('is_sold_out') === 'true',
    custom_badge_text: formData.get('custom_badge_text') as string,
    badge_color: formData.get('badge_color') as string,
    badge_priority: formData.get('badge_priority') ? parseInt(formData.get('badge_priority') as string) : null,
    badge_display_until: formData.get('badge_display_until') as string,
    badge_display_from: formData.get('badge_display_from') as string,
    // Tags
    tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : []
  }

  // Basic server-side validation for product creation
  const creationProblems: string[] = []
  if (!productData.name || !String(productData.name).trim()) creationProblems.push('Product name is required.')
  if (!productData.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(productData.slug))) creationProblems.push('Slug must be kebab-case, lowercase letters, numbers and hyphens only.')
  if (!productData.status || !['draft', 'active', 'archived'].includes(String(productData.status))) creationProblems.push('Invalid status. Use draft, active, or archived.')
  if (productData.price_cents != null && Number(productData.price_cents) < 0) creationProblems.push('Price must be ≥ 0.')
  if (productData.compare_at_price_cents != null && Number(productData.compare_at_price_cents) < 0) creationProblems.push('Compare-at price must be ≥ 0.')
  if (productData.cost_per_item_cents != null && Number(productData.cost_per_item_cents) < 0) creationProblems.push('Cost per item must be ≥ 0.')
  if (productData.stock != null && Number(productData.stock) < 0) creationProblems.push('Stock must be ≥ 0.')
  if (productData.low_stock_threshold != null && Number(productData.low_stock_threshold) < 0) creationProblems.push('Low stock threshold must be ≥ 0.')

  // If variants are enabled at creation time, require at least one option and one combination
  if (productData.has_variants) {
    const opts = Array.isArray(productData.variantOptions) ? productData.variantOptions : []
    const combos = Array.isArray(productData.variantCombinations) ? productData.variantCombinations : []
    if (opts.length === 0) creationProblems.push('At least one variant option is required when variants are enabled.')
    if (combos.length === 0) creationProblems.push('At least one variant combination is required when variants are enabled.')
  }

  if (creationProblems.length > 0) {
    throw new Error(`Validation failed: ${creationProblems.join(' ')}`)
  }

  // Process numeric fields - convert empty strings to null
  if (productData.weight === '') productData.weight = null
  if (productData.model_height_cm === 0) productData.model_height_cm = null
  if (productData.model_weight_kg === 0) productData.model_weight_kg = null
  if (productData.gift_card_amount_cents === 0) productData.gift_card_amount_cents = null
  if (productData.gift_card_expiry_days === 0) productData.gift_card_expiry_days = null
  
  // Process string fields - convert empty strings to null
  if (productData.fit_type === '') productData.fit_type = null
  if (productData.material_composition === '') productData.material_composition = null
  if (productData.care_instructions === '') productData.care_instructions = null
  if (productData.model_wearing_size === '') productData.model_wearing_size = null
  
  // Process badge fields - convert empty strings to null
  if (productData.custom_badge_text === '') productData.custom_badge_text = null
  if (productData.badge_color === '') productData.badge_color = null
  if (productData.badge_display_until === '') productData.badge_display_until = null
  if (productData.badge_display_from === '') productData.badge_display_from = null

  const { data: product, error } = await supabaseAdmin
    .from('products')
    .insert({
      tenant_id: tenantId!,
      name: productData.name,
      slug: productData.slug,
      description: productData.description,
      price_cents: productData.price_cents,
      compare_at_price_cents: productData.compare_at_price_cents,
      cost_per_item_cents: productData.cost_per_item_cents,
      stock: productData.stock,
      sku: productData.sku,
      weight: typeof productData.weight === 'string' ? parseFloat(productData.weight) || null : productData.weight,
      dimensions: productData.dimensions,
      has_variants: productData.has_variants,
      track_inventory: productData.track_inventory,
      low_stock_threshold: productData.low_stock_threshold,
      meta_title: productData.meta_title,
      meta_description: productData.meta_description,
      allow_backorders: productData.allow_backorders,
      requires_shipping: productData.requires_shipping,
      taxable: productData.taxable,
      hs_code: productData.hs_code,
      seo_url: productData.seo_url,
      material_composition: productData.material_composition,
      care_instructions: productData.care_instructions,
      fit_type: productData.fit_type,
      model_height_cm: productData.model_height_cm,
      model_weight_kg: productData.model_weight_kg,
      model_wearing_size: productData.model_wearing_size,
      is_gift_card: productData.is_gift_card,
      gift_card_amount_cents: productData.gift_card_amount_cents,
      gift_card_expiry_days: productData.gift_card_expiry_days,
      status: adaptProductStatus(productData.status),
      // Badge System
      is_featured: productData.is_featured,
      is_bestseller: productData.is_bestseller,
      is_new_arrival: productData.is_new_arrival,
      is_on_sale: productData.is_on_sale,
      is_limited_edition: productData.is_limited_edition,
      is_sold_out: productData.is_sold_out,
      custom_badge_text: productData.custom_badge_text,
      badge_color: productData.badge_color,
      badge_priority: productData.badge_priority,
      badge_display_until: productData.badge_display_until,
      badge_display_from: productData.badge_display_from,
      // Tags
      tags: productData.tags || []
    })
    .select()
    .single()

  if (error) {
    if (error.message.includes('duplicate key value violates unique constraint "products_tenant_id_slug_key"')) {
      throw new Error(`A product with the slug "${productData.slug}" already exists. Please choose a different slug.`)
    } else {
      throw new Error(`Failed to create product: ${error.message}`)
    }
  }

  // Handle category assignment
  if (productData.category_id && productData.category_id.trim() !== '') {
    await supabaseAdmin
      .from('product_categories')
      .insert({
        product_id: product.id,
        category_id: productData.category_id,
        tenant_id: tenantId
      })
  }

  // Handle image uploads
  const normalizedImages = normalizeImageInputs(productData.images || [])
  if (normalizedImages.length > 0) {
    const imagePromises = normalizedImages.map(async (imageUrl: string, index: number) => {
      return supabaseAdmin
        .from('product_images')
        .insert({
          product_id: product.id,
          tenant_id: tenantId!,
          url: imageUrl,
          alt: `Product image ${index + 1}`,
          sort_order: index
        })
    })
    await Promise.all(imagePromises)
  }

  // Handle variant options (using UPSERT to prevent duplicates)
  if (Array.isArray(productData.variantOptions) && productData.variantOptions.length > 0) {
    const variantOptionPromises = productData.variantOptions.map(async (option: Record<string, unknown>) => {
      // First, upsert the variant option (prevent duplicates)
      const { data: variantOption, error: optionError } = await supabaseAdmin
        .from('variant_options')
        .upsert({
          tenant_id: tenantId!,
          name: option.name as string,
          display_name: option.displayName as string,
          type: option.type as string,
          required: option.required as boolean,
          sort_order: 0
        }, {
          onConflict: 'tenant_id,name'
        })
        .select()
        .single()

      if (optionError) throw optionError

      // Link the option to the product (upsert to prevent duplicates)
      await supabaseAdmin
        .from('product_variant_options')
        .upsert({
          tenant_id: tenantId!,
          product_id: product.id,
          option_id: variantOption.id
        }, {
          onConflict: 'product_id,option_id'
        })

      // Create option values (upsert to prevent duplicates)
      const optionValues = Array.isArray((option as Record<string, unknown> & { values?: Record<string, unknown>[] }).values)
        ? ((option as Record<string, unknown> & { values?: Record<string, unknown>[] }).values as Record<string, unknown>[])
        : []
      if (optionValues.length > 0) {
        const valuePromises = optionValues.map(async (value: Record<string, unknown>) => {
          return supabaseAdmin
            .from('variant_option_values')
            .upsert({
              tenant_id: tenantId!,
              option_id: variantOption.id,
              value: value.value as string,
              display_value: value.displayValue as string,
              color_hex: value.colorHex as string,
              image_url: value.imageUrl as string,
              price_adjustment_cents: value.priceAdjustmentCents ? parseInt(String(value.priceAdjustmentCents)) : 0,
              cost_adjustment_cents: value.costAdjustmentCents ? parseInt(String(value.costAdjustmentCents)) : 0
            }, {
              onConflict: 'option_id,value'
            })
        })
        await Promise.all(valuePromises)
      }

      return variantOption
    })
    await Promise.all(variantOptionPromises)
  }

  // Handle variant combinations
  if (Array.isArray(productData.variantCombinations) && productData.variantCombinations.length > 0) {
    const combinationPromises = productData.variantCombinations.map(async (combo: Record<string, unknown>) => {
      // Create the variant combination
      const { data: variant, error: variantError } = await supabaseAdmin
        .from('product_variants')
        .insert({
          tenant_id: tenantId!,
          product_id: product.id,
          name: `Variant ${combo.id}`,
          sku: combo.sku as string,
          price_cents: combo.priceCents as number,
          stock: combo.stock as number,
          attributes: adaptToSupabaseJson(combo.options as Record<string, unknown>)
        })
        .select()
        .single()

      if (variantError) throw variantError

      // Create variant combinations for each option-value pair
      if ((combo as Record<string, unknown> & { options?: Record<string, unknown> }).options && typeof (combo as Record<string, unknown> & { options?: Record<string, unknown> }).options === 'object') {
        const optionEntries = Object.entries(((combo as Record<string, unknown> & { options?: Record<string, unknown> }).options) as Record<string, unknown>)
        const comboPromises = optionEntries.map(async ([optionId, valueId]) => {
          // Find the option and value IDs (this is a simplified approach)
          // In a real implementation, you'd need to maintain proper ID mappings
          return supabaseAdmin
            .from('variant_combinations')
            .insert({
              tenant_id: tenantId!,
              product_id: product.id,
              variant_id: variant.id,
              option_id: optionId,
              option_value_id: valueId as string
            })
        })
        await Promise.all(comboPromises)
      }

      return variant
    })
    await Promise.all(combinationPromises)
  }

  // Handle size guides
  if (Array.isArray(productData.sizeGuides) && productData.sizeGuides.length > 0) {
    const sizeGuidePromises = productData.sizeGuides.map(async (guide: Record<string, unknown>) => {
      // Create the size guide
      const { data: sizeGuide, error: sizeGuideError } = await supabaseAdmin
        .from('size_guides')
        .insert({
          tenant_id: tenantId!,
          name: guide.name as string,
          category: guide.category as string,
          gender: guide.gender as string,
          measurements: adaptToSupabaseJson(guide.measurements as Record<string, unknown>)
        })
        .select()
        .single()

      if (sizeGuideError) throw sizeGuideError

      // Link the size guide to the product
      await supabaseAdmin
        .from('product_size_guides')
        .insert({
          tenant_id: tenantId!,
          product_id: product.id,
          size_guide_id: sizeGuide.id
        })

      return sizeGuide
    })

    await Promise.all(sizeGuidePromises)
  }

  // Handle selected size guide
  if (productData.sizeGuideId && productData.sizeGuideId !== '') {
    await supabaseAdmin
      .from('product_size_guides')
      .insert({
        tenant_id: tenantId!,
        product_id: product.id,
        size_guide_id: productData.sizeGuideId
      })
  }

      // GUARDRAIL: Success logging and cache invalidation
      revalidateTag(tenantProductsTag(tenantId))
      // Also invalidate the general products cache
      revalidateTag('products')
      // Force revalidation of the admin products page
      revalidateTag(`admin-products-${tenantId}`)

      await logSecurityEvent('product_created_success', {
        productId: product.id,
        tenantId,
        productName: productData.name
      })

      return product

    } catch (error) {
      // GUARDRAIL: Comprehensive error handling
      console.error('Product creation failed:', error)

      await logSecurityEvent('product_creation_failed', {
        tenantId: tenantId || 'unknown',
        error: error instanceof Error ? error.message : String(error),
        productData: {
          name: formData.get('name') as string || 'unknown',
          slug: formData.get('slug') as string || 'unknown'
        }
      })

      // GUARDRAIL: Return safe error response
      return createSafeErrorResponse(error, 'createProduct')
    }
  })
}

export async function updateProduct(productId: string, formData: FormData) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) { throw new Error('Tenant not found') }
  await assertTenantAdmin(tenantId)

  const productData: ProductData = {
    name: formData.get('name') as string,
    slug: formData.get('slug') as string,
    description: formData.get('description') as string,
    price_cents: parseInt(formData.get('price_cents') as string) || 0,
    compare_at_price_cents: formData.get('compare_at_price_cents') ? parseInt(formData.get('compare_at_price_cents') as string) : null,
    cost_per_item_cents: formData.get('cost_per_item_cents') ? parseInt(formData.get('cost_per_item_cents') as string) : null,
    currency: 'INR',
    stock: parseInt(formData.get('stock') as string) || 0,
    sku: formData.get('sku') as string,
    weight: formData.get('weight') as string,
    dimensions: formData.get('dimensions') as string,
    has_variants: formData.get('has_variants') === 'true',
    track_inventory: formData.get('track_inventory') === 'true',
    low_stock_threshold: formData.get('low_stock_threshold') ? parseInt(formData.get('low_stock_threshold') as string) : null,
    meta_title: formData.get('meta_title') as string,
    meta_description: formData.get('meta_description') as string,
    allow_backorders: formData.get('allow_backorders') === 'true',
    requires_shipping: formData.get('requires_shipping') === 'true',
    taxable: formData.get('taxable') === 'true',
    hs_code: formData.get('hs_code') as string,
    seo_url: formData.get('seo_url') as string,
    material_composition: formData.get('material_composition') as string,
    care_instructions: formData.get('care_instructions') as string,
    fit_type: formData.get('fit_type') as string,
    model_height_cm: formData.get('model_height_cm') ? parseFloat(formData.get('model_height_cm') as string) : null,
    model_weight_kg: formData.get('model_weight_kg') ? parseFloat(formData.get('model_weight_kg') as string) : null,
    model_wearing_size: formData.get('model_wearing_size') as string,
    is_gift_card: formData.get('is_gift_card') === 'true',
    gift_card_amount_cents: formData.get('gift_card_amount_cents') ? parseInt(formData.get('gift_card_amount_cents') as string) : null,
    gift_card_expiry_days: formData.get('gift_card_expiry_days') ? parseInt(formData.get('gift_card_expiry_days') as string) : null,
    category_id: formData.get('category_id') as string,
    status: formData.get('status') as string,
    images: formData.getAll('images') as string[],
    variantOptions: JSON.parse(formData.get('variantOptions') as string || '[]'),
    variantCombinations: JSON.parse(formData.get('variantCombinations') as string || '[]'),
    sizeGuides: JSON.parse(formData.get('sizeGuides') as string || '[]'),
    sizeGuideId: formData.get('sizeGuideId') as string,
    // Badge System
    is_featured: formData.get('is_featured') === 'true',
    is_bestseller: formData.get('is_bestseller') === 'true',
    is_new_arrival: formData.get('is_new_arrival') === 'true',
    is_on_sale: formData.get('is_on_sale') === 'true',
    is_limited_edition: formData.get('is_limited_edition') === 'true',
    is_sold_out: formData.get('is_sold_out') === 'true',
    custom_badge_text: formData.get('custom_badge_text') as string,
    badge_color: formData.get('badge_color') as string,
    badge_priority: formData.get('badge_priority') ? parseInt(formData.get('badge_priority') as string) : null,
    badge_display_until: formData.get('badge_display_until') as string,
    badge_display_from: formData.get('badge_display_from') as string,
    // Tags
    tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : []
  }

  // Process numeric fields - convert empty strings to null
  if (productData.weight === '') productData.weight = null
  if (productData.model_height_cm === 0) productData.model_height_cm = null
  if (productData.model_weight_kg === 0) productData.model_weight_kg = null
  if (productData.gift_card_amount_cents === 0) productData.gift_card_amount_cents = null
  if (productData.gift_card_expiry_days === 0) productData.gift_card_expiry_days = null
  
  // Process string fields - convert empty strings to null
  if (productData.fit_type === '') productData.fit_type = null
  if (productData.material_composition === '') productData.material_composition = null
  if (productData.care_instructions === '') productData.care_instructions = null
  if (productData.model_wearing_size === '') productData.model_wearing_size = null
  
  // Process badge fields - convert empty strings to null
  if (productData.custom_badge_text === '') productData.custom_badge_text = null
  if (productData.badge_color === '') productData.badge_color = null
  if (productData.badge_display_until === '') productData.badge_display_until = null
  if (productData.badge_display_from === '') productData.badge_display_from = null

  const { data: product, error } = await supabaseAdmin
    .from('products')
    .update({
      name: productData.name,
      slug: productData.slug,
      description: productData.description,
      price_cents: productData.price_cents,
      compare_at_price_cents: productData.compare_at_price_cents,
      cost_per_item_cents: productData.cost_per_item_cents,
      stock: productData.stock,
      sku: productData.sku,
      weight: typeof productData.weight === 'string' ? parseFloat(productData.weight) || null : productData.weight,
      dimensions: productData.dimensions,
      has_variants: productData.has_variants,
      track_inventory: productData.track_inventory,
      low_stock_threshold: productData.low_stock_threshold,
      meta_title: productData.meta_title,
      meta_description: productData.meta_description,
      allow_backorders: productData.allow_backorders,
      requires_shipping: productData.requires_shipping,
      taxable: productData.taxable,
      hs_code: productData.hs_code,
      seo_url: productData.seo_url,
      material_composition: productData.material_composition,
      care_instructions: productData.care_instructions,
      fit_type: productData.fit_type,
      model_height_cm: productData.model_height_cm,
      model_weight_kg: productData.model_weight_kg,
      model_wearing_size: productData.model_wearing_size,
      is_gift_card: productData.is_gift_card,
      gift_card_amount_cents: productData.gift_card_amount_cents,
      gift_card_expiry_days: productData.gift_card_expiry_days,
      status: adaptProductStatus(productData.status),
      // Badge System
      is_featured: productData.is_featured,
      is_bestseller: productData.is_bestseller,
      is_new_arrival: productData.is_new_arrival,
      is_on_sale: productData.is_on_sale,
      is_limited_edition: productData.is_limited_edition,
      is_sold_out: productData.is_sold_out,
      custom_badge_text: productData.custom_badge_text,
      badge_color: productData.badge_color,
      badge_priority: productData.badge_priority,
      badge_display_until: productData.badge_display_until,
      badge_display_from: productData.badge_display_from,
      // Tags
      tags: productData.tags || []
    })
    .eq('id', productId)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update product: ${error.message}`)
  }

  // Guardrail: if variants are enabled, reject embedded variant arrays here
  if (productData.has_variants && (
    (Array.isArray(productData.variantOptions) && productData.variantOptions.length > 0) ||
    (Array.isArray(productData.variantCombinations) && productData.variantCombinations.length > 0)
  )) {
    throw new Error('Variants must be updated using the "Update Variants" button. The main Update does not accept variant arrays.')
  }

  // Handle category assignment (using UPSERT to prevent duplicates)
  if (productData.category_id && productData.category_id.trim() !== '') {
    await supabaseAdmin
      .from('product_categories')
      .upsert({
        product_id: productId,
        category_id: productData.category_id,
        tenant_id: tenantId
      }, {
        onConflict: 'product_id,category_id'
      })
  } else {
    // Remove category assignment if none selected
    await supabaseAdmin
      .from('product_categories')
      .delete()
      .eq('product_id', productId)
  }

  // Handle image uploads (using UPSERT to prevent duplicates)
  const normalizedImagesUpdate = normalizeImageInputs(productData.images || [])
  if (normalizedImagesUpdate.length > 0) {
    // Upsert images to prevent duplicates while maintaining order
    const imagePromises = normalizedImagesUpdate.map(async (imageUrl: string, index: number) => {
      return supabaseAdmin
        .from('product_images')
        .upsert({
          product_id: productId,
          tenant_id: tenantId!,
          url: imageUrl,
          alt: `Product image ${index + 1}`,
          sort_order: index
        }, {
          onConflict: 'product_id,url'
        })
    })
    await Promise.all(imagePromises)
    
    // Clean up any images that are no longer in the list
    await supabaseAdmin
      .from('product_images')
      .delete()
      .eq('product_id', productId)
      .not('url', 'in', `(${normalizedImagesUpdate.map(url => `'${url}'`).join(',')})`)
  } else {
    // Remove all images if none provided
    await supabaseAdmin
      .from('product_images')
      .delete()
      .eq('product_id', productId)
  }

  // IMPORTANT: Do not mutate variant options in the main product update.
  // Variants are managed exclusively via updateProductVariants to avoid
  // accidental deletion/reinsertion and ID mapping issues.

  // IMPORTANT: Do not mutate variant combinations in the main product update.
  // This prevents accidental data loss when the bottom Update button is used.

  // Handle size guides update
  if (Array.isArray(productData.sizeGuides)) {
    // Remove existing size guide associations
    await supabaseAdmin
      .from('product_size_guides')
      .delete()
      .eq('product_id', productId)

    // Add new size guides
    if (productData.sizeGuides.length > 0) {
      const sizeGuidePromises = productData.sizeGuides.map(async (guide: Record<string, unknown>) => {
        // Create the size guide
        const { data: sizeGuide, error: sizeGuideError } = await supabaseAdmin
          .from('size_guides')
          .insert({
            tenant_id: tenantId!,
            name: guide.name as string,
            category: guide.category as string,
            gender: guide.gender as string,
            measurements: adaptToSupabaseJson(guide.measurements as Record<string, unknown>)
          })
          .select()
          .single()

        if (sizeGuideError) throw sizeGuideError

        // Link the size guide to the product
        await supabaseAdmin
          .from('product_size_guides')
          .insert({
            tenant_id: tenantId!,
            product_id: productId,
            size_guide_id: sizeGuide.id
          })

        return sizeGuide
      })

      await Promise.all(sizeGuidePromises)
    }
  }

  // Handle selected size guide update (using UPSERT to prevent duplicates)
  if (productData.sizeGuideId && productData.sizeGuideId !== '') {
    await supabaseAdmin
      .from('product_size_guides')
      .upsert({
        tenant_id: tenantId!,
        product_id: productId,
        size_guide_id: productData.sizeGuideId
      }, {
        onConflict: 'product_id,size_guide_id'
      })
  } else {
    // Remove size guide association if none selected
    await supabaseAdmin
      .from('product_size_guides')
      .delete()
      .eq('product_id', productId)
  }

  revalidateTag(tenantProductsTag(tenantId))
  // Also invalidate the general products cache
  revalidateTag('products')
  // Force revalidation of the admin products page
  revalidateTag(`admin-products-${tenantId}`)
  return product
}

export async function deleteProduct(productId: string) {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      throw new Error('Tenant not found')
    }

    // Validate tenant admin access
    await assertTenantAdmin(tenantId)

    // Validate product ID format
    if (!productId || typeof productId !== 'string' || productId.length !== 36) {
      throw new Error('Invalid product ID format')
    }

    // Use optimized database function for deletion
    const { data, error } = await supabaseAdmin
      .rpc('delete_product_safely', {
        product_id_param: productId,
        tenant_id_param: tenantId
      })

    if (error) {
      console.error('Product deletion error:', error)

      // Handle specific error cases
      if (error.message.includes('Product not found')) {
        throw new Error('Product not found or access denied')
      }

      throw new Error(`Failed to delete product: ${error.message}`)
    }

    // Force immediate cache invalidation to ensure admins see updated data
    await forceInvalidateProductCaches(tenantId)

    console.log(`Product ${productId} deleted successfully for tenant ${tenantId}`)
    console.log(`Deleted ${data?.[0]?.deleted_order_items || 0} order items, ${data?.[0]?.deleted_images || 0} images, and ${data?.[0]?.deleted_categories || 0} category links`)

    return {
      success: true,
      deletedOrderItems: data?.[0]?.deleted_order_items || 0,
      deletedImages: data?.[0]?.deleted_images || 0,
      deletedCategories: data?.[0]?.deleted_categories || 0
    }

  } catch (error) {
    console.error('Unexpected error during product deletion:', error)
    throw error
  }
}

export async function bulkDeleteProducts(productIds: string[]) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) { throw new Error('Tenant not found') }
  await assertTenantAdmin(tenantId)

  // GUARDRAIL: Validate module access
  await validateModuleAccess(tenantId, 'products', 'delete')

  const { error } = await supabaseAdmin
    .from('products')
    .delete()
    .in('id', productIds)
    .eq('tenant_id', tenantId)

  if (error) {
    throw new Error(`Failed to delete products: ${error.message}`)
  }

  // GUARDRAIL: Success logging and cache invalidation
  await forceInvalidateProductCaches(tenantId)

  await logSecurityEvent('products_bulk_deleted_success', {
    productIds,
    tenantId,
    count: productIds.length
  })

  return { success: true }
}

export async function bulkUpdateProductStatus(productIds: string[], status: string) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) { throw new Error('Tenant not found') }
  await assertTenantAdmin(tenantId)

  const { error } = await supabaseAdmin
    .from('products')
    .update({ status: adaptProductStatus(status) })
    .in('id', productIds)
    .eq('tenant_id', tenantId)

  if (error) {
    throw new Error(`Failed to update product status: ${error.message}`)
  }

  revalidateTag(tenantProductsTag(tenantId))
  return { success: true }
}

export async function exportProducts() {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) { throw new Error('Tenant not found') }
  await assertTenantAdmin(tenantId)

  const { data: products, error } = await supabaseAdmin
    .from('products')
    .select(`
      *,
      categories:product_categories(
        category:categories(name)
      )
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`)
  }

  // Convert to CSV format
  const headers = [
    'ID',
    'Name',
    'Slug',
    'Description',
    'Price (₹)',
    'Compare at Price (₹)',
    'Cost per Item (₹)',
    'Stock',
    'Status',
    'SKU',
    'Weight (kg)',
    'Dimensions',
    'Category',
    'Meta Title',
    'Meta Description',
    'Created At'
  ]

  const csvRows = [headers.join(',')]

  products?.forEach(product => {
    const categoryName = product.categories?.[0]?.category?.name || ''
    const row = [
      product.id,
      `"${product.name}"`,
      product.slug,
      `"${product.description || ''}"`,
      (product.price_cents / 100).toFixed(2),
      product.compare_at_price_cents ? (product.compare_at_price_cents / 100).toFixed(2) : '',
      product.cost_per_item_cents ? (product.cost_per_item_cents / 100).toFixed(2) : '',
      product.stock,
      product.status,
      product.sku || '',
      product.weight || '',
      product.dimensions || '',
      `"${categoryName}"`,
      `"${product.meta_title || ''}"`,
      `"${product.meta_description || ''}"`,
      new Date(product.created_at).toISOString()
    ]
    csvRows.push(row.join(','))
  })

  return csvRows.join('\n')
}

export async function uploadProductImage(file: File, productId: string) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) { throw new Error('Tenant not found') }
  await assertTenantAdmin(tenantId)

  const fileName = `${productId}/${Date.now()}-${file.name}`
  
  const { error } = await supabaseAdmin.storage
    .from('product-images')
    .upload(fileName, file)

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`)
  }

  const { data: urlData } = supabaseAdmin.storage
    .from('product-images')
    .getPublicUrl(fileName)

  // Check if this is the first image for this product
  const { data: existingImages } = await supabaseAdmin
    .from('product_images')
    .select('id')
    .eq('product_id', productId)
    .eq('tenant_id', tenantId)

  const isFirstImage = !existingImages || existingImages.length === 0

  // Insert image record
  const { error: imageError } = await supabaseAdmin
    .from('product_images')
    .insert({
      tenant_id: tenantId!,
      product_id: productId,
      url: urlData.publicUrl,
      alt: file.name,
      sort_order: 0
    })

  if (imageError) {
    throw new Error(`Failed to save image record: ${imageError.message}`)
  }

  // If this is the first image, update the hero_image_url in the products table
  if (isFirstImage) {
    const { error: updateError } = await supabaseAdmin
      .from('products')
      .update({ hero_image_url: urlData.publicUrl })
      .eq('id', productId)
      .eq('tenant_id', tenantId)

    if (updateError) {
      console.error('Failed to update hero_image_url:', updateError)
      // Don't throw error here as the image upload was successful
    }
  }

  revalidateTag(tenantProductsTag(tenantId))
  return urlData.publicUrl
}

// Internal function for actual database query
async function _getProductsFromDB(searchParams: {
  search?: string
  status?: string
  category?: string
  page?: string
  sort?: string
}, tenantId: string) {
  // Check if Supabase is configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase configuration missing')
  }

  let query = supabaseAdmin
    .from('products')
    .select(`
      id,
      name,
      slug,
      status,
      price_cents,
      stock,
      created_at,
      updated_at
    `)
    .eq('tenant_id', tenantId)

  // Apply search filter
  if (searchParams.search) {
    query = query.ilike('name', `%${searchParams.search}%`)
  }

  // Apply status filter
  if (searchParams.status && searchParams.status !== 'all') {
    query = query.eq('status', adaptProductStatus(searchParams.status))
  }

  // Apply category filter
  if (searchParams.category && searchParams.category !== 'all') {
    query = query.eq('category_id', searchParams.category)
  }

  // Apply sorting
  const sortField = searchParams.sort || 'created_at'
  const sortOrder = sortField === 'name' ? 'asc' : 'desc'
  query = query.order(sortField, { ascending: sortOrder === 'asc' })

  // Apply pagination
  const page = parseInt(searchParams.page || '1')
  const pageSize = 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`)
  }

  return {
    data: data || [],
    count: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize)
  }
}

// Cached version of getProducts
const getCachedProducts = unstable_cache(
  async (searchParams: {
    search?: string
    status?: string
    category?: string
    page?: string
    sort?: string
  }, tenantId: string) => {
    return await _getProductsFromDB(searchParams, tenantId)
  },
  ['products'],
  {
    tags: ['products'],
    revalidate: 30 // Reduced cache time to 30 seconds for faster updates
  }
)

export async function getProducts(searchParams: {
  search?: string
  status?: string
  category?: string
  page?: string
  sort?: string
}, tenantIdArg?: string) {
  try {
    const tenantId = tenantIdArg || await resolveTenantIdFromRequest()
    if (!tenantId) { throw new Error('Tenant not found') }
    
    // During initial server render, the user session may not yet be resolvable in RSC.
    // To avoid crashing the page, return an empty dataset when unauthenticated.
    // All mutations remain strictly server-gated via assertTenantAdmin.
    const userId = await getAuthenticatedUserId()
    const hasCookie = await hasAuthCookie()
    if (!userId && !hasCookie) {
      return {
        data: [],
        count: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0
      }
    }

    // Use cached version for better performance and proper cache invalidation
    return await getCachedProducts(searchParams, tenantId)
  } catch (error) {
    console.error('getProducts error:', error)
    throw error
  }
}

// Internal function for actual database query
async function _getCategoriesFromDB(tenantId: string) {
  // Check if Supabase is configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase configuration missing')
  }

  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('id, name, slug, parent_id, image_url, image_alt, created_at')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`)
  }

  const rows = (data ?? []) as Array<{ id: string; name: string; slug: string; parent_id: string | null; image_url?: string | null; image_alt?: string | null; created_at: string }>
  return rows.map(category => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    parent_id: category.parent_id,
    image_url: category.image_url ?? null,
    image_alt: category.image_alt ?? null,
    created_at: category.created_at
  }))
}

// Cached version of getCategories
const getCachedCategories = unstable_cache(
  async (tenantId: string) => {
    return await _getCategoriesFromDB(tenantId)
  },
  ['categories'],
  {
    tags: ['categories'],
    revalidate: 60 // Cache for 60 seconds
  }
)

export async function getCategories(tenantIdArg?: string) {
  try {
    const tenantId = tenantIdArg || await resolveTenantIdFromRequest()
    if (!tenantId) { throw new Error('Tenant not found') }
    
    // See note in getProducts: avoid SSR crash; return empty when unauthenticated.
    const userId = await getAuthenticatedUserId()
    const hasCookie = await hasAuthCookie()
    if (!userId && !hasCookie) {
      return [] as Array<{ id: string; name: string; slug: string; created_at: string }>
    }

    // Use cached version for better performance and proper cache invalidation
    return await getCachedCategories(tenantId)
  } catch (error) {
    console.error('getCategories error:', error)
    throw error
  }
}

// Dedicated variant update action for isolated variant operations
export async function updateProductVariants(
  productId: string,
  variantData: {
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
  }
) {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      throw new Error('Tenant not found')
    }

    // Strict validation when variants are enabled
    if (variantData.hasVariants) {
      const problems: string[] = []
      if (!Array.isArray(variantData.variantOptions) || variantData.variantOptions.length === 0) {
        problems.push('At least one variant option is required when variants are enabled.')
      }
      if (!Array.isArray(variantData.variantCombinations) || variantData.variantCombinations.length === 0) {
        problems.push('At least one variant combination is required when variants are enabled.')
      }

      // Validate options/values
      for (const opt of variantData.variantOptions || []) {
        if (!opt || typeof opt.name !== 'string' || !opt.name.trim()) {
          problems.push('Each variant option must have a non-empty name.')
        }
        if (!Array.isArray(opt.values) || opt.values.length === 0) {
          problems.push(`Option "${opt?.displayName || opt?.name || 'unknown'}" must include at least one value.`)
        }
        for (const val of opt.values || []) {
          if (!val || typeof val.value !== 'string' || !val.value.trim()) {
            problems.push(`Option value is required for "${opt?.displayName || opt?.name || 'unknown'}".`)
          }
          if (val.priceAdjustmentCents != null && Number(val.priceAdjustmentCents) < 0) {
            problems.push('Value priceAdjustmentCents cannot be negative.')
          }
          if (val.costAdjustmentCents != null && Number(val.costAdjustmentCents) < 0) {
            problems.push('Value costAdjustmentCents cannot be negative.')
          }
        }
      }

      // Validate combinations
      for (const combo of variantData.variantCombinations || []) {
        if (combo.priceCents == null || Number.isNaN(Number(combo.priceCents)) || Number(combo.priceCents) < 0) {
          problems.push('Each combination requires priceCents ≥ 0.')
        }
        if (combo.stock == null || Number.isNaN(Number(combo.stock)) || Number(combo.stock) < 0) {
          problems.push('Each combination requires stock ≥ 0.')
        }
        if (!combo.options || typeof combo.options !== 'object' || Object.keys(combo.options).length === 0) {
          problems.push('Each combination must specify option selections.')
        }
      }

      if (problems.length > 0) {
        throw new Error(`Variant validation failed: ${problems.join(' ')}`)
      }
    }

    console.log('DEBUG: Starting variant update for product:', productId)
    console.log('DEBUG: Variant payload received:', {
      hasVariants: variantData.hasVariants,
      optionsCount: variantData.variantOptions.length,
      combinationsCount: variantData.variantCombinations.length
    })

    // Step 1: Update the product's has_variants flag
    const { error: productError } = await supabaseAdmin
      .from('products')
      .update({ has_variants: variantData.hasVariants })
      .eq('id', productId)
      .eq('tenant_id', tenantId)

    if (productError) {
      console.error('DEBUG: Failed to update product has_variants:', productError)
      throw productError
    }

    console.log('DEBUG: Product has_variants updated to:', variantData.hasVariants)

    // Step 2: Handle variant options with UPSERT
    if (variantData.hasVariants && variantData.variantOptions.length > 0) {
      const variantOptionPromises = variantData.variantOptions.map(async (option) => {
        console.log('DEBUG: Processing variant option:', option.name)
        
        // UPSERT variant option
        const { data: variantOption, error: optionError } = await supabaseAdmin
          .from('variant_options')
          .upsert({
            tenant_id: tenantId,
            name: option.name,
            display_name: option.displayName,
            type: option.type,
            required: option.required,
            sort_order: 0
          }, {
            onConflict: 'tenant_id,name'
          })
          .select()
          .single()

        if (optionError) {
          console.error('DEBUG: Failed to upsert variant option:', optionError)
          throw optionError
        }

        console.log('DEBUG: Variant option upserted:', variantOption)

        // UPSERT product variant option link
        await supabaseAdmin
          .from('product_variant_options')
          .upsert({
            tenant_id: tenantId,
            product_id: productId,
            option_id: variantOption.id
          }, {
            onConflict: 'product_id,option_id'
          })

        // UPSERT variant option values
        if (option.values && option.values.length > 0) {
          const valuePromises = option.values.map(async (value) => {
            console.log('DEBUG: Processing variant value:', value.value)
            
            const { error: valueError } = await supabaseAdmin
              .from('variant_option_values')
              .upsert({
                tenant_id: tenantId,
                option_id: variantOption.id,
                value: value.value,
                display_value: value.displayValue,
                color_hex: value.colorHex || null,
                image_url: value.imageUrl || null,
                price_adjustment_cents: value.priceAdjustmentCents || 0,
                cost_adjustment_cents: value.costAdjustmentCents || 0
              }, {
                onConflict: 'option_id,value'
              })

            if (valueError) {
              console.error('DEBUG: Failed to upsert variant value:', valueError)
              throw valueError
            }

            console.log('DEBUG: Variant value upserted:', value.value)
          })

          await Promise.all(valuePromises)
        }
      })

      await Promise.all(variantOptionPromises)
    }

    // Step 3: Handle variant combinations
    if (variantData.variantCombinations && variantData.variantCombinations.length > 0) {
      console.log('DEBUG: Processing variant combinations:', variantData.variantCombinations.length)
      
      // Build client -> DB ID mappings for options and values
      // Map client option id -> option name
      const clientOptionIdToName = new Map<string, string>()
      // Map option name -> DB option id
      const optionNameToDbId = new Map<string, string>()
      // Map composite key (dbOptionId + '::' + value) -> dbValueId
      const optionValueKeyToDbValueId = new Map<string, string>()

      for (const option of variantData.variantOptions) {
        clientOptionIdToName.set(option.id, option.name)

        // Fetch DB option id by unique (tenant_id, name)
        const { data: dbOption, error: fetchOptionErr } = await supabaseAdmin
          .from('variant_options')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('name', option.name)
          .single()

        if (fetchOptionErr || !dbOption) {
          console.error('DEBUG: Failed to resolve DB option id for', option.name, fetchOptionErr)
          continue
        }
        optionNameToDbId.set(option.name, dbOption.id)

        // Resolve all value IDs for this option in a single query
        const values = (option.values || []).map(v => v.value).filter(Boolean)
        if (values.length > 0) {
          const { data: dbValues, error: fetchValuesErr } = await supabaseAdmin
            .from('variant_option_values')
            .select('id, value')
            .eq('tenant_id', tenantId)
            .eq('option_id', dbOption.id)
            .in('value', values)

          if (fetchValuesErr) {
            console.error('DEBUG: Failed to resolve DB value ids for option', option.name, fetchValuesErr)
          } else {
            for (const row of dbValues || []) {
              optionValueKeyToDbValueId.set(`${dbOption.id}::${row.value}`, row.id)
            }
          }
        }
      }

      // Delete existing variants (cascades remove variant_combinations)
      const { error: deleteError } = await supabaseAdmin
        .from('product_variants')
        .delete()
        .eq('product_id', productId)
        .eq('tenant_id', tenantId)

      if (deleteError) {
        console.error('DEBUG: Failed to delete existing variants:', deleteError)
        throw deleteError
      }

      // Insert new variants and their combinations using DB UUIDs
      const combinationPromises = variantData.variantCombinations.map(async (combo) => {
        // Transform client option/value IDs -> DB UUIDs
        const transformedAttributes: Record<string, string> = {}
        const optionPairs: Array<{ optionId: string; valueId: string; valueStr?: string }> = []

        for (const [clientOptionId, clientValueId] of Object.entries(combo.options || {})) {
          const optionName = clientOptionIdToName.get(clientOptionId)
          if (!optionName) continue
          const dbOptionId = optionNameToDbId.get(optionName)
          if (!dbOptionId) continue

          // Find the value string for this client value id within the payload option
          const optionPayload = variantData.variantOptions.find(o => o.id === clientOptionId)
          const valuePayload = optionPayload?.values?.find(v => v.id === clientValueId)
          const valueStr = valuePayload?.value
          if (!valueStr) continue

          const dbValueId = optionValueKeyToDbValueId.get(`${dbOptionId}::${valueStr}`)
          if (!dbValueId) continue

          transformedAttributes[dbOptionId] = dbValueId
          optionPairs.push({ optionId: dbOptionId, valueId: dbValueId, valueStr })
        }

        // Derive variant display name from value display strings if available
        const nameParts: string[] = []
        for (const pair of optionPairs) {
          // Best-effort get display_value for readability (optional)
          nameParts.push(pair.valueStr || pair.valueId)
        }
        const variantName = nameParts.join(' - ') || `Variant ${String(combo.id).slice(0, 8)}`

        const { data: variantRow, error: variantError } = await supabaseAdmin
          .from('product_variants')
          .insert({
            tenant_id: tenantId,
            product_id: productId,
            name: variantName,
            sku: combo.sku || '',
            price_cents: combo.priceCents || 0,
            stock: combo.stock || 0,
            attributes: transformedAttributes
          })
          .select('id')
          .single()

        if (variantError) {
          console.error('DEBUG: Failed to insert variant row:', variantError)
          throw variantError
        }

        // Insert variant_combinations rows
        if (optionPairs.length > 0) {
          const rows = optionPairs.map(p => ({
            tenant_id: tenantId,
            product_id: productId,
            variant_id: variantRow!.id,
            option_id: p.optionId,
            option_value_id: p.valueId
          }))

          const { error: combosErr } = await supabaseAdmin
            .from('variant_combinations')
            .insert(rows)

          if (combosErr) {
            console.error('DEBUG: Failed to insert variant_combinations:', combosErr)
            throw combosErr
          }
        }
      })

      await Promise.all(combinationPromises)
    } else {
      // If no variant combinations, delete existing ones
      const { error: deleteError } = await supabaseAdmin
        .from('product_variants')
        .delete()
        .eq('product_id', productId)
        .eq('tenant_id', tenantId)

      if (deleteError) {
        console.error('DEBUG: Failed to delete existing variants:', deleteError)
        throw deleteError
      }
    }

    console.log('DEBUG: Variant update completed successfully')

    return { success: true }
  } catch (error) {
    console.error('DEBUG: updateProductVariants failed:', error)
    throw error
  }
}
