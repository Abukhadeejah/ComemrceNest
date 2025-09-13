"use client"

import { useState, useEffect } from 'react'
import { useCart, formatPrice } from '@/lib/cart'
import Link from 'next/link'
import { Playfair_Display } from 'next/font/google'
import { useTenant } from '@/hooks/useTenant'
import { SITE_URLS } from '@/utils/site-urls'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700','800','900'] })

// Minimal Razorpay type definition
type RazorpaySuccess = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

type RazorpayFailure = {
  error: {
    code: string
    description: string
    source: string
    step: string
    reason: string
    metadata: { order_id: string; payment_id: string }
  }
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description?: string
  order_id: string
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  notes?: Record<string, string>
  theme?: {
    color?: string
  }
  handler?: (response: RazorpaySuccess) => void
}

interface RazorpayInstance {
  // Method-overload style signatures to avoid duplicate identifier error
  on(event: 'payment.failed', handler: (response: RazorpayFailure) => void): void
  on(event: string, handler: (response: unknown) => void): void
  open(): void
  close(): void
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance
  }
}

export default function CheckoutPage() {
  const { state: cart } = useCart()
  const tenant = useTenant()
  const [hydrated, setHydrated] = useState(false)

  // Get tenant key from URL path (most reliable approach)
  const getTenantKey = (): string | null => {
    if (typeof window !== 'undefined') {
      const pathSegments = window.location.pathname.split('/').filter(Boolean)
      if (pathSegments.length > 0 && (pathSegments[0] === 'bluebell' || pathSegments[0] === 'senlysh')) {
        return pathSegments[0]
      }
    }
    return null
  }

  const tenantKey = getTenantKey()
  const [orderId, setOrderId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    pincode: '',
    gstin: ''
  })

  // GST rate from tenant config (default 0)
  const gstRatePercent = tenant.pricing?.gstRatePercent ?? 0
  const gstAmount = Math.round(cart.total * (gstRatePercent / 100))
  const grandTotal = cart.total + gstAmount

  // Load Razorpay script
  useEffect(() => {
    setHydrated(true)
    if (window.Razorpay) {
      setScriptLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => setScriptLoaded(true)
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  async function handleRazorpayPayment(amountPaise: number) {
    setBusy(true)
    setMessage(null)
    try {
      // Create order via API
      const validItems = cart.items.filter(it => typeof it.productId === 'string' && it.productId.length >= 32)
      const res = await fetch('/api/checkout', { 
        method: 'POST', 
        headers: { 'content-type': 'application/json' }, 
        body: JSON.stringify({ 
          amountPaise, 
          mode: 'test', 
          customer,
          items: validItems.map(it => ({
            productId: it.productId,
            quantity: it.quantity,
            unitPriceCents: it.price
          }))
        }) 
      })
      
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json?.error || 'Checkout failed')
      }
      
      const { order, keyId } = await res.json()
      
      if (!order?.id || !keyId) {
        throw new Error('Invalid response from checkout API')
      }
      
      setOrderId(order.id)

      // Open Razorpay modal
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded')
      }

      const options: RazorpayOptions = {
        key: keyId,
        amount: amountPaise,
        currency: "INR",
        name: "CommerceNest",
        description: `Order #${order.id}`,
        order_id: order.id,
        prefill: {
          name: customer.name || "Customer",
          email: customer.email || "customer@example.com",
          contact: customer.phone || undefined,
        },
        theme: {
          color: "#3399cc"
        },
        handler: function (response) {
          // Include payment id to avoid unused-var lint and give user feedback
          setMessage(
            `Payment successful! ID: ${response.razorpay_payment_id}. Redirecting to order page...`
          )
          window.location.href = `/orders/${order.id}`
        }
      }

      const razorpay = new window.Razorpay(options)
      
      razorpay.on('payment.failed', function(response) {
        setMessage(`Payment failed: ${response.error.description}`)
        setBusy(false)
      })
      
      razorpay.open()
    } catch (e) {
      const err = e as Error
      setMessage(err.message || 'Failed to process payment')
      setBusy(false)
    }
  }

  async function _createTestOrder() {
    setBusy(true)
    setMessage(null)
    try {
      const validItems = cart.items.filter(it => typeof it.productId === 'string' && it.productId.length >= 32)
      const res = await fetch('/api/checkout', { 
        method: 'POST', 
        headers: { 'content-type': 'application/json' }, 
        body: JSON.stringify({ 
          amountPaise: 100, 
          mode: 'test', 
          customer,
          items: validItems.map(it => ({
            productId: it.productId,
            quantity: it.quantity,
            unitPriceCents: it.price
          }))
        }) 
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'checkout_failed')
      setOrderId(json.order?.id || null)
      setMessage('Order created. You can now simulate payment.')
    } catch (e) {
      const err = e as Error
      setMessage(err.message || 'Failed to create order')
    } finally {
      setBusy(false)
    }
  }

  async function _simulatePayment() {
    if (!orderId) return
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch('/api/webhooks/razorpay/simulate', { 
        method: 'POST', 
        headers: { 'content-type': 'application/json' }, 
        body: JSON.stringify({ order_id: orderId }) 
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'simulation_failed')
      setMessage('Payment simulated; order should be marked paid. View status page for this order.')
    } catch (e) {
      const err = e as Error
      setMessage(err.message || 'Failed to simulate payment')
    } finally {
      setBusy(false)
    }
  }

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <h1 className={`${playfair.className} text-3xl font-bold text-gray-900 mb-2 text-center`}>Checkout</h1>
          <div className="bg-white rounded-lg shadow-sm border p-8 mt-8">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-5/6" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className={`${playfair.className} text-3xl font-bold text-gray-900 mb-2 text-center`}>Checkout</h1>
        
        <div className="bg-white rounded-lg shadow-sm border p-8 mt-8">
          {cart.items.length > 0 ? (
            <div className="mb-8">
              <h2 className={`${playfair.className} text-xl font-semibold mb-4`}>Your Order</h2>
              
              <div className="border-t border-b py-4">
                {cart.items.map(item => (
                  <div key={item.id} className="flex justify-between items-center mb-2">
                    <span>
                      {item.name} <span className="text-gray-500">× {item.quantity}</span>
                    </span>
                    <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(cart.total)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">GST ({gstRatePercent}%)</span>
                  <span>{formatPrice(gstAmount)}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-[color:var(--color-primary)]">
                  <span>Total</span>
                  <span>{formatPrice(grandTotal)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center mb-8">
              <p className="text-gray-600 mb-4">Your cart is empty. Add some products before checkout.</p>
              <Link
                href={tenantKey ? SITE_URLS.products(tenantKey) : '/products'}
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Products
              </Link>
            </div>
          )}
          
          {/* Customer details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Full Name</label>
              <input className="w-full border rounded px-3 py-2" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Email</label>
              <input className="w-full border rounded px-3 py-2" type="email" value={customer.email} onChange={e => setCustomer({ ...customer, email: e.target.value })} placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Phone</label>
              <input className="w-full border rounded px-3 py-2" value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} placeholder="10-digit mobile" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">GSTIN (optional)</label>
              <input className="w-full border rounded px-3 py-2" value={customer.gstin} onChange={e => setCustomer({ ...customer, gstin: e.target.value })} placeholder="22AAAAA0000A1Z5" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Address line 1</label>
              <input className="w-full border rounded px-3 py-2" value={customer.address1} onChange={e => setCustomer({ ...customer, address1: e.target.value })} placeholder="House, street" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Address line 2</label>
              <input className="w-full border rounded px-3 py-2" value={customer.address2} onChange={e => setCustomer({ ...customer, address2: e.target.value })} placeholder="Area, landmark (optional)" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">City</label>
              <input className="w-full border rounded px-3 py-2" value={customer.city} onChange={e => setCustomer({ ...customer, city: e.target.value })} placeholder="City" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">State</label>
              <input className="w-full border rounded px-3 py-2" value={customer.state} onChange={e => setCustomer({ ...customer, state: e.target.value })} placeholder="State" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Pincode</label>
              <input className="w-full border rounded px-3 py-2" value={customer.pincode} onChange={e => setCustomer({ ...customer, pincode: e.target.value })} placeholder="6-digit PIN" />
            </div>
          </div>

          <div className="space-y-4">
            <button 
              disabled={busy || !scriptLoaded || cart.total <= 0} 
              onClick={() => handleRazorpayPayment(grandTotal)}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Pay {formatPrice(grandTotal)} with Razorpay
            </button>
          </div>
          
          {orderId && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm">
                Order ID: <code className="bg-gray-100 px-1 py-0.5 rounded">{orderId}</code> · 
                <Link href={`/orders/${orderId}`} className="text-blue-600 hover:underline ml-1">
                  View status
                </Link>
              </p>
            </div>
          )}
          
          {message && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg">
              <p className="text-sm">{message}</p>
            </div>
          )}
          
          <div className="mt-8 text-center">
            <Link
              href={tenantKey ? SITE_URLS.products(tenantKey) : '/products'}
              className="text-blue-600 hover:underline"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
