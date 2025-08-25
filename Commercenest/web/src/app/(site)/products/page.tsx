import { Suspense } from 'react'
import { ProductGrid } from '@/components/tenant/products/ProductGrid'
import { ProductFilters } from '@/components/tenant/products/ProductFilters'
import { ProductSearch } from '@/components/tenant/products/ProductSearch'
import { getProducts } from '@/server/products'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { SparklesIcon, StarIcon } from '@heroicons/react/24/outline'

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string
    category?: string
    status?: string
    sort?: string
    page?: string
  }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
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
        <div className="mb-8 space-y-6">
          <ProductSearch />
          <ProductFilters />
        </div>

        {/* Results Summary */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{products.length}</span> products
            {params.search && (
              <span> for &ldquo;<span className="font-medium">{params.search}</span>&rdquo;</span>
            )}
            {params.category && (
              <span> in <span className="font-medium">{params.category}</span></span>
            )}
          </div>
          
          {/* View Options */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">View:</span>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </button>
            <button className="p-2 text-indigo-600">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Products Grid */}
        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductGrid products={products} />
        </Suspense>

        {/* Load More Section */}
        {products.length >= 12 && (
          <div className="text-center mt-12">
            <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium">
              Load More Products
            </button>
          </div>
        )}

        {/* Newsletter Signup */}
        <div className="mt-16 bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Stay in Style</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Subscribe to our newsletter for exclusive offers, new arrivals, and fashion tips.
          </p>
          <div className="flex max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button className="bg-indigo-600 text-white px-6 py-3 rounded-r-lg hover:bg-indigo-700 transition-colors duration-200 font-medium">
              Subscribe
            </button>
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
        <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse border border-gray-100">
          <div className="aspect-[4/5] bg-gray-200" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="flex space-x-1">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="h-3 w-3 bg-gray-200 rounded" />
              ))}
            </div>
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="flex gap-1">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="h-6 w-8 bg-gray-200 rounded" />
              ))}
            </div>
            <div className="flex justify-between items-center">
              <div className="h-3 bg-gray-200 rounded w-16" />
              <div className="h-8 bg-gray-200 rounded w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}


