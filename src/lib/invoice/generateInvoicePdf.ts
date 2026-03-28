import type { InvoiceAddress, InvoiceOrderData } from '@/components/invoice/types'

const formatCurrency = (cents: number, currency: string) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
  }).format((cents || 0) / 100)

const formatDateTime = (dateString: string) =>
  new Date(dateString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const addressToLines = (address?: InvoiceAddress | null): string[] => {
  if (!address) return ['N/A']

  const lines = [
    address.name,
    address.phone,
    address.line1,
    address.line2,
    [address.city, address.state, address.pincode].filter(Boolean).join(', '),
    address.country,
  ].filter((line): line is string => !!line && line.trim().length > 0)

  return lines.length ? lines : ['N/A']
}

export async function generateInvoicePdf(invoice: InvoiceOrderData) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const left = 40
  const right = pageWidth - 40
  let y = 42

  const ensurePageSpace = (requiredHeight: number) => {
    if (y + requiredHeight <= pageHeight - 40) return
    doc.addPage()
    y = 42
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('INVOICE', left, y)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Invoice #: ${invoice.orderNumber}`, right, y - 2, { align: 'right' })
  doc.text(`Date: ${formatDateTime(invoice.createdAt)}`, right, y + 12, { align: 'right' })
  doc.text(`Status: ${invoice.status.toUpperCase()}`, right, y + 26, { align: 'right' })

  y += 44
  doc.setDrawColor(220)
  doc.line(left, y, right, y)
  y += 18

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Bill To', left, y)
  doc.text('Ship To', left + 260, y)
  y += 14

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const billToLines = [invoice.customerName, invoice.customerEmail].filter(
    (line): line is string => !!line && line.trim().length > 0
  )
  const shippingLines = addressToLines(invoice.shippingAddress)
  const billingLines = billToLines.length ? billToLines : ['N/A']

  const maxAddressLines = Math.max(billingLines.length, shippingLines.length)
  for (let index = 0; index < maxAddressLines; index += 1) {
    if (billingLines[index]) doc.text(billingLines[index], left, y)
    if (shippingLines[index]) doc.text(shippingLines[index], left + 260, y)
    y += 13
  }

  y += 10
  ensurePageSpace(40)
  doc.setDrawColor(220)
  doc.line(left, y, right, y)
  y += 16

  const tableColumns = {
    item: left,
    sku: left + 210,
    qty: left + 330,
    unit: left + 370,
    amount: left + 455,
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Item', tableColumns.item, y)
  doc.text('SKU / Variant', tableColumns.sku, y)
  doc.text('Qty', tableColumns.qty, y)
  doc.text('Unit', tableColumns.unit, y)
  doc.text('Amount', tableColumns.amount, y)
  y += 10
  doc.line(left, y, right, y)
  y += 12

  doc.setFont('helvetica', 'normal')
  for (const item of invoice.items) {
    const itemText = item.name || 'Product'
    const skuVariantText = [item.sku, item.variant].filter(Boolean).join(' / ') || '—'
    const itemLines = doc.splitTextToSize(itemText, 190)
    const skuLines = doc.splitTextToSize(skuVariantText, 110)
    const rowLines = Math.max(itemLines.length, skuLines.length)
    const rowHeight = rowLines * 12 + 4

    ensurePageSpace(rowHeight + 8)

    for (let lineIndex = 0; lineIndex < rowLines; lineIndex += 1) {
      const rowY = y + lineIndex * 12
      if (itemLines[lineIndex]) doc.text(itemLines[lineIndex], tableColumns.item, rowY)
      if (skuLines[lineIndex]) doc.text(skuLines[lineIndex], tableColumns.sku, rowY)
      if (lineIndex === 0) {
        doc.text(String(item.quantity), tableColumns.qty, rowY)
        doc.text(formatCurrency(item.unitPriceCents, invoice.currency), tableColumns.unit, rowY)
        doc.text(formatCurrency(item.subtotalCents, invoice.currency), tableColumns.amount, rowY)
      }
    }

    y += rowHeight
    doc.setDrawColor(235)
    doc.line(left, y, right, y)
    y += 10
  }

  const subtotalCents =
    invoice.subtotalCents || invoice.items.reduce((sum, item) => sum + (item.subtotalCents || 0), 0)

  const totals: Array<{ label: string; value: string }> = [
    { label: 'Subtotal', value: formatCurrency(subtotalCents, invoice.currency) },
  ]

  if ((invoice.discountAmountCents || 0) > 0) {
    totals.push({
      label: 'Discount',
      value: `- ${formatCurrency(invoice.discountAmountCents || 0, invoice.currency)}`,
    })
  }

  if ((invoice.walletUsedCents || 0) > 0) {
    totals.push({
      label: 'Wallet Used',
      value: `- ${formatCurrency(invoice.walletUsedCents || 0, invoice.currency)}`,
    })
  }

  if ((invoice.cashPaidCents || 0) > 0) {
    totals.push({
      label: 'Cash Paid',
      value: formatCurrency(invoice.cashPaidCents || 0, invoice.currency),
    })
  }

  totals.push({
    label: 'Total',
    value: formatCurrency(invoice.totalCents, invoice.currency),
  })

  if ((invoice.cashbackAmountCents || 0) > 0) {
    totals.push({
      label: `Cashback${invoice.cashbackPct ? ` (${invoice.cashbackPct}%)` : ''}`,
      value: `+ ${formatCurrency(invoice.cashbackAmountCents || 0, invoice.currency)}`,
    })
  }

  ensurePageSpace(totals.length * 16 + 40)
  y += 4
  const totalsLabelX = right - 180
  const totalsValueX = right

  for (const [index, row] of totals.entries()) {
    const isTotal = row.label === 'Total'
    doc.setFont('helvetica', isTotal ? 'bold' : 'normal')
    doc.setFontSize(isTotal ? 11 : 10)
    doc.text(row.label, totalsLabelX, y)
    doc.text(row.value, totalsValueX, y, { align: 'right' })
    y += 16
    if (index === totals.length - 2) {
      doc.setDrawColor(220)
      doc.line(totalsLabelX, y - 8, totalsValueX, y - 8)
    }
  }

  y += 10
  ensurePageSpace(30)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Generated by CommerceNest', left, y)

  const safeOrderNumber = invoice.orderNumber.replace(/[^a-zA-Z0-9_-]/g, '-')
  doc.save(`invoice-${safeOrderNumber}.pdf`)
}
