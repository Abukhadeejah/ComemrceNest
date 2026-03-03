'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Order {
  id: string
  order_number: string
  status: string
  total_amount: number
  wallet_used: number
  cash_paid: number
  cashback_amount: number
  cashback_pct: number
  payment_provider: string
  created_at: string
  items: Array<{
    quantity: number
    total_price: number
    product?: {
      name?: string
    }
  }>
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [verifyingOrders, setVerifyingOrders] = useState<Set<string>>(new Set())
  const router = useRouter()

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    if (!orders.length) return

    const isRecentPendingOrder = (order: Order) => {
      if (order.status !== 'pending') return false
      const createdAt = new Date(order.created_at).getTime()
      if (Number.isNaN(createdAt)) return false
      const ageMs = Date.now() - createdAt
      return ageMs >= 0 && ageMs <= 15 * 60 * 1000
    }

    const pendingRecentOrders = orders.filter(isRecentPendingOrder)
    if (pendingRecentOrders.length === 0) return

    const processPendingOrders = async () => {
      await Promise.all(
        pendingRecentOrders.map(async (order) => {
          if (verifyingOrders.has(order.order_number)) return

          setVerifyingOrders((prev) => {
            const next = new Set(prev)
            next.add(order.order_number)
            return next
          })

          try {
            await fetch(`/api/orders/${order.order_number}/verify-payment`, {
              method: 'POST',
              credentials: 'include',
            })
          } catch {
            // Ignore transient verification errors; user can still refresh.
          } finally {
            setVerifyingOrders((prev) => {
              const next = new Set(prev)
              next.delete(order.order_number)
              return next
            })
          }
        })
      )

      await loadOrders()
    }

    processPendingOrders()
  }, [orders])

  const loadOrders = async () => {
    try {
      setLoading(true)
      
      // Get tenant from cookie or default to senlysh
      const getTenantId = () => {
        if (typeof document !== 'undefined') {
          const cookies = document.cookie.split(';')
          const tenantCookie = cookies.find(c => c.trim().startsWith('tenant='))
          if (tenantCookie) {
            return tenantCookie.split('=')[1]
          }
        }
        return 'senlysh' // Default fallback
      }
      
      const tenantId = getTenantId()
      console.log('[Orders] Using tenant ID:', tenantId)
      
      const response = await fetch('/api/customers/orders', { 
        credentials: 'include',
        headers: {
          'x-tenant-id': tenantId,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('[Orders] API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('[Orders] API response data:', data)
        setOrders(data.orders || [])
      } else if (response.status === 401) {
        console.log('[Orders] Unauthorized, redirecting to login')
        router.push('/senlysh/login')
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('[Orders] API error:', errorData)
        setError(errorData.error || 'Failed to load orders')
      }
    } catch (error) {
      console.error('[Orders] Network error:', error)
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isRecentPendingOrder = (order: Order) => {
    if (order.status !== 'pending') return false
    const createdAt = new Date(order.created_at).getTime()
    if (Number.isNaN(createdAt)) return false
    const ageMs = Date.now() - createdAt
    return ageMs >= 0 && ageMs <= 15 * 60 * 1000
  }

  const getCashbackStatus = (order: Order) => {
    if (order.status !== 'paid') {
      return { text: 'Payment Pending', color: 'text-yellow-600' }
    }
    if (order.cashback_amount > 0) {
      return { text: 'Credited', color: 'text-green-600' }
    }
    if (order.cash_paid > 0) {
      return { text: 'Processing', color: 'text-blue-600' }
    }
    return { text: 'Not Eligible', color: 'text-gray-500' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <Link 
            href="/senlysh/my-account"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Account
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-4">When you place orders, they will appear here.</p>
            <Link 
              href="/senlysh/products"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const cashbackStatus = getCashbackStatus(order)
              
              return (
                <div key={order.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.order_number.slice(-8)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>

                    {isRecentPendingOrder(order) && (
                      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-medium">
                        <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                        {verifyingOrders.has(order.order_number)
                          ? 'Verifying payment and cashback...'
                          : 'Payment verification in progress'}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Total Amount</p>
                        <p className="text-lg font-semibold">₹{order.total_amount.toFixed(2)}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Payment Method</p>
                        <p className="text-sm font-medium capitalize">
                          {order.payment_provider}
                          {order.wallet_used > 0 && (
                            <span className="text-xs text-blue-600 ml-1">
                              (+ Wallet: ₹{order.wallet_used.toFixed(2)})
                            </span>
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Cashback Status</p>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${cashbackStatus.color}`}>
                            {cashbackStatus.text}
                          </span>
                          {order.cashback_amount > 0 && (
                            <span className="text-sm text-green-600 font-semibold">
                              +₹{order.cashback_amount.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div className="border-t pt-4 mb-4">
                        <p className="text-sm text-gray-500 mb-2">Items ({order.items.length})</p>
                        <div className="space-y-2">
                          {order.items.slice(0, 2).map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{item.product?.name || 'Product'} × {item.quantity}</span>
                              <span>₹{item.total_price.toFixed(2)}</span>
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-sm text-gray-500">
                              +{order.items.length - 2} more items
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="flex space-x-4">
                        <Link
                          href={`/orders/${order.order_number}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Details
                        </Link>
                        {order.status === 'paid' && (
                          <button
                            onClick={() => {
                              window.open(`/api/customers/orders/${order.order_number}/invoice`, '_blank')
                            }}
                            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                          >
                            Download Invoice
                          </button>
                        )}
                      </div>
                      
                      {order.status === 'pending' && (
                        <button 
                          onClick={() => window.open(`/checkout/success?orderId=${order.order_number}`, '_blank')}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
                        >
                          Complete Payment
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {orders.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Showing {orders.length} orders. Need help? 
              <Link href="/senlysh/contact" className="text-blue-600 hover:text-blue-800 ml-1">
                Contact Support
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}