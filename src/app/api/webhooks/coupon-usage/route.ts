import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { recordCouponUsage } from '@/lib/coupons/usageService'

/**
 * Webhook handler to complete coupon usage after payment confirmation
 * This should be called by payment webhooks (Razorpay, PhonePe) after successful payment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { order_id, tenant_id, payment_status } = body

    if (!order_id || !tenant_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Only process successful payments
    if (payment_status !== 'success' && payment_status !== 'completed') {
      console.log(`Coupon usage webhook: Ignoring non-successful payment status: ${payment_status}`)
      return NextResponse.json({ message: 'Payment not successful, coupon usage not recorded' })
    }

    // Find pending coupon usage for this order
    const { data: pendingUsage, error: fetchError } = await supabaseAdmin
      .from('pending_coupon_usage')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('order_id', order_id)
      .eq('processed', false)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching pending coupon usage:', fetchError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!pendingUsage) {
      console.log(`No pending coupon usage found for order: ${order_id}`)
      return NextResponse.json({ message: 'No pending coupon usage found' })
    }

    // Get order total from orders table
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('total_cents')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      console.error('Error fetching order:', orderError)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Record the coupon usage
    await recordCouponUsage({
      coupon_id: pendingUsage.coupon_id,
      order_id: pendingUsage.order_id,
      customer_id: pendingUsage.customer_id,
      discount_amount_cents: pendingUsage.discount_amount_cents,
      order_total_cents: order.total_cents,
      tenant_id: pendingUsage.tenant_id
    })

    // Update the order with coupon information
    const { error: orderUpdateError } = await supabaseAdmin
      .from('orders')
      .update({
        coupon_id: pendingUsage.coupon_id,
        coupon_code: pendingUsage.coupon_code,
        discount_amount_cents: pendingUsage.discount_amount_cents
      })
      .eq('id', order_id)

    if (orderUpdateError) {
      console.error('Error updating order with coupon info:', orderUpdateError)
      // Don't fail the webhook, just log the error
    }

    // Mark pending usage as processed
    const { error: updateError } = await supabaseAdmin
      .from('pending_coupon_usage')
      .update({
        processed: true,
        processed_at: new Date().toISOString()
      })
      .eq('id', pendingUsage.id)

    if (updateError) {
      console.error('Error marking pending usage as processed:', updateError)
      // Don't fail the webhook, just log the error
    }

    console.log(`Coupon usage completed for order ${order_id}, coupon ${pendingUsage.coupon_code}`)

    return NextResponse.json({
      success: true,
      message: 'Coupon usage recorded successfully',
      coupon_code: pendingUsage.coupon_code,
      discount_amount_cents: pendingUsage.discount_amount_cents
    })

  } catch (error) {
    console.error('Error in coupon usage webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Cleanup endpoint to process any unprocessed pending coupon usage
 * Can be called periodically or manually to handle missed webhooks
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!tenantId) {
      return NextResponse.json({ error: 'tenant_id required' }, { status: 400 })
    }

    // Find old unprocessed pending usage (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { data: pendingUsages, error: fetchError } = await supabaseAdmin
      .from('pending_coupon_usage')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('processed', false)
      .lt('created_at', oneHourAgo)
      .limit(limit)

    if (fetchError) {
      console.error('Error fetching old pending coupon usage:', fetchError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const processed = []
    const errors = []

    for (const pending of pendingUsages || []) {
      try {
        // Check if order was actually paid
        const { data: order } = await supabaseAdmin
          .from('orders')
          .select('status, total_cents')
          .eq('id', pending.order_id)
          .single()

        if (order && (order.status === 'completed' || order.status === 'paid')) {
          // Record the coupon usage
          await recordCouponUsage({
            coupon_id: pending.coupon_id,
            order_id: pending.order_id,
            customer_id: pending.customer_id,
            discount_amount_cents: pending.discount_amount_cents,
            order_total_cents: order.total_cents,
            tenant_id: pending.tenant_id
          })

          // Mark as processed
          await supabaseAdmin
            .from('pending_coupon_usage')
            .update({
              processed: true,
              processed_at: new Date().toISOString()
            })
            .eq('id', pending.id)

          processed.push({
            order_id: pending.order_id,
            coupon_code: pending.coupon_code
          })
        }
      } catch (error) {
        console.error(`Error processing pending usage ${pending.id}:`, error)
        errors.push({
          order_id: pending.order_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed_count: processed.length,
      error_count: errors.length,
      processed,
      errors
    })

  } catch (error) {
    console.error('Error in coupon cleanup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}