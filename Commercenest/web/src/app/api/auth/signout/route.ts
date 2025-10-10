import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

async function getTenantKeyFromRequest(): Promise<string | null> {
  const h = await headers()
  const pathname = h.get('x-pathname') || h.get('referer')?.split('://')[1]?.split('/').slice(1).join('/') || '/'
  
  // Extract tenant key from path segments
  const pathSegments = pathname.split('/').filter(Boolean)
  if (pathSegments.length > 0) {
    const potentialTenant = pathSegments[0]
    // Check if it's a known tenant (you could also validate against database)
    if (['senlysh', 'bluebell'].includes(potentialTenant)) {
      return potentialTenant
    }
  }
  
  // Fallback: check referer header for tenant context
  const referer = h.get('referer')
  if (referer) {
    const refererUrl = new URL(referer)
    const refererSegments = refererUrl.pathname.split('/').filter(Boolean)
    if (refererSegments.length > 0) {
      const refererTenant = refererSegments[0]
      if (['senlysh', 'bluebell'].includes(refererTenant)) {
        return refererTenant
      }
    }
  }
  
  return null
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  await supabase.auth.signOut()
  
  // Get tenant context to redirect to correct login page
  const tenantKey = await getTenantKeyFromRequest()
  const redirectUrl = tenantKey 
    ? `/${tenantKey}/login`
    : '/login' // fallback to global login
  
  // Get the origin from the request URL to ensure correct domain
  const requestUrl = new URL(request.url)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${requestUrl.protocol}//${requestUrl.host}`
  
  return NextResponse.redirect(new URL(redirectUrl, baseUrl))
}


