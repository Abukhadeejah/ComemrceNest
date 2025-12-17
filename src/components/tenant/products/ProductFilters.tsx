'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { FunnelIcon } from '@heroicons/react/24/outline'


export function ProductFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  

  const [sortBy, setSortBy] = useState(searchParams.get('sort') || '')
  const [priceRange, setPriceRange] = useState(searchParams.get('price') || '')
  const [color, setColor] = useState(searchParams.get('color') || '')
  const [size, setSize] = useState(searchParams.get('size') || '')
  const [tag, setTag] = useState(searchParams.get('tag') || '')
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch tags from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const tagsResponse = await fetch('/api/site/tags')
        
        if (tagsResponse.ok) {
          const tagsData = await tagsResponse.json()
          setAvailableTags(tagsData.tags || [])
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])



  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (sortBy) {
      params.set('sort', sortBy)
    }
    
    if (priceRange) {
      params.set('price', priceRange)
    }

    if (color) {
      params.set('color', color)
    }

    if (size) {
      params.set('size', size)
    }

    if (tag) {
      params.set('tag', tag)
    }
    
    // Reset to page 1 when filtering
    params.delete('page')
    
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
    router.push(newUrl)
  }, [sortBy, priceRange, color, size, tag, router])

  const clearFilters = () => {
    setSortBy('')
    setPriceRange('')
    setColor('')
    setSize('')
    setTag('')
  }

  const hasActiveFilters = sortBy || priceRange || color || size || tag

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header with Sort */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {[sortBy, priceRange, color, size, tag].filter(Boolean).length} active
            </span>
          )}
        </div>
        
        {/* Sort Section */}
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-700">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e?.target?.value || '')}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="">Popularity</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
            <option value="name_desc">Name: Z to A</option>
            <option value="created_desc">Newest First</option>
            <option value="created_asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Active Filters Chips */}
      {hasActiveFilters && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Active filters:</span>
              <div className="flex flex-wrap gap-2">

                {color && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Accessories: {color}
                    <button
                      onClick={() => setColor('')}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                {size && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Men: {size}
                    <button
                      onClick={() => setSize('')}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                {priceRange && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Women: {priceRange}
                    <button
                      onClick={() => setPriceRange('')}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-yellow-400 hover:bg-yellow-200 hover:text-yellow-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                {tag && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Fashion: {tag}
                    <button
                      onClick={() => setTag('')}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple-400 hover:bg-purple-200 hover:text-purple-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                {sortBy && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Sort: {sortBy.replace('_', ' ')}
                    <button
                      onClick={() => setSortBy('')}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-500 font-medium"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Filter Grid */}
      <div className="p-4">
        <div className="space-y-6">


          {/* Other Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Fashion */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Fashion</label>
            <select
              value={tag}
              onChange={(e) => setTag(e?.target?.value || '')}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="">All Fashion</option>
              <option value="clothing">Clothing</option>
              <option value="footwear">Footwear</option>
              <option value="ethnic-wear">Ethnic Wear</option>
              <option value="western-wear">Western Wear</option>
              <option value="casual-wear">Casual Wear</option>
              <option value="formal-wear">Formal Wear</option>
              <option value="sportswear">Sportswear</option>
            </select>
          </div>

          {/* Accessories */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Accessories</label>
            <select
              value={color}
              onChange={(e) => setColor(e?.target?.value || '')}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="">All Accessories</option>
              <option value="bags">Bags</option>
              <option value="jewelry">Jewelry</option>
              <option value="watches">Watches</option>
              <option value="belts">Belts</option>
              <option value="scarves">Scarves</option>
              <option value="sunglasses">Sunglasses</option>
              <option value="hats">Hats</option>
              <option value="wallets">Wallets</option>
            </select>
          </div>

          {/* Men */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Men</label>
            <select
              value={size}
              onChange={(e) => setSize(e?.target?.value || '')}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="">All Men's</option>
              <option value="mens-shirts">Shirts</option>
              <option value="mens-pants">Pants</option>
              <option value="mens-jeans">Jeans</option>
              <option value="mens-t-shirts">T-Shirts</option>
              <option value="mens-jackets">Jackets</option>
              <option value="mens-shoes">Shoes</option>
              <option value="mens-accessories">Accessories</option>
            </select>
          </div>

          {/* Women */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Women</label>
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e?.target?.value || '')}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="">All Women's</option>
              <option value="womens-dresses">Dresses</option>
              <option value="womens-tops">Tops</option>
              <option value="womens-jeans">Jeans</option>
              <option value="womens-skirts">Skirts</option>
              <option value="womens-shoes">Shoes</option>
              <option value="womens-bags">Bags</option>
              <option value="womens-jewelry">Jewelry</option>
            </select>
          </div>

          </div>
        </div>
      </div>

    </div>
  )
}
