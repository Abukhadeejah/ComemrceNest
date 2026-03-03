import { StandardCheckoutClient, Env } from 'pg-sdk-node';

const rawEnv = (process.env.PHONEPE_ENV || 'SANDBOX').trim().toUpperCase();
const clientId = process.env.PHONEPE_CLIENT_ID?.trim() || '';
const clientSecret = process.env.PHONEPE_CLIENT_SECRET?.trim() || '';
const clientVersion = parseInt(process.env.PHONEPE_CLIENT_VERSION || '1', 10);
const merchantId = process.env.PHONEPE_MERCHANT_ID?.trim() || '';

// Map environment string to SDK Env enum
const env = ['PRODUCTION', 'PROD', 'LIVE'].includes(rawEnv) ? Env.PRODUCTION : Env.SANDBOX;

let clientInstance: ReturnType<typeof StandardCheckoutClient.getInstance> | null = null;

export function getPhonePeClient() {
  if (!clientId || !clientSecret) {
    throw new Error('Missing PHONEPE_CLIENT_ID or PHONEPE_CLIENT_SECRET');
  }

  if (!clientInstance) {
    clientInstance = StandardCheckoutClient.getInstance(
      clientId,
      clientSecret,
      clientVersion,
      env
    );
  }

  return clientInstance;
}

// Backward-compatible export used by existing imports
export const phonepeClient = clientId && clientSecret
  ? getPhonePeClient()
  : null;

export const phonepeConfig = {
  merchantId,
  env,
  rawEnv,
};

// Legacy config for any remaining manual checksum operations
export const legacyPhonepeConfig = {
  merchantId,
  saltKey: process.env.PHONEPE_SALT_KEY?.trim() || '',
  saltIndex: process.env.PHONEPE_SALT_INDEX || '1',
  baseUrl: env === Env.PRODUCTION 
    ? 'https://api.phonepe.com/apis/hermes' 
    : 'https://api-preprod.phonepe.com/apis/pg-sandbox',
};