import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import crypto from 'crypto'

/**
 * Razorpay Webhook Handler
 * 
 * This webhook is specifically for Bluebell tenant which uses Razorpay.
 * Senlysh tenant uses PhonePe and has its own webhook handler.
 * 
 * Handles:
 * - payment.captured events (successful payments)
 * - payment.failed events (failed payments)
 * - Coupon usage completion after successful payment
 */

// Helper function to process coupon usage after successful payment
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
      const orderId = payment.order_id
      const paymentId = payment.id
      const amount = payment.amount
      const status = payment.status

      console.log('Payment captured:', {
        orderId,
        paymentId,
        amount,
        status
      })

      // Update order status
      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'paid',
          razorpay_payment_id: paymentId,
          updated_at: new Date().toISOString()
        })
        .eq('razorpay_order_id', orderId)

      if (updateError) {
        console.error('Failed to update order:', updateError)
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
      }

      // Get the internal order ID for coupon processing
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('razorpay_order_id', orderId)
        .single()

      if (order) {
        await processCouponUsage(order.id)
      }

      console.log(`Order ${orderId} marked as paid`)
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
          updated_at: new Date().toISOString()
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