import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/server/supabaseAdmin';
import { checkPhonePePaymentStatus } from '@/lib/payments/phonepe';
import type { Order } from '@/types/order';

/**
 * Verify payment status directly with PhonePe - WITH IDEMPOTENCY PROTECTION
 * 
 * Used as fallback when webhook doesn't fire (common in test mode)
 * 
 * IDEMPOTENCY PROTECTION:
 * - Checks post_payment_processed flag before processing
 * - Returns success if already processed
 * - Sets flag to true after successful processing
 * - Prevents duplicate cashback on manual verification
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    console.log(`[verify-payment] Checking PhonePe status for order: ${orderId}`);

    // Get order from database
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('order_number', orderId)
      .single();

    if (orderError || !order) {
      console.error('[verify-payment] Order not found:', orderError);
      return NextResponse.json({ error: 'order_not_found' }, { status: 404 });
    }

    // 🔥 CRITICAL: Check if already processed (idempotency protection)
    if (order.post_payment_processed) {
      console.log('[verify-payment] ⚠️ Already processed, skipping:', orderId);
      return NextResponse.json({ 
        success: true, 
        status: order.status,
        message: 'Already processed',
        alreadyProcessed: true
      });
    }

    // If already paid, return success
    if (order.status === 'paid') {
      console.log('[verify-payment] Order already paid (but not processed)');
      // Continue to process cashback if not done yet
    }

    // Check with PhonePe API
    try {
      const phonepeStatus = await checkPhonePePaymentStatus(orderId);
      
      console.log('[verify-payment] PhonePe status response:', {
        orderId,
        state: phonepeStatus.state,
        code: phonepeStatus.code
      });

      // Determine order status from PhonePe response
      let newStatus: 'paid' | 'failed' | 'pending' = 'pending';
      
      if (phonepeStatus.state === 'COMPLETED' || phonepeStatus.code === 'PAYMENT_SUCCESS') {
        newStatus = 'paid';
      } else if (phonepeStatus.state === 'FAILED' || phonepeStatus.code === 'PAYMENT_ERROR') {
        newStatus = 'failed';
      }

      // Update order status if changed
      if (newStatus !== order.status) {
        const { error: updateError } = await supabaseAdmin
          .from('orders')
          .update({
            status: newStatus,
            phonepe_transaction_id: phonepeStatus.transactionId || phonepeStatus.data?.transactionId,
          })
          .eq('order_number', orderId);

        if (updateError) {
          console.error('[verify-payment] ❌ Failed to update order:', {
            error: updateError,
            code: updateError.code,
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint
          });
          return NextResponse.json({ 
            error: 'update_failed',
            message: updateError.message,
            details: updateError.details 
          }, { status: 500 });
        }

        console.log(`[verify-payment] Order ${orderId} updated to status: ${newStatus}`);
      }

      // If paid, trigger post-payment processing
      if (newStatus === 'paid') {
        try {
          // Import and call the same processing functions used in webhook
          const { processCashbackForOrder } = await import('@/lib/cashback/cashbackService');
          
          // Process wallet deduction and cashback
          // Get order with items
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
                unit_price_cents,
                products (
                  cost_per_item_cents
                )
              )
            `)
            .eq('order_number', orderId)
            .single();

          if (fullOrder && fullOrder.customer_id) {
            // Debit wallet if used
            if (fullOrder.wallet_used_cents && fullOrder.wallet_used_cents > 0) {
              const { data: walletAccount } = await supabaseAdmin
                .from('wallet_accounts')
                .select('id')
                .eq('customer_id', fullOrder.customer_id)
                .eq('tenant_id', fullOrder.tenant_id)
                .single();

              if (walletAccount) {
                await supabaseAdmin
                  .from('wallet_ledger')
                  .insert({
                    account_id: walletAccount.id,
                    tenant_id: fullOrder.tenant_id,
                    entry_type: 'debit',
                    amount_cents: fullOrder.wallet_used_cents,
                    currency: 'INR',
                    source_key: 'ORDER_PAYMENT',
                    reference_id: fullOrder.id,
                    metadata: {
                      description: 'Payment for order',
                      order_id: fullOrder.id,
                      order_number: orderId
                    }
                  });
                
                console.log(`[verify-payment] Wallet debited: ₹${fullOrder.wallet_used_cents / 100}`);
              }
            }

            // Calculate and process cashback
            let totalPurchasePriceCents = 0;
            if (fullOrder.order_items) {
              for (const item of fullOrder.order_items) {
                const costPrice = item.products?.cost_per_item_cents || 0;
                totalPurchasePriceCents += costPrice * item.quantity;
              }
            }

            const cashbackResult = await processCashbackForOrder({
              tenantId: fullOrder.tenant_id,
              orderId: fullOrder.id,
              customerId: fullOrder.customer_id,
              totalSalePriceCents: fullOrder.total_cents,
              totalPurchasePriceCents,
              walletUsedCents: fullOrder.wallet_used_cents || 0,
              cashPaidCents: fullOrder.cash_paid_cents || fullOrder.total_cents
            });

            console.log(`[verify-payment] Cashback processed: ₹${cashbackResult.cashbackEarned / 100}`);
            
            // 🔥 CRITICAL: Mark as processed (idempotency flag)
            const { error: flagError } = await supabaseAdmin
              .from('orders')
              .update({ post_payment_processed: true })
              .eq('order_number', orderId);
            
            if (flagError) {
              console.error('[verify-payment] ❌ Failed to set post_payment_processed flag:', flagError);
            } else {
              console.log('[verify-payment] ✅ Processed successfully:', orderId);
            }
          }
        } catch (processingError) {
          console.error('[verify-payment] Post-payment processing error:', processingError);
          // Don't fail the request, order is already marked as paid
        }
      }

      return NextResponse.json({ 
        success: true, 
        status: newStatus,
        phonepeState: phonepeStatus.state,
        updated: newStatus !== order.status
      });

    } catch (phonepeError: any) {
      console.error('[verify-payment] PhonePe API error:', phonepeError);
      
      // If PhonePe API fails, we can't verify - return current status
      return NextResponse.json({ 
        success: false,
        status: order.status,
        error: 'phonepe_api_error',
        message: phonepeError.message
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[verify-payment] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'internal_error',
      message: error.message 
    }, { status: 500 });
  }
}
