import { supabaseAdmin } from '@/server/supabaseAdmin'
import { resolveTenantIdFromRequest } from '@/server/tenant'

export default async function OrderStatus({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const tenantId = await resolveTenantIdFromRequest()

  if (!tenantId) {
    return <div className="p-6">Tenant not found</div>
  }

  // Look up by Razorpay order id first, then by internal id
  const { data: byRzp } = await supabaseAdmin
    .from('orders')
    .select('id, status, total_cents, currency, order_number')
    .eq('tenant_id', tenantId)
    .eq('razorpay_order_id', orderId)
    .maybeSingle()

  const order = byRzp
  if (!order) {
    return <div className="p-6">Order not found</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Order Status</h1>
      <div className="rounded border p-4 bg-white">
        <div>Order: {order.order_number}</div>
        <div>Status: {order.status}</div>
        <div>Total: ₹{(order.total_cents / 100).toFixed(2)}</div>
      </div>
    </div>
  )
}


