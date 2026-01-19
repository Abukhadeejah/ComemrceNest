#!/usr/bin/env node
/**
 * CASHBACK SYSTEM TEST RUNNER
 * 
 * Quick test script for cashback functionality
 * Usage: node scripts/test-cashback.js
 */

const { calculateCashback, getCashbackSlab, validatePaymentSplit } = require('../src/lib/cashback/cashbackEngine')

console.log('\n🎯 CASHBACK SYSTEM TEST RUNNER\n')
console.log('=' .repeat(60))

// Test scenarios
const scenarios = [
  {
    name: 'Full Cash Payment',
    input: {
      totalSalePrice: 100,
      totalPurchasePrice: 70,
      walletUsed: 0,
      cashPaid: 100
    },
    expected: {
      profitPct: 42.86,
      cashbackPct: 15,
      cashbackAmount: 15.0
    }
  },
  {
    name: 'Partial Wallet (₹10 wallet + ₹90 cash)',
    input: {
      totalSalePrice: 100,
      totalPurchasePrice: 70,
      walletUsed: 10,
      cashPaid: 90
    },
    expected: {
      profitPct: 42.86,
      cashbackPct: 15,
      cashbackAmount: 13.5
    }
  },
  {
    name: 'Full Wallet Payment (Zero Cashback)',
    input: {
      totalSalePrice: 100,
      totalPurchasePrice: 70,
      walletUsed: 100,
      cashPaid: 0
    },
    expected: {
      profitPct: 42.86,
      cashbackPct: 15,
      cashbackAmount: 0
    }
  },
  {
    name: 'Edge Case: 30.9% Profit (Below Threshold)',
    input: {
      totalSalePrice: 130.9,
      totalPurchasePrice: 100,
      walletUsed: 0,
      cashPaid: 130.9
    },
    expected: {
      profitPct: 30.9,
      cashbackPct: 0,
      cashbackAmount: 0
    }
  },
  {
    name: 'Edge Case: 31% Profit (First Slab)',
    input: {
      totalSalePrice: 131,
      totalPurchasePrice: 100,
      walletUsed: 0,
      cashPaid: 131
    },
    expected: {
      profitPct: 31.0,
      cashbackPct: 10,
      cashbackAmount: 13.1
    }
  }
]

let passCount = 0
let failCount = 0

scenarios.forEach((scenario, index) => {
  console.log(`\n${index + 1}. ${scenario.name}`)
  console.log('-'.repeat(60))
  
  try {
    const result = calculateCashback(scenario.input)
    
    const profitMatch = Math.abs(result.profitPct - scenario.expected.profitPct) < 0.1
    const cashbackPctMatch = result.cashbackPct === scenario.expected.cashbackPct
    const cashbackAmountMatch = Math.abs(result.cashbackAmount - scenario.expected.cashbackAmount) < 0.01
    
    console.log(`Input:`)
    console.log(`  Sale: ₹${scenario.input.totalSalePrice}`)
    console.log(`  Cost: ₹${scenario.input.totalPurchasePrice}`)
    console.log(`  Wallet: ₹${scenario.input.walletUsed}`)
    console.log(`  Cash: ₹${scenario.input.cashPaid}`)
    
    console.log(`\nResult:`)
    console.log(`  Profit: ${result.profitPct}% ${profitMatch ? '✅' : '❌'}`)
    console.log(`  Cashback Rate: ${result.cashbackPct}% ${cashbackPctMatch ? '✅' : '❌'}`)
    console.log(`  Cashback Amount: ₹${result.cashbackAmount} ${cashbackAmountMatch ? '✅' : '❌'}`)
    
    if (profitMatch && cashbackPctMatch && cashbackAmountMatch) {
      console.log(`\n✅ PASS`)
      passCount++
    } else {
      console.log(`\n❌ FAIL`)
      console.log(`Expected:`)
      console.log(`  Profit: ${scenario.expected.profitPct}%`)
      console.log(`  Cashback Rate: ${scenario.expected.cashbackPct}%`)
      console.log(`  Cashback Amount: ₹${scenario.expected.cashbackAmount}`)
      failCount++
    }
  } catch (error) {
    console.log(`\n❌ ERROR: ${error.message}`)
    failCount++
  }
})

// Summary
console.log('\n' + '='.repeat(60))
console.log(`\n📊 TEST SUMMARY\n`)
console.log(`Total Tests: ${scenarios.length}`)
console.log(`✅ Passed: ${passCount}`)
console.log(`❌ Failed: ${failCount}`)
console.log(`Success Rate: ${Math.round((passCount / scenarios.length) * 100)}%\n`)

// Exit with appropriate code
process.exit(failCount > 0 ? 1 : 0)
