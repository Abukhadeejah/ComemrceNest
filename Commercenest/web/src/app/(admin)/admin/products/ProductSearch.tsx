'use client'

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'

interface ProductSearchProps {
  currentSearch?: string
}

export function ProductSearch({ currentSearch }: ProductSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      // Reset to page 1 when searching
      params.delete('page')
      return params.toString()
    },
    [searchParams]
  )

  const handleSearch = (term: string) => {
    startTransition(() => {
      router.push(`/admin/products?${createQueryString('search', term)}`)
    })
  }

  return (
    <div className="flex-1">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Search products by name..."
          defaultValue={currentSearch}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {isPending && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
          </div>
        )}
      </div>
    </div>
  )
}




