#!/usr/bin/env node

/**
 * Registry Validation Script
 *
 * Validates the tenant registry structure and ensures all imports are valid
 * This script is designed to run in CI/CD pipelines to catch registry issues early
 */

const fs = require('fs');
const path = require('path');

// Configuration
const ROOT_DIR = path.join(__dirname, '..', 'src');
const REGISTRY_PATH = path.join(ROOT_DIR, 'registry', 'tenantRegistry.ts');
const TENANTS_DIR = path.join(ROOT_DIR, 'tenants');
const COMPONENTS_DIR = path.join(ROOT_DIR, 'components');

// Validation results
let errors = [];
let warnings = [];

/**
 * Log error with context
 */
function logError(message, details = null) {
  const error = { type: 'error', message, details, timestamp: new Date().toISOString() };
  errors.push(error);
  console.error(`❌ ${message}`);
  if (details) {
    console.error(`   Details: ${JSON.stringify(details, null, 2)}`);
  }
}

/**
 * Log warning with context
 */
function logWarning(message, details = null) {
  const warning = { type: 'warning', message, details, timestamp: new Date().toISOString() };
  warnings.push(warning);
  console.warn(`⚠️  ${message}`);
  if (details) {
    console.warn(`   Details: ${JSON.stringify(details, null, 2)}`);
  }
}

/**
 * Log success message
 */
function logSuccess(message) {
  console.log(`✅ ${message}`);
}

/**
 * Check if file exists
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * Validate registry file exists
 */
function validateRegistryFile() {
  if (!fileExists(REGISTRY_PATH)) {
    logError('Registry file not found', { path: REGISTRY_PATH });
    return false;
  }
  logSuccess('Registry file exists');
  return true;
}

/**
 * Parse registry file to extract registry structure
 * Note: This is a simplified parser that looks for specific patterns
 * In a real implementation, you might want to use TypeScript compiler API
 */
function parseRegistryFile() {
  try {
    const content = fs.readFileSync(REGISTRY_PATH, 'utf8');

    // Extract tenant keys from registry - look for the actual tenant keys, not the DEFAULT_ENTRY
    const tenantKeyRegex = /export const TENANT_REGISTRY.*=.*\{([\s\S]*?)\} as const/;
    const match = content.match(tenantKeyRegex);

    if (!match) {
      logError('Could not parse TENANT_REGISTRY from file');
      return null;
    }

    // Extract tenant keys - look for the main tenant entries, not the DEFAULT_ENTRY
    const registryContent = match[1];
    const tenantKeys = [];
    
    // Look for tenant key patterns like "bluebell:", "senlysh:", etc.
    // But exclude "default:" since it's the fallback
    const keyRegex = /(\w+):\s*\{/g;
    let keyMatch;
    
    while ((keyMatch = keyRegex.exec(registryContent)) !== null) {
      const key = keyMatch[1];
      // Skip 'default' as it's not a real tenant
      if (key !== 'default') {
        tenantKeys.push(key);
      }
    }

    return tenantKeys;
  } catch (error) {
    logError('Error parsing registry file', { error: error.message });
    return null;
  }
}

/**
 * Validate tenant directory structure
 */
function validateTenantDirectories(tenantKeys) {
  for (const tenantKey of tenantKeys) {
    const tenantDir = path.join(TENANTS_DIR, tenantKey);

    if (!fileExists(tenantDir)) {
      logError(`Tenant directory not found`, { tenant: tenantKey, path: tenantDir });
      continue;
    }

    logSuccess(`Tenant directory exists: ${tenantKey}`);

    // Check for components subdirectory
    const componentsDir = path.join(tenantDir, 'components');
    if (!fileExists(componentsDir)) {
      logWarning(`Components directory not found`, { tenant: tenantKey, path: componentsDir });
    } else {
      logSuccess(`Components directory exists: ${tenantKey}/components`);
    }
  }
}

/**
 * Validate component imports by checking file existence
 * This is a simplified check that looks for common component files
 */
function validateComponentImports(tenantKeys) {
  const requiredComponents = ['Header', 'Footer', 'Layout'];

  for (const tenantKey of tenantKeys) {
    const componentsDir = path.join(TENANTS_DIR, tenantKey, 'components');

    for (const component of requiredComponents) {
      const componentFile = path.join(componentsDir, `${component}.tsx`);

      if (!fileExists(componentFile)) {
        logWarning(`Component file not found`, {
          tenant: tenantKey,
          component,
          expectedPath: componentFile
        });
      } else {
        logSuccess(`Component exists: ${tenantKey}/${component}.tsx`);
      }
    }
  }
}

/**
 * Validate default components exist
 */
function validateDefaultComponents() {
  const defaultComponents = ['DefaultHeader', 'DefaultFooter', 'DefaultLayout'];
  const tenantComponentsDir = path.join(ROOT_DIR, 'components', 'tenant');

  for (const component of defaultComponents) {
    const componentFile = path.join(tenantComponentsDir, `${component}.tsx`);

    if (!fileExists(componentFile)) {
      logError(`Default component not found`, {
        component,
        expectedPath: componentFile
      });
    } else {
      logSuccess(`Default component exists: ${component}.tsx`);
    }
  }
}

/**
 * Validate registry types file
 */
function validateRegistryTypes() {
  const typesFile = path.join(ROOT_DIR, 'registry', 'types.ts');

  if (!fileExists(typesFile)) {
    logError('Registry types file not found', { path: typesFile });
    return;
  }

  logSuccess('Registry types file exists');

  // Check for required type exports
  const content = fs.readFileSync(typesFile, 'utf8');
  const requiredTypes = ['TenantKey', 'RegistryEntry'];

  for (const type of requiredTypes) {
    // Look for export type declarations
    const typeRegex = new RegExp(`export\\s+type\\s+${type}\\s*=`, 'm');
    if (!typeRegex.test(content)) {
      logError(`Required type not found in types file`, { type, file: typesFile });
    } else {
      logSuccess(`Type export found: ${type}`);
    }
  }
}

/**
 * Main validation function
 */
async function validateRegistry() {
  console.log('🔍 Starting registry validation...\n');

  // Step 1: Validate registry file exists
  if (!validateRegistryFile()) {
    console.log('\n❌ Registry validation failed - registry file not found');
    process.exit(1);
  }

  // Step 2: Parse registry and extract tenant keys
  const tenantKeys = parseRegistryFile();
  if (!tenantKeys) {
    console.log('\n❌ Registry validation failed - could not parse tenant keys');
    process.exit(1);
  }

  // Step 3: Validate tenant directory structure
  validateTenantDirectories(tenantKeys);

  // Step 4: Validate component imports
  validateComponentImports(tenantKeys);

  // Step 5: Validate default components
  validateDefaultComponents();

  // Step 6: Validate registry types
  validateRegistryTypes();

  // Summary
  console.log('\n📊 Validation Summary:');
  console.log(`   Errors: ${errors.length}`);
  console.log(`   Warnings: ${warnings.length}`);

  if (errors.length > 0) {
    console.log('\n❌ Registry validation failed with errors');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  Registry validation completed with warnings');
    console.log('   Consider addressing warnings for better reliability');
    process.exit(0); // Warnings don't fail the build
  }

  console.log('\n✅ Registry validation completed successfully');
  process.exit(0);
}

// Run validation
validateRegistry().catch(error => {
  console.error('💥 Registry validation crashed:', error);
  process.exit(1);
});
