#!/usr/bin/env node

/**
 * Test script to check coupon routing issues
 */

const path = require('path');
const fs = require('fs');

console.log('🔍 Checking coupon routing configuration...\n');

// Check if coupon page files exist
const couponPagePath = 'src/app/(admin)/admin/coupons/page.tsx';
const couponContentPath = 'src/app/(admin)/admin/coupons/CouponsPageContent.tsx';
const couponApiPath = 'src/app/api/admin/coupons/route.ts';
const couponApiIdPath = 'src/app/api/admin/coupons/[id]/route.ts';

console.log('📁 Checking file existence:');
console.log(`✅ Coupon page: ${fs.existsSync(couponPagePath) ? 'EXISTS' : '❌ MISSING'}`);
console.log(`✅ Coupon content: ${fs.existsSync(couponContentPath) ? 'EXISTS' : '❌ MISSING'}`);
console.log(`✅ Coupon API: ${fs.existsSync(couponApiPath) ? 'EXISTS' : '❌ MISSING'}`);
console.log(`✅ Coupon API [id]: ${fs.existsSync(couponApiIdPath) ? 'EXISTS' : '❌ MISSING'}`);

// Check admin URLs configuration
const adminUrlsPath = 'src/utils/admin-urls.ts';
if (fs.existsSync(adminUrlsPath)) {
  const adminUrlsContent = fs.readFileSync(adminUrlsPath, 'utf8');
  const hasCouponsUrl = adminUrlsContent.includes('coupons:');
  console.log(`✅ Admin URLs config: ${hasCouponsUrl ? 'CONFIGURED' : '❌ MISSING coupons URL'}`);
} else {
  console.log('❌ Admin URLs file missing');
}

// Check sidebar configuration
const sidebarPath = 'src/components/admin/layout/AdminSidebar.tsx';
if (fs.existsSync(sidebarPath)) {
  const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
  const hasCouponsNav = sidebarContent.includes("'coupons'") && sidebarContent.includes('TicketIcon');
  console.log(`✅ Sidebar navigation: ${hasCouponsNav ? 'CONFIGURED' : '❌ MISSING coupons nav'}`);
} else {
  console.log('❌ Sidebar file missing');
}

// Check middleware configuration
const middlewarePath = 'src/middleware.ts';
if (fs.existsSync(middlewarePath)) {
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
  const hasAdminRouting = middlewareContent.includes('isAdminRoute') && middlewareContent.includes('/admin');
  console.log(`✅ Middleware admin routing: ${hasAdminRouting ? 'CONFIGURED' : '❌ MISSING admin routing'}`);
} else {
  console.log('❌ Middleware file missing');
}

console.log('\n🔧 Potential Issues to Check:');
console.log('1. Ensure coupons module is enabled in tenant_modules table');
console.log('2. Check if user has proper authentication cookies');
console.log('3. Verify tenant resolution is working correctly');
console.log('4. Check browser console for JavaScript errors');
console.log('5. Verify database connection and permissions');

console.log('\n💡 Debugging Steps:');
console.log('1. Open browser dev tools and check Network tab');
console.log('2. Try accessing /admin/coupons directly');
console.log('3. Check if other admin pages work (e.g., /admin/products)');
console.log('4. Verify authentication by checking /admin first');
console.log('5. Check server logs for any errors');

console.log('\n✅ Coupon routing check complete!');