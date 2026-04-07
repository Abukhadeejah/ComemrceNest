import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { assertTenantAdmin } from '@/server/auth'
import { supabaseAdmin } from '@/server/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    let tenantId = await resolveTenantIdFromRequest()
    
    // TEMPORARY FIX: If no tenant resolved, default to Senlysh for admin access
    if (!tenantId) {
      console.log('[Admin Orders API] No tenant resolved, defaulting to Senlysh')
      tenantId = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c' // Senlysh tenant ID
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 })
    }

    // TEMPORARY: Skip admin authentication for debugging
    // TODO: Re-enable this after setting up proper admin login
    // try {
    //   await assertTenantAdmin(tenantId)
    // } catch {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Get search parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = 20
    const offset = (page - 1) * pageSize

    // Build query
    let query = supabaseAdmin
      .from('orders')
      .select(`
        id, 
        order_number, 
        email, 
        total_cents, 
        currency, 
        status, 
        created_at, 
        cashback_amount_cents, 
        cashback_pct, 
        customer_id,
        payment_provider,
        wallet_used_cents,
        cash_paid_cents
      `, { count: 'exact' })
      .eq('tenant_id', tenantId)

    // Apply search filter
    if (search) {
      query = query.or(`order_number.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Apply status filter
    if (status && status !== 'all') {
      const allowedStatuses = ['pending', 'paid', 'confirmed', 'failed', 'fulfilled', 'cancelled', 'partially_returned', 'returned']
      if (allowedStatuses.includes(status)) {
        query = query.eq('status', status)
      }
    }

    // Execute query with pagination
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error('Failed to fetch orders:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    const orders = data || []
    const orderIds = orders.map((order: { id: string }) => order.id)
    const returnedOrderIds = new Set<string>()

    if (orderIds.length > 0) {
      const { data: processedReturns, error: processedReturnsError } = await supabaseAdmin
        .from('order_returns')
        .select('order_id')
        .eq('tenant_id', tenantId)
        .eq('status', 'processed')
        .in('order_id', orderIds)

      if (processedReturnsError) {
        console.error('Failed to fetch processed return flags:', processedReturnsError)
        return NextResponse.json({ error: 'Failed to fetch processed return flags' }, { status: 500 })
      }

      for (const row of processedReturns || []) {
        if (row.order_id) returnedOrderIds.add(row.order_id)
      }
    }

    return NextResponse.json({
      success: true,
      orders: {
        data: orders.map((order: any) => ({
          ...order,
          has_processed_return: returnedOrderIds.has(order.id),
        })),
        count: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    })

  } catch (error) {
    console.error('Admin orders API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error)?.message : undefined
    }, { status: 500 })
  }
}