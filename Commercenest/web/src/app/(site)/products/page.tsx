// Disable static optimization for debugging
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { ProductGrid } from '@/components/tenant/products/ProductGrid'
import type { ProductListItem as UIProductListItem } from '@/types/product'
import { ProductFilters } from '@/components/tenant/products/ProductFilters'
import { ProductSearch } from '@/components/tenant/products/ProductSearch'
import { getProducts } from '@/server/products'
import { resolveTenantIdFromRequest, resolveTenantKeyFromId } from '@/server/tenant'
import { getRegistryEntry } from '@/registry/tenantRegistry'
import { SparklesIcon, StarIcon } from '@heroicons/react/24/outline'
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
  const tenantId = await resolveTenantIdFromRequest()
  
  if (!tenantId) {
    return {
      title: 'Products - CommerceNest',
      description: 'Discover our curated collection of premium products',
    }
  }

  const tenantKey = await resolveTenantKeyFromId(tenantId)
  
  if (tenantKey && tenantKey !== 'default') {
    const registryEntry = getRegistryEntry(tenantKey)
    const { getPageMetadata } = await registryEntry.metadata()
    return getPageMetadata('Products', 'Discover our curated collection of premium products')
  }
  
  // Default metadata for unknown tenants
  return {
    title: 'Products - CommerceNest',
    description: 'Discover our curated collection of premium products',
  }
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams
  const tenantId = await resolveTenantIdFromRequest()

  console.log('[PRODUCTS_PAGE] Resolved tenantId:', tenantId)
  
  // Fix headers usage
  const headersList = await (await import('next/headers')).headers()
  console.log('[PRODUCTS_PAGE] Current URL path:', headersList.get('x-pathname'))

  // For root routes (null tenantId), show platform-level products
  // This is CommerceNest platform showcase, not tenant-specific
  if (!tenantId) {
    // Show platform-level products (could be featured products from all tenants)
    const platformProducts = await getProducts({
      tenantId: null, // This will get products from all tenants for platform showcase
      search: params.search,
      category: params.category,
      status: 'published', // Only show published products on platform
      sort: params.sort,
      page: parseInt(params.page || '1'),
      limit: 12
    })

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Platform Header Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <SparklesIcon className="h-8 w-8 text-indigo-500 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">CommerceNest Products</h1>
              <SparklesIcon className="h-8 w-8 text-indigo-500 ml-3" />
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Discover products from our multi-tenant e-commerce platform. 
              Explore curated collections from various stores and brands.
            </p>
            
            {/* Trust Indicators */}
            <div className="flex items-center justify-center mt-6 space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                <span>4.8/5 Rating</span>
              </div>
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Free Shipping</span>
              </div>
              <div className="flex items-center">
                <svg className="h-4 w-4 text-blue-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Easy Returns</span>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-8">
            <ProductSearch />
            <ProductFilters />
          </div>

          {/* Platform Products Grid */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                Showing <span className="font-medium">{platformProducts.length}</span> products
              </p>
            </div>
            <ProductGrid products={platformProducts as unknown as UIProductListItem[]} />
          </div>

          {/* Platform Newsletter */}
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Stay Updated</h3>
            <p className="text-gray-600 mb-6">
              Subscribe to our newsletter for platform updates, new stores, and exclusive offers.
            </p>
            <div className="flex max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button className="px-6 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    )
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

  console.log('[PRODUCTS_PAGE] Fetched products for tenant:', tenantId, 'Count:', products.length)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <SparklesIcon className="h-8 w-8 text-indigo-500 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Fashion Collection</h1>
            <SparklesIcon className="h-8 w-8 text-indigo-500 ml-3" />
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Discover our curated collection of trendy fashion items. From elegant dresses to casual wear, 
            find your perfect style with our premium quality products.
          </p>
          
          {/* Trust Indicators */}
          <div className="flex items-center justify-center mt-6 space-x-8 text-sm text-gray-500">
            <div className="flex items-center">
              <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
              <span>4.8/5 Rating</span>
            </div>
            <div className="flex items-center">
              <svg className="h-4 w-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Free Shipping</span>
            </div>
            <div className="flex items-center">
              <svg className="h-4 w-4 text-blue-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Easy Returns</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <ProductSearch />
          <ProductFilters />
        </div>

        {/* Products Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{products.length}</span> products
            </p>
          </div>
          <ProductGrid products={products as unknown as UIProductListItem[]} />
        </div>

        {/* Newsletter */}
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">Stay in Style</h3>
          <p className="text-gray-600 mb-6">
            Subscribe to our newsletter for exclusive offers, new arrivals, and fashion tips.
          </p>
          <div className="flex max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button className="px-6 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}




