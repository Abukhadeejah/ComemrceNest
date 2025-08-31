import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { resolveTenantIdFromRequest } from '@/server/tenant'

function decodeSecret(val: unknown): string {
  if (!val) return ''
  if (typeof val === 'string') {
    // Supabase/PostgREST returns bytea as hex string prefixed with "\\x"
    if (val.startsWith('\\x')) return Buffer.from(val.slice(2), 'hex').toString('utf8')
    return val
  }
  if (val instanceof Uint8Array) {
    return Buffer.from(val).toString('utf8')
  }
  if (typeof ArrayBuffer !== 'undefined' && val instanceof ArrayBuffer) {
    return Buffer.from(new Uint8Array(val)).toString('utf8')
  }
  return String(val)
}

export async function POST(request: Request) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return NextResponse.json({ error: 'tenant_not_found' }, { status: 400 })

  // Load tenant payment settings (prefer enabled env row)
  const { data: rows } = await supabaseAdmin
    .from('tenant_payment_settings')
    .select('env, enabled, razorpay_key_id, razorpay_key_secret')
    .eq('tenant_id', tenantId)
  const active = rows?.find(r => r.enabled) || rows?.find(r => r.env === 'test')

  // Determine credentials: prefer enabled tenant settings, else fall back to env vars
  let keyId = active?.enabled ? active.razorpay_key_id : undefined
  let keySecret = active?.enabled ? decodeSecret(active.razorpay_key_secret) : undefined

  if (!keyId || !keySecret) {
    keyId = process.env.RAZORPAY_KEY_ID
    keySecret = process.env.RAZORPAY_KEY_SECRET
  }

  if (!keyId || !keySecret) {
    return NextResponse.json({ error: 'payments_not_configured' }, { status: 400 })
  }

  const client = new Razorpay({ key_id: keyId, key_secret: keySecret })
  const body = (await request.json().catch(() => ({}))) as { amountPaise?: number }
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
    total_cents: amountPaise,
    currency: 'INR',
    status: 'pending',
    payment_provider: 'razorpay',
    razorpay_order_id: order.id,
  })

  return NextResponse.json({ order, keyId })
}


