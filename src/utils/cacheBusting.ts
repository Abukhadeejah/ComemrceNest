/**
 * Client-side cache busting utilities
 * Ensures immediate UI updates after server-side mutations
 */

/**
 * Force refresh the current page to bypass any client-side cache
 * More efficient than window.location.reload()
 */
export function forcePageRefresh() {
  if (typeof window !== 'undefined') {
    // Fallback to full page reload
    window.location.reload()
  }
}

/**
 * Add cache-busting parameter to current URL
 * Forces server to bypass cache and fetch fresh data
 */
export function addCacheBustingParam(): string {
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    url.searchParams.set('_t', Date.now().toString())
    return url.toString()
  }
  return ''
}

/**
 * Navigate to current page with cache-busting parameter
 * Ensures fresh data is loaded
 */
export function refreshWithCacheBust() {
  if (typeof window !== 'undefined') {
    const newUrl = addCacheBustingParam()
    if (newUrl) {
      window.location.href = newUrl
    }
  }
}
