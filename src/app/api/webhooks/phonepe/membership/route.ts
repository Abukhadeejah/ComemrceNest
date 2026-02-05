import { NextRequest, NextResponse } from 'next/server'
import { verifyPhonePeWebhook } from '@/lib/payments/phonepe'
import { updateMembershipPaymentStatus } from '@/lib/membership/membershipService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headers = Object.fromEntries(request.headers.entries())

    console.log('[PhonePe Membership Webhook] Received callback:', {
      body: body.substring(0, 200),
      headers: {
        'x-verify': headers['x-verify'],
        'content-type': headers['content-type']
      }
    })

    // Parse the webhook body
    const webhookData = JSON.parse(body)
    
    // Verify PhonePe callback using the webhook data structure
    const verification = await verifyPhonePeWebhook(webhookData)
    
    const callbackData = verification
    const merchantTransactionId = callbackData.merchantTransactionId
    const paymentStatus = callbackData.code === 'PAYMENT_SUCCESS' ? 'SUCCESS' : 'FAILED'

    console.log('[PhonePe Membership Webhook] Processing payment:', {
      merchantTransactionId,
      paymentStatus,
      code: callbackData.code
    })

    // Update membership payment status
    await updateMembershipPaymentStatus(
      merchantTransactionId,
      paymentStatus,
      callbackData
    )

    console.log(`[PhonePe Membership Webhook] Successfully processed ${paymentStatus} for ${merchantTransactionId}`)

    return NextResponse.json({ 
      success: true,
      message: 'Membership payment processed successfully'
    })

  } catch (error) {
    console.error('[PhonePe Membership Webhook] Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}