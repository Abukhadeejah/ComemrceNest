// Script to run pending_coupon_usage migration
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function runMigration() {
  try {
    console.log('📦 Reading migration file...');
    const migrationPath = path.join(__dirname, 'migrations', 'create_pending_coupon_usage.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🚀 Executing migration...');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.includes('COMMENT ON')) {
        // Skip comments for now as they might not work via RPC
        console.log('⏭️  Skipping comment statement');
        continue;
      }
      
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: statement + ';' 
      });
      
      if (error) {
        // Try direct query if RPC doesn't work
        const { error: queryError } = await supabase.from('_dummy').select('*').limit(0);
        console.log('⚠️  RPC not available, trying alternative method...');
        throw new Error(`Migration execution not supported via client library. Please run manually in Supabase SQL Editor.`);
      }
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('\n📋 Created:');
    console.log('   - pending_coupon_usage table');
    console.log('   - Indexes for fast lookups');
    console.log('   - RLS policies for security');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 Alternative: Run the SQL manually in Supabase Dashboard:');
    console.log('   1. Go to https://slhoayhflpcwrsylcuvt.supabase.co');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Copy contents from migrations/create_pending_coupon_usage.sql');
    console.log('   4. Execute the SQL');
    process.exit(1);
  }
}

runMigration();
