import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { resolveTenantIdFromRequest, resolveTenantIdFromKey, resolveTenantKeyFromId } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import Link from 'next/link'
import Image from 'next/image'
import { InvoiceDownloadButton } from '@/components/invoice/InvoiceDownloadButton'
import type { InvoiceOrderData } from '@/components/invoice/types'

export const dynamic = 'force-dynamic'

const FALLBACK_TENANT_ID = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c'

const ORDER_DETAILS_SELECT = `
  tenant_id,
  id,
  order_number,
  email,
  customer_id,
  status,
  total_cents,
  currency,
  created_at,
  payment_provider,
  payment_env,
  wallet_used_cents,
  cash_paid_cents,
  discount_amount_cents,
  cashback_amount_cents,
  cashback_pct,
  coupon_code,
  order_items (
    id,
    quantity,
    unit_price_cents,
    subtotal_cents,
    variant,
    products (
      id,
      name,
      sku,
      hero_image_url
    )
  )
`

interface OrderDetailsPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { id } = await params
  const requestHeaders = await headers()
  const pathname = requestHeaders.get('x-pathname') || '/'
  const tenantMatch = pathname.match(/^\/([^/]+)\/admin\/order-details\//)
  const tenantFromPath = tenantMatch?.[1] || null

  let tenantId = await resolveTenantIdFromRequest()

  // Keep detail page behavior aligned with orders list/actions in debug/dev mode.
  if (!tenantId && tenantFromPath) {
    tenantId = await resolveTenantIdFromKey(tenantFromPath)
  }

  const scopedTenantId = tenantId || FALLBACK_TENANT_ID

  const findOrder = async (requestedId: string, tenantScope?: string | null) => {
    if (tenantScope) {
      const { data: scopedById } = await supabaseAdmin
        .from('orders')
        .select(ORDER_DETAILS_SELECT)
        .eq('tenant_id', tenantScope)
        .eq('id', requestedId)
        .maybeSingle()

      if (scopedById) return scopedById

      const { data: scopedByNumber } = await supabaseAdmin
        .from('orders')
        .select(ORDER_DETAILS_SELECT)
        .eq('tenant_id', tenantScope)
        .eq('order_number', requestedId)
        .maybeSingle()

      if (scopedByNumber) return scopedByNumber
    }

    const { data: globalById } = await supabaseAdmin
      .from('orders')
      .select(ORDER_DETAILS_SELECT)
      .eq('id', requestedId)
      .maybeSingle()

    if (globalById) return globalById

    const { data: globalByNumber } = await supabaseAdmin
      .from('orders')
      .select(ORDER_DETAILS_SELECT)
      .eq('order_number', requestedId)
      .limit(1)
      .maybeSingle()

    return globalByNumber
  }

  const order: any = await findOrder(id, scopedTenantId)

  if (!order) notFound()

  const effectiveTenantId = scopedTenantId || order.tenant_id || null
  const tenantKey = tenantFromPath || (effectiveTenantId ? await resolveTenantKeyFromId(effectiveTenantId) : null) || null

  const { data: customer } = order.customer_id && effectiveTenantId
    ? await supabaseAdmin
      .from('customers')
      .select('id, first_name, last_name, email, phone')
      .eq('tenant_id', effectiveTenantId)
      .eq('id', order.customer_id)
      .maybeSingle()
    : { data: null }

  const { data: addresses } = order.customer_id && effectiveTenantId
    ? await supabaseAdmin
      .from('customer_addresses')
      .select('name, phone, line1, line2, city, state, pincode, country, is_default, created_at')
      .eq('tenant_id', effectiveTenantId)
      .eq('customer_id', order.customer_id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(2)
    : { data: null }

  const shippingAddress = addresses?.[0] || null
  const billingAddress = addresses?.[1] || addresses?.[0] || null
  const subtotalCents = (order.order_items || []).reduce(
    (sum: number, item: any) => sum + (item.subtotal_cents || 0),
    0
  )

  const invoiceData: InvoiceOrderData = {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    createdAt: order.created_at,
    currency: order.currency || 'INR',
    customerEmail: order.email,
    customerName: [customer?.first_name, customer?.last_name].filter(Boolean).join(' ') || customer?.email || order.email,
    paymentProvider: order.payment_provider,
    paymentEnv: order.payment_env,
    subtotalCents,
    discountAmountCents: order.discount_amount_cents || 0,
    walletUsedCents: order.wallet_used_cents || 0,
    cashPaidCents: order.cash_paid_cents || 0,
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

  const ordersPath = tenantKey ? `/${tenantKey}/admin/orders` : '/admin/orders'
  const productEditPath = (productId: string) =>
    tenantKey ? `/${tenantKey}/admin/products/${productId}/edit` : `/admin/products/${productId}/edit`

  const formatCurrency = (cents: number, currency: string) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR'
    }).format((cents || 0) / 100)

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
            <p className="text-gray-500">Order {order.order_number}</p>
          </div>
          <Link href={ordersPath} className="text-sm text-blue-600 hover:text-blue-800">
            Back to orders
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Customer</div>
              <div className="text-gray-900">{[customer?.first_name, customer?.last_name].filter(Boolean).join(' ') || order.email}</div>
              <div className="text-sm text-gray-600">{order.email}</div>
              {customer?.phone && <div className="text-sm text-gray-600">{customer.phone}</div>}
            </div>
            <div>
              <div className="text-sm text-gray-500">Order ID</div>
              <div className="text-gray-900 break-all">{order.id}</div>
              {order.customer_id && <div className="text-xs text-gray-500 mt-1">Customer ID: {order.customer_id}</div>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <div className="text-gray-900 capitalize">{order.status}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Created</div>
              <div className="text-gray-900">{new Date(order.created_at).toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Payment Provider</div>
              <div className="text-gray-900 uppercase">{order.payment_provider || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Payment Environment</div>
              <div className="text-gray-900 uppercase">{order.payment_env || 'N/A'}</div>
            </div>
          </div>

          {(shippingAddress || billingAddress) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="rounded-md border p-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">Shipping Address</div>
                {shippingAddress ? (
                  <div className="text-sm text-gray-700 space-y-1">
                    {shippingAddress.name && <div>{shippingAddress.name}</div>}
                    {shippingAddress.phone && <div>{shippingAddress.phone}</div>}
                    <div>{shippingAddress.line1}</div>
                    {shippingAddress.line2 && <div>{shippingAddress.line2}</div>}
                    <div>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.pincode}</div>
                    {shippingAddress.country && <div>{shippingAddress.country}</div>}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No shipping address available.</div>
                )}
              </div>

              <div className="rounded-md border p-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">Billing Address</div>
                {billingAddress ? (
                  <div className="text-sm text-gray-700 space-y-1">
                    {billingAddress.name && <div>{billingAddress.name}</div>}
                    {billingAddress.phone && <div>{billingAddress.phone}</div>}
                    <div>{billingAddress.line1}</div>
                    {billingAddress.line2 && <div>{billingAddress.line2}</div>}
                    <div>{billingAddress.city}, {billingAddress.state} {billingAddress.pincode}</div>
                    {billingAddress.country && <div>{billingAddress.country}</div>}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No billing address available.</div>
                )}
              </div>
            </div>
          )}

          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">{formatCurrency(subtotalCents, order.currency)}</span>
            </div>
            {(order.discount_amount_cents || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount</span>
                <span className="text-green-600">-{formatCurrency(order.discount_amount_cents || 0, order.currency)}</span>
              </div>
            )}
            {(order.wallet_used_cents || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Wallet Used</span>
                <span className="text-gray-900">-{formatCurrency(order.wallet_used_cents || 0, order.currency)}</span>
              </div>
            )}
            {(order.cash_paid_cents || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cash Paid</span>
                <span className="text-gray-900">{formatCurrency(order.cash_paid_cents || 0, order.currency)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t">
              <span className="font-medium text-gray-900">Order Total</span>
              <span className="font-semibold text-gray-900">{formatCurrency(order.total_cents, order.currency)}</span>
            </div>
            {(order.cashback_amount_cents || 0) > 0 && (
              <div className="flex justify-between text-green-700 text-sm">
                <span>Cashback Earned</span>
                <span>
                  {formatCurrency(order.cashback_amount_cents || 0, order.currency)}
                  {order.cashback_pct ? ` (${order.cashback_pct}%)` : ''}
                </span>
              </div>
            )}
            {order.coupon_code && (
              <div className="text-sm text-gray-600">Coupon: {order.coupon_code}</div>
            )}
          </div>

          <div className="pt-4 border-t">
            <InvoiceDownloadButton invoice={invoiceData} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Products Ordered</h2>

          {order.order_items && order.order_items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU / Variant</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Line Total</th>
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
                              width={40}
                              height={40}
                              className="rounded-md object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-gray-100" />
                          )}
                          {item.products?.id ? (
                            <Link
                              href={productEditPath(item.products.id)}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {item.products?.name || 'Product'}
                            </Link>
                          ) : (
                            <span>{item.products?.name || 'Product'}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div>{item.products?.sku || '—'}</div>
                        <div className="text-xs text-gray-500">{item.variant || 'Default'}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.quantity || 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatCurrency(item.unit_price_cents || 0, order.currency)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {formatCurrency(item.subtotal_cents || 0, order.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No order items found for this order.</p>
          )}
        </div>
      </div>
    </div>
  )
}
