import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { resolveTenantIdFromRequest } from '@/server/tenant'

function decodeSecret(val: any): string {
  if (!val) return ''
  if (typeof val === 'string') {
    // Supabase/PostgREST returns bytea as hex string prefixed with "\\x"
    if (val.startsWith('\\x')) return Buffer.from(val.slice(2), 'hex').toString('utf8')
    return val
  }
  try {
    return Buffer.from(val).toString('utf8')
  } catch {
    return String(val)
  }
}

export async function POST(request: Request) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return NextResponse.json({ error: 'tenant_not_found' }, { status: 400 })

  // Load tenant payment settings (test env preferred)
  const { data: pay } = await supabaseAdmin
    .from('tenant_payment_settings')
    .select('env, enabled, razorpay_key_id, razorpay_key_secret, test_mode')
    .eq('tenant_id', tenantId)
    .eq('env', 'test')
    .maybeSingle()

  if (!pay?.enabled || !pay?.razorpay_key_id || !pay?.razorpay_key_secret) {
    return NextResponse.json({ error: 'payments_not_configured' }, { status: 400 })
  }

  const client = new Razorpay({ key_id: pay.razorpay_key_id, key_secret: decodeSecret(pay.razorpay_key_secret) })
  const body = await request.json().catch(() => ({}))
  const amountPaise = typeof body.amountPaise === 'number' ? body.amountPaise : 100 // minimal default

  // Razorpay requires receipt length <= 40
  const shortTid = tenantId.replace(/-/g, '').slice(0, 8)
  const shortTs = Date.now().toString().slice(-10)
  const receipt = `t${shortTid}-${shortTs}` // e.g., t11111111-1234567890

  const order = await client.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt,
    notes: { tenant_id: tenantId },
  })

  // Persist order shell
  await supabaseAdmin.from('orders').insert({
    tenant_id: tenantId,
    order_number: order.id,
    email: 'guest@example.com',
    total_cents: Math.ceil(amountPaise / 100) * 100,
    currency: 'INR',
    status: 'pending',
    payment_provider: 'razorpay',
    razorpay_order_id: order.id,
  })

  return NextResponse.json({ order })
}


