#!/usr/bin/env node

/**
 * GUARDRAIL TESTING CLI
 *
 * Command-line interface for running comprehensive guardrail tests
 */

const { execSync } = require('child_process')
const path = require('path')

function runGuardrailTests() {
  console.log('🛡️  COMMERCENEST GUARDRAIL TESTING SUITE')
  console.log('=' .repeat(50))
  console.log('')

  try {
    // Run TypeScript compilation check
    console.log('📝 Step 1: TypeScript compilation check...')
    execSync('npx tsc --noEmit', { stdio: 'inherit', cwd: process.cwd() })
    console.log('✅ TypeScript compilation successful\n')

    // Run ESLint
    console.log('🔍 Step 2: Code quality check...')
    execSync('npm run lint', { stdio: 'inherit', cwd: process.cwd() })
    console.log('✅ Code quality check passed\n')

    // Run guardrail validation suite
    console.log('🛡️  Step 3: Platform integrity validation...')
    execSync('npx ts-node src/server/guardrail-validator.ts', {
      stdio: 'inherit',
      cwd: process.cwd()
    })
    console.log('✅ Platform integrity validated\n')

    // Run break attempt tests
    console.log('🔥 Step 4: Security break attempt tests...')
    execSync('npx ts-node src/test/guardrail-break-test.ts', {
      stdio: 'inherit',
      cwd: process.cwd()
    })
    console.log('✅ Security tests completed\n')

    // Run performance tests
    console.log('⚡ Step 5: Performance validation...')
    execSync('npm run test:performance', { stdio: 'inherit', cwd: process.cwd() })
    console.log('✅ Performance tests completed\n')

    console.log('')
    console.log('🎉 ALL GUARDRAIL TESTS PASSED!')
    console.log('🏆 Platform is secure for development')
    console.log('')
    console.log('📋 Next steps:')
    console.log('   • Run `npm run guardrail:watch` for continuous monitoring')
    console.log('   • Run `npm run guardrail:deploy-check` before deployment')
    console.log('   • Review logs in DEVELOPMENT_LOGS.md for any issues')

    process.exit(0)

  } catch (error) {
    console.log('')
    console.log('❌ GUARDRAIL TESTS FAILED!')
    console.log('🚨 Issues detected that must be resolved before proceeding')
    console.log('')
    console.log('🔧 Common solutions:')
    console.log('   • Fix TypeScript compilation errors')
    console.log('   • Address ESLint warnings/errors')
    console.log('   • Review security test failures')
    console.log('   • Check database connectivity')
    console.log('   • Verify tenant isolation')
    console.log('')
    console.log('📖 For detailed error information, check the output above')
    console.log('📝 Logs are available in DEVELOPMENT_LOGS.md')

    process.exit(1)
  }
}

// ============================================================================
// WATCH MODE
// ============================================================================

function runWatchMode() {
  console.log('👀 GUARDRAIL WATCH MODE')
  console.log('Monitoring for changes and running tests automatically...')
  console.log('Press Ctrl+C to stop')
  console.log('')

  const chokidar = require('chokidar')

  // Watch for changes in critical files
  const watcher = chokidar.watch([
    'src/**/*.{ts,tsx,js,jsx}',
    'middleware.ts',
    'next.config.ts',
    'package.json'
  ], {
    ignored: ['node_modules', '.next', 'dist'],
    persistent: true
  })

  watcher.on('change', (filePath) => {
    console.log(`📝 File changed: ${filePath}`)
    console.log('🔄 Running guardrail checks...')

    try {
      // Quick validation (skip full test suite for speed)
      execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe', cwd: process.cwd() })
      console.log('✅ TypeScript check passed')
    } catch (error) {
      console.log('❌ TypeScript check failed')
      console.log('Run `npm run guardrail:test` for full details')
    }
  })

  watcher.on('error', (error) => {
    console.error('Watcher error:', error)
  })
}

// ============================================================================
// DEPLOYMENT CHECK
// ============================================================================

function runDeploymentCheck() {
  console.log('🚀 DEPLOYMENT READINESS CHECK')
  console.log('=' .repeat(40))
  console.log('')

  try {
    // Full test suite
    runGuardrailTests()

    // Additional deployment-specific checks
    console.log('🔐 Step 6: Deployment security validation...')

    // Check for hardcoded secrets
    const fs = require('fs')
    const files = [
      'src/**/*.ts',
      'src/**/*.tsx',
      'middleware.ts',
      'next.config.ts'
    ]

    let secretsFound = false
    files.forEach(pattern => {
      try {
        const output = execSync(`grep -r "password\|secret\|token" ${pattern} || true`, {
          cwd: process.cwd(),
          encoding: 'utf8'
        })
        if (output.trim()) {
          console.log('⚠️  Potential secrets found:')
          console.log(output)
          secretsFound = true
        }
      } catch (error) {
        // grep returns non-zero when no matches, ignore
      }
    })

    if (secretsFound) {
      console.log('❌ SECRETS DETECTED: Remove hardcoded secrets before deployment')
      process.exit(1)
    }

    console.log('✅ No hardcoded secrets detected')

    // Environment validation
    console.log('🌍 Step 7: Environment validation...')
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ]

    let missingVars = []
    requiredEnvVars.forEach(varName => {
      if (!process.env[varName]) {
        missingVars.push(varName)
      }
    })

    if (missingVars.length > 0) {
      console.log('❌ MISSING ENVIRONMENT VARIABLES:')
      missingVars.forEach(varName => console.log(`   - ${varName}`))
      console.log('Set these variables before deployment')
      process.exit(1)
    }

    console.log('✅ All required environment variables present')

    console.log('')
    console.log('🎯 DEPLOYMENT READY!')
    console.log('🚀 You can safely deploy to production')

  } catch (error) {
    console.log('')
    console.log('❌ DEPLOYMENT BLOCKED!')
    console.log('🔧 Resolve the issues above before deploying')
    process.exit(1)
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

const command = process.argv[2]

switch (command) {
  case 'test':
  case undefined:
    runGuardrailTests()
    break

  case 'watch':
    runWatchMode()
    break

  case 'deploy-check':
    runDeploymentCheck()
    break

  case 'help':
  default:
    console.log('🛡️  CommerceNest Guardrail CLI')
    console.log('')
    console.log('Usage: npm run guardrail <command>')
    console.log('')
    console.log('Commands:')
    console.log('  test        - Run full guardrail test suite (default)')
    console.log('  watch       - Watch mode for continuous monitoring')
    console.log('  deploy-check- Pre-deployment validation')
    console.log('  help        - Show this help message')
    console.log('')
    console.log('Examples:')
    console.log('  npm run guardrail:test')
    console.log('  npm run guardrail:watch')
    console.log('  npm run guardrail:deploy-check')
    break
}

























































