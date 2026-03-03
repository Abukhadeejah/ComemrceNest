// PhonePe Payment Gateway - SDK Implementation
import crypto from 'crypto';
import { supabaseAdmin } from '@/server/supabaseAdmin';
import { getPhonePeClient, phonepeConfig, legacyPhonepeConfig } from '@/config/phonepe';
import { StandardCheckoutPayRequest } from 'pg-sdk-node';

export interface PhonePeConfig {
  merchantId: string;
  saltKey: string;
  saltIndex: string;
  baseUrl: string;
}

function resolvePhonePeRedirectBaseUrl(overrideBaseUrl?: string): string {
  const isProductionPhonePe = String(process.env.PHONEPE_ENV || '').trim().toUpperCase() === 'PRODUCTION';

  const candidates = [
    overrideBaseUrl,
    process.env.PHONEPE_REDIRECT_BASE_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ];

  for (const candidate of candidates) {
    const raw = (candidate || '').trim();
    if (!raw) continue;

    const normalizedBaseUrl = raw.replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(normalizedBaseUrl)) {
      continue;
    }

    if (isProductionPhonePe && normalizedBaseUrl.startsWith('http://')) {
      continue;
    }

    return normalizedBaseUrl;
  }

  if (isProductionPhonePe) {
    throw new Error('PhonePe production requires an HTTPS redirect base URL. Set PHONEPE_REDIRECT_BASE_URL to an HTTPS URL');
  }

  throw new Error('Missing or invalid redirect base URL. Set PHONEPE_REDIRECT_BASE_URL or NEXT_PUBLIC_BASE_URL');
}

export async function createPhonePePayment(
  tenantId: string,
  orderId: string,
  amountCents: number,
  customerEmail: string,
  customerPhone: string,
  config?: PhonePeConfig,
  redirectBaseUrl?: string
) {
  // Verify credentials are loaded
  const clientId = process.env.PHONEPE_CLIENT_ID;
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
  const merchantId = process.env.PHONEPE_MERCHANT_ID;
  
  console.log('PhonePe Credentials Check:', {
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    hasMerchantId: !!merchantId,
    clientIdLength: clientId?.length,
    merchantId: merchantId,
    env: process.env.PHONEPE_ENV
  });
  
  if (!clientId || !clientSecret || !merchantId) {
    throw new Error('PhonePe credentials not configured in environment variables');
  }

  const sdkClient = getPhonePeClient();

  const resolvedBaseUrl = resolvePhonePeRedirectBaseUrl(redirectBaseUrl);

  // Create SDK payment request using builder pattern
  const payRequest = StandardCheckoutPayRequest.builder()
    .merchantOrderId(orderId)
    .amount(amountCents) // Amount in paise
    .redirectUrl(`${resolvedBaseUrl}/checkout/success?orderId=${orderId}`)
    .build();

  console.log('PhonePe SDK Payment Request:', {
    merchantId: phonepeConfig.merchantId,
    clientId: process.env.PHONEPE_CLIENT_ID?.substring(0, 10) + '...',
    orderId: orderId,
    amount: amountCents,
    env: phonepeConfig.env,
    redirectBaseUrl: resolvedBaseUrl
  });

  // Use SDK to create payment
  try {
    const response = await sdkClient.pay(payRequest);
    
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
    console.error('PhonePe SDK payment error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });
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
  const sdkClient = getPhonePeClient();

  console.log('PhonePe SDK Status Check:', {
    merchantId: phonepeConfig.merchantId,
    merchantTransactionId,
    env: phonepeConfig.env
  });

  try {
    // Use SDK to check payment status
    const response = await sdkClient.getOrderStatus(merchantTransactionId);

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