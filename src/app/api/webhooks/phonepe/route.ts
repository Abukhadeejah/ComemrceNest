import { NextRequest, NextResponse } from 'next/server';
import { verifyPhonePeWebhook } from '@/lib/payments/phonepe';
import { supabaseAdmin } from '@/server/supabaseAdmin';

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

    console.log('PhonePe Webhook received:', {
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
    
    console.log('PhonePe Webhook data:', {
      merchantTransactionId,
      transactionId,
      state,
      amount
    });
    
    // Update order status based on payment state
    let orderStatus: 'paid' | 'failed' | 'pending' = 'pending';
    
    if (state === 'COMPLETED') {
      orderStatus = 'paid';
    } else if (state === 'FAILED') {
      orderStatus = 'failed';
    }
    
    // Update order in database
    const { error } = await supabaseAdmin
      .from('orders')
      .update({
        status: orderStatus,
        phonepe_transaction_id: transactionId,
        updated_at: new Date().toISOString(),
      })
      .eq('order_number', merchantTransactionId);
    
    if (error) {
      console.error('Failed to update order:', error);
      return NextResponse.json({ error: 'database_update_failed' }, { status: 500 });
    }
    
    console.log(`Order ${merchantTransactionId} updated to status: ${orderStatus}`);

    // If payment successful, process coupon usage
    if (orderStatus === 'paid') {
      await processCouponUsage(merchantTransactionId);
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('PhonePe webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
