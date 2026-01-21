#!/usr/bin/env node

/**
 * Check if coupon module is enabled in the database
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkCouponModule() {
  console.log('🔍 Checking coupon module configuration in database...\n');

  // Check if environment variables are set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Missing Supabase environment variables');
    console.log('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Check tenants
    console.log('📋 Checking tenants...');
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name')
      .order('name');

    if (tenantsError) {
      console.log('❌ Error fetching tenants:', tenantsError.message);
      return;
    }

    if (!tenants || tenants.length === 0) {
      console.log('❌ No tenants found in database');
      return;
    }

    console.log(`✅ Found ${tenants.length} tenants:`);
    tenants.forEach(tenant => {
      console.log(`   - ${tenant.name} (${tenant.id})`);
    });

    // Check tenant_modules table
    console.log('\n📋 Checking tenant_modules table...');
    const { data: modules, error: modulesError } = await supabase
      .from('tenant_modules')
      .select('tenant_id, module_key, enabled')
      .eq('module_key', 'coupons');

    if (modulesError) {
      console.log('❌ Error fetching tenant modules:', modulesError.message);
      return;
    }

    if (!modules || modules.length === 0) {
      console.log('❌ No coupon modules found - this might be the issue!');
      console.log('💡 Run the tenant modules migration to fix this');
      return;
    }

    console.log(`✅ Found ${modules.length} coupon module entries:`);
    modules.forEach(module => {
      const tenant = tenants.find(t => t.id === module.tenant_id);
      const status = module.enabled ? '✅ ENABLED' : '❌ DISABLED';
      console.log(`   - ${tenant?.name || 'Unknown'}: ${status}`);
    });

    // Check for missing coupon modules
    const tenantsWithCoupons = new Set(modules.map(m => m.tenant_id));
    const tenantsWithoutCoupons = tenants.filter(t => !tenantsWithCoupons.has(t.id));

    if (tenantsWithoutCoupons.length > 0) {
      console.log('\n⚠️  Tenants missing coupon module:');
      tenantsWithoutCoupons.forEach(tenant => {
        console.log(`   - ${tenant.name} (${tenant.id})`);
      });
    }

    // Check coupons table
    console.log('\n📋 Checking coupons table...');
    const { data: coupons, error: couponsError } = await supabase
      .from('coupons')
      .select('id, code, tenant_id, is_active')
      .limit(5);

    if (couponsError) {
      console.log('❌ Error fetching coupons:', couponsError.message);
      console.log('💡 The coupons table might not exist - run the coupons migration');
    } else {
      console.log(`✅ Coupons table accessible, found ${coupons?.length || 0} coupons`);
      if (coupons && coupons.length > 0) {
        coupons.forEach(coupon => {
          const tenant = tenants.find(t => t.id === coupon.tenant_id);
          console.log(`   - ${coupon.code} (${tenant?.name || 'Unknown'}) - ${coupon.is_active ? 'Active' : 'Inactive'}`);
        });
      }
    }

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }

  console.log('\n✅ Database check complete!');
}

checkCouponModule().catch(console.error);