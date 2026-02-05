'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ReactElement } from 'react'

interface Order {
  id: string
  order_number: string
  email: string
  total_cents: number
  currency: string
  status: string
  created_at: string
  cashback_amount_cents?: number
  cashback_pct?: number
  customer_id?: string
}

interface OrderTableProps {
  orders: {
    data: Order[]
    count: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export function OrderTable({ orders }: OrderTableProps) {
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
      fulfilled: 'Fulfilled',
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
      fulfilled: { color: 'bg-purple-100 text-purple-800', label: 'Fulfilled' },
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
    <div className="overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Order
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cashback
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.data.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{order.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(order.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatCurrency(order.total_cents, order.currency)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
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
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(order.created_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex flex-col space-y-1">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View Details
                  </Link>
                  
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

      {/* Pagination */}
      {orders.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <Link
              href={`/admin/orders?page=${orders.page - 1}`}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                orders.page > 1
                  ? 'bg-white text-gray-700 hover:bg-gray-50'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Previous
            </Link>
            <Link
              href={`/admin/orders?page=${orders.page + 1}`}
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







































