# CI Guardrails Scripts

This directory contains validation scripts that ensure the integrity of the multi-tenant registry system and prevent deployment of broken configurations.

## Overview

The CI guardrails provide automated validation for:

1. **Registry Structure** - Ensures all tenant registry entries are valid
2. **Import Paths** - Validates that all dynamic imports resolve correctly
3. **Prop Contracts** - Verifies component prop contracts are properly defined

## Scripts

### `validate-registry.js`

Validates the tenant registry structure and ensures all imports are valid.

**What it checks:**
- Registry file exists and is readable
- All tenant keys are properly defined
- Tenant directory structure exists
- Registry exports are correctly structured

**Usage:**
```bash
npm run validate:registry
```

**Exit codes:**
- `0` - Validation successful
- `1` - Validation failed with errors

### `validate-imports.js`

Validates that all import paths in the registry actually exist.

**What it checks:**
- Dynamic import paths resolve to existing files
- Import paths follow correct conventions
- Fallback imports are available
- File extensions are valid (.ts, .tsx, .js, .jsx)

**Usage:**
```bash
npm run validate:imports
```

**Exit codes:**
- `0` - All imports valid
- `1` - Invalid imports found

### `validate-contracts.js`

Validates that component prop contracts are properly defined and satisfied.

**What it checks:**
- Contracts file exists with required interfaces
- Component props match defined contracts
- Required properties are present
- TypeScript compilation succeeds

**Usage:**
```bash
npm run validate:contracts
```

**Exit codes:**
- `0` - All contracts valid
- `1` - Contract violations found

## Combined Validation

Run all validations together:

```bash
npm run ci:validate
```

This runs all three validation scripts in sequence and fails if any validation fails.

## CI/CD Integration

### GitHub Actions

The `ci.yml` workflow file provides a complete CI pipeline that includes:

1. **Registry validation** - Ensures tenant registry integrity
2. **Import validation** - Prevents broken dynamic imports
3. **Contract validation** - Enforces prop contract compliance
4. **TypeScript checking** - Catches type errors early
5. **ESLint validation** - Ensures code quality
6. **Build validation** - Confirms production readiness

### Local Development

Run validations during development:

```bash
# Before committing
npm run ci:validate

# Individual validations for debugging
npm run validate:registry
npm run validate:imports
npm run validate:contracts
```

## Error Handling

### Registry Errors

**Common issues:**
- Missing tenant directory
- Invalid registry exports
- Malformed tenant keys

**Resolution:**
```bash
# Check registry structure
npm run validate:registry

# Fix: Add missing tenant directory or update registry
```

### Import Errors

**Common issues:**
- File path doesn't exist
- Wrong file extension
- Import path syntax error

**Resolution:**
```bash
# Check import paths
npm run validate:imports

# Fix: Update import paths in registry or create missing files
```

### Contract Errors

**Common issues:**
- Missing required properties
- Type mismatches
- Interface not implemented

**Resolution:**
```bash
# Check contracts
npm run validate:contracts

# Fix: Update component props or contract definitions
```

## Benefits

### For Developers

- **Early Error Detection** - Catch issues before they reach production
- **Clear Error Messages** - Understand exactly what's wrong
- **Fast Feedback** - Quick validation during development
- **Type Safety** - Enforce proper TypeScript contracts

### For CI/CD

- **Automated Validation** - Prevent broken deployments
- **Consistent Checks** - Same validation across all environments
- **Fast Failure** - Fail early with clear error messages
- **Quality Gates** - Ensure code quality before merge

### For Production

- **Runtime Stability** - Prevent import failures and prop errors
- **Better DX** - Clear error messages for debugging
- **Maintainability** - Enforce consistent code patterns
- **Scalability** - Safe to add new tenants and components

## Adding New Validations

When adding new validation logic:

1. **Create a new script** in this directory
2. **Follow the existing pattern** - clear logging, proper exit codes
3. **Add to package.json** scripts section
4. **Update CI workflow** to include new validation
5. **Document in this README**

## Troubleshooting

### Script Not Found
```bash
# Ensure scripts directory exists and files are executable
ls -la scripts/
chmod +x scripts/*.js
```

### Permission Issues
```bash
# On Windows, ensure proper line endings
# Convert Unix line endings if needed
```

### Import Resolution Issues
```bash
# Check that all paths in registry exist
npm run validate:imports

# Verify file structure matches registry
find src/tenants -name "*.tsx"
```
