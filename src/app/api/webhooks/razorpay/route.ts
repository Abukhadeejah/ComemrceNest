import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import crypto from 'crypto'
import { processCashbackForOrder } from '@/lib/cashback/cashbackService'
import type { Order } from '@/types/order'

/**
 * Razorpay Webhook Handler - WITH IDEMPOTENCY PROTECTION
 * 
 * This webhook is specifically for Bluebell tenant which uses Razorpay.
 * Senlysh tenant uses PhonePe and has its own webhook handler.
 * 
 * Handles:
 * - payment.captured events (successful payments)
 * - payment.failed events (failed payments)
 * - Coupon usage completion after successful payment
 * 
 * IDEMPOTENCY PROTECTION:
 * - Checks post_payment_processed flag before processing
 * - Returns 200 OK if already processed (prevents duplicate cashback)
 * - Sets flag to true after successful processing
 * - Critical for preventing money loss from webhook retries
 */

// Helper function to process cashback after successful payment
async function processCashbackForCompletedOrder(orderId: string) {
  try {
    // Get order details with items for cashback calculation
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        tenant_id,
        customer_id,
        total_cents,
        wallet_used_cents,
        cash_paid_cents,
        order_items (
          product_id,
          quantity,
          unit_price_cents,
          products (
            cost_per_item_cents
          )
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error(`Order ${orderId} not found for cashback processing:`, orderError)
      return
    }

    // Calculate total purchase price from cost prices
    let totalPurchasePriceCents = 0
    if (order.order_items) {
      for (const item of order.order_items) {
        const costPrice = (item.products as any)?.cost_per_item_cents || 0
        totalPurchasePriceCents += costPrice * item.quantity
      }
    }

    // Process cashback
    const cashbackResult = await processCashbackForOrder({
      tenantId: order.tenant_id,
      orderId: order.id,
      customerId: order.customer_id,
      totalSalePriceCents: order.total_cents,
      totalPurchasePriceCents,
      walletUsedCents: order.wallet_used_cents || 0,
      cashPaidCents: order.cash_paid_cents || order.total_cents
    })

    // Update order with cashback details
    await supabaseAdmin
      .from('orders')
      .update({
        total_purchase_price_cents: totalPurchasePriceCents,
        total_profit_pct: cashbackResult.profitPct,
        cashback_pct: cashbackResult.cashbackPct,
        cashback_amount_cents: cashbackResult.cashbackEarned,
        membership_id: cashbackResult.membershipUsed
      })
      .eq('id', orderId)

    console.log(`Cashback processed for order ${orderId}:`, {
      cashbackEarned: cashbackResult.cashbackEarned,
      cashbackPct: cashbackResult.cashbackPct,
      profitPct: cashbackResult.profitPct,
      membershipUsed: !!cashbackResult.membershipUsed
    })

  } catch (error) {
    console.error('Error processing cashback for order:', error)
  }
}
async function processCouponUsage(orderId: string) {
  try {
    // Find pending coupon usage for this order
    const { data: pending, error: fetchError } = await supabaseAdmin
      .from('pending_coupon_usage')
      .select('*')
      .eq('order_id', orderId)
      .eq('processed', false)
      .single()

    if (fetchError || !pending) {
      console.log(`No pending coupon usage found for order ${orderId}`)
      return
    }

    // Get order total for coupon usage record
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('total_cents')
      .eq('id', orderId)
      .single()

    if (!order) {
      console.error(`Order ${orderId} not found for coupon usage`)
      return
    }

    // Record the coupon usage
    const { error: insertError } = await supabaseAdmin
      .from('coupon_usage')
      .insert({
        tenant_id: pending.tenant_id,
        coupon_id: pending.coupon_id,
        customer_id: pending.customer_id,
        order_id: orderId,
        discount_amount_cents: pending.discount_amount_cents,
        order_total_cents: order.total_cents,
        used_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Failed to record coupon usage:', insertError)
      return
    }

    // Update order with coupon information
    await supabaseAdmin
      .from('orders')
      .update({
        coupon_id: pending.coupon_id,
        coupon_code: pending.coupon_code,
        discount_amount_cents: pending.discount_amount_cents
      })
      .eq('id', orderId)

    // Mark as processed
    await supabaseAdmin
      .from('pending_coupon_usage')
      .update({ 
        processed: true, 
        processed_at: new Date().toISOString() 
      })
      .eq('id', pending.id)

    console.log(`Coupon ${pending.coupon_code} usage recorded for order ${orderId}`)
  } catch (error) {
    console.error('Error processing coupon usage:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Get webhook secret from environment
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    console.log('Razorpay Webhook received:', {
      event: event.event,
      entity: event.payload?.payment?.entity?.id || event.payload?.order?.entity?.id
    })

    // Handle payment.captured event
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity
      const razorpayOrderId = payment.order_id
      const paymentId = payment.id
      const amount = payment.amount
      const status = payment.status

      console.log('[Razorpay Webhook] Payment captured:', {
        razorpayOrderId,
        paymentId,
        amount,
        status
      })

      // 🔥 CRITICAL: IDEMPOTENCY CHECK - Fetch order first
      const { data: order, error: fetchError } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('razorpay_order_id', razorpayOrderId)
        .single()

      if (fetchError || !order) {
        console.error('[Razorpay Webhook] Order not found:', razorpayOrderId, fetchError)
        return NextResponse.json({ error: 'order_not_found' }, { status: 404 })
      }

      // 🔥 CRITICAL: Check if already processed (idempotency protection)
      if (order.post_payment_processed) {
        console.log('[Razorpay Webhook] ⚠️ Already processed, skipping:', razorpayOrderId)
        return NextResponse.json({ 
          success: true, 
          message: 'Already processed' 
        }, { status: 200 })
      }

      // Update order status
      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'paid',
          razorpay_payment_id: paymentId,
        })
        .eq('razorpay_order_id', razorpayOrderId)

      if (updateError) {
        console.error('[Razorpay Webhook] ❌ Failed to update order:', updateError)
        return NextResponse.json({ error: 'database_update_failed' }, { status: 500 })
      }

      console.log(`[Razorpay Webhook] Order ${razorpayOrderId} marked as paid`)

      // Process post-payment actions
      try {
        await processCouponUsage(order.id)
        await processCashbackForCompletedOrder(order.id)
        
        // 🔥 CRITICAL: Mark as processed (idempotency flag)
        const { error: flagError } = await supabaseAdmin
          .from('orders')
          .update({ post_payment_processed: true })
          .eq('id', order.id)
        
        if (flagError) {
          console.error('[Razorpay Webhook] ❌ Failed to set post_payment_processed flag:', flagError)
        } else {
          console.log('[Razorpay Webhook] ✅ Processed successfully:', razorpayOrderId)
        }
      } catch (processingError) {
        console.error('[Razorpay Webhook] ❌ Post-payment processing failed:', processingError)
        // Don't fail the webhook - order status is already updated
      }
    }

    // Handle payment.failed event
    else if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity
      const orderId = payment.order_id
      const paymentId = payment.id

      console.log('Payment failed:', {
        orderId,
        paymentId
      })

      // Update order status
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'failed',
          razorpay_payment_id: paymentId,
        })
        .eq('razorpay_order_id', orderId)

      console.log(`Order ${orderId} marked as failed`)
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Razorpay webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}