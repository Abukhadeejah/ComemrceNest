export interface InvoiceAddress {
  name?: string | null
  phone?: string | null
  line1: string
  line2?: string | null
  city: string
  state: string
  pincode: string
  country?: string | null
}

export interface InvoiceLineItem {
  id: string
  name: string
  sku?: string | null
  variant?: string | null
  quantity: number
  unitPriceCents: number
  subtotalCents: number
}

export interface InvoiceOrderData {
  id: string
  orderNumber: string
  status: string
  createdAt: string
  currency: string
  customerEmail: string
  customerName?: string | null
  paymentProvider?: string | null
  paymentEnv?: string | null
  subtotalCents: number
  discountAmountCents?: number
  walletUsedCents?: number
  cashPaidCents?: number
  cashbackAmountCents?: number
  cashbackPct?: number | null
  totalCents: number
  shippingAddress?: InvoiceAddress | null
  billingAddress?: InvoiceAddress | null
  items: InvoiceLineItem[]
}
