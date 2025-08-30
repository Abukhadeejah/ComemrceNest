import { resolveTenantIdFromRequest } from '../../../../../../../server/tenant'
import { supabaseAdmin } from '../../../../../../../server/supabaseAdmin'
import { notFound } from 'next/navigation'
import { ProductForm } from '../../../../../../(admin)/admin/products/ProductForm'

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

    // Get product with category and images
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        categories:product_categories(
          category:categories(name, slug)
        ),
        images:product_images(
          url,
          alt,
          sort_order
        )
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error || !product) {
      notFound()
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

    // Transform product data to match ProductForm expectations
    const formData = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      status: product.status,
      price_cents: product.price_cents,
      compare_at_price_cents: product.compare_at_price_cents || 0,
      cost_per_item_cents: product.cost_per_item_cents || 0,
      stock: product.stock,
      sku: product.sku || '',
      track_inventory: product.track_inventory || false,
      low_stock_threshold: product.low_stock_threshold || 0,
      allow_backorders: product.allow_backorders || false,
      requires_shipping: product.requires_shipping || true,
      taxable: product.taxable || true,
      weight: product.weight || 0,
      dimensions: product.dimensions || '',
      hs_code: product.hs_code || '',
      meta_title: product.meta_title || '',
      meta_description: product.meta_description || '',
      category_id: product.categories?.[0]?.category?.id || '',
      images: product.images?.map((img: Record<string, unknown>) => img.url) || [],
      // Fashion-specific fields
      material_composition: product.material_composition || '',
      care_instructions: product.care_instructions || '',
      fit_type: product.fit_type || '',
      model_height_cm: product.model_height_cm || null,
      model_weight_kg: product.model_weight_kg || null,
      model_wearing_size: product.model_wearing_size || '',
      is_gift_card: product.is_gift_card || false,
      gift_card_amount_cents: product.gift_card_amount_cents || null,
      gift_card_expiry_days: product.gift_card_expiry_days || null
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
            categories={categories || []}
          />
        </div>
      </div>
    )
  } catch (error) {
    console.log('Error in EditProductPage:', error)
    notFound()
  }
}




































