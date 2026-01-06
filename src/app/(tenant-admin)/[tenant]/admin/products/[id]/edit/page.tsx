import { resolveTenantIdFromRequest } from '../../../../../../../server/tenant'
import { supabaseAdmin } from '../../../../../../../server/supabaseAdmin'
import { notFound } from 'next/navigation'
import { ProductForm } from '../../../../../../(admin)/admin/products/ProductForm'
import { getProductAttributes } from '@/app/(admin)/admin/products/attributes/actions'

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
      
      // Variant options - only load basic option info, values will be loaded separately
      supabaseAdmin
        .from('product_variant_options')
        .select(`
          option:variant_options(
            id,
            name,
            display_name,
            type,
            required
          )
        `)
        .eq('product_id', id),
      
      // Product variants
      supabaseAdmin
        .from('product_variants')
        .select('id, name, sku, price_cents, stock, attributes')
        .eq('product_id', id)
    ])

    // First, extract used option-value pairs from variant combinations
    const rawVariants = variantsResult.data || []
    const usedOptionValues = new Map<string, Set<string>>() // optionId -> Set of valueIds
    
    rawVariants.forEach((variant: unknown) => {
      const typedVariant = variant as { attributes?: unknown }
      const attributes = (typedVariant.attributes as Record<string, string>) || {}
      Object.entries(attributes).forEach(([optionId, valueId]) => {
        if (!usedOptionValues.has(optionId)) {
          usedOptionValues.set(optionId, new Set())
        }
        usedOptionValues.get(optionId)!.add(valueId)
      })
    })
    
    // Transform variant options data to match expected structure - only load used values
    const transformedVariantOptions = await Promise.all(
      (variantOptionsResult.data || []).map(async (item: unknown) => {
        const typedItem = item as { option?: { id?: string; name?: string; display_name?: string; type?: string; required?: boolean | null } }
        const dbOptionId = typedItem.option?.id || ''
        const usedValueIds = usedOptionValues.get(dbOptionId)
        
        let values: Array<{
          id: string
          value: string
          displayValue: string
          colorHex?: string
          imageUrl?: string
          priceAdjustmentCents?: number
          costAdjustmentCents?: number
        }> = []
        
        // Only fetch values if this option has used values
        if (usedValueIds && usedValueIds.size > 0) {
          const { data: optionValues } = await supabaseAdmin
            .from('variant_option_values')
            .select('id, value, display_value, color_hex, image_url, price_adjustment_cents, cost_adjustment_cents')
            .eq('option_id', dbOptionId)
            .in('id', Array.from(usedValueIds))
          
          values = (optionValues || []).map((value: Record<string, unknown>) => ({
            id: `value_${value.id || ''}`,
            value: (value.value as string) || '',
            displayValue: (value.display_value as string) || '',
            colorHex: (value.color_hex as string) || undefined,
            imageUrl: (value.image_url as string) || undefined,
            priceAdjustmentCents: (value.price_adjustment_cents as number) || 0,
            costAdjustmentCents: (value.cost_adjustment_cents as number) || 0
          }))
        }
        
        return {
          id: `option_${dbOptionId}`,
          name: typedItem.option?.name || '',
          displayName: typedItem.option?.display_name || '',
          type: typedItem.option?.type || 'text',
          required: typedItem.option?.required || false,
          values
        }
      })
    )

    // Build DB UUID -> client ID maps for options and values
    const optionDbToClient = new Map<string, string>()
    const valueDbToClient = new Map<string, string>()
    for (const opt of transformedVariantOptions) {
      const dbId = (opt.id || '').replace(/^option_/, '')
      optionDbToClient.set(dbId, opt.id)
      for (const val of opt.values) {
        const vDbId = (val.id || '').replace(/^value_/, '')
        valueDbToClient.set(vDbId, val.id)
      }
    }

    // Transform variant combinations data to match expected structure (rawVariants already defined above)
    const transformedVariants = rawVariants.map((variant: unknown) => {
      const typedVariant = variant as { id?: string; attributes?: unknown; name?: string; sku?: string | null; price_cents?: number; stock?: number | null }
      return {
        id: `combo_${typedVariant.id || ''}`,
        options: Object.fromEntries(
          Object.entries((typedVariant.attributes as Record<string, unknown>) || {}).map(([dbOptionId, dbValueId]) => {
            const clientOpt = optionDbToClient.get(String(dbOptionId)) || `option_${dbOptionId}`
            const clientVal = valueDbToClient.get(String(dbValueId)) || `value_${dbValueId}`
          return [clientOpt, clientVal]
        })
      ),
      priceCents: typedVariant.price_cents || 0,
      stock: typedVariant.stock || 0,
      sku: typedVariant.sku || '',
      imageUrl: undefined
      }
    })

    // Attach the related data to product object
    const productWithRelations = {
      ...product,
      categories: categoriesResult.data || [],
      images: imagesResult.data || [],
      variant_options: transformedVariantOptions,
      variants: transformedVariants
    }

    

    // Get categories for the form
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select('id, name, slug')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })

    if (categoriesError) {
      console.log('Error fetching categories:', categoriesError)
    }

    // Get attributes for the form
    const attributes = await getProductAttributes()
    console.log('🔍 Fetched attributes for edit product form (tenant-admin):', attributes)
    console.log('🔍 Attributes count (tenant-admin):', attributes?.length)

    // Transform product data to match ProductForm expectations
    const categoryId = (() => {
      const first = Array.isArray(productWithRelations.categories) ? productWithRelations.categories[0] as unknown : undefined
      if (first && typeof first === 'object' && 'category' in (first as Record<string, unknown>)) {
        const cat = (first as Record<string, unknown> & { category?: { id?: unknown } }).category
        if (cat && typeof cat.id === 'string') return cat.id
      }
      return ''
    })()

    const formData = {
      id: productWithRelations.id,
      name: productWithRelations.name,
      slug: productWithRelations.slug,
      description: productWithRelations.description || '',
      status: productWithRelations.status,
      price_cents: productWithRelations.price_cents ?? 0,
      compare_at_price_cents: productWithRelations.compare_at_price_cents ?? 0,
      cost_price_cents: productWithRelations.cost_per_item_cents ?? 0,
      stock: productWithRelations.stock ?? 0,
      sku: productWithRelations.sku || '',
      track_inventory: productWithRelations.track_inventory || false,
      low_stock_threshold: productWithRelations.low_stock_threshold || 0,
      allow_backorders: productWithRelations.allow_backorders || false,
      requires_shipping: productWithRelations.requires_shipping || true,
      taxable: productWithRelations.taxable || true,
      weight: productWithRelations.weight || 0,
      dimensions: productWithRelations.dimensions || '',
      hs_code: productWithRelations.hs_code || '',
      meta_title: productWithRelations.meta_title || '',
      meta_description: productWithRelations.meta_description || '',
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
      has_variants: productWithRelations.has_variants === true,
      // Fashion-specific fields
      material_composition: productWithRelations.material_composition || '',
      care_instructions: productWithRelations.care_instructions || '',
      fit_type: productWithRelations.fit_type || '',
      model_height_cm: typeof productWithRelations.model_height_cm === 'number' ? productWithRelations.model_height_cm : null,
      model_weight_kg: typeof productWithRelations.model_weight_kg === 'number' ? productWithRelations.model_weight_kg : null,
      model_wearing_size: productWithRelations.model_wearing_size || '',
      is_gift_card: productWithRelations.is_gift_card || false,
      gift_card_amount_cents: productWithRelations.gift_card_amount_cents ?? undefined,
      gift_card_expiry_days: productWithRelations.gift_card_expiry_days ?? undefined,
      // Variant data
      variantOptions: productWithRelations.variant_options || [],
      variantCombinations: productWithRelations.variants || [],
      // Required missing properties
      short_description: '',
      currency: 'INR',
      barcode: '',
      tags: [],
      seo_url: '',
      tax_class_id: productWithRelations.tax_class_id || '',
      brand: '',
      color: '',
      material: '',
      sizeGuides: [],
      sizeGuideId: '',
      is_featured: productWithRelations.is_featured || false,
      is_bestseller: productWithRelations.is_bestseller || false,
      is_new_arrival: productWithRelations.is_new_arrival || false,
      is_on_sale: productWithRelations.is_on_sale || false,
      is_limited_edition: false,
      is_sold_out: false,
      custom_badge_text: '',
      badge_color: '',
      badge_priority: 0,
      badge_display_until: '',
      badge_display_from: ''
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
            tenantId={tenantId}
            categories={(categories || []).map(c => ({ 
              id: c.id as string, 
              name: c.name as string,
              slug: (c as Record<string, unknown>).slug as string || '',
              parent_id: (c as Record<string, unknown>).parent_id as string | null || null,
              created_at: (c as Record<string, unknown>).created_at as string || new Date().toISOString()
            }))}
            attributes={attributes}
          />
        </div>
      </div>
    )
  } catch (error) {
    console.log('Error in EditProductPage:', error)
    notFound()
  }
}






































