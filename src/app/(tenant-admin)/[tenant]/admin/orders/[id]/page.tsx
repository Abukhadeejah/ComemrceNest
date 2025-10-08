import { supabaseAdmin } from '@/server/supabaseAdmin'
import { resolveTenantIdFromRequest } from '@/server/tenant'

export default async function OrderDetail({ params }: { params: { id: string } }) {
  const { id } = params
  const tenantId = await resolveTenantIdFromRequest()
  
  if (!tenantId) {
    return <div className="p-6">Tenant not found</div>
  }
  
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .maybeSingle()

  if (!order) return <div className="p-6">Order not found</div>

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Order {order.order_number}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <div>Status: {order.status}</div>
          <div>Total: ₹{(order.total_cents / 100).toFixed(2)}</div>
          <div>Provider: {order.payment_provider}</div>
        </div>
      </div>
    </div>
  )
}


