import { getOrders } from '../../../../(admin)/admin/orders/actions'
import { OrderTable } from '../../../../(admin)/admin/orders/OrderTable'
import { OrderFilters } from '../../../../(admin)/admin/orders/OrderFilters'
import Link from 'next/link'
import { resolveTenantIdFromKey } from '@/server/tenant'

interface AdminOrdersProps {
  params: Promise<{
    tenant: string
  }>
  searchParams: Promise<{
    search?: string
    status?: string
    page?: string
  }>
}

export default async function AdminOrders({ params, searchParams }: AdminOrdersProps) {
  const { tenant } = await params
  const queryParams = await searchParams

  const tenantId = await resolveTenantIdFromKey(tenant)
  const orders = await getOrders(queryParams, tenantId)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <div className="flex items-center gap-3">
          <Link
            href={`/${tenant}/admin/orders/returns`}
            className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Returns
          </Link>
          <Link
            href={`/${tenant}/admin/orders/create`}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Order
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <OrderFilters 
            currentStatus={queryParams.status}
            currentSearch={queryParams.search}
          />
        </div>

        <OrderTable
          orders={orders}
          orderBasePath={`/${tenant}/admin/orders`}
        />
      </div>
    </div>
  )
}
