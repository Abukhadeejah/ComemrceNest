import { StandardCheckoutClient, Env } from 'pg-sdk-node';

// TODO: Fill these values from your PhonePe dashboard
const clientId = process.env.PHONEPE_CLIENT_ID!;
const clientSecret = process.env.PHONEPE_CLIENT_SECRET!;
const clientVersion = parseInt(process.env.PHONEPE_CLIENT_VERSION || '1', 10);
const merchantId = process.env.PHONEPE_MERCHANT_ID!;

// Map environment string to SDK Env enum
const env = process.env.PHONEPE_ENV === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;

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
};

// Legacy config for any remaining manual checksum operations
export const legacyPhonepeConfig = {
  merchantId,
  saltKey: process.env.PHONEPE_SALT_KEY!,
  saltIndex: process.env.PHONEPE_SALT_INDEX || '1',
  baseUrl: env === Env.PRODUCTION 
    ? 'https://api.phonepe.com/apis/hermes' 
    : 'https://api-preprod.phonepe.com/apis/pg-sandbox',
};