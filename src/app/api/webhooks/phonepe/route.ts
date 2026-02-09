import { NextRequest, NextResponse } from 'next/server';
import { verifyPhonePeWebhook } from '@/lib/payments/phonepe';
import { supabaseAdmin } from '@/server/supabaseAdmin';
import { processCashbackForOrder } from '@/lib/cashback/cashbackService';
import type { Order } from '@/types/order';

/**
 * PhonePe Webhook Handler - WITH IDEMPOTENCY PROTECTION
 * 
 * This webhook is specifically for Senlysh tenant which uses PhonePe.
 * Bluebell tenant uses Razorpay and has its own webhook handler.
 * 
 * Handles:
 * - COMPLETED payment states (successful payments)
 * - FAILED payment states (failed payments)
 * - Coupon usage completion after successful payment
 * 
 * IDEMPOTENCY PROTECTION:
 * - Checks post_payment_processed flag before processing
 * - Returns 200 OK if already processed (prevents duplicate cashback)
 * - Sets flag to true after successful processing
 * - Critical for preventing money loss from webhook retries
 */

// Helper function to process wallet deduction and cashback after successful payment
async function processWalletAndCashbackForCompletedOrder(orderId: string) {
  try {
    // Get order details with items for processing
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
      .eq('order_number', orderId)
      .single()

    if (orderError || !order) {
      console.error(`Order ${orderId} not found for processing:`, orderError)
      return
    }

    // 1. FIRST: Debit wallet if wallet was used in this order
    if (order.customer_id && order.wallet_used_cents && order.wallet_used_cents > 0) {
      console.log(`Debiting wallet for order ${orderId}: ₹${order.wallet_used_cents / 100}`)
      
      // Get wallet account
      const { data: walletAccount } = await supabaseAdmin
        .from('wallet_accounts')
        .select('id')
        .eq('customer_id', order.customer_id)
        .eq('tenant_id', order.tenant_id)
        .single()

      if (walletAccount) {
        // Debit wallet for order payment
        await supabaseAdmin
          .from('wallet_ledger')
          .insert({
            account_id: walletAccount.id,
            tenant_id: order.tenant_id,
            entry_type: 'debit', // Use lowercase to match constraint
            amount_cents: order.wallet_used_cents,
            currency: 'INR',
            source_key: 'ORDER_PAYMENT',
            reference_id: order.id,
            metadata: {
              description: 'Payment for order',
              order_id: order.id,
              order_number: orderId
            }
          })

        console.log(`Wallet debited for order ${orderId}: ₹${order.wallet_used_cents / 100}`)
      } else {
        console.error(`Wallet account not found for customer ${order.customer_id}`)
      }
    }

    // 2. THEN: Process cashback
    // Calculate total purchase price from cost prices
    let totalPurchasePriceCents = 0
    if (order.order_items) {
      for (const item of order.order_items) {
        const costPrice = item.products?.cost_per_item_cents || 0
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
      .eq('id', order.id)

    console.log(`Wallet and cashback processed for order ${orderId}:`, {
      walletDebited: order.wallet_used_cents || 0,
      cashbackEarned: cashbackResult.cashbackEarned,
      cashbackPct: cashbackResult.cashbackPct,
      profitPct: cashbackResult.profitPct,
      membershipUsed: !!cashbackResult.membershipUsed
    })

  } catch (error) {
    console.error('Error processing wallet and cashback for order:', error)
  }
}

// Helper function to process coupon usage after successful payment
async function processCouponUsage(orderId: string) {
  try {
    // Find pending coupon usage for this order
    const { data: pending, error: fetchError } = await supabaseAdmin
      .from('pending_coupon_usage')
      .select('*')
      .eq('order_id', orderId)
      .eq('processed', false)
      .single();

    if (fetchError || !pending) {
      console.log(`No pending coupon usage found for order ${orderId}`);
      return;
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
        used_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Failed to record coupon usage:', insertError);
      return;
    }

    // Mark as processed
    await supabaseAdmin
      .from('pending_coupon_usage')
      .update({ 
        processed: true, 
        processed_at: new Date().toISOString() 
      })
      .eq('id', pending.id);

    console.log(`Coupon ${pending.coupon_code} usage recorded for order ${orderId}`);
  } catch (error) {
    console.error('Error processing coupon usage:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('[PhonePe Webhook] Received:', {
      hasXVerify: !!body['X-VERIFY'],
      hasResponse: !!body.response,
    });

    // Verify webhook signature (uses legacy config internally for checksum verification)
    const webhookData = await verifyPhonePeWebhook(body);
    
    // Extract data from webhook payload
    const merchantTransactionId = webhookData.data?.merchantTransactionId || webhookData.merchantTransactionId;
    const transactionId = webhookData.data?.transactionId || webhookData.transactionId;
    const amount = webhookData.data?.amount || webhookData.amount;
    const state = webhookData.data?.state || webhookData.state;
    
    console.log('[PhonePe Webhook] Data:', {
      merchantTransactionId,
      transactionId,
      state,
      amount
    });
    
    // 🔥 CRITICAL: IDEMPOTENCY CHECK - Fetch order first
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('order_number', merchantTransactionId)
      .single();
    
    if (fetchError || !order) {
      console.error('[PhonePe Webhook] Order not found:', merchantTransactionId, fetchError);
      return NextResponse.json({ error: 'order_not_found' }, { status: 404 });
    }
    
    // 🔥 CRITICAL: Check if already processed (idempotency protection)
    if (order.post_payment_processed) {
      console.log('[PhonePe Webhook] ⚠️ Already processed, skipping:', merchantTransactionId);
      return NextResponse.json({ 
        success: true, 
        message: 'Already processed' 
      }, { status: 200 });
    }
    
    // Determine order status based on payment state
    let orderStatus: 'paid' | 'failed' | 'pending' = 'pending';
    
    if (state === 'COMPLETED') {
      orderStatus = 'paid';
    } else if (state === 'FAILED') {
      orderStatus = 'failed';
    }
    
    // Update order status
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: orderStatus,
        phonepe_transaction_id: transactionId,
      })
      .eq('order_number', merchantTransactionId);
    
    if (updateError) {
      console.error('[PhonePe Webhook] ❌ Failed to update order:', updateError);
      return NextResponse.json({ error: 'database_update_failed' }, { status: 500 });
    }
    
    console.log(`[PhonePe Webhook] Order ${merchantTransactionId} updated to status: ${orderStatus}`);

    // If payment successful, process coupon usage, wallet deduction, and cashback
    if (orderStatus === 'paid') {
      try {
        // Process coupon usage
        await processCouponUsage(merchantTransactionId);
        
        // Process wallet deduction and cashback
        await processWalletAndCashbackForCompletedOrder(merchantTransactionId);
        
        // 🔥 CRITICAL: Mark as processed (idempotency flag)
        const { error: flagError } = await supabaseAdmin
          .from('orders')
          .update({ post_payment_processed: true })
          .eq('order_number', merchantTransactionId);
        
        if (flagError) {
          console.error('[PhonePe Webhook] ❌ Failed to set post_payment_processed flag:', flagError);
          // Don't fail the request - processing was successful
        } else {
          console.log('[PhonePe Webhook] ✅ Processed successfully:', merchantTransactionId);
        }
      } catch (processingError) {
        console.error('[PhonePe Webhook] ❌ Post-payment processing failed:', processingError);
        // Don't fail the webhook - order status is already updated
        // This allows manual retry or admin intervention
      }
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('[PhonePe Webhook] ❌ Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
