'use server'

import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { assertTenantAdmin } from '@/server/auth'
import { revalidateTag } from 'next/cache'
import { tenantProductsTag } from '@/server/cacheTags'

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
  sizeGuides?: Record<string, unknown>[]
  sizeGuideId?: string
  images?: string[]
}

export async function createProduct(formData: FormData) {
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
    sizeGuides: JSON.parse(formData.get('sizeGuides') as string || '[]'),
    sizeGuideId: formData.get('sizeGuideId') as string
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
      status: productData.status
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create product: ${error.message}`)
  }

  // Handle category assignment
  if (productData.category_id) {
    await supabaseAdmin
      .from('product_categories')
      .insert({
        product_id: product.id,
        category_id: productData.category_id
      })
  }

  // Handle image uploads
  if (productData.images && productData.images.length > 0) {
    const imagePromises = productData.images.map(async (imageUrl: string, index: number) => {
      return supabaseAdmin
        .from('product_images')
        .insert({
          product_id: product.id,
          image_url: imageUrl,
          alt_text: `Product image ${index + 1}`,
          sort_order: index
        })
    })
    await Promise.all(imagePromises)
  }

  revalidateTag(tenantProductsTag(tenantId))
  return product
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
    sizeGuides: JSON.parse(formData.get('sizeGuides') as string || '[]'),
    sizeGuideId: formData.get('sizeGuideId') as string
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
      status: productData.status
    })
    .eq('id', productId)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update product: ${error.message}`)
  }

  // Handle category assignment
  if (productData.category_id) {
    // Remove existing categories
    await supabaseAdmin
      .from('product_categories')
      .delete()
      .eq('product_id', productId)

    // Add new category
    await supabaseAdmin
      .from('product_categories')
      .insert({
        product_id: productId,
        category_id: productData.category_id
      })
  }

  // Handle image uploads
  if (productData.images && productData.images.length > 0) {
    // Remove existing images
    await supabaseAdmin
      .from('product_images')
      .delete()
      .eq('product_id', productId)

    // Add new images
    const imagePromises = productData.images.map(async (imageUrl: string, index: number) => {
      return supabaseAdmin
        .from('product_images')
        .insert({
          product_id: productId,
          image_url: imageUrl,
          alt_text: `Product image ${index + 1}`,
          sort_order: index
        })
    })
    await Promise.all(imagePromises)
  }

  revalidateTag(tenantProductsTag(tenantId))
  return product
}

export async function bulkDeleteProducts(productIds: string[]) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) { throw new Error('Tenant not found') }
  await assertTenantAdmin(tenantId)

  const { error } = await supabaseAdmin
    .from('products')
    .delete()
    .in('id', productIds)
    .eq('tenant_id', tenantId)

  if (error) {
    throw new Error(`Failed to delete products: ${error.message}`)
  }

  revalidateTag(tenantProductsTag(tenantId))
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

  // Insert image record
  const { error: imageError } = await supabaseAdmin
    .from('product_images')
    .insert({
      product_id: productId,
      image_url: urlData.publicUrl,
      alt_text: file.name,
      sort_order: 0
    })

  if (imageError) {
    throw new Error(`Failed to save image record: ${imageError.message}`)
  }

  revalidateTag(tenantProductsTag(tenantId))
  return urlData.publicUrl
}

export async function getProducts(searchParams: {
  search?: string
  status?: string
  category?: string
  page?: string
  sort?: string
}) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) { throw new Error('Tenant not found') }
  await assertTenantAdmin(tenantId)

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

export async function getCategories() {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) { throw new Error('Tenant not found') }
  await assertTenantAdmin(tenantId)

  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`)
  }

  return data || []
}
