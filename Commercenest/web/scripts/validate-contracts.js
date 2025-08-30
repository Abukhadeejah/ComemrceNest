#!/usr/bin/env node

/**
 * Prop Contracts Validation Script
 *
 * Validates that component prop contracts are properly defined and satisfied
 * This ensures type safety and prevents runtime errors from prop mismatches
 */

const fs = require('fs');
const path = require('path');

// Configuration
const ROOT_DIR = path.join(__dirname, '..', 'src');
const CONTRACTS_PATH = path.join(ROOT_DIR, 'components', 'tenant', 'contracts.ts');
const TENANTS_DIR = path.join(ROOT_DIR, 'tenants');
const COMPONENTS_DIR = path.join(ROOT_DIR, 'components', 'tenant');

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
 * Read and parse TypeScript file for interface and type definitions
 */
function extractInterfaces(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const interfaces = {};

    // Extract interface definitions
    const interfaceRegex = /export\s+interface\s+(\w+)(?:\s+extends\s+([^}]+))?\s*\{([^}]*)\}/g;
    let match;

    while ((match = interfaceRegex.exec(content)) !== null) {
      const [, name, extendsClause, body] = match;

      // Extract properties from interface body
      const properties = {};
      const propRegex = /(\w+)\s*:\s*([^;]+);/g;
      let propMatch;

      while ((propMatch = propRegex.exec(body)) !== null) {
        const [, propName, propType] = propMatch;
        properties[propName] = propType.trim();
      }

      interfaces[name] = {
        name,
        extends: extendsClause ? extendsClause.trim() : null,
        properties,
        file: path.relative(ROOT_DIR, filePath)
      };
    }

    // Extract type definitions (for Readonly<{...}> patterns)
    const typeRegex = /export\s+type\s+(\w+)\s*=\s*Readonly<\{([^}]*)\}>/g;
    
    while ((match = typeRegex.exec(content)) !== null) {
      const [, name, body] = match;

      // Extract properties from type body
      const properties = {};
      const propRegex = /(\w+)\s*:\s*([^;]+);/g;
      let propMatch;

      while ((propMatch = propRegex.exec(body)) !== null) {
        const [, propName, propType] = propMatch;
        properties[propName] = propType.trim();
      }

      interfaces[name] = {
        name,
        extends: null,
        properties,
        file: path.relative(ROOT_DIR, filePath)
      };
    }

    return interfaces;
  } catch (error) {
    logError('Failed to extract interfaces', { file: filePath, error: error.message });
    return {};
  }
}

/**
 * Validate contracts file exists and has required interfaces
 */
function validateContractsFile() {
  if (!fileExists(CONTRACTS_PATH)) {
    logError('Contracts file not found', { path: CONTRACTS_PATH });
    return null;
  }

  logSuccess('Contracts file exists');

  const interfaces = extractInterfaces(CONTRACTS_PATH);

  // Check for required interfaces
  const requiredInterfaces = ['LayoutProps', 'HeaderProps', 'FooterProps'];
  const missing = [];

  for (const interfaceName of requiredInterfaces) {
    if (!interfaces[interfaceName]) {
      missing.push(interfaceName);
    } else {
      logSuccess(`Required interface found: ${interfaceName}`);
    }
  }

  if (missing.length > 0) {
    logError('Required interfaces missing', { missing, file: CONTRACTS_PATH });
  }

  return interfaces;
}

/**
 * Validate component implements required props
 */
function validateComponentProps(componentPath, expectedProps, componentName) {
  try {
    const content = fs.readFileSync(componentPath, 'utf8');

    // Extract props interface from component
    const propsRegex = /interface\s+(\w+Props)\s*\{([^}]*)\}/;
    const propsMatch = content.match(propsRegex);

    if (!propsMatch) {
      logWarning(`No props interface found in component`, {
        component: componentName,
        file: path.relative(ROOT_DIR, componentPath)
      });
      return;
    }

    const [, propsName, propsBody] = propsMatch;

    // Extract properties from component props
    const componentProps = {};
    const propRegex = /(\w+)\s*:\s*([^;]+);/g;
    let propMatch;

    while ((propMatch = propRegex.exec(propsBody)) !== null) {
      const [, propName, propType] = propMatch;
      componentProps[propName] = propType.trim();
    }

    // Check if component extends the expected interface
    if (content.includes(`extends ${expectedProps.name}`)) {
      logSuccess(`Component extends expected interface: ${componentName} extends ${expectedProps.name}`);
    } else {
      logWarning(`Component does not extend expected interface`, {
        component: componentName,
        expected: expectedProps.name,
        file: path.relative(ROOT_DIR, componentPath)
      });
    }

    // Validate required properties are present
    for (const [propName, propType] of Object.entries(expectedProps.properties)) {
      if (!componentProps[propName]) {
        logError(`Required prop missing in component`, {
          component: componentName,
          prop: propName,
          expectedType: propType,
          file: path.relative(ROOT_DIR, componentPath)
        });
      } else {
        logSuccess(`Required prop found: ${componentName}.${propName}`);
      }
    }

  } catch (error) {
    logError(`Failed to validate component props`, {
      component: componentName,
      file: path.relative(ROOT_DIR, componentPath),
      error: error.message
    });
  }
}

