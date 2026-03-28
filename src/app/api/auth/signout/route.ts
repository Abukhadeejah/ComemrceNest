import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

type CookieOptions = Record<string, unknown>
const KNOWN_TENANTS = ['senlysh', 'bluebell'] as const

function getPathnameFromHeaderReferrer(referer: string | null): string {
  if (!referer) return '/'
  try {
    return new URL(referer).pathname || '/'
  } catch {
    return '/'
  }
}

async function getTenantKeyFromRequest(): Promise<string | null> {
  const h = await headers()
  const xPathname = h.get('x-pathname')
  const refererPathname = getPathnameFromHeaderReferrer(h.get('referer'))
  const pathname = xPathname || refererPathname || '/'
  
  // Extract tenant key from path segments
  const pathSegments = pathname.split('/').filter(Boolean)
  if (pathSegments.length > 0) {
    const potentialTenant = pathSegments[0]
    if (KNOWN_TENANTS.includes(potentialTenant as (typeof KNOWN_TENANTS)[number])) {
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
      if (KNOWN_TENANTS.includes(refererTenant as (typeof KNOWN_TENANTS)[number])) {
        return refererTenant
      }
    }
  }
  
  return null
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const requestHeaders = await headers()
  const refererPath = getPathnameFromHeaderReferrer(requestHeaders.get('referer'))

  let context = requestUrl.searchParams.get('context') || requestHeaders.get('x-signout-context') || ''
  let redirectTo = requestUrl.searchParams.get('redirectTo') || ''

  const contentType = request.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    try {
      const body = await request.json()
      if (!context && typeof body?.context === 'string') context = body.context
      if (!redirectTo && typeof body?.redirectTo === 'string') redirectTo = body.redirectTo
    } catch {
      // No JSON body provided
    }
  } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    try {
      const formData = await request.formData()
      const formContext = formData.get('context')
      const formRedirectTo = formData.get('redirectTo')
      if (!context && typeof formContext === 'string') context = formContext
      if (!redirectTo && typeof formRedirectTo === 'string') redirectTo = formRedirectTo
    } catch {
      // No form body provided
    }
  }

  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
  
  await supabase.auth.signOut()

  const isAdminSignout = context === 'admin' || refererPath.includes('/admin')

  let redirectUrl: string
  if (redirectTo && redirectTo.startsWith('/')) {
    redirectUrl = redirectTo
  } else if (isAdminSignout) {
    redirectUrl = '/login'
  } else {
    const tenantKey = await getTenantKeyFromRequest()
    redirectUrl = tenantKey ? `/${tenantKey}/login` : '/login'
  }

  const acceptHeader = request.headers.get('accept') || ''
  const requestedWith = request.headers.get('x-requested-with') || ''
  const prefersJson = acceptHeader.includes('application/json') || requestedWith.toLowerCase() === 'xmlhttprequest'

  if (prefersJson) {
    return NextResponse.json(
      {
        success: true,
        redirectUrl,
      },
      {
        status: 200,
      }
    )
  }

  return NextResponse.redirect(new URL(redirectUrl, request.url), { status: 303 })
}


