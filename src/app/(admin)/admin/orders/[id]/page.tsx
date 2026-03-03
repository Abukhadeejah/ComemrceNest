import { notFound } from 'next/navigation'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import Link from 'next/link'
import Image from 'next/image'

interface OrderPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailsPage({ params }: OrderPageProps) {
  const { id } = await params
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) notFound()

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      order_number,
      email,
      status,
      total_cents,
      currency,
      created_at,
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

  if (!order) notFound()

  const formatCurrency = (cents: number, currency: string) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR' }).format((cents || 0) / 100)

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order {order.order_number}</h1>
            <p className="text-gray-500">Order Details</p>
          </div>
          <Link href="/admin/orders" className="text-sm text-blue-600 hover:text-blue-800">Back to orders</Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex justify-between">
            <div>
              <div className="text-sm text-gray-500">Customer</div>
              <div className="text-gray-900">{order.email}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Total</div>
              <div className="text-gray-900">{formatCurrency(order.total_cents, order.currency)}</div>
            </div>
          </div>
          <div className="flex justify-between">
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <div className="text-gray-900 capitalize">{order.status}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Created</div>
              <div className="text-gray-900">{new Date(order.created_at).toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Products Ordered</h2>

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
                  {order.order_items.map((item) => (
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
                              href={`/admin/products/${item.products.id}/edit`}
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
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatCurrency(item.unit_price_cents || 0, order.currency)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {formatCurrency(item.subtotal_cents || 0, order.currency)}
                      </td>
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
    </div>
  )
}




