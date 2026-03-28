import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { revalidateTag } from 'next/cache'
import { tenantOrdersTag } from '@/server/cacheTags'
import { processCashbackForOrder } from '@/lib/cashback/cashbackService'

export async function PATCH(request: NextRequest) {
  try {
    let tenantId = await resolveTenantIdFromRequest()

    // TEMPORARY FIX: If no tenant resolved, default to Senlysh for admin access
    if (!tenantId) {
      console.log('[Admin Orders Status API] No tenant resolved, defaulting to Senlysh')
      tenantId = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c' // Senlysh tenant ID
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 })
    }

    // Parse request body
    const body = await request.json()
    const { orderId, status } = body

    // Validate status
    const allowedStatuses = ['pending', 'paid', 'fulfilled', 'cancelled', 'failed']
    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Allowed values: ' + allowedStatuses.join(', ') 
      }, { status: 400 })
    }

    // Validate order ID format
    if (!orderId || typeof orderId !== 'string' || orderId.length !== 36) {
      return NextResponse.json({ error: 'Invalid order ID format' }, { status: 400 })
    }

    console.log(`[Admin Orders Status API] Updating order ${orderId} to status ${status} for tenant ${tenantId}`)

    // Get current order status before update
    const { data: currentOrder } = await supabaseAdmin
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .single()

    // Update order status
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .select('id, order_number, status')
      .single()

    if (error) {
      console.error('Order status update error:', error)
      
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 })
      }

      return NextResponse.json({ 
        error: 'Failed to update order status', 
        details: error.message 
      }, { status: 500 })
    }

    // Process wallet deduction and cashback if status changed to 'paid' and wasn't already 'paid'
    if (status === 'paid' && currentOrder?.status !== 'paid') {
      console.log(`[Admin Orders Status API] Processing wallet deduction and cashback for newly paid order ${orderId}`)
      
      try {
        // Get full order details for processing
        const { data: fullOrder } = await supabaseAdmin
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
              unit_price_cents
            )
          `)
          .eq('id', orderId)
          .eq('tenant_id', tenantId)
          .single()

        if (fullOrder && fullOrder.customer_id) {
          // 1. FIRST: Debit wallet if wallet was used in this order
          if (fullOrder.wallet_used_cents && fullOrder.wallet_used_cents > 0) {
            console.log(`[Admin Orders Status API] Debiting wallet: ₹${fullOrder.wallet_used_cents / 100}`)
            
            // Get wallet account
            const { data: walletAccount } = await supabaseAdmin
              .from('wallet_accounts')
              .select('id')
              .eq('customer_id', fullOrder.customer_id)
              .eq('tenant_id', fullOrder.tenant_id)
              .single()

            if (walletAccount) {
              // Debit wallet for order payment
              await supabaseAdmin
                .from('wallet_ledger')
                .insert({
                  account_id: walletAccount.id,
                  tenant_id: fullOrder.tenant_id,
                  entry_type: 'debit', // Use lowercase to match constraint
                  amount_cents: fullOrder.wallet_used_cents,
                  currency: 'INR',
                  source_key: 'ORDER_PAYMENT',
                  reference_id: fullOrder.id,
                  metadata: {
                    description: 'Payment for order',
                    order_id: fullOrder.id,
                    order_number: data.order_number
                  }
                })

              console.log(`[Admin Orders Status API] Wallet debited: ₹${fullOrder.wallet_used_cents / 100}`)
            } else {
              console.error(`[Admin Orders Status API] Wallet account not found for customer ${fullOrder.customer_id}`)
            }
          }

          // 2. THEN: Process cashback
          // Calculate total purchase price from cost prices (use 60% of sale price as default cost)
          let totalPurchasePriceCents = 0
          if (fullOrder.order_items) {
            for (const item of fullOrder.order_items) {
              // Use 60% of sale price as cost price (40% profit margin)
              const costPrice = item.unit_price_cents * 0.6
              totalPurchasePriceCents += costPrice * item.quantity
            }
          }

          // Process cashback
          const cashbackResult = await processCashbackForOrder({
            tenantId: fullOrder.tenant_id,
            orderId: fullOrder.id,
            customerId: fullOrder.customer_id,
            totalSalePriceCents: fullOrder.total_cents,
            totalPurchasePriceCents,
            walletUsedCents: fullOrder.wallet_used_cents || 0,
            cashPaidCents: fullOrder.cash_paid_cents || fullOrder.total_cents
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
            .eq('id', fullOrder.id)

          console.log(`[Admin Orders Status API] Cashback processed: ₹${cashbackResult.cashbackEarned / 100}`)
        }
      } catch (processingError) {
        console.error('[Admin Orders Status API] Wallet/cashback processing failed:', processingError)
        // Don't fail the status update if processing fails
      }
    }

    // Invalidate cache
    revalidateTag(tenantOrdersTag(tenantId), 'default')

    console.log(`[Admin Orders Status API] Order ${data.order_number} status updated to ${status}`)

    return NextResponse.json({
      success: true,
      order: data,
      message: `Order status updated to ${status}`
    })

  } catch (error) {
    console.error('[Admin Orders Status API] Unexpected error:', error)

    return NextResponse.json({
      error: 'Internal server error during order status update',
      details: process.env.NODE_ENV === 'development' ? (error as Error)?.message : undefined
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    error: 'Method not supported. Use PATCH with orderId and status in body.' 
  }, { status: 405 })
}