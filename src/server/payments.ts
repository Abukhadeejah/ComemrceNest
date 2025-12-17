import { supabaseAdmin } from '@/server/supabaseAdmin'
import { getTenantConfig } from '@/tenants'

type PaymentEnv = 'test' | 'live'
type PaymentProvider = 'razorpay' | 'phonepe' | 'juspay'

function decodeSecretHex(hexValue: string | null | undefined): string | null {
  if (!hexValue) return null
  try {
    const cleanHex = hexValue.startsWith('\\x') ? hexValue.slice(2) : hexValue
    return Buffer.from(cleanHex, 'hex').toString('utf8')
  } catch {
    return null
  }
}

function maskSecret(secret: string | null | undefined): string {
  if (!secret) return ''
  const tail = secret.slice(-4)
  return `***${tail}`
}

export interface RazorpayCredentialsResolution {
  keyId: string
  keySecret: string
  env: PaymentEnv
  source: 'tenant' | 'platform'
}

export async function resolveRazorpayCredentials(tenantId: string): Promise<RazorpayCredentialsResolution | null> {
  const { data: rows } = await supabaseAdmin
    .from('tenant_payment_settings')
    .select('env, enabled, razorpay_key_id, razorpay_key_secret')
    .eq('tenant_id', tenantId)

  // Prefer an enabled row that actually has credentials
  const enabledWithCreds = rows?.find(r => {
    const hasId = !!r.razorpay_key_id
    const hasSecret = !!decodeSecretHex(r.razorpay_key_secret || null)
    return r.enabled && hasId && hasSecret
  })

  if (enabledWithCreds) {
    const keyId = enabledWithCreds.razorpay_key_id as string
    const keySecret = decodeSecretHex(enabledWithCreds.razorpay_key_secret) as string
    console.info('[payments:resolver] using tenant credentials', {
      tenantId,
      env: enabledWithCreds.env,
      keyId,
      keySecret: maskSecret(keySecret),
    })
    return { keyId, keySecret, env: (enabledWithCreds.env as PaymentEnv) || 'test', source: 'tenant' }
  }

  // Fallback to platform env vars
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (keyId && keySecret) {
    console.info('[payments:resolver] using platform fallback credentials', {
      tenantId,
      keyId,
      keySecret: maskSecret(keySecret),
    })
    return { keyId, keySecret, env: 'test', source: 'platform' }
  }

  console.error('[payments:resolver] no credentials available', { tenantId })
  return null
}

// PhonePe Standard Checkout credentials resolution
export interface PhonePeCredentialsResolution {
  merchantId: string
  saltKey: string
  saltIndex: string
  baseUrl: string
  env: PaymentEnv
  source: 'tenant' | 'platform'
}

export async function resolvePhonePeCredentials(tenantId: string): Promise<PhonePeCredentialsResolution | null> {
  // Try platform env vars first
  const merchantId = process.env.PHONEPE_MERCHANT_ID
  const saltKey = process.env.PHONEPE_SALT_KEY
  const saltIndex = process.env.PHONEPE_SALT_INDEX || '1'
  const env = (process.env.PHONEPE_ENV || 'test') as PaymentEnv

  if (merchantId && saltKey) {
    const baseUrl = env === 'live' 
      ? 'https://api.phonepe.com/apis/hermes' 
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox'
    
    console.info('[payments:resolver] using PhonePe platform credentials', {
      tenantId,
      merchantId,
      env,
    })
    
    return { merchantId, saltKey, saltIndex, baseUrl, env, source: 'platform' }
  }

  console.error('[payments:resolver] no PhonePe credentials available', { tenantId })
  return null
}

// Get payment provider for tenant
export async function getPaymentProvider(tenantId: string): Promise<PaymentProvider> {
  // Map tenant IDs to keys
  const tenantIdToKey: Record<string, string> = {
    '11111111-1111-4111-8111-11111111bb01': 'bluebell',
    '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c': 'senlysh',
  }
  
  const tenantKey = tenantIdToKey[tenantId]
  if (!tenantKey) {
    console.warn(`[payments] Unknown tenant ID: ${tenantId}, defaulting to razorpay`)
    return 'razorpay'
  }
  
  const config = getTenantConfig(tenantKey)
  const provider = config?.payments?.provider || 'razorpay'
  console.log(`[payments] Tenant ${tenantKey} (${tenantId}) using provider: ${provider}`)
  return provider
}









