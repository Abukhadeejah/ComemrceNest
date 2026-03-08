import { supabaseAdmin } from '@/server/supabaseAdmin'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import Link from 'next/link'
import Image from 'next/image'
import { getAuthenticatedUserId } from '@/server/auth'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { InvoiceDownloadButton } from '@/components/invoice/InvoiceDownloadButton'
import type { InvoiceOrderData } from '@/components/invoice/types'

interface OrderPageProps {
  params: Promise<{ orderId: string }>
}

export default async function OrderDetailsPage({ params }: OrderPageProps) {
  const { orderId } = await params
  const tenantId = await resolveTenantIdFromRequest()
  const userId = await getAuthenticatedUserId()

  if (!tenantId || !userId) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Please sign in to view your order details.</p>
        </div>
      </div>
    )
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set() {},
        remove() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const userEmail = user?.email || null

  const { data: customer } = await supabaseAdmin
    .from('customers')
    .select('id, email, first_name, last_name, phone')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .maybeSingle()

  const matchedCustomerId = customer?.id || null
  const matchedEmail = customer?.email || userEmail

  // Try to find order by ID first, then by order_number
  let order: any = null

  // Try by UUID first
  const { data: orderById } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      order_number,
      email,
      customer_id,
      status,
      total_cents,
      currency,
      payment_provider,
      payment_env,
      discount_amount_cents,
      cashback_amount_cents,
      cashback_pct,
      wallet_used_cents,
      cash_paid_cents,
      created_at,
      order_items (
        id,
        quantity,
        unit_price_cents,
        subtotal_cents,
        variant,
        products (
          id,
          name,
          slug,
          sku,
          hero_image_url
        )
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('id', orderId)
    .maybeSingle()

  if (orderById) {
    order = orderById
  } else {
    // Try by order_number
    const { data: orderByNumber } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        email,
        customer_id,
        status,
        total_cents,
        currency,
        payment_provider,
        payment_env,
        discount_amount_cents,
        cashback_amount_cents,
        cashback_pct,
        wallet_used_cents,
        cash_paid_cents,
        created_at,
        order_items (
          id,
          quantity,
          unit_price_cents,
          subtotal_cents,
          variant,
          products (
            id,
            name,
            slug,
            sku,
            hero_image_url
          )
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('order_number', orderId)
      .maybeSingle()

    order = orderByNumber
  }

  if (order) {
    const hasCustomerAccess = !!(
      matchedCustomerId && order.customer_id && matchedCustomerId === order.customer_id
    )
    const hasEmailAccess = !!(
      matchedEmail && order.email && String(matchedEmail).toLowerCase() === String(order.email).toLowerCase()
    )

    if (!hasCustomerAccess && !hasEmailAccess) {
      order = null
    }
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-900 mb-2">Order Not Found</h2>
          <p className="text-yellow-800 mb-4">
            We couldn't find an order with ID: <code className="bg-yellow-100 px-2 py-1 rounded">{orderId}</code>
          </p>
          <Link href="/account" className="text-blue-600 hover:text-blue-800 underline">
            ← Back to My Account
          </Link>
        </div>
      </div>
    )
  }

  let orderCustomer =
    customer && customer.id === order.customer_id ? customer : null

  if (!orderCustomer && order.customer_id) {
    const { data: customerFromOrder } = await supabaseAdmin
      .from('customers')
      .select('id, email, first_name, last_name, phone')
      .eq('tenant_id', tenantId)
      .eq('id', order.customer_id)
      .maybeSingle()

    orderCustomer = customerFromOrder
  }

  let shippingAddress: any = null
  let billingAddress: any = null

  if (order.customer_id) {
    const { data: addresses } = await supabaseAdmin
      .from('customer_addresses')
      .select('name, phone, line1, line2, city, state, pincode, country, is_default, created_at')
      .eq('tenant_id', tenantId)
      .eq('customer_id', order.customer_id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(2)

    shippingAddress = addresses?.[0] || null
    billingAddress = addresses?.[1] || addresses?.[0] || null
  }

  const subtotalCents = (order.order_items || []).reduce(
    (sum: number, item: any) => sum + (item.subtotal_cents || 0),
    0
  )
  const discountAmountCents = order.discount_amount_cents || 0
  const walletUsedCents = order.wallet_used_cents || 0
  const cashPaidCents = order.cash_paid_cents || 0

  const invoiceData: InvoiceOrderData = {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    createdAt: order.created_at,
    currency: order.currency || 'INR',
    customerEmail: order.email,
    customerName: [orderCustomer?.first_name, orderCustomer?.last_name].filter(Boolean).join(' ') || orderCustomer?.email || order.email,
    paymentProvider: order.payment_provider,
    paymentEnv: order.payment_env,
    subtotalCents,
    discountAmountCents,
    walletUsedCents,
    cashPaidCents,
    cashbackAmountCents: order.cashback_amount_cents || 0,
    cashbackPct: order.cashback_pct || null,
    totalCents: order.total_cents || 0,
    shippingAddress,
    billingAddress,
    items: (order.order_items || []).map((item: any) => ({
      id: item.id,
      name: item.products?.name || 'Product',
      sku: item.products?.sku || null,
      variant: item.variant || null,
      quantity: item.quantity || 0,
      unitPriceCents: item.unit_price_cents || 0,
      subtotalCents: item.subtotal_cents || 0,
    })),
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: order.currency || 'INR'
    }).format((cents || 0) / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'fulfilled':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
          <p className="text-gray-600 mt-1">Order #{order.order_number}</p>
        </div>
        <Link href="/account" className="text-blue-600 hover:text-blue-800 text-sm">
          ← Back to Orders
        </Link>
      </div>

      {/* Order Summary Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b">
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {order.status.toUpperCase()}
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Order Date</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(order.created_at)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Customer Email</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{order.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Payment Method</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{order.payment_provider?.toUpperCase()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Order ID</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{order.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Payment Environment</p>
            <p className="text-sm font-medium text-gray-900 mt-1 uppercase">{order.payment_env || 'N/A'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div className="rounded-md border p-4">
            <p className="text-sm font-semibold text-gray-900 mb-2">Shipping Address</p>
            {shippingAddress ? (
              <div className="text-sm text-gray-700 space-y-1">
                {shippingAddress.name && <p>{shippingAddress.name}</p>}
                {shippingAddress.phone && <p>{shippingAddress.phone}</p>}
                <p>{shippingAddress.line1}</p>
                {shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
                <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.pincode}</p>
                {shippingAddress.country && <p>{shippingAddress.country}</p>}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No shipping address available.</p>
            )}
          </div>

          <div className="rounded-md border p-4">
            <p className="text-sm font-semibold text-gray-900 mb-2">Billing Address</p>
            {billingAddress ? (
              <div className="text-sm text-gray-700 space-y-1">
                {billingAddress.name && <p>{billingAddress.name}</p>}
                {billingAddress.phone && <p>{billingAddress.phone}</p>}
                <p>{billingAddress.line1}</p>
                {billingAddress.line2 && <p>{billingAddress.line2}</p>}
                <p>{billingAddress.city}, {billingAddress.state} {billingAddress.pincode}</p>
                {billingAddress.country && <p>{billingAddress.country}</p>}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No billing address available.</p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotalCents)}</span>
          </div>

          {discountAmountCents > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Discount</span>
              <span className="text-green-600">-{formatCurrency(discountAmountCents)}</span>
            </div>
          )}
          
          {walletUsedCents > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Paid from Wallet</span>
              <span className="text-green-600">-{formatCurrency(walletUsedCents)}</span>
            </div>
          )}

          {cashPaidCents > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Cash Payment</span>
              <span className="font-medium">{formatCurrency(cashPaidCents)}</span>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t">
            <span className="font-medium text-gray-900">Order Total</span>
            <span className="font-semibold text-gray-900">{formatCurrency(order.total_cents)}</span>
          </div>

          {order.cashback_amount_cents > 0 && (
            <div className="flex justify-between text-green-600 pt-2 border-t">
              <span className="font-medium">Cashback Earned</span>
              <span className="font-semibold">
                {formatCurrency(order.cashback_amount_cents)} ({order.cashback_pct}%)
              </span>
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <InvoiceDownloadButton
            invoice={invoiceData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-black transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Items Ordered</h2>

        {order.order_items && order.order_items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU / Variant</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.order_items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center gap-3">
                        {item.products?.hero_image_url ? (
                          <Image
                            src={item.products.hero_image_url}
                            alt={item.products?.name || 'Product'}
                            width={48}
                            height={48}
                            className="rounded-md object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-gray-100" />
                        )}
                        <span>{item.products?.name || 'Product'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div>{item.products?.sku || '—'}</div>
                      <div className="text-xs text-gray-500">{item.variant || 'Default'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.quantity || 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(item.unit_price_cents || 0)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(item.subtotal_cents || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No items found for this order</p>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {order.status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            <strong>Payment Pending:</strong> Your payment is being processed. 
            Cashback will be credited once payment is confirmed.
          </p>
        </div>
      )}

      {order.status === 'paid' && (!order.cashback_amount_cents || order.cashback_amount_cents === 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            <strong>Cashback Pending:</strong> Your cashback is being processed and will be credited after 5 days.
          </p>
        </div>
      )}
    </div>
  )
}
