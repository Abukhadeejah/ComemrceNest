"use client"

import { useState, useEffect } from 'react'
import { useCart, formatPrice, formatPriceWithPaise } from '@/lib/cart'
import Link from 'next/link'
import { Playfair_Display } from 'next/font/google'
import { useTenant } from '@/hooks/useTenant'
import { SITE_URLS } from '@/utils/site-urls'
import { useSupabaseSession } from '@/hooks/useSupabaseSession'
import CouponSelector from '@/components/checkout/CouponSelector'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700','800','900'] })

// Payment provider types
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
  const { data: session } = useSupabaseSession()
  const [hydrated, setHydrated] = useState(false)
  const [tenantKey, setTenantKey] = useState<string | null>(null)
  type PriceSummary = { total: number; tax: number; base: number }
  const [priceSummary, setPriceSummary] = useState<PriceSummary>({ total: 0, tax: 0, base: 0 })
  const [productPrices, setProductPrices] = useState<Array<{ lineIndex: number; productId: string; priceCents: number; quantity: number; lineTotalCents: number }>>([])
  const grandTotal = priceSummary.total > 0 ? priceSummary.total : cart.total
  const includedTax = priceSummary.tax > 0 ? priceSummary.tax : 0
  const baseAmount = priceSummary.base > 0 ? priceSummary.base : Math.max(grandTotal - includedTax, 0)
  
  // Wallet state
  const [useWallet, setUseWallet] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [walletUsedRupees, setWalletUsedRupees] = useState(0)
  
  // Membership state
  const [membershipStatus, setMembershipStatus] = useState<{
    isActive: boolean
    membershipType: 'FREE' | 'PREMIUM' | null
    needsUpgrade: boolean
  }>({
    isActive: false,
    membershipType: null,
    needsUpgrade: true
  })
  
  // Coupon state - simplified for CouponSelector
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    discount: number
    description?: string
    id: string
  } | null>(null)

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
  const [paymentProvider, setPaymentProvider] = useState<'razorpay' | 'phonepe' | null>(null)
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
  
  // Load wallet balance and membership status when user is logged in
  useEffect(() => {
    const loadWalletAndMembership = async () => {
      if (!session?.user?.id) return
      
      try {
        // Add cache-busting parameter to ensure fresh data
        const response = await fetch(`/api/customers/wallet?t=${Date.now()}`, { 
          credentials: 'include',
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        if (response.ok) {
          const data = await response.json()
          // Store balance in cents (as expected by formatPrice function)
          const balanceCents = data.wallet?.balance_cents || 0
          console.log('[Checkout] Wallet API response:', { balance_cents: balanceCents })
          setWalletBalance(balanceCents)
        }

        // Load membership status
        const membershipResponse = await fetch('/api/customers/membership/status', {
          credentials: 'include',
          cache: 'no-cache'
        })
        
        if (membershipResponse.ok) {
          const membershipData = await membershipResponse.json()
          setMembershipStatus({
            isActive: membershipData.membership?.isActive || false,
            membershipType: membershipData.membership?.membershipType || null,
            needsUpgrade: membershipData.membership?.needsUpgrade || true
          })
          console.log('[Checkout] Membership status:', membershipData.membership)
        }
      } catch (error) {
        console.error('Failed to load wallet/membership data:', error)
      }
    }
    
    if (hydrated && session?.user?.id) {
      loadWalletAndMembership()
    }
  }, [hydrated, session?.user?.id])
  
  // Coupon handlers for CouponSelector
  const handleCouponSelected = (discount: { amount: number; code: string; description?: string; id: string }) => {
    // Clear wallet usage when coupon is applied (mutual exclusivity)
    setUseWallet(false)
    setWalletUsedRupees(0)
    
    setAppliedCoupon({
      code: discount.code,
      discount: discount.amount,
      description: discount.description,
      id: discount.id
    })
  }

  const handleCouponRemoved = () => {
    setAppliedCoupon(null)
  }

  // Set hydrated state and load Razorpay if needed
  useEffect(() => {
    setHydrated(true)
    
    // Determine payment provider based on tenant config
    const provider = tenant.payments?.provider || 'razorpay'
    console.log('[Checkout] Payment provider detection:', { 
      tenantKey: tenant.key, 
      provider, 
      configuredProvider: tenant.payments?.provider 
    })
    setPaymentProvider(provider as 'razorpay' | 'phonepe')
    
    // Load Razorpay script only if needed
    if (provider === 'razorpay') {
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
        if (document.body.contains(script)) {
          document.body.removeChild(script)
        }
      }
    } else {
      // PhonePe doesn't need a script
      console.log('[Checkout] PhonePe mode - no script needed')
      setScriptLoaded(true)
    }
  }, [tenant])

  // Keep price summary in sync with cart items with server-side tax
  useEffect(() => {
    if (!hydrated) return
    if (!cart.items.length) {
      setPriceSummary({ total: 0, tax: 0, base: 0 })
      setProductPrices([])
      return
    }

    const controller = new AbortController()
    const loadQuote = async () => {
      try {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            mode: 'quote',
            tenantKey: tenantKey || tenant.key,
            items: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPriceCents: item.price,
            })),
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          setPriceSummary({ total: cart.total, tax: 0, base: cart.total })
          setProductPrices([])
          return
        }

        const json = await response.json()
        const totals = json?.totals || {}
        const totalCents = Number(totals.totalCents) || cart.total
        const taxCents = Number(totals.taxCents) || 0
        setPriceSummary({
          total: totalCents,
          tax: taxCents,
          base: Number(totals.baseSubtotalCents) || Math.max(totalCents - taxCents, 0),
        })
        // Store product prices from API response
        setProductPrices(totals.productPrices || [])
      } catch (error) {
        if (controller.signal.aborted) return
        console.error('Failed to load tax quote', error)
        setPriceSummary({ total: cart.total, tax: 0, base: cart.total })
        setProductPrices([])
      }
    }

    loadQuote()
    return () => controller.abort()
  }, [cart.items, cart.total, hydrated, tenantKey, tenant.key])

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

  const handleNewAddress = async () => {
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

  async function handlePayment(amountPaise: number) {
    setBusy(true)
    setMessage(null)
    
    // Save address if needed
    if (saveAsDefault && showNewAddressForm) {
      await handleNewAddress()
    }
    
    try {
      // Create order via API
      const validItems = cart.items.filter(it => typeof it.productId === 'string' && it.productId.length >= 32)
      const res = await fetch('/api/checkout', { 
        method: 'POST', 
        headers: { 'content-type': 'application/json' }, 
        body: JSON.stringify({ 
          amountPaise, 
          mode: 'payment', 
          tenantKey: tenantKey || tenant.key,
          customer,
          items: validItems.map(it => ({
            productId: it.productId,
            quantity: it.quantity,
            unitPriceCents: it.price
          })),
          // Include wallet information if being used
          ...(useWallet && walletUsedRupees > 0 && {
            walletUsedRupees,
            customerId: session?.user?.id
          }),
          // Include coupon information if applied
          ...(appliedCoupon && {
            coupon_code: appliedCoupon.code,
            coupon_id: appliedCoupon.id,
            discount_amount_cents: Math.round(appliedCoupon.discount * 100)
          })
        }) 
      })
      
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json?.error || 'Checkout failed')
      }
      
      const data = await res.json()
      console.log('[Checkout] API Response:', data)
      
      // Handle based on provider
      if (data.provider === 'phonepe') {
        console.log('[Checkout] PhonePe flow - redirecting to:', data.redirectUrl)
        if (!data.redirectUrl) {
          throw new Error('Invalid PhonePe response')
        }
        setOrderId(data.orderId)
        clearCart()
        window.location.href = data.redirectUrl
      } else if (data.provider === 'razorpay') {
        console.log('[Checkout] Razorpay flow - opening modal')
        if (!data.order?.id || !data.keyId) {
          throw new Error('Invalid Razorpay response')
        }
        setOrderId(data.order.id)
        await openRazorpayModal(data.order.id, data.keyId, amountPaise)
      } else {
        console.error('[Checkout] Unknown provider:', data.provider)
        throw new Error(`Unknown payment provider: ${data.provider}`)
      }
      
    } catch (e) {
      const err = e as Error
      setMessage(err.message || 'Failed to process payment')
      setBusy(false)
    }
  }

  async function openRazorpayModal(orderId: string, keyId: string, amountPaise: number) {
    if (!window.Razorpay) {
      throw new Error('Razorpay SDK not loaded')
    }

    const options: RazorpayOptions = {
      key: keyId,
      amount: amountPaise,
      currency: "INR",
      name: "CommerceNest",
      description: `Order #${orderId}`,
      order_id: orderId,
      prefill: {
        name: customer.name || "Customer",
        email: customer.email || "customer@example.com",
        contact: customer.phone || undefined,
      },
      theme: {
        color: "#3399cc"
      },
      handler: function (response) {
        clearCart()
        setMessage(
          `Payment successful! ID: ${response.razorpay_payment_id}. Redirecting...`
        )
        window.location.href = `/orders/${orderId}`
      }
    }

    const razorpay = new window.Razorpay(options)
    
    razorpay.on('payment.failed', function(response) {
      setMessage(`Payment failed: ${response.error.description}`)
      setBusy(false)
    })
    
    razorpay.open()
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
                {cart.items.map((item, idx) => {
                  // Use server-validated price aligned by line index; fallback to cart price
                  const productPrice = productPrices.find(p => p.lineIndex === idx)
                  const displayPrice = productPrice?.priceCents ?? item.price
                  const displayTotal = displayPrice * item.quantity
                  
                  return (
                    <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
                      <div className="flex-1">
                        <span className="font-semibold text-gray-900">{item.name}</span>
                        <span className="text-gray-500 ml-2">× {item.quantity}</span>
                      </div>
                      <span className="font-bold text-gray-900">{formatPrice(displayTotal)}</span>
                    </div>
                  )
                })}
              </div>
              
              <div className="bg-blue-50 rounded-xl p-6 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Order Total (tax-inclusive)</span>
                  <span className="text-2xl font-bold text-blue-600">{formatPrice(grandTotal)}</span>
                </div>
                {includedTax > 0 && (
                  <>
                    <div className="flex justify-between items-center text-sm text-gray-700">
                      <span>Base (excl. GST)</span>
                      <span>{formatPriceWithPaise(baseAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-700">
                      <span>Includes GST</span>
                      <span>{formatPriceWithPaise(includedTax)}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Prices follow India MRP norms — GST is already included; no extra tax will be added at payment.
                    </p>
                  </>
                )}
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

          {/* Coupon Section */}
          {cart.items.length > 0 && !useWallet && (
            <div className="mb-8">
              <CouponSelector
                orderTotal={grandTotal / 100} // Convert cents to rupees
                onCouponSelected={handleCouponSelected}
                onCouponRemoved={handleCouponRemoved}
                selectedCoupon={appliedCoupon}
              />
            </div>
          )}

          {/* Membership Status Notice */}
          {session?.user?.id && !membershipStatus.isActive && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border-2 border-orange-200">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className={`${playfair.className} text-xl font-bold text-gray-900 mb-2`}>Membership Required for Cashback</h3>
                    <p className="text-sm text-gray-700 mb-4">
                      Only members earn cashback on purchases. You can still use discount coupons, but cashback rewards require an active membership.
                    </p>
                    <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-sm hover:shadow-md">
                      Get Premium Membership
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Wallet Payment Section - Optional */}
          {session?.user?.id && walletBalance > 0 && !appliedCoupon && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`${playfair.className} text-xl font-bold text-gray-900`}>Use Wallet Balance</h3>
                      <p className="text-sm text-gray-600">Available: <span className="font-bold text-indigo-600">{formatPrice(walletBalance)}</span></p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useWallet}
                      onChange={(e) => {
                        if (e.target.checked && appliedCoupon) {
                          // Clear coupon when wallet is enabled (mutual exclusivity)
                          setAppliedCoupon(null)
                        }
                        setUseWallet(e.target.checked)
                        if (!e.target.checked) {
                          setWalletUsedRupees(0)
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {useWallet && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Wallet Slider */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-sm font-semibold text-gray-700">
                          Amount from wallet
                        </label>
                        <span className="text-xl font-bold text-indigo-600">
                          ₹{walletUsedRupees.toFixed(2)}
                        </span>
                      </div>
                      
                      <input
                        type="range"
                        min="0"
                        max={Math.min(walletBalance / 100, grandTotal / 100)}
                        step="1"
                        value={walletUsedRupees}
                        onChange={(e) => setWalletUsedRupees(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>₹0</span>
                        <span>{formatPrice(Math.min(walletBalance, grandTotal))}</span>
                      </div>

                      {/* Quick Select Buttons */}
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => setWalletUsedRupees(0)}
                          className="flex-1 px-3 py-2 text-sm border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-indigo-400 transition-colors"
                        >
                          None
                        </button>
                        <button
                          type="button"
                          onClick={() => setWalletUsedRupees(Math.min(walletBalance / 100, grandTotal / 100) / 2)}
                          className="flex-1 px-3 py-2 text-sm border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-indigo-400 transition-colors"
                        >
                          Half
                        </button>
                        <button
                          type="button"
                          onClick={() => setWalletUsedRupees(Math.min(walletBalance / 100, grandTotal / 100))}
                          className="flex-1 px-3 py-2 text-sm border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-indigo-400 transition-colors"
                        >
                          Max
                        </button>
                      </div>
                    </div>

                    {/* Payment Split Visualization */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-indigo-200">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Wallet Payment</p>
                        <p className="text-2xl font-bold text-indigo-600">
                          ₹{walletUsedRupees.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {walletUsedRupees > 0 ? '⚠️ No cashback' : 'Not using wallet'}
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-green-200">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Cash Payment</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatPrice(grandTotal - (walletUsedRupees * 100))}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(grandTotal - (walletUsedRupees * 100)) > 0 
                            ? (membershipStatus.isActive 
                                ? '✅ Earns cashback' 
                                : '❌ No cashback (membership required)')
                            : 'Fully covered'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mutual Exclusivity Notice */}
          {session?.user?.id && walletBalance > 0 && appliedCoupon && (
            <div className="mb-8">
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-yellow-800 mb-1">Coupon Applied</h4>
                    <p className="text-sm text-yellow-700">
                      You can use either a coupon OR wallet balance, not both. 
                      <button 
                        onClick={() => setAppliedCoupon(null)}
                        className="text-yellow-800 underline hover:no-underline ml-1"
                      >
                        Remove coupon to use wallet
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {session?.user?.id && walletBalance > 0 && useWallet && (
            <div className="mb-8">
              <div className="bg-indigo-50 border-2 border-indigo-300 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-400 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-indigo-800 mb-1">Wallet Payment Active</h4>
                    <p className="text-sm text-indigo-700">
                      Coupons are disabled when using wallet balance. 
                      <button 
                        onClick={() => {
                          setUseWallet(false)
                          setWalletUsedRupees(0)
                        }}
                        className="text-indigo-800 underline hover:no-underline ml-1"
                      >
                        Disable wallet to use coupons
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <button 
              disabled={busy || !scriptLoaded || grandTotal <= 0} 
              onClick={() => {
                const finalAmount = grandTotal - (useWallet ? walletUsedRupees * 100 : 0)
                handlePayment(finalAmount > 0 ? finalAmount : 0)
              }}
              className={`w-full text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                paymentProvider === 'phonepe' 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
              }`}
            >
              {busy ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {paymentProvider === 'phonepe' ? 'Redirecting to PhonePe...' : 'Processing Payment...'}
                </div>
              ) : (
                <>
                  {(() => {
                    const finalAmount = grandTotal - (useWallet ? walletUsedRupees * 100 : 0)
                    
                    if (useWallet && walletUsedRupees > 0) {
                      if (finalAmount <= 0) {
                        return `Complete Order (Fully Paid with Wallet)`
                      } else {
                        return `Pay ${formatPrice(finalAmount)} + Use ₹${walletUsedRupees.toFixed(2)} Wallet`
                      }
                    } else if (appliedCoupon) {
                      const discountedAmount = grandTotal - Math.round(appliedCoupon.discount * 100)
                      return `Pay ${formatPrice(discountedAmount)} (Coupon Applied)`
                    } else {
                      return `Pay ${formatPrice(grandTotal)} with ${paymentProvider === 'phonepe' ? 'PhonePe' : 'Razorpay'}`
                    }
                  })()}
                </>
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
