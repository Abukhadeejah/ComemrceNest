// Disable static optimization for debugging
export const dynamic = 'force-dynamic'
export const revalidate = 0

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { getRegistryEntry } from '@/registry/tenantRegistry'
import { getProducts } from '@/server/products'
import BluebellProductGrid from '@/tenants/bluebell/components/BluebellProductGrid'

interface SalePageProps {
  searchParams: Promise<{
    page?: string
  }>
}

export async function generateMetadata(): Promise<Metadata> {
  const registryEntry = getRegistryEntry('bluebell')
  const { getPageMetadata } = await registryEntry.metadata()
  return getPageMetadata('Sale', 'Explore current offers at Bluebell Interiors')
}

export default async function SalePage({ searchParams }: SalePageProps) {
  const params = await searchParams
  const tenantId = await resolveTenantIdFromRequest()

  if (!tenantId) {
    return <div>Tenant not found</div>
  }

  const products = await getProducts({
    tenantId,
    sort: 'price_cents', // Sort by price (note: direction is hardcoded to desc in the service)
    page: parseInt(params.page || '1'),
    limit: 12
  })

  console.log('[BLUEBELL_SALE_PAGE] Fetched products for tenant:', tenantId, 'Count:', products.length)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb Navigation */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <a href="/bluebell" className="text-bluebell-brown hover:text-bluebell-blue transition-colors duration-300 font-medium">Home</a>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
            <span className="text-[#01589D] font-semibold">Sale</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tight text-[#01589D] mb-6 leading-tight">
            Sale Items
          </h1>
          <div className="w-32 h-1 bg-[#FDCE59] mx-auto mb-8 rounded-full shadow-lg"></div>
          <p className="text-xl md:text-2xl text-[#4E302E] max-w-3xl mx-auto font-light leading-relaxed">
            Explore our special offers and discounted premium fabrics
          </p>
        </div>

        {/* Products Grid */}
        <div className="mt-8">
          <Suspense fallback={<ProductGridSkeleton />}>
            <BluebellProductGrid key={tenantId} products={products} />
          </Suspense>

          {/* Pagination */}
          <Pagination currentPage={parseInt(params.page || '1')} hasNext={products.length === 12} />
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

function Pagination({ currentPage, hasNext }: { currentPage: number; hasNext: boolean }) {
  const prevPage = Math.max(1, currentPage - 1)
  const nextPage = currentPage + 1
  return (
    <div className="mt-10 flex flex-col sm:flex-row items-center justify-between bg-gray-50 rounded-2xl p-6">
      <div className="flex items-center space-x-2 mb-4 sm:mb-0">
        <a
          href={`?page=${prevPage}`}
          aria-disabled={currentPage === 1}
          className={`pagination-btn bg-white border border-gray-300 text-bluebell-brown px-4 py-2 rounded-lg hover:bg-bluebell-blue hover:text-white transition-all duration-300 ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <span className="text-bluebell-brown">Page {currentPage}</span>
        <a
          href={`?page=${nextPage}`}
          aria-disabled={!hasNext}
          className={`pagination-btn bg-white border border-gray-300 text-bluebell-brown px-4 py-2 rounded-lg hover:bg-bluebell-blue hover:text-white transition-all duration-300 ${!hasNext ? 'pointer-events-none opacity-50' : ''}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  )
}
