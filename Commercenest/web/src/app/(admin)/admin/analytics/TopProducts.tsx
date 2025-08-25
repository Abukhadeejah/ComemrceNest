'use client'

interface TopProduct {
  id: string
  name: string
  sales: number
  revenue: number
}

interface TopProductsProps {
  products: TopProduct[]
}

export function TopProducts({ products }: TopProductsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Top Products</h3>
      <div className="space-y-4">
        {products.map((product, index) => (
          <div key={product.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {index + 1}
                </span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {product.name}
                </div>
                <div className="text-xs text-gray-500">
                  {product.sales} sales
                </div>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-900">
              {formatCurrency(product.revenue)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}




