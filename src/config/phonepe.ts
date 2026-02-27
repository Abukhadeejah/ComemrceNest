import { StandardCheckoutClient, Env } from 'pg-sdk-node';

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required PhonePe environment variable: ${name}`);
  }
  return value;
}

const rawEnv = (process.env.PHONEPE_ENV || 'SANDBOX').trim().toUpperCase();

const clientId = requiredEnv('PHONEPE_CLIENT_ID');
const clientSecret = requiredEnv('PHONEPE_CLIENT_SECRET');
const clientVersion = parseInt(process.env.PHONEPE_CLIENT_VERSION || '1', 10);
const merchantId = requiredEnv('PHONEPE_MERCHANT_ID');

// Map environment string to SDK Env enum
const env = ['PRODUCTION', 'PROD', 'LIVE'].includes(rawEnv) ? Env.PRODUCTION : Env.SANDBOX;

// Initialize PhonePe SDK client
export const phonepeClient = StandardCheckoutClient.getInstance(
  clientId,
  clientSecret,
  clientVersion,
  env
);

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