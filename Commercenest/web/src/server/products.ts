import { fetchPublishedProductsPaged, ProductListItem } from '@/server/modules/products/service'

export interface GetProductsParams {
  tenantId: string
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
  
  return result.data as unknown as ProductListItem[]
}
