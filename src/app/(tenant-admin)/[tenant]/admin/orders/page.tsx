import { getOrders } from '../../../../(admin)/admin/orders/actions'
import { OrderTable } from '../../../../(admin)/admin/orders/OrderTable'
import { OrderFilters } from '../../../../(admin)/admin/orders/OrderFilters'

interface AdminOrdersProps {
  searchParams: {
    search?: string
    status?: string
    page?: string
  }
}

export default async function AdminOrders({ searchParams }: AdminOrdersProps) {
  const params = searchParams
  
  const orders = await getOrders(params)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <OrderFilters 
            currentStatus={params.status}
            currentSearch={params.search}
          />
        </div>

        <OrderTable orders={orders} />
      </div>
    </div>
  )
}
