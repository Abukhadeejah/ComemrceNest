# 🔒 IDEMPOTENCY PROTECTION - DEPLOYMENT GUIDE

**CRITICAL**: This prevents duplicate cashback credits, emails, and order updates when payment gateways retry webhooks. Must be deployed before production.

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### 1. Database Migration

Run the migration in Supabase SQL Editor:

```bash
# Copy the contents of this file:
migrations/add_idempotency_protection.sql

# Paste into Supabase SQL Editor and execute
```

**Expected Output:**
```
✅ Column post_payment_processed added successfully
✅ Index idx_orders_post_payment_processed created successfully
```

**Verification:**
```sql
-- Check column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name = 'post_payment_processed';

-- Should return:
-- post_payment_processed | boolean | false
```

### 2. Type Definitions

✅ **Already Done**: `src/types/order.ts` created with Order interface including `post_payment_processed: boolean`

**Verification:**
```bash
# Check for TypeScript errors
npm run build

# Should complete without errors related to Order type
```

### 3. Code Changes

✅ **Already Done**: All webhook handlers updated with idempotency protection

**Files Modified:**
- `src/app/api/webhooks/phonepe/route.ts` - PhonePe webhook
- `src/app/api/orders/[orderId]/verify-payment/route.ts` - Fallback verification
- `src/app/api/webhooks/razorpay/route.ts` - Razorpay webhook

**Verification:**
```bash
# Search for idempotency checks
grep -r "post_payment_processed" src/app/api/webhooks/
grep -r "Already processed" src/app/api/webhooks/

# Should find multiple matches in webhook files
```

---

## 🧪 TESTING PROCEDURE

### Step 1: Clear Next.js Cache

```bash
# Windows
Remove-Item -Recurse -Force .next

# Linux/Mac
rm -rf .next
```

### Step 2: Restart Dev Server

```bash
npm run dev
```

### Step 3: Run Idempotency Test

```bash
node scripts/test-idempotency.js
```

**Expected Output:**
```
═══════════════════════════════════════════════════════════
🧪 IDEMPOTENCY TEST
═══════════════════════════════════════════════════════════

📦 Setting up test order...
✅ Customer found: abc123-def456-...
✅ Test order created: xyz789-...
✅ Order items created

🚀 Simulating 3 rapid webhook calls...

🔔 Webhook Call #1
────────────────────────────────────────────────────────────
Status: 200 OK
Duration: 245ms
Response: {"success":true}

🔔 Webhook Call #2
────────────────────────────────────────────────────────────
Status: 200 OK
Duration: 89ms
Response: {"success":true,"message":"Already processed"}

🔔 Webhook Call #3
────────────────────────────────────────────────────────────
Status: 200 OK
Duration: 76ms
Response: {"success":true,"message":"Already processed"}

📊 Checking order state...
────────────────────────────────────────────────────────────
Status: paid
Post-payment processed: true
Cashback amount: ₹37.50
Cashback transactions: 1
Wallet credits: 1
Total credited: ₹37.50

═══════════════════════════════════════════════════════════
📋 TEST RESULTS
═══════════════════════════════════════════════════════════

✅ Test 1: All webhook calls returned 200
   Call 1: 200, Call 2: 200, Call 3: 200

✅ Test 2: Order marked as post_payment_processed
   post_payment_processed = true

✅ Test 3: Only ONE cashback transaction created
   Found 1 transaction(s)

✅ Test 4: Only ONE wallet credit created
   Found 1 credit(s)

✅ Test 5: Order status is "paid"
   Status: paid

═══════════════════════════════════════════════════════════
🎉 ALL TESTS PASSED! Idempotency is working correctly!
═══════════════════════════════════════════════════════════
```

### Step 4: Manual Test with Real Order

