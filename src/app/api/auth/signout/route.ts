import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

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
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
  
  await supabase.auth.signOut()
  
  // Check if the signout came from admin panel
  const referer = (await headers()).get('referer') || ''
  const isAdminSignout = referer.includes('/admin')
  
  // Determine redirect URL
  let redirectUrl: string
  if (isAdminSignout) {
    // Admin users go to /login (global admin login)
    redirectUrl = '/login'
  } else {
    // Customer users go to /{tenant}/login (tenant customer login)
    const tenantKey = await getTenantKeyFromRequest()
    redirectUrl = `/${tenantKey || 'senlysh'}/login`
  }
  
  console.log('[Signout] Redirecting to:', redirectUrl, 'isAdmin:', isAdminSignout)
  
  return NextResponse.json({ 
    success: true, 
    redirectUrl 
  }, {
    status: 200
  })
}


