import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'

function looksLikeUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export async function GET(request: NextRequest) {
  try {
    let tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      tenantId = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c'
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 })
    }

    const orderQuery = (request.nextUrl.searchParams.get('order') || '').trim()
    if (!orderQuery) {
      return NextResponse.json({ error: 'order query parameter is required' }, { status: 400 })
    }

    const baseSelect = `
      id,
      order_number,
      order_source,
      status,
      currency,
      created_at,
      order_items (
        id,
        product_id,
        variant_id,
        variant_name,
        quantity,
        unit_price_cents,
        products (
          id,
          name,
          sku,
          track_inventory,
          has_variants
        ),
        product_variants (
          id,
          name,
          sku,
          stock,
          track_inventory
        )
      )
    `

    const scoped = looksLikeUuid(orderQuery)
      ? await supabaseAdmin
          .from('orders')
          .select(baseSelect)
          .eq('tenant_id', tenantId)
          .eq('id', orderQuery)
          .maybeSingle()
      : await supabaseAdmin
          .from('orders')
          .select(baseSelect)
          .eq('tenant_id', tenantId)
          .eq('order_number', orderQuery)
          .maybeSingle()

    if (scoped.error) {
      return NextResponse.json({ error: 'Order lookup failed', message: scoped.error.message }, { status: 500 })
    }

    if (!scoped.data) {
      return NextResponse.json({ error: 'Order not found in tenant scope' }, { status: 404 })
    }

    const orderItemIds = (scoped.data.order_items || []).map((item: any) => item.id)
    const returnedQtyByOrderItem = new Map<string, number>()

    if (orderItemIds.length > 0) {
      const { data: processedReturns, error: processedReturnsError } = await supabaseAdmin
        .from('order_returns')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('order_id', scoped.data.id)
        .eq('status', 'processed')

      if (processedReturnsError) {
        return NextResponse.json({ error: 'Order lookup failed', message: processedReturnsError.message }, { status: 500 })
      }

      const processedReturnIds = (processedReturns || []).map((row) => row.id)
      if (processedReturnIds.length > 0) {
        const { data: returnItems, error: returnItemsError } = await supabaseAdmin
          .from('order_return_items')
          .select('order_item_id, returned_quantity')
          .eq('tenant_id', tenantId)
          .in('order_return_id', processedReturnIds)
          .in('order_item_id', orderItemIds)

        if (returnItemsError) {
          return NextResponse.json({ error: 'Order lookup failed', message: returnItemsError.message }, { status: 500 })
        }

        for (const row of returnItems || []) {
          const prev = returnedQtyByOrderItem.get(row.order_item_id) || 0
          returnedQtyByOrderItem.set(row.order_item_id, prev + Math.max(0, row.returned_quantity || 0))
        }
      }
    }

    const orderWithRemaining = {
      ...scoped.data,
      order_items: (scoped.data.order_items || []).map((item: any) => {
        const soldQty = Math.max(0, item.quantity || 0)
        const alreadyReturnedQty = Math.min(soldQty, returnedQtyByOrderItem.get(item.id) || 0)
        return {
          ...item,
          already_returned_quantity: alreadyReturnedQty,
          remaining_returnable_quantity: Math.max(0, soldQty - alreadyReturnedQty),
        }
      }),
    }

    return NextResponse.json({ success: true, order: orderWithRemaining })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to lookup order',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
