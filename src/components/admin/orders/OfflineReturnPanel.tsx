'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type ReturnableItem = {
  orderItemId: string
  productId: string
  name: string
  sku: string | null
  quantity: number
  remainingQuantity?: number
  unitPriceCents: number
  trackInventory: boolean
  hasVariants?: boolean
  variantId?: string | null
  variantName?: string | null
}

interface OfflineReturnPanelProps {
  orderId: string
  orderStatus: string
  orderSource?: string | null
  orderCreatedAt?: string
  currency: string
  items: ReturnableItem[]
}

type QuantityMap = Record<string, number>

function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
  }).format((cents || 0) / 100)
}

export function OfflineReturnPanel({
  orderId,
  orderStatus,
  orderSource,
  orderCreatedAt,
  currency,
  items,
}: OfflineReturnPanelProps) {
  const router = useRouter()

  const [quantities, setQuantities] = useState<QuantityMap>({})
  const [restockAll, setRestockAll] = useState(true)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [clientRequestId, setClientRequestId] = useState('')

  const withinEditableWindow = useMemo(() => {
    if (!orderCreatedAt) return true
    const createdAtMs = new Date(orderCreatedAt).getTime()
    if (!Number.isFinite(createdAtMs)) return true
    const fiveDaysMs = 5 * 24 * 60 * 60 * 1000
    return Date.now() - createdAtMs <= fiveDaysMs
  }, [orderCreatedAt])

  const isEligible =
    orderSource === 'offline_admin' &&
    ['paid', 'fulfilled', 'partially_returned'].includes(orderStatus) &&
    withinEditableWindow

  const lineDraft = useMemo(() => {
    return items
      .map((item) => {
        const qty = Math.max(0, Math.floor(Number(quantities[item.orderItemId] || 0)))
        if (qty <= 0) return null

        const maxReturnableQty = Math.max(0, item.remainingQuantity ?? item.quantity)
        const clampedQty = Math.min(qty, maxReturnableQty)
        const canRestock = item.trackInventory && restockAll && (!item.hasVariants || !!item.variantId)
        return {
          orderItemId: item.orderItemId,
          productId: item.productId,
          variantId: item.variantId || null,
          name: item.name,
          quantity: clampedQty,
          restockQuantity: canRestock ? clampedQty : 0,
          subtotalCents: clampedQty * item.unitPriceCents,
        }
      })
      .filter(Boolean) as Array<{
        orderItemId: string
        productId: string
        variantId: string | null
        name: string
        quantity: number
        restockQuantity: number
        subtotalCents: number
      }>
  }, [items, quantities, restockAll])

  const totalReturnCents = useMemo(
    () => lineDraft.reduce((sum, item) => sum + item.subtotalCents, 0),
    [lineDraft]
  )

  async function submitReturn() {
    setError('')
    setMessage('')

    if (!isEligible) {
      setError('This order is not eligible for offline return creation.')
      return
    }

    if (lineDraft.length === 0) {
      setError('Select at least one item quantity to return.')
      return
    }

    setIsSubmitting(true)
    try {
      const requestId = clientRequestId || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      if (!clientRequestId) {
        setClientRequestId(requestId)
      }

      const payload = {
        clientRequestId: requestId,
        reason: reason.trim() || undefined,
        notes: notes.trim() || undefined,
        items: lineDraft.map((item) => ({
          orderItemId: item.orderItemId,
          returnedQuantity: item.quantity,
          restockQuantity: item.restockQuantity,
        })),
      }

      const response = await fetch(`/api/admin/orders/${orderId}/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.message || data.error || 'Failed to create return')
        return
      }

      setMessage(`Return ${data?.return?.returnNumber || ''} created successfully.`)
      setQuantities({})
      setReason('')
      setNotes('')
      setClientRequestId('')
      router.refresh()
    } catch {
      setError('Network error while creating return.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Create Offline Return</h2>
        <p className="text-sm text-gray-600 mt-1">
          Item-level returns for offline-admin paid/fulfilled/partially-returned orders (within 5 days of order creation). Refund is credited to wallet immediately.
        </p>
      </div>

      {!isEligible && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Returns are allowed only for offline-admin orders in paid/fulfilled/partially_returned state and only within 5 days of order creation.
        </div>
      )}

      {isEligible && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sold Qty</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining Qty</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Qty</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Line Return</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => {
                  const qty = Math.max(0, Math.floor(Number(quantities[item.orderItemId] || 0)))
                  const remainingQty = Math.max(0, item.remainingQuantity ?? item.quantity)
                  const cappedQty = Math.min(qty, remainingQty)
                  return (
                    <tr key={item.orderItemId}>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        <div>{item.name}</div>
                        <div className="text-xs text-gray-500">SKU: {item.sku || '—'}</div>
                        {item.variantName && <div className="text-xs text-gray-500">Variant: {item.variantName}</div>}
                        {item.hasVariants && !item.variantId && (
                          <div className="text-xs text-amber-700">Variant stock cannot be restocked because the order did not record a variant ID.</div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">{item.quantity}</td>
                      <td className="px-3 py-2 text-sm text-gray-700">{remainingQty}</td>
                      <td className="px-3 py-2 text-sm text-gray-700">{formatCurrency(item.unitPriceCents, currency)}</td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        <input
                          type="number"
                          min={0}
                          max={remainingQty}
                          value={quantities[item.orderItemId] ?? 0}
                          onChange={(e) =>
                            setQuantities((prev) => ({
                              ...prev,
                              [item.orderItemId]: Number(e.target.value || 0),
                            }))
                          }
                          className="w-24 rounded-md border border-gray-300 px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2 text-sm font-medium text-gray-900">
                        {formatCurrency(cappedQty * item.unitPriceCents, currency)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={restockAll}
              onChange={(e) => setRestockAll(e.target.checked)}
            />
            Restock returned quantities for inventory-tracked products
          </label>
          <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
            Variant returns restock the recorded variant when the order item includes a variant ID.
          </p>
          <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
            Offline refund policy: full approved return amount is credited to the customer wallet (no cash split).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Reason (optional)</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Customer return reason"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Internal note"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <div className="text-sm text-gray-700">
              Total Return: <span className="font-semibold text-gray-900">{formatCurrency(totalReturnCents, currency)}</span>
            </div>
            <button
              type="button"
              onClick={submitReturn}
              disabled={isSubmitting}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Return...' : 'Create Return'}
            </button>
          </div>
        </>
      )}

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}
      {message && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">{message}</div>}
    </div>
  )
}
