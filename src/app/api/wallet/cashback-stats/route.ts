/**
 * CASHBACK STATISTICS API
 * 
 * GET /api/wallet/cashback-stats - Get customer cashback statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { getCashbackStats, getCashbackHistory } from '@/lib/cashback/cashbackService'

export async function GET(request: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 400 }
      )
    }
    
    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get('customerId')
    
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }
    
    // Get statistics
    const stats = await getCashbackStats(customerId, tenantId)
    
    // Get recent cashback history
    const history = await getCashbackHistory(customerId, tenantId, 10)
    
    return NextResponse.json({
      stats: {
        totalEarned: {
          cents: stats.totalCashbackEarned,
          rupees: (stats.totalCashbackEarned / 100).toFixed(2),
          formatted: `₹${(stats.totalCashbackEarned / 100).toFixed(2)}`
        },
        totalOrders: stats.totalOrders,
        averagePercentage: stats.averageCashbackPct
      },
      recentCashback: history.map(item => ({
        orderId: item.order_id,
        orderNumber: item.orders?.[0]?.order_number || 'N/A',
        cashPaidCents: item.cash_paid_cents,
        walletUsedCents: item.wallet_used_cents,
        profitPct: item.profit_pct,
        cashbackPct: item.cashback_pct,
        cashbackEarned: {
          cents: item.cashback_amount_cents,
          rupees: (item.cashback_amount_cents / 100).toFixed(2),
          formatted: `₹${(item.cashback_amount_cents / 100).toFixed(2)}`
        },
        createdAt: item.created_at
      }))
    })
    
  } catch (error: any) {
    console.error('[GET /api/wallet/cashback-stats] Error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch cashback stats', message: error.message },
      { status: 500 }
    )
  }
}
