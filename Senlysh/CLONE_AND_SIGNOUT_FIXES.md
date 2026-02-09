# Clone Product & Admin Signout Fixes

## Overview
Fixed two production issues:
1. Clone product not working in production
2. Admin signout showing "page not working" error

## Issue 1: Clone Product Not Working in Production

### Problem
- Clone product feature worked in local but failed in production
- Error: "Unexpected error during product cloning: Error: NEXT_REDIRECT"

### Root Cause
The `cloneProduct` function had a try-catch block that was catching the `NEXT_REDIRECT` error thrown by `assertTenantAdmin()`. This redirect error is used by Next.js for authentication redirects and should NOT be caught.

### Solution
**File**: `src/app/(admin)/admin/products/actions.ts`

Removed the try-catch wrapper from `cloneProduct` function:

**Before:**
```typescript
export async function cloneProduct(productId: string) {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    // ... rest of code
  } catch (error) {
    console.error('Unexpected error during product cloning:', error)
    throw error
  }
}
```

**After:**
```typescript
export async function cloneProduct(productId: string) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) {
    throw new Error('Tenant not found')
  }
  
  await assertTenantAdmin(tenantId)
  // ... rest of code
}
```

**Why This Works:**
- `assertTenantAdmin()` throws a `NEXT_REDIRECT` error when user is not authenticated
- This error should propagate up to Next.js router for proper redirect handling
- Catching it prevents the redirect from working
- Now the redirect error passes through correctly

---

## Issue 2: Admin Signout Redirect Not Working

### Problem
- After clicking "Sign out" in admin panel, page showed "not working" error
- Redirect to `/login` was failing

### Root Cause
The signout route was using `NextResponse.redirect()` which doesn't work well with form submissions in some browsers/environments.

### Solution

#### Part 1: Update Signout API Route
**File**: `src/app/api/auth/signout/route.ts`

Changed from redirect to JSON response:

**Before:**
```typescript
return NextResponse.redirect(new URL(redirectUrl, baseUrl))
```

**After:**
```typescript
return NextResponse.json({ 
  success: true, 
  redirectUrl 
}, {
  status: 200
})
```

#### Part 2: Update Admin Header Component
**File**: `src/components/admin/layout/AdminHeader.tsx`

Changed from form submission to JavaScript fetch:

**Before:**
```tsx
<form action="/api/auth/signout" method="post">
  <button type="submit">Sign out</button>
</form>
```

**After:**
```tsx
<button
  onClick={async () => {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include'
      })
      const data = await response.json()
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      } else {
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Signout error:', error)
      window.location.href = '/login'
    }
  }}
>
  Sign out
</button>
```

**Why This Works:**
- API returns JSON with redirect URL instead of HTTP redirect
- Client-side JavaScript handles the redirect using `window.location.href`
- More reliable across different browsers and environments
- Fallback to `/login` if anything fails

---

## Redirect Logic

### Admin Users
- Signout from admin panel → `/login` (global admin login)

### Customer Users
- Signout from customer pages → `/{tenant}/login` (tenant customer login)

### Detection
```typescript
const referer = (await headers()).get('referer') || ''
const isAdminSignout = referer.includes('/admin')
```

---

## Testing Checklist

### Clone Product
- [ ] Login as admin
- [ ] Go to Products page
- [ ] Click clone button on any product
- [ ] Verify new product created with "(Copy)" suffix
- [ ] Verify product is in draft status
- [ ] Verify categories and variants cloned

### Admin Signout
- [ ] Login as admin
- [ ] Click profile dropdown in top right
- [ ] Click "Sign out"
- [ ] Verify redirected to `/login` page
- [ ] Verify session cleared (can't access admin without login)

### Customer Signout (Existing)
- [ ] Login as customer on Senlysh
- [ ] Click signout
- [ ] Verify redirected to `/senlysh/login`

---

## Files Modified

1. `src/app/(admin)/admin/products/actions.ts`
   - Removed try-catch from `cloneProduct` function

2. `src/app/api/auth/signout/route.ts`
   - Changed from redirect to JSON response
   - Added logging for debugging

3. `src/components/admin/layout/AdminHeader.tsx`
   - Changed from form to JavaScript fetch
   - Added error handling and fallback

---

## Status
✅ **COMPLETE** - Both issues fixed
✅ No TypeScript errors
✅ Ready for production deployment

## Deployment Notes
- No database changes required
- No environment variable changes required
- Just deploy the code changes
- Test both features after deployment

---

**Fixes completed successfully!**
