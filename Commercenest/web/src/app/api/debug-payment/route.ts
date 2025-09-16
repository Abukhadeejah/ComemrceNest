import { NextResponse } from 'next/server'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { resolveRazorpayCredentials } from '@/server/payments'

export async function GET() {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      return NextResponse.json({ error: 'tenant_not_found' }, { status: 400 })
    }

    const creds = await resolveRazorpayCredentials(tenantId)
    
    return NextResponse.json({
      tenantId,
      hasCredentials: !!creds,
      credentialsSource: creds?.source || null,
      environment: creds?.env || null,
      keyIdPresent: !!creds?.keyId,
      keySecretPresent: !!creds?.keySecret,
      platformEnvVarsPresent: {
        keyId: !!process.env.RAZORPAY_KEY_ID,
        keySecret: !!process.env.RAZORPAY_KEY_SECRET
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'debug_failed', 
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error 
    }, { status: 500 })
  }
}
