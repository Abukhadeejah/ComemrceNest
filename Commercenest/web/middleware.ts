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
  requestHeaders.set('x-is-admin-route', isAdminRoute ? 'true' : 'false')
  
  // Debug logging
  console.log('Middleware - pathname:', pathname, 'isAdminRoute:', isAdminRoute)
  
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


