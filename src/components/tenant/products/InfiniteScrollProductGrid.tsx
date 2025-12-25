'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ProductGrid } from './ProductGrid'
import type { ProductListItem } from '@/types/product'

interface VariantCombination {
  product_id: string
  name: string | null
  price_cents: number
  stock: number | null
  sku: string | null
  attributes: Record<string, string>
}

interface InfiniteScrollProductGridProps {
  initialProducts: ProductListItem[]
  variantCombinations: VariantCombination[]
  tenantKey?: string | null
  columns?: number
  hasMore: boolean
  nextPageUrl: string
}

export function InfiniteScrollProductGrid({
  initialProducts,
  variantCombinations,
  tenantKey,
  columns = 4,
  hasMore: initialHasMore,
  nextPageUrl,
}: InfiniteScrollProductGridProps) {
  const [products, setProducts] = useState<ProductListItem[]>(initialProducts)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [isLoading, setIsLoading] = useState(false)
  const [allVariants, setAllVariants] = useState<VariantCombination[]>(variantCombinations)
  const observerTarget = useRef<HTMLDivElement>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!observerTarget.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore()
        }
      },
      { threshold: 0.2 }
    )

    observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [hasMore, isLoading])

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const pageNum = currentPage + 1
      const url = new URL(nextPageUrl, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
      url.searchParams.set('page', String(pageNum))

      const response = await fetch(url.toString())
      if (!response.ok) {
        console.error('Failed to load more products:', response.statusText)
        setIsLoading(false)
        return
      }

      const data = await response.json()

      // Append new products
      setProducts((prev) => [...prev, ...data.products])
      setAllVariants((prev) => [...prev, ...data.variantCombinations])
      setCurrentPage(pageNum)

      // Update pagination state
      setHasMore(data.hasMore)
    } catch (err) {
      console.error('Error loading more products:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, hasMore, nextPageUrl, currentPage])

  // Expose function to reset and load new products when filters change
  const refetchProducts = useCallback(async (newUrl: string) => {
    setIsLoading(true)
    try {
      // Ensure page is reset to 1 for new filters
      const url = new URL(newUrl, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
      url.searchParams.set('page', '1')

      const response = await fetch(url.toString())
      if (!response.ok) {
        console.error('Failed to fetch products:', response.statusText)
        setIsLoading(false)
        return
      }

      const data = await response.json()
      setProducts(data.products)
      setAllVariants(data.variantCombinations)
      setCurrentPage(1)
      setHasMore(data.hasMore)
    } catch (err) {
      console.error('Error refetching products:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update URL and refetch when filters change (exposed via ref if needed)
  useEffect(() => {
    // Store refetch function in global scope for wrapper to call
    ;(window as any).__refetchProducts = refetchProducts
  }, [refetchProducts])

  return (
    <>
      {/* Loading overlay during filter changes */}
      {isLoading && currentPage === 1 && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-indigo-600 rounded-full animate-bounce" />
            <span className="text-gray-600 text-sm">Updating filters...</span>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="relative">
        <ProductGrid
          products={products}
          variantCombinations={allVariants}
          tenantKey={tenantKey}
          columns={columns}
        />
      </div>

      {/* Intersection Observer Target */}
      <div ref={observerTarget} className="py-8 flex justify-center">
        {hasMore && isLoading && currentPage > 1 && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-indigo-600 rounded-full animate-bounce" />
            <span className="text-gray-600 text-sm">Loading more products...</span>
          </div>
        )}
        {!hasMore && products.length > 0 && (
          <span className="text-gray-500 text-sm">No more products to load</span>
        )}
      </div>
    </>
  )
}
