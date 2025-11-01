import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const headers = new Headers(request.headers);

  console.log('[Middleware] Request path:', pathname);

  const segments = pathname.replace(/\/+/g, '/').split('/').filter(Boolean);
  const seg = segments[0] || '';
  const tenantFromPath = seg === 'bluebell' || seg === 'senlysh' ? seg : '';
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

  const legalPages = new Set([
    '/terms-and-conditions',
    '/terms-of-service',
    '/privacy-policy',
    '/refund-policy',
    '/shipping-policy',
    '/international-policy',
  ]);

  // Legal pages serve global without tenant prefix rewrite
  if (tenantFromPath && legalPages.has(pathname)) {
    console.log('[Legal Pages] Tenant:', tenantFromPath, 'Path:', pathname);
    const response = NextResponse.next({ request: { headers } });
    response.cookies.set('tenant', tenantFromPath, { path: '/', sameSite: 'lax' });
    return response;
  }

  headers.set('x-pathname', pathname);

  // Tenant detection from host
  const host = request.headers.get('host') || '';
  let tenantFromHost = '';
  if (/(^|\.)bluebell\.local(?::\d+)?$/i.test(host) || /(^|\.)bluebellstudio\.in(?::\d+)?$/i.test(host))
    tenantFromHost = 'bluebell';
  else if (/(^|\.)senlysh\.local(?::\d+)?$/i.test(host) || /(^|\.)senlysh\.in(?::\d+)?$/i.test(host))
    tenantFromHost = 'senlysh';

  console.log('[Middleware] Tenant from host:', tenantFromHost);

  // Global routes that do not require tenant prefix rewriting
  const globalNoRewrite = new Set(['/login', '/checkout', '/cart']);
  const isGlobalRoute = globalNoRewrite.has(pathname);

  // Skip static assets
  const looksLikeAsset = /\.[a-zA-Z0-9]+$/.test(pathname);
  if (looksLikeAsset) {
    console.log('[Middleware] Asset request, skipping rewrite:', pathname);
    return NextResponse.next({ request: { headers } });
  }

  // Rewrite routes if host provides tenant and path lacks tenant prefix
  if (tenantFromHost && !tenantFromPath && !isGlobalRoute) {
    headers.set('x-tenant-admin', tenantFromHost);
    console.log('[Middleware] Rewriting route for tenant from host:', tenantFromHost);

    const isProductsDetail = pathname.startsWith('/products/');
    if (tenantFromHost === 'senlysh' && isProductsDetail) {
      headers.set('x-pathname', pathname);
      const response = NextResponse.next({ request: { headers } });
      response.cookies.set('tenant', tenantFromHost, { path: '/', sameSite: 'lax' });
      return response;
    }

    const targetPath = pathname === '/' ? `/${tenantFromHost}` : `/${tenantFromHost}${pathname}`;
    headers.set('x-pathname', targetPath);
    const response = NextResponse.rewrite(new URL(targetPath, request.url), { request: { headers } });
    response.cookies.set('tenant', tenantFromHost, { path: '/', sameSite: 'lax' });
    response.cookies.set('tenant_mode', 'host', { path: '/', sameSite: 'lax' });
    return response;
  }

  // Tenant path prefix detected: set cookie and tenant header
  if (tenantFromPath) {
    headers.set('x-tenant-admin', tenantFromPath);
    console.log('[Middleware] Detected tenant from path:', tenantFromPath);

    const response = NextResponse.next({ request: { headers } });
    response.cookies.set('tenant', tenantFromPath, { path: '/', sameSite: 'lax' });
    return response;
  }

  // Admin route auth check & tenant inference
  if (isAdminRoute) {
    const cookieHeader = request.headers.get('cookie') || '';
    const hasAuthCookie = /sb-.*-auth-token/.test(cookieHeader);

    const cookieTenant = request.cookies.get('tenant')?.value;
    const inferredTenant = cookieTenant === 'bluebell' || cookieTenant === 'senlysh' ? cookieTenant : 'bluebell';
    headers.set('x-tenant-admin', inferredTenant);

    console.log('[Middleware] Admin route:', pathname, 'Tenant:', inferredTenant, 'Auth cookie:', hasAuthCookie);

    if (!hasAuthCookie) {
      const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
      redirectResponse.cookies.set('tenant', inferredTenant, { path: '/', sameSite: 'lax' });
      return redirectResponse;
    }

    const response = NextResponse.next({ request: { headers } });
    response.cookies.set('tenant', inferredTenant, { path: '/', sameSite: 'lax' });
    return response;
  }

  // Rewrites for tenant-prefixed global routes
  if (tenantFromPath) {
    // /{tenant}/checkout and /{tenant}/cart to global routes
    if (pathname === `/${tenantFromPath}/checkout` || pathname === `/${tenantFromPath}/cart`) {
      const globalTarget = `/${segments.slice(1).join('/')}`;
      console.log('[Middleware] Rewrite tenant-prefixed to global:', pathname, '->', globalTarget);
      headers.set('x-pathname', globalTarget);
      headers.set('x-tenant-admin', tenantFromPath);
      const response = NextResponse.rewrite(new URL(globalTarget, request.url), { request: { headers } });
      response.cookies.set('tenant', tenantFromPath, { path: '/', sameSite: 'lax' });
      return response;
    }

    // /{tenant}/orders/{id} to global path
    if (segments.length >= 3 && segments[1] === 'orders') {
      const globalTarget = `/${segments.slice(1).join('/')}`;
      console.log('[Middleware] Rewrite tenant-prefixed orders path:', pathname, '->', globalTarget);
      headers.set('x-pathname', globalTarget);
      headers.set('x-tenant-admin', tenantFromPath);
      const response = NextResponse.rewrite(new URL(globalTarget, request.url), { request: { headers } });
      response.cookies.set('tenant', tenantFromPath, { path: '/', sameSite: 'lax' });
      return response;
    }

    // Senlysh PDP rewrite to global route
    if (tenantFromPath === 'senlysh' && segments.length >= 3 && segments[1] === 'products') {
      const globalTarget = `/${segments.slice(1).join('/')}`;
      console.log('[Middleware] Rewrite Senlysh PDP:', pathname, '->', globalTarget);
      headers.set('x-pathname', globalTarget);
      headers.set('x-tenant-admin', tenantFromPath);
      const response = NextResponse.rewrite(new URL(globalTarget, request.url), { request: { headers } });
      response.cookies.set('tenant', tenantFromPath, { path: '/', sameSite: 'lax' });
      return response;
    }
  }

  console.log('[Middleware] No rewrite needed for:', pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
