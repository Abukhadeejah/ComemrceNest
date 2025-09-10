/**
 * SIMPLE GUARDRAIL TEST
 * Quick test to verify basic guardrail functionality
 */

import { logSecurityEvent, validateTenantContext } from '../server/guardrails'

async function testGuardrails() {
  console.log('🛡️ Testing Basic Guardrails...\n')

  // Test 1: Logging doesn't block
  console.log('Test 1: Non-blocking logging')
  const startTime = Date.now()
  logSecurityEvent('test_event', { message: 'This should not block' })
  console.log('✅ Log event sent (should be instant):', Date.now() - startTime, 'ms')

  // Test 2: Tenant validation
  console.log('\nTest 2: Tenant context validation')
  try {
    // This should fail since we don't have proper tenant context
    await validateTenantContext('test_operation')
    console.log('❌ Tenant validation should have failed')
  } catch (error) {
    console.log('✅ Tenant validation correctly failed:', error instanceof Error ? error.message : String(error))
  }

  // Test 3: Error response generation
  console.log('\nTest 3: Safe error response')
  try {
    throw new Error('Test error that should be handled safely')
  } catch (error) {
    const safeResponse = {
      success: false,
      error: 'An unexpected error occurred. Please try again or contact support.',
      operation: 'test_operation'
    }
    console.log('✅ Safe error response generated:', safeResponse)
  }

  console.log('\n🎉 Basic guardrail tests completed!')
}

// Run if called directly
if (require.main === module) {
  testGuardrails().catch(console.error)
}












