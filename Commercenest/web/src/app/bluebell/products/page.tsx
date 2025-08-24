import { Suspense } from 'react'
import { ProductGrid } from '@/components/tenant/products/ProductGrid'
import { ProductFilters } from '@/components/tenant/products/ProductFilters'
import { ProductSearch } from '@/components/tenant/products/ProductSearch'
import { getProducts } from '@/server/products'
import { resolveTenantIdFromRequest } from '@/server/tenant'

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string
    category?: string
    status?: string
    sort?: string
    page?: string
  }>
}

export default async function BluebellProductsPage({ searchParams }: ProductsPageProps) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Interior Fabrics</h1>
          <p className="mt-2 text-gray-600">
            Discover our curated collection of premium fabrics for exceptional interior design
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <ProductSearch />
          <ProductFilters />
        </div>

        {/* Products Grid */}
        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductGrid products={products} />
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



