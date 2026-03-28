// Script to run coupons system migration
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
    console.log('📦 Reading coupons system migration file...');
    const migrationPath = path.join(__dirname, '..', 'migrations', 'create_coupons_system.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🚀 Executing migration...\n');
    
    // For CREATE TABLE statements with complex checks, we need to execute as a single block
    // Split by major sections (tables, indexes, policies)
    const sections = sql.split(/(?=CREATE TABLE|CREATE INDEX|ALTER TABLE|COMMENT ON)/);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const section of sections) {
      const trimmed = section.trim();
      if (!trimmed || trimmed.startsWith('--')) continue;
      
      // Remove comments
      const cleaned = trimmed
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .trim();
      
      if (!cleaned) continue;
      
      console.log(`📝 Executing: ${cleaned.substring(0, 60)}...`);
      
      try {
        // Try using Supabase's query method directly
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: cleaned
        });
        
        if (error) {
          // Try direct query for simpler statements
          const { error: directError } = await supabase
            .from('_migrations_temp')
            .select('*')
            .limit(0);
          
          console.log(`⚠️  RPC method not available, trying direct execution...`);
          // For direct execution, we'd need a different approach
          console.log(`❌ Error: ${error.message}`);
          errorCount++;
        } else {
          console.log('✅ Success\n');
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Error: ${err.message}\n`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed. You may need to run this migration');
      console.log('   directly in the Supabase SQL Editor:');
      console.log('   1. Go to your Supabase Dashboard');
      console.log('   2. Navigate to SQL Editor');
      console.log('   3. Copy and paste the contents of migrations/create_coupons_system.sql');
      console.log('   4. Execute the query');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('\n⚠️  Please run the migration manually in Supabase SQL Editor:');
    console.log('   File: migrations/create_coupons_system.sql');
  }
}

runMigration();
