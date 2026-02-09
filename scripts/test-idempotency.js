/**
 * IDEMPOTENCY TESTING SCRIPT
 * 
 * Tests that webhooks properly handle duplicate calls without
 * processing cashback/emails multiple times.
 * 
 * Usage:
 *   node scripts/test-idempotency.js
 * 
 * What it tests:
 * 1. First webhook call processes successfully
 * 2. Second webhook call returns "Already processed"
 * 3. Third webhook call also returns "Already processed"
 * 4. Wallet balance only credited once
 * 5. Cashback transaction only created once
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test configuration
const TEST_ORDER_NUMBER = 'test_idempotency_' + Date.now();
const TEST_CUSTOMER_EMAIL = 'shariqrahman03@gmail.com';

async function setupTestOrder() {
  console.log('📦 Setting up test order...\n');
  
  // Get customer
  const { data: customer } = await supabase
    .from('customers')
    .select('id, tenant_id')
    .eq('email', TEST_CUSTOMER_EMAIL)
    .single();
  
  if (!customer) {
    console.error('❌ Customer not found:', TEST_CUSTOMER_EMAIL);
    console.log('Please use an existing customer email or create one first.');
    process.exit(1);
  }
  
  console.log('✅ Customer found:', customer.id);
  
  // Create test order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      tenant_id: customer.tenant_id,
      order_number: TEST_ORDER_NUMBER,
      customer_id: customer.id,
      status: 'pending',
      total_cents: 50000, // ₹500
      wallet_used_cents: 0,
      cash_paid_cents: 50000,
      payment_provider: 'phonepe',
      payment_env: 'test',
      email: TEST_CUSTOMER_EMAIL,
      currency: 'INR',
      post_payment_processed: false // ✅ Not processed yet
    })
    .select()
    .single();
  
  if (orderError) {
    console.error('❌ Failed to create order:', orderError);
    process.exit(1);
  }
  
  console.log('✅ Test order created:', order.id);
  
  // Create test order items
  const { data: products } = await supabase
    .from('products')
    .select('id, cost_per_item_cents')
    .eq('tenant_id', customer.tenant_id)
    .limit(1)
    .single();
  
  if (products) {
    await supabase
      .from('order_items')
      .insert({
        tenant_id: customer.tenant_id,
        order_id: order.id,
        product_id: products.id,
        quantity: 1,
        unit_price_cents: 50000,
        subtotal_cents: 50000
      });
    
    console.log('✅ Order items created\n');
  }
  
  return { order, customer };
}

async function simulateWebhook(orderNumber, callNumber) {
  console.log(`\n🔔 Webhook Call #${callNumber}`);
  console.log('─'.repeat(60));
  
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/webhooks/phonepe', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-VERIFY': 'test_signature' // Mock signature for testing
      },
      body: JSON.stringify({
        merchantTransactionId: orderNumber,
        transactionId: 'test_txn_' + Date.now(),
        amount: 50000,
        state: 'COMPLETED',
        code: 'PAYMENT_SUCCESS'
      })
    });
    
    const duration = Date.now() - startTime;
    const responseText = await response.text();
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Response: ${responseText}`);
    
    return {
      status: response.status,
      body: responseText,
      duration
    };
  } catch (error) {
    console.error('❌ Webhook call failed:', error.message);
    return {
      status: 0,
      error: error.message
    };
  }
}

async function checkOrderState(orderNumber) {
  console.log('\n📊 Checking order state...');
  console.log('─'.repeat(60));
  
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .single();
  
  if (!order) {
    console.log('❌ Order not found');
    return null;
  }
  
  console.log(`Status: ${order.status}`);
  console.log(`Post-payment processed: ${order.post_payment_processed}`);
  console.log(`Cashback amount: ₹${(order.cashback_amount_cents || 0) / 100}`);
  
  // Check cashback transactions
  const { data: cashbackTxns } = await supabase
    .from('cashback_transactions')
    .select('*')
    .eq('order_id', order.id);
  
  console.log(`Cashback transactions: ${cashbackTxns?.length || 0}`);
  
  // Check wallet credits
  const { data: walletCredits } = await supabase
    .from('wallet_ledger')
    .select('*')
    .eq('reference_id', order.id)
    .eq('source_key', 'CASHBACK')
    .eq('entry_type', 'credit');
  
  console.log(`Wallet credits: ${walletCredits?.length || 0}`);
  
  if (walletCredits && walletCredits.length > 0) {
    const totalCredited = walletCredits.reduce((sum, w) => sum + w.amount_cents, 0);
    console.log(`Total credited: ₹${totalCredited / 100}`);
  }
  
  return {
    order,
    cashbackTxnCount: cashbackTxns?.length || 0,
    walletCreditCount: walletCredits?.length || 0
  };
}

async function cleanup(orderNumber) {
  console.log('\n🧹 Cleaning up test data...');
  
  const { data: order } = await supabase
    .from('orders')
    .select('id')
    .eq('order_number', orderNumber)
    .single();
  
  if (order) {
    // Delete order items
    await supabase
      .from('order_items')
      .delete()
      .eq('order_id', order.id);
    
    // Delete cashback transactions
    await supabase
      .from('cashback_transactions')
      .delete()
      .eq('order_id', order.id);
    
    // Delete wallet ledger entries
    await supabase
      .from('wallet_ledger')
      .delete()
      .eq('reference_id', order.id);
    
    // Delete order
    await supabase
      .from('orders')
      .delete()
      .eq('id', order.id);
    
    console.log('✅ Test data cleaned up');
  }
}

async function runTest() {
  console.log('═'.repeat(60));
  console.log('🧪 IDEMPOTENCY TEST');
  console.log('═'.repeat(60));
  console.log('');
  
  let testOrder;
  
  try {
    // Setup
    const { order, customer } = await setupTestOrder();
    testOrder = order;
    
    // Initial state check
    const initialState = await checkOrderState(TEST_ORDER_NUMBER);
    
    if (initialState.order.post_payment_processed) {
      console.log('\n❌ Order already marked as processed!');
      console.log('This should not happen for a new order.');
      return;
    }
    
    // Simulate 3 rapid webhook calls
    console.log('\n🚀 Simulating 3 rapid webhook calls...');
    
    const call1 = await simulateWebhook(TEST_ORDER_NUMBER, 1);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const call2 = await simulateWebhook(TEST_ORDER_NUMBER, 2);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const call3 = await simulateWebhook(TEST_ORDER_NUMBER, 3);
    
    // Final state check
    const finalState = await checkOrderState(TEST_ORDER_NUMBER);
    
    // Verify results
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('📋 TEST RESULTS');
    console.log('═'.repeat(60));
    
    const results = [];
    
    // Check 1: All calls returned 200
    const allSuccess = call1.status === 200 && call2.status === 200 && call3.status === 200;
    results.push({
      test: 'All webhook calls returned 200',
      passed: allSuccess,
      details: `Call 1: ${call1.status}, Call 2: ${call2.status}, Call 3: ${call3.status}`
    });
    
    // Check 2: Order marked as processed
    results.push({
      test: 'Order marked as post_payment_processed',
      passed: finalState.order.post_payment_processed === true,
      details: `post_payment_processed = ${finalState.order.post_payment_processed}`
    });
    
    // Check 3: Only one cashback transaction
    results.push({
      test: 'Only ONE cashback transaction created',
      passed: finalState.cashbackTxnCount === 1,
      details: `Found ${finalState.cashbackTxnCount} transaction(s)`
    });
    
    // Check 4: Only one wallet credit
    results.push({
      test: 'Only ONE wallet credit created',
      passed: finalState.walletCreditCount === 1,
      details: `Found ${finalState.walletCreditCount} credit(s)`
    });
    
    // Check 5: Order status is paid
    results.push({
      test: 'Order status is "paid"',
      passed: finalState.order.status === 'paid',
      details: `Status: ${finalState.order.status}`
    });
    
    // Print results
    let allPassed = true;
    results.forEach((result, index) => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`\n${icon} Test ${index + 1}: ${result.test}`);
      console.log(`   ${result.details}`);
      if (!result.passed) allPassed = false;
    });
    
    console.log('\n');
    console.log('═'.repeat(60));
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED! Idempotency is working correctly!');
    } else {
      console.log('⚠️  SOME TESTS FAILED - Review the results above');
    }
    console.log('═'.repeat(60));
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  } finally {
    // Cleanup
    if (testOrder) {
      await cleanup(TEST_ORDER_NUMBER);
    }
  }
}

// Run the test
runTest().catch(console.error);
