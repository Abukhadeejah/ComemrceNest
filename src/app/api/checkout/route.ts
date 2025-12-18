import { NextRequest, NextResponse } from 'next/server';
import { createPhonePePayment } from '@/lib/payments/phonepe';
import { supabaseAdmin } from '@/server/supabaseAdmin';
import { resolveTenantIdFromRequest } from '@/server/tenant';
import { getPaymentProvider, resolveRazorpayCredentials, resolvePhonePeCredentials } from '@/server/payments';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest();
    if (!tenantId) {
      return NextResponse.json({ error: 'tenant_not_found' }, { status: 400 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      amountPaise?: number;
      mode?: 'test' | 'live';
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
      items?: Array<{
        productId: string;
        quantity: number;
        unitPriceCents: number;
      }>;
    };

    const amountPaise = typeof body.amountPaise === 'number' ? body.amountPaise : 100;
    const customerEmail = body.customer?.email || 'guest@example.com';
    const customerPhone = body.customer?.phone || '9999999999';

    // Get payment provider for this tenant
    const provider = await getPaymentProvider(tenantId);
    console.log(`[checkout] Using payment provider: ${provider} for tenant: ${tenantId}`);

    // Route to appropriate payment provider
    if (provider === 'phonepe') {
      return await handlePhonePeCheckout(tenantId, amountPaise, customerEmail, customerPhone, body);
    } else if (provider === 'razorpay') {
      return await handleRazorpayCheckout(tenantId, amountPaise, customerEmail, customerPhone, body);
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
  body: any
) {
  // Check if SDK credentials are configured
  const clientId = process.env.PHONEPE_CLIENT_ID;
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret || clientId.includes('TODO') || clientSecret.includes('TODO')) {
    return NextResponse.json({ 
      error: 'phonepe_sdk_credentials_not_configured',
      message: 'Please configure PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET in environment variables'
    }, { status: 500 });
  }

  const orderId = `phonepe_${tenantId.replace(/-/g, '').slice(0, 8)}_${Date.now().toString().slice(-10)}`;

  // Use SDK-based payment creation (no config needed, uses global phonepeConfig)
  const { redirectUrl } = await createPhonePePayment(
    tenantId,
    orderId,
    amountPaise,
    customerEmail,
    customerPhone
  );

  // Persist order items
  if (Array.isArray(body.items) && body.items.length > 0) {
    const itemsPayload = body.items.map((it: any) => ({
      tenant_id: tenantId,
      order_id: orderId,
      product_id: it.productId,
      quantity: it.quantity,
      unit_price_cents: it.unitPriceCents,
      subtotal_cents: it.unitPriceCents * it.quantity,
    }));
    
    await supabaseAdmin.from('order_items').insert(itemsPayload);
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
  body: any
) {
  const credentials = await resolveRazorpayCredentials(tenantId);
  if (!credentials) {
    return NextResponse.json({ error: 'razorpay_credentials_not_configured' }, { status: 500 });
  }

  const razorpay = new Razorpay({
    key_id: credentials.keyId,
    key_secret: credentials.keySecret,
  });

  // Create Razorpay order
  const rzpOrder = await razorpay.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt: `rcpt_${Date.now()}`,
  });

  // Create order in database
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .insert({
      order_number: rzpOrder.id,
      tenant_id: tenantId,
      status: 'pending',
      total_cents: amountPaise,
      payment_provider: 'razorpay',
      razorpay_order_id: rzpOrder.id,
      email: customerEmail,
      payment_env: credentials.env,
    })
    .select()
    .single();

  if (error || !order) {
    throw new Error(`Order creation failed: ${error?.message}`);
  }

  // Persist order items
  if (Array.isArray(body.items) && body.items.length > 0) {
    const itemsPayload = body.items.map((it: any) => ({
      tenant_id: tenantId,
      order_id: order.id,
      product_id: it.productId,
      quantity: it.quantity,
      unit_price_cents: it.unitPriceCents,
      subtotal_cents: it.unitPriceCents * it.quantity,
    }));
    
    await supabaseAdmin.from('order_items').insert(itemsPayload);
  }

  return NextResponse.json({
    success: true,
    order: { id: rzpOrder.id },
    keyId: credentials.keyId,
    provider: 'razorpay'
  });
}
