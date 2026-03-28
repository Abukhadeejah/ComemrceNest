import { NextRequest, NextResponse } from 'next/server';
import { createPhonePePayment } from '@/lib/payments/phonepe';
import { supabaseAdmin } from '@/server/supabaseAdmin';
import { resolveTenantIdFromRequest, resolveTenantIdFromKey } from '@/server/tenant';
import { getPaymentProvider, resolveRazorpayCredentials } from '@/server/payments';
import Razorpay from 'razorpay';

interface CheckoutItem {
  productId: string;
  quantity: number;
  unitPriceCents?: number;
}

interface ProductPriceInfo {
  lineIndex: number;
  productId: string;
  priceCents: number;
  quantity: number;
  lineTotalCents: number;
}

async function calculateCartTotals(tenantId: string, items: CheckoutItem[]) {
  if (!Array.isArray(items) || items.length === 0) {
    return { subtotalCents: 0, taxCents: 0, totalCents: 0, baseSubtotalCents: 0, productPrices: [] };
  }

  const productIds = items.map((it) => it.productId);
  const { data: products, error: productsError } = await supabaseAdmin
    .from('products')
    .select('id, price_cents, tax_class_id, taxable')
    .eq('tenant_id', tenantId)
    .in('id', productIds);

  if (productsError || !products) {
    console.error('[checkout] failed to load products for tax calc', productsError);
    return { subtotalCents: 0, taxCents: 0, totalCents: 0, baseSubtotalCents: 0, productPrices: [] };
  }

  const taxClassIds = Array.from(
    new Set(
      products
        .map((p) => p.tax_class_id)
        .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    )
  );

  const taxClassMap = new Map<string, number>();
  if (taxClassIds.length > 0) {
    const { data: taxClasses } = await supabaseAdmin
      .from('tax_classes')
      .select('id, rate_percent')
      .eq('tenant_id', tenantId)
      .in('id', taxClassIds);

    (taxClasses || []).forEach((tc) => {
      taxClassMap.set(tc.id, Number(tc.rate_percent) || 0);
    });
  }
  let subtotalCents = 0;
  let taxCents = 0;
  let baseSubtotalCents = 0;
  const productPrices: ProductPriceInfo[] = [];

  items.forEach((item, index) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return;
    // Prefer client-provided unit price (e.g., variant price), fallback to product base price
    const unitPrice = typeof item.unitPriceCents === 'number' && item.unitPriceCents >= 0
      ? item.unitPriceCents
      : (typeof product.price_cents === 'number' ? product.price_cents : 0);
    const qty = Number(item.quantity) || 0;
    const lineSubtotal = unitPrice * qty; // Stored prices are tax-inclusive
    subtotalCents += lineSubtotal;

    productPrices.push({
      lineIndex: index,
      productId: item.productId,
      priceCents: unitPrice,
      quantity: qty,
      lineTotalCents: lineSubtotal
    });

    const taxRatePercent = product.taxable === false ? 0 : (product.tax_class_id ? taxClassMap.get(product.tax_class_id) || 0 : 0);

    if (taxRatePercent > 0) {
      // Derive embedded tax: base = gross / (1 + rate)
      const lineBase = Math.round(lineSubtotal / (1 + taxRatePercent / 100));
      const lineTax = Math.max(lineSubtotal - lineBase, 0);
      baseSubtotalCents += lineBase;
      taxCents += lineTax;
    } else {
      baseSubtotalCents += lineSubtotal;
    }
  });

  return {
    subtotalCents, // gross total customer pays (tax-inclusive)
    taxCents, // tax portion already included in subtotal
    baseSubtotalCents, // net of tax
    totalCents: subtotalCents, // do NOT add tax again
    productPrices, // Return actual database prices
  };
}

