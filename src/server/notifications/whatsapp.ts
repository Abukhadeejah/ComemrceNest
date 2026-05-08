/**
 * WhatsApp Notification Client
 *
 * Thin wrapper around the standalone WhatsApp microservice.
 * Failure to send WhatsApp messages never propagates as an error
 * to the caller — this ensures WhatsApp outages do not break
 * primary business operations.
 */

async function sendWhatsAppMessage(
  phone: string,
  message: string,
  idempotencyKey?: string
): Promise<void> {
  if (!phone?.trim() || !message?.trim()) {
    console.warn('[WhatsApp] Invalid input: phone and message must be non-empty strings')
    return
  }

  const serviceUrl = process.env.WHATSAPP_SERVICE_URL

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

    if (idempotencyKey) {
      headers['X-Idempotency-Key'] = idempotencyKey
      console.log(`[WhatsApp] Sending message (key: ${idempotencyKey})`)
    }

    const controller = new AbortController()
    timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const response = await fetch(`${serviceUrl}/send`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ phone, message }),
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
