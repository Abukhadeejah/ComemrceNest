#!/usr/bin/env node

/**
 * Test script to verify coupon system after deployment
 * Run this after adding environment variables and redeploying
 */

const https = require('https');

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Post-Deployment-Test/1.0',
        ...options.headers
      },
      ...options
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data.startsWith('{') || data.startsWith('[') ? JSON.parse(data) : data;
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testAfterDeployment() {
  const baseUrl = 'https://senlysh.in';  // Updated to use senlysh.in without www
  
  console.log('🧪 Testing coupon system after deployment...');
  console.log('=' .repeat(60));
  
  // Test 1: NextAuth session (should be fixed)
  console.log('1️⃣  NextAuth session endpoint...');
  try {
    const session = await makeRequest(`${baseUrl}/api/auth/session`);
    console.log(`   Status: ${session.status}`);
    if (session.status === 200) {
      console.log('   ✅ NextAuth working correctly');
    } else if (session.status === 401) {
      console.log('   ✅ NextAuth working (unauthorized - expected)');
    } else {
      console.log('   ❌ Still having issues');
      console.log(`   Response:`, session.data);
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }
  
  // Test 2: Admin coupons page (should redirect to login, not 404)
  console.log('\n2️⃣  Admin coupons page...');
  try {
    const admin = await makeRequest(`${baseUrl}/admin/coupons`);
    console.log(`   Status: ${admin.status}`);
    if (admin.status === 302 || admin.status === 307) {
      console.log(`   ✅ Redirecting to login (fixed!)`);
      console.log(`   Location: ${admin.headers.location}`);
    } else if (admin.status === 404) {
      console.log('   ❌ Still returning 404 - may need more time for deployment');
    } else if (admin.status === 200) {
      console.log('   ✅ Page accessible (if logged in)');
    } else {
      console.log(`   ❓ Unexpected status: ${admin.status}`);
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }
  
  // Test 3: Coupon validation (should still work)
  console.log('\n3️⃣  Coupon validation API...');
  try {
    const validation = await makeRequest(`${baseUrl}/api/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coupon_code: 'SHARIQ',
        order_total_cents: 40000,
        customer_id: '00000000-0000-0000-0000-000000000001',
        tenant_key: 'senlysh'
      })
    });
    console.log(`   Status: ${validation.status}`);
    if (validation.status === 200 && validation.data.valid) {
      console.log('   ✅ Coupon validation working perfectly');
      console.log(`   Discount: ₹${validation.data.discount_amount_cents / 100}`);
    } else {
      console.log('   ❌ Coupon validation issue');
      console.log(`   Response:`, validation.data);
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🎯 Results Summary:');
  console.log('   ✅ NextAuth session: Should return 200 or 401 (not 500)');
  console.log('   ✅ Admin page: Should redirect to login (not 404)');
  console.log('   ✅ Coupon validation: Should work perfectly');
  console.log('\n🚀 If all tests pass, your coupon system is fully working!');
}

testAfterDeployment().catch(console.error);