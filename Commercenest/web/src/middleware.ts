import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const headers = new Headers(request.headers);

  console.log('[Middleware] Request to:', pathname);

  const segments = pathname.replace(/\/+/g, '/').split('/').filter(Boolean);
  const seg = segments[0] || '';
  const tenantFromPath = seg === 'bluebell' || seg === 'senlysh' ? seg : '';
  console.log('[Middleware] Tenant from path:', tenantFromPath);

  const legalPages = new Set([
    '/terms-and-conditions',
    '/terms-of-service',
    '/privacy-policy',
    '/refund-policy',
    '/shipping-policy',
    '/international-policy',
  ]);

  if (tenantFromPath && legalPages.has(pathname)) {
    console.log('[Middleware] Legal page matched:', pathname, 'with tenant:', tenantFromPath);
    const response = NextResponse.next({ request: { headers } });
    response.cookies.set('tenant', tenantFromPath, { path: '/', sameSite: 'lax' });
    return response;
  }

  const host = request.headers.get('host') || '';
  let tenantFromHost = '';
  if (/(^|\.)bluebell\.local(?::\d+)?$/i.test(host) || /(^|\.)bluebellstudio\.in(?::\d+)?$/i.test(host)) tenantFromHost = 'bluebell';
  else if (/(^|\.)senlysh\.local(?::\d+)?$/i.test(host) || /(^|\.)senlysh\.in(?::\d+)?$/i.test(host)) tenantFromHost = 'senlysh';
  console.log('[Middleware] Tenant from host:', tenantFromHost);

  // Log other routing steps as needed...

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ],
};