1. Place a real test order (₹100-500)
2. Complete payment with PhonePe test mode
3. Check server logs for:
   ```
   [PhonePe Webhook] Data: { merchantTransactionId: '...', state: 'COMPLETED' }
   [PhonePe Webhook] ✅ Processed successfully: phonepe_...
   ```
4. Manually trigger webhook again (simulate retry):
   ```bash
   curl -X POST http://localhost:3000/api/webhooks/phonepe \
     -H "Content-Type: application/json" \
     -d '{"merchantTransactionId":"phonepe_...", "state":"COMPLETED"}'
   ```
5. Check logs for:
   ```
   [PhonePe Webhook] ⚠️ Already processed, skipping: phonepe_...
   ```
6. Verify wallet balance unchanged (no duplicate credit)

---

## 🔍 VERIFICATION CHECKLIST

After deployment, verify these conditions:

### Database Level
```sql
-- ✅ Check column exists
SELECT COUNT(*) FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'post_payment_processed';
-- Should return: 1

-- ✅ Check index exists
SELECT COUNT(*) FROM pg_indexes 
WHERE tablename = 'orders' AND indexname = 'idx_orders_post_payment_processed';
-- Should return: 1

-- ✅ Check default value
SELECT column_default FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'post_payment_processed';
-- Should return: false

-- ✅ Check existing orders have false value
SELECT COUNT(*) FROM orders WHERE post_payment_processed IS NULL;
-- Should return: 0 (all should be false, not null)
```

### Application Level

✅ **1. Webhook Returns 200 on Duplicate Calls**
```bash
# First call - processes
curl -X POST http://localhost:3000/api/webhooks/phonepe \
  -H "Content-Type: application/json" \
  -d '{"merchantTransactionId":"test_order_123", "state":"COMPLETED"}'
# Response: {"success":true}

# Second call - skips processing
curl -X POST http://localhost:3000/api/webhooks/phonepe \
  -H "Content-Type: application/json" \
  -d '{"merchantTransactionId":"test_order_123", "state":"COMPLETED"}'
# Response: {"success":true,"message":"Already processed"}
```

✅ **2. Logs Show "Already processed" Message**
```
[PhonePe Webhook] ⚠️ Already processed, skipping: test_order_123
```

✅ **3. Wallet Balance Unchanged on Duplicate Calls**
```bash
# Check wallet balance before and after duplicate webhook
node verify-latest-order.js
# Wallet credit count should be 1, not 2 or 3
```

✅ **4. Cashback Transaction Created Only Once**
```sql
SELECT COUNT(*) FROM cashback_transactions WHERE order_id = '[order-id]';
-- Should return: 1 (not 2 or 3)
```

✅ **5. Email Sent Only Once**
```
# Check email logs or email service dashboard
# Should show only 1 email sent per order
```

✅ **6. Test Script Passes**
```bash
node scripts/test-idempotency.js
# All 5 tests should pass
```

✅ **7. No TypeScript Errors**
```bash
npm run build
# Should complete without errors
```

---

## 📊 MONITORING & LOGGING

### Key Log Messages to Monitor

**Success (First Call):**
```
[PhonePe Webhook] Data: { merchantTransactionId: 'phonepe_...', state: 'COMPLETED' }
[PhonePe Webhook] Order phonepe_... updated to status: paid
[PhonePe Webhook] ✅ Processed successfully: phonepe_...
```

**Success (Duplicate Call):**
```
[PhonePe Webhook] Data: { merchantTransactionId: 'phonepe_...', state: 'COMPLETED' }
[PhonePe Webhook] ⚠️ Already processed, skipping: phonepe_...
```

**Error (Order Not Found):**
```
[PhonePe Webhook] Order not found: phonepe_... [error details]
```

**Error (Processing Failed):**
```
[PhonePe Webhook] ❌ Post-payment processing failed: [error details]
```

### Metrics to Track

1. **Duplicate Webhook Rate**: Count of "Already processed" logs
2. **Processing Time**: Duration from webhook receipt to completion
3. **Error Rate**: Failed processing attempts
4. **Cashback Accuracy**: Verify no duplicate credits

