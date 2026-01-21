#!/usr/bin/env node

/**
 * Coupon System Fix Script
 * 
 * This script fixes common issues with the coupon system:
 * 1. Enables coupon module for all tenants
 * 2. Verifies database schema
 * 3. Tests API endpoints
 * 4. Checks for missing environment variables
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTable(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1)
  
  if (error && error.code === '42P01') {
    return { exists: false, error: `Table ${tableName} does not exist` }
  } else if (error) {
    return { exists: false, error: error.message }
  } else {
    return { exists: true }
  }
}

async function enableCouponModule() {
  console.log('🔧 Enabling coupon module for all tenants...')
  
  // First check if tenant_modules table exists
  const { exists: tenantModulesExists, error: tmError } = await checkTable('tenant_modules')
  
  if (!tenantModulesExists) {
    console.error('❌ tenant_modules table does not exist')
    console.log('📝 Please run this migration first:')
    console.log('   migrations/create_tenant_modules_table.sql')
    return false
  }
  
  // Get all tenants
  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('id, name')
  
  if (tenantsError) {
    console.error('❌ Failed to fetch tenants:', tenantsError.message)
    return false
  }
  
  console.log(`📋 Found ${tenants.length} tenants`)
  
  // Enable coupon module for each tenant
  for (const tenant of tenants) {
    const { error } = await supabase
      .from('tenant_modules')
      .upsert({
        tenant_id: tenant.id,
        module_key: 'coupons',
        enabled: true,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'tenant_id,module_key'
      })
    
    if (error) {
      console.error(`❌ Failed to enable coupons for ${tenant.name}:`, error.message)
    } else {
      console.log(`✅ Enabled coupons for ${tenant.name}`)
    }
  }
  
  return true
}

async function checkCouponTables() {
  console.log('🔍 Checking coupon system tables...')
  
  const tables = [
    'coupons',
    'coupon_usage', 
    'pending_coupon_usage',
    'tenant_modules'
  ]
  
  const results = {}
  
  for (const table of tables) {
    const result = await checkTable(table)
    results[table] = result
    
    if (result.exists) {
      console.log(`✅ ${table} table exists`)
    } else {
      console.error(`❌ ${table} table missing: ${result.error}`)
    }
  }
  
  return results
}

async function checkCouponFunction() {
  console.log('🔍 Checking validate_coupon function...')
  
  try {
    // Test the function with dummy data
    const { data, error } = await supabase.rpc('validate_coupon', {
      p_tenant_id: '00000000-0000-0000-0000-000000000000',
      p_coupon_code: 'TEST_FUNCTION_CHECK',
      p_customer_id: '00000000-0000-0000-0000-000000000000',
      p_order_total_cents: 1000
    })
    
    if (error && error.code === '42883') {
      console.error('❌ validate_coupon function does not exist')
      console.log('📝 Please run this migration:')
      console.log('   migrations/create_coupons_system.sql')
      return false
    } else {
      console.log('✅ validate_coupon function exists')
      return true
    }
  } catch (error) {
    console.error('❌ Error checking function:', error.message)
    return false
  }
}

async function testCouponAPI() {
  console.log('🧪 Testing coupon API endpoints...')
  
  try {
    // Test GET /api/admin/coupons
    const response = await fetch('http://localhost:3000/api/admin/coupons', {
      headers: {
        'x-tenant-admin': 'senlysh'
      }
    })
    
    if (response.status === 401) {
      console.log('⚠️  API requires authentication (expected)')
      return true
    } else if (response.ok) {
      console.log('✅ Coupon API is accessible')
      return true
    } else {
      console.error(`❌ API returned status ${response.status}`)
      return false
    }
  } catch (error) {
    console.log('⚠️  Could not test API (server may not be running)')
    return true // Don't fail the script for this
  }
}

async function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...')
  
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
  
  const phonepeVars = [
    'PHONEPE_MERCHANT_ID',
    'PHONEPE_SALT_KEY', 
    'PHONEPE_SALT_INDEX'
  ]
  
  const razorpayVars = [
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'RAZORPAY_WEBHOOK_SECRET'
  ]
  
  const optional = [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ]
  
  let allGood = true
  
  for (const env of required) {
    if (process.env[env]) {
      console.log(`✅ ${env} is set`)
    } else {
      console.error(`❌ ${env} is missing`)
      allGood = false
    }
  }
  
  console.log('\n📱 PhonePe Variables (for Senlysh):')
  for (const env of phonepeVars) {
    if (process.env[env]) {
      console.log(`✅ ${env} is set`)
    } else {
      console.log(`⚠️  ${env} is not set (required for Senlysh)`)
    }
  }
  
  console.log('\n💳 Razorpay Variables (for Bluebell):')
  for (const env of razorpayVars) {
    if (process.env[env]) {
      console.log(`✅ ${env} is set`)
    } else {
      console.log(`⚠️  ${env} is not set (required for Bluebell)`)
    }
  }
  
  console.log('\n🔧 Optional Variables:')
  for (const env of optional) {
    if (process.env[env]) {
      console.log(`✅ ${env} is set`)
    } else {
      console.log(`⚠️  ${env} is not set (optional but recommended)`)
    }
  }
  
  return allGood
}

async function createTestCoupon() {
  console.log('🧪 Creating test coupon...')
  
  // Get first tenant
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
  
  if (!tenants || tenants.length === 0) {
    console.log('⚠️  No tenants found, skipping test coupon creation')
    return true
  }
  
  const tenantId = tenants[0].id
  const testCode = `TEST${Date.now().toString().slice(-6)}`
  
  try {
    const { error } = await supabase
      .from('coupons')
      .insert({
        tenant_id: tenantId,
        code: testCode,
        description: 'Test coupon created by fix script',
        discount_type: 'percentage',
        discount_value: 10,
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        min_order_value_cents: 0,
        uses_per_customer: 1,
        is_active: true
      })
    
    if (error) {
      console.error('❌ Failed to create test coupon:', error.message)
      return false
    } else {
      console.log(`✅ Created test coupon: ${testCode}`)
      
      // Clean up test coupon
      await supabase
        .from('coupons')
        .delete()
        .eq('code', testCode)
        .eq('tenant_id', tenantId)
      
      console.log('🧹 Cleaned up test coupon')
      return true
    }
  } catch (error) {
    console.error('❌ Error creating test coupon:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Starting Coupon System Fix Script')
  console.log('=====================================')
  
  let allChecksPass = true
  
  // Check environment variables
  const envOk = await checkEnvironmentVariables()
  if (!envOk) allChecksPass = false
  
  console.log('')
  
  // Check database tables
  const tableResults = await checkCouponTables()
  const tablesOk = Object.values(tableResults).every(r => r.exists)
  if (!tablesOk) allChecksPass = false
  
  console.log('')
  
  // Check database function
  const functionOk = await checkCouponFunction()
  if (!functionOk) allChecksPass = false
  
  console.log('')
  
  // Enable coupon module
  if (tableResults.tenant_modules?.exists) {
    const moduleOk = await enableCouponModule()
    if (!moduleOk) allChecksPass = false
  }
  
  console.log('')
  
  // Test coupon creation
  if (tablesOk && functionOk) {
    const testOk = await createTestCoupon()
    if (!testOk) allChecksPass = false
  }
  
  console.log('')
  
  // Test API
  await testCouponAPI()
  
  console.log('')
  console.log('=====================================')
  
  if (allChecksPass) {
    console.log('🎉 All checks passed! Coupon system should be working.')
  } else {
    console.log('⚠️  Some issues found. Please review the errors above.')
    console.log('')
    console.log('📝 Common fixes:')
    console.log('1. Run missing migrations in Supabase SQL Editor')
    console.log('2. Add missing environment variables to .env.local')
    console.log('3. Restart your development server')
  }
  
  console.log('')
  console.log('🔗 Useful links:')
  console.log('- Senlysh admin coupons: http://localhost:3000/senlysh/admin/coupons')
  console.log('- Bluebell admin coupons: http://localhost:3000/bluebell/admin/coupons')
  console.log('- API test: http://localhost:3000/api/admin/coupons')
  console.log('- Supabase dashboard: https://supabase.com/dashboard')
  console.log('')
  console.log('💡 Payment Providers:')
  console.log('- Senlysh uses PhonePe')
  console.log('- Bluebell uses Razorpay')
}

main().catch(console.error)