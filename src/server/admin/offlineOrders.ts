import { supabaseAdmin } from '@/server/supabaseAdmin'
import {
  debitWalletForOrder,
  getWalletAccountId,
  getWalletBalance,
  processCashbackForOrder,
} from '@/lib/cashback/cashbackService'
import { assertWalletUsageWithinCap } from './orderSafetyRules'
import { fetchProductVariants, fetchProductVariantOptions } from '@/server/modules/products/service'

export type OfflineOrderStatus = 'pending' | 'paid'

export interface OfflineOrderItemInput {
  productId: string
  quantity: number
  variantId?: string
}

export interface OfflineOrderCustomerInput {
  customerId?: string
  phone?: string
  email?: string
  firstName?: string
  lastName?: string
  createOnlineAccess?: boolean
  password?: string
}

export interface CreateOfflineOrderInput {
  customer: OfflineOrderCustomerInput
  createCustomerIfMissing?: boolean
  items: OfflineOrderItemInput[]
  discountAmountCents?: number
  walletUsedCents?: number
  cashPaidCents?: number
  status?: OfflineOrderStatus
  expectedSubtotalCents?: number
  expectedTotalCents?: number
  currency?: string
}

type CustomerRow = {
  id: string
  tenant_id: string
  user_id?: string | null
  email: string
  phone: string | null
  first_name: string | null
  last_name: string | null
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isGeneratedOfflineEmail(email: string): boolean {
  return email.endsWith('@offline.local')
}

async function createAuthUserForCustomer(params: {
  tenantId: string
  email: string
  password: string
}) {
  const { tenantId, email, password } = params

  // GUARDRAIL: Validate password in function (defense-in-depth)
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      tenant_id: tenantId,
      user_type: 'customer',
    },
  })

  if (error || !data.user) {
    const message = error?.message || 'Unknown error'
    if (/already\s+registered|already\s+exists|duplicate/i.test(message)) {
      throw new Error('This email is already registered. Use another email or reset the existing account password.')
    }
    throw new Error(`Failed to create login account: ${message}`)
  }

  return data.user.id
}

type ProductRow = {
  id: string
  name: string
  sku: string | null
  price_cents: number
  cost_per_item_cents: number | null
  stock: number
  track_inventory: boolean | null
  has_variants: boolean | null
  status: string
  is_sold_out: boolean | null
}

type VariantRow = {
  id: string
  product_id: string
  name: string
  sku: string | null
  price_cents: number
  stock: number | null
  track_inventory: boolean | null
  allow_backorders: boolean | null
  is_active: boolean | null
  attributes: Record<string, string> | null
}

async function buildCustomerLookupPayload(tenantId: string, customer: CustomerRow) {
  const walletBalanceCents = await getWalletBalance(customer.id, tenantId)

  const { data: recentOrders } = await supabaseAdmin
    .from('orders')
    .select('id, order_number, status, total_cents, created_at')
    .eq('tenant_id', tenantId)
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    customer,
    walletBalanceCents,
    recentOrders: recentOrders || [],
  }
}

export function normalizePhone(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '')
  if (digits.length === 10) return digits
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  return digits
}

export function generateOfflineOrderNumber(tenantId: string): string {
  const tenantPrefix = tenantId.replace(/-/g, '').slice(0, 4).toUpperCase()
  const ts = Date.now().toString().slice(-8)
  const rand = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')

  return `OFF-${tenantPrefix}-${ts}-${rand}`
}

async function ensureWalletAccount(customerId: string, tenantId: string): Promise<string> {
  try {
    return await getWalletAccountId(customerId, tenantId)
  } catch {
    const { error: createWalletError } = await supabaseAdmin
      .from('wallet_accounts')
      .insert({ tenant_id: tenantId, customer_id: customerId })

    if (createWalletError && createWalletError.code !== '23505') {
      throw new Error(`Failed to initialize wallet account: ${createWalletError.message}`)
    }

    return await getWalletAccountId(customerId, tenantId)
  }
}

