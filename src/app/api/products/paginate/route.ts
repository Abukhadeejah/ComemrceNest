import { NextResponse } from 'next/server'
import { getProducts } from '@/server/products'
import { fetchVariantsForProducts } from '@/server/modules/products/service'

interface PaginateProductsRequest {
  page?: string
  limit?: string
  search?: string
  category?: string
  sort?: string
  attr_value_ids?: string
  color?: string
  size?: string
  price?: string
  fabric?: string
  is_new_arrival?: string
  is_featured?: string
  is_bestseller?: string
  is_on_sale?: string
  is_limited_edition?: string
  is_sold_out?: string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Get tenantId from query params (passed from client)
    const tenantId = searchParams.get('tenantId')
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      )
    }

    // Helper function to parse attribute filters
    function parseAttributeFiltersFromUrl(encoded: string): Record<string, string[]> {
      if (!encoded) return {}
      const filters: Record<string, string[]> = {}
      const parts = encoded.split('|')
      parts.forEach((part) => {
        const [attrId, valueIds] = part.split(':')
        if (attrId && valueIds) {
          filters[attrId] = valueIds.split(',').filter(Boolean)
        }
      })
      return filters
    }

    function flattenAttributeFilters(filters: Record<string, string[]>): string[] {
      return Object.values(filters).flat()
    }

    // Parse search params
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '24')
    const search = searchParams.get('search') || undefined
    const sort = searchParams.get('sort') || 'updated_at'
    const attrValueIds = searchParams.get('attr_value_ids') || ''
    const color = searchParams.get('color') || undefined
    const size = searchParams.get('size') || undefined
    const price = searchParams.get('price') || undefined
    const fabric = searchParams.get('fabric') || undefined

    const attributeFilters = parseAttributeFiltersFromUrl(attrValueIds)

    // Parse boolean filters
    const parseBoolean = (val: string | null) =>
      val === 'true' ? true : val === 'false' ? false : undefined

    const products = await getProducts({
      tenantId,
      search,
      status: 'published',
      sort,
      page,
      limit,
      color,
      size,
      price,
      fabric,
      attributeValueIds: flattenAttributeFilters(attributeFilters),
      is_new_arrival: parseBoolean(searchParams.get('is_new_arrival')),
      is_featured: parseBoolean(searchParams.get('is_featured')),
      is_bestseller: parseBoolean(searchParams.get('is_bestseller')),
      is_on_sale: parseBoolean(searchParams.get('is_on_sale')),
      is_limited_edition: parseBoolean(searchParams.get('is_limited_edition')),
      is_sold_out: parseBoolean(searchParams.get('is_sold_out')),
    })

    // Fetch variant combinations for products
    const variantCombinationsRaw = await fetchVariantsForProducts(
      tenantId || '',
      products.map((p) => p.id)
    )
    const variantCombinations = variantCombinationsRaw.map((vc: any) => ({
      ...vc,
      product_id: String(vc.product_id),
      attributes: (vc.attributes ?? {}) as Record<string, string>,
    }))

    // Check if there are more products
    const hasMore = products.length === limit

    return NextResponse.json(
      {
        products,
        variantCombinations,
        hasMore,
        page,
        limit,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('[API /api/products/paginate] error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
