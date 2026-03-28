# Cashback System - Current Status

## 🔴 CRITICAL ISSUE: Order Items Not Being Saved

### Problem
When users complete checkout, orders are created but **order items are NOT being saved**. This prevents cashback calculation because we need cost prices from order items.

### Root Cause Analysis

#### ✅ CONFIRMED WORKING:
1. **Database schema is correct** - `order_items` table accepts inserts with `subtotal_cents` column
2. **Code has been fixed** - Changed from `total_price_cents` to `subtotal_cents` 
3. **Customer ID is being captured** - Fixed to always send when user logged in
4. **Production build completed** - `.next` cache cleared and rebuilt
5. **Direct database insert works** - Test script successfully saved order items

#### ❌ STILL FAILING:
1. **PhonePe payment fails with "Unauthorized"** - Invalid/expired credentials
2. **Order items not saved during checkout** - Despite code fixes
3. **Dev server may not be running latest code** - Need to restart

### Current Test Results

**Latest 10 orders (from `check-recent-orders.js`):**
- ✅ Customer IDs captured correctly
- ❌ ALL have 0 order items
- ❌ ALL have 0 cashback transactions
- ❌ ALL have `post_payment_processed: false`

**Database test (from `test-order-items-insertion.js`):**
- ✅ Successfully inserted order items directly to database
- ✅ Schema is correct and working

## 🔧 Fixes Applied

### 1. Code Fixes (✅ Complete)
- Changed `total_price_cents` → `subtotal_cents` in checkout route
- Changed `cost_price_cents` → `cost_per_item_cents` in webhooks
- Removed `updated_at` field from order updates
- Always send `customerId` from frontend when logged in
- Include `customer_id` in initial order insert

### 2. Build & Cache (✅ Complete)
- Deleted `.next` cache completely
- Ran `npm run build` successfully
- Production build completed without errors

### 3. Database (✅ Complete)
- Cashback migration applied
- Idempotency protection added
- Schema verified working

## 🚨 BLOCKING ISSUES

### Issue #1: PhonePe Credentials Invalid
**Error:** `PhonePe SDK payment failed: Unauthorized`

**Cause:** The PhonePe credentials in `.env.local` are test/sandbox credentials that appear to be invalid or expired.

**Impact:** Cannot complete checkout to test if order items are saved.

**Solutions:**
1. **Option A:** Get valid PhonePe sandbox credentials from PhonePe dashboard
2. **Option B:** Switch to Razorpay for testing (already configured)
3. **Option C:** Create mock payment endpoint for testing

### Issue #2: Dev Server Not Running Latest Code
**Symptom:** Despite code fixes and rebuild, order items still not saving.

**Possible Causes:**
- Dev server needs restart to load new build
- Hot reload not picking up API route changes
- Old compiled code still in memory

**Solution:** Restart dev server completely

## 📋 IMMEDIATE ACTION PLAN

### Step 1: Restart Dev Server
```bash
# Stop current dev server (Ctrl+C)
# Clear cache again
Remove-Item -Recurse -Force .next
# Start fresh
npm run dev
```

### Step 2: Test with Script
```bash
# Make sure dev server is running on localhost:3000
node test-checkout-direct.js
```

This will:
- Call checkout API directly
- Show exact error message
- Check if order items are saved
- Bypass PhonePe if it fails

### Step 3: If PhonePe Still Fails

**Option A - Use Razorpay:**
Update tenant payment provider in database:
```sql
UPDATE tenant_settings 
SET payment_provider = 'razorpay' 
WHERE tenant_id = '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c';
```

**Option B - Mock Payment:**
Create a test endpoint that bypasses payment gateway:
- Creates order
- Saves order items
- Marks as paid
- Processes cashback

### Step 4: Verify Order Items Saved
```bash
node check-recent-orders.js
```

Should show:
- ✅ Order items > 0
- ✅ Customer ID present
- ✅ Cashback transaction created (after webhook/verification)

## 🎯 SUCCESS CRITERIA

When system is working correctly:

1. **Checkout completes** without errors
2. **Order created** with customer_id
3. **Order items saved** (count > 0)
4. **Payment processed** (via PhonePe/Razorpay)
5. **Webhook fires** (or fallback verification runs)
6. **Cashback calculated** based on order items cost prices
7. **Wallet credited** with cashback amount
8. **Idempotency flag set** to prevent duplicates

## 📝 Files Modified

### API Routes
- `src/app/api/checkout/route.ts` - Order items insertion
- `src/app/api/webhooks/phonepe/route.ts` - Cashback processing
- `src/app/api/orders/[orderId]/verify-payment/route.ts` - Fallback verification

### Frontend
- `src/app/(site)/checkout/page.tsx` - Always send customerId

### Config
- `.env.local` - Added PHONEPE_SALT_KEY placeholder

### Test Scripts
- `test-order-items-insertion.js` - ✅ Proves database works
- `test-checkout-direct.js` - Tests full checkout flow
- `check-recent-orders.js` - Verifies results

## 🔍 Debugging Commands

```bash
# Check recent orders
node check-recent-orders.js

# Test database directly
node test-order-items-insertion.js

# Test checkout API
node test-checkout-direct.js

# Check order items schema
node check-order-items-schema.js
```

## 📞 Next Steps

1. **RESTART DEV SERVER** - Most critical step
2. **Run test-checkout-direct.js** - See actual error
3. **Fix PhonePe credentials OR switch to Razorpay**
4. **Verify order items saved**
5. **Test cashback processing**

---

**Last Updated:** February 9, 2026
**Status:** Waiting for dev server restart and PhonePe credentials fix
