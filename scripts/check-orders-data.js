/**
 * Check Orders Data in Database
 * 
 * This script inspects what's actually stored in the orders table
 * to help debug the blank page issue.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOrdersData() {
  console.log('🔍 Checking Orders Data in Database...\n');

  // Get recent orders
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      tenant_id,
      customer_id,
      email,
      status,
      total_cents,
      currency,
      payment_provider,
      created_at,
      order_items (
        id,
        product_id,
        quantity,
        unit_price_cents,
        subtotal_cents
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Error fetching orders:', error);
    return;
  }

  if (!orders || orders.length === 0) {
    console.log('⚠️  No orders found in database!');
    console.log('\nThis means:');
    console.log('1. No orders have been created yet');
    console.log('2. Or there might be an issue with order creation');
    console.log('\nTry creating a test order to see if it gets stored.');
    return;
  }

  console.log(`✅ Found ${orders.length} recent orders\n`);
  console.log('='.repeat(80));

  orders.forEach((order, index) => {
    console.log(`\n📦 ORDER ${index + 1}`);
    console.log('-'.repeat(80));
    console.log(`ID (UUID):           ${order.id}`);
    console.log(`Order Number:        ${order.order_number}`);
    console.log(`Tenant ID:           ${order.tenant_id}`);
    console.log(`Customer ID:         ${order.customer_id || '(null - guest order)'}`);
    console.log(`Email:               ${order.email}`);
    console.log(`Status:              ${order.status}`);
    console.log(`Total:               ₹${(order.total_cents / 100).toFixed(2)}`);
    console.log(`Currency:            ${order.currency}`);
    console.log(`Payment Provider:    ${order.payment_provider}`);
    console.log(`Created:             ${new Date(order.created_at).toLocaleString()}`);
    console.log(`\nOrder Items:         ${order.order_items?.length || 0} items`);
    
    if (order.order_items && order.order_items.length > 0) {
      order.order_items.forEach((item, i) => {
        console.log(`  ${i + 1}. Product ID: ${item.product_id}`);
        console.log(`     Quantity: ${item.quantity}`);
        console.log(`     Unit Price: ₹${(item.unit_price_cents / 100).toFixed(2)}`);
        console.log(`     Subtotal: ₹${(item.subtotal_cents / 100).toFixed(2)}`);
      });
    } else {
      console.log('  ⚠️  No order items found!');
    }

    console.log(`\n🔗 Customer URL:     https://www.senlysh.in/orders/${order.id}`);
    console.log(`🔗 Admin URL:        https://www.senlysh.in/admin/orders/${order.id}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 SUMMARY');
  console.log('-'.repeat(80));

  // Check for common issues
  const ordersWithoutItems = orders.filter(o => !o.order_items || o.order_items.length === 0);
  const ordersWithoutCustomer = orders.filter(o => !o.customer_id);
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const paidOrders = orders.filter(o => o.status === 'paid');

  console.log(`Total Orders:              ${orders.length}`);
  console.log(`Orders with Items:         ${orders.length - ordersWithoutItems.length}`);
  console.log(`Orders without Items:      ${ordersWithoutItems.length} ${ordersWithoutItems.length > 0 ? '⚠️' : '✅'}`);
  console.log(`Orders with Customer:      ${orders.length - ordersWithoutCustomer.length}`);
  console.log(`Guest Orders:              ${ordersWithoutCustomer.length}`);
  console.log(`Pending Orders:            ${pendingOrders.length}`);
  console.log(`Paid Orders:               ${paidOrders.length}`);

  if (ordersWithoutItems.length > 0) {
    console.log('\n⚠️  WARNING: Some orders have no items!');
    console.log('This will cause issues with:');
    console.log('- Order details display');
    console.log('- Invoice generation');
    console.log('- Cashback calculation');
    console.log('\nOrders without items:');
    ordersWithoutItems.forEach(o => {
      console.log(`  - ${o.order_number} (${o.id})`);
    });
  }

  // Check tenant distribution
  console.log('\n📍 TENANT DISTRIBUTION');
  console.log('-'.repeat(80));
  const tenantCounts = {};
  orders.forEach(o => {
    tenantCounts[o.tenant_id] = (tenantCounts[o.tenant_id] || 0) + 1;
  });
  Object.entries(tenantCounts).forEach(([tenantId, count]) => {
    console.log(`${tenantId}: ${count} orders`);
  });

  // Check payment providers
  console.log('\n💳 PAYMENT PROVIDERS');
  console.log('-'.repeat(80));
  const providerCounts = {};
  orders.forEach(o => {
    providerCounts[o.payment_provider] = (providerCounts[o.payment_provider] || 0) + 1;
  });
  Object.entries(providerCounts).forEach(([provider, count]) => {
    console.log(`${provider}: ${count} orders`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Data check complete!');
  console.log('\nTo test order details page:');
  console.log('1. Copy one of the UUIDs above');
  console.log('2. Navigate to: https://www.senlysh.in/orders/[paste-uuid]');
  console.log('3. Check if the page loads correctly\n');
}

checkOrdersData().catch(console.error);
