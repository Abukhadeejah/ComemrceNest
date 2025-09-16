import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'

// Lists reward-related wallet entries (cashback/refund) for the authenticated customer
export async function GET(_request: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: Record<string, unknown>) { cookieStore.set(name, value, options) },
          remove(name: string, options: Record<string, unknown>) { cookieStore.set(name, '', { ...options, maxAge: 0 }) },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    const { data: account } = await supabaseAdmin
      .from('wallet_accounts')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('customer_id', customer.id)
      .maybeSingle()
    if (!account) return NextResponse.json({ rewards: [] })

    const { data: ledger } = await supabaseAdmin
      .from('wallet_ledger')
      .select('id, entry_type, amount_cents, currency, source_key, reference_id, metadata, created_at')
      .eq('tenant_id', tenantId)
      .eq('account_id', account.id)
      .order('created_at', { ascending: false })

    const rewards = (ledger || []).filter(e => {
      const s = String(e.source_key || '')
      return s.includes('cashback') || s.includes('refund')
    })

    return NextResponse.json({ rewards })
  } catch (error) {
    console.error('Rewards history error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



