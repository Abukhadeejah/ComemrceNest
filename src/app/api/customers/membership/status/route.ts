import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { getAuthenticatedUserId } from '@/server/auth'

export async function GET() {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant context required' },
        { status: 400 }
      )
    }

    // Get authenticated user ID
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get customer ID
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single()

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Get membership status
    const { data: membership } = await supabaseAdmin
      .from('memberships')
      .select('*')
      .eq('customer_id', customer.id)
      .eq('tenant_id', tenantId)
      .order('valid_until', { ascending: false })
      .limit(1)
      .single()

    if (!membership) {
      // No membership found - should create one
      return NextResponse.json({
        membership: {
          id: null,
          membershipType: null,
          status: null,
          validUntil: null,
          isTrial: false,
          daysRemaining: 0,
          isActive: false,
          expiresSoon: false,
          needsUpgrade: true
        }
      })
    }

    const now = new Date()
    const validUntil = new Date(membership.valid_until)
    const daysRemaining = Math.max(0, Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    const isActive = membership.status === 'ACTIVE' && validUntil > now
    const expiresSoon = isActive && daysRemaining <= 30 // Show renewal option 30 days before expiry
    const needsUpgrade = !isActive || (membership.membership_type === 'FREE' && expiresSoon)

    return NextResponse.json({
      membership: {
        id: membership.id,
        membershipType: membership.membership_type,
        status: membership.status,
        validUntil: membership.valid_until,
        isTrial: membership.membership_type === 'FREE',
        daysRemaining,
        isActive,
        expiresSoon,
        needsUpgrade
      }
    })

  } catch (error) {
    console.error('Membership status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}