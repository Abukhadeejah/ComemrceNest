import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const headers = new Headers(request.headers);
  const segments = pathname.replace(/\/+/g, '/').split('/').filter(Boolean);
  const seg = segments[0] || '';
  const tenant = seg === 'bluebell' || seg === 'senlysh' ? seg : '';

  // Set the pathname header that the layout expects
  headers.set('x-pathname', pathname);
  
  if (tenant) headers.set('x-tenant-admin', tenant);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
};
