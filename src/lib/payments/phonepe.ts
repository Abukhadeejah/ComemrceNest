// PhonePe Payment Gateway - Latest API Implementation
import crypto from 'crypto';
import { supabaseAdmin } from '@/server/supabaseAdmin';

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
  config: PhonePeConfig
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

  // 2. PhonePe Standard Checkout payload
  const payload = {
    merchantId: config.merchantId,
    merchantTransactionId: orderId,
    merchantUserId: `user_${Date.now()}`,
    amount: amountCents, // Amount in paise
    redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?orderId=${orderId}`,
    redirectMode: 'REDIRECT',
    callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/phonepe`,
    mobileNumber: customerPhone,
    paymentInstrument: {
      type: 'PAY_PAGE'
    }
  };

  // 3. Generate checksum as per PhonePe documentation
  const base64Body = Buffer.from(JSON.stringify(payload)).toString('base64');
  const checksumString = base64Body + '/pg/v1/pay' + config.saltKey;
  const sha256Hash = crypto
    .createHash('sha256')
    .update(checksumString)
    .digest('hex');
  const checksum = sha256Hash + '###' + config.saltIndex;

  const payApiUrl = process.env.PHONEPE_PAY_API_URL || `${config.baseUrl}/pg/v1/pay`;
  
  console.log('PhonePe Payment Request:', {
    url: payApiUrl,
    merchantId: config.merchantId,
    orderId: orderId,
    amount: amountCents,
    checksumPreview: checksum.substring(0, 20) + '...'
  });

  // 4. Call PhonePe Standard Checkout API
  const response = await fetch(payApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-VERIFY': checksum,
    },
    body: JSON.stringify({
      request: base64Body
    }),
  });

  const responseText = await response.text();
  console.log('PhonePe API Response:', {
    status: response.status,
    body: responseText.substring(0, 300)
  });

  if (!response.ok) {
    throw new Error(`PhonePe payment failed: ${response.status} - ${responseText}`);
  }

  const data = JSON.parse(responseText);
  
  if (!data.success) {
    throw new Error(`PhonePe error: ${data.message || 'Unknown error'}`);
  }

  const redirectUrl = data.data?.instrumentResponse?.redirectInfo?.url;
  
  if (!redirectUrl) {
    console.error('PhonePe Response Structure:', data);
    throw new Error('No redirect URL in PhonePe response');
  }

  return {
    redirectUrl,
    orderId,
  };
}

export async function verifyPhonePeWebhook(
  webhookBody: any,
  config: PhonePeConfig
): Promise<any> {
  const receivedChecksum = webhookBody['X-VERIFY'];
  const base64Response = webhookBody.response;
  
  if (!receivedChecksum || !base64Response) {
    throw new Error('Invalid webhook: missing checksum or response');
  }

  // Verify checksum
  const checksumString = base64Response + '/pg/v1/status/' + config.merchantId + config.saltKey;
  const expectedChecksum = crypto
    .createHash('sha256')
    .update(checksumString)
    .digest('hex') + '###' + config.saltIndex;

  if (receivedChecksum !== expectedChecksum) {
    throw new Error('Invalid webhook checksum');
  }

  // Decode response
  const decodedResponse = JSON.parse(Buffer.from(base64Response, 'base64').toString());
  return decodedResponse;
}

export async function checkPhonePePaymentStatus(
  merchantTransactionId: string,
  config: PhonePeConfig
): Promise<any> {
  // Generate checksum for status check
  const checksumString = `/pg/v1/status/${config.merchantId}/${merchantTransactionId}` + config.saltKey;
  const sha256Hash = crypto
    .createHash('sha256')
    .update(checksumString)
    .digest('hex');
  const checksum = sha256Hash + '###' + config.saltIndex;

  const statusApiUrl = process.env.PHONEPE_STATUS_API_URL || `${config.baseUrl}/pg/v1/status`;
  const fullStatusUrl = `${statusApiUrl}/${config.merchantId}/${merchantTransactionId}`;

  console.log('PhonePe Status Check:', {
    url: fullStatusUrl,
    merchantTransactionId,
  });

  const response = await fetch(fullStatusUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-VERIFY': checksum,
      'X-MERCHANT-ID': config.merchantId,
    },
  });

  const responseText = await response.text();
  console.log('PhonePe Status Response:', {
    status: response.status,
    body: responseText.substring(0, 300)
  });

  if (!response.ok) {
    throw new Error(`PhonePe status check failed: ${response.status} - ${responseText}`);
  }

  const data = JSON.parse(responseText);
  return data;
}