#!/usr/bin/env node

/**
 * Tenant Scaffold Script
 *
 * Automates the creation of new tenants by generating:
 * - Directory structure
 * - Required components (Header, Footer, Layout)
 * - Homepage component
 * - Configuration file
 * - Registry integration
 * - Database setup guidance
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const ROOT_DIR = path.join(__dirname, '..', 'src');
const TENANTS_DIR = path.join(ROOT_DIR, 'tenants');
const REGISTRY_PATH = path.join(ROOT_DIR, 'registry', 'tenantRegistry.ts');
const TEMPLATES_DIR = path.join(__dirname, 'templates');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

/**
 * Validate tenant key
 */
function validateTenantKey(key) {
  if (!key || key.length < 2) {
    throw new Error('Tenant key must be at least 2 characters long');
  }

  if (!/^[a-z][a-z0-9-]*$/.test(key)) {
    throw new Error('Tenant key must start with lowercase letter and contain only lowercase letters, numbers, and hyphens');
  }

  return key;
}

/**
 * Capitalize first letter
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert tenant key to display name
 */
function keyToDisplayName(key) {
  return key.split('-').map(capitalize).join(' ');
}

/**
 * Get user input
 */
function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Read template file
 */
function readTemplate(templateName) {
  const templatePath = path.join(TEMPLATES_DIR, templateName);
  return fs.readFileSync(templatePath, 'utf8');
}

/**
 * Replace template variables
 */
function replaceTemplateVars(template, vars) {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

/**
 * Create directory if it doesn't exist
 */
function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logSuccess(`Created directory: ${path.relative(ROOT_DIR, dirPath)}`);
  }
}

/**
 * Write file with template replacement
 */
function writeTemplateFile(templateName, outputPath, vars) {
  const template = readTemplate(templateName);
  const content = replaceTemplateVars(template, vars);
  fs.writeFileSync(outputPath, content, 'utf8');
  logSuccess(`Created file: ${path.relative(ROOT_DIR, outputPath)}`);
}

/**
 * Create tenant directory structure
 */
function createTenantStructure(tenantKey) {
  const tenantDir = path.join(TENANTS_DIR, tenantKey);
  const componentsDir = path.join(tenantDir, 'components');

  ensureDirectory(tenantDir);
  ensureDirectory(componentsDir);

  return { tenantDir, componentsDir };
}

/**
 * Generate tenant components
 */
function generateComponents(tenantKey, tenantDisplayName, businessType, colors, tenantDir, componentsDir) {
  const tenantKeyInitial = tenantKey.charAt(0).toUpperCase();

  const templateVars = {
    TenantKey: capitalize(tenantKey),
    TenantKeyLower: tenantKey,
    TenantKeyInitial: tenantKeyInitial,
    TenantDisplayName: tenantDisplayName,
    BusinessType: businessType,
    PrimaryColor: colors.primary,
    SecondaryColor: colors.secondary,
    AccentColor: colors.accent,
    Date: new Date().toISOString().split('T')[0],
  };

  // Create components
  writeTemplateFile('Header.tsx.template', path.join(componentsDir, 'Header.tsx'), templateVars);
  writeTemplateFile('Footer.tsx.template', path.join(componentsDir, 'Footer.tsx'), templateVars);
  writeTemplateFile('Layout.tsx.template', path.join(componentsDir, 'Layout.tsx'), templateVars);

  // Create homepage
  writeTemplateFile('Home.tsx.template', path.join(tenantDir, `${capitalize(tenantKey)}Home.tsx`), templateVars);

  // Create config
  writeTemplateFile('config.ts.template', path.join(tenantDir, 'config.ts'), templateVars);
}

/**
 * Update registry
 */
