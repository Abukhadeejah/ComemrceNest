import { notFound } from 'next/navigation'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import Link from 'next/link'

interface OrderPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailsPage({ params }: OrderPageProps) {
  const { id } = await params
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) notFound()

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, order_number, email, status, total_cents, currency, created_at')
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
      </div>
    </div>
  )
}



