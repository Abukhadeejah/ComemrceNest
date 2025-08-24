'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  EyeIcon, 
  PencilIcon, 
  TrashIcon
} from '@heroicons/react/24/outline'

interface Product {
  id: string
  name: string
  slug: string
  status: string
  price_cents: number
  stock: number
  created_at: string
  updated_at: string
}

interface ProductTableProps {
  products: Product[]
}

export function ProductTable({ products }: ProductTableProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map(p => p.id))
    } else {
      setSelectedProducts([])
    }
  }

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId])
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId))
    }
  }

  const formatPrice = (priceCents: number) => {
    return `₹${(priceCents / 100).toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800' },
      published: { label: 'Published', className: 'bg-green-100 text-green-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <input
            type="checkbox"
            checked={selectedProducts.length === products.length && products.length > 0}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-700">
            {selectedProducts.length} of {products.length} selected
          </span>
        </div>
        
        {selectedProducts.length > 0 && (
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50">
              Delete Selected
            </button>
            <button className="px-3 py-1 text-sm text-green-600 border border-green-300 rounded hover:bg-green-50">
              Publish Selected
            </button>
          </div>
        )}
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stock
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Updated
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                    className="mr-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {product.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {product.slug}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(product.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatPrice(product.price_cents)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {product.stock}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(product.updated_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Link>
                  <button className="text-red-600 hover:text-red-900">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found</p>
        </div>
      )}
    </div>
  )
}
