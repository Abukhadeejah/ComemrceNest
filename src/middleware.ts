import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const headers = new Headers(request.headers);

  // Normalize path and get first segment
  const segments = pathname.replace(/\/+/g, '/').split('/').filter(Boolean);
  const firstSegment = segments[0] || '';
  const knownTenants = new Set(['bluebell', 'senlysh']);
  const tenantFromPath = knownTenants.has(firstSegment) ? firstSegment : '';

  // Known global routes that skip tenant logic
  const globalRoutes = new Set(['/login', '/checkout', '/cart']);
  const isGlobalRoute = globalRoutes.has(pathname);

  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

  // Detect tenant from host header
  const host = request.headers.get('host') || '';
  let tenantFromHost = '';
  if (/(^|\.)bluebell\.local(?::\d+)?$/i.test(host) || /(^|\.)bluebellstudio\.in(?::\d+)?$/i.test(host)) {
    tenantFromHost = 'bluebell';
  } else if (/(^|\.)senlysh\.local(?::\d+)?$/i.test(host) || /(^|\.)senlysh\.in(?::\d+)?$/i.test(host)) {
    tenantFromHost = 'senlysh';
  }

  // Set x-pathname header for proper tenant resolution
  headers.set('x-pathname', pathname);
  
  // Allow localhost requests to pass through without tenant redirect
  if (host.includes('localhost')) {
    const response = NextResponse.next({ request: { headers } });
    // Set x-pathname header in response for server components
    response.headers.set('x-pathname', pathname);
    // Still set tenant cookie for localhost
    if (tenantFromPath) {
      response.cookies.set('tenant', tenantFromPath, { path: '/', sameSite: 'lax' });
    }
    return response;
  }

  // Skip static assets immediately
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) {
    const response = NextResponse.next({ request: { headers } });
    response.headers.set('x-pathname', pathname);
    return response;
  }

  // If no tenant detected in path or host and path isn't global/admin/root,
  // allow request to proceed in non-production environments (e.g., preview, local).
  // Enforce tenant-not-found redirect only in production.
  if (!tenantFromPath && !tenantFromHost && !isAdminRoute && !isGlobalRoute && pathname !== '/') {
    if (process.env.NODE_ENV === 'production') {
      // Redirect to tenant not found page in production for unmatched tenants
      console.warn('[Middleware] Tenant NOT found - redirecting to tenant-not-found:', pathname, host);
      const response = NextResponse.redirect(new URL('/tenant-not-found', request.url));
      response.headers.set('x-pathname', pathname);
      return response;
    } else {
      // In non-production, just log and allow
      console.warn('[Middleware] Tenant NOT found but allowing:', pathname, host);
      const response = NextResponse.next({ request: { headers } });
      response.headers.set('x-pathname', pathname);
      return response;
    }
  }

  // If tenant found from host and not in path, rewrite to add tenant prefix
  if (tenantFromHost && !tenantFromPath && !isGlobalRoute) {
    const targetPath = pathname === '/' ? `/${tenantFromHost}` : `/${tenantFromHost}${pathname}`;
    const response = NextResponse.rewrite(new URL(targetPath, request.url), { request: { headers } });
    response.headers.set('x-pathname', targetPath);
    response.cookies.set('tenant', tenantFromHost, { path: '/', sameSite: 'lax' });
    response.cookies.set('tenant_mode', 'host', { path: '/', sameSite: 'lax' });
    return response;
  }

  // Handle tenant prefix in path: set tenant cookie and x-pathname header
  if (tenantFromPath) {
    const response = NextResponse.next({ request: { headers } });
    response.cookies.set('tenant', tenantFromPath, { path: '/', sameSite: 'lax' });
    response.headers.set('x-pathname', pathname);
    return response;
  }

  // Admin route authentication guard
  if (isAdminRoute) {
    const cookieHeader = request.headers.get('cookie') || '';
    const hasAuthCookie = /sb-.*-auth-token/.test(cookieHeader);

    const cookieTenant = request.cookies.get('tenant')?.value;
    const inferredTenant = (tenantFromHost && knownTenants.has(tenantFromHost))
      ? tenantFromHost
      : (cookieTenant && knownTenants.has(cookieTenant))
        ? cookieTenant
        : 'bluebell';

    headers.set('x-tenant-admin', inferredTenant);

    if (!hasAuthCookie) {
      const redirectResp = NextResponse.redirect(new URL('/login', request.url));
      redirectResp.headers.set('x-pathname', pathname);
      redirectResp.cookies.set('tenant', inferredTenant, { path: '/', sameSite: 'lax' });
      return redirectResp;
    }

    const response = NextResponse.next({ request: { headers } });
    response.headers.set('x-pathname', pathname);
    response.cookies.set('tenant', inferredTenant, { path: '/', sameSite: 'lax' });
    return response;
  }

  // Rewrite global routes from tenant prefixed paths
  if (tenantFromPath) {
    if (pathname === `/${tenantFromPath}/checkout` || pathname === `/${tenantFromPath}/cart`) {
      const globalTarget = `/${segments.slice(1).join('/')}`;
      const response = NextResponse.rewrite(new URL(globalTarget, request.url), { request: { headers } });
      response.headers.set('x-pathname', pathname);
      response.cookies.set('tenant', tenantFromPath, { path: '/', sameSite: 'lax' });
      return response;
    }
    if (segments.length >= 3 && segments[1] === 'orders') {
      const globalTarget = `/${segments.slice(1).join('/')}`;
      const response = NextResponse.rewrite(new URL(globalTarget, request.url), { request: { headers } });
      response.headers.set('x-pathname', pathname);
      response.cookies.set('tenant', tenantFromPath, { path: '/', sameSite: 'lax' });
      return response;
    }
    if (tenantFromPath === 'senlysh' && segments.length >= 3 && segments[1] === 'products') {
      const globalTarget = `/${segments.slice(1).join('/')}`;
      const response = NextResponse.rewrite(new URL(globalTarget, request.url), { request: { headers } });
      response.headers.set('x-pathname', pathname);
      response.cookies.set('tenant', tenantFromPath, { path: '/', sameSite: 'lax' });
      return response;
    }
  }

  const response = NextResponse.next({ request: { headers } });
  response.headers.set('x-pathname', pathname);
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
       