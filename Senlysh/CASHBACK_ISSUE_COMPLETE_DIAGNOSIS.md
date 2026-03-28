# Cashback Not Working - Complete Diagnosis & Fix

## 🔴 THE PROBLEMS FOUND

Your ₹850 order has **TWO critical issues** preventing cashback:

### Issue #1: No Customer ID ❌
```
Order: phonepe_1e4c9aa7_1770360308865_jblabsfac
Customer ID: NULL
```
**Impact**: Cashback service cannot identify which customer to credit.

### Issue #2: No Order Items ❌
```
Order ID: 0b088f8b-4fe4-4409-9056-85778dbf8320
Order Items: 0
```
**Impact**: Cannot calculate profit/cashback without knowing what was purchased.

## 🔍 ROOT CAUSE

Your checkout flow has bugs in the order creation process:

1. **Customer ID not captured** during checkout
2. **Order items not being saved** to database
3. Order gets created but is incomplete

This means:
- ❌ No way to know WHO to credit cashback to
- ❌ No way to calculate HOW MUCH cashback (need cost prices from items)
- ❌ Cashback processing fails silently

## ✅ THE FIX

### Step 1: Fix Checkout to Capture Customer ID

**File**: `src/app/api/checkout/route.ts`

The issue is here - order is created WITHOUT customer_id:

```typescript
// CURRENT CODE (BROKEN):
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
    // ❌ customer_id is MISSING!
  })

// Then tries to update later (but this might fail)
if (body.customerId) {
  await supabaseAdmin
    .from('orders')
    .update({ customer_id: body.customerId })
    .eq('id', order.id)
}
```

**FIX**: Include customer_id in the initial insert:

```typescript
// Get customer ID first
let customerId = body.customerId

if (!customerId && customerEmail) {
  // Try to find customer by email
  const { data: customer } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('email', customerEmail)
    .eq('tenant_id', tenantId)
    .single()
  
  if (customer) {
    customerId = customer.id
  }
}

// Create order WITH customer_id
const { data: orderData, error: orderError } = await supabaseAdmin
  .from('orders')
  .insert({
    order_number: orderId,
    tenant_id: tenantId,
    customer_id: customerId, // ✅ Include from the start
    status: 'pending',
    total_cents: totalAfterDiscount,
    payment_provider: 'phonepe',
    email: customerEmail,
    currency: 'INR'
  })
```

### Step 2: Fix Order Items Not Being Saved

**File**: `src/app/api/checkout/route.ts` (around line 200)

Check if this code is actually running:

```typescript
// Persist order items
const items = body.items || [];
if (Array.isArray(items) && items.length > 0) {
  const itemsPayload = items.map((it) => ({
    tenant_id: tenantId,
    order_id: order.id,  // ← Make sure order.id exists!
    product_id: it.productId,
    quantity: it.quantity,
    unit_price_cents: it.unitPriceCents ?? 0,
    total_price_cents: (it.unitPriceCents ?? 0) * it.quantity,
    tax_cents: body.totals ? Math.round((body.totals.taxCents / Math.max(items.length, 1))) : undefined,
  }));
  
  const { error: itemsError } = await supabaseAdmin
    .from('order_items')
    .insert(itemsPayload);
  
  if (itemsError) {
    console.error('❌ Failed to insert order items:', itemsError)
    // Don't fail silently - this is critical!
  } else {
    console.log(`✅ Inserted ${items.length} order items`)
  }
}
```

**Add logging** to see what's happening:

```typescript
console.log('[checkout] Creating order items:', {
  orderIdExists: !!order?.id,
  itemsCount: items?.length || 0,
  items: items
})
```

### Step 3: Require Login for Checkout

**File**: `src/app/(site)/checkout/page.tsx`

Add authentication check:

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
      // Redirect to login
      router.push('/senlysh/login?redirect=/checkout')
    }
  }, [isCustomer, loading, router])
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
  }
  
  if (!isCustomer) {
    return null // Will redirect
  }
  
  // Rest of checkout component...
}
```

## 🧪 TESTING THE FIX

After implementing the fixes:

1. **Clear your cart** and add items again
2. **Log in** as a customer
3. **Go to checkout**
4. **Complete payment**
5. **Check the order** in database:
   ```sql
   SELECT 
     order_number,
     customer_id,
     total_cents,
     (SELECT COUNT(*) FROM order_items WHERE order_id = orders.id) as item_count
   FROM orders
   WHERE order_number = 'your_order_number';
   ```
6. **Verify**:
   - ✅ customer_id is NOT NULL
   - ✅ item_count > 0
   - ✅ Cashback appears in wallet

## 📊 WHY YOUR CURRENT ORDERS HAVE NO CASHBACK

Looking at all your recent orders:

```
1. phonepe_1e4c9aa7_1770360992463_l76nb0uqj - ₹850 - pending - NO customer_id
2. phonepe_1e4c9aa7_1770360979905_o67e28edy - ₹850 - pending - NO customer_id
3. phonepe_1e4c9aa7_1770360308865_jblabsfac - ₹850 - fulfilled - NO customer_id, NO items
4. phonepe_1e4c9aa7_1770360300883_wd2yf0ktu - ₹850 - pending - NO customer_id
```

**All orders are missing customer_id**, which means:
- Cashback cannot be processed
- Orders are essentially "guest" orders
- No way to link them to your account

## 🔧 CANNOT FIX EXISTING ORDERS

Unfortunately, the ₹850 order **cannot be fixed** because:
1. ❌ No order items saved (we don't know what was purchased)
2. ❌ Cannot calculate cost price without items
3. ❌ Cannot calculate profit/cashback

**The order is incomplete and cannot be recovered.**

## ✅ SOLUTION GOING FORWARD

1. **Implement the fixes above** to prevent this in future
2. **Test with a new order** (even a small ₹10 test order)
3. **Verify** customer_id and items are saved
4. **Confirm** cashback is credited

## 🎯 QUICK TEST CHECKLIST

After deploying fixes:

- [ ] User must be logged in to access checkout
- [ ] Checkout sends customer_id to backend
- [ ] Order created with customer_id (not NULL)
- [ ] Order items are saved to database
- [ ] Payment completion triggers cashback
- [ ] Cashback appears in wallet
- [ ] Wallet transaction shows "CASHBACK" source

## 📝 SUMMARY

**Problem**: Orders created without customer_id and without order items

**Root Cause**: Checkout flow bugs - not capturing customer info and not saving items

**Solution**: 
1. Require login for checkout
2. Capture customer_id during order creation
3. Ensure order items are saved
4. Add logging to catch failures

**Result**: Future orders will have complete data and cashback will process automatically!

---

**Note**: The existing ₹850 orders cannot be fixed because they have no items. You'll need to place a new test order to verify the fixes work.
