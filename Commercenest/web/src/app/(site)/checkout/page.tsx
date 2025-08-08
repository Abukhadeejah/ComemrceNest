"use client"
import { useState } from 'react'

export default function CheckoutTestPage() {
  const [orderId, setOrderId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function createOrder() {
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ amountPaise: 100 }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'checkout_failed')
      setOrderId(json.order?.id || null)
      setMessage('Order created. You can now simulate payment.')
    } catch (e: any) {
      setMessage(e.message || 'Failed to create order')
    } finally {
      setBusy(false)
    }
  }

  async function simulatePayment() {
    if (!orderId) return
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch('/api/webhooks/razorpay/simulate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ order_id: orderId }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'simulation_failed')
      setMessage('Payment simulated; order should be marked paid. View status page for this order.')
    } catch (e: any) {
      setMessage(e.message || 'Failed to simulate payment')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-lg p-6 space-y-4">
      <h1 className="text-xl font-semibold">Checkout (Test Mode)</h1>
      <p className="text-sm text-neutral-600">Create a test order for ₹1.00 and simulate payment to test end-to-end flow.</p>
      <div className="space-x-2">
        <button disabled={busy} onClick={createOrder} className="rounded bg-black px-4 py-2 text-white disabled:opacity-60">Create test order</button>
        <button disabled={busy || !orderId} onClick={simulatePayment} className="rounded bg-emerald-700 px-4 py-2 text-white disabled:opacity-60">Simulate payment</button>
      </div>
      {orderId ? (
        <p className="text-sm">
          Order ID: <code>{orderId}</code> · <a className="underline" href={`/orders/${orderId}`}>View status</a>
        </p>
      ) : null}
      {message ? <p className="text-sm text-neutral-700">{message}</p> : null}
    </main>
  )
}


