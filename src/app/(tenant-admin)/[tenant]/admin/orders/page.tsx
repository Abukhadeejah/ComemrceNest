import { getOrders } from '../../../../(admin)/admin/orders/actions'
import { OrderTable } from '../../../../(admin)/admin/orders/OrderTable'
import { OrderFilters } from '../../../../(admin)/admin/orders/OrderFilters'

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
  
  const orders = await getOrders(queryParams)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
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
