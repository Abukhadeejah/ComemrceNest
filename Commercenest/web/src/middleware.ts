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

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
};
