import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { creditOrderCashback } from '@/server/rewards'
import { revalidateTag } from 'next/cache'
import { tenantOrdersTag } from '@/server/cacheTags'

export const runtime = 'nodejs'

async function getActiveWebhookSecret(tenantId?: string | null): Promise<string | null> {
  try {
    if (!tenantId) return null
    const { data, error } = await supabaseAdmin
      .from('tenant_payment_settings')
      .select('env, enabled, webhook_secret')
      .eq('tenant_id', tenantId)
    if (error || !data?.length) return null
    const active = data.find(r => r.enabled)
    if (!active?.webhook_secret) return null
    // Stored as hex with \x prefix
    const hex = String(active.webhook_secret).replace(/^\\x/i, '')
    try {
      const buf = Buffer.from(hex, 'hex')
      return buf.toString('utf8') || null
    } catch {
      return null
    }
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  try {
    // Read raw body for signature verification
    const rawBody = await req.text()
    const sig = req.headers.get('x-razorpay-signature') || ''

    // Parse JSON first to get the order ID for tenant resolution
    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
    }

    // Extract order ID from payload to resolve tenant
    let tenantId: string | null = null
    if (payload?.event === 'payment.captured' && (payload as { payload?: { order?: { entity?: { id?: string } } } })?.payload?.order?.entity?.id) {
      const razorpayOrderId = (payload as { payload: { order: { entity: { id: string } } } }).payload.order.entity.id
      
      // Find the order to get tenant_id
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('tenant_id')
        .eq('razorpay_order_id', razorpayOrderId)
        .maybeSingle()
      
      if (order) {
        tenantId = order.tenant_id
      }
    }

    // Get webhook secret for the tenant
    const secret = await getActiveWebhookSecret(tenantId)

    // In development, allow webhook without verification if no secret configured
    const allowUnverified = !secret && process.env.NODE_ENV !== 'production'

    let verified = false
    if (secret) {
      const crypto = await import('crypto')
      const hmac = crypto.createHmac('sha256', secret)
      hmac.update(rawBody)
      const expected = hmac.digest('hex')
      verified = Boolean(sig && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)))
    }

    if (!verified && !allowUnverified) {
      return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 401 })
    }

    // Payload already parsed above for tenant resolution

    // Handle payment.captured event
    if (payload?.event === 'payment.captured' && (payload as { payload?: { order?: { entity?: { id?: string } } } })?.payload?.order?.entity?.id) {
      const razorpayOrderId = (payload as { payload: { order: { entity: { id: string } } } }).payload.order.entity.id
      
      // Find the order in our database
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select(`
          id,
          tenant_id,
          order_number,
          total_cents,
          currency,
          email,
          order_items (
            product_id,
            quantity,
            unit_price_cents,
            subtotal_cents
          )
        `)
        .eq('razorpay_order_id', razorpayOrderId)
        .maybeSingle()

      if (order) {
        // Update order status to paid
        await supabaseAdmin
          .from('orders')
          .update({ status: 'paid' })
          .eq('id', order.id)

        // Invalidate orders cache to ensure admin panel shows updated status
        revalidateTag(tenantOrdersTag(order.tenant_id))
        revalidateTag('orders')

        // Find customer by email
        const { data: customer } = await supabaseAdmin
          .from('customers')
          .select('id')
          .eq('tenant_id', order.tenant_id)
          .eq('email', order.email)
          .maybeSingle()

        if (customer) {
          // Calculate order context for cashback
          const orderItems = order.order_items || []
          const subtotal_cents = orderItems.reduce((sum: number, item: { subtotal_cents: number }) => sum + item.subtotal_cents, 0)
          
          // Get actual product costs from the database
          const productIds = orderItems.map((item: { product_id: string }) => item.product_id)
          const { data: products } = await supabaseAdmin
            .from('products')
            .select('id, cost_per_item_cents')
            .in('id', productIds)
          
          // Calculate total cost based on actual product costs
          let cost_cents = 0
          if (products) {
            cost_cents = orderItems.reduce((sum: number, item: { product_id: string; quantity: number }) => {
              const product = products.find(p => p.id === item.product_id)
              const itemCost = product?.cost_per_item_cents || 0
              return sum + (itemCost * item.quantity)
            }, 0)
          }
          
          const shipping_cents = 0 // No shipping cost in current setup
          const discounts_cents = 0 // No discounts in current setup

          // Credit cashback to customer's wallet
          const cashbackResult = await creditOrderCashback(
            order.tenant_id,
            customer.id,
            order.id,
            {
              subtotal_cents,
              shipping_cents,
              cost_cents,
              discounts_cents,
              currency: order.currency || 'INR'
            }
          )

          console.log('Cashback credit result:', cashbackResult)
        }
      }
    }

    return NextResponse.json({ ok: true, verified })
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
  }
}