---

## 🚨 ROLLBACK PROCEDURE

If issues occur after deployment:

### 1. Immediate Rollback (Code Only)

```bash
# Revert webhook files to previous version
git checkout HEAD~1 src/app/api/webhooks/phonepe/route.ts
git checkout HEAD~1 src/app/api/orders/[orderId]/verify-payment/route.ts
git checkout HEAD~1 src/app/api/webhooks/razorpay/route.ts

# Clear cache and restart
Remove-Item -Recurse -Force .next
npm run dev
```

### 2. Database Rollback (If Needed)

```sql
-- Remove idempotency column (only if absolutely necessary)
ALTER TABLE orders DROP COLUMN IF EXISTS post_payment_processed;
DROP INDEX IF EXISTS idx_orders_post_payment_processed;
DROP INDEX IF EXISTS idx_orders_order_number;
```

**⚠️ WARNING**: Only rollback database if critical issues occur. The column is harmless even if code is rolled back.

---

## 🎯 PRODUCTION DEPLOYMENT

### Pre-Production Checklist

- [ ] All tests pass in development
- [ ] Manual testing completed with real orders
- [ ] Logs reviewed for correct behavior
- [ ] Team notified of deployment
- [ ] Rollback procedure documented
- [ ] Monitoring alerts configured

### Deployment Steps

1. **Deploy Database Migration**
   ```sql
   -- Run in production Supabase
   -- Copy from: migrations/add_idempotency_protection.sql
   ```

2. **Deploy Code Changes**
   ```bash
   # Build production bundle
   npm run build
   
   # Deploy to Vercel/hosting
   vercel --prod
   # or
   git push origin main
   ```

3. **Verify Deployment**
   ```bash
   # Check production logs
   vercel logs --prod
   
   # Look for successful webhook processing
   # Look for "Already processed" on retries
   ```

4. **Monitor First Few Orders**
   - Watch for duplicate cashback credits
   - Check webhook retry behavior
   - Verify email sending
   - Monitor error rates

### Post-Deployment Monitoring

**First 24 Hours:**
- Check every order for correct cashback
- Monitor webhook logs for errors
- Verify no duplicate credits
- Check customer wallet balances

**First Week:**
- Review duplicate webhook rate
- Analyze processing times
- Check for any edge cases
- Gather customer feedback

---

## 📞 SUPPORT & TROUBLESHOOTING

### Common Issues

**Issue 1: "Column does not exist" error**
```
Solution: Run database migration again
Check: SELECT * FROM information_schema.columns WHERE table_name = 'orders';
```

**Issue 2: TypeScript errors about Order type**
```
Solution: Restart TypeScript server
Check: npm run build
```

**Issue 3: Webhooks still processing duplicates**
```
Solution: Clear .next cache and restart
Check: Look for "🔥 RECOMPILED CODE RUNNING" in logs
```

**Issue 4: Test script fails**
```
Solution: Check database connection and customer exists
Check: Verify TEST_CUSTOMER_EMAIL in script
```

### Getting Help

1. Check logs for error messages
2. Run verification SQL queries
3. Run test script for diagnostics
4. Review this guide's troubleshooting section
5. Check `Senlysh/COMPLETE_CASHBACK_FIX.md` for related issues

---

## 📚 RELATED DOCUMENTATION

- `migrations/add_idempotency_protection.sql` - Database migration
- `src/types/order.ts` - Type definitions
- `scripts/test-idempotency.js` - Testing script
- `Senlysh/COMPLETE_CASHBACK_FIX.md` - Cashback system documentation
- `RESTART_AND_TEST.md` - Quick testing guide

---

**Last Updated**: February 6, 2026  
**Author**: Kiro AI Assistant  
**Status**: Ready for Deployment  
**Priority**: CRITICAL - Deploy before production launch
