import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { resolveTenantIdFromRequest } from '@/server/tenant'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params
    const tenantId = await resolveTenantIdFromRequest()

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 401 })
    }

    // Fetch order with all details
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        email,
        status,
        total_cents,
        currency,
        created_at,
        cashback_amount_cents,
        cashback_pct,
        wallet_used_cents,
        cash_paid_cents,
        payment_provider,
        order_items (
          id,
          quantity,
          unit_price_cents,
          subtotal_cents,
          products (
            id,
            name,
            slug,
            sku
          )
        )
      `)
      .eq('tenant_id', tenantId)
      .or(`id.eq.${orderId},order_number.eq.${orderId}`)
      .maybeSingle()

    if (error) {
      console.error('Invoice order query failed:', {
        orderId,
        tenantId,
        error,
      })
      return NextResponse.json(
        { error: 'Failed to fetch order for invoice' },
        { status: 500 }
      )
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Generate HTML invoice
    const html = generateInvoiceHTML(order)

    // Return HTML that can be printed as PDF
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Invoice generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    )
  }
}

function generateInvoiceHTML(order: any): string {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: order.currency || 'INR',
    }).format((cents || 0) / 100)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const subtotal = order.order_items?.reduce(
    (sum: number, item: any) => sum + (item.subtotal_cents || 0),
    0
  ) || 0

  const walletUsed = order.wallet_used_cents || 0
  const cashbackEarned = order.cashback_amount_cents || 0

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${order.order_number}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2563eb;
    }
    
    .company-info h1 {
      font-size: 28px;
      color: #1e40af;
      margin-bottom: 5px;
    }
    
    .company-info p {
      color: #666;
      font-size: 14px;
    }
    
    .invoice-meta {
      text-align: right;
    }
    
    .invoice-meta h2 {
      font-size: 24px;
      color: #1e40af;
      margin-bottom: 10px;
    }
    
    .invoice-meta p {
      font-size: 14px;
      color: #666;
      margin: 5px 0;
    }
    
    .invoice-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 40px;
    }
    
    .detail-section h3 {
      font-size: 16px;
      color: #1e40af;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .detail-section p {
      font-size: 14px;
      margin: 5px 0;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    
    .items-table thead {
      background-color: #f3f4f6;
    }
    
    .items-table th {
      padding: 12px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .items-table td {
      padding: 12px;
      font-size: 14px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .items-table tbody tr:hover {
      background-color: #f9fafb;
    }
    
    .text-right {
      text-align: right;
    }
    
    .totals-section {
      margin-left: auto;
      width: 300px;
      margin-bottom: 40px;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }
    
    .totals-row.subtotal {
      border-top: 1px solid #e5e7eb;
      padding-top: 12px;
    }
    
    .totals-row.total {
      border-top: 2px solid #2563eb;
      padding-top: 12px;
      margin-top: 8px;
      font-size: 18px;
      font-weight: bold;
      color: #1e40af;
    }
    
    .totals-row.highlight {
      color: #059669;
      font-weight: 600;
    }
    
    .totals-row.wallet {
      color: #7c3aed;
    }
    
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .status-paid {
      background-color: #d1fae5;
      color: #065f46;
    }
    
    .status-pending {
      background-color: #fef3c7;
      color: #92400e;
    }
    
    .status-failed {
      background-color: #fee2e2;
      color: #991b1b;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      
      .no-print {
        display: none;
      }
    }
    
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      background-color: #2563eb;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .print-button:hover {
      background-color: #1d4ed8;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">
    🖨️ Print / Save as PDF
  </button>

  <div class="invoice-header">
    <div class="company-info">
      <h1>CommerceNest</h1>
      <p>Your E-commerce Platform</p>
      <p>support@commercenest.com</p>
    </div>
    <div class="invoice-meta">
      <h2>INVOICE</h2>
      <p><strong>Invoice #:</strong> ${order.order_number}</p>
      <p><strong>Date:</strong> ${formatDate(order.created_at)}</p>
      <p><strong>Status:</strong> <span class="status-badge status-${order.status}">${order.status}</span></p>
    </div>
  </div>

  <div class="invoice-details">
    <div class="detail-section">
      <h3>Bill To</h3>
      <p><strong>${order.email}</strong></p>
      <p>${order.email}</p>
    </div>
    <div class="detail-section">
      <h3>Ship To</h3>
      <p>Email delivery</p>
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>Item</th>
        <th>SKU / Variant</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Unit Price</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${order.order_items?.map((item: any) => `
        <tr>
          <td>${item.products?.name || 'Product'}</td>
          <td>
            ${item.products?.sku || '—'}
            ${item.variant ? `<br><small style="color: #666;">${item.variant}</small>` : ''}
          </td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">${formatCurrency(item.unit_price_cents)}</td>
          <td class="text-right"><strong>${formatCurrency(item.subtotal_cents)}</strong></td>
        </tr>
      `).join('') || '<tr><td colspan="5">No items</td></tr>'}
    </tbody>
  </table>

  <div class="totals-section">
    <div class="totals-row subtotal">
      <span>Subtotal:</span>
      <span>${formatCurrency(subtotal)}</span>
    </div>
    ${walletUsed > 0 ? `
    <div class="totals-row wallet">
      <span>Wallet Used:</span>
      <span>-${formatCurrency(walletUsed)}</span>
    </div>
    ` : ''}
    <div class="totals-row total">
      <span>Total Paid:</span>
      <span>${formatCurrency(order.total_cents)}</span>
    </div>
    ${cashbackEarned > 0 ? `
    <div class="totals-row highlight">
      <span>Cashback Earned (${order.cashback_pct}%):</span>
      <span>+${formatCurrency(cashbackEarned)}</span>
    </div>
    ` : ''}
  </div>

  <div class="footer">
    <p><strong>Payment Method:</strong> ${order.payment_provider?.toUpperCase() || 'N/A'}</p>
    <p style="margin-top: 20px;">Thank you for your business!</p>
    <p>For any queries, please contact us at support@commercenest.com</p>
  </div>
</body>
</html>
  `.trim()
}
