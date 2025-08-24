'use client'

import { FunnelIcon } from '@heroicons/react/24/outline'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface Category {
  id: string
  name: string
}

interface ProductFiltersProps {
  currentStatus?: string
  currentCategory?: string
  categories: Category[]
}

export function ProductFilters({ 
  currentStatus, 
  currentCategory, 
  categories 
}: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      // Reset to page 1 when filtering
      params.delete('page')
      return params.toString()
    },
    [searchParams]
  )

  const handleFilterChange = (filterType: string, value: string) => {
    router.push(`/admin/products?${createQueryString(filterType, value)}`)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <FunnelIcon className="h-4 w-4 text-gray-400" />
        <select
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={currentStatus || 'all'}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2">
        <select
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={currentCategory || 'all'}
          onChange={(e) => handleFilterChange('category', e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Filters */}
      {(currentStatus || currentCategory) && (
        <button
          onClick={() => router.push('/admin/products')}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Clear Filters
        </button>
      )}
    </div>
  )
}