function updateRegistry(tenantKey, tenantDisplayName) {
  const registryContent = fs.readFileSync(REGISTRY_PATH, 'utf8');

  // Check if tenant already exists
  if (registryContent.includes(`'${tenantKey}'`)) {
    logWarning(`Tenant '${tenantKey}' already exists in registry`);
    return;
  }

  // Find the position to insert the new tenant entry
  const insertPattern = /(export const TENANT_REGISTRY.*=.*\{[\s\S]*?)(bluebell: \{[\s\S]*?\},)/;
  const replacement = `$1${tenantKey}: {
    header: () => import('@/tenants/${tenantKey}/components/Header').catch(() => DEFAULT_ENTRY.header()),
    footer: () => import('@/tenants/${tenantKey}/components/Footer').catch(() => DEFAULT_ENTRY.footer()),
    layout: () => import('@/tenants/${tenantKey}/components/Layout').catch(() => DEFAULT_ENTRY.layout()),
  },
  $2`;

  const newContent = registryContent.replace(insertPattern, replacement);

  if (newContent === registryContent) {
    logError('Failed to update registry - could not find insertion point');
    return;
  }

  fs.writeFileSync(REGISTRY_PATH, newContent, 'utf8');
  logSuccess('Updated tenant registry');
}

/**
 * Generate database setup SQL
 */
function generateDatabaseSetup(tenantKey, tenantDisplayName, businessType) {
  const sql = `-- Database setup for ${tenantDisplayName} (${tenantKey})
-- Run these commands in your Supabase SQL editor

-- 1. Create tenant record
INSERT INTO tenants (name, status, created_at, updated_at)
VALUES ('${tenantDisplayName}', 'active', NOW(), NOW());

-- 2. Get the tenant ID (replace with actual ID from above)
-- SET tenant_id = 'your-tenant-id-here';

-- 3. Add tenant domain (for localhost development)
INSERT INTO tenant_domains (tenant_id, hostname, is_primary, created_at)
VALUES (
  (SELECT id FROM tenants WHERE name = '${tenantDisplayName}'),
  'localhost',
  true,
  NOW()
);

-- 4. Create sample products for ${tenantKey}
INSERT INTO products (
  tenant_id,
  name,
  slug,
  description,
  price_cents,
  compare_at_price_cents,
  currency,
  hero_image_url,
  stock,
  status,
  created_at,
  updated_at
) VALUES
-- Add your ${businessType} products here
(
  (SELECT id FROM tenants WHERE name = '${tenantDisplayName}'),
  'Premium ${businessType} Product',
  'premium-${tenantKey}-product',
  'High-quality ${businessType} product from ${tenantDisplayName}',
  99900, -- ₹999.00
  129900, -- ₹1,299.00 (compare at)
  'INR',
  '/images/${tenantKey}-product.jpg',
  50,
  'published',
  NOW(),
  NOW()
);

-- 5. Create tenant-specific settings
INSERT INTO settings_company_profile (
  tenant_id,
  name,
  brand_accent_hex,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM tenants WHERE name = '${tenantDisplayName}'),
  '${tenantDisplayName}',
  '#2563eb', -- Blue brand color
  NOW(),
  NOW()
);

COMMIT;`;

  return sql;
}

/**
 * Generate setup guide
 */
function generateSetupGuide(tenantKey, tenantDisplayName, businessType, sql) {
  const guide = `# ${tenantDisplayName} Setup Guide

## 🚀 Quick Setup

### 1. Database Setup
Run the following SQL in your Supabase dashboard:

\`\`\`sql
${sql}
\`\`\`

### 2. File Uploads
Upload the following images to your storage:
- \`/public/${tenantKey}-hero.jpg\` - Hero section background
- \`/public/${tenantKey}-logo.png\` - Company logo
- Product images to \`/public/images/${tenantKey}/\`

### 3. Environment Configuration
Add to your environment variables:
\`\`\`
NEXT_PUBLIC_${tenantKey.toUpperCase()}_ENABLED=true
\`\`\`

### 4. Testing
Test the new tenant at:
- Homepage: \`http://localhost:3000/${tenantKey}\`
- Products: \`http://localhost:3000/${tenantKey}/products\`
- Portfolio: \`http://localhost:3000/${tenantKey}/portfolio\`

### 5. Customization
- Update colors in \`src/tenants/${tenantKey}/config.ts\`
- Customize components in \`src/tenants/${tenantKey}/components/\`
- Add tenant-specific content to homepage

### 6. Production Deployment
- Add domain mapping in Supabase
- Update DNS records
- Configure production environment variables

## 📋 Next Steps

1. **Add Products**: Create ${businessType}-specific products in admin
2. **Customize Branding**: Update colors, fonts, and imagery
3. **Content Creation**: Add portfolio items and blog posts
4. **SEO Optimization**: Configure meta tags and structured data
5. **Analytics Setup**: Add tracking and conversion goals

## 🆘 Troubleshooting

**Tenant not loading?**
- Check registry integration in \`src/registry/tenantRegistry.ts\`
- Verify database tenant record exists
- Run \`npm run validate:registry\` to check for issues

**Components not rendering?**
- Run \`npm run validate:imports\` to check import paths
- Check browser console for TypeScript errors
- Verify all required components exist

**Database errors?**
- Check tenant_id exists in products table
- Verify RLS policies are configured
- Check database connection settings

---

*Generated by scaffold script on ${new Date().toISOString()}*
`;

  return guide;
}

/**
 * Main scaffold function
 */
async function scaffoldTenant() {
  logInfo('🚀 CommerceNest Tenant Scaffold Script');
  logInfo('=====================================\n');

  try {
    // Get tenant information
    const tenantKey = await askQuestion('Enter tenant key (lowercase, URL-safe): ');
    const validatedKey = validateTenantKey(tenantKey);

    const businessType = await askQuestion('Enter business type (fashion, interior, electronics, etc.): ');
    const primaryColor = await askQuestion('Enter primary brand color (hex, e.g., #2563eb): ');
    const secondaryColor = await askQuestion('Enter secondary brand color (hex, optional): ') || '#64748b';
    const accentColor = await askQuestion('Enter accent brand color (hex, optional): ') || '#f59e0b';

    const tenantDisplayName = keyToDisplayName(validatedKey);

    logInfo('\n📋 Configuration Summary:');
    logInfo(`   Tenant Key: ${validatedKey}`);
    logInfo(`   Display Name: ${tenantDisplayName}`);
    logInfo(`   Business Type: ${businessType}`);
    logInfo(`   Primary Color: ${primaryColor}`);
    logInfo(`   Secondary Color: ${secondaryColor}`);
    logInfo(`   Accent Color: ${accentColor}`);

    const confirm = await askQuestion('\nProceed with scaffolding? (y/N): ');
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      logInfo('Scaffolding cancelled');
      process.exit(0);
    }

    // Create directory structure
    logInfo('\n🏗️  Creating directory structure...');
    const { tenantDir, componentsDir } = createTenantStructure(validatedKey);

    // Generate components and files
    logInfo('\n📝 Generating components and files...');
    const colors = {
      primary: primaryColor,
      secondary: secondaryColor,
      accent: accentColor,
    };
    generateComponents(validatedKey, tenantDisplayName, businessType, colors, tenantDir, componentsDir);

    // Update registry
    logInfo('\n📋 Updating tenant registry...');
    updateRegistry(validatedKey, tenantDisplayName);

    // Generate setup files
    logInfo('\n📋 Generating setup documentation...');

    const sql = generateDatabaseSetup(validatedKey, tenantDisplayName, businessType);
    const guide = generateSetupGuide(validatedKey, tenantDisplayName, businessType, sql);

    // Write setup files
    const setupDir = path.join(__dirname, '..', 'setup');
    ensureDirectory(setupDir);

    fs.writeFileSync(path.join(setupDir, `${validatedKey}-setup.sql`), sql);
    fs.writeFileSync(path.join(setupDir, `${validatedKey}-guide.md`), guide);

    logSuccess(`Created setup files in: setup/${validatedKey}-setup.sql`);
    logSuccess(`Created guide in: setup/${validatedKey}-guide.md`);

    // Run validation
    logInfo('\n🔍 Running validation checks...');
    logWarning('Note: Validation scripts may not run on Windows. Run manually:');
    logInfo('   npm run validate:registry');
    logInfo('   npm run validate:imports');
    logInfo('   npm run validate:contracts');

    // Final summary
    logSuccess('\n🎉 Tenant scaffolding completed successfully!');
    logInfo('\n📋 What was created:');
    logInfo(`   • Tenant directory: src/tenants/${validatedKey}/`);
    logInfo(`   • Components: Header, Footer, Layout`);
    logInfo(`   • Homepage: ${tenantDisplayName}Home.tsx`);
    logInfo(`   • Configuration: config.ts`);
    logInfo(`   • Registry integration: Updated tenantRegistry.ts`);
    logInfo(`   • Setup files: Database SQL and guide`);

    logInfo('\n🚀 Next steps:');
    logInfo(`   1. Run database setup: setup/${validatedKey}-setup.sql`);
    logInfo(`   2. Upload required images to /public/`);
    logInfo(`   3. Test tenant at: http://localhost:3000/${validatedKey}`);
    logInfo(`   4. Customize content and branding as needed`);

    logInfo('\n📚 Documentation:');
    logInfo(`   • Setup guide: setup/${validatedKey}-guide.md`);
    logInfo(`   • Scaffold docs: scripts/SCAFFOLD_GUIDE.md`);

  } catch (error) {
    logError(`Scaffolding failed: ${error.message}`);
    process.exit(1);
  }
}

// Run scaffold script
scaffoldTenant().catch(error => {
  logError(`Script failed: ${error.message}`);
  process.exit(1);
});
