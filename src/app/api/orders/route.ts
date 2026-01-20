/**
 * ORDER CREATION API WITH CASHBACK INTEGRATION
 * 
 * POST /api/orders
 * 
 * Creates an order with:
 * - Wallet payment support
 * - Automatic cashback calculation and crediting
 * - Membership validation
 * - Payment provider integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { 
  processCashbackForOrder, 
  getWalletBalance, 
  debitWalletForOrder,
  getWalletAccountId 
} from '@/lib/cashback/cashbackService'
import { validatePaymentSplit, rupeesToCents } from '@/lib/cashback/cashbackEngine'

interface OrderItem {
  productId: string
  quantity: number
  variantId?: string
}

interface CreateOrderRequest {
  customerId: string
  items: OrderItem[]
  walletUsedRupees: number  // Amount to use from wallet (in rupees)
  shippingAddress?: {
    line1: string
    line2?: string
    city: string
    state: string
    pincode: string
  }
  billingAddress?: {
    line1: string
    line2?: string
    city: string
    state: string
    pincode: string
  }
}

interface OrderItemWithPrice extends OrderItem {
  unitPriceCents: number
  unitCostCents: number
  productName: string
}

/**
 * Fetch product details and calculate order totals
 */
async function calculateOrderTotals(
  tenantId: string,
  items: OrderItem[]
): Promise<{
  items: OrderItemWithPrice[]
  totalSalePriceCents: number
  totalPurchasePriceCents: number
}> {
  const productIds = items.map(item => item.productId)
  
  const { data: products, error } = await supabaseAdmin
    .from('products')
    .select('id, name, price_cents, cost_price_cents')
    .eq('tenant_id', tenantId)
    .in('id', productIds)
  
  if (error || !products) {
    throw new Error(`Failed to fetch products: ${error?.message}`)
  }
  
  let totalSalePriceCents = 0
  let totalPurchasePriceCents = 0
  
  const itemsWithPrice: OrderItemWithPrice[] = items.map(item => {
    const product = products.find(p => p.id === item.productId)
    
    if (!product) {
      throw new Error(`Product not found: ${item.productId}`)
    }
    
    const unitPriceCents = product.price_cents || 0
    const unitCostCents = product.cost_price_cents || 0
    
    if (unitCostCents === 0) {
      throw new Error(`Product ${product.name} has no cost price set. Cannot calculate cashback.`)
    }
    
    const lineTotal = unitPriceCents * item.quantity
    const lineCost = unitCostCents * item.quantity
    
    totalSalePriceCents += lineTotal
    totalPurchasePriceCents += lineCost
    
    return {
      ...item,
      unitPriceCents,
      unitCostCents,
      productName: product.name
    }
  })
  
  return {
    items: itemsWithPrice,
    totalSalePriceCents,
    totalPurchasePriceCents
  }
}

/**
 * Generate unique order number
 */
function generateOrderNumber(tenantId: string): string {
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  const tenantPrefix = tenantId.slice(0, 4).toUpperCase()
  
  return `ORD-${tenantPrefix}-${timestamp}-${random}`
}

/**
 * POST /api/orders - Create order with wallet payment and cashback
 */
export async function POST(request: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 400 }
      )
    }
    
    const body = await request.json() as CreateOrderRequest
    
    // Validate request
    if (!body.customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }
    
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      )
    }
    
    // 1. Calculate order totals
    const { items, totalSalePriceCents, totalPurchasePriceCents } = 
      await calculateOrderTotals(tenantId, body.items)
    
    // 2. Get customer wallet balance
    const walletBalanceCents = await getWalletBalance(body.customerId, tenantId)
    const walletUsedCents = rupeesToCents(body.walletUsedRupees || 0)
    const cashPaidCents = totalSalePriceCents - walletUsedCents
    
    // 3. Validate payment split
    const validation = validatePaymentSplit(
      totalSalePriceCents / 100,  // Convert to rupees for validation
      walletBalanceCents / 100,
      walletUsedCents / 100,
      cashPaidCents / 100
    )
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }
    
    // 4. Generate order number
    const orderNumber = generateOrderNumber(tenantId)
    
    // 5. Create order in database
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        tenant_id: tenantId,
        order_number: orderNumber,
        email: '', // TODO: Get from customer record
        total_cents: totalSalePriceCents,
        total_purchase_price_cents: totalPurchasePriceCents,
        wallet_used_cents: walletUsedCents,
        cash_paid_cents: cashPaidCents,
        status: 'pending',
        currency: 'INR',
        payment_provider: walletUsedCents === totalSalePriceCents ? 'wallet' : 'cash',
        payment_env: 'live'
      })
      .select()
      .single()
    
    if (orderError || !order) {
      throw new Error(`Failed to create order: ${orderError?.message}`)
    }
    
    // 6. Insert order items
    const orderItemsPayload = items.map(item => ({
      tenant_id: tenantId,
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price_cents: item.unitPriceCents,
      subtotal_cents: item.unitPriceCents * item.quantity
    }))
    
    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItemsPayload)
    
    if (itemsError) {
      // Rollback order if items insert fails
      await supabaseAdmin.from('orders').delete().eq('id', order.id)
      throw new Error(`Failed to create order items: ${itemsError.message}`)
    }
    
    // 7. Debit wallet if wallet was used
    if (walletUsedCents > 0) {
      const walletAccountId = await getWalletAccountId(body.customerId, tenantId)
      await debitWalletForOrder(
        walletAccountId,
        tenantId,
        order.id,
        walletUsedCents
      )
    }
    
    // 8. Process cashback (will credit to wallet if eligible)
    const cashbackResult = await processCashbackForOrder({
      tenantId,
      orderId: order.id,
      customerId: body.customerId,
      totalSalePriceCents,
      totalPurchasePriceCents,
      walletUsedCents,
      cashPaidCents
    })
    
    // 9. Update order with cashback details
    await supabaseAdmin
      .from('orders')
      .update({
        total_profit_pct: cashbackResult.profitPct,
        cashback_pct: cashbackResult.cashbackPct,
        cashback_amount_cents: cashbackResult.cashbackEarned,
        membership_id: cashbackResult.membershipUsed
      })
      .eq('id', order.id)
    
    // 10. Return order details
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        totalCents: totalSalePriceCents,
        walletUsedCents,
        cashPaidCents,
        status: order.status,
        cashback: {
          earned: cashbackResult.cashbackEarned,
          percentage: cashbackResult.cashbackPct,
          profitPercentage: cashbackResult.profitPct,
          membershipUsed: cashbackResult.membershipUsed !== null
        }
      }
    })
    
  } catch (error: any) {
    console.error('[POST /api/orders] Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to create order',
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/orders?orderId=xxx - Get order details with cashback info
 */
export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId parameter is required' },
        { status: 400 }
      )
    }
    
    const tenantId = await resolveTenantIdFromRequest()
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 400 }
      )
    }
    
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          quantity,
          unit_price_cents,
          subtotal_cents,
          products (
            id,
            name,
            hero_image_url
          )
        ),
        cashback_transactions (
          id,
          cashback_amount_cents,
          cashback_pct,
          profit_pct,
          wallet_used_cents,
          cash_paid_cents
        )
      `)
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .single()
    
    if (error || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ order })
    
  } catch (error: any) {
    console.error('[GET /api/orders/:orderId] Error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch order', message: error.message },
      { status: 500 }
    )
  }
}
