import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { notFound } from 'next/navigation'
import { ProductForm } from '../../ProductForm'

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params
  
  try {
    const tenantId = await resolveTenantIdFromRequest()
    
    if (!tenantId) {
      notFound()
    }

    // Get product basic data first (separate from complex joins)
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error || !product) {
      console.error('Product fetch error:', error)
      notFound()
    }

    // Get related data separately to avoid query corruption
    const [categoriesResult, imagesResult, variantOptionsResult, variantsResult] = await Promise.all([
      // Categories
      supabaseAdmin
        .from('product_categories')
        .select('category:categories(id, name, slug)')
        .eq('product_id', id),
      
      // Images  
      supabaseAdmin
        .from('product_images')
        .select('url, alt, sort_order')
        .eq('product_id', id)
        .order('sort_order'),
      
      // Variant options
      supabaseAdmin
        .from('product_variant_options')
        .select(`
          option:variant_options(
            id,
            name,
            display_name,
            type,
            required,
            values:variant_option_values(
              id,
              value,
              display_value,
              color_hex,
              image_url
            )
          )
        `)
        .eq('product_id', id),
      
      // Product variants
      supabaseAdmin
        .from('product_variants')
        .select('id, name, sku, price_cents, stock, attributes')
        .eq('product_id', id)
    ])

    // Attach the related data to product object
    const productWithRelations = {
      ...product,
      categories: categoriesResult.data || [],
      images: imagesResult.data || [],
      variant_options: variantOptionsResult.data || [],
      variants: variantsResult.data || []
    }

    console.log('DEBUG: Raw product from DB:', {
      id: productWithRelations.id,
      name: productWithRelations.name,
      has_variants: productWithRelations.has_variants,
      has_variants_type: typeof productWithRelations.has_variants,
      variant_options_length: productWithRelations.variant_options?.length || 0
    })

    // Get categories for the form
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select('id, name, slug')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })

    if (categoriesError) {
      console.log('Error fetching categories:', categoriesError)
    }

    // Transform variant options from database
    const rawOptions = Array.isArray(productWithRelations.variant_options) ? productWithRelations.variant_options : []
    console.log('DEBUG: Raw variant options from DB:', rawOptions)
    
    const variantOptions = rawOptions.map((pvo: Record<string, unknown>) => {
      const option = (pvo.option || {}) as Record<string, unknown>
      const values = Array.isArray((option as Record<string, unknown> & { values?: Record<string, unknown>[] }).values)
        ? ((option as Record<string, unknown> & { values?: Record<string, unknown>[] }).values as Record<string, unknown>[]).map((value: Record<string, unknown>) => ({
            id: (value.id as string) || '',
            value: (value.value as string) || '',
            displayValue: (value.display_value as string) || '',
            colorHex: (value.color_hex as string) || undefined,
            imageUrl: (value.image_url as string) || undefined
          }))
        : []
        
      console.log('DEBUG: Transformed option:', {
        id: option.id,
        name: option.name,
        displayName: option.display_name,
        values_count: values.length
      })
      
      return {
        id: (option.id as string) || '',
        name: (option.name as string) || '',
        displayName: (option.display_name as string) || '',
        type: (option.type as string) || 'select',
        required: Boolean(option.required),
        values
      }
    })

    // Transform variant combinations
    const rawVariants = Array.isArray(productWithRelations.variants) ? productWithRelations.variants : []
    const variantCombinations = rawVariants.map((variant: Record<string, unknown>) => ({
      id: (variant.id as string) || '',
      options: (variant.attributes as Record<string, string>) || {},
      priceCents: (variant.price_cents as number) || 0,
      stock: (variant.stock as number) || 0,
      sku: (variant.sku as string) || '',
      imageUrl: ''
    }))

      // FALLBACK: If has_variants is undefined, fetch it directly
      let hasVariants = product.has_variants
      if (hasVariants === undefined || hasVariants === null) {
        console.log('DEBUG: has_variants is undefined, fetching directly from database...')
        const { data: directProduct } = await supabaseAdmin
          .from('products')
          .select('has_variants')
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .single()
        
        hasVariants = directProduct?.has_variants || false
        console.log('DEBUG: Direct query result:', { has_variants: hasVariants })
      }

      // Transform product data to match ProductForm expectations
      console.log('DEBUG: About to create formData, final has_variants:', {
        original_value: product.has_variants,
        final_value: hasVariants,
        type: typeof hasVariants,
        boolean_conversion: hasVariants === true
      })

      const categoryId = (() => {
      const first = Array.isArray(productWithRelations.categories) ? productWithRelations.categories[0] as unknown : undefined
      if (first && typeof first === 'object' && 'category' in (first as Record<string, unknown>)) {
        const cat = (first as Record<string, unknown> & { category?: { id?: unknown } }).category
        if (cat && typeof cat.id === 'string') return cat.id
      }
      return ''
    })()

    const formData = {
      id: product.id,
      name: product.name || '',
      slug: product.slug || '',
      description: product.description || '',
      status: product.status || 'draft',
      price_cents: product.price_cents || 0,
      compare_at_price_cents: product.compare_at_price_cents || 0,
      cost_per_item_cents: product.cost_per_item_cents || 0,
      stock: product.stock || 0,
      sku: product.sku || '',
      track_inventory: product.track_inventory || false,
      low_stock_threshold: product.low_stock_threshold || 0,
      allow_backorders: product.allow_backorders || false,
      requires_shipping: product.requires_shipping !== false, // Default to true
      taxable: product.taxable !== false, // Default to true
      tax_class_id: product.tax_class_id || '',
      weight: product.weight || 0,
      dimensions: product.dimensions || '',
      hs_code: product.hs_code || '',
      meta_title: product.meta_title || '',
      meta_description: product.meta_description || '',
      category_id: categoryId,
      // Extract all category IDs from the product_categories relationship
      category_ids: Array.isArray(productWithRelations.categories) 
        ? productWithRelations.categories
            .map((pc: unknown) => {
              if (pc && typeof pc === 'object' && 'category' in pc) {
                const cat = (pc as { category?: { id?: unknown } }).category
                if (cat && typeof cat.id === 'string') return cat.id
              }
              return null
            })
            .filter((id): id is string => id !== null)
        : [],
      images: (productWithRelations.images?.map((img: Record<string, unknown>) => String(img.url)).filter(Boolean) as string[]) || [],
      has_variants: productWithRelations.has_variants === true, // Explicit boolean check
      variantOptions,
      variantCombinations,
      // Fashion-specific fields
      material_composition: product.material_composition || '',
      care_instructions: product.care_instructions || '',
      fit_type: product.fit_type || '',
      model_height_cm: product.model_height_cm ?? 0,
      model_weight_kg: product.model_weight_kg ?? 0,
      model_wearing_size: product.model_wearing_size || '',
      is_gift_card: product.is_gift_card || false,
      gift_card_amount_cents: product.gift_card_amount_cents || 0,
      gift_card_expiry_days: product.gift_card_expiry_days || 0,
      // Badge System
      is_featured: product.is_featured || false,
      is_bestseller: product.is_bestseller || false,
      is_new_arrival: product.is_new_arrival || false,
      is_on_sale: product.is_on_sale || false,
      is_limited_edition: product.is_limited_edition || false,
      is_sold_out: product.is_sold_out || false,
      custom_badge_text: product.custom_badge_text || '',
      badge_color: product.badge_color || '#ef4444',
      badge_priority: product.badge_priority || 0,
      badge_display_until: product.badge_display_until || '',
      badge_display_from: product.badge_display_from || ''
    }

    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
            <p className="text-gray-500">Update product information and settings</p>
          </div>
          
          <ProductForm 
            initialData={formData}
            mode="edit"
            categories={(categories || []).map(c => ({ 
              id: c.id as string, 
              name: c.name as string,
              slug: (c as Record<string, unknown>).slug as string || '',
              parent_id: (c as Record<string, unknown>).parent_id as string | null || null,
              created_at: (c as Record<string, unknown>).created_at as string || new Date().toISOString()
            
            }))}
           
            tenantId={tenantId}
          />
        </div>
      </div>
    )
  } catch (error) {
    console.log('Error in EditProductPage:', error)
    notFound()
  }
}
