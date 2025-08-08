import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'

export default async function AdminOrders() {
  const tenantId = await resolveTenantIdFromRequest()
  const { data: orders } = tenantId
    ? await supabaseAdmin
        .from('orders')
        .select('id, order_number, status, total_cents, currency, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
    : { data: [] as any[] }
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Orders</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="p-2">Order</th>
            <th className="p-2">Status</th>
            <th className="p-2">Total</th>
            <th className="p-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {(orders ?? []).map((o) => (
            <tr key={o.id} className="border-t">
              <td className="p-2 font-mono">{o.order_number}</td>
              <td className="p-2">{o.status}</td>
              <td className="p-2">{o.currency} {(o.total_cents/100).toFixed(2)}</td>
              <td className="p-2">{new Date(o.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}


