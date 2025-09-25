import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { supabaseAdmin } from '@/server/supabaseAdmin'

// Dev-only helper to simulate a payment.captured event targeting the provided order_id
export async function POST(request: Request) {
  const { order_id } = await request.json().catch(() => ({}))
  if (!order_id) return NextResponse.json({ error: 'missing_order_id' }, { status: 400 })

  const { data: order } = await supabaseAdmin.from('orders').select('tenant_id, razorpay_order_id').eq('razorpay_order_id', order_id).maybeSingle()
  if (!order?.tenant_id) return NextResponse.json({ error: 'order_not_found' }, { status: 404 })

  const { data: pay } = await supabaseAdmin
    .from('tenant_payment_settings')
    .select('webhook_secret, env')
    .eq('tenant_id', order.tenant_id)
    .eq('env', 'test')
    .maybeSingle()
  if (!pay?.webhook_secret) return NextResponse.json({ error: 'secret_not_configured' }, { status: 400 })

  const body = {
    event: 'payment.captured',
    payload: {
      order: { entity: { id: order.razorpay_order_id } },
      payment: { entity: { id: `pay_${Date.now()}` } },
    },
  }
  const bodyText = JSON.stringify(body)
  const secretBuf = typeof pay.webhook_secret === 'string' && pay.webhook_secret.startsWith('\\x')
    ? Buffer.from(pay.webhook_secret.slice(2), 'hex')
    : Buffer.isBuffer(pay.webhook_secret) ? pay.webhook_secret : Buffer.from(String(pay.webhook_secret))
  const hmac = crypto.createHmac('sha256', secretBuf)
  hmac.update(bodyText)
  const signature = hmac.digest('hex')

  // Forward to the real webhook route with correct signature header
  const res = await fetch(new URL('/api/webhooks/razorpay', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'), {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-razorpay-signature': signature },
    body: bodyText,
  })
  const json = await res.json()
  return NextResponse.json(json, { status: res.status })
}