export async function lookupCustomerByPhone(tenantId: string, phoneRaw: string) {
  const phone = normalizePhone(phoneRaw)
  if (!phone) {
    throw new Error('Phone is required')
  }

  const { data: rows, error } = await supabaseAdmin
    .from('customers')
    .select('id, tenant_id, user_id, email, phone, first_name, last_name, created_at')
    .eq('tenant_id', tenantId)
    .eq('phone', phone)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    throw new Error(`Failed to lookup customer by phone: ${error.message}`)
  }

  if (!rows || rows.length === 0) {
    return { found: false as const }
  }

  if (rows.length > 1) {
    return {
      found: false as const,
      duplicatePhone: true as const,
      customers: rows.map((row) => ({
        id: row.id,
        email: row.email,
        phone: row.phone,
        first_name: row.first_name,
        last_name: row.last_name,
      })),
    }
  }

  const customer = rows[0]
  const details = await buildCustomerLookupPayload(tenantId, customer as CustomerRow)

  return {
    found: true as const,
    customer: details.customer,
    walletBalanceCents: details.walletBalanceCents,
    recentOrders: details.recentOrders,
  }
}

export async function lookupCustomerById(tenantId: string, customerId: string) {
  const { data: customer, error } = await supabaseAdmin
    .from('customers')
    .select('id, tenant_id, user_id, email, phone, first_name, last_name')
    .eq('tenant_id', tenantId)
    .eq('id', customerId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to lookup customer by id: ${error.message}`)
  }

  if (!customer) {
    throw new Error('Customer not found in this tenant')
  }

  return await buildCustomerLookupPayload(tenantId, customer as CustomerRow)
}

export async function searchCustomersByQuery(tenantId: string, query: string, limit = 10) {
  const q = (query || '').trim()
  if (!q) return []

  const safeLimit = Math.min(Math.max(limit || 10, 1), 25)
  const phone = normalizePhone(q)

  let orFilter = `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`
  if (phone.length >= 7) {
    orFilter += `,phone.ilike.%${phone}%`
  }

  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('id, email, phone, first_name, last_name')
    .eq('tenant_id', tenantId)
    .or(orFilter)
    .limit(safeLimit)

  if (error) {
    throw new Error(`Failed to search customers: ${error.message}`)
  }

  return data || []
}

export async function createInlineCustomer(
  tenantId: string,
  input: OfflineOrderCustomerInput
): Promise<CustomerRow> {
  const normalizedPhone = input.phone ? normalizePhone(input.phone) : ''
  const email = (input.email || '').trim().toLowerCase()
  const createOnlineAccess = !!input.createOnlineAccess
  const password = (input.password || '').trim()

  if (!normalizedPhone && !email) {
    throw new Error('Either phone or email is required to create customer')
  }

  if (createOnlineAccess) {
    if (!email) {
      throw new Error('Email is required when creating online login access')
    }

    if (!isValidEmail(email)) {
      throw new Error('Enter a valid email address to create online login access')
    }

    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters for online login access')
    }
  }

  if (normalizedPhone) {
    const phoneLookup = await lookupCustomerByPhone(tenantId, normalizedPhone)
    if ('duplicatePhone' in phoneLookup && phoneLookup.duplicatePhone) {
      throw new Error('Duplicate phone detected. Multiple customers already use this phone number')
    }
    if (phoneLookup.found) {
      const existingCustomer = phoneLookup.customer

      if (!createOnlineAccess) {
        return existingCustomer
      }

      if (existingCustomer.user_id) {
        throw new Error('Customer already has an online account linked')
      }

      const authEmail = email || (!isGeneratedOfflineEmail(existingCustomer.email) ? existingCustomer.email : '')
      if (!authEmail) {
        throw new Error('Please provide a real email address to create online login access')
      }

      const authUserId = await createAuthUserForCustomer({ tenantId, email: authEmail, password })

      const { data: linkedCustomer, error: linkError } = await supabaseAdmin
        .from('customers')
        .update({
          user_id: authUserId,
          email: authEmail,
          first_name: input.firstName?.trim() || existingCustomer.first_name,
          last_name: input.lastName?.trim() || existingCustomer.last_name,
        })
        .eq('tenant_id', tenantId)
        .eq('id', existingCustomer.id)
        .select('id, tenant_id, user_id, email, phone, first_name, last_name')
        .single()

      if (linkError || !linkedCustomer) {
        // GUARDRAIL: Handle auth user rollback with explicit error logging
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(authUserId)
        if (deleteError) {
          console.error('⚠️ CRITICAL: Failed to rollback auth user on phone linking failure', { authUserId, deleteError, customerId: existingCustomer.id })
        }
        throw new Error(`Failed to link online account with customer: ${linkError?.message || 'Unknown error'}`)
      }

      // GUARDRAIL: Gracefully handle wallet account creation failure
      try {
        await ensureWalletAccount(linkedCustomer.id, tenantId)
      } catch (walletError) {
        console.error('⚠️ Failed to create wallet account for newly linked customer', { customerId: linkedCustomer.id, walletError })
        // Continue - wallet might be auto-created on first order
      }
      return linkedCustomer as CustomerRow
    }
  }

  if (email) {
    const { data: existingEmailCustomer } = await supabaseAdmin
      .from('customers')
      .select('id, tenant_id, user_id, email, phone, first_name, last_name')
      .eq('tenant_id', tenantId)
      .eq('email', email)
      .maybeSingle()

    if (existingEmailCustomer) {
      if (createOnlineAccess) {
        if (existingEmailCustomer.user_id) {
          throw new Error('Customer already has an online account linked')
        }

        const authUserId = await createAuthUserForCustomer({ tenantId, email, password })
        const { data: linkedCustomer, error: linkError } = await supabaseAdmin
          .from('customers')
          .update({
            user_id: authUserId,
            email: email,
            first_name: input.firstName?.trim() || existingEmailCustomer.first_name,
            last_name: input.lastName?.trim() || existingEmailCustomer.last_name,
          })
          .eq('tenant_id', tenantId)
          .eq('id', existingEmailCustomer.id)
          .select('id, tenant_id, user_id, email, phone, first_name, last_name')
          .single()

        if (linkError || !linkedCustomer) {
          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(authUserId)
          if (deleteError) {
            console.error('⚠️ CRITICAL: Failed to rollback auth user on linking failure', { authUserId, deleteError, customerId: existingEmailCustomer.id })
          }
          throw new Error(`Failed to link online account with customer: ${linkError?.message || 'Unknown error'}`)
        }

        try {
          await ensureWalletAccount(linkedCustomer.id, tenantId)
        } catch (walletError) {
          console.error('⚠️ Failed to create wallet account for newly linked customer', { customerId: linkedCustomer.id, walletError })
        }
        return linkedCustomer as CustomerRow
      }

      return existingEmailCustomer
    }
  }

  const generatedEmail = email || `offline-${Date.now()}@offline.local`
  let authUserId: string | null = null

  if (createOnlineAccess) {
    authUserId = await createAuthUserForCustomer({ tenantId, email, password })
  }

  const { data: customer, error: createError } = await supabaseAdmin
    .from('customers')
    .insert({
      tenant_id: tenantId,
      user_id: authUserId,
      email: generatedEmail,
      phone: normalizedPhone || null,
      first_name: input.firstName?.trim() || null,
      last_name: input.lastName?.trim() || null,
      marketing_opt_in: false,
    })
    .select('id, tenant_id, user_id, email, phone, first_name, last_name')
    .single()

  if (createError || !customer) {
    if (authUserId) {
      // GUARDRAIL: Handle auth user cleanup explicitly
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(authUserId)
      if (deleteError) {
        console.error('⚠️ CRITICAL: Failed to rollback auth user on customer creation failure', { authUserId, deleteError })
      }
    }
    throw new Error(`Failed to create customer: ${createError?.message || 'Unknown error'}`)
  }

  try {
    await ensureWalletAccount(customer.id, tenantId)
  } catch (walletError) {
    console.error('⚠️ Failed to create wallet account for new customer', { customerId: customer.id, walletError })
    // Still return customer - wallet might be auto-created on first order
  }
  return customer
}

async function resolveCustomer(
  tenantId: string,
  input: OfflineOrderCustomerInput,
  createCustomerIfMissing: boolean
): Promise<CustomerRow> {
  if (input.customerId) {
    const { data: customerById, error } = await supabaseAdmin
      .from('customers')
      .select('id, tenant_id, email, phone, first_name, last_name')
      .eq('tenant_id', tenantId)
      .eq('id', input.customerId)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to validate customer: ${error.message}`)
    }
    if (!customerById) {
      throw new Error('Customer not found in this tenant')
    }

    return customerById
  }

  if (input.phone) {
    const phoneLookup = await lookupCustomerByPhone(tenantId, input.phone)
    if ('duplicatePhone' in phoneLookup && phoneLookup.duplicatePhone) {
      throw new Error('Duplicate phone detected. Multiple customers already use this phone number')
    }
    if (phoneLookup.found) {
      return phoneLookup.customer
    }
  }

  if (input.email) {
    const { data: customerByEmail, error } = await supabaseAdmin
      .from('customers')
      .select('id, tenant_id, email, phone, first_name, last_name')
      .eq('tenant_id', tenantId)
      .eq('email', input.email.trim().toLowerCase())
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to lookup customer by email: ${error.message}`)
    }

    if (customerByEmail) {
      return customerByEmail
    }
  }

  if (!createCustomerIfMissing) {
    throw new Error('Customer not found. Enable createCustomerIfMissing for inline creation')
  }

  return await createInlineCustomer(tenantId, input)
}

function validateSelectableProduct(product: ProductRow) {
  if (product.status !== 'published') {
    throw new Error(`Product ${product.name} is not selectable (status: ${product.status})`)
  }

  if (product.is_sold_out) {
    throw new Error(`Product ${product.name} is marked sold out and cannot be selected`)
  }
}

async function settleOfflinePaidOrder(params: {
  tenantId: string
  orderId: string
  customerId: string
  totalCents: number
  walletUsedCents: number
  cashPaidCents: number
  lineItems: Array<{
    product: ProductRow
    quantity: number
  }>
}) {
  await processPaidOrderPostPaymentOnce(params.tenantId, params.orderId)
}

export async function processPaidOrderPostPaymentOnce(tenantId: string, orderId: string) {
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select(
      `
        id,
        tenant_id,
        customer_id,
        status,
        total_cents,
        wallet_used_cents,
        cash_paid_cents,
        post_payment_processed,
        order_items (
          quantity,
          unit_price_cents,
          products (
            cost_per_item_cents
          )
        )
      `
    )
    .eq('tenant_id', tenantId)
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    throw new Error(`Failed to load order for post-payment processing: ${orderError?.message || 'Order not found'}`)
  }

  if (order.post_payment_processed) {
    return { processed: false, reason: 'already_processed' as const }
  }

  if (order.status !== 'paid') {
    return { processed: false, reason: 'order_not_paid' as const }
  }

  if (!order.customer_id) {
    await supabaseAdmin
      .from('orders')
      .update({ post_payment_processed: true })
      .eq('tenant_id', tenantId)
      .eq('id', orderId)

    return { processed: false, reason: 'no_customer' as const }
  }

  const walletUsedCents = order.wallet_used_cents || 0
  const cashPaidCents = order.cash_paid_cents || order.total_cents

  const accountId = await ensureWalletAccount(order.customer_id, tenantId)

  if (walletUsedCents > 0) {
    const { data: existingWalletDebit, error: existingWalletDebitError } = await supabaseAdmin
      .from('wallet_ledger')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('account_id', accountId)
      .eq('source_key', 'ORDER_PAYMENT')
      .eq('reference_id', order.id)
      .maybeSingle()

    if (existingWalletDebitError && existingWalletDebitError.code !== 'PGRST116') {
      throw new Error(`Failed wallet debit precheck: ${existingWalletDebitError.message}`)
    }

    if (!existingWalletDebit) {
      await debitWalletForOrder(accountId, tenantId, order.id, walletUsedCents)
    }
  }

  const { data: existingCashbackTx, error: cashbackTxError } = await supabaseAdmin
    .from('cashback_transactions')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('order_id', order.id)
    .maybeSingle()

  if (cashbackTxError && cashbackTxError.code !== 'PGRST116') {
    throw new Error(`Failed cashback transaction precheck: ${cashbackTxError.message}`)
  }

  if (existingCashbackTx) {
    await supabaseAdmin
      .from('orders')
      .update({ post_payment_processed: true })
      .eq('tenant_id', tenantId)
      .eq('id', order.id)

    return { processed: false, reason: 'cashback_already_recorded' as const }
  }

  const totalPurchasePriceCents = (order.order_items || []).reduce((sum, item) => {
    const cost = item.products?.cost_per_item_cents || 0
    const quantity = item.quantity || 0
    return sum + cost * quantity
  }, 0)

  const cashbackResult = await processCashbackForOrder({
    tenantId,
    orderId: order.id,
    customerId: order.customer_id,
    totalSalePriceCents: order.total_cents,
    totalPurchasePriceCents,
    walletUsedCents,
    cashPaidCents,
  })

  await supabaseAdmin
    .from('orders')
    .update({
      total_purchase_price_cents: totalPurchasePriceCents,
      total_profit_pct: cashbackResult.profitPct,
      cashback_pct: cashbackResult.cashbackPct,
      cashback_amount_cents: cashbackResult.cashbackEarned,
      membership_id: cashbackResult.membershipUsed,
      post_payment_processed: true,
    })
    .eq('tenant_id', tenantId)
    .eq('id', order.id)

  return {
    processed: true,
    reason: 'processed' as const,
    cashback: {
      cashbackPct: cashbackResult.cashbackPct,
      cashbackAmountCents: cashbackResult.cashbackEarned,
      profitPct: cashbackResult.profitPct,
    },
  }
}

export async function createOfflineOrder(tenantId: string, input: CreateOfflineOrderInput) {
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new Error('Cannot create order with zero items')
  }

  const customer = await resolveCustomer(tenantId, input.customer || {}, !!input.createCustomerIfMissing)

  const normalizedItems = input.items.map((item, index) => {
    const quantity = Number(item.quantity)
    if (!item.productId || !Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
      throw new Error(`Invalid line item at index ${index}`)
    }

    return {
      productId: item.productId,
      quantity,
      variantId: item.variantId,
    }
  })

  const productIds = Array.from(new Set(normalizedItems.map((item) => item.productId)))
  const { data: products, error: productsError } = await supabaseAdmin
    .from('products')
    .select('id, name, sku, price_cents, cost_per_item_cents, stock, track_inventory, has_variants, status, is_sold_out')
    .eq('tenant_id', tenantId)
    .in('id', productIds)

  if (productsError) {
    throw new Error(`Failed to load products: ${productsError.message}`)
  }

  const byId = new Map((products || []).map((product) => [product.id, product as ProductRow]))

  for (const productId of productIds) {
    if (!byId.has(productId)) {
      throw new Error(`Product ${productId} not found in this tenant`)
    }
  }

  const variantIds = Array.from(
    new Set(
      normalizedItems
        .map((item) => item.variantId?.trim())
        .filter((variantId): variantId is string => Boolean(variantId))
    )
  )

  const { data: variantRows, error: variantError } = variantIds.length > 0
    ? await supabaseAdmin
        .from('product_variants')
        .select('id, product_id, name, sku, price_cents, stock, track_inventory, allow_backorders, is_active, attributes')
        .eq('tenant_id', tenantId)
        .in('id', variantIds)
    : { data: [], error: null }

  if (variantError) {
    throw new Error(`Failed to load product variants: ${variantError.message}`)
  }

  const variantById = new Map<string, VariantRow>(
    (variantRows || []).map((variant) => [variant.id, variant as VariantRow])
  )

  const pricedItems = normalizedItems.map((item) => {
    const product = byId.get(item.productId) as ProductRow
    validateSelectableProduct(product)

    const variantId = item.variantId?.trim() || null
    const selectedVariant = variantId ? variantById.get(variantId) : undefined

    if (product.has_variants) {
      if (!variantId) {
        throw new Error(`Variant selection is required for ${product.name}`)
      }

      if (!selectedVariant) {
        throw new Error(`Variant ${variantId} not found for product ${product.name}`)
      }

      if (selectedVariant.product_id !== product.id) {
        throw new Error(`Variant ${selectedVariant.name} does not belong to ${product.name}`)
      }

      if (selectedVariant.is_active === false) {
        throw new Error(`Variant ${selectedVariant.name} is inactive and cannot be selected`)
      }

      const variantStock = Number(selectedVariant.stock || 0)
      if ((selectedVariant.track_inventory ?? product.track_inventory) && item.quantity > variantStock) {
        throw new Error(`Insufficient stock for ${selectedVariant.name}. Available: ${variantStock}`)
      }
    } else {
      if (variantId) {
        throw new Error(`Product ${product.name} does not use variants`)
      }

      if (product.track_inventory && item.quantity > product.stock) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`)
      }
    }

    const unitPriceCents = selectedVariant ? Number(selectedVariant.price_cents) || 0 : Number(product.price_cents) || 0
    if (unitPriceCents < 0) {
      throw new Error(`Invalid product price for ${product.name}`)
    }

    return {
      product,
      variant: selectedVariant,
      quantity: item.quantity,
      unitPriceCents,
      subtotalCents: unitPriceCents * item.quantity,
    }
  })

  const subtotalCents = pricedItems.reduce((sum, item) => sum + item.subtotalCents, 0)
  if (subtotalCents <= 0) {
    throw new Error('Order subtotal must be greater than zero')
  }

  const discountAmountCents = Math.max(0, Number(input.discountAmountCents || 0))
  if (discountAmountCents > subtotalCents) {
    throw new Error('Discount cannot exceed subtotal')
  }

  const totalCents = subtotalCents - discountAmountCents

  if (
    Number.isFinite(input.expectedSubtotalCents as number) &&
    Number(input.expectedSubtotalCents) !== subtotalCents
  ) {
    throw new Error('Submitted subtotal does not match server calculation')
  }

  if (
    Number.isFinite(input.expectedTotalCents as number) &&
    Number(input.expectedTotalCents) !== totalCents
  ) {
    throw new Error('Submitted total does not match server calculation')
  }

  const status: OfflineOrderStatus = input.status === 'pending' ? 'pending' : 'paid'

  let walletUsedCents = Math.max(0, Number(input.walletUsedCents || 0))
  let cashPaidCents = Math.max(0, Number(input.cashPaidCents ?? totalCents - walletUsedCents))

  if (status === 'pending') {
    walletUsedCents = 0
    cashPaidCents = 0
  } else {
    if (walletUsedCents > totalCents) {
      throw new Error('Wallet amount cannot exceed order total')
    }

    if (walletUsedCents + cashPaidCents !== totalCents) {
      throw new Error('cashPaidCents + walletUsedCents must equal final total')
    }

    if (walletUsedCents > 0) {
      const walletBalanceCents = await getWalletBalance(customer.id, tenantId)
      if (walletBalanceCents <= 0) {
        throw new Error('Wallet balance is zero and cannot be used for this order')
      }

      assertWalletUsageWithinCap(walletUsedCents, totalCents, walletBalanceCents)

      if (walletUsedCents > walletBalanceCents) {
        throw new Error(`Insufficient wallet balance. Available: ${walletBalanceCents}`)
      }
    }
  }

  const orderNumber = generateOfflineOrderNumber(tenantId)
  const currency = (input.currency || 'INR').toUpperCase()

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      tenant_id: tenantId,
      order_number: orderNumber,
      customer_id: customer.id,
      email: customer.email,
      currency,
      status,
      total_cents: totalCents,
      wallet_used_cents: walletUsedCents,
      cash_paid_cents: cashPaidCents,
      discount_amount_cents: discountAmountCents,
      payment_provider: 'offline_admin',
      payment_env: 'test',
      post_payment_processed: false,
      order_source: 'offline_admin',
    })
    .select('id, order_number, status, total_cents, currency, customer_id')
    .single()

  if (orderError || !order) {
    throw new Error(`Failed to create offline order: ${orderError?.message || 'Unknown error'}`)
  }

  const orderItemsPayload = pricedItems.map((item) => ({
    tenant_id: tenantId,
    order_id: order.id,
    product_id: item.product.id,
    variant_id: item.variant?.id || null,
    variant_name: item.variant?.name || null,
    variant_attributes: item.variant ? item.variant.attributes || {} : {},
    quantity: item.quantity,
    unit_price_cents: item.unitPriceCents,
    subtotal_cents: item.subtotalCents,
  }))

  const { error: orderItemsError } = await supabaseAdmin.from('order_items').insert(orderItemsPayload)

  if (orderItemsError) {
    await supabaseAdmin.from('orders').delete().eq('tenant_id', tenantId).eq('id', order.id)
    throw new Error(`Failed to create order items: ${orderItemsError.message}`)
  }

  if (status === 'paid') {
    await settleOfflinePaidOrder({
      tenantId,
      orderId: order.id,
      customerId: customer.id,
      totalCents,
      walletUsedCents,
      cashPaidCents,
      lineItems: pricedItems.map((item) => ({ product: item.product, quantity: item.quantity })),
    })
  }

  return {
    order: {
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      totalCents: order.total_cents,
      currency: order.currency,
      orderSource: 'offline_admin',
      customerId: order.customer_id,
      subtotalCents,
      discountAmountCents,
      walletUsedCents,
      cashPaidCents,
    },
    customer: {
      id: customer.id,
      email: customer.email,
      phone: customer.phone,
      firstName: customer.first_name,
      lastName: customer.last_name,
    },
    items: pricedItems.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      sku: item.product.sku,
      variantId: item.variant?.id || null,
      variantName: item.variant?.name || null,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      subtotalCents: item.subtotalCents,
    })),
  }
}

