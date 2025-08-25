import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, host } = request.nextUrl
  
  // Add tenant host info to headers for server components
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-tenant-host', host)
  requestHeaders.set('x-pathname', pathname)
  
  // Add admin route flag
  const isAdminRoute = pathname.startsWith('/admin')
  const isTenantAdminRoute = pathname.match(/\/[^\/]+\/admin/)
  requestHeaders.set('x-is-admin-route', (isAdminRoute || isTenantAdminRoute) ? 'true' : 'false')
  
  // Add tenant admin route info
  if (isTenantAdminRoute) {
    const tenantMatch = pathname.match(/^\/([^\/]+)\/admin/)
    if (tenantMatch) {
      requestHeaders.set('x-tenant-admin', tenantMatch[1])
    }
  }
  
  // Add tenant route info for regular tenant routes (not just admin)
  const tenantRouteMatch = pathname.match(/^\/([^\/]+)(?:\/|$)/)
  if (tenantRouteMatch && !isAdminRoute) {
    const tenantKey = tenantRouteMatch[1]
    // Only set for known tenants
    if (tenantKey === 'bluebell' || tenantKey === 'senlysh') {
      requestHeaders.set('x-tenant-admin', tenantKey)
    }
  }
  
  // Debug logging
  console.log('Middleware - pathname:', pathname, 'host:', host, 'tenantAdmin:', requestHeaders.get('x-tenant-admin'))
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}


