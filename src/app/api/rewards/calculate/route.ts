import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { calculateCashback, OrderContext } from '@/server/rewards'

// Calculates cashback for an order context without mutating state.
// Body: { subtotal_cents, shipping_cents, cost_cents, discounts_cents, currency? }
export async function POST(request: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            cookieStore.set(name, value, options)
          },
          remove(name: string, options: Record<string, unknown>) {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    // Ensure this user is a customer in this tenant
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    const body = await request.json().catch(() => ({}))
    const orderContext: OrderContext = {
      subtotal_cents: Number(body.subtotal_cents ?? 0),
      shipping_cents: Number(body.shipping_cents ?? 0),
      cost_cents: Number(body.cost_cents ?? 0),
      discounts_cents: Number(body.discounts_cents ?? 0),
      currency: String(body.currency || 'INR')
    }

    // Calculate cashback using shared module
    const cashbackResult = await calculateCashback(tenantId, orderContext)

    return NextResponse.json({
      tenant_id: tenantId,
      customer_id: customer.id,
      currency: orderContext.currency,
      inputs: {
        subtotal_cents: orderContext.subtotal_cents,
        shipping_cents: orderContext.shipping_cents,
        cost_cents: orderContext.cost_cents,
        discounts_cents: orderContext.discounts_cents,
      },
      profit_cents: cashbackResult.profit_cents,
      rule: cashbackResult.rule,
      cashback_cents: cashbackResult.cashback_cents,
      reason: cashbackResult.reason,
      metadata: cashbackResult.metadata,
    })
  } catch (error) {
    console.error('Rewards calculate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


