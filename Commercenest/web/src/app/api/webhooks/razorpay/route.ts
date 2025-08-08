import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { supabaseAdmin } from '@/server/supabaseAdmin'

function decodeSecret(val: any): string {
  if (!val) return ''
  if (typeof val === 'string') {
    if (val.startsWith('\\x')) return Buffer.from(val.slice(2), 'hex').toString('utf8')
    return val
  }
  try { return Buffer.from(val).toString('utf8') } catch { return String(val) }
}

function verifySignature(body: string, signature: string, secret: string) {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(body)
  const digest = hmac.digest('hex')
  return digest === signature
}

export async function POST(request: Request) {
  // Read exact raw bytes to preserve HMAC match
  const buf = Buffer.from(await request.arrayBuffer())
  if (buf.length === 0) {
    return NextResponse.json({ error: 'empty_body' }, { status: 400 })
  }
  const bodyText = buf.toString('utf8')
  const signature = request.headers.get('x-razorpay-signature') || ''

  // Parse event JSON
  let evt: any
  try {
    const maybeBOM = bodyText.charCodeAt(0) === 0xFEFF ? bodyText.slice(1) : bodyText
    evt = JSON.parse(maybeBOM)
  } catch {
    // Minimal debug for local testing (no sensitive data)
    console.error('webhook invalid_json len=', buf.length)
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const provider = 'razorpay'
  const eventId = evt?.payload?.payment?.entity?.id || evt?.payload?.order?.entity?.id || evt?.id

  // Lookup order, determine tenant and webhook secret
  const orderId = evt?.payload?.order?.entity?.id
  if (!orderId) return NextResponse.json({ error: 'missing_order' }, { status: 400 })
  const { data: order } = await supabaseAdmin.from('orders').select('tenant_id, razorpay_order_id').eq('razorpay_order_id', orderId).maybeSingle()
  if (!order?.tenant_id) return NextResponse.json({ error: 'order_not_found' }, { status: 404 })

  const { data: pay } = await supabaseAdmin
    .from('tenant_payment_settings')
    .select('webhook_secret')
    .eq('tenant_id', order.tenant_id)
    .eq('env', 'test')
    .maybeSingle()
  if (!pay?.webhook_secret) return NextResponse.json({ error: 'secret_not_configured' }, { status: 400 })

  // Verify signature
  const secret = decodeSecret(pay.webhook_secret)
  const ok = verifySignature(bodyText, signature, secret)
  if (!ok) return NextResponse.json({ error: 'invalid_signature' }, { status: 400 })

  // Idempotency: insert event record (unique on provider,event_id)
  if (eventId) {
    const ins = await supabaseAdmin.from('payment_webhook_events').insert({ tenant_id: order.tenant_id, provider, event_id: eventId, raw: evt })
    if (ins.error && ins.error.code !== '23505') {
      return NextResponse.json({ error: 'idempotency_insert_failed' }, { status: 500 })
    }
  }

  // Update order status (example for payment.captured)
  const status = evt?.event === 'payment.captured' ? 'paid' : undefined
  if (status) {
    await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('razorpay_order_id', orderId)
      .eq('tenant_id', order.tenant_id)
  }

  return NextResponse.json({ ok: true })
}


