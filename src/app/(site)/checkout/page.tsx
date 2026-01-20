"use client"

import { useState, useEffect } from 'react'
import { useCart, formatPrice, formatPriceWithPaise } from '@/lib/cart'
import Link from 'next/link'
import { Playfair_Display } from 'next/font/google'
import { useTenant } from '@/hooks/useTenant'
import { SITE_URLS } from '@/utils/site-urls'
import { useSupabaseSession } from '@/hooks/useSupabaseSession'

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
  const grandTotal = priceSummary.total > 0 ? priceSummary.total : cart.total
  const includedTax = priceSummary.tax > 0 ? priceSummary.tax : 0
  const baseAmount = priceSummary.base > 0 ? priceSummary.base : Math.max(grandTotal - includedTax, 0)
  
  // Wallet state
  const [useWallet, setUseWallet] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [walletUsedRupees, setWalletUsedRupees] = useState(0)
  const [cashbackPreview, setCashbackPreview] = useState<{
    eligible: boolean
    reason?: string
    profitPct: number
    cashbackPct: number
    cashbackAmount: number
  } | null>(null)
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    coupon_id: string
    discount_amount_cents: number
    discount_type: string
    discount_value: number
  } | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)

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
  
  // Load wallet balance when user is logged in
  useEffect(() => {
    const loadWalletBalance = async () => {
      if (!session?.user?.id) return
      
      try {
        const response = await fetch(`/api/wallet?customerId=${session.user.id}`)
        if (response.ok) {
          const data = await response.json()
          setWalletBalance(data.balance?.cents || 0)
        }
      } catch (error) {
        console.error('Failed to load wallet balance:', error)
      }
    }
    
    if (hydrated && session?.user?.id) {
      loadWalletBalance()
    }
  }, [hydrated, session?.user?.id])
  
  // Preview cashback when wallet usage or coupon changes
  useEffect(() => {
    const previewCashback = async () => {
      if (!session?.user?.id) {
        setCashbackPreview(null)
        return
      }
      
      // Calculate total after discount
      const orderTotalCents = Math.round(grandTotal * 100)
      const discountCents = appliedCoupon?.discount_amount_cents || 0
      const totalAfterDiscountCents = orderTotalCents - discountCents
      
      const totalCostCents = cart.items.reduce((sum, item) => {
        // Assuming cost price is 70% of sale price if not available
        const costCents = item.cost_price_cents || Math.round(item.price * 100 * 0.7)
        return sum + costCents * item.quantity
      }, 0)
      
      const walletUsedCents = useWallet ? Math.round(walletUsedRupees * 100) : 0
      // Cash paid = (Order Total - Discount) - Wallet Used
      const cashPaidCents = totalAfterDiscountCents - walletUsedCents
      
      if (cashPaidCents < 0) {
        setCashbackPreview(null)
        return
      }
      
      try {
        const response = await fetch('/api/wallet/preview-cashback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: session.user.id,
            totalSalePriceCents: totalAfterDiscountCents, // Use discounted price
            totalPurchasePriceCents: totalCostCents,
            walletUsedCents,
            cashPaidCents
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          setCashbackPreview(data)
        }
      } catch (error) {
        console.error('Error previewing cashback:', error)
      }
    }
    
    const debounce = setTimeout(previewCashback, 300)
    return () => clearTimeout(debounce)
  }, [walletUsedRupees, useWallet, grandTotal, cart.items, session?.user?.id, appliedCoupon])
  
  // Function to validate and apply coupon
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code')
      return
    }
    
    if (!session?.user?.id) {
      setCouponError('Please log in to use coupons')
      return
    }
    
    if (!tenant.id) {
      setCouponError('Tenant information not available')
      return
    }
    
    setValidatingCoupon(true)
    setCouponError(null)
    
    try {
      const orderTotalCents = Math.round(grandTotal * 100)
      
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupon_code: couponCode.trim().toUpperCase(),
          order_total_cents: orderTotalCents,
          customer_id: session.user.id,
          tenant_id: tenant.id
        })
      })
      
      const data = await response.json()
      
      if (data.valid) {
        setAppliedCoupon({
          code: couponCode.trim().toUpperCase(),
          coupon_id: data.coupon_id,
          discount_amount_cents: data.discount_amount_cents,
          discount_type: data.discount_type,
          discount_value: data.discount_value
        })
        setCouponError(null)
        setCouponCode('')
      } else {
        setCouponError(data.error || 'Invalid coupon')
        setAppliedCoupon(null)
      }
    } catch (error) {
      console.error('Error validating coupon:', error)
      setCouponError('Failed to validate coupon')
    } finally {
      setValidatingCoupon(false)
    }
  }
  
  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError(null)
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
      } catch (error) {
        if (controller.signal.aborted) return
        console.error('Failed to load tax quote', error)
        setPriceSummary({ total: cart.total, tax: 0, base: cart.total })
      }
    }

    loadQuote()
    return () => controller.abort()
  }, [cart.items, cart.total, hydrated])

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
          mode: 'test', 
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
            coupon_id: appliedCoupon.coupon_id,
            discount_amount_cents: appliedCoupon.discount_amount_cents
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
          {cart.items.length > 0 && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={`${playfair.className} text-xl font-bold text-gray-900`}>Discount Coupon</h3>
                    <p className="text-sm text-gray-600">Have a promo code? Apply it here</p>
                  </div>
                </div>

                {!appliedCoupon ? (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            applyCoupon()
                          }
                        }}
                        placeholder="Enter coupon code"
                        className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 uppercase font-mono"
                        maxLength={50}
                      />
                      <button
                        onClick={applyCoupon}
                        disabled={validatingCoupon || !couponCode.trim()}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {validatingCoupon ? 'Validating...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {couponError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-green-300">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="font-mono font-bold text-green-700">{appliedCoupon.code}</span>
                          <span className="text-sm text-gray-600">applied</span>
                        </div>
                        <p className="text-sm text-gray-700">
                          Discount: <span className="font-bold text-green-600">-{formatPrice(appliedCoupon.discount_amount_cents / 100)}</span>
                        </p>
                        {appliedCoupon.discount_type === 'percentage' && (
                          <p className="text-xs text-gray-500 mt-1">
                            {appliedCoupon.discount_value}% off applied
                          </p>
                        )}
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-red-600 hover:text-red-800 font-medium text-sm px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Wallet Payment Section - Optional */}
          {session?.user?.id && walletBalance > 0 && (
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
                      <p className="text-sm text-gray-600">Available: <span className="font-bold text-indigo-600">{formatPrice(walletBalance / 100)}</span></p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useWallet}
                      onChange={(e) => {
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
                          {formatPrice(walletUsedRupees)}
                        </span>
                      </div>
                      
                      <input
                        type="range"
                        min="0"
                        max={Math.min(walletBalance / 100, grandTotal - (appliedCoupon?.discount_amount_cents || 0) / 100)}
                        step="1"
                        value={walletUsedRupees}
                        onChange={(e) => setWalletUsedRupees(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>₹0</span>
                        <span>{formatPrice(Math.min(walletBalance / 100, grandTotal - (appliedCoupon?.discount_amount_cents || 0) / 100))}</span>
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
                          onClick={() => setWalletUsedRupees(Math.min(walletBalance / 100, grandTotal - (appliedCoupon?.discount_amount_cents || 0) / 100) / 2)}
                          className="flex-1 px-3 py-2 text-sm border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-indigo-400 transition-colors"
                        >
                          Half
                        </button>
                        <button
                          type="button"
                          onClick={() => setWalletUsedRupees(Math.min(walletBalance / 100, grandTotal - (appliedCoupon?.discount_amount_cents || 0) / 100))}
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
                          {formatPrice(walletUsedRupees)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {walletUsedRupees > 0 ? '⚠️ No cashback' : 'Not using wallet'}
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-green-200">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Cash Payment</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatPrice((grandTotal - (appliedCoupon?.discount_amount_cents || 0) / 100) - walletUsedRupees)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {((grandTotal - (appliedCoupon?.discount_amount_cents || 0) / 100) - walletUsedRupees) > 0 ? '✅ Earns cashback' : 'Fully covered'}
                        </p>
                      </div>
                    </div>

                    {/* Cashback Preview */}
                    {cashbackPreview && (
                      <div className={`rounded-lg p-4 shadow-sm ${
                        cashbackPreview.eligible 
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300' 
                          : 'bg-gray-50 border-2 border-gray-300'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg mb-1">
                              {cashbackPreview.eligible ? '🎉 Cashback Preview' : 'ℹ️ Cashback Status'}
                            </h4>
                            {cashbackPreview.eligible ? (
                              <>
                                <p className="text-sm text-gray-700">
                                  Profit: {cashbackPreview.profitPct.toFixed(1)}% → Cashback: {cashbackPreview.cashbackPct}%
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Calculated on cash paid only (₹{(grandTotal - walletUsedRupees).toFixed(2)})
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-gray-600">
                                {cashbackPreview.reason || 'No cashback available'}
                              </p>
                            )}
                          </div>
                          {cashbackPreview.eligible && (
                            <div className="text-right">
                              <p className="text-3xl font-bold text-green-600">
                                {formatPrice(cashbackPreview.cashbackAmount / 100)}
                              </p>
                              <p className="text-xs text-gray-500">To be credited</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Info Tip */}
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-900">
                        <strong>💡 Tip:</strong> Cashback is calculated ONLY on cash paid, not wallet amount. 
                        Use less wallet to maximize your cashback rewards!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <button 
              disabled={busy || !scriptLoaded || grandTotal <= 0} 
              onClick={() => {
                const totalAfterDiscount = grandTotal - (appliedCoupon?.discount_amount_cents || 0) / 100
                const finalAmount = totalAfterDiscount - (useWallet ? walletUsedRupees : 0)
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
                    const totalAfterDiscount = grandTotal - (appliedCoupon?.discount_amount_cents || 0) / 100
                    const finalAmount = totalAfterDiscount - (useWallet ? walletUsedRupees : 0)
                    
                    if (appliedCoupon && useWallet && walletUsedRupees > 0) {
                      return `Pay ${formatPrice(finalAmount)}`
                    } else if (useWallet && walletUsedRupees > 0) {
                      return <>Pay {formatPrice(finalAmount)} + Use {formatPrice(walletUsedRupees)} Wallet</>
                    } else if (appliedCoupon) {
                      return `Pay ${formatPrice(finalAmount)} (${appliedCoupon.discount_value}% off applied)`
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
