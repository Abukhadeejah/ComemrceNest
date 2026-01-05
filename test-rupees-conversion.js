// Test rupeesToCents conversion
const rupeesToCents = (rupees) => {
  if (!rupees || rupees.trim() === '') return 0

  const cleaned = rupees.replace(/[^\d.]/g, '')
  const numeric = Number.parseFloat(cleaned)

  if (!Number.isFinite(numeric) || numeric < 0) return 0

  // Fix to two decimals before scaling to avoid floating drift
  const normalized = Number(numeric.toFixed(2))
  const cents = Math.round(normalized * 100)

  if (cents > Number.MAX_SAFE_INTEGER) {
    console.warn('Price value too large, capping at safe integer limit')
    return Number.MAX_SAFE_INTEGER
  }

  return cents
}

// Test cases
const testCases = [
  { input: '300', expected: 30000 },
  { input: '299.90', expected: 29990 },
  { input: '100.01', expected: 10001 },
  { input: '0.50', expected: 50 },
  { input: '1', expected: 100 }
]

console.log('Testing rupeesToCents conversion:\n')
testCases.forEach(test => {
  const result = rupeesToCents(test.input)
  const pass = result === test.expected
  console.log(`Input: "${test.input}" => ${result} (expected ${test.expected}) ${pass ? '✓' : '✗ FAIL'}`)
})

// Additional debugging
console.log('\nDetailed trace for "300":')
const input = '300'
const cleaned = input.replace(/[^\d.]/g, '')
const numeric = Number.parseFloat(cleaned)
const normalized = Number(numeric.toFixed(2))
const cents = Math.round(normalized * 100)

console.log(`  cleaned: "${cleaned}"`)
console.log(`  numeric: ${numeric}`)
console.log(`  normalized: ${normalized}`)
console.log(`  normalized * 100: ${normalized * 100}`)
console.log(`  Math.round(normalized * 100): ${cents}`)
