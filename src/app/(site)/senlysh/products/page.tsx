// Enable static optimization for better performance
export const dynamic = 'auto'
export const revalidate = 60 // Revalidate every 60 seconds

import { Suspense } from 'react'
import { ProductGrid } from '@/components/tenant/products/ProductGrid'
import type { ProductListItem as UIProductListItem } from '@/types/product'
import { ProductFilters } from '@/components/tenant/products/ProductFilters'
import { ProductSearch } from '@/components/tenant/products/ProductSearch'
import { getProducts } from '@/server/products'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { fetchVariantsForProducts } from '@/server/modules/products/service'
import { fetchAvailableAttributeFilters } from '@/server/attributes'
import { AttributeFiltersSidebarWrapper } from '@/components/tenant/products/AttributeFiltersSidebarWrapper'

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    sort?: string
    page?: string
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
    attr_value_ids?: string
  }>
}

export default async function SenlyshProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams
  const tenantId = await resolveTenantIdFromRequest()

  if (!tenantId) {
    return <div>Tenant not found</div>
  }

  // Parse attribute filters from URL params (format: "attrId1:valId1,valId2|attrId2:valId3")
  const attributeFilters = parseAttributeFiltersFromUrl(params.attr_value_ids || '')

  const products = await getProducts({
    tenantId,
    search: params.search,
    status: params.status,
    sort: params.sort,
    page: parseInt(params.page || '1'),
    limit: 12,
    color: params.color,
    size: params.size,
    price: params.price,
    fabric: params.fabric,
    attributeValueIds: flattenAttributeFilters(attributeFilters),
    is_new_arrival: params.is_new_arrival === 'true' ? true : params.is_new_arrival === 'false' ? false : undefined,
    is_featured: params.is_featured === 'true' ? true : params.is_featured === 'false' ? false : undefined,
    is_bestseller: params.is_bestseller === 'true' ? true : params.is_bestseller === 'false' ? false : undefined,
    is_on_sale: params.is_on_sale === 'true' ? true : params.is_on_sale === 'false' ? false : undefined,
    is_limited_edition: params.is_limited_edition === 'true' ? true : params.is_limited_edition === 'false' ? false : undefined,
    is_sold_out: params.is_sold_out === 'true' ? true : params.is_sold_out === 'false' ? false : undefined
  })

  console.log('[SENLYSH_PRODUCTS_PAGE] Fetched products for tenant:', tenantId, 'Count:', products.length)

  // Fetch available attribute filters for this tenant
  const attributeDefinitions = await fetchAvailableAttributeFilters(tenantId)

  console.log('[SENLYSH_PRODUCTS_PAGE] Available attribute filters:', attributeDefinitions)

  // Bulk fetch variant combinations for all products (faster, ensures availability)
  const variantCombinationsRaw = await fetchVariantsForProducts(
    tenantId,
    products.map(p => p.id)
  )
  const variantCombinations = variantCombinationsRaw.map((vc: any) => ({
    ...vc,
    product_id: String(vc.product_id),
    attributes: (vc.attributes ?? {}) as Record<string, string>
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Fashion Collection</h1>
          <p className="mt-2 text-gray-600">
            Explore our latest fashion trends and styles
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <ProductSearch />
          <ProductFilters />
        </div>

        {/* Main Layout with Sidebar */}
        <div className="flex gap-6">
          {/* Sidebar with Attribute Filters */}
          <div className="w-64 shrink-0">
            <AttributeFiltersSidebarWrapper
              attributes={attributeDefinitions}
              selected={attributeFilters}
            />
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <Suspense fallback={<ProductGridSkeleton />}>
              <ProductGrid products={products as unknown as UIProductListItem[]} variantCombinations={variantCombinations} tenantKey="senlysh" columns={3} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
          <div className="aspect-square bg-gray-200" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-6 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Parse attribute filters from URL param format: "attrId1:valId1,valId2|attrId2:valId3"
 */
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

/**
 * Encode attribute filters for URL: "attrId1:valId1,valId2|attrId2:valId3"
 */
function encodeAttributeFiltersForUrl(filters: Record<string, string[]>): string {
  return Object.entries(filters)
    .filter(([, values]) => values.length > 0)
    .map(([attrId, valueIds]) => `${attrId}:${valueIds.join(',')}`)
    .join('|')
}

/**
 * Flatten attribute filters to a flat list of value IDs for the product query.
 */
function flattenAttributeFilters(filters: Record<string, string[]>): string[] {
  return Object.values(filters).flat()
}








