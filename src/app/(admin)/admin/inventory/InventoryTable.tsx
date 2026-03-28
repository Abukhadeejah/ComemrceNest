'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ADMIN_URLS } from '@/utils/admin-urls'
import { useAdminTenantKey } from '@/components/admin/AdminBrandingWrapper'

interface Product {
  id: string
  name: string
  slug: string
  sku?: string
  stock: number
  low_stock_threshold?: number | null
  track_inventory: boolean | null
  allow_backorders: boolean | null
  status: string
  price_cents: number
  created_at: string
  updated_at: string
}

interface InventoryTableProps {
  products: Product[]
}

export function InventoryTable({ products }: InventoryTableProps) {
  const [filter, setFilter] = useState<'all' | 'low-stock' | 'out-of-stock' | 'tracking'>('all')
  const tenantKey = useAdminTenantKey()

  const getStockStatus = (product: Product) => {
    if (!product.track_inventory) return 'not-tracking'
    if (product.stock <= 0) return 'out-of-stock'
    if (product.low_stock_threshold && product.stock <= product.low_stock_threshold) return 'low-stock'
    return 'in-stock'
  }

  const getStockStatusBadge = (product: Product) => {
    const status = getStockStatus(product)
    
    const statusConfig = {
      'not-tracking': { label: 'Not Tracking', className: 'bg-gray-100 text-gray-800' },
      'in-stock': { label: 'In Stock', className: 'bg-green-100 text-green-800' },
      'low-stock': { label: 'Low Stock', className: 'bg-yellow-100 text-yellow-800' },
      'out-of-stock': { label: 'Out of Stock', className: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status]
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  const filteredProducts = products.filter(product => {
    switch (filter) {
      case 'low-stock':
        return getStockStatus(product) === 'low-stock'
      case 'out-of-stock':
        return getStockStatus(product) === 'out-of-stock'
      case 'tracking':
        return product.track_inventory
      default:
        return true
    }
  })

  const formatPrice = (priceCents: number) => {
    return `₹${(priceCents / 100).toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-medium text-gray-900">Product Inventory</h3>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'all' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({products.length})
            </button>
            <button
              onClick={() => setFilter('tracking')}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'tracking' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tracking ({products.filter(p => p.track_inventory).length})
            </button>
            <button
              onClick={() => setFilter('low-stock')}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'low-stock' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Low Stock ({products.filter(p => getStockStatus(p) === 'low-stock').length})
            </button>
            <button
              onClick={() => setFilter('out-of-stock')}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'out-of-stock' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Out of Stock ({products.filter(p => getStockStatus(p) === 'out-of-stock').length})
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {product.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {product.slug}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.sku || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {product.track_inventory ? product.stock : '-'}
                  </div>
                  {product.track_inventory && product.low_stock_threshold && (
                    <div className="text-xs text-gray-500">
                      Threshold: {product.low_stock_threshold}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStockStatusBadge(product)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatPrice(product.price_cents)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(product.updated_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={ADMIN_URLS.productEdit(product.id, tenantKey)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found matching the current filter.</p>
        </div>
      )}
    </div>
  )
}


