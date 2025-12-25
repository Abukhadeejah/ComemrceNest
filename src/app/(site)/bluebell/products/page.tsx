// Disable static optimization for debugging
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { Suspense } from 'react'
import BluebellProductGrid from '@/tenants/bluebell/components/BluebellProductGrid'
import BluebellProductFilters from '@/tenants/bluebell/components/BluebellProductFilters'
import BluebellProductSearch from '@/tenants/bluebell/components/BluebellProductSearch'
import { getProducts } from '@/server/products'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { getRegistryEntry } from '@/registry/tenantRegistry'
import type { Metadata } from 'next'
import Link from 'next/link'
import { fetchAvailableAttributeFilters } from '@/server/attributes'
import { AttributeFiltersSidebar } from '@/components/tenant/products/AttributeFiltersSidebar'

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string
    category?: string
    status?: string
    sort?: string
    page?: string
    attr_value_ids?: string
  }>
}

export async function generateMetadata(): Promise<Metadata> {
  const registryEntry = getRegistryEntry('bluebell')
  const { getPageMetadata } = await registryEntry.metadata()
  return getPageMetadata('Fabrics', 'Discover our curated collection of premium fabrics for interior design')
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
    limit: 12,
    attributeValueIds: flattenAttributeFilters(parseAttributeFiltersFromUrl(params.attr_value_ids || ''))
  })

  console.log('[BLUEBELL_PRODUCTS_PAGE] Fetched products for tenant:', tenantId, 'Count:', products.length)

  // Fetch available attribute filters for this tenant
  const attributeDefinitions = await fetchAvailableAttributeFilters(tenantId)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb Navigation */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/bluebell" className="text-bluebell-brown hover:text-bluebell-blue transition-colors duration-300 font-medium">Home</Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
            <span className="text-[#01589D] font-semibold">Products</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tight text-[#01589D] mb-6 leading-tight">
            Featured Fabrics
          </h1>
          <div className="w-32 h-1 bg-[#FDCE59] mx-auto mb-8 rounded-full shadow-lg"></div>
          <p className="text-xl md:text-2xl text-[#4E302E] max-w-3xl mx-auto font-light leading-relaxed">
            Discover our curated collection of premium fabrics for exceptional interior design
          </p>
        </div>

        {/* Search */}
        <BluebellProductSearch />

        {/* Main Content with Filters and Products */}
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Filters Sidebar - Only show Bluebell's custom filter, not attribute sidebar for now */}
          <BluebellProductFilters products={products} />
          
          {/* Products Grid */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 bg-gray-50 rounded-2xl p-6">
              <div>
                <p className="text-bluebell-brown text-lg">
                  Showing <span className="font-bold text-bluebell-blue">{products.length}</span> of <span className="font-bold text-bluebell-blue">{products.length}</span> products
                </p>
              </div>
              <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                <span className="text-bluebell-brown font-medium">View:</span>
                <button className="p-2 bg-bluebell-blue text-white rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                  </svg>
                </button>
                <button className="p-2 bg-gray-200 text-bluebell-brown rounded-lg hover:bg-gray-300 transition-colors duration-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <Suspense fallback={<ProductGridSkeleton />}>
              <BluebellProductGrid key={tenantId} products={products} />
            </Suspense>

            {/* Pagination */}
            <Pagination currentPage={parseInt(params.page || '1')} hasNext={products.length === 12} />
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
 * Flatten attribute filters to a flat list of value IDs for the product query.
 */
function flattenAttributeFilters(filters: Record<string, string[]>): string[] {
  return Object.values(filters).flat()
}