async function resolveOrderCustomerId(
  tenantId: string,
  providedCustomerId: string | undefined,
  customerEmail: string,
  providerLabel: 'PhonePe' | 'Razorpay'
): Promise<string | null> {
  const normalizedProvidedId = providedCustomerId?.trim();

  if (normalizedProvidedId) {
    const { data: customerById, error: customerByIdError } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('id', normalizedProvidedId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (!customerByIdError && customerById?.id) {
      return customerById.id;
    }

    console.warn(`[${providerLabel}] Provided customerId is not a valid tenant customer, falling back to email lookup`, {
      tenantId,
      customerId: normalizedProvidedId,
      error: customerByIdError?.message,
    });
  }

  if (!customerEmail || customerEmail === 'guest@example.com') {
    return null;
  }

  console.log(`[${providerLabel}] Looking up customer by email:`, customerEmail);
  const { data: customerByEmail, error: customerByEmailError } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('email', customerEmail)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (!customerByEmailError && customerByEmail?.id) {
    console.log(`[${providerLabel}] Found customer ID:`, customerByEmail.id);
    return customerByEmail.id;
  }

  if (customerByEmailError) {
    console.warn(`[${providerLabel}] Customer email lookup failed`, {
      tenantId,
      customerEmail,
      error: customerByEmailError.message,
    });
  } else {
    console.warn(`[${providerLabel}] No customer found for email:`, customerEmail);
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const resolvedTenantId = await resolveTenantIdFromRequest();

    const body = (await request.json().catch(() => ({}))) as {
      tenantKey?: string;
      amountPaise?: number;
      mode?: 'quote' | 'test' | 'payment' | 'live';
      customer?: {
        name?: string;
        email?: string;
        phone?: string;
        address1?: string;
        address2?: string;
        city?: string;
        state?: string;
        pincode?: string;
        gstin?: string;
      };
      items?: CheckoutItem[];
      walletUsedRupees?: number;
      customerId?: string;
      coupon_code?: string;
      coupon_id?: string;
      discount_amount_cents?: number;
    };

    // Fallback to explicit tenant key from client if middleware header/cookie is missing (e.g., global checkout routes)
    const explicitTenantId = body.tenantKey ? await resolveTenantIdFromKey(body.tenantKey) : null;
    const tenantId = resolvedTenantId || explicitTenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenant_not_found' }, { status: 400 });
    }

    const customerEmail = body.customer?.email || 'guest@example.com';
    const customerPhone = body.customer?.phone || '9999999999';

    const itemPayload: CheckoutItem[] = Array.isArray(body.items)
      ? body.items.map((it) => ({
          productId: String(it.productId),
          quantity: Number(it.quantity) || 0,
          unitPriceCents: typeof it.unitPriceCents === 'number' ? it.unitPriceCents : undefined,
        }))
      : [];

    const totals = await calculateCartTotals(tenantId, itemPayload);
    
    // Apply discount if provided
    let finalAmountPaise = totals.totalCents || body.amountPaise || 0;
    if (body.discount_amount_cents && body.discount_amount_cents > 0) {
      finalAmountPaise = Math.max(0, finalAmountPaise - body.discount_amount_cents);
    }
    
    // Apply wallet deduction if provided
    if (body.walletUsedRupees && body.walletUsedRupees > 0) {
      const walletUsedCents = Math.round(body.walletUsedRupees * 100);
      finalAmountPaise = Math.max(0, finalAmountPaise - walletUsedCents);
    }
    
    const amountPaise = finalAmountPaise;

    const mode = body.mode || 'quote';

    // Get payment provider for this tenant
    const provider = await getPaymentProvider(tenantId);
    console.log(`[checkout] Using payment provider: ${provider} for tenant: ${tenantId}`);

    // Quote/test requests should never create orders or payment intents.
    if (mode === 'quote' || mode === 'test') {
      return NextResponse.json({ totals });
    }

    if (mode !== 'payment' && mode !== 'live') {
      return NextResponse.json({ error: 'invalid_mode' }, { status: 400 });
    }

    // Route to appropriate payment provider
    if (provider === 'phonepe') {
      const forwardedProto = request.headers.get('x-forwarded-proto');
      const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
      const requestBaseUrl = forwardedProto && forwardedHost
        ? `${forwardedProto}://${forwardedHost}`
        : new URL(request.url).origin;

      return await handlePhonePeCheckout(tenantId, amountPaise, customerEmail, customerPhone, { 
        ...body, 
        items: itemPayload, 
        totals,
        coupon_code: body.coupon_code,
        coupon_id: body.coupon_id,
        discount_amount_cents: body.discount_amount_cents,
        walletUsedRupees: body.walletUsedRupees,
        customerId: body.customerId
      }, requestBaseUrl);
    } else if (provider === 'razorpay') {
      return await handleRazorpayCheckout(tenantId, amountPaise, customerEmail, customerPhone, { 
        ...body, 
        items: itemPayload, 
        totals,
        coupon_code: body.coupon_code,
        coupon_id: body.coupon_id,
        discount_amount_cents: body.discount_amount_cents,
        walletUsedRupees: body.walletUsedRupees,
        customerId: body.customerId
      });
    } else {
      return NextResponse.json({ error: 'unsupported_payment_provider' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Checkout API: Unexpected error:', error);
    return NextResponse.json({ 
      error: 'internal_server_error', 
      message: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

// PhonePe Standard Checkout handler (using SDK)
async function handlePhonePeCheckout(
  tenantId: string,
  amountPaise: number,
  customerEmail: string,
  customerPhone: string,
  body: { 
    items?: CheckoutItem[]; 
    totals?: { subtotalCents: number; taxCents: number; totalCents: number };
    coupon_code?: string;
    coupon_id?: string;
    discount_amount_cents?: number;
    walletUsedRupees?: number;
    customerId?: string;
  },
  requestBaseUrl?: string
) {
  // Check if SDK credentials are configured
  const clientId = process.env.PHONEPE_CLIENT_ID;
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
  const merchantId = process.env.PHONEPE_MERCHANT_ID;
  
  if (
    !clientId ||
    !clientSecret ||
    !merchantId ||
    clientId.includes('TODO') ||
    clientSecret.includes('TODO') ||
    merchantId.includes('TODO')
  ) {
    return NextResponse.json({ 
      error: 'phonepe_sdk_credentials_not_configured',
      message: 'Please configure PHONEPE_CLIENT_ID, PHONEPE_CLIENT_SECRET, and PHONEPE_MERCHANT_ID in environment variables'
    }, { status: 500 });
  }

  const orderId = `phonepe_${tenantId.replace(/-/g, '').slice(0, 8)}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Calculate wallet and cash amounts
  const walletUsedCents = body.walletUsedRupees ? Math.round(body.walletUsedRupees * 100) : 0;
  const originalTotalCents = body.totals?.totalCents || 0;
  const discountCents = body.discount_amount_cents || 0;
  const totalAfterDiscount = Math.max(0, originalTotalCents - discountCents);
  const cashPaidCents = Math.max(0, totalAfterDiscount - walletUsedCents);

  const customerId = await resolveOrderCustomerId(tenantId, body.customerId, customerEmail, 'PhonePe');

  console.log('PhonePe Order Creation:', {
    orderId,
    tenantId,
    totalAfterDiscount,
    walletUsedCents,
    cashPaidCents,
    customerId,
    hasCustomerId: !!customerId
  });

  // Create order record in database (with conflict handling)
  let order: any = null;
  const { data: orderData, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      order_number: orderId,
      tenant_id: tenantId,
      customer_id: customerId, // ✅ Include customer_id from the start
      status: 'pending',
      total_cents: totalAfterDiscount,
      wallet_used_cents: walletUsedCents,
      cash_paid_cents: cashPaidCents,
      payment_provider: 'phonepe',
      payment_env: process.env.PHONEPE_ENV === 'SANDBOX' ? 'test' : 'live',
      email: customerEmail,
      currency: 'INR',
      coupon_id: body.coupon_id,
      coupon_code: body.coupon_code,
      discount_amount_cents: discountCents
    })
    .select()
    .single();

  if (orderError) {
    console.error('PhonePe order creation error:', orderError);
    
    // If it's a duplicate key error, try to find the existing order
    if (orderError.message?.includes('duplicate key') || orderError.code === '23505') {
      console.log('Duplicate order detected, checking if order exists...');
      
      const { data: existingOrder } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('order_number', orderId)
        .eq('tenant_id', tenantId)
        .single();
      
      if (existingOrder) {
        console.log('Using existing order:', existingOrder.id);
        order = existingOrder;
      } else {
        throw new Error(`Order creation failed: ${orderError.message}`);
      }
    } else {
      throw new Error(`Order creation failed: ${orderError.message}`);
    }
  } else {
    order = orderData;
  }

  if (!order) {
    throw new Error('Order creation failed: No order returned');
  }

  console.log('[PhonePe] Order created successfully:', {
    orderId: order.id,
    orderNumber: order.order_number,
    customerId: order.customer_id,
    hasCustomerId: !!order.customer_id
  });

  // No need to update order - all fields already set in insert above

  // Use SDK-based payment creation (no config needed, uses global phonepeConfig)
  const { redirectUrl } = await createPhonePePayment(
    tenantId,
    orderId,
    amountPaise,
    customerEmail,
    customerPhone,
    undefined,
    requestBaseUrl
  );

  // Persist order items
  const items = body.items || [];
  console.log('[PhonePe] 🔥 RECOMPILED CODE RUNNING - v2.0 🔥');
  console.log('[PhonePe] Preparing to insert order items:', {
    orderIdExists: !!order?.id,
    orderId: order?.id,
    itemsCount: items.length,
    items: items.map(it => ({ productId: it.productId, quantity: it.quantity, unitPrice: it.unitPriceCents })),
    timestamp: new Date().toISOString()
  });
  
  if (Array.isArray(items) && items.length > 0) {
    const itemsPayload = items.map((it) => ({
      tenant_id: tenantId,
      order_id: order.id,
      product_id: it.productId,
      quantity: it.quantity,
      unit_price_cents: it.unitPriceCents ?? 0,
      subtotal_cents: (it.unitPriceCents ?? 0) * it.quantity,
    }));
    
    console.log('[PhonePe] Inserting order items payload:', itemsPayload);
    
    const { data: insertedItems, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(itemsPayload)
      .select();
    
    if (itemsError) {
      console.error('[PhonePe] ❌ Failed to insert order items:', {
        error: itemsError,
        code: itemsError.code,
        message: itemsError.message,
        details: itemsError.details
      });
      // Don't fail the order, but log prominently
      console.error('[PhonePe] ⚠️ ORDER CREATED BUT ITEMS NOT SAVED - CASHBACK WILL NOT WORK!');
    } else {
      console.log(`[PhonePe] ✅ Successfully inserted ${insertedItems?.length || 0} order items`);
    }
  } else {
    console.warn('[PhonePe] ⚠️ No items to insert - order will have no items!');
  }

  // Store pending coupon data for webhook processing
  if (body.coupon_id && body.coupon_code && customerId) {
    await supabaseAdmin.from('pending_coupon_usage').insert({
      tenant_id: tenantId,
      order_id: order.id,
      coupon_id: body.coupon_id,
      coupon_code: body.coupon_code,
      customer_id: customerId,
      discount_amount_cents: body.discount_amount_cents || 0,
      created_at: new Date().toISOString()
    });
  }

  return NextResponse.json({ 
    success: true, 
    redirectUrl,
    orderId,
    provider: 'phonepe'
  });
}

// Razorpay checkout handler
async function handleRazorpayCheckout(
  tenantId: string,
  amountPaise: number,
  customerEmail: string,
  customerPhone: string,
  body: { 
    items?: CheckoutItem[]; 
    totals?: { subtotalCents: number; taxCents: number; totalCents: number };
    coupon_code?: string;
    coupon_id?: string;
    discount_amount_cents?: number;
    walletUsedRupees?: number;
    customerId?: string;
  }
) {
  const credentials = await resolveRazorpayCredentials(tenantId);
  if (!credentials) {
    return NextResponse.json({ error: 'razorpay_credentials_not_configured' }, { status: 500 });
  }

  const razorpay = new Razorpay({
    key_id: credentials.keyId,
    key_secret: credentials.keySecret,
  });

  // Calculate wallet and cash amounts
  const walletUsedCents = body.walletUsedRupees ? Math.round(body.walletUsedRupees * 100) : 0;
  const originalTotalCents = body.totals?.totalCents || 0;
  const discountCents = body.discount_amount_cents || 0;
  const totalAfterDiscount = Math.max(0, originalTotalCents - discountCents);
  const cashPaidCents = Math.max(0, totalAfterDiscount - walletUsedCents);

  const customerId = await resolveOrderCustomerId(tenantId, body.customerId, customerEmail, 'Razorpay');

  // Create Razorpay order
  const rzpOrder = await razorpay.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt: `rcpt_${Date.now()}`,
  });

  console.log('[Razorpay] Order Creation:', {
    rzpOrderId: rzpOrder.id,
    tenantId,
    totalAfterDiscount,
    walletUsedCents,
    cashPaidCents,
    customerId,
    hasCustomerId: !!customerId
  });

  // Create order in database (with conflict handling)
  let order: any = null;
  const { data: orderData, error } = await supabaseAdmin
    .from('orders')
    .insert({
      order_number: rzpOrder.id,
      tenant_id: tenantId,
      customer_id: customerId, // ✅ Include customer_id from the start
      status: 'pending',
      total_cents: totalAfterDiscount,
      wallet_used_cents: walletUsedCents,
      cash_paid_cents: cashPaidCents,
      payment_provider: 'razorpay',
      razorpay_order_id: rzpOrder.id,
      email: customerEmail,
      payment_env: credentials.env,
      currency: 'INR',
      coupon_id: body.coupon_id,
      coupon_code: body.coupon_code,
      discount_amount_cents: discountCents
    })
    .select()
    .single();

  if (error) {
    console.error('Razorpay order creation error:', error);
    
    // If it's a duplicate key error, try to find the existing order
    if (error.message?.includes('duplicate key') || error.code === '23505') {
      console.log('Duplicate order detected, checking if order exists...');
      
      const { data: existingOrder } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('order_number', rzpOrder.id)
        .eq('tenant_id', tenantId)
        .single();
      
      if (existingOrder) {
        console.log('Using existing order:', existingOrder.id);
        order = existingOrder;
      } else {
        throw new Error(`Order creation failed: ${error.message}`);
      }
    } else {
      throw new Error(`Order creation failed: ${error.message}`);
    }
  } else {
    order = orderData;
  }

  if (!order) {
    throw new Error('Order creation failed: No order returned');
  }

  console.log('[Razorpay] Order created successfully:', {
    orderId: order.id,
    orderNumber: order.order_number,
    customerId: order.customer_id,
    hasCustomerId: !!order.customer_id
  });

  // No need to update order - all fields already set in insert above

  if (error || !order) {
    throw new Error(`Order creation failed: ${error?.message}`);
  }

  // Persist order items
  const items = body.items || [];
  console.log('[Razorpay] 🔥 RECOMPILED CODE RUNNING - v2.0 🔥');
  console.log('[Razorpay] Preparing to insert order items:', {
    orderIdExists: !!order?.id,
    orderId: order?.id,
    itemsCount: items.length,
    items: items.map(it => ({ productId: it.productId, quantity: it.quantity, unitPrice: it.unitPriceCents }))
  });
  
  if (Array.isArray(items) && items.length > 0) {
    const itemsPayload = items.map((it) => ({
      tenant_id: tenantId,
      order_id: order.id,
      product_id: it.productId,
      quantity: it.quantity,
      unit_price_cents: it.unitPriceCents ?? 0,
      subtotal_cents: (it.unitPriceCents ?? 0) * it.quantity,
    }));
    
    console.log('[Razorpay] Inserting order items payload:', itemsPayload);
    
    const { data: insertedItems, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(itemsPayload)
      .select();
    
    if (itemsError) {
      console.error('[Razorpay] ❌ Failed to insert order items:', {
        error: itemsError,
        code: itemsError.code,
        message: itemsError.message,
        details: itemsError.details
      });
      // Don't fail the order, but log prominently
      console.error('[Razorpay] ⚠️ ORDER CREATED BUT ITEMS NOT SAVED - CASHBACK WILL NOT WORK!');
    } else {
      console.log(`[Razorpay] ✅ Successfully inserted ${insertedItems?.length || 0} order items`);
    }
  } else {
    console.warn('[Razorpay] ⚠️ No items to insert - order will have no items!');
  }

  // Store pending coupon data for webhook processing
  if (body.coupon_id && body.coupon_code && customerId) {
    await supabaseAdmin.from('pending_coupon_usage').insert({
      tenant_id: tenantId,
      order_id: order.id,
      coupon_id: body.coupon_id,
      coupon_code: body.coupon_code,
      customer_id: customerId,
      discount_amount_cents: body.discount_amount_cents || 0,
      created_at: new Date().toISOString()
    });
  }

  return NextResponse.json({
    success: true,
    order: { id: rzpOrder.id },
    keyId: credentials.keyId,
    provider: 'razorpay'
  });
}
