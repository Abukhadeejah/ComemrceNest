import { NextRequest, NextResponse } from 'next/server';
import { verifyPhonePeWebhook } from '@/lib/payments/phonepe';
import { supabaseAdmin } from '@/server/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // PhonePe config
    const config = {
      merchantId: process.env.PHONEPE_MERCHANT_ID!,
      saltKey: process.env.PHONEPE_SALT_KEY!,
      saltIndex: process.env.PHONEPE_SALT_INDEX!,
      baseUrl: process.env.PHONEPE_ENV === 'production' 
        ? 'https://api.phonepe.com/apis/hermes' 
        : 'https://api-preprod.phonepe.com/apis/pg-sandbox',
    };

    console.log('PhonePe Webhook received:', {
      hasXVerify: !!body['X-VERIFY'],
      hasResponse: !!body.response,
    });

    // Verify webhook signature
    const webhookData = await verifyPhonePeWebhook(body, config);
    
    const { merchantTransactionId, transactionId, amount, state } = webhookData.data;
    
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
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('PhonePe webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
