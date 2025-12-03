'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { FunnelIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { CategoryTree } from './CategoryTree'
import { Category, CategoryTree as CategoryTreeType, buildCategoryTree, filterTestCategories } from '@/lib/categories'

export function ProductFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Parse categories from URL - support both single and multiple
  const getInitialCategories = () => {
    const singleCategory = searchParams.get('category')
    const multipleCategories = searchParams.getAll('categories[]')
    
    if (multipleCategories.length > 0) {
      return multipleCategories
    } else if (singleCategory) {
      return [singleCategory]
    }
    return []
  }
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>(getInitialCategories())
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || '')
  const [priceRange, setPriceRange] = useState(searchParams.get('price') || '')
  const [color, setColor] = useState(searchParams.get('color') || '')
  const [size, setSize] = useState(searchParams.get('size') || '')
  const [tag, setTag] = useState(searchParams.get('tag') || '')
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryTree, setCategoryTree] = useState<CategoryTreeType[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [categoriesExpanded, setCategoriesExpanded] = useState(true)

  // Fetch categories and tags from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, tagsResponse] = await Promise.all([
          fetch('/api/site/categories?with_counts=true'),
          fetch('/api/site/tags')
        ])
        
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          const filteredCategories = filterTestCategories(categoriesData.categories || [])
          setCategories(filteredCategories)
          setCategoryTree(buildCategoryTree(filteredCategories))
        }
        
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

  // Handle category selection
  const handleCategoryToggle = (slug: string, checked: boolean) => {
    const newSelected = checked
      ? [...selectedCategories, slug]
      : selectedCategories.filter(s => s !== slug)
    
    setSelectedCategories(newSelected)
  }

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    
    // Handle multiple categories
    selectedCategories.forEach(categorySlug => {
      params.append('categories[]', categorySlug)
    })
    
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
  }, [selectedCategories, sortBy, priceRange, color, size, tag, router])

  const clearFilters = () => {
    setSelectedCategories([])
    setSortBy('')
    setPriceRange('')
    setColor('')
    setSize('')
    setTag('')
  }

  const hasActiveFilters = selectedCategories.length > 0 || sortBy || priceRange || color || size || tag

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
              {[...selectedCategories, sortBy, priceRange, color, size, tag].filter(Boolean).length} active
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
                {selectedCategories.map(categorySlug => {
                  const category = categories.find(c => c.slug === categorySlug)
                  return category ? (
                    <span key={categorySlug} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      Category: {category.name}
                      <button
                        onClick={() => handleCategoryToggle(categorySlug, false)}
                        className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-600"
                      >
                        ×
                      </button>
                    </span>
                  ) : null
                })}
                {color && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Color: {color}
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
                    Size: {size}
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
                    Price: {priceRange}
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
                    Tag: {tag}
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
          {/* Categories - Nested Tree */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Categories {categoryTree.length > 0 && `(${categories.length})`}
              </label>
              <button
                type="button"
                onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                {categoriesExpanded ? (
                  <>
                    <ChevronUpIcon className="h-4 w-4 mr-1" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDownIcon className="h-4 w-4 mr-1" />
                    Expand
                  </>
                )}
              </button>
            </div>
            
            {categoriesExpanded && (
              <div className="border border-gray-200 rounded-lg p-4 max-h-80 overflow-y-auto bg-white">
                {loading ? (
                  <div className="text-sm text-gray-500 text-center py-4">Loading categories...</div>
                ) : categoryTree.length > 0 ? (
                  <CategoryTree
                    categories={categoryTree}
                    selectedSlugs={selectedCategories}
                    onToggle={handleCategoryToggle}
                  />
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">No categories available</div>
                )}
              </div>
            )}
          </div>

          {/* Other Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Color */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Color</label>
            <select
              value={color}
              onChange={(e) => setColor(e?.target?.value || '')}
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
              onChange={(e) => setSize(e?.target?.value || '')}
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
              onChange={(e) => setPriceRange(e?.target?.value || '')}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
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


          {/* Tags */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Tags</label>
            <select
              value={tag}
              onChange={(e) => setTag(e?.target?.value || '')}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              disabled={loading}
            >
              <option value="">All Tags</option>
              {availableTags.map((tagName) => (
                <option key={tagName} value={tagName}>
                  {tagName}
                </option>
              ))}
            </select>
          </div>


          </div>
        </div>
      </div>

    </div>
  )
}
