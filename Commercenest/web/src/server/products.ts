import { fetchPublishedProductsPaged, ProductListItem } from '@/server/modules/products/service'

export interface GetProductsParams {
  tenantId: string | null
  search?: string
  category?: string
  status?: string
  sort?: string
  page?: number
  limit?: number
  tag?: string
  tags?: string[]
  color?: string
  size?: string
  price?: string
  fabric?: string
  is_new_arrival?: boolean
  is_featured?: boolean
  is_bestseller?: boolean
  is_on_sale?: boolean
  is_limited_edition?: boolean
  is_sold_out?: boolean
}

// Helper function to parse sort parameter from frontend
function parseSortParameter(sortParam?: string): { sort: 'updated_at' | 'name' | 'price_cents', dir: 'asc' | 'desc' } {
  if (!sortParam || sortParam === '') {
    // Default to popularity (most recently updated)
    return { sort: 'updated_at', dir: 'desc' }
  }

  // Parse combined sort_direction format
  const [sortField, direction] = sortParam.split('_')
  
  switch (sortField) {
    case 'price':
      return { sort: 'price_cents', dir: direction as 'asc' | 'desc' }
    case 'name':
      return { sort: 'name', dir: direction as 'asc' | 'desc' }
    case 'created':
      // Map 'created' to 'updated_at' since that's the actual DB column
      return { sort: 'updated_at', dir: direction as 'asc' | 'desc' }
    default:
      // Fallback to default
      return { sort: 'updated_at', dir: 'desc' }
  }
}

export async function getProducts(params: GetProductsParams): Promise<ProductListItem[]> {
  const {
    tenantId,
    search,
    category,
    sort = '',
    page = 1,
    limit = 12,
    tag,
    tags,
    color,
    size,
    price,
    fabric,
    is_new_arrival,
    is_featured,
    is_bestseller,
    is_on_sale,
    is_limited_edition,
    is_sold_out
  } = params

  // If no tenantId provided, return empty array (platform showcase not implemented yet)
  if (!tenantId) {
    console.log('[GET_PRODUCTS] No tenantId provided, returning empty array')
    return []
  }

  // Parse sort parameter to get sort field and direction
  const { sort: sortField, dir } = parseSortParameter(sort)
  
  console.log('[GET_PRODUCTS] Sort parameter:', sort, '→ Parsed:', { sort: sortField, dir })

  // Map the parameters to match the service function
  const serviceParams = {
    q: search,
    sort: sortField,
    dir,
    page,
    pageSize: limit,
    categoryId: category,
    tag,
    tags,
    color,
    size,
    price,
    fabric,
    is_new_arrival,
    is_featured,
    is_bestseller,
    is_on_sale,
    is_limited_edition,
    is_sold_out
  }

  const result = await fetchPublishedProductsPaged(tenantId, serviceParams)

  // Handle potential error or null data
  if (result.error || !result.data) {
    return []
  }

  // Type guard to ensure we have valid ProductListItem data
  const isValidProduct = (item: unknown): item is ProductListItem => {
    if (item === null || typeof item !== 'object') return false
    
    const obj = item as Record<string, unknown>
    return 'id' in obj && 
           'name' in obj && 
           'slug' in obj &&
           typeof obj.id === 'string' && 
           typeof obj.name === 'string' &&
           typeof obj.slug === 'string'
  }

  // Filter out any error objects and ensure we have valid products
  const validProducts = (result.data.filter(isValidProduct) as unknown) as ProductListItem[]
  
  return validProducts
}
