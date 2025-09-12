import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { resolveTenantIdFromRequest } from '@/server/tenant'

export const runtime = 'nodejs'

async function getActiveWebhookSecret(tenantId?: string | null): Promise<string | null> {
  try {
    if (!tenantId) return null
    const { data, error } = await supabaseAdmin
      .from('tenant_payment_settings')
      .select('env, enabled, webhook_secret')
      .eq('tenant_id', tenantId)
    if (error || !data?.length) return null
    const active = data.find(r => r.enabled)
    if (!active?.webhook_secret) return null
    // Stored as hex with \x prefix
    const hex = String(active.webhook_secret).replace(/^\\x/i, '')
    try {
      const buf = Buffer.from(hex, 'hex')
      return buf.toString('utf8') || null
    } catch {
      return null
    }
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  try {
    // Read raw body for signature verification
    const rawBody = await req.text()
    const sig = req.headers.get('x-razorpay-signature') || ''

    // Attempt to resolve tenant (may be null for external webhook calls)
    const tenantId = await resolveTenantIdFromRequest().catch(() => null)
    const secret = await getActiveWebhookSecret(tenantId)

    // In development, allow webhook without verification if no secret configured
    const allowUnverified = !secret && process.env.NODE_ENV !== 'production'

    let verified = false
    if (secret) {
      const crypto = await import('crypto')
      const hmac = crypto.createHmac('sha256', secret)
      hmac.update(rawBody)
      const expected = hmac.digest('hex')
      verified = Boolean(sig && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)))
    }

    if (!verified && !allowUnverified) {
      return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 401 })
    }

    // Parse JSON safely after signature verification
    let _payload: unknown
    try {
      _payload = JSON.parse(rawBody)
    } catch {
      _payload = null
    }

    // TODO: Map events (e.g. payment.captured) to order state transitions
    // For now, just acknowledge
    return NextResponse.json({ ok: true, verified, tenantId: tenantId || null })
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
  }
}

