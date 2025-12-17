import { NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/server/auth'
import { supabaseAdmin } from '@/server/supabaseAdmin'

// Resolve an authenticated admin user's tenant key for redirecting to /{tenant}/admin
export async function GET() {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

    // STEP 1: find any admin membership for this user
    const { data: membership, error: mErr } = await supabaseAdmin
      .from('tenant_members')
      .select('tenant_id, role')
      .eq('user_id', userId)
      .eq('role', 'tenant_admin')
      .limit(1)
      .maybeSingle()

    if (mErr) {
      console.error('admin-tenant membership error:', mErr)
      return NextResponse.json({ error: 'database error' }, { status: 500 })
    }

    if (!membership?.tenant_id) {
      return NextResponse.json({ error: 'not_admin' }, { status: 403 })
    }

    // STEP 2: map tenant_id -> tenant name
    const { data: tenantRow, error: tErr } = await supabaseAdmin
      .from('tenants')
      .select('name')
      .eq('id', membership.tenant_id)
      .maybeSingle()

    if (tErr) {
      console.error('admin-tenant tenants error:', tErr)
      return NextResponse.json({ error: 'database error' }, { status: 500 })
    }

    const tenantName = tenantRow?.name
    const map: Record<string, string> = {
      'Bluebell Interiors': 'bluebell',
      'Senlysh Fashion': 'senlysh',
    }
    const tenantKey = tenantName ? map[tenantName] : undefined
    if (!tenantKey) {
      return NextResponse.json({ error: 'unknown_tenant' }, { status: 400 })
    }

    return NextResponse.json({ tenantKey })
  } catch (err) {
    console.error('admin-tenant endpoint error:', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}


