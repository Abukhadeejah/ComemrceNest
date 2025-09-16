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
  const { state: cart, clearCart } = useCart()
  const tenant = useTenant()
  const [hydrated, setHydrated] = useState(false)
  const [tenantKey, setTenantKey] = useState<string | null>(null)

  // Get tenant key from URL path or cookies (avoid hydration mismatch)
  useEffect(() => {
    const getTenantKey = (): string | null => {
      // First try URL path
      const pathSegments = window.location.pathname.split('/').filter(Boolean)
      if (pathSegments.length > 0 && (pathSegments[0] === 'bluebell' || pathSegments[0] === 'senlysh')) {
        return pathSegments[0]
      }
      
      // Fallback to cookies if URL path doesn't have tenant
      const cookies = document.cookie || ''
      const tenantCookie = /(?:^|; )tenant=([^;]+)/.exec(cookies)?.[1]
      if (tenantCookie === 'bluebell' || tenantCookie === 'senlysh') {
        return tenantCookie
      }
      return null
    }

    setTenantKey(getTenantKey())
  }, [])
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
  const [addresses, setAddresses] = useState<Array<{
    id: string
    full_name?: string
    phone?: string
    email?: string
    address_line_1?: string
    address_line_2?: string
    city: string
    state: string
    postal_code?: string
    gstin?: string
    is_default: boolean
  }>>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [saveAsDefault, setSaveAsDefault] = useState(false)

  // GST rate from tenant config (default 0)
  const gstRatePercent = tenant.pricing?.gstRatePercent ?? 0
  const gstAmount = Math.round(cart.total * (gstRatePercent / 100))
  const grandTotal = cart.total + gstAmount

  // Load existing addresses and user profile
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Load user profile first
        const profileResponse = await fetch('/api/customers/profile', { credentials: 'include' })
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          if (profileData.customer) {
            // Pre-populate customer data with logged-in user's info
            setCustomer(prev => ({
              ...prev,
              name: profileData.customer.full_name || '',
              email: profileData.customer.email || '',
              phone: profileData.customer.phone || ''
            }))
          }
        }
        
        // Load addresses
        const response = await fetch('/api/customers/addresses', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          setAddresses(data.addresses || [])
          
          // Auto-select default address if available
          const defaultAddress = data.addresses?.find((addr: { is_default: boolean }) => addr.is_default)
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id)
            setCustomer(prev => ({
              ...prev,
              name: defaultAddress.full_name || prev.name,
              email: defaultAddress.email || prev.email,
              phone: defaultAddress.phone || prev.phone,
              address1: defaultAddress.address_line_1 || '',
              address2: defaultAddress.address_line_2 || '',
              city: defaultAddress.city || '',
              state: defaultAddress.state || '',
              pincode: defaultAddress.postal_code || '',
              gstin: defaultAddress.gstin || ''
            }))
          }
        }
      } catch (error) {
        console.error('Failed to load user data:', error)
      }
    }
    
    if (hydrated) {
      loadUserData()
    }
  }, [hydrated])

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

  const handleAddressSelection = (addressId: string) => {
    setSelectedAddressId(addressId)
    setShowNewAddressForm(false)
    
    const selectedAddress = addresses.find(addr => addr.id === addressId)
    if (selectedAddress) {
      setCustomer({
        name: selectedAddress.full_name || '',
        email: selectedAddress.email || '',
        phone: selectedAddress.phone || '',
        address1: selectedAddress.address_line_1 || '',
        address2: selectedAddress.address_line_2 || '',
        city: selectedAddress.city || '',
        state: selectedAddress.state || '',
        pincode: selectedAddress.postal_code || '',
        gstin: selectedAddress.gstin || ''
      })
    }
  }

  const _handleNewAddress = async () => {
    if (saveAsDefault) {
      // Create new address and save as default
      try {
        const response = await fetch('/api/customers/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            full_name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address_line_1: customer.address1,
            address_line_2: customer.address2,
            city: customer.city,
            state: customer.state,
            postal_code: customer.pincode,
            gstin: customer.gstin,
            is_default: true
          })
        })
        
        if (response.ok) {
          // Reload addresses to get the new one
          const addressesResponse = await fetch('/api/customers/addresses', { credentials: 'include' })
          if (addressesResponse.ok) {
            const data = await addressesResponse.json()
            setAddresses(data.addresses || [])
            setSelectedAddressId(data.addresses?.[0]?.id || null)
          }
        }
      } catch (error) {
        console.error('Failed to save address:', error)
      }
    }
  }

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
          // Clear cart after successful payment
          clearCart()
          
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
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <h1 className={`${playfair.className} text-4xl font-bold text-gray-900 mb-2 text-center`}>Checkout</h1>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mt-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-1/3" />
              <div className="h-4 bg-gray-100 rounded-lg w-full" />
              <div className="h-4 bg-gray-100 rounded-lg w-5/6" />
              <div className="h-4 bg-gray-100 rounded-lg w-2/3" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="text-center mb-8">
          <h1 className={`${playfair.className} text-4xl font-bold text-gray-900 mb-3`}>Checkout</h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full"></div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {cart.items.length > 0 ? (
            <div className="mb-8">
              <h2 className={`${playfair.className} text-2xl font-bold text-gray-900 mb-6 text-center`}>Your Order</h2>
              
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">{item.name}</span>
                      <span className="text-gray-500 ml-2">× {item.quantity}</span>
                    </div>
                    <span className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              
              <div className="bg-blue-50 rounded-xl p-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">{formatPrice(cart.total)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">GST ({gstRatePercent}%)</span>
                  <span className="font-semibold text-gray-900">{formatPrice(gstAmount)}</span>
                </div>
                <div className="border-t border-blue-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-blue-600">{formatPrice(grandTotal)}</span>
                  </div>
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
          
          {/* Delivery Information - Amazon Style */}
          <div className="mb-8">
            <h3 className={`${playfair.className} text-xl font-bold text-gray-900 mb-6 text-center`}>Delivery Information</h3>
            
            {/* Address Selection */}
            {addresses.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Select Delivery Address</h4>
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <div 
                      key={address.id}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                        selectedAddressId === address.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleAddressSelection(address.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <input 
                              type="radio" 
                              checked={selectedAddressId === address.id}
                              onChange={() => handleAddressSelection(address.id)}
                              className="text-blue-600"
                            />
                            <span className="font-semibold text-gray-900">{address.full_name}</span>
                            {address.is_default && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Default</span>
                            )}
                          </div>
                          <p className="text-gray-700">{address.address_line_1}</p>
                          {address.address_line_2 && <p className="text-gray-700">{address.address_line_2}</p>}
                          <p className="text-gray-700">{address.city}, {address.state} {address.postal_code}</p>
                          <p className="text-gray-600 text-sm">Phone: {address.phone}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {showNewAddressForm ? 'Cancel' : '+ Add new address'}
                  </button>
                </div>
              </div>
            )}

            {/* New Address Form */}
            {(showNewAddressForm || addresses.length === 0) && (
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  {addresses.length === 0 ? 'Add Delivery Address' : 'New Address'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                    <input 
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" 
                      value={customer.name} 
                      onChange={e => setCustomer({ ...customer, name: e.target.value })} 
                      placeholder="Your full name" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                    <input 
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" 
                      type="email" 
                      value={customer.email} 
                      onChange={e => setCustomer({ ...customer, email: e.target.value })} 
                      placeholder="you@example.com" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                    <input 
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" 
                      value={customer.phone} 
                      onChange={e => setCustomer({ ...customer, phone: e.target.value })} 
                      placeholder="10-digit mobile number" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">GSTIN (optional)</label>
                    <input 
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" 
                      value={customer.gstin} 
                      onChange={e => setCustomer({ ...customer, gstin: e.target.value })} 
                      placeholder="22AAAAA0000A1Z5" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address line 1 *</label>
                    <input 
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" 
                      value={customer.address1} 
                      onChange={e => setCustomer({ ...customer, address1: e.target.value })} 
                      placeholder="House number, street name" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address line 2</label>
                    <input 
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" 
                      value={customer.address2} 
                      onChange={e => setCustomer({ ...customer, address2: e.target.value })} 
                      placeholder="Area, landmark (optional)" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
                    <input 
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" 
                      value={customer.city} 
                      onChange={e => setCustomer({ ...customer, city: e.target.value })} 
                      placeholder="City" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">State *</label>
                    <input 
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" 
                      value={customer.state} 
                      onChange={e => setCustomer({ ...customer, state: e.target.value })} 
                      placeholder="State" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode *</label>
                    <input 
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200" 
                      value={customer.pincode} 
                      onChange={e => setCustomer({ ...customer, pincode: e.target.value })} 
                      placeholder="6-digit pincode" 
                    />
                  </div>
                </div>
                
                {addresses.length > 0 && (
                  <div className="mt-4">
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={saveAsDefault}
                        onChange={e => setSaveAsDefault(e.target.checked)}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Save as default address</span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <button 
              disabled={busy || !scriptLoaded || cart.total <= 0} 
              onClick={() => handleRazorpayPayment(grandTotal)}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {busy ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Payment...
                </div>
              ) : (
                `Pay ${formatPrice(grandTotal)} with Razorpay`
              )}
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