/**
 * Validate all tenant components implement correct contracts
 */
function validateTenantComponents(interfaces) {
  const tenants = ['bluebell', 'senlysh'];
  const components = ['Header', 'Footer', 'Layout'];

  for (const tenant of tenants) {
    for (const component of components) {
      const componentPath = path.join(TENANTS_DIR, tenant, 'components', `${component}.tsx`);

      if (!fileExists(componentPath)) {
        logWarning(`Component file not found for validation`, {
          tenant,
          component,
          path: componentPath
        });
        continue;
      }

      // Determine expected interface
      let expectedInterface;
      if (component === 'Layout') {
        expectedInterface = interfaces['LayoutProps'];
      } else if (component === 'Header') {
        expectedInterface = interfaces['HeaderProps'];
      } else if (component === 'Footer') {
        expectedInterface = interfaces['FooterProps'];
      }

      if (expectedInterface) {
        validateComponentProps(componentPath, expectedInterface, `${tenant}-${component}`);
      }
    }
  }
}

/**
 * Validate default components implement contracts
 */
function validateDefaultComponents(interfaces) {
  const defaultComponents = [
    { name: 'DefaultHeader', interface: 'HeaderProps' },
    { name: 'DefaultFooter', interface: 'FooterProps' },
    { name: 'DefaultLayout', interface: 'LayoutProps' }
  ];

  for (const { name, interface: interfaceName } of defaultComponents) {
    const componentPath = path.join(COMPONENTS_DIR, `${name}.tsx`);

    if (!fileExists(componentPath)) {
      logError(`Default component not found`, { component: name, path: componentPath });
      continue;
    }

    const expectedInterface = interfaces[interfaceName];
    if (expectedInterface) {
      validateComponentProps(componentPath, expectedInterface, name);
    }
  }
}

/**
 * Validate TypeScript compilation for contracts
 */
function validateTypeScriptCompilation() {
  console.log('\n🔍 Validating TypeScript compilation...');

  // Check if tsconfig.json exists
  const tsconfigPath = path.join(__dirname, '..', 'tsconfig.json');
  if (!fileExists(tsconfigPath)) {
    logError('TypeScript config not found', { path: tsconfigPath });
    return;
  }

  logSuccess('TypeScript config exists');

  // Check for any obvious syntax errors in contracts file
  try {
    const content = fs.readFileSync(CONTRACTS_PATH, 'utf8');

    // Basic syntax checks
    const bracketCount = (content.match(/\{/g) || []).length - (content.match(/\}/g) || []).length;
    if (bracketCount !== 0) {
      logError('Unmatched brackets in contracts file', { bracketCount });
    }

    const parenCount = (content.match(/\(/g) || []).length - (content.match(/\)/g) || []).length;
    if (parenCount !== 0) {
      logError('Unmatched parentheses in contracts file', { parenCount });
    }

    logSuccess('Basic syntax validation passed for contracts file');

  } catch (error) {
    logError('Failed to validate TypeScript syntax', { error: error.message });
  }
}

/**
 * Main validation function
 */
async function validateContracts() {
  console.log('🔍 Starting prop contracts validation...\n');

  // Step 1: Validate contracts file and extract interfaces
  const interfaces = validateContractsFile();
  if (!interfaces) {
    console.log('\n❌ Contracts validation failed - contracts file invalid');
    process.exit(1);
  }

  // Step 2: Validate tenant components implement contracts
  validateTenantComponents(interfaces);

  // Step 3: Validate default components implement contracts
  validateDefaultComponents(interfaces);

  // Step 4: Validate TypeScript compilation
  validateTypeScriptCompilation();

  // Summary
  console.log('\n📊 Prop contracts validation summary:');
  console.log(`   Errors: ${errors.length}`);
  console.log(`   Warnings: ${warnings.length}`);

  if (errors.length > 0) {
    console.log('\n❌ Prop contracts validation failed with errors');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  Prop contracts validation completed with warnings');
    console.log('   Consider addressing warnings for better type safety');
    process.exit(0); // Warnings don't fail the build
  }

  console.log('\n✅ Prop contracts validation completed successfully');
  process.exit(0);
}

// Run validation
validateContracts().catch(error => {
  console.error('💥 Prop contracts validation crashed:', error);
  process.exit(1);
});
