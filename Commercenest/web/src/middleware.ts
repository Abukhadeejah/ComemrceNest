import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const headers = new Headers(request.headers);

  const segments = pathname.replace(/\/+/g, '/').split('/').filter(Boolean);
  const seg = segments[0] || '';
  const tenantFromPath = seg === 'bluebell' || seg === 'senlysh' ? seg : '';
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

  // Explicit set of your legal page paths
  const legalPages = new Set([
    '/terms-and-conditions',
    '/terms-of-service',
    '/privacy-policy',
    '/refund-policy',
    '/shipping-policy',
    '/international-policy',
  ]);

  // Allow legal pages to serve as global paths without tenant prefix rewrites
  if (tenantFromPath && legalPages.has(pathname)) {
    const response = NextResponse.next({ request: { headers } });
    response.cookies.set('tenant', tenantFromPath, { path: '/', sameSite: 'lax' });
    return response;
  }

  // Basic header for downstream usage
  headers.set('x-pathname', pathname);

  // Host-based detection (local and production custom domains)
  const host = request.headers.get('host') || '';
  let tenantFromHost = '';
  if (/(^|\.)bluebell\.local(?::\d+)?$/i.test(host) || /(^|\.)bluebellstudio\.in(?::\d+)?$/i.test(host)) tenantFromHost = 'bluebell';
  else if (/(^|\.)senlysh\.local(?::\d+)?$/i.test(host) || /(^|\.)senlysh\.in(?::\d+)?$/i.test(host)) tenantFromHost = 'senlysh';

  // Global (non-tenant) routes that must not be rewritten
  const globalNoRewrite = new Set(['/login', '/checkout', '/cart']);
  const isGlobalRoute = globalNoRewrite.has(pathname);

  // Static assets should never be rewritten (images, svgs, etc.)
  const looksLikeAsset = /\.[a-zA-Z0-9]+$/.test(pathname);
  if (looksLikeAsset) {
    return NextResponse.next({ request: { headers } });
  }

  // If host maps to a tenant and the path is not already tenant-prefixed
  if (tenantFromHost && !tenantFromPath && !isGlobalRoute) {
    headers.set('x-tenant-admin', tenantFromHost);

    // Special-case: Senlysh PDP should use global route `/products/[slug]`
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

  // Path-based tenancy (staging/local) with cookie fallback
  if (tenantFromPath) {
    headers.set('x-tenant-admin', tenantFromPath);

    // Do NOT rewrite tenant-prefixed admin routes; let them resolve to tenant-admin tree
    const response = NextResponse.next({ request: { headers } });
    response.cookies.set('tenant', tenantFromPath, { path: '/', sameSite: 'lax' });
    return response;
  }

  if (isAdminRoute) {
    const cookieHeader = request.headers.get('cookie') || '';
    const hasAuthCookie = /sb-.*-auth-token/.test(cookieHeader);

    const cookieTenant = request.cookies.get('tenant')?.value;
    const inferredTenant = cookieTenant === 'bluebell' || cookieTenant === 'senlysh' ? cookieTenant : 'bluebell';
    headers.set('x-tenant-admin', inferredTenant);

    if (!hasAuthCookie) {
      const redirectResp = NextResponse.redirect(new URL('/login', request.url));
      redirectResp.cookies.set('tenant', inferredTenant, { path: '/', sameSite: 'lax' });
      return redirectResp;
    }

    const response = NextResponse.next({ request: { headers } });
    response.cookies.set('tenant', inferredTenant, { path: '/', sameSite: 'lax' });
    return response;
  }

  // If path is tenant-prefixed but points to a global page, rewrite to global
  if (tenantFromPath) {
    // /{tenant}/checkout -> /checkout, /{tenant}/cart -> /cart
    if (pathname === `/${tenantFromPath}/checkout` || pathname === `/${tenantFromPath}/cart`) {
      const globalTarget = `/${segments.slice(1).join('/')}`;
      headers.set('x-pathname', globalTarget);
      headers.set('x-tenant-admin', tenantFromPath);
      const response = NextResponse.rewrite(new URL(globalTarget, request.url), { request: { headers } });
      response.cookies.set('tenant', tenantFromPath, { path: '/', sameSite: 'lax' });
      return response;
    }
    // /{tenant}/orders/{id} -> /orders/{id}
    if (segments.length >= 3 && segments[1] === 'orders') {
      const globalTarget = `/${segments.slice(1).join('/')}`;
      headers.set('x-pathname', globalTarget);
      headers.set('x-tenant-admin', tenantFromPath);
      const response = NextResponse.rewrite(new URL(globalTarget, request.url), { request: { headers } });
      response.cookies.set('tenant', tenantFromPath, { path: '/', sameSite: 'lax' });
      return response;
    }

    // Senlysh PDP: /senlysh/products/{slug} -> /products/{slug}
    if (tenantFromPath === 'senlysh' && segments.length >= 3 && segments[1] === 'products') {
      const globalTarget = `/${segments.slice(1).join('/')}`;
      headers.set('x-pathname', globalTarget);
      headers.set('x-tenant-admin', tenantFromPath);
      const response = NextResponse.rewrite(new URL(globalTarget, request.url), { request: { headers } });
      response.cookies.set('tenant', tenantFromPath, { path: '/', sameSite: 'lax' });
      return response;
    }
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
};
