'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function BluebellProductSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')


  const suggestedSearches = [
    'cotton fabrics',
    'silk drapery',
    'velvet upholstery',
    'linen curtains',
    'geometric patterns',
    'floral designs',
    'neutral colors',
    'luxury textures'
  ]

  const handleSearch = (query: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (query.trim()) {
      params.set('search', query.trim())
    } else {
      params.delete('search')
    }
    
    params.set('page', '1') // Reset to first page
    router.push(`/bluebell/products?${params.toString()}`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(searchQuery)
  }

  const handleSuggestedSearch = (suggestion: string) => {
    setSearchQuery(suggestion)
    handleSearch(suggestion)
  }

  return (
    <div className="mb-8">
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-bluebell-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e?.target?.value || '')}

            placeholder="Search for fabrics, patterns, colors..."
            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl text-bluebell-brown placeholder-bluebell-brown/60 focus:border-bluebell-blue focus:ring-2 focus:ring-bluebell-blue/20 transition-all duration-300 text-lg"
          />
          
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                handleSearch('')
              }}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-bluebell-brown hover:text-bluebell-crimson transition-colors duration-300"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Suggested Searches */}
      <div className="mt-6">
        <div className="flex items-center mb-4">
          <span className="text-bluebell-brown font-medium mr-3">Try:</span>
          <div className="flex flex-wrap gap-2">
            {suggestedSearches.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestedSearch(suggestion)}
                className="px-4 py-2 bg-bluebell-mustard/10 hover:bg-bluebell-mustard/20 text-bluebell-brown rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 border border-transparent hover:border-bluebell-mustard/30"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Results Summary */}
      {searchQuery && (
        <div className="mt-4 p-4 bg-bluebell-blue/5 border border-bluebell-blue/20 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-bluebell-blue mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-bluebell-brown font-medium">
                Search results for: <span className="text-bluebell-blue font-semibold">&quot;{searchQuery}&quot;</span>
              </span>
            </div>
            <button
              onClick={() => {
                setSearchQuery('')
                handleSearch('')
              }}
              className="text-bluebell-crimson hover:text-red-600 text-sm font-medium transition-colors duration-300"
            >
              Clear search
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

