'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type ProductResult = {
  id: string
  name: string
  sku: string | null
  price_cents: number
  stock: number
  track_inventory: boolean | null
  has_variants?: boolean | null
  status: string
  hero_image_url?: string | null
  variants?: Array<{
    id: string
    name: string
    sku: string | null
    price_cents: number
    stock: number | null
    track_inventory: boolean | null
  }>
}

type SelectedLineItem = {
  lineKey: string
  productId: string
  name: string
  sku: string | null
  unitPriceCents: number
  quantity: number
  stock: number
  trackInventory: boolean | null
  variantId?: string | null
  variantName?: string | null
  heroImageUrl?: string | null
}

type CustomerInfo = {
  id: string
  email: string
  phone: string | null
  first_name: string | null
  last_name: string | null
  has_online_access?: boolean
}

// GUARDRAIL: Client-side email validation (must match server validation)
function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

type RecentOrder = {
  id: string
  order_number: string
  status: string
  total_cents: number
  created_at: string
}

interface OfflineOrderCreateFormProps {
  tenant?: string
  ordersBasePath: string
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format((cents || 0) / 100)
}

function toCents(rupees: string): number {
  const value = Number(rupees)
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.round(value * 100)
}

function toRupeesString(cents: number): string {
  return ((cents || 0) / 100).toFixed(2)
}

