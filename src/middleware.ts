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
  const isGlobalRoute =
    globalRoutes.has(pathname) ||
    pathname.startsWith('/checkout/') ||
    pathname.startsWith('/cart/');

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
  
  // Allow localhost requests to pass through but still handle useful rewrites
  if (host.includes('localhost')) {
    // If tenant is in the path and user is visiting tenant-prefixed admin, rewrite to global /admin path
    if (tenantFromPath && segments.length >= 2 && segments[1] === 'admin') {
      const targetPath = `/${segments.slice(1).join('/')}`; // drop tenant prefix
      const response = NextResponse.rewrite(new URL(targetPath, request.url), { request: { headers } });
      response.headers.set('x-pathname', targetPath);
      response.cookies.set('tenant', tenantFromPath, { path: '/', sameSite: 'lax' });
      return response;
    }

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
  // try to infer from cookie or default to senlysh for production
  if (!tenantFromPath && !tenantFromHost && !isAdminRoute && !isGlobalRoute && pathname !== '/') {
    // Try to get tenant from cookie as fallback
    const cookieTenant = request.cookies.get('tenant')?.value;
    if (cookieTenant && knownTenants.has(cookieTenant)) {
      console.log('[Middleware] Using tenant from cookie:', cookieTenant);
      const response = NextResponse.next({ request: { headers } });
      response.headers.set('x-pathname', pathname);
      response.cookies.set('tenant', cookieTenant, { path: '/', sameSite: 'lax' });
      return response;
    }
    
    if (process.env.NODE_ENV === 'production') {
      // In production, default to senlysh if no tenant found (most common case)
      console.warn('[Middleware] No tenant found, defaulting to senlysh for:', pathname, host);
      const response = NextResponse.next({ request: { headers } });
      response.headers.set('x-pathname', pathname);
      response.cookies.set('tenant', 'senlysh', { path: '/', sameSite: 'lax' });
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
  // Keep /admin routes in the global admin flow to preserve correct admin auth/login behavior.
  if (tenantFromHost && !tenantFromPath && !isGlobalRoute && !isAdminRoute) {
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

    // For admin routes, prefer tenant from host, then cookie, then default
    const inferredTenant = tenantFromHost && knownTenants.has(tenantFromHost)
      ? tenantFromHost
      : (cookieTenant && knownTenants.has(cookieTenant))
        ? cookieTenant
        : 'senlysh'; // Default to senlysh for production

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
    // Rewrite tenant-prefixed admin routes to global /admin path
    if (segments.length >= 2 && segments[1] === 'admin') {
      const globalTarget = `/${segments.slice(1).join('/')}`;
      const response = NextResponse.rewrite(new URL(globalTarget, request.url), { request: { headers } });
      response.headers.set('x-pathname', pathname);
      response.cookies.set('tenant', tenantFromPath, { path: '/', sameSite: 'lax' });
      return response;
    }

    if (
      pathname === `/${tenantFromPath}/checkout` ||
      pathname === `/${tenantFromPath}/cart` ||
      pathname.startsWith(`/${tenantFromPath}/checkout/`) ||
      pathname.startsWith(`/${tenantFromPath}/cart/`)
    ) {
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


       