# Deployment Checklist - Order Link Fix

## Pre-Deployment

- [x] All TypeScript errors resolved
- [x] Code changes tested locally
- [x] Documentation created
- [x] Backward compatibility ensured

## Files Changed (5 files)

1. ✅ `src/app/(site)/account/page.tsx`
2. ✅ `src/app/(site)/senlysh/my-account/SenlyshAccountDashboard.tsx`
3. ✅ `src/app/(site)/senlysh/orders/page.tsx`
4. ✅ `src/app/(admin)/admin/customers/[id]/page.tsx`
5. ✅ `src/app/(site)/orders/[orderId]/page.tsx`

## Deployment Steps

### 1. Commit Changes
```bash
git add .
git commit -m "Fix: Use database ID instead of PhonePe order_number in order links

- Updated all order detail links to use order.id (UUID)
- Enhanced order details page to support both ID and order_number
- Fixed invoice download links
- Maintained backward compatibility with old URLs
- Cleaner, provider-independent URLs"
```

### 2. Push to Repository
```bash
git push origin main
```

### 3. Deploy to Production
- If using Vercel: Automatic deployment on push
- If using manual deployment: Run build and deploy commands

### 4. Wait for Deployment
- Check deployment logs for any errors
- Verify build completed successfully

## Post-Deployment Testing

### Test 1: New Order Links (Database ID)
1. Go to customer account page: `https://www.senlysh.in/account`
2. Click "View Details" on any order
3. **Expected URL:** `https://www.senlysh.in/orders/[uuid]`
4. **Expected Result:** Order details page loads correctly
5. **Status:** [ ] Pass / [ ] Fail

### Test 2: Backward Compatibility (Old Links)
1. Find an old order URL with PhonePe format
2. Navigate to: `https://www.senlysh.in/orders/phonepe_[transaction_id]`
3. **Expected Result:** Order details page loads correctly
4. **Status:** [ ] Pass / [ ] Fail

### Test 3: Invoice Download (New Format)
1. On order details page with UUID URL
2. Click "Download Invoice"
3. **Expected:** PDF downloads successfully
4. **Status:** [ ] Pass / [ ] Fail

### Test 4: Admin Customer Orders
1. Go to admin customer details page
2. Click "Invoice" link on any order
3. **Expected:** PDF downloads successfully
4. **Status:** [ ] Pass / [ ] Fail

### Test 5: Senlysh Orders Page
1. Go to Senlysh orders page
2. Click "View Details" on any order
3. **Expected URL:** `https://www.senlysh.in/orders/[uuid]`
4. Click "Download Invoice"
5. **Expected:** PDF downloads successfully
6. **Status:** [ ] Pass / [ ] Fail

### Test 6: Admin Orders (Already Correct)
1. Go to admin orders page
2. Click "View Details" on any order
3. **Expected URL:** `https://www.senlysh.in/admin/orders/[uuid]`
4. **Expected Result:** Order details page loads correctly
5. **Status:** [ ] Pass / [ ] Fail

## Database Verification

### Check Order IDs
```sql
-- Get sample order to test with
SELECT 
  id,                    -- UUID (use this in new URLs)
  order_number,          -- PhonePe transaction ID (old URLs)
  status,
  total_cents,
  created_at
FROM orders
WHERE tenant_id = '[your-tenant-id]'
ORDER BY created_at DESC
LIMIT 5;
```

### Test Both URL Formats
```bash
# Test with database ID (new format)
curl https://www.senlysh.in/orders/[uuid-from-query]

# Test with order_number (old format - backward compatibility)
curl https://www.senlysh.in/orders/[order_number-from-query]
```

## Rollback Plan (If Needed)

If issues are found after deployment:

### Quick Rollback
```bash
# Revert the commit
git revert HEAD

# Push to trigger redeployment
git push origin main
```

### Manual Fix
If only specific links are broken:
1. Identify which file has the issue
2. Fix the specific link
3. Commit and push
4. Redeploy

## Success Criteria

- [ ] All new order links use database UUID
- [ ] Old PhonePe order_number URLs still work
- [ ] Invoice downloads work with UUID
- [ ] No 404 errors on order details pages
- [ ] No console errors in browser
- [ ] All order data displays correctly

## Known Issues / Limitations

### Checkout Success Page
- Still uses PhonePe `order_number` initially (from payment response)
- This is fine - order details page supports both formats
- Could be enhanced later to redirect to UUID format

### Email Links (If Any)
- If you send order confirmation emails with links, update those templates
- Use `order.id` instead of `order.order_number` in email templates

## Monitoring

### After Deployment, Monitor:

1. **Error Logs**
   - Check for 404 errors on `/orders/*` routes
   - Check for database query errors

2. **User Reports**
   - Watch for customer complaints about broken order links
   - Monitor support tickets

3. **Analytics**
   - Check page views for `/orders/[id]` route
   - Verify no drop in order details page views

## Documentation Updated

- [x] ORDER_LINK_FIX.md - Complete explanation
- [x] CURRENT_STATUS_2026-03-04.md - Status update
- [x] DEBUG_ORDER_DETAILS.md - Added data flow analysis
- [x] ORDER_DATA_FLOW_EXPLAINED.md - Complete order flow

## Contact

If issues arise after deployment:
1. Check deployment logs
2. Review browser console errors
3. Check database for order existence
4. Verify tenant_id is correct
5. Test with different order IDs

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Verification Completed:** [ ] Yes / [ ] No
**Issues Found:** [ ] None / [ ] See notes below

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________
