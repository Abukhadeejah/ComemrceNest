'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { MagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/outline'

export function ProductSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fashion search suggestions
  const searchSuggestions = [
    'Summer dresses',
    'Denim jeans',
    'Cotton t-shirts',
    'Leather bags',
    'Running shoes',
    'Silver jewelry',
    'Casual blazers',
    'Wireless headphones'
  ]

  // Update URL when search term changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      
      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim())
      } else {
        params.delete('search')
      }
      
      // Reset to page 1 when searching
      params.delete('page')
      
      const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
      router.push(newUrl)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, router, searchParams])

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion)
    setIsFocused(false)
    inputRef.current?.blur()
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder="Search for dresses, jeans, shoes, bags..."
          className="block w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm hover:shadow-md transition-shadow duration-200"
        />
        {searchTerm && (
          <button
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Search Suggestions */}
      {isFocused && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center text-sm text-gray-600">
              <SparklesIcon className="h-4 w-4 mr-2 text-indigo-500" />
              <span className="font-medium">Popular searches</span>
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {searchSuggestions
              .filter(suggestion => 
                !searchTerm || 
                suggestion.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center"
                >
                  <MagnifyingGlassIcon className="h-4 w-4 mr-3 text-gray-400" />
                  {suggestion}
                </button>
              ))}
            {searchTerm && searchSuggestions.filter(s => 
              s.toLowerCase().includes(searchTerm.toLowerCase())
            ).length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-500">
                No suggestions found for &ldquo;{searchTerm}&rdquo;
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Tips */}
      {!searchTerm && !isFocused && (
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="text-xs text-gray-500">Try:</span>
          {['dresses', 'jeans', 'shoes', 'bags'].map((tip) => (
            <button
              key={tip}
              onClick={() => setSearchTerm(tip)}
              className="text-xs text-indigo-600 hover:text-indigo-500 hover:underline transition-colors duration-150"
            >
              {tip}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}





