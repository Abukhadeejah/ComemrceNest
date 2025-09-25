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

export async function getPaymentSettings() {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) throw new Error('Tenant not found')
  await assertTenantAdmin(tenantId)

  const { data, error } = await supabaseAdmin
    .from('tenant_payment_settings')
    .select('env, enabled, razorpay_key_id, test_mode')
    .eq('tenant_id', tenantId)

  if (error) throw new Error(`Failed to fetch payment settings: ${error.message}`)

  const enabledRow = data?.find((r) => r.enabled)
  const mode: PaymentEnv = enabledRow?.env === 'live' ? 'live' : 'test'

  return {
    mode,
    hasTest: !!data?.find((r) => r.env === 'test'),
    hasLive: !!data?.find((r) => r.env === 'live'),
    testKeyId: data?.find((r) => r.env === 'test')?.razorpay_key_id || '',
    liveKeyId: data?.find((r) => r.env === 'live')?.razorpay_key_id || '',
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


