# Debug: Order Details 404 Issue

## Problem
Clicking "View Details" in admin orders list shows 404 page.

## Possible Causes & Solutions

### 1. Development Server Cache (Most Likely)
**Cause:** Next.js hasn't picked up the new/modified route

**Solution:**
```bash
# Stop the dev server (Ctrl+C)
# Delete .next folder
rm -rf .next

# Restart
npm run dev
```

Or on Windows:
```bash
# Stop the dev server (Ctrl+C)
# Delete .next folder
rmdir /s /q .next

# Restart
npm run dev
```

### 2. Check the URL
When you click "View Details", what URL shows in the browser?

**Expected:** `/admin/orders/[some-uuid]`
**Example:** `/admin/orders/123e4567-e89b-12d3-a456-426614174000`

If the URL is different, that's the issue.

### 3. Verify File Exists
Check that this file exists:
```
src/app/(admin)/admin/orders/[id]/page.tsx
```

**Status:** ✅ File exists (verified)

### 4. Check Order ID Format
The link uses `order.id` which should be a UUID.

**In OrderTable.tsx line 305:**
```typescript
<Link href={`/admin/orders/${order.id}`}>
  View Details
</Link>
```

**Verify in browser console:**
```javascript
// On the orders list page, open console and run:
console.log(document.querySelector('a[href*="/admin/orders/"]').href)
```

This will show you the actual URL being generated.

### 5. Production vs Local
**Are you testing in:**
- [ ] Local development (`npm run dev`)
- [ ] Production (deployed)

**If production:**
- The route file might not be deployed
- Check Vercel deployment logs
- Verify the file is in the git repository

### 6. Route Group Issue
The route is inside `(admin)` group. Verify the structure:

```
src/app/
  (admin)/
    admin/
      orders/
        [id]/
          page.tsx  ← Should be here
        page.tsx
        OrderTable.tsx
```

**Status:** ✅ Structure is correct (verified)

### 7. TypeScript/Build Errors
Check for build errors:

```bash
npm run build
```

If there are TypeScript errors in the order details page, it won't be built.

## Quick Fix Steps

### Step 1: Restart Dev Server
```bash
# Stop server (Ctrl+C)
rm -rf .next
npm run dev
```

### Step 2: Test the Route Directly
Go directly to a test URL:
```
http://localhost:3000/admin/orders/test-id-123
```

**Expected:** Should show the order details page (or "Order not found" if ID doesn't exist)
**If 404:** Route file isn't being recognized

### Step 3: Check Console
Open browser console on the orders list page and check for errors.

### Step 4: Verify Link
Hover over "View Details" link and check the URL in bottom-left of browser.

**Should show:** `http://localhost:3000/admin/orders/[uuid]`

## If Still Not Working

### Check Next.js Version
```bash
npm list next
```

If using Next.js 15, the `params` should be a Promise (which it is ✅).

### Check for Conflicting Routes
Search for other files that might conflict:

```bash
# In project root
find src/app -name "*orders*" -type f
```

Look for any files that might be catching the route before it reaches `[id]/page.tsx`.

### Enable Next.js Debug Mode
```bash
# In package.json, change dev script to:
"dev": "next dev --debug"
```

Then restart and check terminal output when navigating to the order details page.

## Test Checklist

- [ ] Restarted dev server
- [ ] Deleted .next folder
- [ ] Checked URL in browser
- [ ] Tested direct URL access
- [ ] Checked browser console for errors
- [ ] Verified file exists at correct path
- [ ] Checked for TypeScript errors
- [ ] Tested in incognito mode (rules out browser cache)

## Expected Behavior

1. Click "View Details" on any order
2. URL changes to `/admin/orders/[order-id]`
3. Page shows order details with:
   - Order number
   - Customer email
   - Order status
   - Product list
   - Download Invoice button

## Current File Status

✅ `src/app/(admin)/admin/orders/[id]/page.tsx` - EXISTS
✅ Export is correct (`export default async function`)
✅ Params handling is correct (Promise in Next.js 15)
✅ Route structure is correct

## Most Likely Solution

**90% chance it's the dev server cache.**

Just restart your dev server:
```bash
Ctrl+C
npm run dev
```

Then try clicking "View Details" again!

---

**If this doesn't work, share:**
1. The exact URL you see when you get 404
2. Any console errors
3. Whether you're in local or production


---

## ✅ DATA FLOW ANALYSIS COMPLETE

**Question:** Where do order details come from - Database or PhonePe?

**Answer:** Order details come from the **DATABASE**, not from PhonePe.

### Complete Explanation

See `Senlysh/ORDER_DATA_FLOW_EXPLAINED.md` for detailed documentation including:

1. **Checkout Flow** - How orders are created in database with `pending` status
2. **Payment Flow** - How PhonePe processes payment (only knows amount & status)
3. **Webhook Flow** - How PhonePe webhook updates order status to `paid`
4. **Display Flow** - How order details page fetches everything from database
5. **Data Flow Diagram** - Visual representation of the entire process

### Key Points

- ✅ Orders are created in YOUR database during checkout
- ✅ Order items (products, quantities, prices) are stored in database
- ✅ PhonePe only handles payment processing
- ✅ PhonePe webhook updates order status after payment
- ✅ Order details page reads 100% from database
- ✅ Invoice PDF is generated from database data

### Database Tables Used

- `orders` - Order metadata, totals, status, customer info
- `order_items` - Products, quantities, prices
- `products` - Product names, SKUs, images
- `wallet_ledger` - Wallet transactions
- `coupon_usage` - Coupon redemptions

### Files Involved

1. **Order Creation:** `src/app/api/checkout/route.ts`
2. **Payment Webhook:** `src/app/api/webhooks/phonepe/route.ts`
3. **Admin Details:** `src/app/(admin)/admin/orders/[id]/page.tsx`
4. **Customer Details:** `src/app/(site)/orders/[orderId]/page.tsx`
5. **Invoice PDF:** `src/app/api/orders/[orderId]/invoice/route.ts`

---

**Created:** 2026-03-04
**Updated:** 2026-03-04 (Added data flow analysis)
