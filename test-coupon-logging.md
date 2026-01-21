# Coupon Page Logging Test

## What I Added

I've added comprehensive console logging to help identify the exact error when accessing the coupon page. The logs will appear in:

1. **Browser Console** (F12 → Console tab)
2. **Server Terminal** (where you run `npm run dev`)

## Log Prefixes

- 🎫 `[CouponsPage]` - Server-side coupon page component
- 🎫 `[CouponsPageContent]` - Client-side coupon content component  
- 🎫 `[API]` - Coupon API routes
- 🏢 `[TenantResolver]` - Tenant resolution logic
- 🔑 `[TenantKeyResolver]` - Tenant key to ID mapping
- 🔧 `[AdminModules]` - Module enablement checks

## Testing Steps

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open browser console:**
   - Press F12
   - Go to Console tab
   - Clear any existing logs

3. **Access the coupon page:**
   - Try: `http://localhost:3000/admin/coupons`
   - Or: `http://localhost:3000/senlysh/admin/coupons`
   - Or: `http://localhost:3000/bluebell/admin/coupons`

4. **Check both consoles:**
   - **Browser Console**: Look for client-side errors
   - **Terminal**: Look for server-side errors

## What to Look For

### ✅ Success Flow
You should see logs like:
```
🎫 [CouponsPage] Starting coupon page load...
🎫 [CouponsPage] Resolved tenant ID: 1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c
🔧 [AdminModules] ✅ Module coupons is enabled for tenant...
🎫 [CouponsPageContent] Component initializing...
🎫 [API] ✅ Returning coupons: 2
```

### ❌ Error Scenarios

**Authentication Error:**
```
🎫 [API] ❌ No user found, returning 401
```

**Tenant Resolution Error:**
```
🏢 [TenantResolver] ❌ No tenant found for key: undefined
🎫 [API] ❌ No tenant ID found, returning 403
```

**Module Disabled Error:**
```
🔧 [AdminModules] ❌ Module coupons is disabled for tenant...
🎫 [CouponsPage] ❌ Coupon module not enabled, showing disabled message
```

**Database Error:**
```
🎫 [API] ❌ Error fetching coupons: [error details]
```

## Report Back

When you test, please share:

1. **What URL did you try?**
2. **What do you see on the page?** (error message, blank page, etc.)
3. **Browser console logs** (copy the 🎫 prefixed messages)
4. **Server terminal logs** (copy the 🎫 prefixed messages)

This will help me identify exactly where the issue is occurring!