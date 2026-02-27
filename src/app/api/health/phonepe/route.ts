import { NextResponse } from 'next/server'

function toMode(rawEnv: string): 'PRODUCTION' | 'SANDBOX' {
  const normalized = rawEnv.trim().toUpperCase()
  return ['PRODUCTION', 'PROD', 'LIVE'].includes(normalized) ? 'PRODUCTION' : 'SANDBOX'
}

function maskValue(value?: string) {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.length <= 8) return `${trimmed.slice(0, 2)}***`
  return `${trimmed.slice(0, 4)}***${trimmed.slice(-2)}`
}

export async function GET(request: Request) {
  const rawEnv = process.env.PHONEPE_ENV || ''
  const mode = toMode(rawEnv)

  const merchantId = process.env.PHONEPE_MERCHANT_ID?.trim() || ''
  const clientId = process.env.PHONEPE_CLIENT_ID?.trim() || ''
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET?.trim() || ''
  const clientVersion = process.env.PHONEPE_CLIENT_VERSION?.trim() || '1'
  const saltKey = process.env.PHONEPE_SALT_KEY?.trim() || ''
  const saltIndex = process.env.PHONEPE_SALT_INDEX?.trim() || '1'

  const forwardedProto = request.headers.get('x-forwarded-proto')
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const requestBaseUrl = forwardedProto && forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : new URL(request.url).origin

  const configuredBaseUrl = (
    process.env.PHONEPE_REDIRECT_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    ''
  ).trim().replace(/\/+$/, '')

  const effectiveRedirectBaseUrl = configuredBaseUrl || requestBaseUrl
  const missingRequired: string[] = []

  if (!merchantId) missingRequired.push('PHONEPE_MERCHANT_ID')
  if (!clientId) missingRequired.push('PHONEPE_CLIENT_ID')
  if (!clientSecret) missingRequired.push('PHONEPE_CLIENT_SECRET')

  const warnings: string[] = []
  if (mode === 'PRODUCTION' && effectiveRedirectBaseUrl.startsWith('http://')) {
    warnings.push('Production redirect URL should use HTTPS')
  }

  return NextResponse.json({
    ok: missingRequired.length === 0,
    phonepe: {
      mode,
      rawEnv,
      hasMerchantId: Boolean(merchantId),
      hasClientId: Boolean(clientId),
      hasClientSecret: Boolean(clientSecret),
      hasSaltKey: Boolean(saltKey),
      clientVersion,
      saltIndex,
      merchantIdMasked: maskValue(merchantId),
      clientIdMasked: maskValue(clientId),
      redirectBaseUrl: effectiveRedirectBaseUrl,
    },
    missingRequired,
    warnings,
  })
}
