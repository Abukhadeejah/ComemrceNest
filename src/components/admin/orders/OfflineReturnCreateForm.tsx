'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { OfflineReturnPanel } from './OfflineReturnPanel'

type LookupOrderItem = {
  id: string
  product_id: string
  variant_id: string | null
  variant_name: string | null
  quantity: number
  remaining_returnable_quantity?: number
  already_returned_quantity?: number
  unit_price_cents: number
  products?: {
    id: string
    name: string
    sku: string | null
    track_inventory: boolean | null
    has_variants: boolean | null
  } | null
  product_variants?: {
    id: string
    name: string
    sku: string | null
    stock: number | null
    track_inventory: boolean | null
  } | null
}

type LookupOrder = {
  id: string
  order_number: string
  order_source: string | null
  status: string
  currency: string | null
  created_at: string
  order_items: LookupOrderItem[]
}

interface OfflineReturnCreateFormProps {
  tenant?: string
  ordersBasePath: string
  initialOrderQuery?: string
}

export default function OfflineReturnCreateForm({
  tenant,
  ordersBasePath,
  initialOrderQuery,
}: OfflineReturnCreateFormProps) {
  const [orderQuery, setOrderQuery] = useState(initialOrderQuery || '')
  const [loadingOrder, setLoadingOrder] = useState(false)
  const [order, setOrder] = useState<LookupOrder | null>(null)
  const [error, setError] = useState('')

  const orderDetailBasePath = useMemo(() => ordersBasePath.replace(/\/orders$/, '/order-details'), [ordersBasePath])

  async function lookupOrder() {
    const q = orderQuery.trim()
    setError('')
    setOrder(null)

    if (!q) {
      setError('Enter an order number or order id first.')
      return
    }

    setLoadingOrder(true)
    try {
      const response = await fetch(`/api/admin/orders/lookup?order=${encodeURIComponent(q)}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.message || data.error || 'Order lookup failed')
        return
      }

      setOrder(data.order || null)
    } catch {
      setError('Network error during order lookup')
    } finally {
      setLoadingOrder(false)
    }
  }

  useEffect(() => {
    if (initialOrderQuery) {
      lookupOrder()
    }
    // We only want prefill lookup once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Return</h1>
          <p className="text-sm text-gray-600 mt-1">
            Lookup order by number, review items, then create return.
            {tenant ? ` Tenant: ${tenant}` : ''}
          </p>
        </div>
        <Link href={ordersBasePath} className="text-sm text-blue-600 hover:text-blue-800">
          Back to Orders
        </Link>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Order Lookup</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Number or Order ID</label>
            <input
              type="text"
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              placeholder="Example: OFFRET_TEST_... or uuid"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={lookupOrder}
            disabled={loadingOrder}
            className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loadingOrder ? 'Looking up...' : 'Find Order'}
          </button>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        {order && (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4 space-y-2">
            <div className="text-sm text-gray-700">
              <span className="font-medium text-gray-900">Order:</span> {order.order_number}
            </div>
            <div className="text-sm text-gray-700">
              <span className="font-medium text-gray-900">Status:</span> {order.status}
            </div>
            <div className="text-sm text-gray-700">
              <span className="font-medium text-gray-900">Source:</span>{' '}
              {order.order_source === 'offline_admin' ? 'Offline Admin' : 'Online'}
            </div>
            <Link
              href={`${orderDetailBasePath}/${order.id}`}
              className="inline-flex text-sm text-blue-600 hover:text-blue-800"
            >
              Open Full Order Details
            </Link>
          </div>
        )}
      </section>

      {order && (
        <OfflineReturnPanel
          orderId={order.id}
          orderStatus={order.status}
          orderSource={order.order_source}
          orderCreatedAt={order.created_at}
          currency={order.currency || 'INR'}
          items={(order.order_items || []).map((item) => ({
            orderItemId: item.id,
            productId: item.products?.id || item.product_id,
            name: item.products?.name || 'Product',
            sku: item.products?.sku || null,
            quantity: item.quantity || 0,
            remainingQuantity: item.remaining_returnable_quantity ?? item.quantity ?? 0,
            unitPriceCents: item.unit_price_cents || 0,
            trackInventory: !!item.products?.track_inventory,
            hasVariants: !!item.products?.has_variants,
            variantId: item.variant_id || null,
            variantName: item.variant_name || item.product_variants?.name || null,
          }))}
        />
      )}
    </div>
  )
}
