# Debugging Blank Order Details Page

## Issue
Order details page shows blank when clicking "View Details"

## Possible Causes

### 1. JavaScript Error
**Check:** Open browser console (F12) and look for red errors

**Common errors:**
- Hydration mismatch
- Component rendering error
- Missing data causing crash

### 2. Layout Not Rendering
**Check:** Do you see the header/footer, or is it completely blank?

- **Completely blank:** Layout issue or tenant resolution failing
- **Header/footer visible:** Issue with page component

### 3. Database Query Failing
**Check:** Server logs for database errors

**Possible issues:**
- Order ID not found in database
- Tenant ID mismatch
- Database connection issue

### 4. Route Not Matching
**Check:** URL in browser address bar

**Expected format:**
```
https://www.senlysh.in/orders/[uuid]
```

**Example:**
```
https://www.senlysh.in/orders/123e4567-e89b-12d3-a456-426614174000
```

## Debug Steps

### Step 1: Check Browser Console
1. Open the blank page
2. Press F12 to open developer tools
3. Click "Console" tab
4. Look for red error messages
5. Share the error message

### Step 2: Check Network Tab
1. In developer tools, click "Network" tab
2. Refresh the page
3. Look for the page request
4. Check the status code:
   - **200:** Page loaded successfully (issue is in rendering)
   - **404:** Route not found
   - **500:** Server error
   - **Other:** Network or server issue

### Step 3: Check Server Logs
Look at your terminal where `npm run dev` is running:
- Any error messages?
- Any database query errors?
- Any "Order not found" logs?

### Step 4: Test with Direct URL
Try accessing an order directly by copying a UUID from your database:

1. Go to Supabase dashboard
2. Open `orders` table
3. Copy an `id` (UUID format)
4. Navigate to: `https://www.senlysh.in/orders/[paste-uuid-here]`

### Step 5: Check if Order Exists
In Supabase, run this query:

```sql
SELECT 
  id,
  order_number,
  status,
  tenant_id,
  created_at
FROM orders
WHERE tenant_id = '[your-tenant-id]'
ORDER BY created_at DESC
LIMIT 5;
```

Copy one of the `id` values and try accessing it.

## Quick Fixes to Try

### Fix 1: Clear Browser Cache
```
Ctrl + Shift + Delete (Windows)
Cmd + Shift + Delete (Mac)
```
Clear cache and reload

### Fix 2: Hard Refresh
```
Ctrl + F5 (Windows)
Cmd + Shift + R (Mac)
```

### Fix 3: Restart Dev Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Fix 4: Clear Next.js Cache
```bash
# Stop server
rm -rf .next
npm run dev
```

## Common Issues & Solutions

### Issue: "Tenant not found"
**Solution:** Check if you're accessing the correct domain
- Senlysh: `https://www.senlysh.in/orders/...`
- Bluebell: `https://www.bluebell.com/orders/...`

### Issue: "Order not found"
**Solution:** 
1. Verify the order ID exists in database
2. Check tenant_id matches
3. Try with order_number instead of UUID

### Issue: Blank page with no errors
**Solution:**
1. Check if layout is rendering
2. View page source (Ctrl+U) - is there HTML?
3. If no HTML, server-side rendering is failing

### Issue: Hydration error
**Solution:**
1. Check for date formatting issues
2. Check for conditional rendering mismatches
3. Ensure server and client render the same content

## Testing Checklist

- [ ] Browser console checked for errors
- [ ] Network tab checked for failed requests
- [ ] Server logs checked for errors
- [ ] Order ID verified in database
- [ ] Tenant ID matches
- [ ] Hard refresh attempted
- [ ] Dev server restarted
- [ ] .next folder cleared

## What to Share for Help

If still not working, share:

1. **Exact URL** you're trying to access
2. **Browser console errors** (screenshot or copy/paste)
3. **Network tab** status code for the page request
4. **Server logs** from terminal
5. **Page source** (Ctrl+U) - first 50 lines
6. **Does header/footer show?** Yes/No

## Temporary Workaround

If you need to see order details urgently, use the admin panel:
```
https://www.senlysh.in/admin/orders
```

Admin order details page uses a different route and should work.

---

**Created:** 2026-03-04
**Purpose:** Debug blank order details page issue
