#!/usr/bin/env node

/**
 * Import Validation Script
 *
 * Validates that all import paths in the registry actually exist
 * This prevents runtime errors from broken imports in production
 */

const fs = require('fs');
const path = require('path');

// Configuration
const ROOT_DIR = path.join(__dirname, '..', 'src');
const REGISTRY_PATH = path.join(ROOT_DIR, 'registry', 'tenantRegistry.ts');

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
 * Resolve import path to absolute file path
 */
function resolveImportPath(importPath, baseDir) {
  // Remove quotes and semicolons
  const cleanPath = importPath.replace(/['"`;]/g, '');

  // Handle relative imports (starting with @/)
  if (cleanPath.startsWith('@/')) {
    const relativePath = cleanPath.replace('@/', '');
    return path.join(ROOT_DIR, relativePath);
  }

  // Handle relative imports (starting with ./ or ../)
  if (cleanPath.startsWith('./') || cleanPath.startsWith('../')) {
    return path.resolve(baseDir, cleanPath);
  }

  // Handle absolute imports
  return path.resolve(cleanPath);
}

/**
 * Extract dynamic imports from registry file
 * This looks for import() calls in the registry
 */
function extractDynamicImports() {
  try {
    const content = fs.readFileSync(REGISTRY_PATH, 'utf8');
    const imports = [];

    // Look for dynamic import patterns
    const importRegex = /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      const lineNumber = content.substring(0, match.index).split('\n').length;

      imports.push({
        path: importPath,
        lineNumber,
        context: match[0]
      });
    }

    logSuccess(`Found ${imports.length} dynamic imports in registry`);
    return imports;
  } catch (error) {
    logError('Failed to extract dynamic imports', { error: error.message });
    return [];
  }
}

/**
 * Validate a single import path
 */
function validateImport(importInfo) {
  const { path: importPath, lineNumber, context } = importInfo;

  try {
    // Resolve the import path
    const resolvedPath = resolveImportPath(importPath, path.dirname(REGISTRY_PATH));

    // Check if the resolved file exists
    let fileExists = false;
    let actualPath = resolvedPath;

    // If no extension is provided, try common extensions
    if (!path.extname(resolvedPath)) {
      const extensions = ['.tsx', '.ts', '.jsx', '.js'];
      for (const ext of extensions) {
        const pathWithExt = resolvedPath + ext;
        if (fs.existsSync(pathWithExt)) {
          fileExists = true;
          actualPath = pathWithExt;
          break;
        }
      }
    } else {
      fileExists = fs.existsSync(resolvedPath);
    }

    if (!fileExists) {
      logError(`Import path does not exist`, {
        importPath,
        resolvedPath,
        lineNumber,
        context
      });
      return false;
    }

    // Check if it's a TypeScript/React file
    const ext = path.extname(actualPath);
    if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      logWarning(`Import does not point to a TypeScript/JavaScript file`, {
        importPath,
        resolvedPath: actualPath,
        extension: ext,
        lineNumber
      });
    }

    logSuccess(`Import validated: ${importPath} → ${path.relative(ROOT_DIR, actualPath)}`);
    return true;
  } catch (error) {
    logError(`Failed to validate import`, {
      importPath,
      error: error.message,
      lineNumber
    });
    return false;
  }
}

/**
 * Validate all dynamic imports
 */
function validateAllImports() {
  const imports = extractDynamicImports();
  let validCount = 0;

  for (const importInfo of imports) {
    if (validateImport(importInfo)) {
      validCount++;
    }
  }

  console.log(`\n📊 Import validation results:`);
  console.log(`   Total imports: ${imports.length}`);
  console.log(`   Valid imports: ${validCount}`);
  console.log(`   Invalid imports: ${imports.length - validCount}`);

  return validCount === imports.length;
}

/**
 * Validate specific component imports by checking actual tenant directories
 */
function validateTenantComponentImports() {
  const tenantsDir = path.join(ROOT_DIR, 'tenants');

  try {
    const tenantDirs = fs.readdirSync(tenantsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .filter(name => name !== 'index.ts' && name !== 'types.ts'); // Exclude non-tenant files

    logSuccess(`Found ${tenantDirs.length} tenant directories: ${tenantDirs.join(', ')}`);

    for (const tenant of tenantDirs) {
      const componentsDir = path.join(tenantsDir, tenant, 'components');

      if (!fileExists(componentsDir)) {
        logWarning(`Components directory missing for tenant`, { tenant, expectedPath: componentsDir });
        continue;
      }

      // Check for required components
      const requiredComponents = ['Header', 'Footer', 'Layout'];
      const existingComponents = [];

      for (const component of requiredComponents) {
        const componentPath = path.join(componentsDir, `${component}.tsx`);

        if (fileExists(componentPath)) {
          existingComponents.push(component);
          logSuccess(`Component found: ${tenant}/${component}.tsx`);
        } else {
          logWarning(`Required component missing`, {
            tenant,
            component,
            expectedPath: componentPath
          });
        }
      }

      console.log(`   ${tenant}: ${existingComponents.length}/${requiredComponents.length} components found`);
    }
  } catch (error) {
    logError('Failed to validate tenant components', { error: error.message });
  }
}

/**
 * Validate fallback components exist
 */
function validateFallbackComponents() {
  const fallbackComponents = ['DefaultHeader', 'DefaultFooter', 'DefaultLayout'];
  const fallbackDir = path.join(ROOT_DIR, 'components', 'tenant');

  console.log('\n🔍 Validating fallback components...');

  for (const component of fallbackComponents) {
    const componentPath = path.join(fallbackDir, `${component}.tsx`);

    if (fileExists(componentPath)) {
      logSuccess(`Fallback component exists: ${component}.tsx`);
    } else {
      logError(`Critical fallback component missing`, {
        component,
        expectedPath: componentPath
      });
    }
  }
}

/**
 * Main validation function
 */
async function validateImports() {
  console.log('🔍 Starting import validation...\n');

  // Step 1: Validate all dynamic imports in registry
  const importsValid = validateAllImports();

  // Step 2: Validate tenant component structure
  validateTenantComponentImports();

  // Step 3: Validate fallback components
  validateFallbackComponents();

  // Summary
  console.log('\n📊 Import validation summary:');
  console.log(`   Errors: ${errors.length}`);
  console.log(`   Warnings: ${warnings.length}`);

  if (errors.length > 0) {
    console.log('\n❌ Import validation failed with errors');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  Import validation completed with warnings');
    console.log('   Consider addressing warnings for better reliability');
    process.exit(0); // Warnings don't fail the build
  }

  console.log('\n✅ Import validation completed successfully');
  process.exit(0);
}

// Run validation
validateImports().catch(error => {
  console.error('💥 Import validation crashed:', error);
  process.exit(1);
});
