import { supabaseAdmin } from '@/server/supabaseAdmin'

export async function fetchPublishedProducts(tenantId: string) {
  return supabaseAdmin
    .from('products')
    .select('id, name, slug, description, price_cents, compare_at_price_cents, stock, currency, hero_image_url, low_stock_threshold, is_featured, is_bestseller, is_new_arrival, is_on_sale, is_limited_edition, is_sold_out, custom_badge_text, badge_color, badge_priority, badge_display_until, badge_display_from, status')
    .eq('tenant_id', tenantId)
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
}

export type ProductListItem = {
  id: string
  name: string
  slug: string
  description: string | null
  price_cents: number
  compare_at_price_cents?: number | null
  currency: string
  hero_image_url: string | null
  stock: number
  status: 'draft' | 'published'
  low_stock_threshold?: number | null
  // Badge System (optional until migration is applied)
  is_featured?: boolean
  is_bestseller?: boolean
  is_new_arrival?: boolean
  is_on_sale?: boolean
  is_limited_edition?: boolean
  is_sold_out?: boolean
  custom_badge_text?: string | null
  badge_color?: string | undefined
  badge_priority?: number | null
  badge_display_until?: string | undefined
  badge_display_from?: string | undefined
  // Variant options for PLP cards
  product_variant_options?: {
    variant_options: {
      id: string
      name: string
      display_name: string
      type: string
      sort_order: number
      variant_option_values: {
        id: string
        value: string
        display_value: string
        color_hex: string | null | undefined
        image_url: string | null | undefined
        sort_order: number | null
        price_adjustment_cents: number | null | undefined
        cost_adjustment_cents: number | null | undefined
      }[]
    }
  }[]
}

export type ProductListParams = {
  sort?: 'updated_at' | 'price_cents' | 'name'
  dir?: 'asc' | 'desc'
  page?: number
  pageSize?: number
  q?: string
  minPriceCents?: number
  maxPriceCents?: number
  
  // Category filters
  categoryId?: string // Single category ID (legacy)
  categorySlugs?: string[] // Multiple category slugs (new)
  
  // Badge filters
  is_featured?: boolean
  is_bestseller?: boolean
  is_new_arrival?: boolean
  is_on_sale?: boolean
  is_limited_edition?: boolean
  is_sold_out?: boolean
  
  // Tag filters
  tag?: string
  tags?: string[]
  
  // Filter presets
  filter?: string
}

export async function fetchPublishedProductsPaged(
  tenantId: string,
  params: ProductListParams & { categoryId?: string }
) {
  const { 
    sort = 'updated_at', 
    dir = 'desc', 
    page = 1, 
    pageSize = 12, 
    q, 
    minPriceCents, 
    maxPriceCents, 
    categoryId,
    is_featured,
    is_bestseller,
    is_new_arrival,
    is_on_sale,
    is_limited_edition,
    is_sold_out,
    tag,
    tags,
    filter
  } = params
  
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  let selectCols = 'id, name, slug, description, price_cents, compare_at_price_cents, stock, currency, hero_image_url, low_stock_threshold, is_featured, is_bestseller, is_new_arrival, is_on_sale, is_limited_edition, is_sold_out, custom_badge_text, badge_color, badge_priority, badge_display_until, badge_display_from, tags'
  
  if (categoryId) {
    selectCols += ', product_categories!inner(category_id)'
  }
  
  let query = supabaseAdmin
    .from('products')
    .select(selectCols, { count: 'exact' })
    .eq('tenant_id', tenantId)
    .eq('status', 'published')
    
  if (categoryId) {
    query = query.eq('product_categories.category_id', categoryId)
  }
  
  if (q && q.trim()) {
    query = query.ilike('name', `%${q.trim()}%`)
  }
  
  if (typeof minPriceCents === 'number' && !Number.isNaN(minPriceCents)) {
    query = query.gte('price_cents', minPriceCents)
  }
  
  if (typeof maxPriceCents === 'number' && !Number.isNaN(maxPriceCents)) {
    query = query.lte('price_cents', maxPriceCents)
  }
  
  // Badge filters
  if (is_featured !== undefined) {
    query = query.eq('is_featured', is_featured)
  }
  if (is_bestseller !== undefined) {
    query = query.eq('is_bestseller', is_bestseller)
  }
  if (is_new_arrival !== undefined) {
    query = query.eq('is_new_arrival', is_new_arrival)
  }
  if (is_on_sale !== undefined) {
    query = query.eq('is_on_sale', is_on_sale)
  }
  if (is_limited_edition !== undefined) {
    query = query.eq('is_limited_edition', is_limited_edition)
  }
  if (is_sold_out !== undefined) {
    query = query.eq('is_sold_out', is_sold_out)
  }
  
  // Tag filters
  if (tag) {
    query = query.contains('tags', [tag])
  }
  if (tags && tags.length > 0) {
    query = query.overlaps('tags', tags)
  }
  
  // Filter presets - handle common badge-based filters
  if (filter) {
    switch (filter) {
      case 'featured':
        query = query.eq('is_featured', true)
        break
      case 'new-arrivals':
        query = query.eq('is_new_arrival', true)
        break
      case 'sale':
        query = query.eq('is_on_sale', true)
        break
      case 'bestsellers':
        query = query.eq('is_bestseller', true)
        break
      // Add more preset cases as needed
    }
  }
  
  // Apply sorting
  const { data, count, error } = await query.order(sort, { ascending: dir === 'asc' }).range(from, to)
  return { data, count, error }
}

