'use server'

import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { assertTenantAdmin, getAuthenticatedUserId, hasAuthCookie } from '@/server/auth'
import { revalidateTag, unstable_cache } from 'next/cache'
import { tenantProductsTag } from '@/server/cacheTags'
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
      tenantId = await resolveTenantIdFromRequest()
      if (!tenantId) {
        throw new Error('Tenant not found')
      }
      
      await assertTenantAdmin(tenantId)

      // GUARDRAIL: Validate module access
      await validateModuleAccess(tenantId, 'products', 'create')

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
    .insert({
      tenant_id: tenantId,
      name: productData.name,
      slug: productData.slug,
      description: productData.description,
      price_cents: productData.price_cents,
      compare_at_price_cents: productData.compare_at_price_cents,
      cost_per_item_cents: productData.cost_per_item_cents,
      stock: productData.stock,
      sku: productData.sku,
      weight: productData.weight,
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
      status: productData.status,
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
        category_id: productData.category_id
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
          tenant_id: tenantId,
          url: imageUrl,
          alt: `Product image ${index + 1}`,
          sort_order: index
        })
    })
    await Promise.all(imagePromises)
  }

  // Handle variant options
  if (Array.isArray(productData.variantOptions) && productData.variantOptions.length > 0) {
    const variantOptionPromises = productData.variantOptions.map(async (option: Record<string, unknown>) => {
      // First, create the variant option
      const { data: variantOption, error: optionError } = await supabaseAdmin
        .from('variant_options')
        .insert({
          tenant_id: tenantId,
          name: option.name as string,
          display_name: option.displayName as string,
          type: option.type as string,
          required: option.required as boolean,
          sort_order: 0
        })
        .select()
        .single()

      if (optionError) throw optionError

      // Link the option to the product
      await supabaseAdmin
        .from('product_variant_options')
        .insert({
          tenant_id: tenantId,
          product_id: product.id,
          option_id: variantOption.id
        })

      // Create option values
      const optionValues = Array.isArray((option as Record<string, unknown> & { values?: Record<string, unknown>[] }).values)
        ? ((option as Record<string, unknown> & { values?: Record<string, unknown>[] }).values as Record<string, unknown>[])
        : []
      if (optionValues.length > 0) {
        const valuePromises = optionValues.map(async (value: Record<string, unknown>) => {
          return supabaseAdmin
            .from('variant_option_values')
            .insert({
              tenant_id: tenantId,
              option_id: variantOption.id,
              value: value.value as string,
              display_value: value.displayValue as string,
              color_hex: value.colorHex as string,
              image_url: value.imageUrl as string
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
          tenant_id: tenantId,
          product_id: product.id,
          name: `Variant ${combo.id}`,
          sku: combo.sku as string,
          price_cents: combo.priceCents as number,
          stock: combo.stock as number,
          attributes: combo.options as Record<string, unknown>
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
              tenant_id: tenantId,
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

      // GUARDRAIL: Success logging and cache invalidation
      revalidateTag(tenantProductsTag(tenantId))

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
      weight: productData.weight,
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
      status: productData.status,
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

  // Handle category assignment
  // Remove existing categories first
  await supabaseAdmin
    .from('product_categories')
    .delete()
    .eq('product_id', productId)

  // Add new category if one is selected
  if (productData.category_id && productData.category_id.trim() !== '') {
    await supabaseAdmin
      .from('product_categories')
      .insert({
        product_id: productId,
        category_id: productData.category_id
      })
  }

  // Handle image uploads
  const normalizedImagesUpdate = normalizeImageInputs(productData.images || [])
  if (normalizedImagesUpdate.length > 0) {
    // Remove existing images
    await supabaseAdmin
      .from('product_images')
      .delete()
      .eq('product_id', productId)

    // Add new images
    const imagePromises = normalizedImagesUpdate.map(async (imageUrl: string, index: number) => {
      return supabaseAdmin
        .from('product_images')
        .insert({
          product_id: productId,
          tenant_id: tenantId,
          url: imageUrl,
          alt: `Product image ${index + 1}`,
          sort_order: index
        })
    })
    await Promise.all(imagePromises)
  }

  // Handle variant options update
  if (Array.isArray(productData.variantOptions)) {
    // Remove existing variant options and related data
    await supabaseAdmin
      .from('product_variant_options')
      .delete()
      .eq('product_id', productId)

    await supabaseAdmin
      .from('variant_combinations')
      .delete()
      .eq('product_id', productId)

    await supabaseAdmin
      .from('product_variants')
      .delete()
      .eq('product_id', productId)

    // Get all option IDs that need to be cleaned up
    const { data: existingOptions } = await supabaseAdmin
      .from('product_variant_options')
      .select('option_id')
      .eq('product_id', productId)

    if (existingOptions && existingOptions.length > 0) {
      const optionIds = existingOptions.map(opt => opt.option_id)
      await supabaseAdmin
        .from('variant_option_values')
        .delete()
        .in('option_id', optionIds)

      await supabaseAdmin
        .from('variant_options')
        .delete()
        .in('id', optionIds)
    }

    // Add new variant options
    if (productData.variantOptions.length > 0) {
      const variantOptionPromises = productData.variantOptions.map(async (option: Record<string, unknown>) => {
        // First, create the variant option
        const { data: variantOption, error: optionError } = await supabaseAdmin
          .from('variant_options')
          .insert({
            tenant_id: tenantId,
            name: option.name as string,
            display_name: option.displayName as string,
            type: option.type as string,
            required: option.required as boolean,
            sort_order: 0
          })
          .select()
          .single()

        if (optionError) throw optionError

        // Link the option to the product
        await supabaseAdmin
          .from('product_variant_options')
          .insert({
            tenant_id: tenantId,
            product_id: productId,
            option_id: variantOption.id
          })

        // Create option values
        const optionValues = Array.isArray((option as Record<string, unknown> & { values?: Record<string, unknown>[] }).values)
          ? ((option as Record<string, unknown> & { values?: Record<string, unknown>[] }).values as Record<string, unknown>[])
          : []
        if (optionValues.length > 0) {
          const valuePromises = optionValues.map(async (value: Record<string, unknown>) => {
            return supabaseAdmin
              .from('variant_option_values')
              .insert({
                tenant_id: tenantId,
                option_id: variantOption.id,
                value: value.value as string,
                display_value: value.displayValue as string,
                color_hex: value.colorHex as string,
                image_url: value.imageUrl as string
              })
          })
          await Promise.all(valuePromises)
        }

        return variantOption
      })
      await Promise.all(variantOptionPromises)
    }
  }

  // Handle variant combinations update
  if (Array.isArray(productData.variantCombinations)) {
    // Remove existing combinations
    await supabaseAdmin
      .from('variant_combinations')
      .delete()
      .eq('product_id', productId)

    await supabaseAdmin
      .from('product_variants')
      .delete()
      .eq('product_id', productId)

    // Add new combinations
    if (productData.variantCombinations.length > 0) {
      const combinationPromises = productData.variantCombinations.map(async (combo: Record<string, unknown>) => {
        // Create the variant combination
        const { data: variant, error: variantError } = await supabaseAdmin
          .from('product_variants')
          .insert({
            tenant_id: tenantId,
            product_id: productId,
            name: `Variant ${combo.id}`,
            sku: combo.sku as string,
            price_cents: combo.priceCents as number,
            stock: combo.stock as number,
            attributes: combo.options as Record<string, unknown>
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
                tenant_id: tenantId,
                product_id: productId,
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
  }

  revalidateTag(tenantProductsTag(tenantId))
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

    // Invalidate relevant caches
    revalidateTag(tenantProductsTag(tenantId))

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
  revalidateTag(tenantProductsTag(tenantId))

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
    .update({ status })
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
      tenant_id: tenantId,
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
    query = query.eq('status', searchParams.status)
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
    revalidate: 60 // Cache for 60 seconds
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
