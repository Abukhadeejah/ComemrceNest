"use server"

import { resolveTenantIdFromRequest } from '@/server/tenant'
import { assertTenantAdmin } from '@/server/auth'
import { supabaseAdmin } from '@/server/supabaseAdmin'

type PaymentEnv = 'test' | 'live'

function encodeSecretHex(secret: string | null | undefined): string | null {
  if (!secret) return null
  const hex = Buffer.from(secret, 'utf8').toString('hex')
  return `\\x${hex}`
}

function decodeSecretHex(hexValue: string | null | undefined): string | null {
  if (!hexValue) return null
  try {
    // Remove \x prefix if present
    const cleanHex = hexValue.startsWith('\\x') ? hexValue.slice(2) : hexValue
    return Buffer.from(cleanHex, 'hex').toString('utf8')
  } catch {
    return null
  }
}

export async function getPaymentSettings() {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) throw new Error('Tenant not found')
  await assertTenantAdmin(tenantId)

  const { data, error } = await supabaseAdmin
    .from('tenant_payment_settings')
    .select('env, enabled, razorpay_key_id, razorpay_key_secret, webhook_secret, test_mode')
    .eq('tenant_id', tenantId)

  if (error) throw new Error(`Failed to fetch payment settings: ${error.message}`)

  const enabledRow = data?.find((r) => r.enabled)
  const mode: PaymentEnv = enabledRow?.env === 'live' ? 'live' : 'test'

  const testRow = data?.find((r) => r.env === 'test')
  const liveRow = data?.find((r) => r.env === 'live')

  return {
    mode,
    hasTest: !!testRow,
    hasLive: !!liveRow,
    testKeyId: testRow?.razorpay_key_id || '',
    testKeySecret: decodeSecretHex(testRow?.razorpay_key_secret) || '',
    testWebhookSecret: decodeSecretHex(testRow?.webhook_secret) || '',
    liveKeyId: liveRow?.razorpay_key_id || '',
    liveKeySecret: decodeSecretHex(liveRow?.razorpay_key_secret) || '',
    liveWebhookSecret: decodeSecretHex(liveRow?.webhook_secret) || '',
  }
}

export async function updatePaymentSettings(formData: FormData) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) throw new Error('Tenant not found')
  await assertTenantAdmin(tenantId)

  const mode = (formData.get('mode') as PaymentEnv) || 'test'
  const testKeyId = (formData.get('test_key_id') as string) || ''
  const testKeySecret = (formData.get('test_key_secret') as string) || ''
  const testWebhookSecret = (formData.get('test_webhook_secret') as string) || ''
  const liveKeyId = (formData.get('live_key_id') as string) || ''
  const liveKeySecret = (formData.get('live_key_secret') as string) || ''
  const liveWebhookSecret = (formData.get('live_webhook_secret') as string) || ''

  // Upsert both env rows idempotently; only selected mode is enabled
  const upserts = [
    {
      tenant_id: tenantId,
      env: 'test',
      enabled: mode === 'test',
      razorpay_key_id: testKeyId || null,
      razorpay_key_secret: encodeSecretHex(testKeySecret),
      webhook_secret: encodeSecretHex(testWebhookSecret),
    },
    {
      tenant_id: tenantId,
      env: 'live',
      enabled: mode === 'live',
      razorpay_key_id: liveKeyId || null,
      razorpay_key_secret: encodeSecretHex(liveKeySecret),
      webhook_secret: encodeSecretHex(liveWebhookSecret),
    },
  ]

  const { error } = await supabaseAdmin
    .from('tenant_payment_settings')
    .upsert(upserts, { onConflict: 'tenant_id,env' as unknown as undefined })

  if (error) throw new Error(`Failed to update payment settings: ${error.message}`)

  return { success: true }
}


