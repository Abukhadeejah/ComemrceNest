'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface ProductPaginationProps {
  page: number
  totalPages: number
  count: number
  pageSize: number
}

export function ProductPagination({ page, totalPages, count, pageSize }: ProductPaginationProps) {
  const router = useRouter()
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
    router.push(query ? `?${query}` : '?')
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
    router.push(query ? `?${query}` : '?')
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
    <div className="border-t border-gray-200 px-6 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-700">
          Showing {startItem}-{endItem} of {count} products
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="page-size" className="text-sm text-gray-700">
              Per page
            </label>
            <select
              id="page-size"
              value={pageSize}
              onChange={(e) => changePageSize(Number.parseInt(e.target.value, 10))}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-700"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {count > 0 && (
            <>
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {pageNumbers.map((pageNumber, index) => {
                const previousPage = pageNumbers[index - 1]
                const showGap = previousPage && pageNumber - previousPage > 1

                return (
                  <div key={pageNumber} className="flex items-center gap-1">
                    {showGap ? <span className="px-1 text-sm text-gray-500">...</span> : null}
                    <button
                      type="button"
                      onClick={() => goToPage(pageNumber)}
                      className={`min-w-9 rounded-md border px-2.5 py-1.5 text-sm ${
                        pageNumber === page
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                      aria-current={pageNumber === page ? 'page' : undefined}
                    >
                      {pageNumber}
                    </button>
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>

              <div className="flex items-center gap-2">
                <label htmlFor="go-to-page" className="text-sm text-gray-700">
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
                  className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-700"
                />
                <button
                  type="button"
                  onClick={submitPageInput}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Go
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}