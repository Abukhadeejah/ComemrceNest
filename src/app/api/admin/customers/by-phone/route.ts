import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { lookupCustomerById, lookupCustomerByPhone, searchCustomersByQuery } from '@/server/admin/offlineOrders'

export async function GET(request: NextRequest) {
  try {
    let tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      tenantId = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c'
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 })
    }

    const phone = request.nextUrl.searchParams.get('phone') || request.nextUrl.searchParams.get('q') || ''
    const query = request.nextUrl.searchParams.get('q') || ''

    if (!phone.trim() && !query.trim()) {
      return NextResponse.json({ error: 'phone or q query parameter is required' }, { status: 400 })
    }

    // If query contains non-digits, treat it as name/email search.
    const digitsOnly = (phone || '').replace(/\D/g, '')
    const shouldNameSearch = query.trim().length > 0 && digitsOnly.length < 10
    if (shouldNameSearch) {
      const matches = await searchCustomersByQuery(tenantId, query, 10)

      if (!matches || matches.length === 0) {
        return NextResponse.json({ success: true, found: false })
      }

      if (matches.length > 1) {
        return NextResponse.json(
          {
            error: 'multiple_customers',
            message: 'Multiple customers found for this query',
            customers: matches,
          },
          { status: 409 }
        )
      }

      const payload = await lookupCustomerById(tenantId, matches[0].id)
      return NextResponse.json({ success: true, found: true, ...payload })
    }

    const result = await lookupCustomerByPhone(tenantId, phone)

    if ('duplicatePhone' in result && result.duplicatePhone) {
      return NextResponse.json(
        {
          error: 'duplicate_phone',
          message: 'Multiple customers found for this phone number',
          customers: result.customers,
        },
        { status: 409 }
      )
    }

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to lookup customer',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    )
  }
}
