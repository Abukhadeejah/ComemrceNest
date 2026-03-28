# Cashback Not Working - ROOT CAUSE & FIX

## 🔴 THE PROBLEM

**Symptom**: Completed ₹850 order shows as "paid" but no cashback credited to wallet.

**Root Cause**: Orders are being created **WITHOUT customer_id**, so cashback processing cannot identify which customer to credit.

## 🔍 DIAGNOSIS RESULTS

### Orders Found:
```
Order: phonepe_1e4c9aa7_1770360308865_jblabsfac
Total: ₹850.00
Status: fulfilled
Customer ID: N/A  ← THIS IS THE PROBLEM!
```

### Why This Breaks Cashback:
1. ✅ Order created successfully
2. ✅ Payment completed (status: fulfilled)
3. ❌ **customer_id is NULL** - cashback service cannot process
4. ❌ No cashback transaction created
5. ❌ No wallet credit

## 🎯 ROOT CAUSE

The checkout flow is not capturing the customer_id when creating orders. Looking at your checkout code:

**File**: `src/app/api/checkout/route.ts`

```typescript
// Order is created WITHOUT customer_id initially
const { data: orderData, error: orderError } = await supabaseAdmin
  .from('orders')
  .insert({
    order_number: orderId,
    tenant_id: tenantId,
    status: 'pending',
    total_cents: totalAfterDiscount,
    payment_provider: 'phonepe',
    email: customerEmail,
    currency: 'INR'
    // ❌ customer_id is MISSING here!
  })

// Then it tries to update with customer_id later
if (body.customerId) {
  await supabaseAdmin
    .from('orders')
    .update({
      customer_id: body.customerId,  // ← This update might be failing
      // ...
    })
    .eq('id', order.id)
}
```

**The Issue**: The `body.customerId` is either:
1. Not being sent from the frontend
2. Being sent but the update is failing silently
3. User is not logged in during checkout

## ✅ THE FIX

### Option 1: Ensure Customer is Logged In (Recommended)

**File**: `src/app/(site)/checkout/page.tsx`

Add authentication check at the top of checkout:

```typescript
'use client'

import { useCustomerAuth } from '@/hooks/useCustomerAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function CheckoutPage() {
  const { isCustomer, user, loading } = useCustomerAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!loading && !isCustomer) {
      // Redirect to login if not authenticated
      router.push('/senlysh/login?redirect=/checkout')
    }
  }, [isCustomer, loading, router])
  
  if (loading) {
    return <div>Loading...</div>
  }
  
  if (!isCustomer) {
    return null // Will redirect
  }
  
  // Rest of checkout component...
}
```

### Option 2: Get Customer ID from Session

**File**: `src/app/api/checkout/route.ts`

Add customer lookup at the beginning:

```typescript
export async function POST(request: NextRequest) {
  try {
    const resolvedTenantId = await resolveTenantIdFromRequest()
    const body = await request.json()
    
    // ... existing code ...
    
    // ADD THIS: Get customer ID from authenticated session
    let customerId = body.customerId
    
    if (!customerId) {
      // Try to get from session/auth
      const { data: { user } } = await supabaseAdmin.auth.getUser()
      
      if (user) {
        // Look up customer by user_id
        const { data: customer } = await supabaseAdmin
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .eq('tenant_id', tenantId)
          .single()
        
        if (customer) {
          customerId = customer.id
          console.log('[checkout] Found customer from session:', customerId)
        }
      }
    }
    
    if (!customerId) {
      console.warn('[checkout] No customer ID available - cashback will not be processed')
    }
    
    // ... rest of code, but use customerId variable ...
  }
}
```

### Option 3: Fix Frontend to Send Customer ID

**File**: `src/app/(site)/checkout/page.tsx`

Ensure customer ID is sent in checkout request:

```typescript
const { isCustomer, user } = useCustomerAuth()

// When submitting checkout
const checkoutData = {
  tenantKey: 'senlysh',
  mode: 'live',
  customer: {
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    // ...
  },
  items: cartItems,
  customerId: user?.id, // ← ADD THIS
  // ...
}

const response = await fetch('/api/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(checkoutData)
})
```

## 🔧 IMMEDIATE FIX FOR EXISTING ORDERS

For the ₹850 order that's already completed, you can manually process cashback:

**File**: `fix-existing-order-cashback.js`

