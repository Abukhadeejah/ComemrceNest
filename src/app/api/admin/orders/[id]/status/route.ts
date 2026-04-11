import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { revalidateTag } from 'next/cache'
import { tenantOrdersTag } from '@/server/cacheTags'
import { processOfflineCancellationWalletRefund } from '@/server/admin/offlineOrderCancellation'

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    let tenantId = await resolveTenantIdFromRequest()

    // TEMPORARY FIX: If no tenant resolved, default to Senlysh for admin access
    if (!tenantId) {
      console.log('[Admin Orders Status API] No tenant resolved, defaulting to Senlysh')
      tenantId = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c' // Senlysh tenant ID
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 })
    }

    // Parse request body
    const body = await request.json()
    const { status } = body

    // Validate status
    const allowedStatuses = ['pending', 'paid', 'confirmed', 'fulfilled', 'partially_returned', 'returned', 'cancelled', 'failed']
    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Allowed values: ' + allowedStatuses.join(', ') 
      }, { status: 400 })
    }

    // Validate order ID format
    if (!id || typeof id !== 'string' || id.length !== 36) {
      return NextResponse.json({ error: 'Invalid order ID format' }, { status: 400 })
    }

    console.log(`[Admin Orders Status API] Updating order ${id} to status ${status} for tenant ${tenantId}`)

    const { data: currentOrder, error: currentOrderError } = await supabaseAdmin
      .from('orders')
      .select('status, order_source')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (currentOrderError) {
      return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 })
    }

    if (status === 'cancelled' && currentOrder?.status === 'cancelled') {
      return NextResponse.json({
        success: true,
        order: { id, status: 'cancelled' },
        message: 'Order already cancelled. No additional refund applied.',
      })
    }

    // Update order status
    let updateQuery = supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (status === 'cancelled') {
      updateQuery = updateQuery.neq('status', 'cancelled')
    }

    const { data, error } = await updateQuery
      .select('id, order_number, status')
      .single()

    if (error) {
      console.error('Order status update error:', error)
      
      if (error.code === 'PGRST116') {
        if (status === 'cancelled') {
          return NextResponse.json({
            success: true,
            order: { id, status: 'cancelled' },
            message: 'Order already cancelled. No additional refund applied.',
          })
        }
        return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 })
      }

      return NextResponse.json({ 
        error: 'Failed to update order status', 
        details: error.message 
      }, { status: 500 })
    }

    if (
      status === 'cancelled' &&
      currentOrder?.status !== 'cancelled' &&
      currentOrder?.order_source === 'offline_admin'
    ) {
      console.log(`[Admin Orders Status API] Processing offline cancellation wallet refund for order ${id}`)
      const cancellationRefundResult = await processOfflineCancellationWalletRefund({
        tenantId,
        orderId: id,
        reason: 'Order cancelled via admin status update',
      })
      console.log('[Admin Orders Status API] Offline cancellation wallet refund result:', cancellationRefundResult)
    }

    // Invalidate cache
    revalidateTag(tenantOrdersTag(tenantId), 'default')

    console.log(`[Admin Orders Status API] Order ${data.order_number} status updated to ${status}`)

    return NextResponse.json({
      success: true,
      order: data,
      message: `Order status updated to ${status}`
    })

  } catch (error) {
    console.error('[Admin Orders Status API] Unexpected error:', error)

    return NextResponse.json({
      error: 'Internal server error during order status update',
      details: process.env.NODE_ENV === 'development' ? (error as Error)?.message : undefined
    }, { status: 500 })
  }
}

// Export a GET method as well to help with Next.js route recognition
export async function GET() {
  return NextResponse.json({ 
    error: 'Method not supported. Use PATCH to update order status.' 
  }, { status: 405 })
}