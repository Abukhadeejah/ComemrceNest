/**
 * WhatsApp Notification Client
 *
 * Thin wrapper around the standalone WhatsApp microservice.
 * Failure to send WhatsApp messages never propagates as an error
 * to the caller — this ensures WhatsApp outages do not break
 * primary business operations.
 */

/**
 * In-memory duplicate-send cooldown to suppress repeated sends for the same
 * phone/message/idempotency key within a short window.
 *
 * Window: 2 minutes.
 * Storage: process-local Map, so it resets on server restart or redeploy.
 * Intent: short-term protection now; a DB-backed idempotency table is the
 * longer-term upgrade path if persistence across restarts becomes necessary.
 */
const duplicateSendCooldownMs = 2 * 60 * 1000
const recentSendAttempts = new Map<string, number>()

function normalizeWhatsAppPhone(phone: string): string {
  return phone.trim().replace(/\D/g, '')
}

function makeCooldownKey(phone: string, message: string, idempotencyKey?: string): string {
  return `${idempotencyKey || 'message'}:${phone}:${message}`
}

async function sendWhatsAppMessage(
  phone: string,
  message: string,
  idempotencyKey?: string
): Promise<void> {
  if (!phone?.trim() || !message?.trim()) {
    console.warn('[WhatsApp] Invalid input: phone and message must be non-empty strings')
    return
  }

  const normalizedPhone = normalizeWhatsAppPhone(phone)
  if (!normalizedPhone) {
    console.warn('[WhatsApp] Invalid phone number after normalization')
    return
  }

  const serviceUrl = process.env.WHATSAPP_SERVICE_URL
  const internalSecret = process.env.WHATSAPP_INTERNAL_SECRET

  const cooldownKey = makeCooldownKey(normalizedPhone, message, idempotencyKey)
  const lastAttemptAt = recentSendAttempts.get(cooldownKey)
  const now = Date.now()

  if (lastAttemptAt && now - lastAttemptAt < duplicateSendCooldownMs) {
    console.warn(
      `[WhatsApp] Duplicate notification suppressed within cooldown window (${Math.round(duplicateSendCooldownMs / 1000)}s)`
    )
    return
  }

  recentSendAttempts.set(cooldownKey, now)

  for (const [key, timestamp] of recentSendAttempts.entries()) {
    if (now - timestamp > duplicateSendCooldownMs) {
      recentSendAttempts.delete(key)
    }
  }

  // If service URL is not configured, log warning and exit gracefully
  if (!serviceUrl) {
    console.warn(
      '[WhatsApp] WHATSAPP_SERVICE_URL not configured. WhatsApp notifications are disabled.'
    )
    return
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (internalSecret) {
      headers['X-Internal-Secret'] = internalSecret
    }

    if (idempotencyKey) {
      headers['X-Idempotency-Key'] = idempotencyKey
      console.log(`[WhatsApp] Sending message (key: ${idempotencyKey})`)
    }

    const controller = new AbortController()
    timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const response = await fetch(`${serviceUrl}/send`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ phone: normalizedPhone, message }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMsg =
        typeof errorData === 'object' && errorData !== null && 'error' in errorData
          ? (errorData as { error: string }).error
          : `HTTP ${response.status}`

      if (idempotencyKey) {
        console.error(`[WhatsApp] Failed to send (key: ${idempotencyKey}): ${errorMsg}`)
      } else {
        console.error(
          `[WhatsApp] Failed to send message: ${errorMsg}. This will not affect the primary operation.`
        )
      }
      return
    }

    if (idempotencyKey) {
      console.log(`[WhatsApp] Message sent successfully (key: ${idempotencyKey})`)
    } else {
      console.log(`[WhatsApp] Message sent successfully`)
    }
  } catch (error) {
    const errorMsg =
      error instanceof Error
        ? error.name === 'AbortError'
          ? 'Request timeout (10s)'
          : error.message
        : String(error)
    if (idempotencyKey) {
      console.error(`[WhatsApp] Failed to send (key: ${idempotencyKey}): ${errorMsg}`)
    } else {
      console.error(
        `[WhatsApp] Network error contacting microservice: ${errorMsg}. This will not affect the primary operation.`
      )
    }
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

export { sendWhatsAppMessage }
