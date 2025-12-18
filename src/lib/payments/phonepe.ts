// PhonePe Payment Gateway - SDK Implementation
import crypto from 'crypto';
import { supabaseAdmin } from '@/server/supabaseAdmin';
import { phonepeClient, phonepeConfig, legacyPhonepeConfig } from '@/config/phonepe';
import { StandardCheckoutPayRequest } from 'pg-sdk-node';

export interface PhonePeConfig {
  merchantId: string;
  saltKey: string;
  saltIndex: string;
  baseUrl: string;
}

export async function createPhonePePayment(
  tenantId: string,
  orderId: string,
  amountCents: number,
  customerEmail: string,
  customerPhone: string,
  config?: PhonePeConfig // Made optional since we now use SDK config
) {
  // 1. Create pending order in DB
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .insert({
      order_number: orderId,
      tenant_id: tenantId,
      status: 'pending',
      total_cents: amountCents,
      payment_provider: 'phonepe',
      email: customerEmail,
    })
    .select()
    .single();

  if (error || !order) {
    throw new Error(`Order creation failed: ${error?.message}`);
  }

  // 2. Create SDK payment request using builder pattern
  const payRequest = StandardCheckoutPayRequest.builder()
    .merchantOrderId(orderId)
    .amount(amountCents) // Amount in paise
    .redirectUrl(`${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?orderId=${orderId}`)
    .build();

  console.log('PhonePe SDK Payment Request:', {
    merchantId: phonepeConfig.merchantId,
    orderId: orderId,
    amount: amountCents,
    env: phonepeConfig.env
  });

  // 3. Use SDK to create payment
  try {
    const response = await phonepeClient.pay(payRequest);
    
    console.log('PhonePe SDK Response:', {
      orderId: response.orderId,
      state: response.state,
      redirectUrl: response.redirectUrl
    });

    const redirectUrl = response.redirectUrl;
    
    if (!redirectUrl) {
      console.error('PhonePe SDK Response Structure:', response);
      throw new Error('No redirect URL in PhonePe SDK response');
    }

    return {
      redirectUrl,
      orderId,
    };
  } catch (error: any) {
    console.error('PhonePe SDK payment error:', error);
    throw new Error(`PhonePe SDK payment failed: ${error.message}`);
  }
}

export async function verifyPhonePeWebhook(
  webhookBody: any,
  config?: PhonePeConfig // Made optional, fallback to legacy for webhook verification
): Promise<any> {
  const receivedChecksum = webhookBody['X-VERIFY'];
  const base64Response = webhookBody.response;
  
  if (!receivedChecksum || !base64Response) {
    throw new Error('Invalid webhook: missing checksum or response');
  }

  // Use legacy config for webhook verification (manual checksum still needed)
  const verifyConfig = config || legacyPhonepeConfig;
  
  // Verify checksum
  const checksumString = base64Response + '/pg/v1/status/' + verifyConfig.merchantId + verifyConfig.saltKey;
  const expectedChecksum = crypto
    .createHash('sha256')
    .update(checksumString)
    .digest('hex') + '###' + verifyConfig.saltIndex;

  if (receivedChecksum !== expectedChecksum) {
    throw new Error('Invalid webhook checksum');
  }

  // Decode response
  const decodedResponse = JSON.parse(Buffer.from(base64Response, 'base64').toString());
  return decodedResponse;
}

export async function checkPhonePePaymentStatus(
  merchantTransactionId: string,
  config?: PhonePeConfig // Made optional since we now use SDK
): Promise<any> {
  console.log('PhonePe SDK Status Check:', {
    merchantId: phonepeConfig.merchantId,
    merchantTransactionId,
    env: phonepeConfig.env
  });

  try {
    // Use SDK to check payment status
    const response = await phonepeClient.getOrderStatus(merchantTransactionId);

    console.log('PhonePe SDK Status Response:', {
      orderId: response.orderId,
      state: response.state,
      amount: response.amount
    });

    return response;
  } catch (error: any) {
    console.error('PhonePe SDK status check error:', error);
    throw new Error(`PhonePe SDK status check failed: ${error.message}`);
  }
}