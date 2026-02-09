# 🚀 RESTART AND TEST - Quick Guide

## What Was Fixed?

Three critical bugs preventing cashback from working:

1. **Order items not saving** - Fixed column name (`subtotal_cents`)
2. **Cashback not crediting** - Fixed by ensuring order items save correctly
3. **Duplicate guest orders** - Fixed by always sending customer ID

## Root Cause

Next.js was serving **cached compiled code** from `.next` folder. Despite fixing the source files, the old buggy code kept running.

## The Fix

✅ Cleared `.next` folder (forces recompilation)  
✅ Added verification logs to confirm new code is running  
✅ All code fixes already applied  

---

## 🎯 WHAT YOU NEED TO DO NOW

### Step 1: Restart Dev Server

```bash
npm run dev
```

### Step 2: Place a Test Order

1. Go to http://localhost:3000/senlysh/products
2. Add a product to cart (₹100-500 range)
3. Go to checkout
4. **Make sure you're logged in** as `shariqrahman03@gmail.com`
5. Complete the order with PhonePe test mode

### Step 3: Check Server Logs

Look for this message in your terminal:

```
[PhonePe] 🔥 RECOMPILED CODE RUNNING - v2.0 🔥
```

**If you see this** → New code is running! ✅  
**If you DON'T see this** → Old cached code still running ❌

### Step 4: Verify Order

Run the verification script:

```bash
node verify-latest-order.js
```

**Expected Output:**
```
✅ Customer ID: [uuid]
✅ Found 2 items
✅ Payment split correct
✅ Type: FREE
✅ Cashback: ₹18.00 (7.5%)
✅ Credited: ₹18.00

🎉 ALL CHECKS PASSED!
```

---

## 🔍 What to Look For

### In Server Logs (Terminal)

```
[PhonePe] 🔥 RECOMPILED CODE RUNNING - v2.0 🔥
[PhonePe] Preparing to insert order items: { itemsCount: 2, ... }
[PhonePe] Inserting order items payload: [...]
[PhonePe] ✅ Successfully inserted 2 order items
```

### In Verification Script

```
✓ CHECK 1: Customer ID
   ✅ Customer ID: abc123-def456-...

✓ CHECK 2: Order Items
   ✅ Found 2 items:
      1. Product Name
         Qty: 1, Price: ₹240.00, Cost: ₹150.00

✓ CHECK 5: Cashback Transaction
   ✅ Cashback: ₹18.00 (7.5%)

✓ CHECK 6: Wallet Credit
   ✅ Credited: ₹18.00
```

---

## ⚠️ If It Still Doesn't Work

### Problem: Don't see "🔥 RECOMPILED CODE RUNNING" log

**Solution**: Try a production build to force recompilation:

```bash
npm run build
npm run dev
```

### Problem: Order items still not saving

**Check**:
1. Is `order.id` present in logs?
2. Are items being sent from frontend?
3. Check for database errors in logs

### Problem: Cashback not credited

**Check**:
1. Do order items exist? (Run verification script)
2. Does user have active membership?
3. Check webhook logs for errors

---

## 📊 Quick Verification Commands

```bash
# Check latest order status
node verify-latest-order.js

# Check for guest orders (should be 0 new ones)
node cleanup-guest-orders.js

# Check database directly
# (Use Supabase dashboard or SQL client)
SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;
SELECT * FROM order_items WHERE order_id = '[order-id]';
SELECT * FROM cashback_transactions ORDER BY created_at DESC LIMIT 5;
```

---

## 🎉 Success Criteria

Your order is working correctly when:

- ✅ Server logs show "🔥 RECOMPILED CODE RUNNING - v2.0 🔥"
- ✅ Server logs show "✅ Successfully inserted X order items"
- ✅ Verification script shows customer ID
- ✅ Verification script shows order items with prices
- ✅ Verification script shows cashback transaction
- ✅ Verification script shows wallet credit
- ✅ No new guest@example.com orders created

---

## 📖 Full Documentation

See `Senlysh/COMPLETE_CASHBACK_FIX.md` for:
- Detailed root cause analysis
- Complete code changes
- Full payment flow diagram
- Troubleshooting guide

---

**Ready?** Restart your dev server and place a test order! 🚀
