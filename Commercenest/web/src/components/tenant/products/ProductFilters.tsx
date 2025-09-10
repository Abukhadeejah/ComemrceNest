'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ChevronDownIcon, FunnelIcon } from '@heroicons/react/24/outline'

interface Category {
  id: string
  name: string
  slug: string
  parent_id?: string
}

export function ProductFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || '')
  const [priceRange, setPriceRange] = useState(searchParams.get('price') || '')
  const [color, setColor] = useState(searchParams.get('color') || '')
  const [size, setSize] = useState(searchParams.get('size') || '')
  const [fabric, setFabric] = useState(searchParams.get('fabric') || '')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/site/categories')
        if (response.ok) {
          const data = await response.json()
          setCategories(data.categories || [])
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (category) {
      params.set('category', category)
    } else {
      params.delete('category')
    }
    
    if (sortBy) {
      params.set('sort', sortBy)
    } else {
      params.delete('sort')
    }
    
    if (priceRange) {
      params.set('price', priceRange)
    } else {
      params.delete('price')
    }

    if (color) {
      params.set('color', color)
    } else {
      params.delete('color')
    }

    if (size) {
      params.set('size', size)
    } else {
      params.delete('size')
    }

    if (fabric) {
      params.set('fabric', fabric)
    } else {
      params.delete('fabric')
    }
    
    // Reset to page 1 when filtering
    params.delete('page')
    
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
    router.push(newUrl)
  }, [category, sortBy, priceRange, color, size, fabric, router, searchParams])

  const clearFilters = () => {
    setCategory('')
    setSortBy('')
    setPriceRange('')
    setColor('')
    setSize('')
    setFabric('')
  }

  const hasActiveFilters = category || sortBy || priceRange || color || size || fabric

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Filter Bar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900">Filter by:</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Horizontal Filter Bar */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Categories */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Categories</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={loading}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Color */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Color</span>
          <select
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Colors</option>
            <option value="red">Red</option>
            <option value="blue">Blue</option>
            <option value="green">Green</option>
            <option value="black">Black</option>
            <option value="white">White</option>
            <option value="gray">Gray</option>
            <option value="brown">Brown</option>
            <option value="pink">Pink</option>
            <option value="purple">Purple</option>
            <option value="yellow">Yellow</option>
          </select>
        </div>

        {/* Size */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Size</span>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Sizes</option>
            <option value="xs">XS</option>
            <option value="s">S</option>
            <option value="m">M</option>
            <option value="l">L</option>
            <option value="xl">XL</option>
            <option value="xxl">XXL</option>
            <option value="30">30</option>
            <option value="32">32</option>
            <option value="34">34</option>
            <option value="36">36</option>
            <option value="38">38</option>
            <option value="40">40</option>
            <option value="42">42</option>
          </select>
        </div>

        {/* Price Range */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Price</span>
          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Prices</option>
            <option value="0-500">Under ₹500</option>
            <option value="500-1000">₹500 - ₹1,000</option>
            <option value="1000-2000">₹1,000 - ₹2,000</option>
            <option value="2000-5000">₹2,000 - ₹5,000</option>
            <option value="5000-10000">₹5,000 - ₹10,000</option>
            <option value="10000+">Over ₹10,000</option>
          </select>
        </div>

        {/* Fabric */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Fabric</span>
          <select
            value={fabric}
            onChange={(e) => setFabric(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Fabrics</option>
            <option value="cotton">Cotton</option>
            <option value="polyester">Polyester</option>
            <option value="wool">Wool</option>
            <option value="silk">Silk</option>
            <option value="denim">Denim</option>
            <option value="linen">Linen</option>
            <option value="synthetic">Synthetic</option>
            <option value="blend">Blend</option>
          </select>
        </div>

        {/* More Options */}
        <div className="flex items-center space-x-2">
          <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1">
            <span>More</span>
            <ChevronDownIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Sort By */}
        <div className="flex items-center space-x-2 ml-auto">
          <span className="text-sm font-medium text-gray-700">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
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

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {category && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Category: {category}
                <button
                  onClick={() => setCategory('')}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                >
                  ×
                </button>
              </span>
            )}
            {color && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Color: {color}
                <button
                  onClick={() => setColor('')}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                >
                  ×
                </button>
              </span>
            )}
            {size && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Size: {size}
                <button
                  onClick={() => setSize('')}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                >
                  ×
                </button>
              </span>
            )}
            {priceRange && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Price: {priceRange}
                <button
                  onClick={() => setPriceRange('')}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                >
                  ×
                </button>
              </span>
            )}
            {fabric && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Fabric: {fabric}
                <button
                  onClick={() => setFabric('')}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                >
                  ×
                </button>
              </span>
            )}
            {sortBy && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Sort: {sortBy}
                <button
                  onClick={() => setSortBy('')}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