export async function fetchProductBySlug(tenantId: string, slug: string) {
  return supabaseAdmin
    .from('products')
    .select(`
      id, name, slug, description, price_cents, compare_at_price_cents, currency, hero_image_url, meta_title, meta_description,
      product_size_guides(
        size_guides(
          id, name, category, gender, measurements
        )
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .maybeSingle()
}

export async function fetchProductImages(tenantId: string, productId: string) {
  const { data, error } = await supabaseAdmin
    .from('product_images')
    .select('id, url, alt, sort_order')
    .eq('tenant_id', tenantId)
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })

  if (error || !data) {
    // On error, fail gracefully with an empty array – the caller can decide what to show.
    console.error('[fetchProductImages] query error', error)
    return []
  }

  // Helper to fix single-slash protocol and trim.
  const sanitizeUrl = (raw?: string | null): string => {
    if (!raw) return ''
    return raw
      .trim()
      .replace(/^(https?:)\/(?!\/)/, '$1//')
      .replace(/\/+$/, '')
  }

  const urlRegex = /https?:\/\/[^\s'"\]\)]+/g
  const transformed: Array<{ id: string; url: string; alt?: string | null; sort_order: number }> = []
  // Accept only images that live under this product's folder path
  const folderPrefix = `/storage/v1/object/public/product-images/${productId}/`
  const allowedExt = /\.(png|jpe?g|webp|gif|avif|svg)$/i
  const seen = new Set<string>()

  const isValid = (u: string): boolean => {
    if (!u.includes(folderPrefix)) return false
    try {
      const { pathname } = new URL(u)
      return allowedExt.test(pathname)
    } catch {
      return false
    }
  }

  for (const row of data) {
    if (row.url && (row.url.includes('[') || row.url.includes('%22') || row.url.includes('"'))) {
      // Corrupted JSON-like blob – pull every URL out.
      const matches = (row.url.match(urlRegex) ?? []) as string[]
      let localIdx = 0
      for (const raw of matches) {
        const clean = sanitizeUrl(raw)
        if (!clean || !isValid(clean) || seen.has(clean)) continue
        seen.add(clean)
        transformed.push({
          id: `${row.id}-${localIdx}`,
          url: clean,
          alt: row.alt,
          sort_order: (row.sort_order || 0) + localIdx,
        })
        localIdx += 1
      }
      if (seen.size) {
        continue
      }
      // If no usable url found, fall through to push sanitized original.
    }

    const clean = sanitizeUrl(row.url)
    if (clean && isValid(clean) && !seen.has(clean)) {
      seen.add(clean)
      transformed.push({
        id: row.id,
        url: clean,
        alt: row.alt,
        sort_order: row.sort_order,
      })
    }
  }

  // Ensure consistent ordering after expansion
  transformed.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  return transformed
}

export async function fetchProductVariantOptions(tenantId: string, productId: string) {
  // First get the variant options structure (without values)
  const { data, error } = await supabaseAdmin
    .from('product_variant_options')
    .select(`
      variant_options(
        id,
        name,
        display_name,
        type,
        sort_order
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[fetchProductVariantOptions] query error', error)
    return []
  }

  if (!data || data.length === 0) return []

  // Get variant combinations for this product to see which values are actually used
  const { data: variants } = await supabaseAdmin
    .from('product_variants')
    .select('attributes')
    .eq('product_id', productId)
    .eq('tenant_id', tenantId)

  if (!variants || variants.length === 0) {
    // No variants exist, so no values should be shown
    return data.map(item => {
      const variantOption = (item as any).variant_options
      return {
        variant_options: {
          id: variantOption.id,
          name: variantOption.name,
          display_name: variantOption.display_name,
          type: variantOption.type,
          variant_option_values: []
        }
      }
    })
  }

  // Extract used option-value pairs from variant combinations
  const usedOptionValues = new Map<string, Set<string>>()
  variants.forEach((variant: any) => {
    const attributes = variant.attributes || {}
    Object.entries(attributes).forEach(([optionId, valueId]) => {
      if (!usedOptionValues.has(optionId)) {
        usedOptionValues.set(optionId, new Set())
      }
      usedOptionValues.get(optionId)!.add(valueId as string)
    })
  })

  // Load only the variant option values that are actually used
  const cleanedOptions = await Promise.all(
    data.map(async (item) => {
      const variantOption = (item as any).variant_options
      const usedValueIds = usedOptionValues.get(variantOption.id)

      if (!usedValueIds || usedValueIds.size === 0) {
        // No values used for this option
        return {
          variant_options: {
            id: variantOption.id,
            name: variantOption.name,
            display_name: variantOption.display_name,
            type: variantOption.type,
            variant_option_values: []
          }
        }
      }

      // Fetch only the used values
      const { data: optionValues } = await supabaseAdmin
        .from('variant_option_values')
        .select('id, value, display_value, color_hex, image_url, sort_order, price_adjustment_cents, cost_adjustment_cents')
        .eq('option_id', variantOption.id)
        .in('id', Array.from(usedValueIds))
        .order('sort_order', { ascending: true })

      return {
        variant_options: {
          id: variantOption.id,
          name: variantOption.name,
          display_name: variantOption.display_name,
          type: variantOption.type,
          variant_option_values: (optionValues || []).map((value: any) => ({
            id: value.id,
            value: value.value,
            display_value: value.display_value,
            color_hex: value.color_hex,
            image_url: value.image_url,
            sort_order: value.sort_order,
            price_adjustment_cents: value.price_adjustment_cents,
            cost_adjustment_cents: value.cost_adjustment_cents
          }))
        }
      }
    })
  )

  return cleanedOptions
}

export async function fetchProductVariants(tenantId: string, productId: string) {
  const { data, error } = await supabaseAdmin
    .from('product_variants')
    .select(`
      id,
      name,
      sku,
      price_cents,
      compare_at_price_cents,
      cost_cents,
      stock,
      weight_grams,
      barcode,
      track_inventory,
      allow_backorders,
      is_active,
      attributes
    `)
    .eq('tenant_id', tenantId)
    .eq('product_id', productId)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('[fetchProductVariants] query error', error)
    return []
  }

  return data || []
}

