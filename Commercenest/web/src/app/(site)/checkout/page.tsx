"use client"

import { useState, useEffect } from 'react'
import { useCart, formatPrice } from '@/lib/cart'
import { tenantPath } from '@/lib/tenantClient'
import Link from 'next/link'
import { Playfair_Display } from 'next/font/google'

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
  on: (event: 'payment.failed', handler: (response: RazorpayFailure) => void) => void
  on: (event: string, handler: (response: unknown) => void) => void
  open: () => void
  close: () => void
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance
  }
}

export default function CheckoutPage() {
  const { state: cart } = useCart()
  const [orderId, setOrderId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  // test | live mode toggle (defaults to test)
  const [mode, setMode] = useState<'test' | 'live'>('test')

  // Load Razorpay script
  useEffect(() => {
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
      const res = await fetch('/api/checkout', { 
        method: 'POST', 
        headers: { 'content-type': 'application/json' }, 
        body: JSON.stringify({ amountPaise, mode }) 
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
          name: "Customer",
          email: "customer@example.com",
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

  async function createTestOrder() {
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch('/api/checkout', { 
        method: 'POST', 
        headers: { 'content-type': 'application/json' }, 
        body: JSON.stringify({ amountPaise: 100, mode }) 
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

  async function simulatePayment() {
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
              
              <div className="mt-4 flex justify-between items-center font-bold">
                <span>Total</span>
                <span className="text-blue-600">{formatPrice(cart.total)}</span>
              </div>
            </div>
          ) : (
            <div className="text-center mb-8">
              <p className="text-gray-600 mb-4">Your cart is empty. Add some products before checkout.</p>
              <Link 
                href={tenantPath('/products')}
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Products
              </Link>
            </div>
          )}
          
          <div className="space-y-4">
            {/* Mode selector */}
            <div className="flex items-center gap-4 mb-2">
              <span className="text-sm font-medium text-gray-700">Mode:</span>
              <label className="flex items-center gap-1 text-sm text-gray-600">
                <input
                  type="radio"
                  name="rzp-mode"
                  value="test"
                  checked={mode === 'test'}
                  onChange={() => setMode('test')}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                Test
              </label>
              <label className="flex items-center gap-1 text-sm text-gray-600">
                <input
                  type="radio"
                  name="rzp-mode"
                  value="live"
                  checked={mode === 'live'}
                  onChange={() => setMode('live')}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                Live
              </label>
            </div>

            <button 
              disabled={busy || !scriptLoaded} 
              onClick={() => handleRazorpayPayment(100)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Pay ₹1 with Razorpay
            </button>
            
            {cart.total > 0 && (
              <button 
                disabled={busy || !scriptLoaded} 
                onClick={() => handleRazorpayPayment(cart.total)}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Pay {formatPrice(cart.total)} with Razorpay
              </button>
            )}
            
            <div className="border-t pt-6 mt-6">
              <p className="text-sm text-gray-500 mb-4">Development Options:</p>
              <div className="flex flex-wrap gap-2">
                <button 
                  disabled={busy} 
                  onClick={createTestOrder}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm disabled:opacity-50"
                >
                  Create test order
                </button>
                
                <button 
                  disabled={busy || !orderId} 
                  onClick={simulatePayment}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm disabled:opacity-50"
                >
                  Simulate payment
                </button>
              </div>
            </div>
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
              href={tenantPath('/products')}
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
