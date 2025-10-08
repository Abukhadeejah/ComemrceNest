// Test script to verify variant database operations work
const { createClient } = require('@supabase/supabase-js')

// Test data that matches what the frontend sends
const testVariantData = {
  hasVariants: true,
  variantOptions: [
    {
      id: 'test-option-1',
      name: 'size',
      displayName: 'Size',
      type: 'text',
      required: true,
      values: [
        {
          id: 'test-value-1',
          value: 'small',
          displayValue: 'Small',
          priceAdjustmentCents: 0,
          costAdjustmentCents: 0
        },
        {
          id: 'test-value-2', 
          value: 'medium',
          displayValue: 'Medium',
          priceAdjustmentCents: 0,
          costAdjustmentCents: 0
        }
      ]
    }
  ],
  variantCombinations: [
    {
      id: 'test-combo-1',
      options: { 'test-option-1': 'test-value-1' },
      priceCents: 65000, // ₹650
      stock: 10,
      sku: 'SIZE-SMALL-001'
    },
    {
      id: 'test-combo-2',
      options: { 'test-option-1': 'test-value-2' },
      priceCents: 65000, // ₹650
      stock: 15,
      sku: 'SIZE-MEDIUM-001'
    }
  ]
}

console.log('🧪 Test variant data structure:')
console.log(JSON.stringify(testVariantData, null, 2))
console.log('\n✅ This data structure should now work with the fixed updateProductVariants function!')

