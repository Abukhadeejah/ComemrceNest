import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { getAuthenticatedUserId } from '@/server/auth'
import { resolveTenantIdFromRequest } from '@/server/tenant'

type OrderRow = {
  id: string
  order_number: string
  created_at: string
  status: string
  payment_provider: string | null
  total_cents: number | null
  currency: string | null
  customer_id: string | null
  email: string | null
}

type ItemRow = {
  quantity: number
  unit_price_cents: number | null
  subtotal_cents: number | null
  products?: {
    name?: string | null
  } | null
}

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
    }

    const { orderNumber } = await params

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
      .select('id, email')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .maybeSingle()

    const matchedCustomerId = customer?.id || null
    const matchedEmail = customer?.email || userEmail

    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, created_at, status, payment_provider, total_cents, currency, customer_id, email')
      .eq('tenant_id', tenantId)
      .eq('order_number', orderNumber)
      .maybeSingle()

    if (orderError || !orderData) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orderData as OrderRow

    const hasCustomerAccess = !!(matchedCustomerId && order.customer_id && matchedCustomerId === order.customer_id)
    const hasEmailAccess = !!(matchedEmail && order.email && matchedEmail.toLowerCase() === order.email.toLowerCase())

    if (!hasCustomerAccess && !hasEmailAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: itemData } = await supabaseAdmin
      .from('order_items')
      .select('quantity, unit_price_cents, subtotal_cents, products(name)')
      .eq('order_id', order.id)

    const items = (itemData || []) as unknown as ItemRow[]

    const totalCents = Number(order.total_cents) || 0
    const currency = order.currency || 'INR'
    const createdAtText = new Date(order.created_at).toLocaleString('en-IN')

    const itemRowsHtml = items.length
      ? items
          .map((item, index) => {
            const qty = Number(item.quantity) || 0
            const unitPrice = Number(item.unit_price_cents) || 0
            const lineTotal = Number(item.subtotal_cents) || unitPrice * qty
            const productName = escapeHtml(item.products?.name || `Item ${index + 1}`)
            return `
              <tr>
                <td>${index + 1}</td>
                <td>${productName}</td>
                <td>${qty}</td>
                <td>${formatCurrency(unitPrice)}</td>
                <td>${formatCurrency(lineTotal)}</td>
              </tr>
            `
          })
          .join('')
      : '<tr><td colspan="5">No item details found</td></tr>'

    const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice ${escapeHtml(order.order_number)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111; padding: 24px; }
    h1 { margin: 0 0 8px; }
    .meta { margin: 4px 0; color: #444; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f7f7f7; }
    .total { margin-top: 18px; font-size: 18px; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Tax Invoice</h1>
  <div class="meta"><strong>Order Number:</strong> ${escapeHtml(order.order_number)}</div>
  <div class="meta"><strong>Date:</strong> ${escapeHtml(createdAtText)}</div>
  <div class="meta"><strong>Status:</strong> ${escapeHtml(order.status.toUpperCase())}</div>
  <div class="meta"><strong>Payment Method:</strong> ${escapeHtml((order.payment_provider || '').toUpperCase())}</div>
  <div class="meta"><strong>Currency:</strong> ${escapeHtml(currency)}</div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Item</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Line Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRowsHtml}
    </tbody>
  </table>

  <div class="total">Total: ${formatCurrency(totalCents)}</div>
</body>
</html>`

    return new NextResponse(html, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'content-disposition': `attachment; filename="invoice-${order.order_number}.html"`,
        'cache-control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[invoice] Failed to generate invoice:', error)
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 })
  }
}
