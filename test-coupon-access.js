#!/usr/bin/env node

/**
 * Test coupon page access
 */

const http = require('http');
const https = require('https');

async function testCouponAccess() {
  console.log('🔍 Testing coupon page access...\n');

  // Test different URLs that might be causing issues
  const testUrls = [
    'http://localhost:3000/admin/coupons',
    'http://localhost:3000/senlysh/admin/coupons',
    'http://localhost:3000/bluebell/admin/coupons',
  ];

  console.log('💡 To test properly, you need to:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Login to admin panel first');
  console.log('3. Then try accessing the coupon page');
  console.log('');

  console.log('🌐 URLs to test in browser:');
  testUrls.forEach((url, index) => {
    console.log(`${index + 1}. ${url}`);
  });

  console.log('\n🔧 Common routing issues and solutions:');
  console.log('');
  console.log('❌ Issue: "404 Not Found"');
  console.log('   ✅ Solution: Check if Next.js dev server is running');
  console.log('   ✅ Solution: Verify file structure matches Next.js App Router conventions');
  console.log('');
  console.log('❌ Issue: "Module Disabled" message');
  console.log('   ✅ Solution: Coupon module is disabled for this tenant');
  console.log('   ✅ Solution: Check tenant_modules table in database');
  console.log('');
  console.log('❌ Issue: "Unauthorized" or redirect to login');
  console.log('   ✅ Solution: Login to admin panel first');
  console.log('   ✅ Solution: Check authentication cookies');
  console.log('');
  console.log('❌ Issue: Blank page or loading forever');
  console.log('   ✅ Solution: Check browser console for JavaScript errors');
  console.log('   ✅ Solution: Check Network tab for failed API requests');
  console.log('');
  console.log('❌ Issue: "Tenant not found" error');
  console.log('   ✅ Solution: Check middleware tenant resolution');
  console.log('   ✅ Solution: Ensure tenant cookie is set correctly');

  console.log('\n🐛 Debugging checklist:');
  console.log('1. ✅ Files exist (already verified)');
  console.log('2. ✅ Database configured (already verified)');
  console.log('3. ⏳ Start dev server: npm run dev');
  console.log('4. ⏳ Login to admin: http://localhost:3000/login');
  console.log('5. ⏳ Test coupon page: http://localhost:3000/admin/coupons');
  console.log('6. ⏳ Check browser console for errors');
  console.log('7. ⏳ Check Network tab for failed requests');

  console.log('\n✅ Test preparation complete!');
  console.log('💡 Start the dev server and test the URLs above');
}

testCouponAccess().catch(console.error);