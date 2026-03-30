import { getOrders } from './actions'
import { OrderTable } from './OrderTable'
import { OrderFilters } from './OrderFilters'
import Link from 'next/link'

interface AdminOrdersProps {
  searchParams: Promise<{
    search?: string
    status?: string
    page?: string
  }>
}

export default async function AdminOrders({ searchParams }: AdminOrdersProps) {
  const params = await searchParams
  
  const orders = await getOrders(params)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage customer orders, update status, and track cashback
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/orders/returns"
            className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Returns
          </Link>
          <Link
            href="/admin/orders/create"
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Order
          </Link>
          <div className="text-sm text-gray-500">
            Total Orders: <span className="font-semibold text-gray-900">{orders.count}</span>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <OrderFilters 
            currentStatus={params.status}
            currentSearch={params.search}
          />
        </div>

        <OrderTable
          orders={orders}
          orderBasePath="/admin/orders"
        />
      </div>
    </div>
  )
}


