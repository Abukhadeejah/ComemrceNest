import { NextResponse } from 'next/server'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { revalidateTag } from 'next/cache'
import { tenantProductsTag } from '@/server/cacheTags'
import { processPaidOrderPostPaymentOnce } from '@/server/admin/offlineOrders'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let tenantId = await resolveTenantIdFromRequest()
  
  // TEMPORARY FIX: If no tenant resolved, default to Senlysh for admin access
  if (!tenantId) {
    console.log('[Admin Orders Mark-Paid API] No tenant resolved, defaulting to Senlysh')
    tenantId = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c' // Senlysh tenant ID
  }
  
  if (!tenantId) return NextResponse.json({ error: 'tenant_not_found' }, { status: 400 })
  
  try {
    // 1. Update order status to paid
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .update({ 
        status: 'paid'
      })
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // 2. Process post-payment side effects once
    if (order) {
      try {
        const processingResult = await processPaidOrderPostPaymentOnce(tenantId, order.id)
        console.log(`[Admin Orders Mark-Paid API] Post-payment result for order ${id}:`, processingResult)
      } catch (processingError) {
        console.error('[Admin Orders Mark-Paid API] Error processing post-payment side effects:', processingError)
        // Don't fail the whole operation if post-payment processing fails
      }
    }
    
    // Invalidate cache after successful update
    revalidateTag(tenantProductsTag(tenantId), 'default')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Order marked as paid and post-payment processing attempted' 
    })

  } catch (error) {
    console.error('Error marking order as paid:', error)
    return NextResponse.json({ 
      error: 'Failed to mark order as paid',
      details: process.env.NODE_ENV === 'development' ? (error as Error)?.message : undefined
    }, { status: 500 })
  }
}

