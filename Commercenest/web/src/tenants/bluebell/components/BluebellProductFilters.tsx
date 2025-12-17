'use client'

import { useMemo, useState } from 'react'
import type { ProductListItem } from '@/server/modules/products/service'

interface BluebellProductFiltersProps {
  products: ProductListItem[]
}

export default function BluebellProductFilters({ products }: BluebellProductFiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPriceRange, setSelectedPriceRange] = useState('all')
  const [selectedFabricTypes, setSelectedFabricTypes] = useState<string[]>(['all'])

  const categoryCounts = useMemo(() => ({
    all: products.length,
    cotton: products.filter(p => p.name?.toLowerCase().includes('cotton')).length,
    silk: products.filter(p => p.name?.toLowerCase().includes('silk')).length,
    velvet: products.filter(p => p.name?.toLowerCase().includes('velvet')).length,
    linen: products.filter(p => p.name?.toLowerCase().includes('linen')).length
  }), [products])

  const priceRangeCounts = useMemo(() => ({
    all: products.length,
    'under-100': products.filter(p => p.price_cents && p.price_cents < 10000).length,
    '100-200': products.filter(p => p.price_cents && p.price_cents >= 10000 && p.price_cents < 20000).length,
    '200-plus': products.filter(p => p.price_cents && p.price_cents >= 20000).length
  }), [products])

  const handleFabricTypeChange = (fabricType: string) => {
    if (fabricType === 'all') {
      setSelectedFabricTypes(['all'])
    } else {
      setSelectedFabricTypes(prev => {
        const newSelection = prev.filter(type => type !== 'all')
        if (newSelection.includes(fabricType)) {
          return newSelection.filter(type => type !== fabricType)
        } else {
          return [...newSelection, fabricType]
        }
      })
    }
  }

  const clearAllFilters = () => {
    setSelectedCategory('all')
    setSelectedPriceRange('all')
    setSelectedFabricTypes(['all'])
  }

  const hasActiveFilters = selectedCategory !== 'all' || selectedPriceRange !== 'all' || selectedFabricTypes.length > 1

  return (
    <div className="lg:w-80 flex-shrink-0">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 sticky top-32">
        <h3 className="text-2xl font-serif font-bold text-[#01589D] mb-8">Filter & Sort</h3>
        
        {/* Sort Dropdown */}
        <div className="mb-8">
          <label className="block text-bluebell-brown font-semibold mb-4 text-lg">Sort By</label>
          <div className="relative">
            <button className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-left text-bluebell-brown hover:border-bluebell-blue transition-colors duration-300 flex items-center justify-between">
              <span>Popularity</span>
              <svg className="w-5 h-5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Fabric Type Filter */}
        <div className="mb-8">
          <h4 className="text-bluebell-brown font-semibold mb-4 text-lg">Fabric Type</h4>
          <div className="space-y-3">
            {Object.entries(categoryCounts).map(([category, count]) => (
              <label 
                key={category} 
                className={`filter-option flex items-center p-3 rounded-xl cursor-pointer transition-all duration-300 hover:bg-bluebell-mustard/10 hover:translate-x-1 ${
                  selectedFabricTypes.includes(category) ? 'active bg-bluebell-blue/10 border-l-4 border-bluebell-blue' : ''
                }`}
              >
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={selectedFabricTypes.includes(category)}
                  onChange={() => handleFabricTypeChange(category)}
                />
                <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-all duration-300 ${
                  selectedFabricTypes.includes(category) 
                    ? 'bg-bluebell-blue border-bluebell-blue' 
                    : 'bg-white border-gray-300'
                }`}>
                  {selectedFabricTypes.includes(category) && (
                    <svg className="w-3 h-3 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  )}
                </div>
                <span className="text-bluebell-brown font-medium capitalize">
                  {category === 'all' ? 'All Types' : category}
                </span>
                <span className="ml-auto text-bluebell-blue text-sm font-semibold">({count})</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Price Range Filter */}
        <div className="mb-8">
          <h4 className="text-bluebell-brown font-semibold mb-4 text-lg">Price Range</h4>
          <div className="space-y-3">
            {Object.entries(priceRangeCounts).map(([range, count]) => (
              <label
                key={range}
                className={`filter-option flex items-center p-3 rounded-xl cursor-pointer transition-all duration-300 hover:bg-bluebell-mustard/10 hover:translate-x-1 ${
                  selectedPriceRange === range ? 'active bg-bluebell-blue/10 border-l-4 border-bluebell-blue' : ''
                }`}
              >
                <input
                  type="radio"
                  name="price"
                  className="sr-only"
                  checked={selectedPriceRange === range}
                  onChange={() => setSelectedPriceRange(range)}
                />
                <div className={`w-5 h-5 rounded-full border-2 mr-3 transition-all duration-300 ${
                  selectedPriceRange === range 
                    ? 'bg-bluebell-blue border-bluebell-blue' 
                    : 'bg-white border-gray-300'
                }`}></div>
                <span className="text-bluebell-brown font-medium">
                  {range === 'all' ? 'All Prices' : 
                   range === 'under-100' ? 'Under ₹100' :
                   range === '100-200' ? '₹100 - ₹200' :
                   '₹200+'}
                </span>
                <span className="ml-auto text-bluebell-blue text-sm font-semibold">({count})</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button 
            onClick={clearAllFilters}
            className="w-full bg-bluebell-crimson hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
          >
            Clear All Filters
          </button>
        )}
      </div>
    </div>
  )
}
