import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/server/auth'
import { createMembershipPayment } from '@/lib/membership/membershipService'
import { createPhonePePayment } from '@/lib/payments/phonepe'
import { supabaseAdmin } from '@/server/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = request.headers.get('x-tenant-id')
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 })
    }

    const { durationMonths } = await request.json()

    if (!durationMonths || ![1, 3, 6, 12].includes(durationMonths)) {
      return NextResponse.json({ error: 'Invalid duration' }, { status: 400 })
    }

    // Get customer details
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('email, phone')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single()

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const customerEmail = customer.email
    const customerPhone = customer.phone

    // Create membership payment record
    const { paymentId, paymentReference, amountCents } = await createMembershipPayment(
      tenantId,
      userId,
      durationMonths,
      'phonepe'
    )

    // Initiate PhonePe payment
    const paymentResult = await createPhonePePayment(
      tenantId,
      paymentReference,
      amountCents,
      customerEmail,
      customerPhone || ''
    )

    if (!paymentResult.redirectUrl) {
      return NextResponse.json({ 
        error: 'Failed to initiate payment' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      paymentId,
      paymentReference,
      paymentUrl: paymentResult.redirectUrl
    })

  } catch (error) {
    console.error('[POST /api/customers/membership/purchase] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}