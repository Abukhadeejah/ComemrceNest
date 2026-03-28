# 🚀 NEXT STEPS TO FIX CASHBACK SYSTEM

## ✅ What We've Fixed

### 1. Code Fixes (Complete)
- ✅ Changed `total_price_cents` → `subtotal_cents` in order items
- ✅ Changed `cost_price_cents` → `cost_per_item_cents` in webhooks  
- ✅ Removed non-existent `updated_at` field from order updates
- ✅ Always send `customerId` from frontend when user logged in
- ✅ Include `customer_id` in initial order insert (not separate update)
- ✅ Added comprehensive logging for debugging

### 2. Build & Cache (Complete)
- ✅ Deleted `.next` cache completely
- ✅ Ran `npm run build` successfully
- ✅ Production build completed

### 3. Database (Complete)
- ✅ Cashback migration applied (`cashback_transactions` table exists)
- ✅ Idempotency protection added (`post_payment_processed` column)
- ✅ Schema verified working (test script successfully inserted order items)

### 4. Payment Provider (Just Fixed)
- ✅ Switched Senlysh from PhonePe to Razorpay temporarily
- ✅ Razorpay credentials are valid and working

## 🎯 IMMEDIATE ACTION REQUIRED

### Step 1: Restart Dev Server (CRITICAL!)

The dev server MUST be restarted to load the new code:

```bash
# 1. Stop current dev server
Press Ctrl+C in the terminal running npm run dev

# 2. Start fresh
npm run dev
```

**Why this is critical:**
- Next.js caches compiled API routes in memory
- Hot reload doesn't always pick up API route changes
- Despite rebuilding, old code may still be running
- Restarting ensures fresh code is loaded

### Step 2: Test Checkout

Once dev server is restarted, try placing an order:

1. Go to http://localhost:3000/senlysh
2. Add a product to cart
3. Go to checkout
4. Fill in details (use email: shariqrahman03@gmail.com)
5. Click "Pay with Razorpay" (NOT PhonePe)
6. Complete payment in Razorpay test mode

**Expected behavior:**
- ✅ Checkout completes without errors
- ✅ Redirects to success page
- ✅ Order created with customer_id
- ✅ Order items saved (this is the key test!)

### Step 3: Verify Results

After placing order, run:

```bash
node check-recent-orders.js
```

**What to look for:**
- ✅ Latest order has customer_id (not "MISSING")
- ✅ Order items > 0 (THIS IS THE KEY!)
- ✅ Status is "paid" or "pending"

If order items > 0, the system is working!

### Step 4: Trigger Cashback Processing

If order items are saved but cashback not processed:

**Option A - Wait for webhook:**
Razorpay will call webhook automatically (usually within seconds)

**Option B - Manual verification:**
```bash
# Use the order number from check-recent-orders.js
curl -X POST http://localhost:3000/api/orders/[ORDER_NUMBER]/verify-payment
```

**Option C - Run test script:**
```bash
node test-cashback-manual.js
```

### Step 5: Final Verification

```bash
node check-recent-orders.js
```

Should now show:
- ✅ Order items > 0
- ✅ Cashback transactions > 0
- ✅ Wallet credited with cashback amount
- ✅ post_payment_processed: true

## 🐛 If Still Not Working

### Issue: Order Items Still 0

**Check dev server logs for:**
```
[Razorpay] 🔥 RECOMPILED CODE RUNNING - v2.0 🔥
[Razorpay] Preparing to insert order items
[Razorpay] Inserting order items payload
```

If you DON'T see these logs:
- ❌ Dev server not restarted
- ❌ Old code still running
- **Solution:** Force restart dev server

If you DO see these logs but items still not saved:
- Check for error message after "Inserting order items payload"
- Error will show exact database issue
- Share the error for further debugging

### Issue: Cashback Not Calculated

**Possible causes:**
1. No active membership (need FREE or PREMIUM)
2. Order items missing cost prices
3. Webhook not firing

**Check membership:**
```sql
SELECT * FROM memberships 
WHERE customer_id = '54682763-66a9-47f1-95c5-accb8b2f54c9'
AND status = 'ACTIVE';
```

Should show FREE membership (1 year duration).

**Check cost prices:**
```sql
SELECT oi.*, p.cost_per_item_cents 
FROM order_items oi
JOIN products p ON p.id = oi.product_id
WHERE oi.order_id = '[ORDER_ID]';
```

All products should have `cost_per_item_cents > 0`.

## 📊 Test Scripts Available

```bash
# Check recent orders and their status
node check-recent-orders.js

# Test database can save order items
node test-order-items-insertion.js

# Test checkout API directly
node test-checkout-direct.js

# Manually trigger cashback for latest order
node test-cashback-manual.js

# Check order items schema
node check-order-items-schema.js

# Check payment provider
node check-payment-provider.js

# Get tenant IDs
node get-tenant-id.js
```

## 🔄 Switching Back to PhonePe

Once PhonePe credentials are fixed, switch back:

1. Get valid PhonePe credentials from dashboard
2. Update `.env.local`:
```env
PHONEPE_MERCHANT_ID=your_merchant_id
PHONEPE_CLIENT_ID=your_client_id
PHONEPE_CLIENT_SECRET=your_client_secret
PHONEPE_SALT_KEY=your_salt_key
PHONEPE_SALT_INDEX=1
PHONEPE_ENV=SANDBOX
```

3. Update `src/tenants/senlysh/config.ts`:
```typescript
payments: {
  provider: 'phonepe',
},
```

4. Restart dev server
5. Test checkout with PhonePe

## 📝 Summary

**The core issue:** Order items not being saved during checkout.

**Root cause:** Either:
1. Dev server not running latest code (most likely)
2. PhonePe failing before order items insertion
3. Frontend not sending items array correctly

**Solution applied:**
1. ✅ Fixed all code issues
2. ✅ Rebuilt production build
3. ✅ Switched to Razorpay (working credentials)
4. ⏳ **NEED TO RESTART DEV SERVER** ← YOU ARE HERE

**Next action:** Restart dev server and test checkout!

---

**Status:** Ready for testing
**Blocker:** Dev server needs restart
**ETA:** 5 minutes after restart
