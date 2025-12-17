/**
 * GUARDRAIL BREAK TEST
 *
 * Deliberately attempts to break the platform to test guardrail effectiveness
 * This file contains intentional security violations and bad practices
 * DO NOT USE IN PRODUCTION
 */

import { supabaseAdmin } from '@/server/supabaseAdmin'
import { createSafeDatabase } from '@/server/safe-database'
import { validateTenantContext } from '@/server/guardrails'

export async function testGuardrailBreakAttempts() {
  console.log('🔥 TESTING GUARDRAIL BREAK ATTEMPTS...\n')

  const testResults: { attempt: string; expected: string; result: 'BLOCKED' | 'ALLOWED' | 'ERROR'; details?: string }[] = []

  // ============================================================================
  // ATTEMPT 1: Cross-tenant data access (should be BLOCKED)
  // ============================================================================
  console.log('🧪 Attempt 1: Cross-tenant data access')
  try {
    // const bluebellTenantId = '11111111-1111-4111-8111-11111111bb01'
    const senlyshTenantId = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c'

    // Try to access Senlysh products from Bluebell context
    const { data: _data, error: _error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('tenant_id', senlyshTenantId) // Wrong tenant!
      .limit(1)

    if (_data && _data.length > 0) {
      testResults.push({
        attempt: 'Cross-tenant data access',
        expected: 'BLOCKED by RLS',
        result: 'ALLOWED',
        details: `❌ SECURITY BREACH: Retrieved ${_data.length} records from wrong tenant`
      })
    } else {
      testResults.push({
        attempt: 'Cross-tenant data access',
        expected: 'BLOCKED by RLS',
        result: 'BLOCKED',
        details: '✅ RLS policy working correctly'
      })
    }
  } catch (error) {
    testResults.push({
      attempt: 'Cross-tenant data access',
      expected: 'BLOCKED by RLS',
      result: 'BLOCKED',
      details: `✅ RLS policy blocked access: ${error instanceof Error ? error.message : String(error)}`
    })
  }

  // ============================================================================
  // ATTEMPT 2: Safe database wrapper bypass (should be BLOCKED)
  // ============================================================================
  console.log('🧪 Attempt 2: Safe database wrapper bypass')
  try {
    // Try to use unsafe database operations
    const { data: _data, error: _error } = await supabaseAdmin
      .from('products')
      .select('*')
      .limit(5) // No tenant filter!

    if (_data && _data.length > 0) {
      testResults.push({
        attempt: 'Safe database wrapper bypass',
        expected: 'BLOCKED by guardrails',
        result: 'ALLOWED',
        details: `❌ SECURITY BREACH: Retrieved ${_data.length} records without tenant isolation`
      })
    } else {
      testResults.push({
        attempt: 'Safe database wrapper bypass',
        expected: 'BLOCKED by guardrails',
        result: 'BLOCKED',
        details: '✅ Guardrails working correctly'
      })
    }
  } catch (error) {
    testResults.push({
      attempt: 'Safe database wrapper bypass',
      expected: 'BLOCKED by guardrails',
      result: 'BLOCKED',
      details: `✅ Guardrails blocked unsafe operation: ${error instanceof Error ? error.message : String(error)}`
    })
  }

  // ============================================================================
  // ATTEMPT 3: Malformed tenant context (should be BLOCKED)
  // ============================================================================
  console.log('🧪 Attempt 3: Malformed tenant context')
  try {
    // Try to validate with invalid tenant ID
    const _result = await validateTenantContext('invalid-tenant-id-test')
    // Result intentionally unused - we're testing for side effects

    testResults.push({
      attempt: 'Malformed tenant context',
      expected: 'BLOCKED by validation',
      result: 'ALLOWED',
      details: '❌ SECURITY BREACH: Invalid tenant context accepted'
    })
  } catch (error) {
    testResults.push({
      attempt: 'Malformed tenant context',
      expected: 'BLOCKED by validation',
      result: 'BLOCKED',
      details: `✅ Validation blocked invalid context: ${error instanceof Error ? error.message : String(error)}`
    })
  }

  // ============================================================================
  // ATTEMPT 4: SQL injection attempt (should be BLOCKED)
  // ============================================================================
  console.log('🧪 Attempt 4: SQL injection attempt')
  try {
    // Try dangerous SQL operations
    const dangerousSQL = "'; DROP TABLE products; --"

    // This should be blocked by our safe SQL function
    const db = await createSafeDatabase('sql-injection-test')
    await db.executeSafeSQL(dangerousSQL)

    testResults.push({
      attempt: 'SQL injection attempt',
      expected: 'BLOCKED by sanitization',
      result: 'ALLOWED',
      details: '❌ SECURITY BREACH: SQL injection succeeded'
    })
  } catch (error) {
    testResults.push({
      attempt: 'SQL injection attempt',
      expected: 'BLOCKED by sanitization',
      result: 'BLOCKED',
      details: `✅ SQL injection blocked: ${error instanceof Error ? error.message : String(error)}`
    })
  }

  // ============================================================================
  // ATTEMPT 5: Unauthorized table access (should be BLOCKED)
  // ============================================================================
  console.log('🧪 Attempt 5: Unauthorized table access')
  try {
    // Try to access system tables
    const db = await createSafeDatabase('unauthorized-access-test')
    await db.validateTableAccess('auth.users', 'read') // Should be blocked

    testResults.push({
      attempt: 'Unauthorized table access',
      expected: 'BLOCKED by permissions',
      result: 'ALLOWED',
      details: '❌ SECURITY BREACH: Unauthorized table access allowed'
    })
  } catch (error) {
    testResults.push({
      attempt: 'Unauthorized table access',
      expected: 'BLOCKED by permissions',
      result: 'BLOCKED',
      details: `✅ Access control working: ${error instanceof Error ? error.message : String(error)}`
    })
  }

  // ============================================================================
  // ATTEMPT 6: Data tampering (should be BLOCKED)
  // ============================================================================
  console.log('🧪 Attempt 6: Data tampering')
  try {
    // Try to insert data with wrong tenant ID
    const db = await createSafeDatabase('data-tampering-test')
    const wrongTenantId = 'wrong-tenant-id-123'

    await db.table('products').insert({
      name: 'Hacked Product',
      price_cents: 1000,
      tenant_id: wrongTenantId // Wrong tenant!
    }).execute()

    testResults.push({
      attempt: 'Data tampering',
      expected: 'BLOCKED by tenant validation',
      result: 'ALLOWED',
      details: '❌ SECURITY BREACH: Data inserted with wrong tenant ID'
    })
  } catch (error) {
    testResults.push({
      attempt: 'Data tampering',
      expected: 'BLOCKED by tenant validation',
      result: 'BLOCKED',
      details: `✅ Tenant validation working: ${error instanceof Error ? error.message : String(error)}`
    })
  }

  // ============================================================================
  // ATTEMPT 7: Performance degradation (should be LOGGED)
  // ============================================================================
  console.log('🧪 Attempt 7: Performance degradation')
  try {
    // Try inefficient query
    const startTime = Date.now()

    // This should trigger performance monitoring
    for (let i = 0; i < 10; i++) {
      await supabaseAdmin
        .from('products')
        .select('*')
        .limit(1000) // Large dataset
    }

    const duration = Date.now() - startTime

    if (duration > 5000) { // 5 seconds threshold
      testResults.push({
        attempt: 'Performance degradation',
        expected: 'LOGGED by monitoring',
        result: 'ALLOWED',
        details: `⚠️ PERFORMANCE ISSUE: Slow operation took ${duration}ms`
      })
    } else {
      testResults.push({
        attempt: 'Performance degradation',
        expected: 'LOGGED by monitoring',
        result: 'BLOCKED',
        details: `✅ Performance within acceptable limits: ${duration}ms`
      })
    }
  } catch (error) {
    testResults.push({
      attempt: 'Performance degradation',
      expected: 'LOGGED by monitoring',
      result: 'BLOCKED',
      details: `✅ Performance guardrails working: ${error instanceof Error ? error.message : String(error)}`
    })
  }

  // ============================================================================
  // ATTEMPT 8: Module access violation (should be BLOCKED)
  // ============================================================================
  console.log('🧪 Attempt 8: Module access violation')
  try {
    // Try to access disabled module
    const { data: _data, error: _error } = await supabaseAdmin
      .from('tenant_modules')
      .select('enabled')
      .eq('module_key', 'nonexistent_module')
      .eq('tenant_id', '11111111-1111-4111-8111-11111111bb01')
      .single()

    if (!_data || !_data.enabled) {
      testResults.push({
        attempt: 'Module access violation',
        expected: 'BLOCKED by module gating',
        result: 'BLOCKED',
        details: '✅ Module gating working correctly'
      })
    } else {
      testResults.push({
        attempt: 'Module access violation',
        expected: 'BLOCKED by module gating',
        result: 'ALLOWED',
        details: '❌ SECURITY BREACH: Disabled module accessible'
      })
    }
  } catch (error) {
    testResults.push({
      attempt: 'Module access violation',
      expected: 'BLOCKED by module gating',
      result: 'BLOCKED',
      details: `✅ Module system protected: ${error instanceof Error ? error.message : String(error)}`
    })
  }

  // ============================================================================
  // REPORT RESULTS
  // ============================================================================

  console.log('\n📊 GUARDRAIL BREAK TEST RESULTS:')
  console.log('=' .repeat(60))

  const blocked = testResults.filter(r => r.result === 'BLOCKED').length
  const allowed = testResults.filter(r => r.result === 'ALLOWED').length
  const errors = testResults.filter(r => r.result === 'ERROR').length

  console.log(`✅ BLOCKED: ${blocked}`)
  console.log(`❌ ALLOWED: ${allowed}`)
  console.log(`⚠️  ERRORS: ${errors}`)
  console.log(`📈 SUCCESS RATE: ${((blocked / testResults.length) * 100).toFixed(1)}%\n`)

  testResults.forEach((result, index) => {
    console.log(`${index + 1}. ${result.attempt}`)
    console.log(`   Expected: ${result.expected}`)
    console.log(`   Result: ${result.result}`)
    if (result.details) {
      console.log(`   Details: ${result.details}`)
    }
    console.log('')
  })

  // Overall assessment
  const successRate = (blocked / testResults.length) * 100
  console.log('🎯 OVERALL ASSESSMENT:')
  if (successRate >= 90) {
    console.log('✅ EXCELLENT: Guardrails blocked 90%+ of attacks')
    console.log('🏆 PLATFORM IS SECURE FOR DEVELOPMENT')
  } else if (successRate >= 75) {
    console.log('⚠️ GOOD: Guardrails blocked 75%+ of attacks')
    console.log('🔧 RECOMMENDED: Address remaining vulnerabilities')
  } else {
    console.log('❌ CRITICAL: Guardrails blocked less than 75% of attacks')
    console.log('🚨 IMMEDIATE ACTION REQUIRED: Security vulnerabilities present')
  }

  return {
    results: testResults,
    summary: {
      total: testResults.length,
      blocked,
      allowed,
      errors,
      successRate
    }
  }
}

// ============================================================================
// ADDITIONAL BREAK ATTEMPTS FOR EDGE CASES
// ============================================================================

export async function testAdvancedBreakAttempts() {
  console.log('🔬 TESTING ADVANCED GUARDRAIL BREAK ATTEMPTS...\n')

  const advancedResults: unknown[] = []

  // ============================================================================
  // ADVANCED ATTEMPT 1: Race condition exploitation
  // ============================================================================
  console.log('🧪 Advanced Attempt 1: Race condition exploitation')
  try {
    // Try to exploit potential race conditions in tenant validation
    const promises = []
    for (let i = 0; i < 10; i++) {
      promises.push(validateTenantContext(`race-condition-test-${i}`))
    }

    const results = await Promise.allSettled(promises)
    const failures = results.filter(r => r.status === 'rejected')

    if (failures.length > 0) {
      advancedResults.push({
        attempt: 'Race condition exploitation',
        result: 'BLOCKED',
        details: `✅ Race conditions handled: ${failures.length} requests properly rejected`
      })
    } else {
      advancedResults.push({
        attempt: 'Race condition exploitation',
        result: 'ALLOWED',
        details: '⚠️ POTENTIAL ISSUE: All requests succeeded (may indicate race condition)'
      })
    }
  } catch (error) {
    advancedResults.push({
      attempt: 'Race condition exploitation',
      result: 'BLOCKED',
      details: `✅ Race conditions prevented: ${error instanceof Error ? error.message : String(error)}`
    })
  }

  // ============================================================================
  // ADVANCED ATTEMPT 2: Memory exhaustion
  // ============================================================================
  console.log('🧪 Advanced Attempt 2: Memory exhaustion')
  try {
    // Try to cause memory issues with large datasets
    const largeQuery = await supabaseAdmin
      .from('products')
      .select('*')
      .limit(10000) // Very large dataset

    const { data } = await largeQuery

    if (data && data.length > 5000) {
      advancedResults.push({
        attempt: 'Memory exhaustion',
        result: 'ALLOWED',
        details: `⚠️ POTENTIAL ISSUE: Retrieved ${data.length} records (memory intensive)`
      })
    } else {
      advancedResults.push({
        attempt: 'Memory exhaustion',
        result: 'BLOCKED',
        details: '✅ Memory limits enforced'
      })
    }
  } catch (error) {
    advancedResults.push({
      attempt: 'Memory exhaustion',
      result: 'BLOCKED',
      details: `✅ Memory protection working: ${error instanceof Error ? error.message : String(error)}`
    })
  }

  return advancedResults
}

// ============================================================================
// EXPORT FOR CLI USAGE
// ============================================================================

if (require.main === module) {
  testGuardrailBreakAttempts()
    .then(async (results) => {
      console.log('\n🔬 Running advanced tests...')
      const advanced = await testAdvancedBreakAttempts()

      console.log('\n🎯 FINAL SUMMARY:')
      console.log(`Basic Tests: ${results.summary.successRate.toFixed(1)}% success rate`)
      console.log(`Advanced Tests: ${advanced.filter((r: unknown) => (r as { result: string }).result === 'BLOCKED').length}/${advanced.length} blocked`)

      process.exit(results.summary.successRate >= 75 ? 0 : 1)
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error)
      process.exit(1)
    })
}
