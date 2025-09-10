import { fetchPublishedProductsPaged, ProductListItem } from '@/server/modules/products/service'

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

  // If no tenantId provided, return empty array (platform showcase not implemented yet)
  if (!tenantId) {
    console.log('[GET_PRODUCTS] No tenantId provided, returning empty array')
    return []
  }

  // Map the parameters to match the service function
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