// Bulk fetch variant combinations for multiple products (used by PLP/collections)
export async function fetchVariantsForProducts(
  tenantId: string,
  productIds: string[]
) {
  if (!productIds || productIds.length === 0) return []
  const { data, error } = await supabaseAdmin
    .from('product_variants')
    .select('id, name, sku, price_cents, stock, attributes, product_id')
    .eq('tenant_id', tenantId)
    .in('product_id', productIds)
    .eq('is_active', true)

  if (error) {
    console.error('[fetchVariantsForProducts] query error', error)
    return []
  }

  return data || []
}

// New function to fetch products with variant options for PLP
export async function fetchPublishedProductsWithVariants(tenantId: string) {
  const { data: products, error: productsError } = await supabaseAdmin
    .from('products')
    .select(`
      id, name, slug, description, price_cents, compare_at_price_cents, stock, currency, 
      hero_image_url, low_stock_threshold, is_featured, is_bestseller, is_new_arrival, 
      is_on_sale, is_limited_edition, is_sold_out, custom_badge_text, badge_color, 
      badge_priority, badge_display_until, badge_display_from,
      product_variant_options(
        variant_options(
          id, name, display_name, type, sort_order,
          variant_option_values(
            id, value, display_value, color_hex, image_url, sort_order, price_adjustment_cents, cost_adjustment_cents
          )
        )
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('status', 'published')
    .order('updated_at', { ascending: false })

  if (productsError) {
    console.error('[fetchPublishedProductsWithVariants] error:', productsError)
    return { data: [], error: productsError }
  }

  if (!products || products.length === 0) {
    return { data: [], error: null }
  }

  // Fix ghost variants: Load only variant option values that are actually used
  const productsWithCleanVariants = await Promise.all(
    products.map(async (product: any) => {
      if (!product.product_variant_options || product.product_variant_options.length === 0) {
        return product
      }

      // Get variant combinations for this product
      const { data: variants } = await supabaseAdmin
        .from('product_variants')
        .select('attributes')
        .eq('product_id', product.id)
        .eq('tenant_id', tenantId)

      if (!variants || variants.length === 0) {
        // No variants exist, so no values should be shown
        const cleanedOptions = product.product_variant_options.map((pvo: any) => ({
          ...pvo,
          variant_options: {
            ...pvo.variant_options,
            variant_option_values: []
          }
        }))
        return { ...product, product_variant_options: cleanedOptions }
      }

      // Extract used option-value pairs
      const usedOptionValues = new Map<string, Set<string>>()
      variants.forEach((variant: any) => {
        const attributes = variant.attributes || {}
        Object.entries(attributes).forEach(([optionId, valueId]) => {
          if (!usedOptionValues.has(optionId)) {
            usedOptionValues.set(optionId, new Set())
          }
          usedOptionValues.get(optionId)!.add(valueId as string)
        })
      })

      // Load only used values
      const cleanedOptions = await Promise.all(
        product.product_variant_options.map(async (pvo: any) => {
          const option = pvo.variant_options
          const usedValueIds = usedOptionValues.get(option.id)

          if (!usedValueIds || usedValueIds.size === 0) {
            return {
              ...pvo,
              variant_options: {
                ...option,
                variant_option_values: []
              }
            }
          }

          const { data: optionValues } = await supabaseAdmin
            .from('variant_option_values')
            .select('id, value, display_value, color_hex, image_url, sort_order, price_adjustment_cents, cost_adjustment_cents')
            .eq('option_id', option.id)
            .in('id', Array.from(usedValueIds))
            .order('sort_order', { ascending: true })

          return {
            ...pvo,
            variant_options: {
              ...option,
              variant_option_values: optionValues || []
            }
          }
        })
      )

      return { ...product, product_variant_options: cleanedOptions }
    })
  )

  return { data: productsWithCleanVariants, error: null }
}

// Enhanced function to fetch paginated products with variant options for PLP
export async function fetchPublishedProductsPagedWithVariants(
  tenantId: string,
  params: ProductListParams
) {
  const { 
    sort = 'updated_at', 
    dir = 'desc', 
    page = 1, 
    pageSize = 12, 
    q, 
    minPriceCents, 
    maxPriceCents, 
    categoryId,
    categorySlugs,
    is_featured,
    is_bestseller,
    is_new_arrival,
    is_on_sale,
    is_limited_edition,
    is_sold_out,
    tag,
    tags,
    filter
  } = params
  
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  
  let selectCols = `
    id, name, slug, description, price_cents, compare_at_price_cents, stock, currency, 
    hero_image_url, low_stock_threshold, is_featured, is_bestseller, is_new_arrival, 
    is_on_sale, is_limited_edition, is_sold_out, custom_badge_text, badge_color, 
    badge_priority, badge_display_until, badge_display_from, tags,
    product_variant_options(
      variant_options(
        id, name, display_name, type, sort_order,
        variant_option_values(
          id, value, display_value, color_hex, image_url, sort_order, price_adjustment_cents, cost_adjustment_cents
        )
      )
    )
  `
  
  // Determine if we need category filtering
  const needsCategoryFilter = categoryId || (categorySlugs && categorySlugs.length > 0)
  
  if (needsCategoryFilter) {
    selectCols += ', product_categories!inner(category:categories!inner(id, slug))'
  }
  
  let query = supabaseAdmin
    .from('products')
    .select(selectCols, { count: 'exact' })
    .eq('tenant_id', tenantId)
    .eq('status', 'published')
    
  // Handle category filtering
  if (categoryId) {
    // Legacy: filter by category ID
    query = query.eq('product_categories.category_id', categoryId)
  } else if (categorySlugs && categorySlugs.length > 0) {
    // New: filter by category slugs
    query = query.in('product_categories.category.slug', categorySlugs)
  }
  
  if (q && q.trim()) {
    query = query.ilike('name', `%${q.trim()}%`)
  }
  
  if (typeof minPriceCents === 'number' && !Number.isNaN(minPriceCents)) {
    query = query.gte('price_cents', minPriceCents)
  }
  
  if (typeof maxPriceCents === 'number' && !Number.isNaN(maxPriceCents)) {
    query = query.lte('price_cents', maxPriceCents)
  }
  
  // Badge filters
  if (is_featured !== undefined) {
    query = query.eq('is_featured', is_featured)
  }
  if (is_bestseller !== undefined) {
    query = query.eq('is_bestseller', is_bestseller)
  }
  if (is_new_arrival !== undefined) {
    query = query.eq('is_new_arrival', is_new_arrival)
  }
  if (is_on_sale !== undefined) {
    query = query.eq('is_on_sale', is_on_sale)
  }
  if (is_limited_edition !== undefined) {
    query = query.eq('is_limited_edition', is_limited_edition)
  }
  if (is_sold_out !== undefined) {
    query = query.eq('is_sold_out', is_sold_out)
  }
  
  // Tag filters
  if (tag) {
    query = query.contains('tags', [tag])
  }
  if (tags && tags.length > 0) {
    query = query.overlaps('tags', tags)
  }
  
  // Filter presets
  if (filter) {
    switch (filter) {
      case 'featured':
        query = query.eq('is_featured', true)
        break
      case 'new-arrivals':
        query = query.eq('is_new_arrival', true)
        break
      case 'sale':
        query = query.eq('is_on_sale', true)
        break
      case 'bestsellers':
        query = query.eq('is_bestseller', true)
        break
    }
  }
  
  // Apply sorting and pagination
  query = query.order(sort, { ascending: dir === 'asc' }).range(from, to)
  
  const { data: products, count, error } = await query
  
  if (error || !products) {
    return { data: products, count, error }
  }

  // Fix ghost variants: Load only variant option values that are actually used
  const productsWithCleanVariants = await Promise.all(
    products.map(async (product: any) => {
      if (!product.product_variant_options || product.product_variant_options.length === 0) {
        return product
      }

      // Get variant combinations for this product to see which values are actually used
      const { data: variants } = await supabaseAdmin
        .from('product_variants')
        .select('attributes')
        .eq('product_id', product.id)
        .eq('tenant_id', tenantId)

      if (!variants || variants.length === 0) {
        // No variants exist, so no values should be shown
        const cleanedOptions = product.product_variant_options.map((pvo: any) => ({
          ...pvo,
          variant_options: {
            ...pvo.variant_options,
            variant_option_values: []
          }
        }))
        return { ...product, product_variant_options: cleanedOptions }
      }

      // Extract used option-value pairs from variant combinations
      const usedOptionValues = new Map<string, Set<string>>()
      variants.forEach((variant: any) => {
        const attributes = variant.attributes || {}
        Object.entries(attributes).forEach(([optionId, valueId]) => {
          if (!usedOptionValues.has(optionId)) {
            usedOptionValues.set(optionId, new Set())
          }
          usedOptionValues.get(optionId)!.add(valueId as string)
        })
      })

      // Load only the variant option values that are actually used
      const cleanedOptions = await Promise.all(
        product.product_variant_options.map(async (pvo: any) => {
          const option = pvo.variant_options
          const usedValueIds = usedOptionValues.get(option.id)

          if (!usedValueIds || usedValueIds.size === 0) {
            // No values used for this option
            return {
              ...pvo,
              variant_options: {
                ...option,
                variant_option_values: []
              }
            }
          }

          // Fetch only the used values
          const { data: optionValues } = await supabaseAdmin
            .from('variant_option_values')
            .select('id, value, display_value, color_hex, image_url, sort_order, price_adjustment_cents, cost_adjustment_cents')
            .eq('option_id', option.id)
            .in('id', Array.from(usedValueIds))
            .order('sort_order', { ascending: true })

          return {
            ...pvo,
            variant_options: {
              ...option,
              variant_option_values: optionValues || []
            }
          }
        })
      )

      return { ...product, product_variant_options: cleanedOptions }
    })
  )
  
  return { data: productsWithCleanVariants, count, error }
}
