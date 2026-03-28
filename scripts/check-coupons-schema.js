// Script to check the coupons table schema
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkSchema() {
  try {
    console.log('🔍 Checking coupons table schema...\n');
    
    // Query the information schema to get column details
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'coupons')
      .order('ordinal_position');
    
    if (error) {
      console.error('❌ Error querying schema:', error.message);
      console.log('\n💡 Trying alternative method...\n');
      
      // Try to query the coupons table to get column info
      const { data: couponData, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .limit(1);
      
      if (couponError) {
        console.error('❌ Error:', couponError.message);
        console.log('\n⚠️  The coupons table may not exist or discount_type column is missing.');
        console.log('📝 You need to run the migration: migrations/create_coupons_system.sql');
        return;
      }
      
      if (couponData && couponData.length > 0) {
        console.log('✅ Sample coupon record columns:');
        console.log(Object.keys(couponData[0]));
      } else {
        console.log('⚠️  Coupons table exists but is empty. Columns available:');
        // This won't show columns if table is empty
      }
    } else if (data && data.length > 0) {
      console.log('✅ Coupons table columns:');
      data.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      
      // Check for discount_type specifically
      const hasDiscountType = data.some(col => col.column_name === 'discount_type');
      if (hasDiscountType) {
        console.log('\n✅ discount_type column EXISTS');
      } else {
        console.log('\n❌ discount_type column MISSING');
        console.log('📝 You need to run the migration: migrations/create_coupons_system.sql');
      }
    } else {
      console.log('⚠️  No columns found. The coupons table may not exist.');
      console.log('📝 You need to run the migration: migrations/create_coupons_system.sql');
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkSchema();
