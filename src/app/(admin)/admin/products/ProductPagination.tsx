'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

function ChevronLeftIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

interface ProductPaginationProps {
  page: number
  totalPages: number
  count: number
  pageSize: number
}

export function ProductPagination({ page, totalPages, count, pageSize }: ProductPaginationProps) {
  const router = useRouter()
  const pathname = usePathname() ?? '/admin/products'
  const searchParams = useSearchParams()
  const [pageInput, setPageInput] = useState(String(page))

  useEffect(() => {
    setPageInput(String(page))
  }, [page])

  // GUARDRAIL: Compute valid page value for display purposes
  // Does not trigger navigation - keeps page display consistent with backend-sanitized value
  const validPage = totalPages > 0 ? Math.min(Math.max(page, 1), totalPages) : 1
  const startItem = count === 0 ? 0 : (validPage - 1) * pageSize + 1
  const endItem = Math.min(validPage * pageSize, count)

  const goToPage = (nextPage: number) => {
    const safePage = Math.min(Math.max(nextPage, 1), Math.max(totalPages, 1))
    const params = new URLSearchParams(searchParams.toString())

    if (safePage <= 1) {
      params.delete('page')
    } else {
      params.set('page', String(safePage))
    }

    const query = params.toString()
    const url = query ? `${pathname}?${query}` : pathname
    router.push(url)
  }

  const changePageSize = (nextPageSize: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (nextPageSize === 20) {
      params.delete('pageSize')
    } else {
      params.set('pageSize', String(nextPageSize))
    }
    params.delete('page')

    const query = params.toString()
    const url = query ? `${pathname}?${query}` : pathname
    router.push(url)
  }

  const submitPageInput = () => {
    const parsedPage = Number.parseInt(pageInput, 10)
    if (!Number.isFinite(parsedPage)) {
      setPageInput(String(page))
      return
    }
    goToPage(parsedPage)
  }

  const pageNumbers = useMemo(() => {
    if (totalPages < 1) return [] as number[]

    const pages = new Set<number>([1, totalPages, page - 1, page, page + 1])
    return Array.from(pages)
      .filter((p) => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b)
  }, [page, totalPages])

  if (count === 0) {
    return (
      <div className="border-t border-gray-200 px-6 py-4 text-sm text-gray-600">
        No products found.
      </div>
    )
  }

  return (
    <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Info Section */}
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium text-gray-700">
            <span className="text-gray-900 font-semibold">{startItem}-{endItem}</span>
            <span className="text-gray-600"> of </span>
            <span className="text-gray-900 font-semibold">{count}</span>
            <span className="text-gray-600"> products</span>
          </p>
        </div>

        {/* Controls Section */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="page-size" className="text-sm font-medium text-gray-700">
              Show
            </label>
            <select
              id="page-size"
              value={pageSize}
              onChange={(e) => changePageSize(Number.parseInt(e.target.value, 10))}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:border-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-600">per page</span>
          </div>

          {/* Pagination Controls */}
          {count > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Previous Button */}
              <button
                type="button"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="inline-flex items-center justify-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                title="Go to previous page"
              >
                  <ChevronLeftIcon />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {pageNumbers.map((pageNumber, index) => {
                  const previousPage = pageNumbers[index - 1]
                  const showGap = previousPage && pageNumber - previousPage > 1

                  return (
                    <div key={pageNumber} className="flex items-center gap-1">
                      {showGap ? (
                        <span className="px-1.5 text-sm text-gray-500">…</span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => goToPage(pageNumber)}
                        className={`min-w-10 inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          pageNumber === page
                            ? 'bg-indigo-600 border border-indigo-600 text-white shadow-sm hover:bg-indigo-700'
                            : 'border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50'
                        }`}
                        aria-current={pageNumber === page ? 'page' : undefined}
                        title={`Go to page ${pageNumber}`}
                      >
                        {pageNumber}
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="inline-flex items-center justify-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                title="Go to next page"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRightIcon />
              </button>

              {/* Divider */}
              <div className="hidden sm:block w-px h-6 bg-gray-300"></div>

              {/* Go To Page Input */}
              <div className="flex items-center gap-2">
                <label htmlFor="go-to-page" className="text-sm font-medium text-gray-700">
                  Go to
                </label>
                <input
                  id="go-to-page"
                  type="number"
                  min={1}
                  max={Math.max(totalPages, 1)}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      submitPageInput()
                    }
                  }}
                  className="w-16 rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-gray-700 shadow-sm hover:border-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Page"
                />
                <button
                  type="button"
                  onClick={submitPageInput}
                  className="rounded-md border border-indigo-600 bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
                  title="Jump to page"
                >
                  Go
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}