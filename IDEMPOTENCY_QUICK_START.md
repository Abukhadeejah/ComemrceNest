# 🚀 IDEMPOTENCY PROTECTION - QUICK START

**5-Minute Setup Guide**

---

## ⚡ WHAT IS THIS?

Prevents duplicate cashback credits when payment gateways retry webhooks.

**Without this**: Customer gets ₹50 cashback 3 times = ₹150 (money loss!)  
**With this**: Customer gets ₹50 cashback once = ₹50 (correct!)

---

## 🎯 3 STEPS TO DEPLOY

### Step 1: Database (2 minutes)

1. Open Supabase SQL Editor
2. Copy contents of `migrations/add_idempotency_protection.sql`
3. Paste and execute
4. Look for: `✅ Column post_payment_processed added successfully`

### Step 2: Restart Server (1 minute)

```bash
Remove-Item -Recurse -Force .next
npm run dev
```

### Step 3: Test (2 minutes)

```bash
node scripts/test-idempotency.js
```

**Expected**: `🎉 ALL TESTS PASSED!`

---

## ✅ VERIFICATION

### Quick Check

```sql
-- In Supabase SQL Editor
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'post_payment_processed';
```

**Should return**: `post_payment_processed`

### Place Test Order

1. Place order (₹100-500)
2. Complete payment
3. Check logs for:
   ```
   [PhonePe Webhook] ✅ Processed successfully: phonepe_...
   ```
4. Manually trigger webhook again:
   ```bash
   curl -X POST http://localhost:3000/api/webhooks/phonepe \
     -H "Content-Type: application/json" \
     -d '{"merchantTransactionId":"phonepe_...", "state":"COMPLETED"}'
   ```
5. Check logs for:
   ```
   [PhonePe Webhook] ⚠️ Already processed, skipping: phonepe_...
   ```
6. Verify wallet balance unchanged ✅

---

## 🔍 WHAT TO LOOK FOR

### ✅ Good Signs

```
[PhonePe Webhook] Data: { merchantTransactionId: '...', state: 'COMPLETED' }
[PhonePe Webhook] ✅ Processed successfully: phonepe_...
```

On duplicate call:
```
[PhonePe Webhook] ⚠️ Already processed, skipping: phonepe_...
```

### ❌ Bad Signs

```
[PhonePe Webhook] ❌ Failed to set post_payment_processed flag
```

Or duplicate cashback credits in database.

---

## 🚨 TROUBLESHOOTING

### Problem: "Column does not exist"
**Solution**: Run database migration again

### Problem: Test script fails
**Solution**: Check customer email exists in database

### Problem: Still seeing duplicates
**Solution**: Clear `.next` cache and restart

---

## 📚 FULL DOCUMENTATION

- **Complete Guide**: `IDEMPOTENCY_DEPLOYMENT_GUIDE.md`
- **Technical Details**: `Senlysh/IDEMPOTENCY_PROTECTION_COMPLETE.md`
- **Test Script**: `scripts/test-idempotency.js`
- **Migration**: `migrations/add_idempotency_protection.sql`

---

## 🎯 SUCCESS = ALL GREEN

✅ Database migration applied  
✅ Server restarted  
✅ Test script passes  
✅ Logs show "Already processed"  
✅ No duplicate cashback  

**Ready for production!** 🚀
