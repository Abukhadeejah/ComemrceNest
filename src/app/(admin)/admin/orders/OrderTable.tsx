'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ReactElement } from 'react'

interface Order {
  id: string
  order_number: string
  order_source?: string
  has_processed_return?: boolean
  email: string
  total_cents: number
  currency: string
  status: string
  created_at: string
  cashback_amount_cents?: number
  cashback_pct?: number
  customer_id?: string
  order_items?: Array<{
    id: string
    quantity: number
    variant?: string | null
    unit_price_cents?: number
    subtotal_cents?: number
    products?: {
      name?: string
      sku?: string
    } | null
  }>
}

interface OrderTableProps {
  orders: {
    data: Order[]
    count: number
    page: number
    pageSize: number
    totalPages: number
  }
  orderBasePath?: string
}

export function OrderTable({
  orders,
  orderBasePath = '/admin/orders'
}: OrderTableProps) {
  const router = useRouter()
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  const onDelete = async (id: string, orderNumber: string) => {
    if (deletingOrderId !== null) {
      console.warn('Delete operation already in progress')
      return
    }

    if (!confirm(`Are you sure you want to delete order "${orderNumber}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingOrderId(id)
      console.log(`Starting deletion of order: ${orderNumber} (${id})`)

      const res = await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (res.ok && data.success) {
        console.log(`Successfully deleted order: ${orderNumber}`)
        console.log(`Deleted ${data.deletedItemsCount} order items`)

        // Show success feedback
        alert(`Order "${orderNumber}" deleted successfully. ${data.deletedItemsCount} items removed.`)

        // Refresh the page to show updated data
        router.refresh()
      } else {
        const errorMessage = data.error || 'Failed to delete order'
        console.error('Delete failed:', errorMessage)
        alert(`Failed to delete order: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Network error during deletion:', error)
      alert('Network error occurred while deleting the order. Please try again.')
    } finally {
      setDeletingOrderId(null)
    }
  }

  const onUpdateStatus = async (id: string, newStatus: string, orderNumber: string) => {
    if (updatingOrderId !== null) {
      console.warn('Update operation already in progress')
      return
    }

    const statusLabels = {
      pending: 'Pending',
      paid: 'Paid',
      confirmed: 'Confirmed',
      fulfilled: 'Fulfilled',
      partially_returned: 'Partially Returned',
      returned: 'Returned',
      cancelled: 'Cancelled',
      failed: 'Failed'
    }

    const currentLabel = statusLabels[newStatus as keyof typeof statusLabels] || newStatus
    
    if (!confirm(`Update order "${orderNumber}" status to "${currentLabel}"?`)) {
      return
    }

    try {
      setUpdatingOrderId(id)
      
      const res = await fetch(`/api/admin/orders/update-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id, status: newStatus })
      })

      // Handle 405 Method Not Allowed specifically
      if (res.status === 405) {
        console.error('405 Method Not Allowed - Next.js compilation issue')
        alert('Server error: Method not allowed. Please restart the development server and try again.')
        return
      }

      // Check if response has content before parsing JSON
      const contentType = res.headers.get('content-type')
      let data: { success?: boolean; error?: string } | null = null
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await res.json()
        } catch (jsonError) {
          console.error('Failed to parse JSON response:', jsonError)
          alert('Server returned invalid response. Please try again.')
          return
        }
      } else {
        // Non-JSON response, likely an error
        const text = await res.text()
        console.error('Non-JSON response:', text)
        alert('Server error: Invalid response format. Please restart the development server.')
        return
      }

      if (res.ok && data?.success) {
        console.log(`Order ${orderNumber} status updated to ${newStatus}`)
        router.refresh()
      } else {
        const errorMessage = data?.error || 'Failed to update order status'
        console.error('Status update failed:', errorMessage)
        alert(`Failed to update order status: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Network error during status update:', error)
      alert('Network error occurred while updating order status. Please try again.')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const onMarkPaid = async (id: string) => {
    if (!confirm('Mark this order as paid?')) return
    const res = await fetch(`/api/admin/orders/${id}/mark-paid`, { method: 'POST' })
    if (res.ok) router.refresh()
    else alert('Failed to mark order as paid')
  }

  const formatCurrency = (cents: number, currency: string) => {
    const amount = cents / 100
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      paid: { color: 'bg-green-100 text-green-800', label: 'Paid' },
      confirmed: { color: 'bg-cyan-100 text-cyan-800', label: 'Confirmed' },
      fulfilled: { color: 'bg-purple-100 text-purple-800', label: 'Fulfilled' },
      partially_returned: { color: 'bg-orange-100 text-orange-800', label: 'Partially Returned' },
      returned: { color: 'bg-rose-100 text-rose-800', label: 'Returned' },
      cancelled: { color: 'bg-gray-100 text-gray-800', label: 'Cancelled' },
      failed: { color: 'bg-red-100 text-red-800', label: 'Failed' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getOrderSourceBadge = (source?: string) => {
    if (source === 'offline_admin') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-orange-100 text-orange-800">
          Offline Admin
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-800">
        Online
      </span>
    )
  }

  const getStatusActions = (order: Order): ReactElement[] => {
    const actions: ReactElement[] = []
    
    if (order.status === 'pending') {
      actions.push(
        <button
          key="mark-paid"
          onClick={() => onMarkPaid(order.id)}
          className="text-green-600 hover:text-green-800 text-sm"
          disabled={updatingOrderId === order.id}
        >
          Mark Paid
        </button>
      )
    }
    
    if (order.status === 'paid') {
      actions.push(
        <button
          key="fulfill"
          onClick={() => onUpdateStatus(order.id, 'fulfilled', order.order_number)}
          className="text-purple-600 hover:text-purple-800 text-sm"
          disabled={updatingOrderId === order.id}
        >
          Mark Fulfilled
        </button>
      )
    }
    
    if (['pending', 'paid'].includes(order.status)) {
      actions.push(
        <button
          key="cancel"
          onClick={() => onUpdateStatus(order.id, 'cancelled', order.order_number)}
          className="text-orange-600 hover:text-orange-800 text-sm"
          disabled={updatingOrderId === order.id}
        >
          Cancel
        </button>
      )
    }
    
    return actions
  }

  if (orders.data.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
        <p className="mt-1 text-sm text-gray-500">Orders will appear here when customers make purchases.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="px-4 pb-2 text-xs text-gray-500">
        Scroll sideways to view all columns and actions.
      </div>

      <div className="w-full overflow-x-auto overflow-y-visible [scrollbar-gutter:stable] pb-2">
        <table className="min-w-[1280px] w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Order
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[360px]">
              Purchased Items
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cashback
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th scope="col" className="sticky right-0 z-10 border-l border-gray-200 bg-gray-50 px-4 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.data.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="px-4 py-4 whitespace-nowrap align-top">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-900">
                    {order.order_number}
                  </span>
                  {getOrderSourceBadge(order.order_source)}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap align-top">
                <div className="text-sm text-gray-900">{order.email}</div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap align-top">
                {getStatusBadge(order.status)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 align-top">
                {formatCurrency(order.total_cents, order.currency)}
              </td>
              <td className="px-4 py-4 text-sm text-gray-700 align-top">
                {order.order_items && order.order_items.length > 0 ? (
                  <div className="space-y-2">
                    {order.order_items.slice(0, 3).map((item) => (
                      <div key={item.id} className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {item.products?.name || 'Product'}
                        </div>
                        <div className="mt-1 text-xs text-gray-600 flex flex-wrap gap-x-3 gap-y-1">
                          <span>SKU: {item.products?.sku || '-'}</span>
                          <span>Variant: {item.variant || '-'}</span>
                          <span>Qty: {item.quantity}</span>
                          <span>Unit: {formatCurrency(item.unit_price_cents || 0, order.currency)}</span>
                          <span className="font-medium text-gray-800">Line: {formatCurrency(item.subtotal_cents || 0, order.currency)}</span>
                        </div>
                      </div>
                    ))}
                    {order.order_items.length > 3 && (
                      <div className="text-xs text-gray-500 px-1">
                        +{order.order_items.length - 3} more items
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm align-top">
                {order.cashback_amount_cents && order.cashback_amount_cents > 0 ? (
                  <div className="text-green-600 font-medium">
                    {formatCurrency(order.cashback_amount_cents, order.currency)}
                    {order.cashback_pct && (
                      <div className="text-xs text-gray-500">
                        {order.cashback_pct.toFixed(1)}%
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 align-top">
                {formatDate(order.created_at)}
              </td>
              <td className="sticky right-0 z-10 border-l border-gray-200 bg-white px-4 py-4 whitespace-nowrap text-right text-sm font-medium align-top">
                <div className="flex flex-col space-y-1">
                  <Link
                    href={`${orderBasePath}/${order.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Details
                  </Link>
                  {order.order_source === 'offline_admin' && !order.has_processed_return && ['paid', 'fulfilled'].includes(order.status) && (
                    <Link
                      href={`${orderBasePath}/returns?order=${encodeURIComponent(order.order_number)}`}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Create Return
                    </Link>
                  )}
                  {getStatusActions(order).map((action, index) => (
                    <div key={index}>{action}</div>
                  ))}
                  
                  <button
                    onClick={() => onDelete(order.id, order.order_number)}
                    disabled={deletingOrderId === order.id || updatingOrderId === order.id}
                    className={`text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed ${
                      deletingOrderId === order.id ? 'animate-pulse' : ''
                    }`}
                    title={deletingOrderId === order.id ? "Deleting order..." : "Delete order"}
                  >
                    {deletingOrderId === order.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>

      {/* Pagination */}
      {orders.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <Link
              href={`${orderBasePath}?page=${orders.page - 1}`}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                orders.page > 1
                  ? 'bg-white text-gray-700 hover:bg-gray-50'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Previous
            </Link>
            <Link
              href={`${orderBasePath}?page=${orders.page + 1}`}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                orders.page < orders.totalPages
                  ? 'bg-white text-gray-700 hover:bg-gray-50'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next
            </Link>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(orders.page - 1) * orders.pageSize + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(orders.page * orders.pageSize, orders.count)}
                </span>{' '}
                of <span className="font-medium">{orders.count}</span> results
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}







































