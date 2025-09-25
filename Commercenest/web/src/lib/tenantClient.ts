'use client'

/**
 * Gets a cookie value by name from the browser's document.cookie
 * @param name The name of the cookie to retrieve
 * @returns The cookie value or null if not found
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  
  const cookies = document.cookie.split(';')
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim()
    // Check if this cookie starts with the name we want
    if (cookie.startsWith(name + '=')) {
      return decodeURIComponent(cookie.substring(name.length + 1))
    }
  }
  return null
}

/**
 * Determines the current tenant key from the URL path or cookie
 * @returns 'bluebell', 'senlysh', or null if no tenant is detected
 */
export function getTenantKeyClient(): 'bluebell' | 'senlysh' | null {
  // Guard for SSR
  if (typeof window === 'undefined') return null
  
  // Check pathname first
  const pathname = window.location.pathname
  const segments = pathname.split('/').filter(Boolean)
  
  if (segments.length > 0) {
    const firstSegment = segments[0].toLowerCase()
    if (firstSegment === 'bluebell' || firstSegment === 'senlysh') {
      return firstSegment as 'bluebell' | 'senlysh'
    }
  }
  
  // Fall back to cookie
  const cookieTenant = getCookie('tenant')?.toLowerCase()
  if (cookieTenant === 'bluebell' || cookieTenant === 'senlysh') {
    return cookieTenant as 'bluebell' | 'senlysh'
  }
  
  return null
}

/**
 * Creates a tenant-prefixed path if a tenant is detected
 * @param path The path to prefix with the tenant
 * @returns The path with tenant prefix (if detected) or the original path
 */
export function tenantPath(path: string): string {
  const tenantKey = getTenantKeyClient()
  
  if (!tenantKey) {
    return path
  }
  
  // Ensure path starts with a slash for consistent handling
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  
  // Prevent double tenant prefixing
  if (normalizedPath.startsWith(`/${tenantKey}/`) || normalizedPath === `/${tenantKey}`) {
    return normalizedPath
  }
  
  return `/${tenantKey}${normalizedPath}`
}
