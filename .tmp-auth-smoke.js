const { createClient } = require('@supabase/supabase-js');
const { chromium } = require('playwright');
require('dotenv').config({ path: '.env.local' });

(async () => {
  const baseUrl = 'http://localhost:3000';
  const tenantKey = 'senlysh';
  const tenantId = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) throw new Error('Missing Supabase env vars');

  const admin = createClient(supabaseUrl, serviceRole);

  const { data: product, error: productError } = await admin
    .from('products')
    .select('id, name, sku')
    .eq('tenant_id', tenantId)
    .limit(1)
    .maybeSingle();

  if (productError || !product) throw new Error(`No product: ${productError?.message || 'none'}`);

  const stamp = Date.now();
  const email = `smoke.customer.${stamp}@example.com`;
  const password = 'SmokePass!12345';

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { smoke_test: true }
  });
  if (authError || !authUser?.user?.id) throw new Error(`Create user failed: ${authError?.message || 'no id'}`);

  const userId = authUser.user.id;
  const { data: customer, error: customerError } = await admin
    .from('customers')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      email,
      first_name: 'Smoke',
      last_name: 'Customer',
      phone: '9999999999',
      marketing_opt_in: false,
    })
    .select('id')
    .single();
  if (customerError || !customer?.id) throw new Error(`Create customer failed: ${customerError?.message || 'no id'}`);

  const orderNumber = `SMOKE-${stamp}`;
  const unitPrice = 49900;
  const quantity = 1;
  const subtotal = unitPrice * quantity;

  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({
      order_number: orderNumber,
      tenant_id: tenantId,
      customer_id: customer.id,
      status: 'paid',
      total_cents: subtotal,
      wallet_used_cents: 0,
      cash_paid_cents: subtotal,
      payment_provider: 'phonepe',
      payment_env: 'test',
      email,
      currency: 'INR',
      discount_amount_cents: 0,
      cashback_amount_cents: 0,
      cashback_pct: 0,
    })
    .select('id, order_number')
    .single();
  if (orderError || !order?.id) throw new Error(`Create order failed: ${orderError?.message || 'no id'}`);

  const { error: itemError } = await admin
    .from('order_items')
    .insert({
      tenant_id: tenantId,
      order_id: order.id,
      product_id: product.id,
      quantity,
      unit_price_cents: unitPrice,
      subtotal_cents: subtotal,
    });
  if (itemError) throw new Error(`Create item failed: ${itemError.message}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: baseUrl });
  const page = await context.newPage();
  page.setDefaultTimeout(120000);
  page.setDefaultNavigationTimeout(120000);

  const result = { orderId: order.id, email, customer: {}, admin: {}, invoice: {} };

  await page.goto(`/${tenantKey}/login`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/senlysh\/(profile|my-account|account)/, { timeout: 20000 }).catch(() => {});

  const cookies = await context.cookies();
  const hasAuthCookie = cookies.some((c) => /sb-.*-auth-token/.test(c.name));

  await page.goto(`/orders/${order.id}`, { waitUntil: 'networkidle', timeout: 120000 });
  result.customer = {
    url: page.url(),
    hasOrderDetails: await page.getByText('Order Details').count() > 0,
    hasInvoiceButton: await page.getByRole('button', { name: /Download Invoice|Generating/i }).count() > 0,
    hasOrderNotFound: await page.getByText('Order Not Found').count() > 0,
    hasSignInPrompt: await page.getByText(/Please sign in to view your order details/i).count() > 0,
    hasAuthCookie,
  };

  const invoiceResp = await context.request.get(`/api/orders/${order.id}/invoice`, {
    headers: {
      'x-tenant-admin': tenantKey,
      'x-pathname': `/${tenantKey}/orders/${order.id}`,
    },
  });
  const invoiceText = await invoiceResp.text();
  result.invoice = {
    status: invoiceResp.status(),
    contentType: invoiceResp.headers()['content-type'] || null,
    hasInvoiceTitle: invoiceText.includes('<title>Invoice'),
  };

  await page.goto(`/${tenantKey}/admin/order-details/${order.id}`, { waitUntil: 'networkidle', timeout: 120000 });
  result.admin = {
    url: page.url(),
    hasOrderDetails: await page.getByText('Order Details').count() > 0,
    hasInvoiceButton: await page.getByRole('button', { name: /Download Invoice|Generating/i }).count() > 0,
    hasOrderNotFound: await page.getByText('Order Not Found').count() > 0,
    title: await page.title(),
  };

  await browser.close();

  console.log('AUTH_SMOKE_RESULT_START');
  console.log(JSON.stringify(result, null, 2));
  console.log('AUTH_SMOKE_RESULT_END');
})();
