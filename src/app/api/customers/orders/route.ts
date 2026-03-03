import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { getAuthenticatedUserId } from '@/server/auth'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

type OrderItemRow = {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price_cents: number | null
  subtotal_cents: number | null
}

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set() {},
          remove() {},
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    const userEmail = user?.email || null

    console.log('[Orders API] Request from user:', userId, 'tenant:', tenantId)

    // Resolve customer by authenticated user linkage
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id, email')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .maybeSingle()

    if (customerError) {
      console.error('[GET /api/customers/orders] Customer lookup failed:', customerError)
      return NextResponse.json({ error: 'Failed to resolve customer' }, { status: 500 })
    }

    const matchedCustomerId = customer?.id || null
    const matchedEmail = customer?.email || userEmail

    if (!matchedCustomerId && !matchedEmail) {
      console.warn('[Orders API] No customer/email mapping found, returning empty orders', { userId, tenantId })
      return NextResponse.json({ success: true, orders: [] })
    }

    // Fetch orders with basic schema (avoiding missing columns)
    let ordersQuery = supabaseAdmin
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
      .eq('tenant_id', tenantId)

    if (matchedCustomerId && matchedEmail) {
      ordersQuery = ordersQuery.or(`customer_id.eq.${matchedCustomerId},email.eq.${matchedEmail}`)
    } else if (matchedCustomerId) {
      ordersQuery = ordersQuery.eq('customer_id', matchedCustomerId)
    } else if (matchedEmail) {
      ordersQuery = ordersQuery.eq('email', matchedEmail)
    }

    const { data: orders, error } = await ordersQuery.order('created_at', { ascending: false })

    if (error) {
      console.error('[GET /api/customers/orders] Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    console.log(`[Orders API] Found ${orders?.length || 0} orders`)

    // Get order items separately
    const orderIds = orders?.map(order => order.id) || []
    let orderItems: OrderItemRow[] = []
    
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