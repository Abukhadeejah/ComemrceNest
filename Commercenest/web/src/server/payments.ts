import { supabaseAdmin } from '@/server/supabaseAdmin'

type PaymentEnv = 'test' | 'live'

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





