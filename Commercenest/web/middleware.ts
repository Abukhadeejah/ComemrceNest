import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const response = NextResponse.next()
  // Refresh Supabase session cookies for SSR routes
  const supabase = createMiddlewareClient({ req: request, res: response })
  await supabase.auth.getSession()
  // Non-authoritative hint for server handlers
  response.headers.set('x-tenant-host', host)
  return response
}


