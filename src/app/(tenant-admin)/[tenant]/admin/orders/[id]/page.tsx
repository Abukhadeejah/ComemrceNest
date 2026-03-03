import { supabaseAdmin } from '@/server/supabaseAdmin'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import Image from 'next/image'
import Link from 'next/link'

export default async function OrderDetail({ params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params
  const tenantId = await resolveTenantIdFromRequest()
  
  if (!tenantId) {
    return <div className="p-6">Tenant not found</div>
  }
  
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        quantity,
        unit_price_cents,
        subtotal_cents,
        variant,
        products (
          id,
          name,
          slug,
          sku,
          hero_image_url
        )
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .maybeSingle()

  if (!order) return <div className="p-6">Order not found</div>

  const formatCurrency = (cents: number) => `₹${((cents || 0) / 100).toFixed(2)}`
  type AdminOrderItem = {
    id: string
    quantity: number
    unit_price_cents: number
    subtotal_cents: number
    variant?: string | null
    products?: {
      id?: string
      name?: string
      sku?: string | null
      hero_image_url?: string | null
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Order {order.order_number}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <div>Status: {order.status}</div>
          <div>Total: {formatCurrency(order.total_cents)}</div>
          <div>Provider: {order.payment_provider}</div>
        </div>
      </div>

      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-lg font-semibold mb-3">Products Ordered</h2>
        {order.order_items && order.order_items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU / Variant</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Line Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(order.order_items as AdminOrderItem[]).map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center gap-3">
                        {item.products?.hero_image_url ? (
                          <Image
                            src={item.products.hero_image_url}
                            alt={item.products?.name || 'Product'}
                            width={40}
                            height={40}
                            className="rounded-md object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-gray-100" />
                        )}
                        {item.products?.id ? (
                          <Link
                            href={`/${tenant}/admin/products/${item.products.id}/edit`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {item.products?.name || 'Product'}
                          </Link>
                        ) : (
                          <span>{item.products?.name || 'Product'}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div>{item.products?.sku || '—'}</div>
                      <div className="text-xs text-gray-500">{item.variant || 'Default'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.quantity || 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(item.unit_price_cents || 0)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(item.subtotal_cents || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No order items found for this order.</p>
        )}
      </div>
    </div>
  )
}


