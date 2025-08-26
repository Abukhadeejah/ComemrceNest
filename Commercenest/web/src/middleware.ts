import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  const headers = new Headers(request.headers);
  const segments = pathname.replace(/\/+/g, '/').split('/').filter(Boolean);
  const seg = segments[0] || '';
  const tenant = seg === 'bluebell' || seg === 'senlysh' ? seg : '';

  if (tenant) headers.set('x-tenant-admin', tenant);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
};
