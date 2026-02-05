import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { getAuthenticatedUserId } from '@/server/auth'

export async function GET(request: NextRequest) {
  try {
    const customerId = await getAuthenticatedUserId()
    
    if (!customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = request.headers.get('x-tenant-id') || 'senlysh'

    console.log('[Orders API] Request from:', customerId, 'tenant:', tenantId)

    // First, ensure customer exists and is linked properly
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id, email')
      .eq('id', customerId)
      .single()

    if (customerError || !customer) {
      console.error('[GET /api/customers/orders] Customer not found:', customerError)
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    console.log('[Orders API] Customer found:', customer.email)

    // Fetch orders with basic schema (avoiding missing columns)
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        total_cents,
        payment_provider,
        created_at,
        email,
        currency,
        customer_id
      `)
      .or(`customer_id.eq.${customerId},email.eq.${customer.email}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET /api/customers/orders] Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    console.log(`[Orders API] Found ${orders?.length || 0} orders`)

    // Get order items separately
    const orderIds = orders?.map(order => order.id) || []
    let orderItems: any[] = []
    
    if (orderIds.length > 0) {
      const { data: items } = await supabaseAdmin
        .from('order_items')
        .select(`
          id,
          order_id,
          product_id,
          quantity,
          unit_price_cents,
          subtotal_cents
        `)
        .in('order_id', orderIds)
      
      orderItems = items || []
    }

    // Transform the data with safe defaults
    const transformedOrders = orders?.map(order => ({
      ...order,
      total_amount: order.total_cents / 100,
      wallet_used: 0, // Default since column might not exist
      cash_paid: order.total_cents / 100, // Assume full cash payment
      cashback_amount: 0, // Default since column might not exist
      discount_amount: 0, // Default since column might not exist
      items: orderItems
        .filter(item => item.order_id === order.id)
        .map(item => ({
          ...item,
          unit_price: (item.unit_price_cents || 0) / 100,
          total_price: (item.subtotal_cents || 0) / 100,
          product: {
            id: item.product_id,
            name: 'Product',
            slug: '',
            images: [],
            variant: {
              id: item.product_id,
              sku: '',
              size: '',
              color: ''
            }
          }
        }))
    })) || []

    console.log('[Orders API] Returning orders:', transformedOrders.length)

    return NextResponse.json({
      success: true,
      orders: transformedOrders
    })

  } catch (error) {
    console.error('[GET /api/customers/orders] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}