export default function OfflineOrderCreateForm({
  tenant,
  ordersBasePath,
}: OfflineOrderCreateFormProps) {
  const router = useRouter()
  const orderDetailBasePath = ordersBasePath.replace(/\/orders$/, '/order-details')

  const [customerPhone, setCustomerPhone] = useState('')
  const [createCustomerPhone, setCreateCustomerPhone] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerInfo | null>(null)
  const [walletBalanceCents, setWalletBalanceCents] = useState(0)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [duplicateCustomers, setDuplicateCustomers] = useState<CustomerInfo[]>([])

  const [createCustomerName, setCreateCustomerName] = useState('')
  const [createCustomerEmail, setCreateCustomerEmail] = useState('')
  const [createOnlineAccess, setCreateOnlineAccess] = useState(false)
  const [createCustomerPassword, setCreateCustomerPassword] = useState('')
  const [createCustomerConfirmPassword, setCreateCustomerConfirmPassword] = useState('')

  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState<ProductResult[]>([])
  const [lineItems, setLineItems] = useState<SelectedLineItem[]>([])
  const [selectedVariantByProduct, setSelectedVariantByProduct] = useState<Record<string, string>>({})

  const [discountRupees, setDiscountRupees] = useState('0')
  const [walletUsedRupees, setWalletUsedRupees] = useState('0')
  const [orderStatus, setOrderStatus] = useState<'paid' | 'pending'>('paid')

  const [lookupMessage, setLookupMessage] = useState('')
  const [validationMessage, setValidationMessage] = useState('')
  const [submitMessage, setSubmitMessage] = useState('')

  const [isLookingUp, setIsLookingUp] = useState(false)
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)
  const [isSearchingProducts, setIsSearchingProducts] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const subtotalCents = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0),
    [lineItems]
  )

  const discountCents = useMemo(() => {
    const raw = toCents(discountRupees)
    return Math.min(raw, subtotalCents)
  }, [discountRupees, subtotalCents])

  const totalCents = useMemo(() => Math.max(0, subtotalCents - discountCents), [subtotalCents, discountCents])

  const walletUsedCents = useMemo(() => {
    const raw = toCents(walletUsedRupees)
    return Math.min(raw, totalCents, walletBalanceCents)
  }, [walletUsedRupees, totalCents, walletBalanceCents])

  useEffect(() => {
    setSelectedVariantByProduct((prev) => {
      const next = { ...prev }

      for (const product of productResults) {
        if (!product.has_variants || !product.variants || product.variants.length === 0) {
          delete next[product.id]
          continue
        }

        if (!next[product.id] || !product.variants.some((variant) => variant.id === next[product.id])) {
          next[product.id] = product.variants[0].id
        }
      }

      return next
    })
  }, [productResults])

  useEffect(() => {
    if (walletBalanceCents <= 0 && Number(walletUsedRupees) !== 0) {
      setWalletUsedRupees('0')
    }
  }, [walletBalanceCents, walletUsedRupees])

  useEffect(() => {
    const raw = toCents(walletUsedRupees)
    const maxWalletAllowedCents = Math.min(totalCents, walletBalanceCents)
    if (raw > maxWalletAllowedCents) {
      setWalletUsedRupees(toRupeesString(maxWalletAllowedCents))
    }
  }, [walletUsedRupees, totalCents, walletBalanceCents])

  const cashPaidCents = useMemo(() => {
    if (orderStatus === 'pending') return 0
    return Math.max(0, totalCents - walletUsedCents)
  }, [orderStatus, totalCents, walletUsedCents])

  async function lookupCustomerByPhone() {
    setLookupMessage('')
    setValidationMessage('')
    setSubmitMessage('')
    setDuplicateCustomers([])
    setRecentOrders([])

    const lookupQuery = customerPhone.trim()
    if (!lookupQuery) {
      setValidationMessage('Enter phone or name first.')
      return
    }

    setIsLookingUp(true)
    try {
      const response = await fetch(`/api/admin/customers/by-phone?q=${encodeURIComponent(lookupQuery)}`)
      const data = await response.json()

      if (response.status === 409 && (data.error === 'duplicate_phone' || data.error === 'multiple_customers')) {
        setSelectedCustomer(null)
        setWalletBalanceCents(0)
        setDuplicateCustomers(data.customers || [])
        setLookupMessage('Multiple customers found. Please choose the right customer data before continuing.')
        return
      }

      if (!response.ok) {
        setSelectedCustomer(null)
        setWalletBalanceCents(0)
        setLookupMessage(data.message || data.error || 'Customer lookup failed')
        return
      }

      if (!data.found) {
        setSelectedCustomer(null)
        setWalletBalanceCents(0)
        setLookupMessage('Customer not found. You can create one below.')
        return
      }

      setSelectedCustomer(data.customer)
      setWalletBalanceCents(data.walletBalanceCents || 0)
      setRecentOrders(data.recentOrders || [])
      setCreateCustomerPhone(data.customer?.phone || '')
      setLookupMessage('Customer found and selected.')
    } catch {
      setLookupMessage('Network error while looking up customer.')
    } finally {
      setIsLookingUp(false)
    }
  }

  async function createCustomerInline() {
    setValidationMessage('')
    setSubmitMessage('')

    const normalizedCreatePhone = (createCustomerPhone || customerPhone).trim()
    if (!normalizedCreatePhone) {
      setValidationMessage('Phone is required to create customer.')
      return
    }

    const normalizedCreateEmail = createCustomerEmail.trim().toLowerCase()
    if (createOnlineAccess) {
      if (!normalizedCreateEmail) {
        setValidationMessage('Email is required to create online login access.')
        return
      }

      // GUARDRAIL: Validate email format on client before sending
      if (!isValidEmailFormat(normalizedCreateEmail)) {
        setValidationMessage('Enter a valid email address.')
        return
      }

      if (createCustomerPassword.length < 8) {
        setValidationMessage('Password must be at least 8 characters.')
        return
      }

      if (createCustomerPassword !== createCustomerConfirmPassword) {
        setValidationMessage('Password and confirm password do not match.')
        return
      }
    }

    setIsCreatingCustomer(true)
    try {
      const name = createCustomerName.trim()
      const [firstName, ...rest] = name.split(' ').filter(Boolean)
      const lastName = rest.join(' ')

      const response = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedCreatePhone,
          email: normalizedCreateEmail || undefined,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          createOnlineAccess,
          password: createOnlineAccess ? createCustomerPassword : undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        setValidationMessage(data.message || data.error || 'Failed to create customer')
        return
      }

      setSelectedCustomer(data.customer)
      setLookupMessage('Customer created and selected.')
      setCustomerPhone(normalizedCreatePhone)
      setCreateCustomerPhone(normalizedCreatePhone)
      setCreateCustomerName('')
      setCreateCustomerEmail('')
      setCreateOnlineAccess(false)
      setCreateCustomerPassword('')
      setCreateCustomerConfirmPassword('')
      setDuplicateCustomers([])

      await lookupCustomerByPhone()
    } catch {
      setValidationMessage('Network error while creating customer.')
    } finally {
      setIsCreatingCustomer(false)
    }
  }

  async function searchProducts() {
    setValidationMessage('')
    if (!productSearch.trim()) {
      setProductResults([])
      return
    }

    setIsSearchingProducts(true)
    try {
      const response = await fetch(
        `/api/admin/products/search?q=${encodeURIComponent(productSearch)}&limit=20`
      )
      const data = await response.json()
      if (!response.ok) {
        setValidationMessage(data.message || data.error || 'Product search failed')
        setProductResults([])
        return
      }

      setProductResults(data.products || [])
    } catch {
      setValidationMessage('Network error while searching products.')
      setProductResults([])
    } finally {
      setIsSearchingProducts(false)
    }
  }

  function addLineItem(product: ProductResult) {
    const selectedVariantId = product.has_variants ? selectedVariantByProduct[product.id] : null
    const selectedVariant = selectedVariantId
      ? product.variants?.find((variant) => variant.id === selectedVariantId) || null
      : null

    if (product.has_variants && !selectedVariant) {
      setValidationMessage(`Select a variant for ${product.name} before adding it.`)
      return
    }

    const effectiveTrackInventory = !!(selectedVariant ? (selectedVariant.track_inventory ?? product.track_inventory) : product.track_inventory)
    const availableStock = selectedVariant ? Number(selectedVariant.stock || 0) : Number(product.stock || 0)

    if (effectiveTrackInventory && availableStock <= 0) {
      setValidationMessage(`Cannot add ${product.name}. Stock is zero.`)
      return
    }

    const lineKey = `${product.id}:${selectedVariant?.id || 'base'}`
    setLineItems((prev) => {
      const existing = prev.find((line) => line.lineKey === lineKey)
      if (existing) {
        if (existing.trackInventory && existing.quantity >= existing.stock) {
          setValidationMessage(`Cannot add more. Max stock reached for ${existing.name}.`)
          return prev
        }

        return prev.map((line) =>
          line.lineKey === lineKey ? { ...line, quantity: line.quantity + 1 } : line
        )
      }

      return [
        ...prev,
        {
          lineKey,
          productId: product.id,
          name: product.name,
          sku: product.sku,
          unitPriceCents: selectedVariant ? selectedVariant.price_cents : product.price_cents,
          quantity: 1,
          stock: availableStock,
          trackInventory: effectiveTrackInventory,
          variantId: selectedVariant?.id || null,
          variantName: selectedVariant?.name || null,
          heroImageUrl: product.hero_image_url || null,
        },
      ]
    })
  }

  function updateQuantity(lineKey: string, quantity: number) {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.lineKey !== lineKey) return item
        let nextQty = Math.max(1, Math.floor(quantity || 1))
        if (item.trackInventory) {
          nextQty = Math.min(nextQty, Math.max(1, Number(item.stock || 0)))
        }
        return { ...item, quantity: nextQty }
      })
    )
  }

  function removeLineItem(lineKey: string) {
    setLineItems((prev) => prev.filter((item) => item.lineKey !== lineKey))
  }

  async function submitOrder() {
    setValidationMessage('')
    setSubmitMessage('')

    if (!selectedCustomer?.id) {
      setValidationMessage('Select or create a customer before generating order.')
      return
    }

    if (lineItems.length === 0) {
      setValidationMessage('Add at least one product line item.')
      return
    }

    if (discountCents > subtotalCents) {
      setValidationMessage('Discount cannot exceed subtotal.')
      return
    }

    const rawWalletInputCents = toCents(walletUsedRupees)
    const maxWalletAllowedCents = Math.min(totalCents, walletBalanceCents)
    if (rawWalletInputCents > maxWalletAllowedCents) {
      setValidationMessage(`Wallet used cannot exceed available wallet balance (${formatCurrency(walletBalanceCents)}) or order total.`)
      return
    }

    const invalidStockLine = lineItems.find((item) => item.trackInventory && item.quantity > Number(item.stock || 0))
    if (invalidStockLine) {
      setValidationMessage(`Quantity exceeds stock for ${invalidStockLine.name}. Please adjust quantity before generating order.`)
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        customer: {
          customerId: selectedCustomer.id,
          phone: selectedCustomer.phone || customerPhone,
          email: selectedCustomer.email,
          firstName: selectedCustomer.first_name || undefined,
          lastName: selectedCustomer.last_name || undefined,
        },
        items: lineItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          variantId: item.variantId || undefined,
        })),
        discountAmountCents: discountCents,
        walletUsedCents: orderStatus === 'paid' ? walletUsedCents : 0,
        cashPaidCents: orderStatus === 'paid' ? cashPaidCents : 0,
        status: orderStatus,
        expectedSubtotalCents: subtotalCents,
        expectedTotalCents: totalCents,
      }

      const response = await fetch('/api/admin/orders/offline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        setValidationMessage(data.message || data.error || 'Failed to create order')
        return
      }

      setSubmitMessage('Order generated successfully. Redirecting to orders...')
      router.push(ordersBasePath)
    } catch {
      setValidationMessage('Network error while creating order.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Order</h1>
          <p className="text-sm text-gray-600 mt-1">
            Create offline/admin order for {tenant ? `tenant ${tenant}` : 'current tenant'}
          </p>
        </div>
        <Link href={ordersBasePath} className="text-sm text-blue-600 hover:text-blue-800">
          Back to Orders
        </Link>
      </div>

      {(validationMessage || submitMessage || lookupMessage) && (
        <div className="space-y-2">
          {validationMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {validationMessage}
            </div>
          )}
          {lookupMessage && (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
              {lookupMessage}
            </div>
          )}
          {submitMessage && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {submitMessage}
            </div>
          )}
        </div>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Customer</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone or Name</label>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Enter phone number or customer name"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={lookupCustomerByPhone}
            disabled={isLookingUp}
            className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isLookingUp ? 'Searching...' : 'Find Customer'}
          </button>
        </div>

        {selectedCustomer && (
          <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm space-y-2">
            <div className="font-medium text-green-900">Selected customer</div>
            <div className="text-green-800">
              {selectedCustomer.first_name || selectedCustomer.last_name
                ? `${selectedCustomer.first_name || ''} ${selectedCustomer.last_name || ''}`.trim()
                : selectedCustomer.email}
            </div>
            <div className="text-green-700">Phone: {selectedCustomer.phone || 'N/A'}</div>
            <div className="text-green-700">Wallet Balance: {formatCurrency(walletBalanceCents)}</div>

            <div className="pt-2">
              <div className="font-medium text-green-900 mb-1">Recent Orders</div>
              {recentOrders.length === 0 && <div className="text-green-700">No previous orders</div>}
              {recentOrders.length > 0 && (
                <ul className="space-y-1 text-green-800">
                  {recentOrders.map((order) => (
                    <li key={order.id} className="flex items-center justify-between gap-3">
                      <Link
                        href={`${orderDetailBasePath}/${order.id}`}
                        className="text-blue-700 hover:text-blue-900 hover:underline"
                      >
                        {order.order_number}
                      </Link>
                      <span className="text-xs uppercase">{order.status}</span>
                      <span>{formatCurrency(order.total_cents)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {!selectedCustomer && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 space-y-3">
            <div className="text-sm font-medium text-amber-900">
              Customer not found. Create customer inline.
            </div>

            {duplicateCustomers.length > 0 && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Duplicate phone detected for {duplicateCustomers.length} customers. Please resolve duplicates before creating order.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={createCustomerPhone}
                  onChange={(e) => setCreateCustomerPhone(e.target.value)}
                  placeholder="Enter customer phone"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={createCustomerName}
                  onChange={(e) => setCreateCustomerName(e.target.value)}
                  placeholder="Customer name"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={createCustomerEmail}
                  onChange={(e) => setCreateCustomerEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="rounded-md border border-indigo-200 bg-indigo-50 p-3 space-y-3">
              <label className="flex items-start gap-2 text-sm text-indigo-900">
                <input
                  type="checkbox"
                  checked={createOnlineAccess}
                  onChange={(e) => setCreateOnlineAccess(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  Create online login for this customer now
                  <span className="block text-xs text-indigo-700 mt-1">
                    This links offline orders, wallet, and cashback to the same online customer profile.
                  </span>
                </span>
              </label>

              {createOnlineAccess && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-indigo-900 mb-1">Password</label>
                    <input
                      type="password"
                      value={createCustomerPassword}
                      onChange={(e) => setCreateCustomerPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full rounded-md border border-indigo-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-indigo-900 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={createCustomerConfirmPassword}
                      onChange={(e) => setCreateCustomerConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full rounded-md border border-indigo-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={createCustomerInline}
              disabled={isCreatingCustomer || duplicateCustomers.length > 0}
              className="rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isCreatingCustomer ? 'Creating...' : 'Add Customer'}
            </button>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Products</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search by name or SKU</label>
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Type product name or SKU"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={searchProducts}
            disabled={isSearchingProducts}
            className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isSearchingProducts ? 'Searching...' : 'Search'}
          </button>
        </div>

        {productResults.length > 0 && (
          <div className="rounded-md border border-gray-200 divide-y">
            {productResults.map((product) => (
              <div key={product.id} className="p-3 space-y-3 md:flex md:items-start md:justify-between md:gap-4">
                <div className="flex gap-3">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                    {product.hero_image_url ? (
                      <img src={product.hero_image_url} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">No image</div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    <div className="text-xs text-gray-600">SKU: {product.sku || 'N/A'}</div>
                    <div className="text-xs text-gray-600">
                      Price: {formatCurrency(product.price_cents)} {product.track_inventory ? `| Stock: ${product.stock}` : ''}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 md:min-w-72">
                  {product.has_variants && (product.variants || []).length > 0 && (
                    <select
                      value={selectedVariantByProduct[product.id] || product.variants?.[0]?.id || ''}
                      onChange={(e) =>
                        setSelectedVariantByProduct((prev) => ({
                          ...prev,
                          [product.id]: e.target.value,
                        }))
                      }
                      className="rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-700"
                    >
                      {product.variants?.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.name}
                          {variant.stock != null ? ` | Stock: ${variant.stock}` : ''}
                          {variant.price_cents !== product.price_cents ? ` | ${formatCurrency(variant.price_cents)}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => addLineItem(product)}
                    className="rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {lineItems.length === 0 && <div className="text-sm text-gray-500">No line items selected yet.</div>}
          {lineItems.map((item) => (
            <div key={item.lineKey} className="rounded-md border border-gray-200 p-3 grid grid-cols-1 md:grid-cols-8 gap-3 items-center">
              <div className="md:col-span-3 flex items-center gap-3">
                {item.heroImageUrl ? (
                  <img src={item.heroImageUrl} alt={item.name} className="h-12 w-12 rounded-md object-cover" />
                ) : null}
                <div className="text-sm font-medium text-gray-900">{item.name}</div>
                <div className="text-xs text-gray-600">SKU: {item.sku || 'N/A'}</div>
                {item.variantName && <div className="text-xs text-gray-600">Variant: {item.variantName}</div>}
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Qty</label>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.lineKey, Number(e.target.value))}
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                />
              </div>

              <div className="md:col-span-2 text-sm text-gray-700">
                Unit: {formatCurrency(item.unitPriceCents)}
              </div>

              <div className="text-sm font-medium text-gray-900">
                {formatCurrency(item.unitPriceCents * item.quantity)}
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => removeLineItem(item.lineKey)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Pricing</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Discount (INR)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={discountRupees}
              onChange={(e) => setDiscountRupees(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Wallet Used (INR)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              max={toRupeesString(Math.min(totalCents, walletBalanceCents))}
              value={walletUsedRupees}
              onChange={(e) => setWalletUsedRupees(e.target.value)}
              disabled={orderStatus === 'pending' || walletBalanceCents <= 0}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
            />
            {walletBalanceCents <= 0 && orderStatus === 'paid' && (
              <p className="mt-1 text-xs text-amber-700">Wallet balance is zero, so wallet payment is disabled.</p>
            )}
            {walletBalanceCents > 0 && orderStatus === 'paid' && (
              <p className="mt-1 text-xs text-gray-600">
                Max usable now: {formatCurrency(Math.min(totalCents, walletBalanceCents))}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Initial Status</label>
            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value as 'paid' | 'pending')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="rounded-md border border-gray-200 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900">{formatCurrency(subtotalCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Discount</span>
            <span className="text-gray-900">-{formatCurrency(discountCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Final Total</span>
            <span className="font-medium text-gray-900">{formatCurrency(totalCents)}</span>
          </div>
          {orderStatus === 'paid' && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">Wallet Used</span>
                <span className="text-gray-900">{formatCurrency(walletUsedCents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cash Paid</span>
                <span className="text-gray-900">{formatCurrency(cashPaidCents)}</span>
              </div>
            </>
          )}
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <Link
          href={ordersBasePath}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>
        <button
          type="button"
          onClick={submitOrder}
          disabled={isSubmitting}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
        >
          {isSubmitting ? 'Generating...' : 'Generate Order'}
        </button>
      </div>
    </div>
  )
}
