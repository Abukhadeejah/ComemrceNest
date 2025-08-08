import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'

export default async function OrderStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return <main className="p-6">Unknown tenant</main>
  const { id: orderId } = await params
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('order_number, status, total_cents, currency, created_at')
    .eq('tenant_id', tenantId)
    .eq('razorpay_order_id', orderId)
    .maybeSingle()
  if (!order) return <main className="p-6">Order not found</main>
  return (
    <main className="mx-auto max-w-lg p-6 space-y-3">
      <h1 className="text-xl font-semibold">Order status</h1>
      <div className="rounded border p-4 text-sm">
        <div>Order: <code>{order.order_number}</code></div>
        <div>Status: <span className="font-medium">{order.status}</span></div>
        <div>Total: {order.currency} {(order.total_cents/100).toFixed(2)}</div>
        <div>Placed: {new Date(order.created_at).toLocaleString()}</div>
      </div>
    </main>
  )
}


