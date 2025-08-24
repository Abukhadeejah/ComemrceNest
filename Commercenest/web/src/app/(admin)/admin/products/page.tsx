import { Suspense } from 'react'
import { getProducts, getCategories } from './actions'
import { ProductTable } from './ProductTable'
import { ProductSearch } from './ProductSearch'
import { ProductFilters } from './ProductFilters'
import { CreateProductButton } from './CreateProductButton'

interface AdminProductsProps {
  searchParams: Promise<{
    search?: string
    status?: string
    category?: string
    page?: string
    sort?: string
  }>
}

export default async function AdminProducts({ searchParams }: AdminProductsProps) {
  try {
    const params = await searchParams
    
    const [products, categories] = await Promise.all([
      getProducts(params),
      getCategories()
    ])

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <CreateProductButton />
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <ProductSearch currentSearch={params.search} />
              <ProductFilters 
                categories={categories}
                currentStatus={params.status}
                currentCategory={params.category}
              />
            </div>
          </div>

          <Suspense fallback={<div className="p-6">Loading products...</div>}>
            <ProductTable
              products={products.data || []}
            />
          </Suspense>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Admin Products Error:', error)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Products</h2>
          <p className="text-red-700 mb-4">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <div className="bg-gray-100 p-3 rounded text-sm font-mono">
            <pre>{JSON.stringify(error, null, 2)}</pre>
          </div>
        </div>
      </div>
    )
  }
}


