import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'

export async function GET() {
  try {
    // Verify environment variables are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[check-tenant-access] ❌ Missing Supabase environment variables:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey
      })
      return NextResponse.json({ error: 'server configuration error' }, { status: 500 })
    }
    
    // Create Supabase client with proper SSR cookies adapter
    const cookieStore = await cookies()
    
    // Debug: Log all cookies to diagnose production issues
    const allCookies = cookieStore.getAll()
    const authCookies = allCookies.filter(c => c.name.includes('sb-'))
    console.log('[check-tenant-access] Cookie debug:', {
      totalCookies: allCookies.length,
      authCookieCount: authCookies.length,
      authCookieNames: authCookies.map(c => c.name),
      hasAuthToken: authCookies.some(c => /sb-.*-auth-token/.test(c.name))
    })
    
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
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

    // Get authenticated user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Debug logging for production troubleshooting
    console.log('[check-tenant-access] Auth result:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message,
      authErrorStatus: authError?.status
    })

    if (!user) {
      console.log('[check-tenant-access] ❌ No user found in session, returning 401')
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    
    console.log('[check-tenant-access] ✅ User authenticated:', user.id)

    // HOLY_GRAIL:TENANT_ACCESS_API_START
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      console.log('[check-tenant-access] No tenant context found')
      return NextResponse.json({ error: 'no tenant context' }, { status: 400 })
    }

    // Check if user has access to this tenant
    const { data: member, error } = await supabaseAdmin
      .from('tenant_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (error) {
      console.error('[check-tenant-access] Database error:', error)
      return NextResponse.json({ error: 'database error' }, { status: 500 })
    }

    if (!member) {
      console.log('[check-tenant-access] User not a member of tenant:', { userId: user.id, tenantId })
      return NextResponse.json({ error: 'unauthorized for this tenant' }, { status: 403 })
    }
    // HOLY_GRAIL:TENANT_ACCESS_API_END

    console.log('[check-tenant-access] Success:', { userId: user.id, tenantId, role: member.role })
    return NextResponse.json({ 
      userId: user.id, 
      tenantId, 
      role: member.role,
      authorized: true 
    })
  } catch (error) {
    console.error('[check-tenant-access] Unexpected error:', error)
    return NextResponse.json({ error: 'internal server error' }, { status: 500 })
  }
}

































