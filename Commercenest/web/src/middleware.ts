import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const headers = new Headers(request.headers);
  const segments = pathname.replace(/\/+/g, '/').split('/').filter(Boolean);
  const seg = segments[0] || '';
  const tenantFromPath = seg === 'bluebell' || seg === 'senlysh' ? seg : '';
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

  // Basic header for downstream usage
  headers.set('x-pathname', pathname);

  // Host-based detection for production custom domains (lightweight: no DB calls)
  const host = request.headers.get('host') || '';
  let tenantFromHost = '';
  if (/bluebell/i.test(host)) tenantFromHost = 'bluebell';
  else if (/senlysh/i.test(host)) tenantFromHost = 'senlysh';

  // If we have a host-identified tenant, prefer it and mark mode as 'host'
  if (tenantFromHost) {
    headers.set('x-tenant-admin', tenantFromHost);
    const response = NextResponse.next({ request: { headers } });
    response.cookies.set('tenant', tenantFromHost, { path: '/', sameSite: 'lax' });
    response.cookies.set('tenant_mode', 'host', { path: '/', sameSite: 'lax' });
    return response;
  }

  // Path-based tenancy (staging/local) with cookie fallback
  if (tenantFromPath) {
    headers.set('x-tenant-admin', tenantFromPath);
    const response = NextResponse.next({ request: { headers } });
    response.cookies.set('tenant', tenantFromPath, { path: '/', sameSite: 'lax' });
    response.cookies.set('tenant_mode', 'path', { path: '/', sameSite: 'lax' });
    return response;
  }

  if (isAdminRoute) {
    const cookieTenant = request.cookies.get('tenant')?.value;
    const inferredTenant = cookieTenant === 'bluebell' || cookieTenant === 'senlysh' ? cookieTenant : 'bluebell';
    headers.set('x-tenant-admin', inferredTenant);
    const response = NextResponse.next({ request: { headers } });
    response.cookies.set('tenant', inferredTenant, { path: '/', sameSite: 'lax' });
    response.cookies.set('tenant_mode', 'path', { path: '/', sameSite: 'lax' });
    return response;
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
};