export async function searchSelectableProducts(tenantId: string, query: string, limit: number) {
  const q = (query || '').trim()
  if (!q) return []

  const safeLimit = Math.min(Math.max(limit || 20, 1), 50)

  const { data, error } = await supabaseAdmin
    .from('products')
    .select(
      'id, name, sku, price_cents, stock, track_inventory, has_variants, status, is_sold_out, hero_image_url, updated_at'
    )
    .eq('tenant_id', tenantId)
    .or(`name.ilike.%${q}%,sku.ilike.%${q}%`)
    .order('updated_at', { ascending: false })
    .limit(safeLimit)

  if (error) {
    throw new Error(`Failed to search products: ${error.message}`)
  }

  const matchedProducts = (data || [])
    .filter((product) => product.status === 'published' && !product.is_sold_out)

  const productsWithVariants = await Promise.all(
    matchedProducts.map(async (product) => {
      if (!product.has_variants) {
        return {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price_cents: product.price_cents,
          stock: product.stock,
          track_inventory: product.track_inventory,
          has_variants: false,
          status: product.status,
          hero_image_url: product.hero_image_url,
          variants: [],
          variant_options: [],
        }
      }

      const [variantOptions, variants] = await Promise.all([
        fetchProductVariantOptions(tenantId, product.id),
        fetchProductVariants(tenantId, product.id),
      ])

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        price_cents: product.price_cents,
        stock: product.stock,
        track_inventory: product.track_inventory,
        has_variants: true,
        status: product.status,
        hero_image_url: product.hero_image_url,
        variants: (variants || []).map((variant) => ({
          id: variant.id,
          name: variant.name,
          sku: variant.sku,
          price_cents: variant.price_cents,
          stock: variant.stock,
          track_inventory: variant.track_inventory,
          allow_backorders: variant.allow_backorders,
          attributes: variant.attributes,
        })),
        variant_options: variantOptions || [],
      }
    })
  )

  return productsWithVariants
}
