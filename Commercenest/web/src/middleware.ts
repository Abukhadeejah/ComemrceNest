import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const headers = new Headers(request.headers);
  const segments = pathname.replace(/\/+/g, '/').split('/').filter(Boolean);
  const seg = segments[0] || '';
  const tenant = seg === 'bluebell' || seg === 'senlysh' ? seg : '';
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  // Set the pathname header that the layout expects
  headers.set('x-pathname', pathname);
  
  // Host-based detection for local custom domains (bluebell.local, senlysh.local)
  const host = request.headers.get('host') || '';
  let tenantFromHost = '';
  if (/(^|\.)bluebell\.local(?::\d+)?$/i.test(host)) tenantFromHost = 'bluebell';
  else if (/(^|\.)senlysh\.local(?::\d+)?$/i.test(host)) tenantFromHost = 'senlysh';
  
  // Global (non-tenant) routes that must not be rewritten
  const globalNoRewrite = new Set(['/login', '/checkout', '/cart'])
  const isGlobalRoute = globalNoRewrite.has(pathname)

  // Static assets should never be rewritten (images, svgs, etc.)
  const looksLikeAsset = /\.[a-zA-Z0-9]+$/.test(pathname);
  if (looksLikeAsset) {
    return NextResponse.next({ request: { headers } });
  }

  // If host maps to a tenant and the path is not already tenant-prefixed, rewrite to tenant path
  if (tenantFromHost && !tenant && !isGlobalRoute) {
    headers.set('x-tenant-admin', tenantFromHost);
    const response = NextResponse.next({ request: { headers } });
    response.cookies.set('tenant', tenantFromHost, { path: '/', sameSite: 'lax' });
    // Rewrite clean site URLs to tenant-prefixed equivalents
    // Examples:
    //   /            -> /bluebell
    //   /products    -> /bluebell/products
    //   /admin       -> /bluebell/admin
    const targetPath = pathname === '/' ? `/${tenantFromHost}` : `/${tenantFromHost}${pathname}`;
    // Ensure server components see the rewritten pathname in this request
    headers.set('x-pathname', targetPath);
    return NextResponse.rewrite(new URL(targetPath, request.url), { request: { headers } });
  }
  
  if (tenant) {
    headers.set('x-tenant-admin', tenant);
    // Persist tenant choice in a cookie for admin routes without prefix
    const response = NextResponse.next({ request: { headers } });
    response.cookies.set('tenant', tenant, { path: '/', sameSite: 'lax' });
    return response;
  } else if (isAdminRoute) {
    // For admin routes without an explicit tenant prefix, infer tenant from cookie or default to bluebell
    const cookieTenant = request.cookies.get('tenant')?.value;
    const inferredTenant = cookieTenant === 'bluebell' || cookieTenant === 'senlysh' ? cookieTenant : 'bluebell';
    headers.set('x-tenant-admin', inferredTenant);
    const response = NextResponse.next({ request: { headers } });
    // Ensure cookie is set for subsequent requests
    response.cookies.set('tenant', inferredTenant, { path: '/', sameSite: 'lax' });
    return response;
  }

  // If path is tenant-prefixed but points to a global page, rewrite to global
  if (tenant) {
    // /{tenant}/checkout -> /checkout, /{tenant}/cart -> /cart
    if (pathname === `/${tenant}/checkout` || pathname === `/${tenant}/cart`) {
      const globalTarget = `/${segments.slice(1).join('/')}` // e.g. /checkout
      return NextResponse.rewrite(new URL(globalTarget, request.url), { request: { headers } })
    }
    // /{tenant}/orders/{id} -> /orders/{id}
    if (segments.length >= 3 && segments[1] === 'orders') {
      const globalTarget = `/${segments.slice(1).join('/')}` // /orders/{id}[...]
      return NextResponse.rewrite(new URL(globalTarget, request.url), { request: { headers } })
    }
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
};
