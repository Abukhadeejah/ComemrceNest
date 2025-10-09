import { fetchPublishedProductsPaged, ProductListItem } from '@/server/modules/products/service'
import { supabaseAdmin } from '@/server/supabaseAdmin'

export interface GetProductsParams {
  tenantId: string | null
  search?: string
  category?: string
  status?: string
  sort?: string
  page?: number
  limit?: number
}

export async function getProducts(params: GetProductsParams): Promise<ProductListItem[]> {
  const {
    tenantId,
    search,
    category,
    sort = 'updated_at',
    page = 1,
    limit = 12
  } = params

  // For platform-level products (null tenantId), fetch from all tenants
  if (!tenantId) {
    let query = supabaseAdmin
      .from('products')
      .select(`
        id,
        name,
        description,
        price_cents,
        currency,
        status,
        hero_image_url,
        stock,
        created_at,
        updated_at,
        slug,
        tenant_id
      `)
      .eq('status', 'published')

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply category filter if specified
    if (category && category !== 'all') {
      try {
        // First, get the category ID
        const { data: categoryData } = await supabaseAdmin
          .from('categories')
          .select('id')
          .eq('slug', category)
          .single()

        if (categoryData) {
          // Then get the product IDs for this category
          const { data: productCategoryData } = await supabaseAdmin
            .from('product_categories')
            .select('product_id')
            .eq('category_id', categoryData.id)

          if (productCategoryData && productCategoryData.length > 0) {
            const productIds = productCategoryData.map(pc => pc.product_id)
            query = query.in('id', productIds)
          } else {
            // No products in this category, return empty result
            return []
          }
        }
      } catch (error) {
        console.error('[PLATFORM_PRODUCTS] Error filtering by category:', error)
        return []
      }
    }

    // Apply sorting
    query = query.order(sort, { ascending: sort === 'name' })

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    try {
      const { data: products, error } = await query

      if (error) {
        console.error('[PLATFORM_PRODUCTS] Error fetching platform products:', error)
        return []
      }

      // Transform to ProductListItem format
      return products?.map(product => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description || null,
        price_cents: product.price_cents,
        currency: product.currency,
        hero_image_url: product.hero_image_url,
        stock: product.stock
      })) || []
    } catch (error) {
      console.error('[PLATFORM_PRODUCTS] Error fetching platform products:', error)
      return []
    }
  }

  // For tenant-specific products, use the existing logic
  const serviceParams = {
    q: search,
    sort: sort as 'updated_at' | 'name' | 'price_cents',
    dir: 'desc' as const,
    page,
    pageSize: limit,
    categoryId: category
  }

  const result = await fetchPublishedProductsPaged(tenantId, serviceParams)

  // Handle potential error or null data
  if (result.error || !result.data) {
    return []
  }

  return result.data as unknown as ProductListItem[]
}
