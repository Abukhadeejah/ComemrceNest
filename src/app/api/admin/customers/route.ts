import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { createInlineCustomer } from '@/server/admin/offlineOrders'

interface CreateAdminCustomerRequest {
  phone?: string
  email?: string
  firstName?: string
  lastName?: string
}

export async function POST(request: NextRequest) {
  try {
    let tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      tenantId = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c'
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 })
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
