#!/usr/bin/env node
/**
 * Script to check and enable/disable modules for a tenant
 * Usage: node check-module-status.js [check|enable|disable] <module_key> [tenant_id]
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SENLYSH_TENANT_ID = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c';
const BLUEBELL_TENANT_ID = '11111111-1111-4111-8111-11111111bb01';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkModuleStatus(moduleKey, tenantId = SENLYSH_TENANT_ID) {
  console.log(`\n🔍 Checking module status...`);
  console.log(`   Module: ${moduleKey}`);
  console.log(`   Tenant: ${tenantId === SENLYSH_TENANT_ID ? 'Senlysh' : 'Bluebell'}`);
  console.log('');

  const { data, error } = await supabase
    .from('tenant_modules')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('module_key', moduleKey)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('❌ Error querying modules:', error.message);
    return null;
  }

  if (!data) {
    console.log(`⚠️  Module '${moduleKey}' does NOT exist for this tenant`);
    console.log('   You need to CREATE it first.');
    return null;
  }

  console.log(`✅ Module found:`);
  console.log(`   Enabled: ${data.enabled ? '🟢 YES' : '🔴 NO'}`);
  console.log(`   Created: ${data.updated_at}`);
  console.log('');
  return data;
}

async function enableModule(moduleKey, tenantId = SENLYSH_TENANT_ID) {
  console.log(`\n🚀 Enabling module '${moduleKey}'...`);

  // First check if it exists
  const existing = await checkModuleStatus(moduleKey, tenantId);

  if (existing) {
    if (existing.enabled) {
      console.log(`✅ Module is already enabled!`);
      return true;
    }
    
    // Update existing
    const { error } = await supabase
      .from('tenant_modules')
      .update({ enabled: true })
      .eq('tenant_id', tenantId)
      .eq('module_key', moduleKey);

    if (error) {
      console.error('❌ Error enabling module:', error.message);
      return false;
    }

    console.log(`✅ Module '${moduleKey}' has been ENABLED!`);
    return true;
  }

  // Ensure module exists in module_registry first (to satisfy FK)
  const ensured = await ensureModuleRegistryEntry(moduleKey);
  if (!ensured) return false;

  // Create new
  const { error } = await supabase
    .from('tenant_modules')
    .insert({
      tenant_id: tenantId,
      module_key: moduleKey,
      enabled: true,
      config: {
        features: ['create', 'read', 'update', 'delete']
      }
    });

  if (error) {
    if ((error.message || '').toLowerCase().includes('duplicate key')) {
      console.log('ℹ️  Row already exists, updating to enabled = true');
      const { error: updErr } = await supabase
        .from('tenant_modules')
        .update({ enabled: true })
        .eq('tenant_id', tenantId)
        .eq('module_key', moduleKey);
      if (updErr) {
        console.error('❌ Error updating existing module row:', updErr.message);
        return false;
      }
    } else {
      console.error('❌ Error creating module:', error.message);
      return false;
    }
  }

  console.log(`✅ Module '${moduleKey}' has been CREATED and ENABLED!`);
  return true;
}

async function ensureModuleRegistryEntry(moduleKey) {
  console.log(`\n🧭 Ensuring module '${moduleKey}' exists in module_registry...`);

  // Check if exists
  const { data: existing, error: checkErr } = await supabase
    .from('module_registry')
    .select('module_key')
    .eq('module_key', moduleKey)
    .maybeSingle();

  if (checkErr) {
    console.error('❌ Error checking module_registry:', checkErr.message);
    return false;
  }

  if (existing) {
    console.log('✅ module_registry entry already exists');
    return true;
  }

  // Create registry entry
  const { error: insertErr } = await supabase
    .from('module_registry')
    .insert({
      module_key: moduleKey,
      status: 'active',
      version: 'v1',
      metadata: {
        name: moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1),
        description: `Auto-registered module '${moduleKey}'`,
      },
    });

  if (insertErr) {
    console.error('❌ Error inserting module_registry entry:', insertErr.message);
    return false;
  }

  console.log('✅ module_registry entry created');
  return true;
}

async function disableModule(moduleKey, tenantId = SENLYSH_TENANT_ID) {
  console.log(`\n⏸️  Disabling module '${moduleKey}'...`);

  const { error } = await supabase
    .from('tenant_modules')
    .update({ enabled: false })
    .eq('tenant_id', tenantId)
    .eq('module_key', moduleKey);

  if (error) {
    console.error('❌ Error disabling module:', error.message);
    return false;
  }

  console.log(`✅ Module '${moduleKey}' has been DISABLED!`);
  return true;
}

async function main() {
  const [command, moduleKey, tenantId] = process.argv.slice(2);

  if (!command || !moduleKey) {
    console.log(`
Usage: node check-module-status.js [command] <module_key> [tenant_id]

Commands:
  check    - Check if module is enabled
  enable   - Enable a module (creates if not exists)
  disable  - Disable a module

Module Keys:
  - coupons
  - portfolio
  - analytics
  - etc.

Tenant IDs:
  - senlysh: 1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c (default)
  - bluebell: 11111111-1111-4111-8111-11111111bb01

Examples:
  node check-module-status.js check coupons
  node check-module-status.js enable coupons
  node check-module-status.js enable coupons 1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c
    `);
    process.exit(1);
  }

  const finalTenantId = tenantId || SENLYSH_TENANT_ID;

  try {
    if (command === 'check') {
      await checkModuleStatus(moduleKey, finalTenantId);
    } else if (command === 'enable') {
      await enableModule(moduleKey, finalTenantId);
    } else if (command === 'disable') {
      await disableModule(moduleKey, finalTenantId);
    } else {
      console.error(`❌ Unknown command: ${command}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

main();