```javascript
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixOrderCashback() {
  const orderNumber = 'phonepe_1e4c9aa7_1770360308865_jblabsfac' // Your ₹850 order
  const customerEmail = 'shariqrahman03@gmail.com' // The customer who placed the order
  
  console.log('Fixing cashback for order:', orderNumber)
  
  // 1. Get order
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .single()
  
  if (!order) {
    console.error('Order not found')
    return
  }
  
  // 2. Find customer by email
  const { data: customer } = await supabase
    .from('customers')
    .select('id, user_id, tenant_id')
    .eq('email', customerEmail)
    .eq('tenant_id', order.tenant_id)
    .single()
  
  if (!customer) {
    console.error('Customer not found')
    return
  }
  
  console.log('Found customer:', customer.id)
  
  // 3. Update order with customer_id
  await supabase
    .from('orders')
    .update({ customer_id: customer.id })
    .eq('id', order.id)
  
  console.log('Updated order with customer_id')
  
  // 4. Get order items with cost prices
  const { data: orderItems } = await supabase
    .from('order_items')
    .select(`
      *,
      products (
        cost_price_cents
      )
    `)
    .eq('order_id', order.id)
  
  let totalCostPrice = 0
  orderItems.forEach(item => {
    const costPrice = item.products?.cost_price_cents || 0
    totalCostPrice += costPrice * item.quantity
  })
  
  console.log('Total cost price:', totalCostPrice / 100)
  
  // 5. Check membership
  const { data: membership } = await supabase
    .from('memberships')
    .select('*')
    .eq('customer_id', customer.id)
    .eq('tenant_id', order.tenant_id)
    .eq('status', 'ACTIVE')
    .gte('valid_until', new Date().toISOString())
    .single()
  
  if (!membership) {
    console.error('Customer has no active membership - cannot process cashback')
    return
  }
  
  console.log('Customer has active membership:', membership.membership_type)
  
  // 6. Calculate cashback
  const cashPaid = order.total_cents
  const profit = cashPaid - totalCostPrice
  const profitPct = (profit / totalCostPrice) * 100
  const cashbackPct = profitPct * 0.05 // 5% of profit
  const cashbackAmount = Math.floor((cashPaid * cashbackPct) / 100)
  
  console.log('Cashback calculation:')
  console.log('  Profit:', profit / 100, `(${profitPct.toFixed(2)}%)`)
  console.log('  Cashback %:', cashbackPct.toFixed(2))
  console.log('  Cashback amount:', cashbackAmount / 100)
  
  // 7. Record cashback transaction
  const { data: txn } = await supabase
    .from('cashback_transactions')
    .insert({
      tenant_id: order.tenant_id,
      order_id: order.id,
      customer_id: customer.id,
      wallet_used_cents: 0,
      cash_paid_cents: cashPaid,
      profit_pct: profitPct,
      cashback_pct: cashbackPct,
      cashback_amount_cents: cashbackAmount
    })
    .select()
    .single()
  
  console.log('Created cashback transaction:', txn.id)
  
  // 8. Credit to wallet
  const { data: walletAccount } = await supabase
    .from('wallet_accounts')
    .select('id')
    .eq('customer_id', customer.id)
    .eq('tenant_id', order.tenant_id)
    .single()
  
  if (!walletAccount) {
    console.error('No wallet account found')
    return
  }
  
  await supabase
    .from('wallet_ledger')
    .insert({
      account_id: walletAccount.id,
      tenant_id: order.tenant_id,
      entry_type: 'credit',
      amount_cents: cashbackAmount,
      currency: 'INR',
      source_key: 'CASHBACK',
      reference_id: order.id,
      metadata: {
        description: 'Cashback earned from order (manually processed)',
        order_id: order.id
      }
    })
  
  console.log('✅ Cashback credited to wallet!')
  console.log(`Customer should now see ₹${cashbackAmount / 100} in their wallet`)
}

fixOrderCashback()
```

## 🧪 TESTING

After implementing the fix:

1. **Test New Order**:
   - Log in as customer
   - Place a new order
   - Complete payment
   - Check that order has customer_id
   - Verify cashback is credited

2. **Check Logs**:
   ```
   [checkout] Found customer from session: xxx-xxx-xxx
   [verify-payment] Cashback processed: ₹X.XX
   ```

## 📊 PREVENTION

To prevent this in the future:

1. **Require Login for Checkout**: Don't allow guest checkout if you want cashback
2. **Add Validation**: Check customer_id before creating order
3. **Add Logging**: Log when customer_id is missing
4. **Add UI Warning**: Show message if user is not logged in

## ✅ SUMMARY

**Problem**: Orders created without customer_id → Cashback cannot be processed

**Solution**: 
1. Ensure users are logged in during checkout
2. Pass customer_id from frontend to backend
3. Validate customer_id exists before creating order
4. For existing orders, manually link customer and process cashback

**Result**: Future orders will have customer_id and cashback will process automatically!
