import { resolveTenantIdFromRequest } from '@/server/tenant'
import { assertTenantAdmin } from '@/server/auth'
import { supabaseAdmin } from '@/server/supabaseAdmin'

interface OrderItemWithProduct {
  product_id: string
  quantity: number
  price_cents: number
  products: { name: string } | null
}

export async function getAnalytics() {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      return { overview: { totalRevenue: 0, totalOrders: 0, paidOrders: 0, totalProducts: 0, publishedProducts: 0, conversionRate: '0.0%' }, salesData: [], topProducts: [] }
    }
    try {
      await assertTenantAdmin(tenantId)
    } catch {
      // Graceful empty analytics when not authenticated as tenant admin
      return { overview: { totalRevenue: 0, totalOrders: 0, paidOrders: 0, totalProducts: 0, publishedProducts: 0, conversionRate: '0.0%' }, salesData: [], topProducts: [] }
    }

    // Get overview statistics
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('total_cents, status, created_at')
      .eq('tenant_id', tenantId)

    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, status')
      .eq('tenant_id', tenantId)

    // Calculate overview metrics
    const totalRevenue = orders?.reduce((sum, order) => {
      return order.status === 'paid' ? sum + order.total_cents : sum
    }, 0) || 0

    const totalOrders = orders?.length || 0
    const paidOrders = orders?.filter(order => order.status === 'paid').length || 0
    const totalProducts = products?.length || 0
    const publishedProducts = products?.filter(product => product.status === 'published').length || 0

    // Generate real sales data for the last 7 days
    const salesData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      // Filter orders for this specific date
      const dayOrders = orders?.filter(order => {
        const orderDate = new Date(order.created_at).toISOString().split('T')[0]
        return orderDate === dateStr
      }) || []
      
      const dayRevenue = dayOrders.reduce((sum, order) => {
        return order.status === 'paid' ? sum + order.total_cents : sum
      }, 0)
      
      salesData.push({
        date: dateStr,
        revenue: dayRevenue,
        orders: dayOrders.length
      })
    }

    // Get real top products from order items
    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select(`
        product_id,
        quantity,
        price_cents,
        products(name)
      `)
      .eq('tenant_id', tenantId) as { data: OrderItemWithProduct[] | null }

    // Calculate product performance
    const productStats = new Map()
    orderItems?.forEach(item => {
      const productId = item.product_id
      const productName = item.products?.name || 'Unknown Product'
      const quantity = item.quantity || 0
      const revenue = (item.price_cents || 0) * quantity
      
      if (productStats.has(productId)) {
        const existing = productStats.get(productId)
        existing.sales += quantity
        existing.revenue += revenue
      } else {
        productStats.set(productId, {
          id: productId,
          name: productName,
          sales: quantity,
          revenue: revenue
        })
      }
    })

    // Convert to array and sort by revenue
    const topProducts = Array.from(productStats.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    return {
      overview: {
        totalRevenue,
        totalOrders,
        paidOrders,
        totalProducts,
        publishedProducts,
        conversionRate: totalOrders > 0 ? ((paidOrders / totalOrders) * 100).toFixed(1) : '0'
      },
      salesData,
      topProducts
    }
  } catch (error) {
    console.error('getAnalytics error:', error)
    // Return empty analytics instead of throwing to prevent page crashes
    return { overview: { totalRevenue: 0, totalOrders: 0, paidOrders: 0, totalProducts: 0, publishedProducts: 0, conversionRate: '0.0%' }, salesData: [], topProducts: [] }
  }
}
