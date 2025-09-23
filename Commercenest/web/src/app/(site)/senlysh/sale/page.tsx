export const dynamic = 'force-dynamic'
export const revalidate = 0

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getProducts } from '@/server/products'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { fetchVariantsForProducts } from '@/server/modules/products/service'
import type { ProductListItem as UIProductListItem } from '@/types/product'
import { fetchProductVariants } from '@/server/modules/products/service'
import { getRegistryEntry } from '@/registry/tenantRegistry'
import { ProductGrid } from '@/components/tenant/products/ProductGrid'

interface SalePageProps {
  searchParams: Promise<{
    page?: string
  }>
}

export async function generateMetadata(): Promise<Metadata> {
  const registryEntry = getRegistryEntry('senlysh')
  const { getPageMetadata } = await registryEntry.metadata()
  return getPageMetadata('Sale', 'Great deals on Senlysh products')
}

export default async function SenlyshSalePage({ searchParams }: SalePageProps) {
  const params = await searchParams
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return <div>Tenant not found</div>

  const products = await getProducts({ tenantId, page: parseInt(params.page || '1'), limit: 12 })

  // Bulk fetch variant combinations for all products
  const variantCombinationsRaw = await fetchVariantsForProducts(
    tenantId,
    products.map(p => p.id)
  )
  const variantCombinations = variantCombinationsRaw.map(vc => ({
    ...vc,
    product_id: String(vc.product_id),
    attributes: (vc.attributes ?? {}) as Record<string, string>
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 text-red-600">Sale</h1>
          <p className="mt-2 text-gray-600">Discover limited-time offers and discounts</p>
        </div>
        <Suspense fallback={<ProductGridSkeleton />}> 
  <ProductGrid products={products as unknown as UIProductListItem[]} variantCombinations={variantCombinations} />
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


