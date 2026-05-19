'use client'

import { Suspense, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

// ─── Icons ──────────────────────────────────────────────────────────────────────

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

function ChevronsLeftIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
    </svg>
  )
}

function ChevronsRightIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M6 5l7 7-7 7" />
    </svg>
  )
}

// ─── Types ───────────────────────────────────────────────────────────────────────

interface ProductPaginationProps {
  page: number
  totalPages: number
  count: number
  pageSize: number
}

// ─── Inner: uses hooks — must be inside Suspense ──────────────────────────────────
// useSearchParams() requires a Suspense boundary. Without it Next.js App Router
// skips hydration on the component, so click handlers never fire.

function ProductPaginationInner({ page, totalPages, count, pageSize }: ProductPaginationProps) {
  const router = useRouter()
  const pathname = usePathname() ?? '/admin/products'
  const searchParams = useSearchParams()
  const [pageInput, setPageInput] = useState(String(page))

  // Build a URL for a given target page, preserving existing search/filter params.
  function buildPageUrl(targetPage: number): string {
    const safe = Math.min(Math.max(targetPage, 1), Math.max(totalPages, 1))
    const params = new URLSearchParams(searchParams.toString())
    if (safe <= 1) {
      params.delete('page')
    } else {
      params.set('page', String(safe))
    }
    const q = params.toString()
    return q ? `${pathname}?${q}` : pathname
  }

  // Build a URL for a page-size change (resets to page 1).
  function buildPageSizeUrl(nextPageSize: number): string {
    const params = new URLSearchParams(searchParams.toString())
    if (nextPageSize === 20) {
      params.delete('pageSize')
    } else {
      params.set('pageSize', String(nextPageSize))
    }
    params.delete('page')
    const q = params.toString()
    return q ? `${pathname}?${q}` : pathname
  }

  // "Go to page" input: the only place that still uses router.push
  // because we need to read a dynamic input value at submit time.
  function submitPageInput() {
    const parsed = Number.parseInt(pageInput, 10)
    if (!Number.isFinite(parsed) || parsed < 1) {
      setPageInput(String(page))
      return
    }
    router.push(buildPageUrl(parsed))
  }

  // Page numbers to display (current ±1, first, last; gaps shown as …)
  const pageNumbers = useMemo(() => {
    if (totalPages < 1) return [] as number[]
    const s = new Set<number>([1, totalPages, page - 1, page, page + 1])
    return Array.from(s)
      .filter((p) => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b)
  }, [page, totalPages])

  // Display range
  const validPage = totalPages > 0 ? Math.min(Math.max(page, 1), totalPages) : 1
  const startItem = count === 0 ? 0 : (validPage - 1) * pageSize + 1
  const endItem = Math.min(validPage * pageSize, count)

  // ── Shared style helpers ───────────────────────────────────────────────────────

  const navLinkBase: React.CSSProperties = {
    height: '36px',
    padding: '0 10px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    background: '#ffffff',
    color: '#374151',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
  }

  const navLinkDisabled: React.CSSProperties = {
    ...navLinkBase,
    opacity: 0.4,
    pointerEvents: 'none',
    cursor: 'not-allowed',
  }

  if (count === 0) {
    return (
      <div style={{
        borderTop: '1px solid #e5e7eb',
        padding: '20px 24px',
        textAlign: 'center',
        fontSize: '14px',
        color: '#9ca3af',
        background: '#f9fafb',
      }}>
        No products found.
      </div>
    )
  }

  return (
    <div style={{
      borderTop: '1px solid #e5e7eb',
      background: 'linear-gradient(to bottom, #f9fafb, #ffffff)',
      padding: '16px 24px',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* ── Row 1: Summary + rows per page ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}>
          {/* Summary pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 12px',
            borderRadius: '9999px',
            background: '#eef2ff',
            border: '1px solid #c7d2fe',
          }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#4f46e5' }}>{startItem}–{endItem}</span>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>of</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#4f46e5' }}>{count.toLocaleString()}</span>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>products</span>
          </div>

          {/* Rows per page — uses Link for navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', whiteSpace: 'nowrap' }}>
              Rows per page
            </span>
            {[20, 50, 100].map((size) => (
              <Link
                key={size}
                id={`page-size-${size}`}
                href={buildPageSizeUrl(size)}
                style={{
                  height: '32px',
                  padding: '0 10px',
                  borderRadius: '6px',
                  border: pageSize === size ? '1.5px solid #4f46e5' : '1px solid #d1d5db',
                  background: pageSize === size ? '#eef2ff' : '#ffffff',
                  color: pageSize === size ? '#4f46e5' : '#374151',
                  fontSize: '13px',
                  fontWeight: pageSize === size ? 700 : 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                {size}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Row 2: Navigation ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '6px',
        }}>
          {/* First */}
          <Link
            id="pagination-first"
            href={buildPageUrl(1)}
            style={page <= 1 ? navLinkDisabled : navLinkBase}
            aria-disabled={page <= 1}
            tabIndex={page <= 1 ? -1 : undefined}
            title="First page"
          >
            <ChevronsLeftIcon />
          </Link>

          {/* Prev */}
          <Link
            id="pagination-prev"
            href={buildPageUrl(page - 1)}
            style={page <= 1 ? navLinkDisabled : navLinkBase}
            aria-disabled={page <= 1}
            tabIndex={page <= 1 ? -1 : undefined}
            title="Previous page"
          >
            <ChevronLeftIcon />
            <span style={{ fontSize: '13px', fontWeight: 500 }}>Prev</span>
          </Link>

          {/* Page pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {pageNumbers.map((pageNumber, index) => {
              const prev = pageNumbers[index - 1]
              const showGap = prev && pageNumber - prev > 1
              const isActive = pageNumber === page
              return (
                <div key={pageNumber} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {showGap && (
                    <span style={{ fontSize: '13px', color: '#9ca3af', padding: '0 2px', userSelect: 'none' }}>…</span>
                  )}
                  <Link
                    id={`pagination-page-${pageNumber}`}
                    href={buildPageUrl(pageNumber)}
                    aria-current={isActive ? 'page' : undefined}
                    title={`Go to page ${pageNumber}`}
                    style={{
                      minWidth: '36px',
                      height: '36px',
                      padding: '0 10px',
                      borderRadius: '8px',
                      border: isActive ? '1.5px solid #4f46e5' : '1px solid #d1d5db',
                      background: isActive ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : '#ffffff',
                      color: isActive ? '#ffffff' : '#374151',
                      fontSize: '13px',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      boxShadow: isActive ? '0 2px 8px rgba(79,70,229,0.35)' : '0 1px 2px rgba(0,0,0,0.05)',
                      transform: isActive ? 'translateY(-1px)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {pageNumber}
                  </Link>
                </div>
              )
            })}
          </div>

          {/* Next */}
          <Link
            id="pagination-next"
            href={buildPageUrl(page + 1)}
            style={page >= totalPages ? navLinkDisabled : navLinkBase}
            aria-disabled={page >= totalPages}
            tabIndex={page >= totalPages ? -1 : undefined}
            title="Next page"
          >
            <span style={{ fontSize: '13px', fontWeight: 500 }}>Next</span>
            <ChevronRightIcon />
          </Link>

          {/* Last */}
          <Link
            id="pagination-last"
            href={buildPageUrl(totalPages)}
            style={page >= totalPages ? navLinkDisabled : navLinkBase}
            aria-disabled={page >= totalPages}
            tabIndex={page >= totalPages ? -1 : undefined}
            title="Last page"
          >
            <ChevronsRightIcon />
          </Link>

          {/* Divider */}
          <div style={{ width: '1px', height: '28px', background: '#e5e7eb', margin: '0 4px' }} />

          {/* Go-to input (only place router.push is used) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label
              htmlFor="go-to-page"
              style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', whiteSpace: 'nowrap' }}
            >
              Go to
            </label>
            <input
              id="go-to-page"
              type="number"
              min={1}
              max={Math.max(totalPages, 1)}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitPageInput() }}
              placeholder="—"
              style={{
                width: '58px',
                height: '36px',
                padding: '0 8px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                background: '#ffffff',
                fontSize: '13px',
                fontWeight: 500,
                color: '#374151',
                textAlign: 'center',
                outline: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            />
            <button
              type="button"
              id="pagination-go"
              onClick={submitPageInput}
              title="Jump to page"
              style={{
                height: '36px',
                padding: '0 14px',
                borderRadius: '8px',
                border: '1.5px solid #4f46e5',
                background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(79,70,229,0.3)',
                whiteSpace: 'nowrap',
              }}
            >
              Go
            </button>
          </div>
        </div>

        {/* Page X of Y */}
        {totalPages > 1 && (
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', margin: 0 }}>
            Page {validPage} of {totalPages}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Exported wrapper — provides the required Suspense boundary ──────────────────

export function ProductPagination(props: ProductPaginationProps) {
  return (
    <Suspense
      fallback={
        <div style={{
          borderTop: '1px solid #e5e7eb',
          padding: '18px 24px',
          textAlign: 'center',
          fontSize: '13px',
          color: '#9ca3af',
          background: '#f9fafb',
        }}>
          Loading…
        </div>
      }
    >
      <ProductPaginationInner {...props} />
    </Suspense>
  )
}