// Disable static optimization for debugging
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { Suspense } from 'react'
import { ProductGrid } from '@/components/tenant/products/ProductGrid'
import { ProductFilters } from '@/components/tenant/products/ProductFilters'
import { ProductSearch } from '@/components/tenant/products/ProductSearch'
import { getProducts } from '@/server/products'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { getRegistryEntry } from '@/registry/tenantRegistry'
import type { Metadata } from 'next'

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string
    category?: string
    status?: string
    sort?: string
    page?: string
  }>
}

export async function generateMetadata(): Promise<Metadata> {
  const registryEntry = getRegistryEntry('senlysh')
  const { getPageMetadata } = await registryEntry.metadata()
  return getPageMetadata('Shop', 'Explore our latest fashion trends and styles')
}

export default async function SenlyshProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams
  const tenantId = await resolveTenantIdFromRequest()

  if (!tenantId) {
    return <div>Tenant not found</div>
  }

  const products = await getProducts({
    tenantId,
    search: params.search,
    category: params.category,
    status: params.status,
    sort: params.sort,
    page: parseInt(params.page || '1'),
    limit: 12
  })

  console.log('[SENLYSH_PRODUCTS_PAGE] Fetched products for tenant:', tenantId, 'Count:', products.length)

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

        {/* Products Grid */}
        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductGrid key={tenantId} products={products} />
        </Suspense>
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







