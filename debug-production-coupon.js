#!/usr/bin/env node

/**
 * Production Coupon Debugging Script
 */

console.log('🔍 Production Coupon Issue Debugging\n');

// Check if all required files exist
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'src/app/(admin)/admin/coupons/page.tsx',
  'src/app/(admin)/admin/coupons/CouponManager.tsx',
  'src/app/api/admin/coupons/route.ts',
  'src/app/api/admin/coupons/[id]/route.ts',
  'src/components/checkout/CouponInput.tsx'
];

console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

console.log('\n🏗️ Build troubleshooting steps:');
console.log('1. Check if build completed successfully');
console.log('2. Verify all files were deployed');
console.log('3. Check for any build errors in deployment logs');
console.log('4. Ensure environment variables are set in production');

console.log('\n🌐 Production debugging URLs to test:');
console.log('1. https://your-domain.com/admin/coupons');
console.log('2. https://your-domain.com/senlysh/admin/coupons');
console.log('3. Check browser network tab for 404s');
console.log('4. Check server logs for errors');

console.log('\n🔧 Common production issues:');
console.log('- Build cache not cleared');
console.log('- Files not properly deployed');
console.log('- Environment variables missing');
console.log('- Database connection issues');
console.log('- Authentication/session problems');

console.log('\n✅ Debugging complete!');