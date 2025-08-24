'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export function ProductSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')

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

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search products..."
        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      />
    </div>
  )
}


