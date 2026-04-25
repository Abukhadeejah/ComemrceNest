import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { assertTenantAdminApi, TenantAdminAuthError } from '@/server/auth'
import { createInlineCustomer } from '@/server/admin/offlineOrders'

interface CreateAdminCustomerRequest {
  phone?: string
  email?: string
  firstName?: string
  lastName?: string
  createOnlineAccess?: boolean
  password?: string
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // GUARDRAIL: Verify admin access before creating customers (using API-safe helper)
    // This returns errors instead of redirecting, appropriate for API routes
    try {
      await assertTenantAdminApi(tenantId)
    } catch (authError) {
      if (authError instanceof TenantAdminAuthError) {
        return NextResponse.json(
          { error: authError.message },
          { status: authError.status }
        )
      }
      throw authError
    }

    const body = (await request.json()) as CreateAdminCustomerRequest
    const customer = await createInlineCustomer(tenantId, body)

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        phone: customer.phone,
        first_name: customer.first_name,
        last_name: customer.last_name,
        has_online_access: !!customer.user_id,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to create customer',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    )
  }
}
