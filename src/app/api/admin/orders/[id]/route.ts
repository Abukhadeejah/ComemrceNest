import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { assertTenantAdmin } from '@/server/auth'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { revalidateTag } from 'next/cache'
import { tenantProductsTag, tenantOrdersTag } from '@/server/cacheTags'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    let tenantId = await resolveTenantIdFromRequest()

    if (!tenantId) {
      tenantId = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c'
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 })
    }

    console.log('[Admin Order Detail] Fetching order:', id, 'tenant:', tenantId)

    // Fetch order with order_items and product details
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id, order_number, email, total_cents, currency, status, created_at,
        cashback_amount_cents, cashback_pct, customer_id, payment_provider,
        payment_env, wallet_used_cents, cash_paid_cents, discount_amount_cents,
        coupon_code,
        order_items (
          id, product_id, quantity, unit_price_cents, subtotal_cents,
          products (
            id, name, sku, hero_image_url
          )
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('[Admin Order Detail] Supabase error:', error)
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 })
    }

    if (!order) {
      console.log('[Admin Order Detail] Order not found, trying without tenant filter...')
      // Fallback: try without tenant filter in case of tenant mismatch
      const { data: orderAny, error: error2 } = await supabaseAdmin
        .from('orders')
        .select(`
          id, order_number, email, total_cents, currency, status, created_at,
          tenant_id, cashback_amount_cents, cashback_pct, customer_id, payment_provider,
          payment_env, wallet_used_cents, cash_paid_cents, discount_amount_cents,
          coupon_code,
          order_items (
            id, product_id, quantity, unit_price_cents, subtotal_cents,
            products (
              id, name, sku, hero_image_url
            )
          )
        `)
        .eq('id', id)
        .maybeSingle()

      if (error2 || !orderAny) {
        console.error('[Admin Order Detail] Order truly not found:', error2)
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      console.log('[Admin Order Detail] Found order with tenant:', orderAny.tenant_id)
      return NextResponse.json({ success: true, order: orderAny })
    }

    console.log('[Admin Order Detail] Found order:', order.id, 'items:', order.order_items?.length)
    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Admin order detail API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    let tenantId = await resolveTenantIdFromRequest()

    // TEMPORARY FIX: If no tenant resolved, default to Senlysh for admin access
    if (!tenantId) {
      console.log('[Admin Orders Delete API] No tenant resolved, defaulting to Senlysh')
      tenantId = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c' // Senlysh tenant ID
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found', code: 'TENANT_NOT_FOUND' },
        { status: 400 }
      )
    }

    // TEMPORARY: Skip admin authentication for debugging
    // TODO: Re-enable this after setting up proper admin login
    // await assertTenantAdmin(tenantId)

    // Validate order ID format
    if (!id || typeof id !== 'string' || id.length !== 36) {
      return NextResponse.json(
        { error: 'Invalid order ID format', code: 'INVALID_ORDER_ID' },
        { status: 400 }
      )
    }

    // Use optimized database function for deletion
    const { data, error } = await supabaseAdmin
      .rpc('delete_order_safely', {
        order_id_param: id,
        tenant_id_param: tenantId
      })

    if (error) {
      console.error('Order deletion error:', error)

      // Handle specific error cases
      if (error.message.includes('Order not found')) {
        return NextResponse.json(
          { error: 'Order not found or access denied', code: 'ORDER_NOT_FOUND' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to delete order', code: 'DELETE_FAILED', details: error.message },
        { status: 500 }
      )
    }

    // Invalidate relevant caches
    revalidateTag(tenantOrdersTag(tenantId), 'default')
    revalidateTag(tenantProductsTag(tenantId), 'default')

    console.log(`Order ${id} deleted successfully for tenant ${tenantId}`)

    return NextResponse.json({
      success: true,
      deletedOrderId: data?.[0]?.deleted_order_id,
      deletedItemsCount: data?.[0]?.deleted_items_count || 0,
      message: 'Order deleted successfully'
    })

  } catch (error) {
    console.error('Unexpected error during order deletion:', error)

    return NextResponse.json(
      {
        error: 'Internal server error during order deletion',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? (error as Error)?.message : undefined
      },
      { status: 500 }
    )
  }
}


