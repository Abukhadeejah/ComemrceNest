'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { InvoiceDownloadButton } from '@/components/invoice/InvoiceDownloadButton'
import type { InvoiceOrderData } from '@/components/invoice/types'

interface OrderDetail {
  id: string
  order_number: string
  order_source?: string
  status: string
  total_cents: number
  currency: string
  email: string
  customer_id: string
  created_at: string
  payment_provider: string
  payment_env: string
  wallet_used_cents: number
  cash_paid_cents: number
  discount_amount_cents: number
  cashback_amount_cents: number
  cashback_pct: number
  coupon_code: string
  order_items: Array<{
    id: string
    quantity: number
    unit_price_cents: number
    subtotal_cents: number
    variant: string | null
    products: {
      id: string
      name: string
      sku: string
      hero_image_url: string | null
    } | null
  }>
  customers?: {
    first_name?: string
    last_name?: string
    phone?: string
  } | null
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function AdminOrderDetailPage({ params }: PageProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const [orderId, setOrderId] = useState<string>('')

  useEffect(() => {
    params.then(p => setOrderId(p.id))
  }, [params])

  useEffect(() => {
    if (!orderId) return
    loadOrderDetails()
  }, [orderId])

  const loadOrderDetails = async () => {
    try {
      setLoading(true)
      console.log('[Admin Order Details] Fetching order:', orderId)

      // Fetch single order with items from dedicated API
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const foundOrder = data.order

        if (foundOrder) {
          console.log('[Admin Order Details] Found order:', foundOrder)
          console.log('[Admin Order Details] Order items:', foundOrder.order_items)

          // Transform the order data - API returns raw cents values from DB
          setOrder({
            id: foundOrder.id,
            order_number: foundOrder.order_number,
            order_source: foundOrder.order_source || 'online',
            status: foundOrder.status,
            total_cents: foundOrder.total_cents,
            currency: foundOrder.currency || 'INR',
            email: foundOrder.email,
            customer_id: foundOrder.customer_id,
            created_at: foundOrder.created_at,
            payment_provider: foundOrder.payment_provider || 'N/A',
            payment_env: foundOrder.payment_env || 'test',
            wallet_used_cents: foundOrder.wallet_used_cents || 0,
            cash_paid_cents: foundOrder.cash_paid_cents || foundOrder.total_cents,
            discount_amount_cents: foundOrder.discount_amount_cents || 0,
            cashback_amount_cents: foundOrder.cashback_amount_cents || 0,
            cashback_pct: foundOrder.cashback_pct || 0,
            coupon_code: foundOrder.coupon_code || '',
            order_items: foundOrder.order_items || [],
            customers: null
          })
        } else {
          setError('Order not found')
        }
      } else {
        setError('Failed to load order details')
      }
    } catch (error) {
      console.error('[Admin Order Details] Error:', error)
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(cents / 100)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'fulfilled': return 'bg-purple-100 text-purple-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getOrderSourceLabel = (source?: string) => {
    return source === 'offline_admin' ? 'Offline Admin' : 'Online'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error || 'Order not found'}
          </div>
          <Link
            href="/admin/orders"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  const subtotalCents = order.order_items.reduce((sum, item) => sum + item.subtotal_cents, 0)

  // Prepare invoice data for PDF download
  const invoiceData: InvoiceOrderData = {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    createdAt: order.created_at,
    currency: order.currency,
    customerEmail: order.email,
    customerName: order.customers
      ? [order.customers.first_name, order.customers.last_name].filter(Boolean).join(' ')
      : order.email,
    paymentProvider: order.payment_provider,
    paymentEnv: order.payment_env,
    subtotalCents,
    discountAmountCents: order.discount_amount_cents,
    walletUsedCents: order.wallet_used_cents,
    cashPaidCents: order.cash_paid_cents,
    cashbackAmountCents: order.cashback_amount_cents,
    cashbackPct: order.cashback_pct,
    totalCents: order.total_cents,
    shippingAddress: null,
    billingAddress: null,
    items: order.order_items.map(item => ({
      id: item.id,
      name: item.products?.name || 'Product',
      sku: item.products?.sku || null,
      variant: item.variant || null,
      quantity: item.quantity,
      unitPriceCents: item.unit_price_cents,
      subtotalCents: item.subtotal_cents,
    })),
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
            <p className="text-gray-500 mt-1">Order #{order.order_number}</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Orders
          </Link>
        </div>

        {/* Order Status Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Order Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)} mt-1`}>
                {order.status.toUpperCase()}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Order Date</p>
              <p className="text-gray-900 font-medium">
                {new Date(order.created_at).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Customer & Payment Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-500">Customer Email</p>
              <p className="text-gray-900 font-medium">{order.email}</p>
              {order.customer_id && (
                <p className="text-xs text-gray-500 mt-1">ID: {order.customer_id.slice(0, 8)}...</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="text-gray-900 capitalize font-medium">{order.payment_provider}</p>
              <p className="text-xs text-gray-500 mt-1">{order.payment_env}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Order Source</p>
              <p className="text-gray-900 font-medium">{getOrderSourceLabel(order.order_source)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Order Total</p>
              <p className="text-gray-900 font-semibold text-lg">{formatCurrency(order.total_cents)}</p>
              {order.cashback_amount_cents > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  Cashback: {formatCurrency(order.cashback_amount_cents)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Order Items ({order.order_items?.length || 0} items)
          </h2>
          {order.order_items && order.order_items.length > 0 ? (
            <div className="space-y-4">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                  <div className="w-20 h-20 flex-shrink-0">
                    {item.products?.hero_image_url ? (
                      <Image
                        src={item.products.hero_image_url}
                        alt={item.products?.name || 'Product'}
                        width={80}
                        height={80}
                        className="rounded-md object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full rounded-md bg-gray-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.products?.name || 'Product'}</h3>
                    {item.products?.sku && (
                      <p className="text-sm text-gray-500">SKU: {item.products.sku}</p>
                    )}
                    {item.variant && (
                      <p className="text-sm text-gray-500">Variant: {item.variant}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Unit Price</p>
                    <p className="text-gray-900">{formatCurrency(item.unit_price_cents)}</p>
                    <p className="text-sm text-gray-500 mt-2">Line Total</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(item.subtotal_cents)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">No items found in this order.</p>
              <p className="text-xs text-gray-400 mt-1">Order ID: {order.id}</p>
              <p className="text-xs text-gray-400">This may be a data issue. Please check the database.</p>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">{formatCurrency(subtotalCents)}</span>
            </div>
            {order.discount_amount_cents > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Discount {order.coupon_code && `(${order.coupon_code})`}
                </span>
                <span className="text-green-600">-{formatCurrency(order.discount_amount_cents)}</span>
              </div>
            )}
            {order.wallet_used_cents > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Wallet Used</span>
                <span className="text-purple-600">-{formatCurrency(order.wallet_used_cents)}</span>
              </div>
            )}
            {order.cash_paid_cents > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cash Paid</span>
                <span className="text-gray-900">{formatCurrency(order.cash_paid_cents)}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t">
              <span className="font-semibold text-gray-900">Order Total</span>
              <span className="font-bold text-xl text-gray-900">{formatCurrency(order.total_cents)}</span>
            </div>
            {order.cashback_amount_cents > 0 && (
              <div className="flex justify-between bg-green-50 px-3 py-2 rounded-lg mt-3">
                <span className="text-green-700 font-medium">Cashback Credited</span>
                <span className="text-green-700 font-bold">
                  +{formatCurrency(order.cashback_amount_cents)}
                  {order.cashback_pct > 0 && <span className="text-sm ml-1">({order.cashback_pct}%)</span>}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 pt-4 border-t flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <InvoiceDownloadButton
                invoice={invoiceData}
                label="Download Order PDF"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              />
            </div>
            <Link
              href={`/admin/orders`}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium text-center"
            >
              View All Orders
            </Link>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-4 text-center text-xs text-gray-400">
          Order ID: {order.id} | Customer ID: {order.customer_id || 'N/A'}
        </div>
      </div>
    </div>
  )
}
