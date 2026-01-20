#!/usr/bin/env node
/**
 * Check if coupons table exists and what columns it has
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function checkCouponsTable() {
  console.log('🔍 Checking if coupons table exists...\n');

  try {
    // Try to fetch from information_schema to check table existence
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'coupons');

    if (error) {
      console.log('❌ Error querying information_schema:', error.message);
      console.log('\nTrying direct table query instead...\n');

      // Fallback: try direct query
      const { data: testData, error: testError } = await supabase
        .from('coupons')
        .select('*')
        .limit(1);

      if (testError?.code === 'PGRST204' || testError?.message?.includes('Could not find')) {
        console.log('❌ TABLE NOT FOUND: coupons table does not exist');
        console.log('\nPlease run the migration:');
        console.log('  psql $DATABASE_URL < migrations/create_coupons_system.sql');
        process.exit(1);
      } else if (testError) {
        console.log('❌ Error:', testError.message);
        process.exit(1);
      } else {
        console.log('✅ Table exists and is queryable');
        console.log('Sample row:', testData[0]);
      }
    } else {
      console.log('✅ Table found in information_schema');
      if (data?.length > 0) {
        console.log('   Table name:', data[0].table_name);
      }

      // Now check columns
      const { data: columns, error: colError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_schema', 'public')
        .eq('table_name', 'coupons');

      if (colError) {
        console.log('⚠️  Could not fetch column info:', colError.message);
      } else {
        console.log('\n📋 Columns in coupons table:');
        columns?.forEach(col => {
          console.log(`   - ${col.column_name} (${col.data_type})`);
        });
      }
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

checkCouponsTable();
