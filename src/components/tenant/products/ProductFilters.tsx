'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback, useMemo } from 'react'
import { FunnelIcon } from '@heroicons/react/24/outline'

export function ProductFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get initial values from URL once
  const initialValues = useMemo(() => ({
    sort: searchParams.get('sort') || '',
    price: searchParams.get('price') || '',
    color: searchParams.get('color') || '',
    size: searchParams.get('size') || '',
    is_featured: searchParams.get('is_featured') === 'true',
    is_bestseller: searchParams.get('is_bestseller') === 'true',
    is_new_arrival: searchParams.get('is_new_arrival') === 'true',
    is_on_sale: searchParams.get('is_on_sale') === 'true',
    is_limited_edition: searchParams.get('is_limited_edition') === 'true'
  }), []) // Empty dependency array - only calculate once
  
  // State with initial values
  const [sortBy, setSortBy] = useState(initialValues.sort)
  const [priceRange, setPriceRange] = useState(initialValues.price)
  const [color, setColor] = useState(initialValues.color)
  const [size, setSize] = useState(initialValues.size)
  const [isFeatured, setIsFeatured] = useState(initialValues.is_featured)
  const [isBestseller, setIsBestseller] = useState(initialValues.is_bestseller)
  const [isNewArrival, setIsNewArrival] = useState(initialValues.is_new_arrival)
  const [isOnSale, setIsOnSale] = useState(initialValues.is_on_sale)
  const [isLimitedEdition, setIsLimitedEdition] = useState(initialValues.is_limited_edition)



  // Stable URL update function
  const updateURL = useCallback((newState: {
    sort?: string
    price?: string
    color?: string
    size?: string
    is_featured?: boolean
    is_bestseller?: boolean
    is_new_arrival?: boolean
    is_on_sale?: boolean
    is_limited_edition?: boolean
  }) => {
    const params = new URLSearchParams()
    
    const sort = newState.sort ?? sortBy
    const price = newState.price ?? priceRange
    const colorVal = newState.color ?? color
    const sizeVal = newState.size ?? size
    const featured = newState.is_featured ?? isFeatured
    const bestseller = newState.is_bestseller ?? isBestseller
    const newArrival = newState.is_new_arrival ?? isNewArrival
    const onSale = newState.is_on_sale ?? isOnSale
    const limitedEdition = newState.is_limited_edition ?? isLimitedEdition
    
    if (sort) params.set('sort', sort)
    if (price) params.set('price', price)
    if (colorVal) params.set('color', colorVal)
    if (sizeVal) params.set('size', sizeVal)
    if (featured) params.set('is_featured', 'true')
    if (bestseller) params.set('is_bestseller', 'true')
    if (newArrival) params.set('is_new_arrival', 'true')
    if (onSale) params.set('is_on_sale', 'true')
    if (limitedEdition) params.set('is_limited_edition', 'true')
    
    params.delete('page')
    
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
    router.replace(newUrl, { scroll: false })
  }, [router, sortBy, priceRange, color, size, isFeatured, isBestseller, isNewArrival, isOnSale, isLimitedEdition])

  // Stable filter change handlers
  const handleSortChange = useCallback((value: string) => {
    setSortBy(value)
    updateURL({ sort: value })
  }, [updateURL])

  const handlePriceChange = useCallback((value: string) => {
    setPriceRange(value)
    updateURL({ price: value })
  }, [updateURL])

  const handleColorChange = useCallback((value: string) => {
    setColor(value)
    updateURL({ color: value })
  }, [updateURL])

  const handleSizeChange = useCallback((value: string) => {
    setSize(value)
    updateURL({ size: value })
  }, [updateURL])

  // Handle badge filter changes
  const handleBadgeChange = useCallback((badgeType: string, checked: boolean) => {
    switch (badgeType) {
      case 'featured':
        setIsFeatured(checked)
        updateURL({ is_featured: checked })
        break
      case 'bestseller':
        setIsBestseller(checked)
        updateURL({ is_bestseller: checked })
        break
      case 'new_arrival':
        setIsNewArrival(checked)
        updateURL({ is_new_arrival: checked })
        break
      case 'on_sale':
        setIsOnSale(checked)
        updateURL({ is_on_sale: checked })
        break
      case 'limited_edition':
        setIsLimitedEdition(checked)
        updateURL({ is_limited_edition: checked })
        break
    }
  }, [updateURL])



  const clearFilters = useCallback(() => {
    setSortBy('')
    setPriceRange('')
    setColor('')
    setSize('')
    setIsFeatured(false)
    setIsBestseller(false)
    setIsNewArrival(false)
    setIsOnSale(false)
    setIsLimitedEdition(false)
    updateURL({ 
      sort: '', 
      price: '', 
      color: '', 
      size: '', 
      is_featured: false,
      is_bestseller: false,
      is_new_arrival: false,
      is_on_sale: false,
      is_limited_edition: false
    })
  }, [updateURL])

  const hasActiveFilters = sortBy || priceRange || color || size || isFeatured || isBestseller || isNewArrival || isOnSale || isLimitedEdition
  const activeFilterCount = [sortBy, priceRange, color, size].filter(Boolean).length + 
    [isFeatured, isBestseller, isNewArrival, isOnSale, isLimitedEdition].filter(Boolean).length

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
              {activeFilterCount} active
            </span>
          )}
        </div>
        
        {/* Sort Section */}
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-700">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e?.target?.value || '')}
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
                {/* Badge Chips */}
                {isFeatured && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Featured
                    <button
                      onClick={() => handleBadgeChange('featured', false)}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple-400 hover:bg-purple-200 hover:text-purple-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                {isBestseller && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    Bestseller
                    <button
                      onClick={() => handleBadgeChange('bestseller', false)}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-amber-400 hover:bg-amber-200 hover:text-amber-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                {isNewArrival && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    New Arrival
                    <button
                      onClick={() => handleBadgeChange('new_arrival', false)}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-emerald-400 hover:bg-emerald-200 hover:text-emerald-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                {isOnSale && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                    On Sale
                    <button
                      onClick={() => handleBadgeChange('on_sale', false)}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-rose-400 hover:bg-rose-200 hover:text-rose-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                {isLimitedEdition && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    Limited Edition
                    <button
                      onClick={() => handleBadgeChange('limited_edition', false)}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-600"
                    >
                      ×
                    </button>
                  </span>
                )}

                {color && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Color: {color}
                    <button
                      onClick={() => handleColorChange('')}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                {size && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Size: {size}
                    <button
                      onClick={() => handleSizeChange('')}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-600"
                    >
                      ×
                    </button>
                  </span>
                )}
                {priceRange && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Price: {priceRange}
                    <button
                      onClick={() => handlePriceChange('')}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-yellow-400 hover:bg-yellow-200 hover:text-yellow-600"
                    >
                      ×
                    </button>
                  </span>
                )}



                {sortBy && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Sort: {sortBy.replace('_', ' ')}
                    <button
                      onClick={() => handleSortChange('')}
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
          {/* Badge Filters Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">Product Badges</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Featured */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => handleBadgeChange('featured', e.target.checked)}
                  className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Featured</span>
              </label>

              {/* Bestseller */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBestseller}
                  onChange={(e) => handleBadgeChange('bestseller', e.target.checked)}
                  className="h-4 w-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700">Bestseller</span>
              </label>

              {/* New Arrival */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNewArrival}
                  onChange={(e) => handleBadgeChange('new_arrival', e.target.checked)}
                  className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">New Arrival</span>
              </label>

              {/* On Sale */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOnSale}
                  onChange={(e) => handleBadgeChange('on_sale', e.target.checked)}
                  className="h-4 w-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                />
                <span className="text-sm text-gray-700">On Sale</span>
              </label>

              {/* Limited Edition */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLimitedEdition}
                  onChange={(e) => handleBadgeChange('limited_edition', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Limited Edition</span>
              </label>
            </div>
          </div>

          {/* Other Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Color */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Color</label>
              <select
                value={color}
                onChange={(e) => handleColorChange(e?.target?.value || '')}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
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
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Size</label>
              <select
                value={size}
                onChange={(e) => handleSizeChange(e?.target?.value || '')}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
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
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Price Range</label>
              <select
                value={priceRange}
                onChange={(e) => handlePriceChange(e?.target?.value || '')}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="">All Prices</option>
                <option value="0-500">₹0 - ₹500</option>
                <option value="500-1000">₹500 - ₹1,000</option>
                <option value="1000-2000">₹1,000 - ₹2,000</option>
                <option value="2000-5000">₹2,000 - ₹5,000</option>
                <option value="5000+">₹5,000+</option>
              </select>
            </div>
          </div>


        </div>
      </div>

    </div>
  )
}
