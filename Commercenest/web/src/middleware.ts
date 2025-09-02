import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const headers = new Headers(request.headers);
  const segments = pathname.replace(/\/+/g, '/').split('/').filter(Boolean);
  const seg = segments[0] || '';
  const tenantFromPath = seg === 'bluebell' || seg === 'senlysh' ? seg : '';
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const isTenantAdminRoute = tenantFromPath && (segments[1] === 'admin' || pathname === `/${tenantFromPath}/admin`);

  // Basic header for downstream usage
  headers.set('x-pathname', pathname);
  
  // Host-based detection (local and production custom domains)
  const host = request.headers.get('host') || '';
  let tenantFromHost = '';
  if (/(^|\.)bluebell\.local(?::\d+)?$/i.test(host) || /(^|\.)bluebellstudio\.in(?::\d+)?$/i.test(host)) tenantFromHost = 'bluebell';
  else if (/(^|\.)senlysh\.local(?::\d+)?$/i.test(host) || /(^|\.)senlysh\.in(?::\d+)?$/i.test(host)) tenantFromHost = 'senlysh';
  
  // Global (non-tenant) routes that must not be rewritten
  const globalNoRewrite = new Set(['/login', '/checkout', '/cart'])
  const isGlobalRoute = globalNoRewrite.has(pathname)

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
    // Ensure server components see the rewritten pathname in this request
    headers.set('x-pathname', targetPath);
    const response = NextResponse.rewrite(new URL(targetPath, request.url), { request: { headers } });
    response.cookies.set('tenant', tenantFromHost, { path: '/', sameSite: 'lax' });
    response.cookies.set('tenant_mode', 'host', { path: '/', sameSite: 'lax' });
    return response;
  }
  
  // Path-based tenancy (staging/local) with cookie fallback
  if (tenantFromPath) {
    headers.set('x-tenant-admin', tenantFromPath);

    // Rewrite tenant-prefixed admin routes to global admin routes while preserving tenant context
    if (pathname.startsWith(`/${tenantFromPath}/admin`)) {
      const globalTarget = `/${segments.slice(1).join('/')}` // strip the tenant segment
      headers.set('x-pathname', globalTarget)
      const response = NextResponse.rewrite(new URL(globalTarget, request.url), { request: { headers } })
      response.cookies.set('tenant', tenantFromPath, { path: '/', sameSite: 'lax' })
      return response
    }

    const response = NextResponse.next({ request: { headers } });
    response.cookies.set('tenant', tenantFromPath, { path: '/', sameSite: 'lax' });
    return response;
  }

  // Check Supabase auth cookie presence once
  const cookieHeader = request.headers.get('cookie') || '';
  const hasAuthCookie = /sb-.*-auth-token/.test(cookieHeader);

  if (isAdminRoute) {
    // On host-based tenancy, normalize /admin to /{tenant}/admin to avoid 404
    const cookieTenant = request.cookies.get('tenant')?.value;
    const inferredTenant = cookieTenant === 'bluebell' || cookieTenant === 'senlysh' ? cookieTenant : tenantFromHost || 'bluebell';
    headers.set('x-tenant-admin', inferredTenant);
    if (!hasAuthCookie) {
      const redirectResp = NextResponse.redirect(new URL('/login', request.url));
      redirectResp.cookies.set('tenant', inferredTenant, { path: '/', sameSite: 'lax' });
      return redirectResp;
    }
    const target = pathname === '/admin' ? `/${inferredTenant}/admin` : pathname
    const response = pathname === '/admin'
      ? NextResponse.rewrite(new URL(target, request.url), { request: { headers } })
      : NextResponse.next({ request: { headers } });
    response.cookies.set('tenant', inferredTenant, { path: '/', sameSite: 'lax' });
    return response;
  }

  // Guard tenant-prefixed admin routes as well
  if (isTenantAdminRoute) {
    headers.set('x-tenant-admin', tenantFromPath);
    if (!hasAuthCookie) {
      const redirectResp = NextResponse.redirect(new URL('/login', request.url));
      redirectResp.cookies.set('tenant', tenantFromPath, { path: '/', sameSite: 'lax' });
      return redirectResp;
    }
    return NextResponse.next({ request: { headers } });
  }

  // If path is tenant-prefixed but points to a global page, rewrite to global
  if (tenantFromPath) {
    // /{tenant}/checkout -> /checkout, /{tenant}/cart -> /cart
    if (pathname === `/${tenantFromPath}/checkout` || pathname === `/${tenantFromPath}/cart`) {
      const globalTarget = `/${segments.slice(1).join('/')}` // e.g. /checkout
      headers.set('x-pathname', globalTarget)
      headers.set('x-tenant-admin', tenantFromPath)
      const response = NextResponse.rewrite(new URL(globalTarget, request.url), { request: { headers } })
      response.cookies.set('tenant', tenantFromPath, { path: '/', sameSite: 'lax' })
      return response
    }
    // /{tenant}/orders/{id} -> /orders/{id}
    if (segments.length >= 3 && segments[1] === 'orders') {
      const globalTarget = `/${segments.slice(1).join('/')}` // /orders/{id}[...]
      headers.set('x-pathname', globalTarget)
      headers.set('x-tenant-admin', tenantFromPath)
      const response = NextResponse.rewrite(new URL(globalTarget, request.url), { request: { headers } })
      response.cookies.set('tenant', tenantFromPath, { path: '/', sameSite: 'lax' })
      return response
    }

    // Senlysh PDP: /senlysh/products/{slug} -> /products/{slug}
    if (tenantFromPath === 'senlysh' && segments.length >= 3 && segments[1] === 'products') {
      const globalTarget = `/${segments.slice(1).join('/')}` // /products/{slug}[...]
      headers.set('x-pathname', globalTarget)
      headers.set('x-tenant-admin', tenantFromPath)
      const response = NextResponse.rewrite(new URL(globalTarget, request.url), { request: { headers } })
      response.cookies.set('tenant', tenantFromPath, { path: '/', sameSite: 'lax' })
      return response
    }
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
};
