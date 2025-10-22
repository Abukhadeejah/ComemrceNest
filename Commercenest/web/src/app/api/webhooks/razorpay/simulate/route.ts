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
  
  // Use tenant webhook secret if available, otherwise fallback to platform secret
  let webhookSecret = pay?.webhook_secret
  if (!webhookSecret) {
    webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  }
  
  if (!webhookSecret) return NextResponse.json({ error: 'secret_not_configured' }, { status: 400 })

  const body = {
    event: 'payment.captured',
    payload: {
      payment: { 
        entity: { 
          id: `pay_${Date.now()}`,
          order_id: order.razorpay_order_id,
          status: 'captured'
        } 
      },
    },
  }
  const bodyText = JSON.stringify(body)
  
  // Handle both tenant webhook secret (hex encoded) and platform webhook secret (plain text)
  let secretBuf: Buffer
  if (typeof webhookSecret === 'string' && webhookSecret.startsWith('\\x')) {
    // Tenant webhook secret (hex encoded)
    secretBuf = Buffer.from(webhookSecret.slice(2), 'hex')
  } else if (Buffer.isBuffer(webhookSecret)) {
    // Already a buffer
    secretBuf = webhookSecret
  } else {
    // Platform webhook secret (plain text) or string
    secretBuf = Buffer.from(String(webhookSecret))
  }
  
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


